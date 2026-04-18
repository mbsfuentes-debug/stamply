/**
 * Utilidades de seguridad para los endpoints de IA en server.ts
 * Arquitectura Zero-Knowledge AI: PII nunca llega a la IA.
 */

import { createHash } from 'crypto';

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  ip: string,
  max = 10,
  windowMs = 60_000
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// ─── Cooldown mínimo entre llamadas (anti-loop) ───────────────────────────────

const lastCallStore = new Map<string, number>();

export function checkCooldown(
  ip: string,
  minMs = 2_000
): { allowed: boolean; waitMs: number } {
  const last = lastCallStore.get(ip) ?? 0;
  const wait = last + minMs - Date.now();
  if (wait > 0) return { allowed: false, waitMs: wait };
  lastCallStore.set(ip, Date.now());
  return { allowed: true, waitMs: 0 };
}

// ─── Validación de PDF ────────────────────────────────────────────────────────

export function validatePdfBase64(
  base64Data: string,
  maxBytes = 10 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!base64Data || typeof base64Data !== 'string') {
    return { valid: false, error: 'Se requiere un archivo en formato base64.' };
  }

  const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    return {
      valid: false,
      error: `El archivo supera el límite de ${maxBytes / 1024 / 1024}MB.`,
    };
  }

  // Búsqueda de magic bytes %PDF en los primeros 1024 bytes decodificados
  // Algunos PDFs judiciales tienen prefijos antes de %PDF
  const headerBuf = Buffer.from(base64Data.substring(0, 1368), 'base64'); // 1368 base64 ≈ 1024 bytes
  const isPdf = headerBuf.indexOf(Buffer.from('%PDF')) !== -1;

  if (!isPdf) {
    return { valid: false, error: 'El archivo no es un PDF válido.' };
  }

  return { valid: true };
}

// ─── PII Vault ────────────────────────────────────────────────────────────────
// Reemplaza RUTs con tokens antes de enviar a la IA.
// La IA nunca ve RUTs reales.

export interface PiiVault {
  tokens: Map<string, string>; // __RUT_N__ → RUT real
  sanitized: string;           // texto con tokens en lugar de RUTs
}

// Normaliza guiones Unicode antes de buscar RUTs (PDFs de tribunales usan –, —, etc.)
function normalizeHyphens(s: string): string {
  return s.replace(/[\u2010-\u2015\u2212\u00AD]/g, '-');
}

// Acepta RUT con o sin puntos, con o sin espacio alrededor del guión
const RUT_PATTERN = /\d{1,2}\.?\d{3}\.?\d{3}\s*-\s*[\dkK]/g;

export function buildPiiVault(texto: string): PiiVault {
  const tokens = new Map<string, string>();
  if (!texto) return { tokens, sanitized: texto };

  // Normalizar guiones Unicode antes de buscar RUTs
  const textoNorm = normalizeHyphens(texto);

  const seen = new Map<string, string>(); // rut normalizado → token
  let index = 0;

  // Construir el texto sanitizado aplicando el patrón sobre la versión normalizada,
  // pero conservando los offsets correctos para el texto original
  const sanitized = textoNorm.replace(RUT_PATTERN, (rut) => {
    if (!seen.has(rut)) {
      const token = `__RUT_${index++}__`;
      seen.set(rut, token);
      tokens.set(token, rut);
    }
    return seen.get(rut)!;
  });

  return { tokens, sanitized };
}

export function resolvePiiVault(text: string, vault: PiiVault): string {
  let result = text;
  for (const [token, value] of vault.tokens) {
    result = result.replaceAll(token, value);
  }
  return result;
}

// ─── Extracción de carátula ───────────────────────────────────────────────────
// Solo los primeros ~1500 chars son relevantes para identificar partes.
// Corta en la primera marca de "otro sí" o sección secundaria.

export function extractCaratula(texto: string, maxChars = 1500): string {
  if (!texto) return '';
  const markers = ['OTROSÍ', 'OTROSI', 'EN SUBSIDIO', 'PRIMER OTROSÍ', 'SEGUNDO OTROSÍ'];
  let cutPoint = Math.min(texto.length, maxChars);
  const upper = texto.toUpperCase();
  for (const marker of markers) {
    const idx = upper.indexOf(marker);
    if (idx > 100 && idx < cutPoint) cutPoint = idx;
  }
  return texto.substring(0, cutPoint).trim();
}

// ─── Fingerprint de documento ─────────────────────────────────────────────────
// SHA-256 de los primeros 4096 chars del base64 (identifica el doc sin almacenarlo)

export function fingerprintDoc(base64Data: string): string {
  return createHash('sha256').update(base64Data.substring(0, 4096)).digest('hex');
}

// ─── Caché de documentos procesados (24h TTL) ────────────────────────────────

interface FingerprintEntry {
  result: unknown;
  expiresAt: number;
}

const fingerprintCache = new Map<string, FingerprintEntry>();

export function clearFingerprintCache(): void {
  fingerprintCache.clear();
}

export function getFingerprintCache(hash: string): unknown | null {
  const entry = fingerprintCache.get(hash);
  if (!entry || Date.now() > entry.expiresAt) {
    fingerprintCache.delete(hash);
    return null;
  }
  return entry.result;
}

export function setFingerprintCache(
  hash: string,
  result: unknown,
  ttlMs = 24 * 60 * 60 * 1000
): void {
  fingerprintCache.set(hash, { result, expiresAt: Date.now() + ttlMs });
}

// ─── Tribunal extraction (regex, sin IA) ─────────────────────────────────────

const TRIBUNAL_PATTERNS = [
  /CORTE\s+SUPREMA/i,
  /CORTE\s+DE\s+APELACIONES\s+DE\s+[A-ZÁÉÍÓÚÑ\s]+/i,
  /\d+[°º\.]\s*(?:JUZGADO|JDO\.?)\s+(?:CIVIL|LABORAL|PENAL|DE\s+FAMILIA|DE\s+COBRANZA|DE\s+GARANTÍA|DE\s+LETRAS)\s+(?:DE\s+)?[A-ZÁÉÍÓÚÑ\s]+/i,
  /JUZGADO\s+(?:CIVIL|LABORAL|PENAL|DE\s+FAMILIA|DE\s+COBRANZA|DE\s+GARANTÍA|DE\s+LETRAS)\s+(?:DE\s+)?[A-ZÁÉÍÓÚÑ\s]+/i,
  /TRIBUNAL\s+(?:CIVIL|LABORAL|PENAL|DE\s+FAMILIA|DE\s+COBRANZA|DE\s+GARANTÍA)\s+(?:DE\s+)?[A-ZÁÉÍÓÚÑ\s]+/i,
];

export function extractTribunalFromText(texto: string): string {
  for (const pattern of TRIBUNAL_PATTERNS) {
    const match = texto.match(pattern);
    if (match) {
      // Limpiar espacios múltiples y cortar en el primer salto de línea
      return match[0].replace(/\s+/g, ' ').split('\n')[0].trim();
    }
  }
  return '';
}

export function extractCompetenciaFromTribunal(tribunal: string): string {
  const t = tribunal.toUpperCase();
  if (t.includes('CORTE SUPREMA')) return 'Corte Suprema';
  if (t.includes('CORTE DE APELACIONES')) return 'Corte Apelaciones';
  if (t.includes('LABORAL')) return 'Laboral';
  if (t.includes('PENAL') || t.includes('GARANTÍA')) return 'Penal';
  if (t.includes('FAMILIA')) return 'Familia';
  if (t.includes('COBRANZA')) return 'Cobranza';
  if (t.includes('CIVIL') || t.includes('LETRAS')) return 'Civil';
  return '';
}

// ─── Formato RUT chileno (XX.XXX.XXX-D) ─────────────────────────────────────

export function formatRutChileno(rut: string): string {
  if (!rut) return '';
  // Limpiar: dejar solo dígitos, k/K y guión
  const clean = rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  const dashIdx = clean.lastIndexOf('-');
  if (dashIdx === -1) return rut; // formato desconocido, devolver tal cual
  const body = clean.substring(0, dashIdx).replace(/\D/g, '');
  const dv   = clean.substring(dashIdx + 1);
  if (!body || !dv) return rut;
  // Insertar puntos cada 3 dígitos desde la derecha
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

// ─── Extracción de ROL (determinístico, sin IA) ──────────────────────────────

// Formatos: C-1234-2024, T-567-2025, RIT T-123-2024, O-12-2024, etc.
const ROL_PATTERN = /(?:RIT|ROL|N[°º]?\s*(?:DE\s+)?(?:ROL|CAUSA))?\s*:?\s*([A-Z]-\d{1,6}-\d{4}|\d{1,6}-\d{4})/i;

export function extractRolFromText(texto: string): string {
  const match = texto.match(ROL_PATTERN);
  return match ? match[1].trim() : '';
}

// ─── Extracción estructurada de cabecera (determinístico, sin IA) ─────────────
// Soporta múltiples formatos de cabecera usados en PDFs judiciales chilenos:
//   Patrón A: "Demandante : ...\nRut Demandante : ..."  (AFP Planvital, etc.)
//   Patrón B: "DEMANDANTE: ...\nRUT: ..."               (CAR S.A., sindicatos)
//   Patrón C: "NOMBRE DEL DEMANDANTE: ...\nRUT DEMANDANTE: ..."  (AFC Chile, cobranza laboral)

export interface HeaderEntity {
  name: string;
  rut:  string;
}

export interface StructuredHeader {
  demandante:   HeaderEntity;
  demandado:    HeaderEntity;
  representante: HeaderEntity;  // representante legal del demandado
}

// Normaliza una etiqueta de línea para matching uniforme
function normLabel(s: string): string {
  return norm(s).replace(/\s+/g, ' ').trim();
}

// Tabla de etiquetas de entidad → slot (orden importa: más específico primero)
const ENTITY_LABEL_MAP: Array<{ prefixes: string[]; slot: keyof StructuredHeader }> = [
  {
    slot: 'demandante',
    prefixes: [
      'nombre del demandante', 'nombre demandante',
      'parte demandante', 'demandante', 'ejecutante',
    ],
  },
  {
    slot: 'demandado',
    prefixes: [
      'nombre del demandado', 'nombre demandado',
      'parte demandada', 'demandado', 'ejecutado',
    ],
  },
  {
    slot: 'representante',
    prefixes: [
      'representante legal', 'rep. legal', 'rep legal', 'representante',
    ],
  },
];

// Tabla de etiquetas de RUT con rol explícito → slot
const RUT_LABEL_MAP: Array<{ prefixes: string[]; slot: keyof StructuredHeader }> = [
  {
    slot: 'demandante',
    prefixes: [
      'rut del demandante', 'rut demandante', 'rut ejecutante',
      'rut patrocinante', 'rut abogado patrocinante', 'rut abogado',
    ],
  },
  {
    slot: 'demandado',
    prefixes: [
      'rut del demandado', 'rut demandado', 'rut ejecutado',
    ],
  },
  {
    slot: 'representante',
    prefixes: [
      'rut representante legal', 'rut del representante legal',
      'rut representante', 'rut rep legal', 'rut rep. legal',
    ],
  },
];

function matchLabelMap<T extends { prefixes: string[]; slot: S }, S>(
  map: T[],
  label: string,
): S | null {
  for (const entry of map) {
    for (const prefix of entry.prefixes) {
      if (label === prefix || label.startsWith(prefix)) return entry.slot;
    }
  }
  return null;
}

function emptyEntity(): HeaderEntity { return { name: '', rut: '' }; }

/**
 * Extrae entidades estructuradas de la cabecera de una demanda/resolución chilena.
 * Opera sobre texto ya con guiones normalizados.
 */
export function extractStructuredHeader(texto: string): StructuredHeader {
  const result: StructuredHeader = {
    demandante:    emptyEntity(),
    demandado:     emptyEntity(),
    representante: emptyEntity(),
  };

  // Trabajar solo sobre la cabecera (antes de "EN LO PRINCIPAL" o "OTROSI")
  const cutMarkers = ['EN LO PRINCIPAL', 'PRIMER OTROSI', 'PRIMER OTROSÍ', 'OTROSI', 'OTROSÍ'];
  let cutAt = texto.length;
  const upper = texto.toUpperCase();
  for (const m of cutMarkers) {
    const idx = upper.indexOf(m);
    if (idx > 50 && idx < cutAt) cutAt = idx;
  }
  const header = texto.substring(0, cutAt);

  const lines = header.split('\n');
  let lastEntitySlot: keyof StructuredHeader | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const labelNorm = normLabel(line.substring(0, colonIdx));
    const value     = line.substring(colonIdx + 1).trim().replace(/\.$/, '').trim();
    if (!value) continue;

    // ── RUT con rol explícito en la etiqueta ──────────────────────────────
    const rutSlot = matchLabelMap(RUT_LABEL_MAP, labelNorm);
    if (rutSlot) {
      const rutMatch = value.match(RUT_PATTERN);
      if (rutMatch) result[rutSlot].rut = rutMatch[0];
      continue;
    }

    // ── RUT genérico (sin rol): asignar a última entidad vista ────────────
    if (labelNorm === 'rut' || labelNorm === 'r.u.t' || labelNorm === 'r.u.t.') {
      const rutMatch = value.match(RUT_PATTERN);
      if (rutMatch && lastEntitySlot) {
        result[lastEntitySlot].rut = rutMatch[0];
      }
      continue;
    }

    // ── Etiqueta de entidad ───────────────────────────────────────────────
    const entitySlot = matchLabelMap(ENTITY_LABEL_MAP, labelNorm);
    if (entitySlot) {
      const inlineRut = value.match(RUT_PATTERN);
      if (inlineRut) {
        result[entitySlot].name = value.replace(RUT_PATTERN, '').trim();
        result[entitySlot].rut  = inlineRut[0];
      } else {
        result[entitySlot].name = value;
      }
      lastEntitySlot = entitySlot;
    }
  }

  return result;
}

// ─── Matching RUT ↔ Nombre (determinístico, sin IA) ──────────────────────────

interface MatchResult {
  rut: string;
  score: number;
}

/** Normaliza texto para búsqueda: minúsculas + sin acentos + guiones estándar. */
function norm(s: string): string {
  return normalizeHyphens(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Encuentra el RUT más cercano a un nombre buscando por distancia mínima en el texto.
 * Simple y robusto: sin scoring complejo, sin ambigüedades.
 */
export function matchRutToName(
  nombre: string,
  ruts: string[],
  textoOriginal: string,
): MatchResult | null {
  if (!nombre.trim() || ruts.length === 0) return null;

  // Único RUT en el documento → asignar directamente
  if (ruts.length === 1) return { rut: ruts[0], score: 10 };

  const textoNorm = norm(textoOriginal);
  const nombreNorm = norm(nombre);

  // Posiciones del nombre (búsqueda completa primero, luego por palabra)
  let namePositions: number[] = [];
  let i = textoNorm.indexOf(nombreNorm);
  while (i !== -1) { namePositions.push(i); i = textoNorm.indexOf(nombreNorm, i + 1); }

  if (namePositions.length === 0) {
    nombre.split(/\s+/).filter(w => w.length >= 4).forEach(palabra => {
      const pn = norm(palabra);
      let j = textoNorm.indexOf(pn);
      while (j !== -1) { namePositions.push(j); j = textoNorm.indexOf(pn, j + 1); }
    });
  }

  if (namePositions.length === 0) return ruts.length === 1 ? { rut: ruts[0], score: 3 } : null;

  let bestRut: string | null = null;
  let bestDist = 700;

  for (const rut of ruts) {
    const rutNorm = norm(rut);
    let r = textoNorm.indexOf(rutNorm);
    while (r !== -1) {
      for (const nPos of namePositions) {
        const dist = Math.abs(nPos - r);
        if (dist < bestDist) { bestDist = dist; bestRut = rut; }
      }
      r = textoNorm.indexOf(rutNorm, r + 1);
    }
  }

  return bestRut ? { rut: bestRut, score: 10 } : null;
}

// ─── Anonimización legacy (usada en generate-estampe) ────────────────────────

export function anonymizeRuts(text: string): string {
  if (!text) return text;
  return text.replace(RUT_PATTERN, '[RUT_REDACTADO]');
}

export function anonymizeAddress(address: string): string {
  if (!address || !address.trim()) return address;
  return '[DOMICILIO_REDACTADO]';
}

// Limpieza periódica de stores en memoria
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
  for (const [hash, entry] of fingerprintCache.entries()) {
    if (now > entry.expiresAt) fingerprintCache.delete(hash);
  }
}, 300_000);

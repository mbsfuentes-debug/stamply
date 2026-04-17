/**
 * Utilidades de seguridad para los endpoints de IA en server.ts
 * Protege contra abuso de API key y datos personales sensibles.
 */

// ─── Rate Limiting en memoria ────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Verifica si una IP puede hacer una llamada a la IA.
 * Límite: max llamadas por ventana de windowMs milisegundos.
 */
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

// Limpieza periódica para evitar memory leaks en sesiones largas
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 300_000); // cada 5 minutos

// ─── Validación de PDF ───────────────────────────────────────────────────────

/**
 * Verifica que el string base64 corresponda a un PDF real (magic bytes %PDF)
 * y no supere el tamaño máximo permitido.
 */
export function validatePdfBase64(
  base64Data: string,
  maxBytes = 10 * 1024 * 1024 // 10 MB
): { valid: boolean; error?: string } {
  if (!base64Data || typeof base64Data !== 'string') {
    return { valid: false, error: 'Se requiere un archivo en formato base64.' };
  }

  // Estimar tamaño sin decodificar el archivo completo
  const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    return {
      valid: false,
      error: `El archivo supera el límite de ${maxBytes / 1024 / 1024}MB.`,
    };
  }

  // Decodificar solo los primeros bytes para verificar magic bytes
  // Magic bytes de PDF: %PDF = 0x25 0x50 0x44 0x46
  const header = Buffer.from(base64Data.substring(0, 8), 'base64');
  const isPdf =
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46;

  if (!isPdf) {
    return { valid: false, error: 'El archivo no es un PDF válido.' };
  }

  return { valid: true };
}

// ─── Anonimización de datos sensibles ───────────────────────────────────────

// RUT chileno con puntos de miles: 12.345.678-9 o 1.234.567-K
const RUT_WITH_DOTS = /\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/g;
// RUT sin puntos: 12345678-9 o 1234567-K
const RUT_WITHOUT_DOTS = /\b\d{7,8}-[\dkK]\b/g;

/**
 * Reemplaza RUTs chilenos en el texto con un placeholder.
 * Los nombres NO se anonimizarán — son jurídicamente necesarios en el acta.
 */
export function anonymizeRuts(text: string): string {
  if (!text) return text;
  return text
    .replace(RUT_WITH_DOTS, '[RUT_REDACTADO]')
    .replace(RUT_WITHOUT_DOTS, '[RUT_REDACTADO]');
}

/**
 * Reemplaza un domicilio completo con un placeholder.
 * Se usa en SmartEstampe para no enviar el domicilio real a Gemini.
 */
export function anonymizeAddress(address: string): string {
  if (!address || !address.trim()) return address;
  return '[DOMICILIO_REDACTADO]';
}

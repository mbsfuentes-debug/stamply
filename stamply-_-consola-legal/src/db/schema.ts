/**
 * STAMPLY — Esquema SQLite local
 *
 * Diseñado para ser reemplazado por Supabase (PostgreSQL) en producción.
 * Los tipos de columna y nombres son compatibles con el plan de migración.
 * Para migrar: reemplazar src/db/index.ts por un cliente Supabase con la misma API.
 */

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─── Clientes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  rut          TEXT NOT NULL DEFAULT '',
  type         TEXT NOT NULL DEFAULT 'Abogado Independiente',  -- 'Abogado Independiente' | 'Estudio Jurídico'
  tariff_type  TEXT NOT NULL DEFAULT 'Arancel Receptor',       -- 'Propio' | 'Por Cartera' | 'Arancel Receptor'
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  address      TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'Activo',                 -- 'Activo' | 'Inactivo'
  cases_count  INTEGER NOT NULL DEFAULT 0,
  closing_day  INTEGER,                                        -- día del mes para cierre de factura
  payment_term TEXT NOT NULL DEFAULT '30_dias',                -- 'inmediato' | '10_dias' | '30_dias' | '45_dias'
  is_vip       INTEGER NOT NULL DEFAULT 0,                     -- boolean (0|1) — SQLite no tiene BOOL
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Carteras (portafolios por cliente) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolios (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  rut        TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Aranceles por cliente ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tariff_items (
  id               TEXT PRIMARY KEY,
  client_id        TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service          TEXT NOT NULL,   -- tipo de trámite (ej. 'Notificación Personal')
  amount           INTEGER NOT NULL DEFAULT 0,
  portfolio        TEXT,            -- cartera específica si tariff_type = 'Por Cartera'
  detected_service TEXT,            -- campo para importación por IA
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Causas judiciales ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
  id                    TEXT PRIMARY KEY,
  rol                   TEXT NOT NULL,
  fecha_ingreso         TEXT NOT NULL DEFAULT (date('now')),
  competencia           TEXT NOT NULL DEFAULT '',
  tribunal              TEXT,
  cliente               TEXT NOT NULL DEFAULT '',
  cartera               TEXT NOT NULL DEFAULT '',
  demandante            TEXT,
  demandado             TEXT NOT NULL DEFAULT '',
  domicilio             TEXT NOT NULL DEFAULT '',
  comuna                TEXT NOT NULL DEFAULT '',
  fecha_pjud            TEXT,
  boleta                TEXT,
  fecha_emision         TEXT,
  monto                 TEXT,
  estado_pago           TEXT NOT NULL DEFAULT 'Pendiente',
  urgente               INTEGER NOT NULL DEFAULT 0,
  observations          TEXT NOT NULL DEFAULT '',
  numero_interno        TEXT,
  caratula_conservador  TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Demandados normalizados por causa ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS defendants (
  id              TEXT PRIMARY KEY,
  case_id         TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  rut             TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  legal_rep       TEXT NOT NULL DEFAULT '',
  gender          TEXT NOT NULL DEFAULT '',        -- 'Masculino' | 'Femenino' | ''
  legal_rep_rut   TEXT NOT NULL DEFAULT '',        -- RUT del representante legal
  legal_rep_gender TEXT NOT NULL DEFAULT '',       -- 'Masculino' | 'Femenino' | ''
  is_primary      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Trámites (módulo central) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tramites (
  id                    TEXT PRIMARY KEY,
  causa_id              TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  causa_rol             TEXT NOT NULL,                -- desnormalizado para display rápido
  cliente_nombre        TEXT NOT NULL DEFAULT '',
  type                  TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pendiente',  -- 'pendiente'|'en_proceso'|'completado'|'fallido'
  fecha_realizado       TEXT NOT NULL,
  hora_realizado        TEXT NOT NULL DEFAULT '10:00',
  resultado             TEXT NOT NULL DEFAULT '',
  monto                 INTEGER NOT NULL DEFAULT 0,
  distance_fee          INTEGER NOT NULL DEFAULT 0,
  urgente               INTEGER NOT NULL DEFAULT 0,
  payment_term_snapshot TEXT NOT NULL DEFAULT '30_dias',
  facturado             INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Documentos ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT '',
  rol              TEXT NOT NULL DEFAULT '',
  date             TEXT NOT NULL,
  size             TEXT NOT NULL DEFAULT '',
  drive_file_id    TEXT,
  drive_view_link  TEXT,
  signature_status TEXT NOT NULL DEFAULT 'unsigned',  -- 'unsigned'|'pending'|'signed'
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Estampes (actas) ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estampes (
  id           TEXT PRIMARY KEY,
  rol          TEXT NOT NULL,
  defendant    TEXT NOT NULL DEFAULT '',
  type         TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'borrador',  -- 'borrador'|'listo'|'firmado'
  date         TEXT NOT NULL DEFAULT (date('now')),
  content      TEXT NOT NULL DEFAULT '',
  tramite_id   TEXT REFERENCES tramites(id),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Plantillas de actas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  tramite_type TEXT,
  is_system    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Auditoría de llamadas a IA ───────────────────────────────────────────────
-- Registra metadata de cada llamada (nunca almacena PII ni contenido del doc)
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id              TEXT PRIMARY KEY,
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  doc_hash        TEXT NOT NULL,   -- SHA-256 del PDF (no el contenido)
  tokens_sent     INTEGER NOT NULL DEFAULT 0,
  schema_returned TEXT NOT NULL DEFAULT '',
  ip              TEXT NOT NULL DEFAULT '',
  cached          INTEGER NOT NULL DEFAULT 0  -- 1 si se sirvió desde caché
);
`;

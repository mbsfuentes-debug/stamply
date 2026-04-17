/**
 * STAMPLY — Capa de acceso a datos (SQLite local)
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MIGRACIÓN A SUPABASE                                                   │
 * │  Para reemplazar SQLite por Supabase:                                   │
 * │  1. Ejecutar las migraciones SQL del plan (drifting-juggling-crown.md)  │
 * │  2. Reemplazar las implementaciones de este archivo por llamadas al     │
 * │     cliente @supabase/supabase-js manteniendo la misma firma de API.    │
 * │  3. Los endpoints de server.ts y componentes React NO cambian.          │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL } from './schema.js';
import { seedDatabase } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivo SQLite en la raíz del proyecto (no commitear — ya está en .gitignore)
const DB_PATH = path.join(__dirname, '..', '..', 'stamply.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.exec(SCHEMA_SQL);
    seedDatabase(_db);
  }
  return _db;
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────

export function dbGetClients() {
  const db = getDb();
  const clients = db.prepare('SELECT * FROM clients ORDER BY name').all() as any[];
  return clients.map(expandClient);
}

export function dbGetClient(id: string) {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as any;
  if (!client) return null;
  return expandClient(client);
}

export function dbCreateClient(data: any) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO clients (id,name,rut,type,tariff_type,email,phone,address,status,
      cases_count,closing_day,payment_term,is_vip)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.name, data.rut || '', data.type || 'Abogado Independiente',
    data.tariffType || 'Arancel Receptor', data.email || '', data.phone || '',
    data.address || '', data.status || 'Activo', data.casesCount || 0,
    data.closingDay || null, data.paymentTerm || '30_dias', data.isVip ? 1 : 0);
  return dbGetClient(id);
}

export function dbUpdateClient(id: string, data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE clients SET name=?,rut=?,type=?,tariff_type=?,email=?,phone=?,address=?,
      status=?,closing_day=?,payment_term=?,is_vip=? WHERE id=?
  `).run(data.name, data.rut, data.type, data.tariffType, data.email, data.phone,
    data.address, data.status, data.closingDay || null, data.paymentTerm, data.isVip ? 1 : 0, id);
  return dbGetClient(id);
}

export function dbDeleteClient(id: string) {
  getDb().prepare('DELETE FROM clients WHERE id = ?').run(id);
}

/** Expande un cliente plano de SQLite con portfolios y aranceles */
function expandClient(row: any) {
  const db = getDb();
  const portfolios = db.prepare('SELECT * FROM portfolios WHERE client_id = ?').all(row.id) as any[];
  const tariffs = db.prepare('SELECT * FROM tariff_items WHERE client_id = ?').all(row.id) as any[];
  return {
    id: row.id,
    name: row.name,
    rut: row.rut,
    type: row.type,
    tariffType: row.tariff_type,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status,
    casesCount: row.cases_count,
    closingDay: row.closing_day,
    paymentTerm: row.payment_term,
    isVip: row.is_vip === 1,
    portfolios: portfolios.map(p => ({ name: p.name, rut: p.rut })),
    tariffs: tariffs.map(t => ({
      id: t.id, service: t.service, amount: t.amount,
      portfolio: t.portfolio, detectedService: t.detected_service
    })),
  };
}

// ─── CAUSAS ──────────────────────────────────────────────────────────────────

export function dbGetCases() {
  const db = getDb();
  const cases = db.prepare('SELECT * FROM cases ORDER BY fecha_ingreso DESC').all() as any[];
  return cases.map(expandCase);
}

export function dbGetCase(id: string) {
  const db = getDb();
  const c = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as any;
  if (!c) return null;
  return expandCase(c);
}

export function dbCreateCase(data: any) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO cases (id,rol,fecha_ingreso,competencia,tribunal,cliente,cartera,
      demandante,demandado,domicilio,comuna,fecha_pjud,boleta,fecha_emision,monto,
      estado_pago,urgente,observations,numero_interno,caratula_conservador)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.rol, data.fechaIngreso || new Date().toISOString().split('T')[0],
    data.competencia || '', data.tribunal || '', data.cliente || '', data.cartera || '',
    data.demandante || '', data.demandado || '', data.domicilio || '', data.comuna || '',
    data.fechaPjud || null, data.boleta || null, data.fechaEmision || null,
    data.monto || null, data.estadoPago || 'Pendiente', data.urgente ? 1 : 0,
    data.observations || '', data.numeroInterno || null, data.caratulaConservador || null);

  // Insertar demandados si vienen en el payload
  if (Array.isArray(data.defendants)) {
    data.defendants.forEach((def: any) => dbAddDefendant(id, def));
  }
  return dbGetCase(id);
}

export function dbUpdateCase(id: string, data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE cases SET rol=?,fecha_ingreso=?,competencia=?,tribunal=?,cliente=?,cartera=?,
      demandante=?,demandado=?,domicilio=?,comuna=?,fecha_pjud=?,boleta=?,fecha_emision=?,
      monto=?,estado_pago=?,urgente=?,observations=?,numero_interno=?,caratula_conservador=?
    WHERE id=?
  `).run(data.rol, data.fechaIngreso, data.competencia, data.tribunal, data.cliente,
    data.cartera, data.demandante || '', data.demandado, data.domicilio, data.comuna,
    data.fechaPjud || null, data.boleta || null, data.fechaEmision || null,
    data.monto || null, data.estadoPago, data.urgente ? 1 : 0, data.observations || '',
    data.numeroInterno || null, data.caratulaConservador || null, id);
  return dbGetCase(id);
}

export function dbCheckRolExists(rol: string): any | null {
  const c = getDb().prepare('SELECT * FROM cases WHERE rol = ?').get(rol) as any;
  return c ? expandCase(c) : null;
}

function expandCase(row: any) {
  const db = getDb();
  const defendants = db.prepare('SELECT * FROM defendants WHERE case_id = ? ORDER BY is_primary DESC').all(row.id) as any[];
  return {
    id: row.id,
    rol: row.rol,
    fechaIngreso: row.fecha_ingreso,
    competencia: row.competencia,
    tribunal: row.tribunal,
    cliente: row.cliente,
    cartera: row.cartera,
    demandante: row.demandante,
    demandado: row.demandado,
    domicilio: row.domicilio,
    comuna: row.comuna,
    fechaPjud: row.fecha_pjud,
    boleta: row.boleta,
    fechaEmision: row.fecha_emision,
    monto: row.monto,
    estadoPago: row.estado_pago,
    urgente: row.urgente === 1,
    observations: row.observations,
    numeroInterno: row.numero_interno,
    caratulaConservador: row.caratula_conservador,
    defendants: defendants.map(d => ({
      name: d.name, rut: d.rut, address: d.address, city: d.city, legalRep: d.legal_rep
    })),
  };
}

// ─── DEMANDADOS ───────────────────────────────────────────────────────────────

export function dbAddDefendant(caseId: string, data: any) {
  const id = crypto.randomUUID();
  getDb().prepare(`
    INSERT INTO defendants (id,case_id,name,rut,address,city,legal_rep,is_primary)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(id, caseId, data.name || '', data.rut || '', data.address || '',
    data.city || '', data.legalRep || '', data.isPrimary ? 1 : 0);
}

// ─── TRÁMITES ─────────────────────────────────────────────────────────────────

export function dbGetTramites() {
  return (getDb().prepare('SELECT * FROM tramites ORDER BY created_at DESC').all() as any[]).map(mapTramite);
}

export function dbGetTramitesByCausa(causaId: string) {
  return (getDb().prepare('SELECT * FROM tramites WHERE causa_id = ? ORDER BY created_at DESC').all(causaId) as any[]).map(mapTramite);
}

export function dbCreateTramite(data: any) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO tramites (id,causa_id,causa_rol,cliente_nombre,type,status,
      fecha_realizado,hora_realizado,resultado,monto,distance_fee,urgente,
      payment_term_snapshot,facturado)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.causaId, data.causaRol, data.clienteNombre || '', data.type,
    data.status || 'pendiente', data.fechaRealizado, data.horaRealizado || '10:00',
    data.resultado || '', data.monto || 0, data.distanceFee || 0,
    data.urgente ? 1 : 0, data.payment_term_snapshot || '30_dias', data.facturado ? 1 : 0);
  return mapTramite(db.prepare('SELECT * FROM tramites WHERE id = ?').get(id) as any);
}

export function dbUpdateTramite(id: string, data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE tramites SET type=?,status=?,fecha_realizado=?,hora_realizado=?,resultado=?,
      monto=?,distance_fee=?,urgente=?,facturado=? WHERE id=?
  `).run(data.type, data.status, data.fechaRealizado, data.horaRealizado,
    data.resultado || '', data.monto || 0, data.distanceFee || 0,
    data.urgente ? 1 : 0, data.facturado ? 1 : 0, id);
  return mapTramite(db.prepare('SELECT * FROM tramites WHERE id = ?').get(id) as any);
}

export function dbDeleteTramite(id: string) {
  getDb().prepare('DELETE FROM tramites WHERE id = ?').run(id);
}

function mapTramite(row: any) {
  return {
    id: row.id, causaId: row.causa_id, causaRol: row.causa_rol,
    clienteNombre: row.cliente_nombre, type: row.type, status: row.status,
    fechaRealizado: row.fecha_realizado, horaRealizado: row.hora_realizado,
    resultado: row.resultado, monto: row.monto, distanceFee: row.distance_fee,
    urgente: row.urgente === 1, payment_term_snapshot: row.payment_term_snapshot,
    facturado: row.facturado === 1, createdAt: row.created_at,
  };
}

// ─── DOCUMENTOS ───────────────────────────────────────────────────────────────

export function dbGetDocuments() {
  return (getDb().prepare('SELECT * FROM documents ORDER BY date DESC').all() as any[]).map(d => ({
    id: d.id, name: d.name, type: d.type, rol: d.rol, date: d.date, size: d.size,
    driveFileId: d.drive_file_id, driveViewLink: d.drive_view_link,
    signatureStatus: d.signature_status,
  }));
}

export function dbCreateDocument(data: any) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO documents (id,name,type,rol,date,size) VALUES (?,?,?,?,?,?)`).run(
    id, data.name, data.type || '', data.rol || '', data.date || new Date().toISOString().split('T')[0], data.size || '');
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
}

// ─── ESTAMPES ─────────────────────────────────────────────────────────────────

export function dbGetEstampes() {
  return (getDb().prepare('SELECT * FROM estampes ORDER BY date DESC').all() as any[]).map(mapEstampe);
}

export function dbCreateEstampe(data: any) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO estampes (id,rol,defendant,type,status,date,content,tramite_id) VALUES (?,?,?,?,?,?,?,?)`).run(
    id, data.rol, data.defendant || '', data.type || '', data.status || 'borrador',
    data.date || new Date().toISOString().split('T')[0], data.content || '', data.tramite_id || null);
  return mapEstampe(db.prepare('SELECT * FROM estampes WHERE id = ?').get(id) as any);
}

export function dbUpdateEstampe(id: string, data: Partial<{ status: string; content: string }>) {
  const db = getDb();
  if (data.status !== undefined) db.prepare('UPDATE estampes SET status=? WHERE id=?').run(data.status, id);
  if (data.content !== undefined) db.prepare('UPDATE estampes SET content=? WHERE id=?').run(data.content, id);
  return mapEstampe(db.prepare('SELECT * FROM estampes WHERE id = ?').get(id) as any);
}

function mapEstampe(row: any) {
  return { id: row.id, rol: row.rol, defendant: row.defendant, type: row.type,
    status: row.status, date: row.date, content: row.content, tramiteId: row.tramite_id };
}

// ─── PLANTILLAS ───────────────────────────────────────────────────────────────

export function dbGetTemplates() {
  return (getDb().prepare('SELECT * FROM templates ORDER BY name').all() as any[]).map(t => ({
    id: t.id, name: t.name, description: t.description, content: t.content,
    tramiteType: t.tramite_type, isSystem: t.is_system === 1,
  }));
}

export function dbCreateTemplate(data: any) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO templates (id,name,description,content,tramite_type,is_system) VALUES (?,?,?,?,?,?)`).run(
    id, data.name, data.description || '', data.content || '', data.tramiteType || null, 0);
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
}

export function dbUpdateTemplate(id: string, data: any) {
  getDb().prepare(`UPDATE templates SET name=?,description=?,content=? WHERE id=?`).run(
    data.name, data.description, data.content, id);
}

export function dbDeleteTemplate(id: string) {
  getDb().prepare('DELETE FROM templates WHERE id = ?').run(id);
}

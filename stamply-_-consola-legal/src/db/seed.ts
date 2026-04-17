/**
 * STAMPLY — Seed inicial de SQLite
 *
 * Replica exactamente los datos mock que actualmente están en:
 * - App.tsx (INITIAL_DOCS, INITIAL_ESTAMPES, INITIAL_TEMPLATES)
 * - Clients.tsx (INITIAL_CLIENTS)
 * - CasesList.tsx (INITIAL_CASES)
 *
 * Se ejecuta solo si la tabla clients está vacía (idempotente).
 */

import type Database from 'better-sqlite3';

export function seedDatabase(db: Database.Database): void {
  const clientCount = (db.prepare('SELECT COUNT(*) as c FROM clients').get() as any).c;
  if (clientCount > 0) return; // ya fue poblada

  console.log('[DB] Cargando datos iniciales (seed)...');

  const run = db.transaction(() => {
    // ─── CLIENTES ────────────────────────────────────────────────────────────
    const insClient = db.prepare(`
      INSERT INTO clients (id,name,rut,type,tariff_type,email,phone,address,status,cases_count,closing_day,payment_term,is_vip)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    insClient.run('c1','Estudio Jurídico Silva & Cía','76.123.456-7','Estudio Jurídico',
      'Por Cartera','contacto@silvaycia.cl','+56 2 2345 6789','Av. Apoquindo 3000, Las Condes',
      'Activo',145,25,'30_dias',1);
    insClient.run('c2','Juan Pérez González','12.345.678-9','Abogado Independiente',
      'Arancel Receptor','juan.perez@email.com','+56 9 8765 4321','Huérfanos 1160, Of. 502',
      'Activo',12,null,'inmediato',0);
    insClient.run('c3','Defensa Deudores SpA','76.543.210-K','Estudio Jurídico',
      'Propio','operaciones@defensadeudores.cl','+56 2 3344 5566','Teatinos 280, Piso 8',
      'Activo',56,null,'10_dias',0);

    // ─── PORTFOLIOS ──────────────────────────────────────────────────────────
    const insPort = db.prepare(`INSERT INTO portfolios VALUES (?,?,?,?,datetime('now'))`);
    insPort.run('p1','c1','Banco Estado','97.036.000-K');
    insPort.run('p2','c1','AFP Modelo','76.095.785-5');
    insPort.run('p3','c1','Hipotecario 2023','');
    insPort.run('p4','c1','Cobranza 2024','');
    insPort.run('p5','c3','Retail S.A.','99.555.444-3');
    insPort.run('p6','c3','Automotriz del Sur','88.444.333-2');
    insPort.run('p7','c3','Castigo','');

    // ─── ARANCELES ───────────────────────────────────────────────────────────
    const insTariff = db.prepare(`INSERT INTO tariff_items VALUES (?,?,?,?,?,?,datetime('now'))`);
    // Silva & Cía (por cartera — Banco Estado)
    insTariff.run('t1','c1','Notificación Personal (Art. 40 CPC)',55000,'Banco Estado',null);
    insTariff.run('t2','c1','Búsqueda (Art. 44 CPC)',40000,'Banco Estado',null);
    insTariff.run('t3','c1','Requerimiento de Pago',65000,'Banco Estado',null);
    // Defensa Deudores (tarifa propia)
    insTariff.run('t4','c3','Notificación Personal (Art. 40 CPC)',45000,null,null);
    insTariff.run('t5','c3','Requerimiento de Pago',55000,null,null);
    insTariff.run('t6','c3','Embargo',75000,null,null);

    // ─── CAUSAS ──────────────────────────────────────────────────────────────
    const insCase = db.prepare(`
      INSERT INTO cases (id,rol,fecha_ingreso,competencia,tribunal,cliente,cartera,
        demandado,domicilio,comuna,fecha_pjud,boleta,fecha_emision,monto,estado_pago,urgente,observations)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

    insCase.run('cs1','C-1452-2023','2023-10-24','1er Juzgado Civil de Santiago',
      '1er Juzgado Civil de Santiago','Estudio Jurídico Silva & Cía','Hipotecario 2023',
      'INVERSIONES Y ASESORIAS LIMITADA','Av. Apoquindo 4501, Of 1201','Las Condes',
      '2023-10-26','145','2023-10-28','$45.000','Pagado',0,
      'Falta firma en documento adjunto. Se solicitó al cliente el 25/10.');

    insCase.run('cs2','C-892-2024','2024-01-15','Corte de Apelaciones',
      'Corte de Apelaciones de Santiago','Juan Pérez González','Cobranza 2024',
      'JUAN PÉREZ GONZÁLEZ','Pasaje Los Pinos 123','Maipú',
      '2024-01-18','146','2024-01-20','$60.000','Pendiente',1,
      'Dirección difícil de encontrar. Se requiere croquis.');

    insCase.run('cs3','C-331-2024','2024-02-02','3er Juzgado Civil',
      '3er Juzgado Civil','Defensa Deudores SpA','Castigo',
      'COMERCIALIZADORA DEL SUR SPA','Gran Avenida 4550','San Miguel',
      '2024-02-05','147','2024-02-10','$55.000','Atrasado',0,
      'Notificado personalmente al representante legal.');

    insCase.run('cs4','C-552-2024','2024-03-22','2do Juzgado Civil',
      '2do Juzgado Civil','Estudio Jurídico Silva & Cía','Cobranza 2024',
      'PEDRO SOTO','Huérfanos 1160','Santiago',
      '2024-03-25','148','2024-03-26','$40.000','Pendiente',0,
      'Pendiente de notificación.');

    insCase.run('cs5','C-112-2024','2024-03-25','4to Juzgado Civil',
      '4to Juzgado Civil','Juan Pérez González','Hipotecario 2024',
      'LUCÍA MÉNDEZ','Irarrázaval 2000','Ñuñoa',
      '2024-03-26','149','2024-03-27','$50.000','Atrasado',0,
      'Domicilio cerrado en 2 visitas.');

    insCase.run('cs6','C-999-2024','2024-03-26','1er Juzgado Civil',
      '1er Juzgado Civil','Defensa Deudores SpA','Castigo',
      'MARIO BROS','Vicuña Mackenna 100','Providencia',
      '2024-03-28','150','2024-03-29','$35.000','Pendiente',0,
      'Se requiere nuevo domicilio.');

    insCase.run('cs7','C-777-2024','2024-03-27','Corte de Apelaciones',
      'Corte de Apelaciones de Santiago','Estudio Jurídico Silva & Cía','Cobranza 2024',
      'LUIGI BROS','Alameda 1000','Santiago',
      '2024-03-29','151','2024-03-30','$45.000','Pagado',0,
      'Notificación exitosa.');

    insCase.run('cs8','C-888-2024','2024-03-28','3er Juzgado Civil',
      '3er Juzgado Civil','Juan Pérez González','Hipotecario 2024',
      'BOWSER','Américo Vespucio 5000','Macul',
      '2024-03-30','152','2024-04-01','$70.000','Pendiente',1,
      'Urgente por plazo judicial.');

    insCase.run('cs9','C-111-2024','2024-03-29','2do Juzgado Civil',
      '2do Juzgado Civil','Defensa Deudores SpA','Castigo',
      'TOAD','Florida 123','La Florida',
      '2024-04-02','153','2024-04-03','$30.000','Pendiente',0,
      'En ruta.');

    insCase.run('cs10','C-222-2024','2024-03-30','4to Juzgado Civil',
      '4to Juzgado Civil','Estudio Jurídico Silva & Cía','Cobranza 2024',
      'YOSHI','Pajaritos 4000','Maipú',
      '2024-04-03','154','2024-04-04','$55.000','Pendiente',0,
      'Pendiente de asignación.');

    // ─── DOCUMENTOS ──────────────────────────────────────────────────────────
    const insDoc = db.prepare(`INSERT INTO documents (id,name,type,rol,date,size) VALUES (?,?,?,?,?,?)`);
    insDoc.run('d1','Demanda_Principal.pdf','Demanda','C-1452-2023','2023-10-24','2.4 MB');
    insDoc.run('d2','Resolucion_Busqueda.pdf','Resolución','C-892-2024','2024-01-16','1.1 MB');
    insDoc.run('d3','Estampe_Notificacion.pdf','Estampe','C-331-2024','2024-02-03','850 KB');
    insDoc.run('d4','Boleta_Honorarios_145.pdf','Boleta','C-1452-2023','2023-10-25','120 KB');
    insDoc.run('d5','Certificado_Rebeldia.pdf','Certificado','C-892-2024','2024-02-10','450 KB');

    // ─── ESTAMPES ────────────────────────────────────────────────────────────
    const insEst = db.prepare(`INSERT INTO estampes (id,rol,defendant,type,status,date,content) VALUES (?,?,?,?,?,?,?)`);
    insEst.run('e1','C-1452-2023','INVERSIONES Y ASESORIAS LIMITADA','Notificación Personal',
      'borrador','2023-10-24',
      'En Santiago, a 24 de Octubre de 2023, siendo las 10:00 horas, me constituí en el domicilio ubicado en Av. Providencia 1234, comuna de Providencia, con el objeto de notificar la demanda a INVERSIONES Y ASESORIAS LIMITADA. Fui atendido por don Carlos Silva, quien se identificó como representante legal...');
    insEst.run('e2','C-892-2024','JUAN PÉREZ GONZÁLEZ','Búsqueda',
      'listo','2024-01-15',
      'En Santiago, a 15 de Enero de 2024, siendo las 15:30 horas, me constituí en el domicilio ubicado en Calle Falsa 123, comuna de Santiago, procediendo a realizar la búsqueda de don JUAN PÉREZ GONZÁLEZ, no siendo habido en el lugar...');
    insEst.run('e3','C-331-2024','COMERCIALIZADORA DEL SUR SPA','Requerimiento de Pago',
      'firmado','2024-02-02',
      'En Santiago, a 02 de Febrero de 2024, requerí de pago a COMERCIALIZADORA DEL SUR SPA, por la suma de $55.000, no efectuando el pago en el acto...');

    // ─── PLANTILLAS ──────────────────────────────────────────────────────────
    const insTpl = db.prepare(`INSERT INTO templates (id,name,description,content,tramite_type,is_system) VALUES (?,?,?,?,?,?)`);
    insTpl.run('tpl1','Notificación Personal',
      'Modelo estándar para notificación personal del artículo 40 del CPC.',
      'En Santiago, a [FECHA], siendo las [HORA] horas, me constituí en el domicilio ubicado en [DIRECCION], comuna de [COMUNA], con el objeto de notificar la demanda a [DEMANDADO] en la causa Rol [ROL] del [TRIBUNAL].\n\nFui atendido por quien dijo ser el demandado, a quien entregué copias íntegras de la demanda y resolución recaída en ella.\n\nDerechos pagados: $[ARANCEL].-\n\n[RECEPTOR]\nReceptor Judicial',
      'Notificación Personal (Art. 40 CPC)',1);
    insTpl.run('tpl2','Búsqueda Art. 44',
      'Certificación de búsquedas positivas para posterior notificación por el artículo 44.',
      'En Santiago, a [FECHA], siendo las [HORA] horas, me constituí en el domicilio ubicado en [DIRECCION], comuna de [COMUNA], procediendo a realizar la búsqueda de [DEMANDADO] en la causa Rol [ROL] del [TRIBUNAL].\n\nNo habiendo sido habido en el lugar, me cercioré de que este es su morada o lugar donde ejerce su industria, profesión o empleo, por haber conversado con un adulto que se encontraba en el lugar.\n\nDerechos pagados: $[ARANCEL].-\n\n[RECEPTOR]\nReceptor Judicial',
      'Búsqueda (Art. 44 CPC)',1);
    insTpl.run('tpl3','Requerimiento de Pago',
      'Acta de requerimiento de pago en juicios ejecutivos.',
      'En Santiago, a [FECHA], siendo las [HORA] horas, requerí de pago a [DEMANDADO], en la causa Rol [ROL] del [TRIBUNAL], por la suma adeudada.\n\nEl ejecutado no efectuó el pago en el acto, por lo que se procedió a trabar embargo sobre los bienes suficientes para cubrir la deuda.\n\nDerechos pagados: $[ARANCEL].-\n\n[RECEPTOR]\nReceptor Judicial',
      'Requerimiento de Pago',1);
  });

  run();
  console.log('[DB] Seed completado.');
}

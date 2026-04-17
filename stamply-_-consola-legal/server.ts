import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { checkRateLimit, validatePdfBase64, anonymizeRuts, anonymizeAddress } from './src/server/utils.js';
import {
  dbGetClients, dbGetClient, dbCreateClient, dbUpdateClient, dbDeleteClient,
  dbGetCases, dbGetCase, dbCreateCase, dbUpdateCase, dbCheckRolExists,
  dbGetTramites, dbGetTramitesByCausa, dbCreateTramite, dbUpdateTramite, dbDeleteTramite,
  dbGetDocuments, dbCreateDocument,
  dbGetEstampes, dbCreateEstampe, dbUpdateEstampe,
  dbGetTemplates, dbCreateTemplate, dbUpdateTemplate, dbDeleteTemplate,
} from './src/db/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global state to store the centralized Google Drive tokens
// In a production app, this would be stored securely in a database
let globalGoogleTokens: any = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));
  app.use(cookieParser());

  // OAuth2 Client setup
  const getOAuth2Client = (req: express.Request) => {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectUri = `${protocol}://${host}/auth/callback`;

    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  };

  // API Routes
  app.get("/api/auth/url", (req, res) => {
    const oauth2Client = getOAuth2Client(req);
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ url });
  });

  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).send("Missing code");
    }

    try {
      const oauth2Client = getOAuth2Client(req);
      const { tokens } = await oauth2Client.getToken(code);
      
      // Store tokens globally for the entire application
      globalGoogleTokens = tokens;

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticación exitosa. Esta ventana se cerrará automáticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send("Error de autenticación");
    }
  });

  app.get("/api/auth/status", async (req, res) => {
    if (!globalGoogleTokens) {
      return res.json({ connected: false });
    }
    
    try {
      const oauth2Client = getOAuth2Client(req);
      oauth2Client.setCredentials(globalGoogleTokens);
      
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      res.json({ connected: true, email: userInfo.data.email });
    } catch (error) {
      console.error('Error fetching user info:', error);
      res.json({ connected: false });
    }
  });

  app.post("/api/auth/disconnect", (req, res) => {
    globalGoogleTokens = null;
    res.json({ success: true });
  });

  app.post("/api/drive/upload", async (req, res) => {
    if (!globalGoogleTokens) {
      return res.status(401).json({ error: "Not authenticated with Google Drive" });
    }

    try {
      const oauth2Client = getOAuth2Client(req);
      oauth2Client.setCredentials(globalGoogleTokens);

      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      const { filename, content, folderName } = req.body;

      // 1. Find or create the target folder
      let folderId = null;
      if (folderName) {
        const folderQuery = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        const folderRes = await drive.files.list({
          q: folderQuery,
          spaces: 'drive',
          fields: 'files(id, name)',
        });

        if (folderRes.data.files && folderRes.data.files.length > 0) {
          folderId = folderRes.data.files[0].id;
        } else {
          // Create the folder
          const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
          };
          const newFolder = await drive.files.create({
            requestBody: folderMetadata,
            fields: 'id',
          });
          folderId = newFolder.data.id;
        }
      }

      // 2. Upload the file
      const fileMetadata: any = {
        name: filename,
      };
      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: 'text/plain', // For simplicity, we'll upload the text content. In a real app, you'd generate a PDF.
        body: content,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      res.json({ success: true, fileId: file.data.id, link: file.data.webViewLink });
    } catch (error: any) {
      console.error('Drive upload error:', error);
      res.status(500).json({ error: error.message || "Failed to upload to Drive" });
    }
  });

  app.post("/api/ai/process", async (req, res) => {
    // 1. Rate limiting por IP
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(clientIp);
    if (!allowed) {
      return res.status(429).json({
        error: `Límite de solicitudes alcanzado. Intente nuevamente en ${Math.ceil(retryAfterMs / 1000)} segundos.`
      });
    }

    const { base64Data, mimeType } = req.body;

    // 2. Validar que sea un PDF real y no supere 10MB
    const validation = validatePdfBase64(base64Data);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = "Extrae la siguiente información legal del documento judicial adjunto. Si algún dato no existe, déjalo vacío. Proporciona un objeto JSON con: plaintiffName (Demandante), defendantName (Demandado principal), court (Tribunal), competencia (Competencia, ej. Corte Suprema, Corte Apelaciones, Civil, Laboral, Penal, Cobranza, Familia). Además, propone una lista 'defendants' (Notificados propuestos) basándote en el demandado, su domicilio y ciudad extraídos del documento, donde cada notificado tenga name (Nombre o Razón social), rut (RUT si aparece, formato 12.345.678-9), address (Domicilio), city (Comuna/Ciudad), y legalRep (Representante legal, solo si existe).";

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "application/pdf"
            }
          },
          { text: prompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plaintiffName: { type: Type.STRING },
              defendantName: { type: Type.STRING },
              court: { type: Type.STRING },
              competencia: { type: Type.STRING },
              defendants: {
                type: Type.ARRAY,
                description: "Lista de notificados propuestos",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    rut: { type: Type.STRING },
                    address: { type: Type.STRING },
                    city: { type: Type.STRING },
                    legalRep: { type: Type.STRING }
                  },
                  required: ["name"]
                }
              }
            },
            required: ["plaintiffName", "defendantName"]
          }
        }
      });

      const text = result.text?.trim() || "{}";
      const parsed = JSON.parse(text);

      // 3. Anonimizar RUTs en la respuesta antes de enviarla al cliente
      const sanitized = JSON.parse(anonymizeRuts(JSON.stringify(parsed)));
      res.json(sanitized);
    } catch (error: any) {
      console.error('AI Processing error:', error);
      // Parse Google API error messages that come as JSON strings
      let userMessage = error.message || 'Error al procesar el documento con IA.';
      try {
        const parsed = JSON.parse(userMessage);
        const googleMsg = parsed?.error?.message || parsed?.message;
        if (googleMsg) {
          if (googleMsg.includes('suspended')) {
            userMessage = 'La API key de Gemini está suspendida. Use el ingreso manual.';
          } else if (googleMsg.includes('quota')) {
            userMessage = 'Cuota de IA agotada por hoy. Use el ingreso manual.';
          } else {
            userMessage = googleMsg;
          }
        }
      } catch (_) { /* not JSON, keep original */ }
      res.status(500).json({ error: userMessage, fallback: true });
    }
  });

  app.post("/api/ai/generate-estampe", async (req, res) => {
    // 1. Rate limiting por IP
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(clientIp);
    if (!allowed) {
      return res.status(429).json({
        error: `Límite de solicitudes alcanzado. Intente nuevamente en ${Math.ceil(retryAfterMs / 1000)} segundos.`
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
    }

    const { templateContent, caseData, resultData, entityType, montoFinal } = req.body;

    // 2. Validación básica de parámetros
    if (!templateContent || !caseData || !resultData || !entityType || montoFinal === undefined) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos para generar el acta.' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // 3. Anonimizar datos sensibles antes de construir el prompt
      const safeAddress = anonymizeAddress(caseData.address || '');
      const safeDetails = anonymizeRuts(resultData.details || '');

      const prompt = `
ROLE: Eres un Arquitecto Legal experto en el sistema judicial de Chile, especializado en la redacción técnica de actas para Receptores Judiciales. Tu función es transformar plantillas base en documentos finales listos para firma, garantizando precisión gramatical y cumplimiento de aranceles.

INPUT DATA (JSON Context):
{
  "MODELO_BASE": "${(templateContent as string).replace(/"/g, '\\"')}",
  "DATA_CAUSA": {
    "ROL": "${caseData.rol}",
    "Tribunal": "${caseData.tribunal}",
    "Demandado": "${caseData.defendant}",
    "Direccion": "${safeAddress}",
    "Ciudad": "${caseData.city}",
    "Cliente": "${caseData.cliente}"
  },
  "RESULTADO_TERRENO": {
    "Fecha": "${resultData.date}",
    "Hora": "${resultData.time}",
    "Detalles": "${safeDetails.replace(/"/g, '\\"')}"
  },
  "TIPO_ENTIDAD": "${entityType}",
  "MONTO_FINAL": ${montoFinal}
}

CORE LOGIC - REGLAS DE REDACCIÓN:
1. Usa la Fecha y Hora proporcionadas en RESULTADO_TERRENO para establecer el momento exacto de la diligencia en el acta.
2. Incorpora los "Detalles" del RESULTADO_TERRENO en la redacción del acta de forma natural, técnica y coherente con el modelo (ej. quién recibió, si el lugar estaba habitado, etc.).
3. Aplica concordancia de género según TIPO_ENTIDAD:
   - MALE: Usa "don", "el demandado", "notificado", "buscado", "él".
   - FEMALE: Usa "doña", "la demandada", "notificada", "buscada", "ella".
   - CORP: Usa "la empresa demandada" o "la sociedad demandada". Refiérete a la entidad en femenino ("la notificada").
   - PLURAL: Usa "los demandados", "notificados", "ellos".

REGLAS DE COBRO (INYECCIÓN DE VALOR):
1. Busca la variable o el espacio destinado a honorarios en el MODELO_BASE.
2. Inserta el MONTO_FINAL usando el formato contable chileno: $XX.XXX.- (con punto de mil y guion final).
3. Si el modelo no especifica dónde ir, añade al final del acta una línea que diga: "Derechos: $XX.XXX.-" seguido de la glosa de impuestos si corresponde.

RESTRICCIONES FORMALES:
- Cero Ambigüedad: No utilices "/" (ej: no escribas "el/la"). Elige el término exacto.
- Lenguaje Técnico: Mantén fórmulas legales chilenas como "certifico", "constituidome en el domicilio", "proveyendo la demanda", "fe de ello".
- No Inventar: Si un dato necesario para completar una llave {{variable}} en el modelo no viene en DATA_CAUSA, mantén la llave resaltada para revisión humana.

OUTPUT:
Entrega exclusivamente el texto del acta redactada. Sin introducciones, sin explicaciones y sin notas al pie. El texto debe estar limpio para ser visualizado en un editor de texto.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite-preview-06-17",
        contents: prompt
      });

      const text = response.text || "";
      res.json({ content: text });
    } catch (error: any) {
      console.error('Error generating estampe:', error);
      let userMessage = error.message || 'Error al generar el acta.';
      try {
        const parsed = JSON.parse(userMessage);
        const googleMsg = parsed?.error?.message || parsed?.message;
        if (googleMsg) {
          if (googleMsg.includes('suspended')) userMessage = 'La API key de Gemini está suspendida.';
          else if (googleMsg.includes('quota')) userMessage = 'Cuota de IA agotada por hoy.';
          else userMessage = googleMsg;
        }
      } catch (_) { /* not JSON */ }
      res.status(500).json({ error: userMessage });
    }
  });

  // ─── REST API — Base de datos SQLite ─────────────────────────────────────
  // Todos los endpoints siguen el patrón: GET /api/:recurso → list, POST → create,
  // GET /api/:recurso/:id → get, PUT → update, DELETE → delete.
  // Para migrar a Supabase: reemplazar las funciones db* en src/db/index.ts.

  // CLIENTES
  app.get('/api/clients', (_req, res) => {
    try { res.json(dbGetClients()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/clients/:id', (req, res) => {
    const c = dbGetClient(req.params.id);
    c ? res.json(c) : res.status(404).json({ error: 'Cliente no encontrado.' });
  });
  app.post('/api/clients', (req, res) => {
    try { res.status(201).json(dbCreateClient(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put('/api/clients/:id', (req, res) => {
    try { res.json(dbUpdateClient(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete('/api/clients/:id', (req, res) => {
    try { dbDeleteClient(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // CAUSAS
  app.get('/api/cases', (_req, res) => {
    try { res.json(dbGetCases()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/cases/check-rol', (req, res) => {
    const rol = req.query.rol as string;
    if (!rol) return res.status(400).json({ error: 'Parámetro rol requerido.' });
    const found = dbCheckRolExists(rol.trim());
    res.json({ exists: !!found, case: found || null });
  });
  app.get('/api/cases/:id', (req, res) => {
    const c = dbGetCase(req.params.id);
    c ? res.json(c) : res.status(404).json({ error: 'Causa no encontrada.' });
  });
  app.post('/api/cases', (req, res) => {
    try {
      // Verificar unicidad de ROL antes de insertar
      const existing = dbCheckRolExists(req.body.rol?.trim());
      if (existing) return res.status(409).json({ error: `La causa ROL ${req.body.rol} ya existe.`, case: existing });
      res.status(201).json(dbCreateCase(req.body));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put('/api/cases/:id', (req, res) => {
    try { res.json(dbUpdateCase(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // TRÁMITES
  app.get('/api/tramites', (_req, res) => {
    try { res.json(dbGetTramites()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/cases/:causaId/tramites', (req, res) => {
    try { res.json(dbGetTramitesByCausa(req.params.causaId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/tramites', (req, res) => {
    try { res.status(201).json(dbCreateTramite(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put('/api/tramites/:id', (req, res) => {
    try { res.json(dbUpdateTramite(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete('/api/tramites/:id', (req, res) => {
    try { dbDeleteTramite(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // DOCUMENTOS
  app.get('/api/documents', (_req, res) => {
    try { res.json(dbGetDocuments()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/documents', (req, res) => {
    try { res.status(201).json(dbCreateDocument(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ESTAMPES
  app.get('/api/estampes', (_req, res) => {
    try { res.json(dbGetEstampes()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/estampes', (req, res) => {
    try { res.status(201).json(dbCreateEstampe(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put('/api/estampes/:id', (req, res) => {
    try { res.json(dbUpdateEstampe(req.params.id, req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PLANTILLAS
  app.get('/api/templates', (_req, res) => {
    try { res.json(dbGetTemplates()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/templates', (req, res) => {
    try { res.status(201).json(dbCreateTemplate(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put('/api/templates/:id', (req, res) => {
    try { dbUpdateTemplate(req.params.id, req.body); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete('/api/templates/:id', (req, res) => {
    try { dbDeleteTemplate(req.params.id); res.json({ ok: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

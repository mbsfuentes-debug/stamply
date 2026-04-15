import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global state to store the centralized Google Drive tokens
// In a production app, this would be stored securely in a database
let globalGoogleTokens: any = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
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

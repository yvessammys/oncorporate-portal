// Setup script — creates Google Sheet, Drive folder, and Apps Script project
// Uses the clasp OAuth credentials for authentication

const fs = require('fs');
const path = require('path');
const http = require('http');
const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.deployments',
];

// Use clasp's OAuth client credentials
const CLIENT_ID = '1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com';
const CLIENT_SECRET = 'v6V3fKV_zWU7iw1DrpO1rknX';

async function main() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3333');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n=== Portal Constituição — Setup ===\n');
  console.log('A abrir browser para autorização...\n');

  // Open browser
  const { exec } = require('child_process');
  exec(`start "" "${authUrl}"`);

  // Wait for callback
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost:3333');
      const code = url.searchParams.get('code');
      if (code) {
        res.end('Autorizado! Pode fechar esta janela.');
        server.close();
        resolve(code);
      }
    });
    server.listen(3333);
    console.log('A aguardar autorização...');
  });

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  const script = google.script({ version: 'v1', auth: oauth2Client });

  // 1. Create Drive folder
  console.log('\n1. A criar pasta no Google Drive...');
  const folderRes = await drive.files.create({
    requestBody: {
      name: 'Constituições - Portal',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });
  const folderId = folderRes.data.id;
  console.log(`   Pasta criada: ${folderId}`);

  // 2. Create Google Sheet
  console.log('2. A criar Google Sheet...');
  const sheetRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'Portal Constituições' },
    },
  });
  const spreadsheetId = sheetRes.data.spreadsheetId;
  console.log(`   Sheet criada: ${spreadsheetId}`);

  // 3. Create Apps Script project
  console.log('3. A criar projeto Apps Script...');
  const scriptRes = await script.projects.create({
    requestBody: {
      title: 'Portal Constituição Backend',
    },
  });
  const scriptId = scriptRes.data.scriptId;
  console.log(`   Script criado: ${scriptId}`);

  // 4. Read the GS files and push them
  console.log('4. A enviar código para o Apps Script...');

  const codeGs = fs.readFileSync(path.join(__dirname, 'google-apps-script', 'Code.gs'), 'utf8');
  const claudeGs = fs.readFileSync(path.join(__dirname, 'google-apps-script', 'ClaudeExtraction.gs'), 'utf8');
  const fileUploadGs = fs.readFileSync(path.join(__dirname, 'google-apps-script', 'FileUpload.gs'), 'utf8');

  // Replace placeholders in Code.gs
  const codeGsUpdated = codeGs
    .replace("'YOUR_SPREADSHEET_ID_HERE'", `'${spreadsheetId}'`)
    .replace("'YOUR_DRIVE_FOLDER_ID_HERE'", `'${folderId}'`);

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: {
      files: [
        { name: 'Code', type: 'SERVER_JS', source: codeGsUpdated },
        { name: 'ClaudeExtraction', type: 'SERVER_JS', source: claudeGs },
        { name: 'FileUpload', type: 'SERVER_JS', source: fileUploadGs },
        { name: 'appsscript', type: 'JSON', source: JSON.stringify({
          timeZone: 'Europe/Lisbon',
          dependencies: {},
          webapp: {
            access: 'ANYONE_ANONYMOUS',
            executeAs: 'USER_DEPLOYING',
          },
          exceptionLogging: 'STACKDRIVER',
          runtimeVersion: 'V8',
          oauthScopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/script.external_request',
            'https://www.googleapis.com/auth/script.send_mail',
          ],
        }, null, 2) },
      ],
    },
  });
  console.log('   Código enviado!');

  // 5. Create deployment
  console.log('5. A fazer deploy...');
  const deployRes = await script.projects.deployments.create({
    scriptId: scriptId,
    requestBody: {
      versionNumber: null,
      description: 'Portal v1',
      manifestFileName: 'appsscript',
    },
  });

  // The web app URL follows a standard pattern
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;

  // Save config
  const config = {
    folderId,
    spreadsheetId,
    scriptId,
    webAppUrl,
    folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    scriptUrl: `https://script.google.com/d/${scriptId}/edit`,
  };

  fs.writeFileSync(path.join(__dirname, 'setup-config.json'), JSON.stringify(config, null, 2));

  console.log('\n=== SETUP COMPLETO ===\n');
  console.log(`Pasta Drive:    ${config.folderUrl}`);
  console.log(`Google Sheet:   ${config.sheetUrl}`);
  console.log(`Apps Script:    ${config.scriptUrl}`);
  console.log(`Web App URL:    ${webAppUrl}`);
  console.log(`\nConfig guardado em setup-config.json`);

  // 6. Update app.js with the web app URL
  const appJsPath = path.join(__dirname, 'js', 'app.js');
  let appJs = fs.readFileSync(appJsPath, 'utf8');
  appJs = appJs.replace("'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'", `'${webAppUrl}'`);
  fs.writeFileSync(appJsPath, appJs);
  console.log('\napp.js atualizado com a URL do Web App!');

  console.log('\n⚠ IMPORTANTE: Abra o link do Apps Script acima e faça:');
  console.log('   Deploy > New deployment > Web App > Execute as: Me > Anyone');
  console.log('   (O deploy programático requer versão publicada manualmente)');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});

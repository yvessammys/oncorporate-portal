// ==========================================
// Google Apps Script — Backend do Portal
// ==========================================
// INSTRUÇÕES DE SETUP:
// 1. Vá a https://script.google.com e crie um novo projeto
// 2. Cole este código no editor
// 3. Crie uma Google Sheet e copie o ID (da URL)
// 4. Crie uma pasta no Google Drive para os documentos e copie o ID
// 5. Substitua os IDs abaixo
// 6. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone
// 7. Copie a URL do deploy e cole no app.js (APPS_SCRIPT_URL)

// ========== CONFIGURAÇÃO ==========
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';  // ID da Google Sheet
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE'; // ID da pasta no Google Drive
const NOTIFICATION_EMAIL = 'yves@oncorporate.com';    // Email para notificações

// ========== HANDLER ==========
function doPost(e) {
  try {
    // All requests come as JSON from the frontend
    if (!e.postData || e.postData.type !== 'application/json') {
      return jsonResponse({ status: 'error', message: 'Expected JSON request' });
    }

    const payload = JSON.parse(e.postData.contents);

    // Route by action
    switch (payload.action) {

      // === FORM SUBMISSION ===
      case 'submitForm':
        return handleFormSubmission(payload.data);

      // === DOCUMENT EXTRACTION (Smart Upload) ===
      case 'extractDocument': {
        const extracted = extractDocumentWithClaude(payload.base64Data, payload.mimeType);
        const fileId = saveExtractedFileToDrive(payload.base64Data, payload.mimeType, payload.fileName || 'document');
        return jsonResponse({ status: 'success', extraction: extracted, fileId: fileId });
      }

      // === FILE UPLOAD (after form submission) ===
      case 'uploadFiles':
        return doPostFiles(e);

      // === MOVE PENDING FILES ===
      case 'movePendingFiles':
        movePendingFiles(payload.fileIds, payload.clientFolderId);
        return jsonResponse({ status: 'success' });

      default:
        return jsonResponse({ status: 'error', message: 'Unknown action: ' + payload.action });
    }

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

// ========== FORM SUBMISSION HANDLER ==========
function handleFormSubmission(data) {
  // Create folder structure in Drive
  const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const companyName = data.company_name_1 || 'Sem_Nome';
  const timestamp = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'yyyy-MM-dd_HH-mm');
  const folderName = `${timestamp}_${sanitizeName(companyName)}`;
  const clientFolder = parentFolder.createFolder(folderName);

  // Create subfolders
  clientFolder.createFolder('docs_socios');
  clientFolder.createFolder('docs_gerentes');
  clientFolder.createFolder('documentos_gerados');

  // Save form data as JSON
  const jsonBlob = Utilities.newBlob(
    JSON.stringify(data, null, 2),
    'application/json',
    'formulario.json'
  );
  clientFolder.createFile(jsonBlob);

  // Save to spreadsheet
  saveToSheet(data, clientFolder.getUrl());

  // Send notification email
  sendNotification(data, clientFolder.getUrl());

  // Return folder ID so frontend can upload files to it
  return jsonResponse({
    status: 'success',
    folder: clientFolder.getUrl(),
    folderId: clientFolder.getId()
  });
}

// ========== JSON RESPONSE HELPER ==========
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Health check & CORS (Google Apps Script handles CORS automatically for web apps)
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Portal de Constituição API', version: '1.0' });
}

// ========== SAVE TO SHEET ==========
function saveToSheet(data, folderUrl) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Constituições');

  // Create sheet with headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Constituições');
    sheet.appendRow([
      'Data Submissão',
      'Contacto',
      'Email',
      'Telefone',
      'Nome 1',
      'Nome 2',
      'Nome 3',
      'CAE',
      'Capital Social',
      'Nº Sócios',
      'Nº Gerentes',
      'Documentos Necessários',
      'Notas',
      'Pasta Drive',
      'Status'
    ]);
    // Format header
    sheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  // Count shareholders and managers
  let shCount = 0;
  let mgCount = 0;
  Object.keys(data).forEach(key => {
    if (key.match(/^sh_type_\d+$/)) shCount++;
    if (key.match(/^mg_name_\d+$/)) mgCount++;
  });

  // Append row
  sheet.appendRow([
    Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM/yyyy HH:mm'),
    data.client_name || '',
    data.client_email || '',
    data.client_phone || '',
    data.company_name_1 || '',
    data.company_name_2 || '',
    data.company_name_3 || '',
    data.company_cae || '',
    data.company_capital || '',
    shCount,
    mgCount,
    data.required_documents || '',
    data.notes || '',
    folderUrl,
    'Novo'
  ]);

  // Also save detailed shareholder/manager data in a second sheet
  saveDetailedData(ss, data);
}

// ========== DETAILED DATA SHEET ==========
function saveDetailedData(ss, data) {
  let sheet = ss.getSheetByName('Detalhes');
  if (!sheet) {
    sheet = ss.insertSheet('Detalhes');
    sheet.appendRow([
      'Data', 'Sociedade', 'Tipo Entidade', 'Papel',
      'Tipo Pessoa', 'Residência', 'Nome/Firma',
      'Nacionalidade/País', 'Estado Civil', 'Nº Documento',
      'Entidade Emissora', 'Emissão', 'Validade',
      'Morada', 'Tem NIF', 'NIF/NIPC',
      'Rep. Fiscal', 'Quota (€)', '%'
    ]);
    sheet.getRange(1, 1, 1, 19).setFontWeight('bold').setBackground('#16a34a').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  const date = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM/yyyy');
  const society = data.company_name_1 || '';

  // Shareholders
  for (let i = 1; i <= 20; i++) {
    const type = data[`sh_type_${i}`];
    if (!type) continue;

    const isIndividual = type === 'individual';
    sheet.appendRow([
      date, society, type, 'Sócio',
      isIndividual ? 'Pessoa Singular' : 'Pessoa Coletiva',
      data[`sh_residence_${i}`] || '',
      isIndividual ? (data[`sh_name_${i}`] || '') : (data[`sh_corp_name_${i}`] || ''),
      isIndividual ? (data[`sh_nationality_${i}`] || '') : (data[`sh_corp_country_${i}`] || ''),
      isIndividual ? (data[`sh_civil_status_${i}`] || '') : '',
      isIndividual ? (data[`sh_doc_number_${i}`] || '') : (data[`sh_corp_reg_${i}`] || ''),
      data[`sh_doc_issuer_${i}`] || '',
      data[`sh_doc_issue_${i}`] || '',
      data[`sh_doc_expiry_${i}`] || '',
      isIndividual ? (data[`sh_address_${i}`] || '') : (data[`sh_corp_address_${i}`] || ''),
      data[`sh_has_nif_${i}`] || '',
      data[`sh_nif_${i}`] || '',
      data[`sh_rep_fiscal_${i}`] || '',
      data[`sh_quota_${i}`] || '',
      data[`sh_percentage_${i}`] || ''
    ]);
  }

  // Managers
  for (let i = 1; i <= 10; i++) {
    const name = data[`mg_name_${i}`];
    if (!name) continue;

    sheet.appendRow([
      date, society, 'individual', 'Gerente',
      'Pessoa Singular',
      data[`mg_residence_${i}`] || '',
      name,
      data[`mg_nationality_${i}`] || '',
      data[`mg_civil_status_${i}`] || '',
      data[`mg_doc_number_${i}`] || '',
      data[`mg_doc_issuer_${i}`] || '',
      data[`mg_doc_issue_${i}`] || '',
      data[`mg_doc_expiry_${i}`] || '',
      data[`mg_address_${i}`] || '',
      data[`mg_has_nif_${i}`] || '',
      data[`mg_nif_${i}`] || '',
      data[`mg_rep_fiscal_${i}`] || '',
      '', ''
    ]);
  }
}

// ========== NOTIFICATION EMAIL ==========
function sendNotification(data, folderUrl) {
  const companyName = data.company_name_1 || 'N/A';
  const clientName = data.client_name || 'N/A';
  const clientEmail = data.client_email || 'N/A';
  const requiredDocs = data.required_documents ? JSON.parse(data.required_documents) : [];

  const subject = `Nova Constituição: ${companyName} — Portal`;

  let body = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a1a2e">Nova Submissão — Constituição de Sociedade</h2>

      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Contacto</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${clientName}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Email</td><td style="padding:8px;border-bottom:1px solid #eee">${clientEmail}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">1ª Opção Nome</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${companyName}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">2ª Opção Nome</td><td style="padding:8px;border-bottom:1px solid #eee">${data.company_name_2 || 'N/A'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">3ª Opção Nome</td><td style="padding:8px;border-bottom:1px solid #eee">${data.company_name_3 || 'N/A'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Capital Social</td><td style="padding:8px;border-bottom:1px solid #eee">€${data.company_capital || 'N/A'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">CAE</td><td style="padding:8px;border-bottom:1px solid #eee">${data.company_cae || 'A definir'}</td></tr>
      </table>

      <h3 style="color:#2563eb">Documentos a Preparar:</h3>
      <ul>
        ${requiredDocs.map(d => `<li>${d}</li>`).join('')}
      </ul>

      <p><a href="${folderUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px">Abrir Pasta no Google Drive</a></p>

      <p style="color:#999;font-size:12px;margin-top:24px">Enviado automaticamente pelo Portal de Constituição OnCorporate.</p>
    </div>
  `;

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    htmlBody: body
  });

  // Send confirmation to client
  if (data.client_email) {
    const clientSubject = `Recebemos o seu pedido — ${companyName}`;
    const clientBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a1a2e">Obrigado pela sua submissão!</h2>
        <p>Recebemos as informações para a constituição da sociedade <strong>${companyName}</strong>.</p>
        <p>A nossa equipa irá analisar os dados e documentos enviados e entrará em contacto consigo em breve com os próximos passos.</p>
        <p>Se tiver alguma dúvida, não hesite em contactar-nos.</p>
        <br>
        <p>Com os melhores cumprimentos,<br><strong>OnCorporate</strong></p>
      </div>
    `;
    MailApp.sendEmail({
      to: data.client_email,
      subject: clientSubject,
      htmlBody: clientBody
    });
  }
}

// ========== HELPERS ==========
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
}

// ========== FILE UPLOAD HANDLER ==========
// Note: Google Apps Script Web Apps have limitations with file uploads via fetch.
// For file uploads, we use a different approach: the form submits files as base64.
// Alternative: Use Google Picker API or direct Drive upload from client side.
//
// ENHANCED FILE UPLOAD: Add this function and use Google Drive API on client side
// for large files. For the MVP, files can be sent via email or uploaded manually.

function processFileUpload(folder, fileName, base64Data, mimeType) {
  try {
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    folder.createFile(blob);
    return true;
  } catch (e) {
    Logger.log('File upload error: ' + e.toString());
    return false;
  }
}

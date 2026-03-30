// ==========================================
// PORTAL CONSTITUIÇÃO — BACKEND (v2)
// ==========================================
// Os IDs já estão configurados. NÃO corra o setup de novo.
// ==========================================

var SPREADSHEET_ID = '1re4BxXii9vZSOH8pPy-13NASudGGCwbS7on26GMshzk';
var DRIVE_FOLDER_ID = '1UOieVkc8XITCY4idloVYH2aFcqAxUiIp';
var NOTIFICATION_EMAIL = 'yvessammy@hotmail.com';
var CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
var CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ==========================================
// HANDLER PRINCIPAL
// ==========================================
function doPost(e) {
  try {
    if (!e.postData) {
      return jsonResponse({ status: 'error', message: 'No data received' });
    }
    var payload = JSON.parse(e.postData.contents);

    switch (payload.action) {
      case 'submitForm':
        return handleFormSubmission(payload.data);
      case 'extractDocument':
        var extracted = extractDocumentWithClaude(payload.base64Data, payload.mimeType);
        var fileId = saveExtractedFileToDrive(payload.base64Data, payload.mimeType, payload.fileName || 'document');
        return jsonResponse({ status: 'success', extraction: extracted, fileId: fileId });
      case 'uploadFiles':
        return doPostFiles(e);
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

function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Portal de Constituicao API', version: '2.0' });
}

function handleFormSubmission(data) {
  var parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var clientName = data.client_name || 'Sem_Nome';
  var folderName = sanitizeName(clientName);
  var clientFolder = parentFolder.createFolder(folderName);
  clientFolder.createFolder('docs_socios');
  clientFolder.createFolder('docs_gerentes');
  clientFolder.createFolder('documentos_gerados');

  var jsonBlob = Utilities.newBlob(JSON.stringify(data, null, 2), 'application/json', 'formulario.json');
  clientFolder.createFile(jsonBlob);
  saveToSheet(data, clientFolder.getUrl());

  // Create dedicated client data spreadsheet
  try {
    createClientSpreadsheet(data, clientFolder);
  } catch (ssErr) {
    Logger.log('Client spreadsheet creation error (non-fatal): ' + ssErr.toString());
  }

  sendNotification(data, clientFolder.getUrl());

  // Generate legal documents from templates
  try {
    generateDocuments(data, clientFolder);
  } catch (docErr) {
    Logger.log('Document generation error (non-fatal): ' + docErr.toString());
  }

  return jsonResponse({ status: 'success', folder: clientFolder.getUrl(), folderId: clientFolder.getId() });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// SPREADSHEET
// ==========================================
function saveToSheet(data, folderUrl) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Constituicoes');
  if (!sheet) {
    sheet = ss.insertSheet('Constituicoes');
    sheet.appendRow(['Data Submissao','Contacto','Email','Telefone','Nome 1','Nome 2','Nome 3','CAE','Capital Social','N Socios','N Gerentes','Documentos Necessarios','Notas','Pasta Drive','Status']);
    sheet.getRange(1,1,1,15).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  var shCount = 0, mgCount = 0;
  Object.keys(data).forEach(function(key) {
    if (key.match(/^sh_type_\d+$/)) shCount++;
    if (key.match(/^mg_name_\d+$/)) mgCount++;
  });
  sheet.appendRow([
    Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM/yyyy HH:mm'),
    data.client_name||'', data.client_email||'', data.client_phone||'',
    data.company_name_1||'', data.company_name_2||'', data.company_name_3||'',
    data.company_cae||'', data.company_capital||'',
    shCount, mgCount, data.required_documents||'', data.notes||'', folderUrl, 'Novo'
  ]);
  saveDetailedData(ss, data);
}

function saveDetailedData(ss, data) {
  var sheet = ss.getSheetByName('Detalhes');
  if (!sheet) {
    sheet = ss.insertSheet('Detalhes');
    sheet.appendRow(['Data','Sociedade','Tipo Entidade','Papel','Tipo Pessoa','Residencia','Nome/Firma','Nacionalidade/Pais','Estado Civil','N Documento','Entidade Emissora','Emissao','Validade','Morada','Tem NIF','NIF/NIPC','Rep. Fiscal','Quota','%']);
    sheet.getRange(1,1,1,19).setFontWeight('bold').setBackground('#16a34a').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  var date = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM/yyyy');
  var society = data.company_name_1 || '';
  for (var i = 1; i <= 20; i++) {
    var type = data['sh_type_' + i];
    if (!type) continue;
    var isInd = type === 'individual';
    sheet.appendRow([date, society, type, 'Socio', isInd?'Pessoa Singular':'Pessoa Coletiva',
      data['sh_residence_'+i]||'', isInd?(data['sh_name_'+i]||''):(data['sh_corp_name_'+i]||''),
      isInd?(data['sh_nationality_'+i]||''):(data['sh_corp_country_'+i]||''),
      isInd?(data['sh_civil_status_'+i]||''):'',
      isInd?(data['sh_doc_number_'+i]||''):(data['sh_corp_reg_'+i]||''),
      data['sh_doc_issuer_'+i]||'', data['sh_doc_issue_'+i]||'', data['sh_doc_expiry_'+i]||'',
      isInd?(data['sh_address_'+i]||''):(data['sh_corp_address_'+i]||''),
      data['sh_has_nif_'+i]||'', data['sh_nif_'+i]||'', data['sh_rep_fiscal_'+i]||'',
      data['sh_quota_'+i]||'', data['sh_percentage_'+i]||''
    ]);
  }
  for (var j = 1; j <= 10; j++) {
    var name = data['mg_name_' + j];
    if (!name) continue;
    sheet.appendRow([date, society, 'individual', 'Gerente', 'Pessoa Singular',
      data['mg_residence_'+j]||'', name, data['mg_nationality_'+j]||'',
      data['mg_civil_status_'+j]||'', data['mg_doc_number_'+j]||'',
      data['mg_doc_issuer_'+j]||'', data['mg_doc_issue_'+j]||'', data['mg_doc_expiry_'+j]||'',
      data['mg_address_'+j]||'', data['mg_has_nif_'+j]||'', data['mg_nif_'+j]||'',
      data['mg_rep_fiscal_'+j]||'', '', ''
    ]);
  }
}

// ==========================================
// CLIENT DATA SPREADSHEET (per submission)
// ==========================================

/**
 * Creates a dedicated Google Spreadsheet with all client data,
 * organized across multiple tabs, saved in the client's Drive folder.
 */
function createClientSpreadsheet(data, clientFolder) {
  var clientName = data.client_name || 'Sem_Nome';
  var ss = SpreadsheetApp.create('Dados_' + clientName);
  var ssFile = DriveApp.getFileById(ss.getId());
  clientFolder.addFile(ssFile);
  DriveApp.getRootFolder().removeFile(ssFile);

  var HEADER_BG = '#6C3CE1';
  var HEADER_COLOR = '#FFFFFF';
  var BORDER_COLOR = '#D0D0D0';

  // -------------------------------------------------------
  // Helper: apply header style to a range
  // -------------------------------------------------------
  function styleHeader(sheet, row, col, numCols) {
    var range = sheet.getRange(row, col, 1, numCols);
    range.setFontWeight('bold')
         .setBackground(HEADER_BG)
         .setFontColor(HEADER_COLOR)
         .setHorizontalAlignment('left');
  }

  // -------------------------------------------------------
  // Helper: apply borders to a data range
  // -------------------------------------------------------
  function applyBorders(sheet, startRow, startCol, numRows, numCols) {
    if (numRows < 1 || numCols < 1) return;
    var range = sheet.getRange(startRow, startCol, numRows, numCols);
    range.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  }

  // -------------------------------------------------------
  // Helper: write a label-value pair row
  // -------------------------------------------------------
  function writeField(sheet, row, label, value) {
    sheet.getRange(row, 1).setValue(label).setFontWeight('bold');
    sheet.getRange(row, 2).setValue(value || '');
    return row + 1;
  }

  // -------------------------------------------------------
  // Helper: write a section header spanning 2 columns
  // -------------------------------------------------------
  function writeSectionHeader(sheet, row, title) {
    sheet.getRange(row, 1, 1, 2).merge();
    sheet.getRange(row, 1).setValue(title);
    styleHeader(sheet, row, 1, 2);
    return row + 1;
  }

  // -------------------------------------------------------
  // TAB 1: Dados Gerais
  // -------------------------------------------------------
  var tab1 = ss.getSheetByName('Sheet1') || ss.insertSheet('Dados Gerais');
  tab1.setName('Dados Gerais');

  var submissionDate = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM/yyyy HH:mm');
  var r = 1;
  r = writeSectionHeader(tab1, r, 'Informacoes do Contacto');
  var dataStartRow = r;
  r = writeField(tab1, r, 'Nome do Contacto', data.client_name || '');
  r = writeField(tab1, r, 'Email', data.client_email || '');
  r = writeField(tab1, r, 'Telefone', data.client_phone || '');
  r = writeField(tab1, r, 'Data de Submissao', submissionDate);
  r++;

  r = writeSectionHeader(tab1, r, 'Dados da Sociedade');
  r = writeField(tab1, r, '1a Opcao de Nome', data.company_name_1 || '');
  r = writeField(tab1, r, '2a Opcao de Nome', data.company_name_2 || '');
  r = writeField(tab1, r, '3a Opcao de Nome', data.company_name_3 || '');
  r = writeField(tab1, r, 'Descricao de Atividades', data.company_activities || data.company_cae || '');
  r = writeField(tab1, r, 'Capital Social', data.company_capital || '');
  r = writeField(tab1, r, 'Notas', data.notes || '');

  applyBorders(tab1, 1, 1, r - 1, 2);
  tab1.setColumnWidth(1, 220);
  tab1.setColumnWidth(2, 400);

  // -------------------------------------------------------
  // TAB 2: Socios
  // -------------------------------------------------------
  var tab2 = ss.insertSheet('Socios');
  var r2 = 1;

  for (var si = 1; si <= 20; si++) {
    var shType = data['sh_type_' + si];
    if (!shType) continue;

    var isIndividual = shType === 'individual';
    var shLabel = isIndividual ? 'Socio ' + si + ' (Pessoa Singular)' : 'Socio ' + si + ' (Pessoa Coletiva)';
    r2 = writeSectionHeader(tab2, r2, shLabel);

    if (isIndividual) {
      r2 = writeField(tab2, r2, 'Nome', data['sh_name_' + si] || '');
      r2 = writeField(tab2, r2, 'Nacionalidade', data['sh_nationality_' + si] || '');
      r2 = writeField(tab2, r2, 'Naturalidade', data['sh_birthplace_' + si] || '');
      r2 = writeField(tab2, r2, 'Data de Nascimento', data['sh_dob_' + si] || '');
      r2 = writeField(tab2, r2, 'N. Documento', data['sh_doc_number_' + si] || '');
      r2 = writeField(tab2, r2, 'Entidade Emissora', data['sh_doc_issuer_' + si] || '');
      r2 = writeField(tab2, r2, 'Data de Emissao', data['sh_doc_issue_' + si] || '');
      r2 = writeField(tab2, r2, 'Data de Validade', data['sh_doc_expiry_' + si] || '');
      r2 = writeField(tab2, r2, 'Morada', data['sh_address_' + si] || '');
      r2 = writeField(tab2, r2, 'Tem NIF', data['sh_has_nif_' + si] || '');
      r2 = writeField(tab2, r2, 'NIF', data['sh_nif_' + si] || '');
      r2 = writeField(tab2, r2, 'Residencia', data['sh_residence_' + si] || '');
      r2 = writeField(tab2, r2, 'Quota (EUR)', data['sh_quota_' + si] || '');
      r2 = writeField(tab2, r2, 'Percentagem (%)', data['sh_percentage_' + si] || '');
    } else {
      // Corporate shareholder
      r2 = writeField(tab2, r2, 'Nome da Empresa', data['sh_corp_name_' + si] || '');
      r2 = writeField(tab2, r2, 'Tipo de Empresa', data['sh_corp_type_' + si] || '');
      r2 = writeField(tab2, r2, 'Pais', data['sh_corp_country_' + si] || '');
      r2 = writeField(tab2, r2, 'N. Registo', data['sh_corp_reg_' + si] || '');
      r2 = writeField(tab2, r2, 'Morada', data['sh_corp_address_' + si] || '');
      r2 = writeField(tab2, r2, 'Tem NIF', data['sh_has_nif_' + si] || '');
      r2 = writeField(tab2, r2, 'NIF/NIPC', data['sh_nif_' + si] || '');
      r2 = writeField(tab2, r2, 'Quota (EUR)', data['sh_quota_' + si] || '');
      r2 = writeField(tab2, r2, 'Percentagem (%)', data['sh_percentage_' + si] || '');

      // Legal Representative
      r2++;
      r2 = writeSectionHeader(tab2, r2, 'Representante Legal - Socio ' + si);
      r2 = writeField(tab2, r2, 'Nome', data['sh_corp_representative_name_' + si] || '');
      r2 = writeField(tab2, r2, 'Passaporte', data['sh_corp_representative_passport_' + si] || '');
      r2 = writeField(tab2, r2, 'Nacionalidade', data['sh_corp_representative_nationality_' + si] || '');
      r2 = writeField(tab2, r2, 'Morada', data['sh_corp_representative_address_' + si] || '');

      // UBO (Ultimate Beneficial Owner)
      r2++;
      r2 = writeSectionHeader(tab2, r2, 'Beneficiario Efetivo (UBO) - Socio ' + si);
      r2 = writeField(tab2, r2, 'Nome', data['sh_ubo_name_' + si] || '');
      r2 = writeField(tab2, r2, 'Data de Nascimento', data['sh_ubo_dob_' + si] || '');
      r2 = writeField(tab2, r2, 'N. Documento', data['sh_ubo_doc_number_' + si] || '');
      r2 = writeField(tab2, r2, 'NIF Portugues', data['sh_ubo_pt_nif_' + si] || '');
      r2 = writeField(tab2, r2, 'NIF Estrangeiro', data['sh_ubo_foreign_nif_' + si] || '');
      r2 = writeField(tab2, r2, 'Nacionalidade', data['sh_ubo_nationality_' + si] || '');
      r2 = writeField(tab2, r2, 'Naturalidade', data['sh_ubo_birthplace_' + si] || '');
      r2 = writeField(tab2, r2, 'Morada', data['sh_ubo_address_' + si] || '');
    }

    r2++; // blank row between shareholders
  }

  if (r2 > 1) {
    applyBorders(tab2, 1, 1, r2 - 1, 2);
  }
  tab2.setColumnWidth(1, 220);
  tab2.setColumnWidth(2, 400);

  // -------------------------------------------------------
  // TAB 3: Gerentes
  // -------------------------------------------------------
  var tab3 = ss.insertSheet('Gerentes');
  var r3 = 1;

  for (var mi = 1; mi <= 10; mi++) {
    var mgName = data['mg_name_' + mi];
    if (!mgName) continue;

    r3 = writeSectionHeader(tab3, r3, 'Gerente ' + mi);
    r3 = writeField(tab3, r3, 'Nome', mgName);
    r3 = writeField(tab3, r3, 'Nacionalidade', data['mg_nationality_' + mi] || '');
    r3 = writeField(tab3, r3, 'Naturalidade', data['mg_birthplace_' + mi] || '');
    r3 = writeField(tab3, r3, 'Data de Nascimento', data['mg_dob_' + mi] || '');
    r3 = writeField(tab3, r3, 'Estado Civil', data['mg_civil_status_' + mi] || '');
    r3 = writeField(tab3, r3, 'N. Documento', data['mg_doc_number_' + mi] || '');
    r3 = writeField(tab3, r3, 'Entidade Emissora', data['mg_doc_issuer_' + mi] || '');
    r3 = writeField(tab3, r3, 'Data de Emissao', data['mg_doc_issue_' + mi] || '');
    r3 = writeField(tab3, r3, 'Data de Validade', data['mg_doc_expiry_' + mi] || '');
    r3 = writeField(tab3, r3, 'Morada', data['mg_address_' + mi] || '');
    r3 = writeField(tab3, r3, 'Residencia', data['mg_residence_' + mi] || '');
    r3 = writeField(tab3, r3, 'Tem NIF', data['mg_has_nif_' + mi] || '');
    r3 = writeField(tab3, r3, 'NIF', data['mg_nif_' + mi] || '');
    r3++; // blank row between managers
  }

  if (r3 > 1) {
    applyBorders(tab3, 1, 1, r3 - 1, 2);
  }
  tab3.setColumnWidth(1, 220);
  tab3.setColumnWidth(2, 400);

  // -------------------------------------------------------
  // TAB 4: Resumo Documentos
  // -------------------------------------------------------
  var tab4 = ss.insertSheet('Resumo Documentos');
  var r4 = 1;

  r4 = writeSectionHeader(tab4, r4, 'Documentos a Preparar');

  var requiredDocs = [];
  try {
    requiredDocs = data.required_documents ? JSON.parse(data.required_documents) : [];
  } catch (e) {
    if (data.required_documents) {
      requiredDocs = [data.required_documents];
    }
  }

  if (requiredDocs.length > 0) {
    for (var di = 0; di < requiredDocs.length; di++) {
      tab4.getRange(r4, 1).setValue(di + 1);
      tab4.getRange(r4, 2).setValue(requiredDocs[di]);
      r4++;
    }
  } else {
    r4 = writeField(tab4, r4, '-', 'Nenhum documento especificado');
  }

  r4++;
  r4 = writeSectionHeader(tab4, r4, 'Custos Estimados');

  var costs = [];
  try {
    costs = data.costs ? JSON.parse(data.costs) : [];
  } catch (e) {}

  if (costs.length > 0) {
    for (var ci = 0; ci < costs.length; ci++) {
      var costItem = costs[ci];
      var costLabel = costItem.description || costItem.label || ('Item ' + (ci + 1));
      var costValue = costItem.value || costItem.amount || '';
      tab4.getRange(r4, 1).setValue(costLabel).setFontWeight('bold');
      tab4.getRange(r4, 2).setValue(costValue);
      r4++;
    }
  } else {
    r4 = writeField(tab4, r4, '-', 'Sem custos registados');
  }

  if (r4 > 1) {
    applyBorders(tab4, 1, 1, r4 - 1, 2);
  }
  tab4.setColumnWidth(1, 220);
  tab4.setColumnWidth(2, 400);

  Logger.log('Created client spreadsheet: Dados_' + clientName + ' in folder ' + clientFolder.getName());
  return ss;
}

// ==========================================
// EMAIL NOTIFICATIONS
// ==========================================
function sendNotification(data, folderUrl) {
  var companyName = data.company_name_1 || 'N/A';
  var clientName = data.client_name || 'N/A';
  var clientEmail = data.client_email || 'N/A';
  var requiredDocs = [];
  try { requiredDocs = data.required_documents ? JSON.parse(data.required_documents) : []; } catch(e) {}

  var body = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">'
    + '<h2 style="color:#1a1a2e">Nova Submissao - Constituicao de Sociedade</h2>'
    + '<table style="width:100%;border-collapse:collapse;margin:16px 0">'
    + '<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Contacto</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">' + clientName + '</td></tr>'
    + '<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">Email</td><td style="padding:8px;border-bottom:1px solid #eee">' + clientEmail + '</td></tr>'
    + '<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">1a Opcao Nome</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">' + companyName + '</td></tr>'
    + '<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">2a Opcao Nome</td><td style="padding:8px;border-bottom:1px solid #eee">' + (data.company_name_2||'N/A') + '</td></tr>'
    + '<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">3a Opcao Nome</td><td style="padding:8px;border-bottom:1px solid #eee">' + (data.company_name_3||'N/A') + '</td></tr>'
    + '</table>'
    + '<h3 style="color:#2563eb">Documentos a Preparar:</h3><ul>'
    + requiredDocs.map(function(d){ return '<li>'+d+'</li>'; }).join('')
    + '</ul>'
    + '<p><a href="' + folderUrl + '" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px">Abrir Pasta no Google Drive</a></p>'
    + '<p style="color:#999;font-size:12px;margin-top:24px">Enviado automaticamente pelo Portal de Constituicao OnCorporate.</p></div>';

  // Try to send emails (may fail if Gmail is not enabled on Workspace)
  try {
    MailApp.sendEmail({ to: NOTIFICATION_EMAIL, subject: 'Nova Constituicao: ' + companyName + ' - Portal', htmlBody: body });
  } catch(e) { Logger.log('Notification email failed: ' + e.toString()); }

  if (data.client_email) {
    try {
      var clientBody = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">'
        + '<h2 style="color:#1a1a2e">Obrigado pela sua submissao!</h2>'
        + '<p>Recebemos as informacoes para a constituicao da sociedade <strong>' + companyName + '</strong>.</p>'
        + '<p>A nossa equipa ira analisar os dados e documentos enviados e entrara em contacto consigo em breve com os proximos passos.</p>'
        + '<p>Se tiver alguma duvida, nao hesite em contactar-nos.</p><br>'
        + '<p>Com os melhores cumprimentos,<br><strong>OnCorporate</strong></p></div>';
      MailApp.sendEmail({ to: data.client_email, subject: 'Recebemos o seu pedido - ' + companyName, htmlBody: clientBody });
    } catch(e) { Logger.log('Client email failed: ' + e.toString()); }
  }
}

// ==========================================
// FILE UPLOAD
// ==========================================
function doPostFiles(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var folderId = payload.folderId;
    var files = payload.files;
    var folder = DriveApp.getFolderById(folderId);
    var subfolders = {};
    files.forEach(function(file) {
      var category = file.category || 'outros';
      if (!subfolders[category]) {
        var existing = folder.getFoldersByName(category);
        subfolders[category] = existing.hasNext() ? existing.next() : folder.createFolder(category);
      }
      var decoded = Utilities.base64Decode(file.data);
      var blob = Utilities.newBlob(decoded, file.mimeType, file.name);
      subfolders[category].createFile(blob);
    });
    return jsonResponse({ status: 'success', filesUploaded: files.length });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

// ==========================================
// CLAUDE EXTRACTION (Smart Upload)
// ==========================================
var EXTRACTION_PROMPT = 'You are a document data extraction assistant. Analyze the uploaded document image and extract all relevant information.\n\nIdentify the document type and return a JSON object with the following structure:\n\n{\n  "document_type": "passport" | "id_card" | "good_standing" | "proof_of_address" | "other",\n  "person_or_entity": "individual" | "corporate",\n  "extracted_fields": {\n    "full_name": {"value": "...", "confidence": "high" | "medium" | "low"},\n    "nationality": {"value": "...", "confidence": "..."},\n    "place_of_birth": {"value": "...", "confidence": "..."},\n    "date_of_birth": {"value": "YYYY-MM-DD", "confidence": "..."},\n    "document_number": {"value": "...", "confidence": "..."},\n    "issuing_authority": {"value": "...", "confidence": "..."},\n    "issue_date": {"value": "YYYY-MM-DD", "confidence": "..."},\n    "expiry_date": {"value": "YYYY-MM-DD", "confidence": "..."},\n    "address": {"value": "...", "confidence": "..."},\n    "gender": {"value": "...", "confidence": "..."},\n    "company_name": {"value": "...", "confidence": "..."},\n    "registration_number": {"value": "...", "confidence": "..."},\n    "country_of_incorporation": {"value": "...", "confidence": "..."},\n    "company_type": {"value": "...", "confidence": "..."},\n    "registered_address": {"value": "...", "confidence": "..."}\n  }\n}\n\nRules:\n- Only include fields that are actually present in the document\n- Use ISO 8601 date format (YYYY-MM-DD) for all dates\n- Set confidence to "high" if clearly legible, "medium" if partially legible, "low" if guessed\n- For passports, extract MRZ data if visible\n- For Good Standing / company certificates, focus on company details\n- Return ONLY valid JSON, no additional text';

function extractDocumentWithClaude(base64Data, mimeType) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY') || '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';
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured');

  var mediaType = mimeType === 'application/pdf' ? 'application/pdf' : mimeType;
  var contentType = mimeType === 'application/pdf' ? 'document' : 'image';

  var requestBody = {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: [
      { type: contentType, source: { type: 'base64', media_type: mediaType, data: base64Data } },
      { type: 'text', text: EXTRACTION_PROMPT }
    ]}]
  };

  var response = UrlFetchApp.fetch(CLAUDE_API_URL, {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify(requestBody), muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) throw new Error('Claude API returned status ' + response.getResponseCode());

  var result = JSON.parse(response.getContentText());
  var textContent = result.content.find(function(c) { return c.type === 'text'; });
  if (!textContent) throw new Error('No text content in Claude response');

  var jsonText = textContent.text.trim();
  var jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonText = jsonMatch[1].trim();
  return JSON.parse(jsonText);
}

function saveExtractedFileToDrive(base64Data, mimeType, fileName) {
  var parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var existing = parentFolder.getFoldersByName('pending_uploads');
  var pendingFolder = existing.hasNext() ? existing.next() : parentFolder.createFolder('pending_uploads');
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, fileName);
  return pendingFolder.createFile(blob).getId();
}

function movePendingFiles(fileIds, clientFolderId) {
  var clientFolder = DriveApp.getFolderById(clientFolderId);
  var existing = clientFolder.getFoldersByName('documentos_originais');
  var docsFolder = existing.hasNext() ? existing.next() : clientFolder.createFolder('documentos_originais');
  fileIds.forEach(function(fileId) {
    try { DriveApp.getFileById(fileId).moveTo(docsFolder); } catch(e) { Logger.log('Failed to move file ' + fileId); }
  });
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
}

// ==========================================
// DOCUMENT GENERATION
// ==========================================

/**
 * Formats a date in Portuguese style: "26 de marco de 2026"
 */
function formatDatePortuguese(date) {
  var months = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  var d = date || new Date();
  var day = d.getDate();
  var month = months[d.getMonth()];
  var year = d.getFullYear();
  return day + ' de ' + month + ' de ' + year;
}

/**
 * Replaces all {{PLACEHOLDER}} occurrences in a Google Doc body.
 */
function replacePlaceholders(doc, replacements) {
  var body = doc.getBody();
  var keys = Object.keys(replacements);
  for (var i = 0; i < keys.length; i++) {
    var placeholder = keys[i];
    var value = replacements[placeholder] || '';
    body.replaceText('\\{\\{' + placeholder + '\\}\\}', value);
  }
}

/**
 * Copies a template, replaces placeholders, saves to folder, and creates PDF.
 * Returns {docFile, pdfFile} or null if template missing.
 */
function generateDocFromTemplate(templateId, docName, replacements, destFolder) {
  if (!templateId) {
    Logger.log('Template ID missing for: ' + docName + ' - skipping.');
    return null;
  }

  try {
    var templateFile = DriveApp.getFileById(templateId);
  } catch (e) {
    Logger.log('Template not found (ID: ' + templateId + ') for: ' + docName + ' - skipping. Error: ' + e.toString());
    return null;
  }

  // Copy the template
  var copy = templateFile.makeCopy(docName, destFolder);
  var doc = DocumentApp.openById(copy.getId());

  // Replace placeholders
  replacePlaceholders(doc, replacements);
  doc.saveAndClose();

  // Convert to PDF
  var pdfBlob = DriveApp.getFileById(copy.getId()).getAs('application/pdf');
  pdfBlob.setName(docName + '.pdf');
  var pdfFile = destFolder.createFile(pdfBlob);

  Logger.log('Generated document: ' + docName);
  return { docFile: copy, pdfFile: pdfFile };
}

/**
 * Main document generation function. Called after form submission.
 * Generates all applicable legal documents from templates.
 */
function generateDocuments(data, clientFolder) {
  var props = PropertiesService.getScriptProperties();
  var templateIds = {
    cartaGerente: props.getProperty('TEMPLATE_CARTA_GERENTE'),
    repFiscalAceite: props.getProperty('TEMPLATE_REP_FISCAL_ACEITE'),
    repFiscalNomeacao: props.getProperty('TEMPLATE_REP_FISCAL_NOMEACAO'),
    pactoSocial: props.getProperty('TEMPLATE_PACTO_SOCIAL'),
    procuracao: props.getProperty('TEMPLATE_PROCURACAO')
  };

  // Check if any templates are configured
  var hasAnyTemplate = false;
  var tKeys = Object.keys(templateIds);
  for (var t = 0; t < tKeys.length; t++) {
    if (templateIds[tKeys[t]]) { hasAnyTemplate = true; break; }
  }
  if (!hasAnyTemplate) {
    Logger.log('No document templates configured. Skipping document generation. Run setupTemplates() to configure.');
    return;
  }

  // Fixed data: OnCorporate (fiscal representative)
  var ONCORPORATE = {
    firma: 'OnCorporate II - Contabilidade e Assessoria Empresarial, S.A.',
    nipc: '504 734 490',
    morada: 'Avenida 24 de Julho, n. 98, 3º andar, 3.15, 1200-870, Lisboa, Portugal',
    admin_nome: 'Yves Sammy Lopes Santana',
    admin_nif: '286728982'
  };

  // Fixed data: Lawyers for POA
  var ADVOGADOS = {
    adv1: 'Dr. Yves Sammy Lopes Santana',
    adv2: 'Dra. Leonor Gomes de Oliveira Xavier',
    adv3: 'Nuno Miguel Monteiro Almodovar',
    escritorio: 'Avenida 24 de Julho, n.º 98, 3.º piso, Estúdio 3.15, freguesia de Estrela, Concelho de Lisboa, 1200-870'
  };

  // Get or create the documentos_gerados subfolder
  var destFolderIter = clientFolder.getFoldersByName('documentos_gerados');
  var destFolder = destFolderIter.hasNext() ? destFolderIter.next() : clientFolder.createFolder('documentos_gerados');

  var companyName = data.company_name_1 || 'Sociedade';
  var capitalSocial = data.company_capital || '';
  var companyActivities = data.company_activities || '';
  var dataAssinatura = formatDatePortuguese(new Date());
  var generatedCount = 0;

  // -------------------------------------------------------
  // Document 1: Carta de Aceitacao do Gerente (one per manager, always)
  // -------------------------------------------------------
  for (var mg = 1; mg <= 10; mg++) {
    var mgName = data['mg_name_' + mg];
    if (!mgName) continue;

    var cartaReplacements = {
      'NOME_GERENTE': mgName,
      'ESTADO_CIVIL_GERENTE': data['mg_civil_status_' + mg] || '',
      'NACIONALIDADE_GERENTE': data['mg_nationality_' + mg] || '',
      'PASSAPORTE_GERENTE': data['mg_doc_number_' + mg] || '',
      'VALIDADE_PASSAPORTE_GERENTE': data['mg_doc_expiry_' + mg] || '',
      'NIF_GERENTE': data['mg_nif_' + mg] || '',
      'MORADA_GERENTE': data['mg_address_' + mg] || '',
      'NOME_SOCIEDADE': companyName,
      'CAPITAL_SOCIAL': capitalSocial,
      'DATA_ASSINATURA': dataAssinatura
    };

    var cartaName = 'Carta_Aceitacao_Gerente_' + sanitizeName(mgName);
    var result = generateDocFromTemplate(templateIds.cartaGerente, cartaName, cartaReplacements, destFolder);
    if (result) generatedCount++;
  }

  // -------------------------------------------------------
  // Documents 2 & 3: Representacao Fiscal
  // Triggered ONLY for MANAGERS who are non-resident AND have no NIF
  // Shareholders do NOT need fiscal rep docs (they need NIPC request instead)
  // OnCorporate is always the fiscal representative
  // -------------------------------------------------------

  // Managers: non-resident in Portugal and without NIF
  for (var mgr = 1; mgr <= 10; mgr++) {
    var mgrName = data['mg_name_' + mgr];
    if (!mgrName) continue;

    // Only generate if manager is foreign resident AND has no NIF
    if (data['mg_residence_' + mgr] !== 'foreign' || data['mg_has_nif_' + mgr] !== 'no') continue;

    var mgrRepReplacements = {
      'NOME_CLIENTE': mgrName,
      'NACIONALIDADE_CLIENTE': data['mg_nationality_' + mgr] || '',
      'NIF_CLIENTE': data['mg_nif_' + mgr] || '',
      'PASSAPORTE_CLIENTE': data['mg_doc_number_' + mgr] || '',
      'EMISSAO_PASSAPORTE': data['mg_doc_issue_' + mgr] || '',
      'VALIDADE_PASSAPORTE': data['mg_doc_expiry_' + mgr] || '',
      'MORADA_CLIENTE': data['mg_address_' + mgr] || '',
      'FIRMA_REP_FISCAL': ONCORPORATE.firma,
      'NIPC_REP_FISCAL': ONCORPORATE.nipc,
      'MORADA_REP_FISCAL': ONCORPORATE.morada,
      'ADMIN_REP_FISCAL': ONCORPORATE.admin_nome,
      'NIF_ADMIN_REP_FISCAL': ONCORPORATE.admin_nif,
      'DATA_ASSINATURA': dataAssinatura
    };

    var mgrSafeName = sanitizeName(mgrName);

    var mgrAceiteResult = generateDocFromTemplate(
      templateIds.repFiscalAceite,
      'Decl_Aceitacao_Rep_Fiscal_Gerente_' + mgrSafeName,
      mgrRepReplacements,
      destFolder
    );
    if (mgrAceiteResult) generatedCount++;

    var mgrNomeacaoResult = generateDocFromTemplate(
      templateIds.repFiscalNomeacao,
      'Decl_Nomeacao_Rep_Fiscal_Gerente_' + mgrSafeName,
      mgrRepReplacements,
      destFolder
    );
    if (mgrNomeacaoResult) generatedCount++;
  }

  // -------------------------------------------------------
  // Document 4: Pacto Social (Articles of Association) - always, once
  // -------------------------------------------------------
  if (templateIds.pactoSocial) {
    // Build shareholder list info for the Pacto Social
    // Collect first shareholder data for simple placeholders
    var firstShType = '';
    var firstShName = '';
    var firstShCountry = '';
    var firstShNif = '';

    // Also build multi-shareholder text block for all shareholders
    var sociosText = '';
    for (var ps = 1; ps <= 20; ps++) {
      var psType = data['sh_type_' + ps];
      if (!psType) continue;

      var psIsInd = psType === 'individual';
      var psName = psIsInd ? (data['sh_name_' + ps] || '') : (data['sh_corp_name_' + ps] || '');
      var psCountry = psIsInd ? (data['sh_nationality_' + ps] || '') : (data['sh_corp_country_' + ps] || '');
      var psNif = data['sh_nif_' + ps] || '';
      var psTipoLabel = psIsInd ? 'Pessoa Singular' : 'Pessoa Coletiva';
      var psQuota = data['sh_quota_' + ps] || '';
      var psPercentage = data['sh_percentage_' + ps] || '';

      if (!firstShName) {
        firstShType = psTipoLabel;
        firstShName = psName;
        firstShCountry = psCountry;
        firstShNif = psNif;
      }

      if (sociosText) sociosText += '\n';
      sociosText += psName + ' (' + psTipoLabel + ', ' + psCountry + ', NIF: ' + psNif + ')';
      if (psQuota) sociosText += ' - Quota: ' + psQuota + ' EUR';
      if (psPercentage) sociosText += ' (' + psPercentage + '%)';
    }

    // First manager data for Pacto Social
    var pactoMgName = '';
    var pactoMgNationality = '';
    var pactoMgCivilStatus = '';
    var pactoMgPassport = '';
    var pactoMgIssuer = '';
    var pactoMgIssue = '';
    var pactoMgExpiry = '';
    var pactoMgNif = '';
    var pactoMgAddress = '';

    for (var pm = 1; pm <= 10; pm++) {
      if (data['mg_name_' + pm]) {
        pactoMgName = data['mg_name_' + pm];
        pactoMgNationality = data['mg_nationality_' + pm] || '';
        pactoMgCivilStatus = data['mg_civil_status_' + pm] || '';
        pactoMgPassport = data['mg_doc_number_' + pm] || '';
        pactoMgIssuer = data['mg_doc_issuer_' + pm] || '';
        pactoMgIssue = data['mg_doc_issue_' + pm] || '';
        pactoMgExpiry = data['mg_doc_expiry_' + pm] || '';
        pactoMgNif = data['mg_nif_' + pm] || '';
        pactoMgAddress = data['mg_address_' + pm] || '';
        break;
      }
    }

    var pactoReplacements = {
      'NOME_SOCIEDADE': companyName,
      'CAPITAL_SOCIAL': capitalSocial,
      'ATIVIDADES_SOCIEDADE': companyActivities,
      'NOME_SOCIO': firstShName,
      'TIPO_SOCIO': firstShType,
      'PAIS_SOCIO': firstShCountry,
      'NIF_SOCIO': firstShNif,
      'LISTA_SOCIOS': sociosText,
      'NOME_GERENTE': pactoMgName,
      'NACIONALIDADE_GERENTE': pactoMgNationality,
      'ESTADO_CIVIL_GERENTE': pactoMgCivilStatus,
      'PASSAPORTE_GERENTE': pactoMgPassport,
      'ENTIDADE_EMISSORA': pactoMgIssuer,
      'EMISSAO_PASSAPORTE_GERENTE': pactoMgIssue,
      'VALIDADE_PASSAPORTE_GERENTE': pactoMgExpiry,
      'NIF_GERENTE': pactoMgNif,
      'MORADA_GERENTE': pactoMgAddress,
      'DATA_ASSINATURA': dataAssinatura
    };

    var pactoResult = generateDocFromTemplate(
      templateIds.pactoSocial,
      'Pacto_Social_' + sanitizeName(companyName),
      pactoReplacements,
      destFolder
    );
    if (pactoResult) generatedCount++;
  }

  // -------------------------------------------------------
  // Document 5: Procuracao (POA) - one per shareholder
  // Individual: uses shareholder personal data
  // Corporate: outorgante = company name, signatory = corporate legal representative
  // Fixed attorney data (ADVOGADOS) included in all POAs
  // -------------------------------------------------------
  for (var poc = 1; poc <= 20; poc++) {
    var pocType = data['sh_type_' + poc];
    if (!pocType) continue;

    var pocIsInd = pocType === 'individual';
    var pocName = pocIsInd ? (data['sh_name_' + poc] || '') : (data['sh_corp_name_' + poc] || '');

    // Get the first manager for the POA
    var poaMgName = '';
    var poaMgNif = '';
    for (var poaMg = 1; poaMg <= 10; poaMg++) {
      if (data['mg_name_' + poaMg]) {
        poaMgName = data['mg_name_' + poaMg];
        poaMgNif = data['mg_nif_' + poaMg] || '';
        break;
      }
    }

    var procReplacements = {
      'NOME_OUTORGANTE': pocName,
      'CAPITAL_SOCIAL': capitalSocial,
      'NOME_SOCIEDADE': companyName,
      'NOME_GERENTE': poaMgName,
      'NIF_GERENTE': poaMgNif,
      'DATA_ASSINATURA': dataAssinatura,
      // Fixed attorney data
      'ADVOGADO_1': ADVOGADOS.adv1,
      'ADVOGADO_2': ADVOGADOS.adv2,
      'ADVOGADO_3': ADVOGADOS.adv3,
      'ESCRITORIO_ADVOGADOS': ADVOGADOS.escritorio
    };

    if (pocIsInd) {
      // Individual shareholder: POA uses their personal data
      procReplacements['NIF_OUTORGANTE'] = data['sh_nif_' + poc] || '';
      procReplacements['NACIONALIDADE_OUTORGANTE'] = data['sh_nationality_' + poc] || '';
      procReplacements['PASSAPORTE_OUTORGANTE'] = data['sh_doc_number_' + poc] || '';
      procReplacements['EMISSAO_PASSAPORTE_OUTORGANTE'] = data['sh_doc_issue_' + poc] || '';
      procReplacements['VALIDADE_PASSAPORTE_OUTORGANTE'] = data['sh_doc_expiry_' + poc] || '';
      procReplacements['MORADA_OUTORGANTE'] = data['sh_address_' + poc] || '';
      // Clear corporate representative placeholders (in case template has them)
      procReplacements['NOME_REPRESENTANTE'] = '';
      procReplacements['PASSAPORTE_REPRESENTANTE'] = '';
      procReplacements['NACIONALIDADE_REPRESENTANTE'] = '';
      procReplacements['MORADA_REPRESENTANTE'] = '';
    } else {
      // Corporate shareholder: outorgante = company, signatory = corporate legal representative
      procReplacements['TIPO_OUTORGANTE'] = data['sh_corp_type_' + poc] || '';
      procReplacements['PAIS_OUTORGANTE'] = data['sh_corp_country_' + poc] || '';
      procReplacements['REGISTO_OUTORGANTE'] = data['sh_corp_reg_' + poc] || '';
      procReplacements['NIF_OUTORGANTE'] = data['sh_nif_' + poc] || '';
      procReplacements['MORADA_OUTORGANTE'] = data['sh_corp_address_' + poc] || '';
      // Clear individual-specific fields not applicable to corporate POA
      procReplacements['NACIONALIDADE_OUTORGANTE'] = '';
      procReplacements['PASSAPORTE_OUTORGANTE'] = '';
      procReplacements['EMISSAO_PASSAPORTE_OUTORGANTE'] = '';
      procReplacements['VALIDADE_PASSAPORTE_OUTORGANTE'] = '';
      // Corporate legal representative who signs the POA
      procReplacements['NOME_REPRESENTANTE'] = data['sh_corp_representative_' + poc] || '';
      procReplacements['PASSAPORTE_REPRESENTANTE'] = data['sh_corp_representative_passport_' + poc] || '';
      procReplacements['NACIONALIDADE_REPRESENTANTE'] = data['sh_corp_representative_nationality_' + poc] || '';
      procReplacements['MORADA_REPRESENTANTE'] = data['sh_corp_representative_address_' + poc] || '';
    }

    var procResult = generateDocFromTemplate(
      templateIds.procuracao,
      'Procuracao_' + sanitizeName(pocName),
      procReplacements,
      destFolder
    );
    if (procResult) generatedCount++;
  }

  Logger.log('Document generation complete. Generated ' + generatedCount + ' documents for ' + companyName);
}

/**
 * Setup function: creates a Templates folder and logs instructions.
 * Run this once to prepare the template infrastructure.
 */
function setupTemplates() {
  var parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var existing = parentFolder.getFoldersByName('Templates_Documentos');
  var templatesFolder;
  if (existing.hasNext()) {
    templatesFolder = existing.next();
    Logger.log('Templates folder already exists: ' + templatesFolder.getUrl());
  } else {
    templatesFolder = parentFolder.createFolder('Templates_Documentos');
    Logger.log('Created Templates folder: ' + templatesFolder.getUrl());
  }

  Logger.log('');
  Logger.log('=== SETUP INSTRUCTIONS ===');
  Logger.log('1. Open the Templates folder: ' + templatesFolder.getUrl());
  Logger.log('2. Upload or create 5 Google Docs templates with {{PLACEHOLDER}} markers.');
  Logger.log('3. For each template, copy the Google Doc ID from its URL.');
  Logger.log('   (The ID is the long string between /d/ and /edit in the URL)');
  Logger.log('4. Set the Script Properties with the template IDs:');
  Logger.log('');

  var props = PropertiesService.getScriptProperties();
  var templateKeys = [
    'TEMPLATE_CARTA_GERENTE',
    'TEMPLATE_REP_FISCAL_ACEITE',
    'TEMPLATE_REP_FISCAL_NOMEACAO',
    'TEMPLATE_PACTO_SOCIAL',
    'TEMPLATE_PROCURACAO'
  ];

  var templateDescriptions = [
    'Carta de Aceitacao do Gerente',
    'Declaracao Aceitacao Representacao Fiscal',
    'Declaracao Nomeacao Representante Fiscal',
    'Pacto Social (Articles of Association)',
    'Procuracao Constituicao (Power of Attorney)'
  ];

  for (var i = 0; i < templateKeys.length; i++) {
    var currentValue = props.getProperty(templateKeys[i]);
    Logger.log('   ' + templateKeys[i] + ' = ' + (currentValue || '(not set)') + '  // ' + templateDescriptions[i]);
  }

  Logger.log('');
  Logger.log('To set properties, go to Project Settings > Script Properties,');
  Logger.log('or run setTemplateId("TEMPLATE_KEY", "google-doc-id") for each.');
  Logger.log('');
  Logger.log('=== PLACEHOLDER REFERENCE ===');
  Logger.log('Carta Gerente: {{NOME_GERENTE}}, {{ESTADO_CIVIL_GERENTE}}, {{NACIONALIDADE_GERENTE}}, {{PASSAPORTE_GERENTE}}, {{VALIDADE_PASSAPORTE_GERENTE}}, {{NIF_GERENTE}}, {{MORADA_GERENTE}}, {{NOME_SOCIEDADE}}, {{CAPITAL_SOCIAL}}, {{DATA_ASSINATURA}}');
  Logger.log('Rep Fiscal (both): {{NOME_CLIENTE}}, {{NACIONALIDADE_CLIENTE}}, {{NIF_CLIENTE}}, {{PASSAPORTE_CLIENTE}}, {{EMISSAO_PASSAPORTE}}, {{VALIDADE_PASSAPORTE}}, {{MORADA_CLIENTE}}, {{FIRMA_REP_FISCAL}}, {{NIPC_REP_FISCAL}}, {{MORADA_REP_FISCAL}}, {{ADMIN_REP_FISCAL}}, {{NIF_ADMIN_REP_FISCAL}}, {{DATA_ASSINATURA}}');
  Logger.log('  -> Triggered when mg_residence_X === "foreign" AND mg_has_nif_X === "no"');
  Logger.log('Pacto Social: {{NOME_SOCIEDADE}}, {{CAPITAL_SOCIAL}}, {{ATIVIDADES_SOCIEDADE}}, {{NOME_SOCIO}}, {{TIPO_SOCIO}}, {{PAIS_SOCIO}}, {{NIF_SOCIO}}, {{LISTA_SOCIOS}}, {{NOME_GERENTE}}, {{NACIONALIDADE_GERENTE}}, {{ESTADO_CIVIL_GERENTE}}, {{PASSAPORTE_GERENTE}}, {{ENTIDADE_EMISSORA}}, {{EMISSAO_PASSAPORTE_GERENTE}}, {{VALIDADE_PASSAPORTE_GERENTE}}, {{NIF_GERENTE}}, {{MORADA_GERENTE}}, {{DATA_ASSINATURA}}');
  Logger.log('Procuracao (Individual): {{NOME_OUTORGANTE}}, {{NIF_OUTORGANTE}}, {{NACIONALIDADE_OUTORGANTE}}, {{PASSAPORTE_OUTORGANTE}}, {{EMISSAO_PASSAPORTE_OUTORGANTE}}, {{VALIDADE_PASSAPORTE_OUTORGANTE}}, {{MORADA_OUTORGANTE}}, {{NOME_GERENTE}}, {{NIF_GERENTE}}, {{CAPITAL_SOCIAL}}, {{NOME_SOCIEDADE}}, {{ADVOGADO_1}}, {{ADVOGADO_2}}, {{ADVOGADO_3}}, {{ESCRITORIO_ADVOGADOS}}, {{DATA_ASSINATURA}}');
  Logger.log('Procuracao (Corporate): {{NOME_OUTORGANTE}}, {{TIPO_OUTORGANTE}}, {{PAIS_OUTORGANTE}}, {{REGISTO_OUTORGANTE}}, {{NIF_OUTORGANTE}}, {{MORADA_OUTORGANTE}}, {{NOME_REPRESENTANTE}}, {{PASSAPORTE_REPRESENTANTE}}, {{NACIONALIDADE_REPRESENTANTE}}, {{MORADA_REPRESENTANTE}}, {{NOME_GERENTE}}, {{NIF_GERENTE}}, {{CAPITAL_SOCIAL}}, {{NOME_SOCIEDADE}}, {{ADVOGADO_1}}, {{ADVOGADO_2}}, {{ADVOGADO_3}}, {{ESCRITORIO_ADVOGADOS}}, {{DATA_ASSINATURA}}');
  Logger.log('  -> Corporate POA: NOME_OUTORGANTE = company name, NOME_REPRESENTANTE = legal representative who signs');
}

/**
 * Helper to set a template ID in Script Properties.
 * Usage: setTemplateId('TEMPLATE_CARTA_GERENTE', '1abc...xyz')
 */
function setTemplateId(key, docId) {
  var validKeys = [
    'TEMPLATE_CARTA_GERENTE',
    'TEMPLATE_REP_FISCAL_ACEITE',
    'TEMPLATE_REP_FISCAL_NOMEACAO',
    'TEMPLATE_PACTO_SOCIAL',
    'TEMPLATE_PROCURACAO'
  ];
  if (validKeys.indexOf(key) === -1) {
    Logger.log('Invalid key: ' + key + '. Valid keys: ' + validKeys.join(', '));
    return;
  }
  PropertiesService.getScriptProperties().setProperty(key, docId);
  Logger.log('Set ' + key + ' = ' + docId);
}

// ==========================================
// FORCE AUTH (executar uma vez, depois apagar)
// ==========================================
function forceAuth() {
  SpreadsheetApp.openById('1re4BxXii9vZSOH8pPy-13NASudGGCwbS7on26GMshzk');
  DriveApp.getFolderById('1UOieVkc8XITCY4idloVYH2aFcqAxUiIp');
  var tempDoc = DocumentApp.create('_test_auth_temp_');
  DriveApp.getFileById(tempDoc.getId()).setTrashed(true);
  MailApp.getRemainingDailyQuota();
  Logger.log('Auth OK!');
}

// ==========================================
// PREPARE TEMPLATES (executar UMA VEZ para adicionar placeholders)
// ==========================================
function prepareTemplates() {
  // Set template IDs in Script Properties
  var props = PropertiesService.getScriptProperties();
  props.setProperty('TEMPLATE_CARTA_GERENTE', '1IQZgOdUc9fHGSTOhdYLGbz4WzUBNF8SzlOu-r8t5QNo');
  props.setProperty('TEMPLATE_REP_FISCAL_ACEITE', '1EuZ2IHWId_r7emUTDute-fbOeCocbXwmTYQVuQs2Cnw');
  props.setProperty('TEMPLATE_REP_FISCAL_NOMEACAO', '1cS_b0IkxsUgvTor2a80-RKEZ9KBYpn3bxjSyRV9m3k8');
  props.setProperty('TEMPLATE_PACTO_SOCIAL', '1I6fV3t4H8t_GDwICiTP9SL9gbvWaEwGYm05iCFwLM_0');
  props.setProperty('TEMPLATE_PROCURACAO', '1F85x77rKTeNm3FyKvjkolvvhxFZtDF5tLrkbM8CJ99I');
  Logger.log('Template IDs saved to Script Properties.');

  // Now add placeholders to each template
  Logger.log('');
  Logger.log('Adding placeholders to templates...');

  // --- 1. Carta de Aceitacao do Gerente ---
  try {
    var doc1 = DocumentApp.openById('1IQZgOdUc9fHGSTOhdYLGbz4WzUBNF8SzlOu-r8t5QNo');
    var body1 = doc1.getBody();
    body1.replaceText('DENISA KASTRATI', '{{NOME_GERENTE}}');
    body1.replaceText('Denisa Kastrati', '{{NOME_GERENTE}}');
    body1.replaceText('solteira', '{{ESTADO_CIVIL_GERENTE}}');
    body1.replaceText('single', '{{ESTADO_CIVIL_GERENTE}}');
    body1.replaceText('nacionalidade brit.nica', '{{NACIONALIDADE_GERENTE}}');
    body1.replaceText('British national', '{{NACIONALIDADE_GERENTE}}');
    body1.replaceText('British citizen', '{{NACIONALIDADE_GERENTE}}');
    body1.replaceText('135973582', '{{PASSAPORTE_GERENTE}}');
    body1.replaceText('11 de outubro de 2032', '{{VALIDADE_PASSAPORTE_GERENTE}}');
    body1.replaceText('11 October 2032', '{{VALIDADE_PASSAPORTE_GERENTE}}');
    body1.replaceText('336149352', '{{NIF_GERENTE}}');
    body1.replaceText('16 Osborne Road, Redhill, RH1 2HX, Reino Unido', '{{MORADA_GERENTE}}');
    body1.replaceText('16 Osborne Road, Redhill, RH1 2HX, United Kingdom', '{{MORADA_GERENTE}}');
    body1.replaceText('AMBAR CLOUD, UNIPESSOAL LDA', '{{NOME_SOCIEDADE}}');
    body1.replaceText('Ambar Cloud, Unipessoal Lda', '{{NOME_SOCIEDADE}}');
    body1.replaceText('one thousand euro \\(EUR 1,000\\)', '{{CAPITAL_SOCIAL}}');
    body1.replaceText('mil euros \\(EUR 1\\.000,00\\)', '{{CAPITAL_SOCIAL}}');
    body1.replaceText('23 February 2026', '{{DATA_ASSINATURA}}');
    body1.replaceText('23 de fevereiro de 2026', '{{DATA_ASSINATURA}}');
    body1.replaceText('519278585', '{{NIPC_SOCIEDADE}}');
    doc1.saveAndClose();
    Logger.log('1/5 Carta Gerente - OK');
  } catch(e) { Logger.log('1/5 Carta Gerente - ERRO: ' + e.toString()); }

  // --- 2. Declaracao Aceitacao Representacao Fiscal ---
  try {
    var doc2 = DocumentApp.openById('1EuZ2IHWId_r7emUTDute-fbOeCocbXwmTYQVuQs2Cnw');
    var body2 = doc2.getBody();
    body2.replaceText('MARGARET CARLETON RICHARDS', '{{NOME_CLIENTE}}');
    body2.replaceText('Margaret Carleton Richards', '{{NOME_CLIENTE}}');
    body2.replaceText('nacionalidade americana', '{{NACIONALIDADE_CLIENTE}}');
    body2.replaceText('American national', '{{NACIONALIDADE_CLIENTE}}');
    body2.replaceText('657909030', '{{PASSAPORTE_CLIENTE}}');
    body2.replaceText('dd/mm/aaaa', '{{EMISSAO_PASSAPORTE}}');
    body2.replaceText('1048 Watershed Road, Mars Hill, NC 28754, Estados Unidos da Am.rica', '{{MORADA_CLIENTE}}');
    body2.replaceText('1048 Watershed Road, Mars Hill, NC 28754', '{{MORADA_CLIENTE}}');
    body2.replaceText('30-06-2025', '{{DATA_ASSINATURA}}');
    body2.replaceText('30 de junho de 2025', '{{DATA_ASSINATURA}}');
    doc2.saveAndClose();
    Logger.log('2/5 Rep Fiscal Aceite - OK');
  } catch(e) { Logger.log('2/5 Rep Fiscal Aceite - ERRO: ' + e.toString()); }

  // --- 3. Declaracao Nomeacao Representante Fiscal ---
  try {
    var doc3 = DocumentApp.openById('1cS_b0IkxsUgvTor2a80-RKEZ9KBYpn3bxjSyRV9m3k8');
    var body3 = doc3.getBody();
    // This template has generic placeholders like [NOME COMPLETO] already
    body3.replaceText('\\[NOME COMPLETO\\]', '{{NOME_CLIENTE}}');
    body3.replaceText('\\[nome completo\\]', '{{NOME_CLIENTE}}');
    body3.replaceText('\\[Full Name\\]', '{{NOME_CLIENTE}}');
    body3.replaceText('\\[full name\\]', '{{NOME_CLIENTE}}');
    body3.replaceText('\\[NIF\\]', '{{NIF_CLIENTE}}');
    body3.replaceText('\\[NACIONALIDADE\\]', '{{NACIONALIDADE_CLIENTE}}');
    body3.replaceText('\\[Nationality\\]', '{{NACIONALIDADE_CLIENTE}}');
    body3.replaceText('\\[NUMERO.PASSAPORTE\\]', '{{PASSAPORTE_CLIENTE}}');
    body3.replaceText('\\[Passport Number\\]', '{{PASSAPORTE_CLIENTE}}');
    body3.replaceText('\\[DATA.EMISSAO.PASSAPORTE\\]', '{{EMISSAO_PASSAPORTE}}');
    body3.replaceText('\\[Passport Issue Date\\]', '{{EMISSAO_PASSAPORTE}}');
    body3.replaceText('\\[VALIDADE.PASSAPORTE\\]', '{{VALIDADE_PASSAPORTE}}');
    body3.replaceText('\\[Passport Expiry\\]', '{{VALIDADE_PASSAPORTE}}');
    body3.replaceText('\\[MORADA.COMPLETA\\]', '{{MORADA_CLIENTE}}');
    body3.replaceText('\\[Full Address\\]', '{{MORADA_CLIENTE}}');
    body3.replaceText('\\[LOCAL\\]', '{{LOCAL_ASSINATURA}}');
    body3.replaceText('\\[DATA\\]', '{{DATA_ASSINATURA}}');
    body3.replaceText('\\[Date\\]', '{{DATA_ASSINATURA}}');
    body3.replaceText('xxxx', '{{NIF_CLIENTE}}');
    doc3.saveAndClose();
    Logger.log('3/5 Rep Fiscal Nomeacao - OK');
  } catch(e) { Logger.log('3/5 Rep Fiscal Nomeacao - ERRO: ' + e.toString()); }

  // --- 4. Pacto Social ---
  try {
    var doc4 = DocumentApp.openById('1I6fV3t4H8t_GDwICiTP9SL9gbvWaEwGYm05iCFwLM_0');
    var body4 = doc4.getBody();
    body4.replaceText('AMBAR CLOUD, UNIPESSOAL LDA', '{{NOME_SOCIEDADE}}');
    body4.replaceText('Ambar Cloud, Unipessoal Lda', '{{NOME_SOCIEDADE}}');
    body4.replaceText('AMBAR CLOUD LTD', '{{NOME_SOCIO}}');
    body4.replaceText('Ambar Cloud Ltd', '{{NOME_SOCIO}}');
    body4.replaceText('Ambar Cloud LTD', '{{NOME_SOCIO}}');
    body4.replaceText('sociedade de responsabilidade limitada', '{{TIPO_SOCIO}}');
    body4.replaceText('Reino Unido', '{{PAIS_SOCIO}}');
    body4.replaceText('United Kingdom', '{{PAIS_SOCIO}}');
    body4.replaceText('980893445', '{{NIF_SOCIO}}');
    body4.replaceText('DENISA KASTRATI', '{{NOME_GERENTE}}');
    body4.replaceText('Denisa Kastrati', '{{NOME_GERENTE}}');
    body4.replaceText('solteira', '{{ESTADO_CIVIL_GERENTE}}');
    body4.replaceText('nacionalidade brit.nica', '{{NACIONALIDADE_GERENTE}}');
    body4.replaceText('135973582', '{{PASSAPORTE_GERENTE}}');
    body4.replaceText('HMPO', '{{ENTIDADE_EMISSORA}}');
    body4.replaceText('11 de outubro de 2022', '{{EMISSAO_PASSAPORTE_GERENTE}}');
    body4.replaceText('11 de outubro de 2032', '{{VALIDADE_PASSAPORTE_GERENTE}}');
    body4.replaceText('336149352', '{{NIF_GERENTE}}');
    body4.replaceText('16 Osborne Road, Redhill, RH1 2HX', '{{MORADA_GERENTE}}');
    body4.replaceText('519278585', '{{NIPC_SOCIEDADE}}');
    body4.replaceText('1\\.000', '{{CAPITAL_SOCIAL}}');
    body4.replaceText('mil euros', '{{CAPITAL_SOCIAL_EXTENSO}}');
    doc4.saveAndClose();
    Logger.log('4/5 Pacto Social - OK');
  } catch(e) { Logger.log('4/5 Pacto Social - ERRO: ' + e.toString()); }

  // --- 5. Procuracao ---
  try {
    var doc5 = DocumentApp.openById('1F85x77rKTeNm3FyKvjkolvvhxFZtDF5tLrkbM8CJ99I');
    var body5 = doc5.getBody();
    // The POA template has bracketed placeholders
    body5.replaceText('\\[NOME COMPLETO DO OUTORGANTE\\]', '{{NOME_OUTORGANTE}}');
    body5.replaceText('\\[Full name of the Grantor\\]', '{{NOME_OUTORGANTE}}');
    body5.replaceText('\\[NIF DO OUTORGANTE\\]', '{{NIF_OUTORGANTE}}');
    body5.replaceText('\\[NIF of the Grantor\\]', '{{NIF_OUTORGANTE}}');
    body5.replaceText('\\[NOME DO C.NJUGE\\]', '{{CONJUGE_OUTORGANTE}}');
    body5.replaceText('\\[Spouse.s Name\\]', '{{CONJUGE_OUTORGANTE}}');
    body5.replaceText('\\[CIDADE, PA.S DE NASCIMENTO\\]', '{{LOCAL_NASCIMENTO}}');
    body5.replaceText('\\[City, Country of Birth\\]', '{{LOCAL_NASCIMENTO}}');
    body5.replaceText('\\[MORADA COMPLETA COM C.DIGO POSTAL E PA.S\\]', '{{MORADA_OUTORGANTE}}');
    body5.replaceText('\\[Full Address with Postal Code and Country\\]', '{{MORADA_OUTORGANTE}}');
    body5.replaceText('\\[N.MERO DO PASSAPORTE\\]', '{{PASSAPORTE_OUTORGANTE}}');
    body5.replaceText('\\[Passport Number\\]', '{{PASSAPORTE_OUTORGANTE}}');
    body5.replaceText('\\[DATA DE EMISS.O DO PASSAPORTE\\]', '{{EMISSAO_PASSAPORTE_OUTORGANTE}}');
    body5.replaceText('\\[Passport Issue Date\\]', '{{EMISSAO_PASSAPORTE_OUTORGANTE}}');
    body5.replaceText('\\[VALIDADE DO PASSAPORTE\\]', '{{VALIDADE_PASSAPORTE_OUTORGANTE}}');
    body5.replaceText('\\[Passport Expiry Date\\]', '{{VALIDADE_PASSAPORTE_OUTORGANTE}}');
    body5.replaceText('\\[NOME DO PA.S EMISSOR DO DOCUMENTO\\]', '{{PAIS_EMISSOR}}');
    body5.replaceText('\\[Country of Passport Issuance\\]', '{{PAIS_EMISSOR}}');
    body5.replaceText('\\[NOME COMPLETO DO GERENTE\\]', '{{NOME_GERENTE}}');
    body5.replaceText('\\[Full Name of the Manager\\]', '{{NOME_GERENTE}}');
    body5.replaceText('\\[N. NIF DO GERENTE\\]', '{{NIF_GERENTE}}');
    body5.replaceText('\\[Manager.s NIF Number\\]', '{{NIF_GERENTE}}');
    body5.replaceText('cem euros \\(EUR 100,00\\)', '{{CAPITAL_SOCIAL}}');
    body5.replaceText('one hundred euros \\(EUR 100\\.00\\)', '{{CAPITAL_SOCIAL}}');
    doc5.saveAndClose();
    Logger.log('5/5 Procuracao - OK');
  } catch(e) { Logger.log('5/5 Procuracao - ERRO: ' + e.toString()); }

  Logger.log('');
  Logger.log('=== DONE! Templates prepared and IDs saved. ===');
  Logger.log('Now deploy a new version and test a form submission.');
}

// ==========================================
// SETUP — Corre esta função UMA VEZ para configurar tudo
// ==========================================
// 1. Vá a https://script.google.com > Novo projeto
// 2. Cole TODOS os ficheiros (Code.gs, ClaudeExtraction.gs, FileUpload.gs, Setup.gs)
// 3. Selecione a função "setup" no dropdown e clique ▶ Run
// 4. Autorize quando solicitado
// 5. Veja o log (View > Logs) para os IDs e URLs

function setup() {
  // 1. Criar pasta no Google Drive
  const folder = DriveApp.createFolder('Constituições - Portal');
  const folderId = folder.getId();

  // Criar subpastas
  folder.createFolder('pending_uploads');

  // 2. Criar Google Sheet
  const ss = SpreadsheetApp.create('Portal Constituições');
  const spreadsheetId = ss.getId();

  // Criar aba "Constituições" com headers
  const sheet1 = ss.getActiveSheet();
  sheet1.setName('Constituições');
  sheet1.appendRow([
    'Data Submissão', 'Contacto', 'Email', 'Telefone',
    'Nome 1', 'Nome 2', 'Nome 3', 'CAE', 'Capital Social',
    'Nº Sócios', 'Nº Gerentes', 'Documentos Necessários',
    'Notas', 'Pasta Drive', 'Status'
  ]);
  sheet1.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
  sheet1.setFrozenRows(1);

  // Criar aba "Detalhes"
  const sheet2 = ss.insertSheet('Detalhes');
  sheet2.appendRow([
    'Data', 'Sociedade', 'Tipo Entidade', 'Papel',
    'Tipo Pessoa', 'Residência', 'Nome/Firma',
    'Nacionalidade/País', 'Estado Civil', 'Nº Documento',
    'Entidade Emissora', 'Emissão', 'Validade',
    'Morada', 'Tem NIF', 'NIF/NIPC',
    'Rep. Fiscal', 'Quota (€)', '%'
  ]);
  sheet2.getRange(1, 1, 1, 19).setFontWeight('bold').setBackground('#16a34a').setFontColor('#ffffff');
  sheet2.setFrozenRows(1);

  // 3. Log dos resultados
  const scriptId = ScriptApp.getScriptId();

  Logger.log('');
  Logger.log('========================================');
  Logger.log('   SETUP COMPLETO!');
  Logger.log('========================================');
  Logger.log('');
  Logger.log('DRIVE_FOLDER_ID: ' + folderId);
  Logger.log('SPREADSHEET_ID:  ' + spreadsheetId);
  Logger.log('SCRIPT_ID:       ' + scriptId);
  Logger.log('');
  Logger.log('Pasta Drive:   https://drive.google.com/drive/folders/' + folderId);
  Logger.log('Google Sheet:  https://docs.google.com/spreadsheets/d/' + spreadsheetId);
  Logger.log('');
  Logger.log('========================================');
  Logger.log('PRÓXIMOS PASSOS:');
  Logger.log('1. Copie os IDs acima');
  Logger.log('2. Substitua no Code.gs as linhas SPREADSHEET_ID e DRIVE_FOLDER_ID');
  Logger.log('3. Em Project Settings > Script Properties, adicione: CLAUDE_API_KEY');
  Logger.log('4. Deploy > New deployment > Web App');
  Logger.log('   - Execute as: Me');
  Logger.log('   - Who has access: Anyone');
  Logger.log('5. Copie a URL do deploy');
  Logger.log('========================================');

  // Mostrar popup com os IDs
  const ui = SpreadsheetApp.getUi ? null : null; // Web editor doesn't have UI

  return {
    folderId: folderId,
    spreadsheetId: spreadsheetId,
    scriptId: scriptId
  };
}

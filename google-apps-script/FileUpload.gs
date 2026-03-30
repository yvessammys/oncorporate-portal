// ==========================================
// File Upload Handler — Versão melhorada
// ==========================================
// O Google Apps Script Web App tem limitação de 50MB por request.
// Para contornar isso, os ficheiros são convertidos em base64 no cliente
// e enviados separadamente.

/**
 * Recebe ficheiros como base64 e guarda no Google Drive.
 * Chamado pelo frontend após a submissão inicial dos dados.
 */
function doPostFiles(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const folderId = payload.folderId;
    const files = payload.files; // Array de {name, data, mimeType, category}

    const folder = DriveApp.getFolderById(folderId);

    // Criar subpastas por categoria
    const subfolders = {};
    files.forEach(file => {
      const category = file.category || 'outros';
      if (!subfolders[category]) {
        // Verificar se subpasta já existe
        const existing = folder.getFoldersByName(category);
        subfolders[category] = existing.hasNext()
          ? existing.next()
          : folder.createFolder(category);
      }

      const decoded = Utilities.base64Decode(file.data);
      const blob = Utilities.newBlob(decoded, file.mimeType, file.name);
      subfolders[category].createFile(blob);
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        filesUploaded: files.length
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Cria a estrutura de pastas para um novo cliente.
 * Retorna o ID da pasta criada para upload posterior.
 */
function createClientFolder(companyName) {
  const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const timestamp = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'yyyy-MM-dd_HH-mm');
  const folderName = `${timestamp}_${sanitizeName(companyName)}`;
  const clientFolder = parentFolder.createFolder(folderName);

  // Criar subpastas
  clientFolder.createFolder('socios');
  clientFolder.createFolder('gerentes');
  clientFolder.createFolder('documentos_gerados');

  return {
    folderId: clientFolder.getId(),
    folderUrl: clientFolder.getUrl()
  };
}

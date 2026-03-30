// ==========================================
// Claude API — Document Extraction
// ==========================================
// Usa a API Claude (visão) para extrair dados de documentos
// (passaportes, Good Standing, etc.)
//
// SETUP:
// 1. No editor do Apps Script, vá a Project Settings > Script Properties
// 2. Adicione a propriedade: CLAUDE_API_KEY = sk-ant-...
// 3. Nunca coloque a API key diretamente no código

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const EXTRACTION_PROMPT = `You are a document data extraction assistant. Analyze the uploaded document image and extract all relevant information.

Identify the document type and return a JSON object with the following structure:

{
  "document_type": "passport" | "id_card" | "good_standing" | "proof_of_address" | "other",
  "person_or_entity": "individual" | "corporate",
  "extracted_fields": {
    "full_name": {"value": "...", "confidence": "high" | "medium" | "low"},
    "nationality": {"value": "...", "confidence": "..."},
    "place_of_birth": {"value": "...", "confidence": "..."},
    "date_of_birth": {"value": "YYYY-MM-DD", "confidence": "..."},
    "document_number": {"value": "...", "confidence": "..."},
    "issuing_authority": {"value": "...", "confidence": "..."},
    "issue_date": {"value": "YYYY-MM-DD", "confidence": "..."},
    "expiry_date": {"value": "YYYY-MM-DD", "confidence": "..."},
    "address": {"value": "...", "confidence": "..."},
    "gender": {"value": "...", "confidence": "..."},
    "company_name": {"value": "...", "confidence": "..."},
    "registration_number": {"value": "...", "confidence": "..."},
    "country_of_incorporation": {"value": "...", "confidence": "..."},
    "company_type": {"value": "...", "confidence": "..."},
    "registered_address": {"value": "...", "confidence": "..."}
  }
}

Rules:
- Only include fields that are actually present in the document
- Use ISO 8601 date format (YYYY-MM-DD) for all dates
- Set confidence to "high" if clearly legible, "medium" if partially legible, "low" if guessed
- For passports, extract MRZ data if visible
- For Good Standing / company certificates, focus on company details
- Return ONLY valid JSON, no additional text`;

/**
 * Extrai dados de um documento usando Claude API (visão).
 * @param {string} base64Data - Dados do ficheiro em base64
 * @param {string} mimeType - Tipo MIME (image/jpeg, image/png, application/pdf)
 * @returns {object} Dados extraídos ou erro
 */
function extractDocumentWithClaude(base64Data, mimeType) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY not configured in Script Properties');
  }

  // Para PDFs, Claude aceita como document type
  const mediaType = mimeType === 'application/pdf' ? 'application/pdf' : mimeType;
  const sourceType = mimeType === 'application/pdf' ? 'base64' : 'base64';
  const contentType = mimeType === 'application/pdf' ? 'document' : 'image';

  const requestBody = {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: contentType,
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data
            }
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT
          }
        ]
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CLAUDE_API_URL, options);
  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode !== 200) {
    Logger.log('Claude API error: ' + statusCode + ' — ' + responseText);
    throw new Error('Claude API returned status ' + statusCode);
  }

  const result = JSON.parse(responseText);
  const textContent = result.content.find(c => c.type === 'text');
  if (!textContent) {
    throw new Error('No text content in Claude response');
  }

  // Parse the JSON from Claude's response
  let extracted;
  try {
    // Try to extract JSON from the response (Claude might wrap it in markdown)
    let jsonText = textContent.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }
    extracted = JSON.parse(jsonText);
  } catch (parseError) {
    Logger.log('Failed to parse Claude response: ' + textContent.text);
    throw new Error('Failed to parse extraction result');
  }

  return extracted;
}

/**
 * Guarda um ficheiro no Drive (pasta pending) durante a extração.
 * Retorna o ID do ficheiro guardado.
 */
function saveExtractedFileToDrive(base64Data, mimeType, fileName) {
  const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  // Criar ou obter pasta "pending_uploads"
  let pendingFolder;
  const existing = parentFolder.getFoldersByName('pending_uploads');
  if (existing.hasNext()) {
    pendingFolder = existing.next();
  } else {
    pendingFolder = parentFolder.createFolder('pending_uploads');
  }

  const decoded = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(decoded, mimeType, fileName);
  const file = pendingFolder.createFile(blob);

  return file.getId();
}

/**
 * Move ficheiros de pending_uploads para a pasta do cliente.
 */
function movePendingFiles(fileIds, clientFolderId) {
  const clientFolder = DriveApp.getFolderById(clientFolderId);

  // Criar subpasta para documentos originais
  let docsFolder;
  const existing = clientFolder.getFoldersByName('documentos_originais');
  if (existing.hasNext()) {
    docsFolder = existing.next();
  } else {
    docsFolder = clientFolder.createFolder('documentos_originais');
  }

  fileIds.forEach(fileId => {
    try {
      const file = DriveApp.getFileById(fileId);
      file.moveTo(docsFolder);
    } catch (e) {
      Logger.log('Failed to move file ' + fileId + ': ' + e.toString());
    }
  });
}

const fs = require('fs');
const path = require('path');

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGkmjSZCgsXEVcm618ZTiC5j0gtwYg0yX7B5vEYEBMcBIXKSAllazGeGC-mt8mxKS8/exec';
const DOC_DIR = path.join('C:', 'Users', 'yvess', 'OneDrive - OnCorporate', 'TAX CONSULTING - Documentos', 'CLIENTES', 'Teamed', 'Portal');

async function testExtract(fileName, mimeType) {
  console.log(`\n=== Testing: ${fileName} ===`);
  const filePath = path.join(DOC_DIR, fileName);
  const base64 = fs.readFileSync(filePath).toString('base64');
  console.log(`File size: ${(base64.length / 1024).toFixed(0)} KB (base64)`);

  const start = Date.now();
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'extractDocument', base64Data: base64, mimeType, fileName }),
      redirect: 'follow'
    });
    const text = await res.text();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Response: ${res.status} (${elapsed}s)`);

    const result = JSON.parse(text);
    if (result.status === 'success' && result.extraction) {
      console.log(`Document type: ${result.extraction.document_type}`);
      const fields = result.extraction.extracted_fields || {};
      Object.entries(fields).forEach(([k, v]) => {
        if (v && v.value) console.log(`  ${k}: ${v.value} (${v.confidence})`);
      });
      console.log(`File saved to Drive: ${result.fileId}`);
      return true;
    } else {
      console.log('ERROR:', result.message);
      return false;
    }
  } catch (e) {
    console.log('FETCH ERROR:', e.message);
    return false;
  }
}

async function main() {
  console.log('Testing extraction with real documents...\n');

  // Test 1: Passport
  await testExtract('Denisa - passport.png', 'image/png');

  // Test 2: Proof of address
  await testExtract('Denisa - proof of address.pdf', 'application/pdf');

  // Test 3: Good Standing
  await testExtract('good standing ambar.pdf', 'application/pdf');

  console.log('\n=== ALL TESTS COMPLETE ===');
}

main();

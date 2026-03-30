function testGmail() {
  GmailApp.sendEmail('yvessammy@hotmail.com', 'Teste Portal OnCorporate (GmailApp)', '<h2>Teste</h2><p>Se recebeu este email, funciona!</p>', {htmlBody: '<h2>Teste</h2><p>Se recebeu este email, funciona!</p>'});
  Logger.log('Email sent via GmailApp');
}

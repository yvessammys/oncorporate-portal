function checkEmail() {
  Logger.log('Remaining daily quota: ' + MailApp.getRemainingDailyQuota());
  Logger.log('Effective user: ' + Session.getEffectiveUser().getEmail());
}

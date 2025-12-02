const translations = require('./translations');

function getTranslation(key, language) {
  if (!translations[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return translations[language][key] || key;
}

module.exports = { getTranslation };
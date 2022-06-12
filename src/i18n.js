import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import sv from './i18n/sv.json';
import no from './i18n/no.json';
import zh from './i18n/zh.json';
import tr from './i18n/tr.json';
import de from './i18n/de.json';
import de from './i18n/ru.json';
import { Globals } from './Globals';
import i18nextReactNative from 'i18next-react-native-language-detector'

Globals.language = i18nextReactNative.detect().substring(0,2);

if (Globals.language == "zh") {
  Globals.language = 'zh-cn';
}

i18next
  // .use(languageDetector)
  .use(i18nextReactNative)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    debug: true,
    resources: {
      en: {
        translation: en,
      },
      sv: {
        translation: sv,
      },
      no: {
        translation: no,
      },
      nb: {
        translation: no,
      },
      zh: {
        translation: zh,
      },
      tr: {
        translation: tr,
      },
      de: {
        translation: de,
      },
      ru: {
        translation: ru,
      },
    },
  });


  export default i18next;

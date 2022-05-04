import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import sv from './i18n/sv.json';
import no from './i18n/no.json';
import zh from './i18n/zh.json';
// import { Globals } from './Globals';
import i18nextReactNative from 'i18next-react-native-language-detector'

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
    },
  });


  export default i18next;

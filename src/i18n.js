import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import sv from './i18n/sv.json';
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
    },
  });


  export default i18next;

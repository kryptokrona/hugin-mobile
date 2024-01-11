import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import sv from './i18n/sv.json';
import no from './i18n/no.json';
import zh from './i18n/zh.json';
import tr from './i18n/tr.json';
import de from './i18n/de.json';
import ru from './i18n/ru.json';
import fi from './i18n/fi.json';
import pt from './i18n/pt.json';
import uk from './i18n/uk.json';
import hi from './i18n/hi.json';
import mr from './i18n/mr.json';
import id from './i18n/id.json';
import te from ',/i18n/te.json';
import ph from './i18n/ph.json';
import fr from './i18n/fr.json';
import gu from './i18n/gu.json';

import { Globals } from './Globals';
import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';

Globals.language = 'en'

if (Globals.language == "zh") {
  Globals.language = 'zh-cn';
}

i18next
  // .use(languageDetector)
  .use(RNLanguageDetector)
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
      fi: {
        translation: fi,
      },
      pt: {
        translation: pt,
      },
      uk: {
        translation: uk,
      },
      hi: {
        translation: hi,
      },
      mr: {
        translation: mr,
      },
      te: {
        translation: te,
      },
      id: {
        translation: id,
      },
      ph: {
        translation: ph,
      },
      fr: {
        translation: fr,
      },
      gu: {
        translation: gu,
      }


    },
  });


export default i18next;

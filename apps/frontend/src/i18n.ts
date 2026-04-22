import i18n from 'i18next'
import { initReactI18next} from "react-i18next";
import eng from './translate/eng.json'
import esp from './translate/esp.json'
import mandarin from './translate/mandarin.json'
import hindi from './translate/hindi.json'
import french from './translate/french.json'
import arabic from './translate/arabic.json'
import bengali from './translate/bengali.json'
import russian from './translate/russian.json'
import turkish from './translate/turkish.json'
import irish from './translate/irish.json'

i18n.use (initReactI18next).init({
    resources: {
        eng: { translation: eng },
        esp: { translation: esp },
        mandarin: { translation: mandarin },
        hindi: { translation: hindi },
        french: { translation: french },
        arabic: { translation: arabic },
        bengali: { translation: bengali },
        russian: { translation: russian },
        turkish: { translation: turkish },
        irish: { translation: irish },
    },
    lng: 'eng',
    fallbackLng: 'eng',
    interpolation: {
        escapeValue: false
    }
})

export default i18n;
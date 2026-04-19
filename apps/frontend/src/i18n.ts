import i18n from 'i18next'
import { initReactI18next} from "react-i18next";
import eng from './translate/eng.json'
import esp from './translate/esp.json'

i18n.use (initReactI18next).init({
    resources: {
        eng: { translation: eng },
        esp: { translation: esp },
    },
    lng: 'eng',
    fallbackLng: 'eng',
    interpolation: {
        escapeValue: false
    }
})

export default i18n;
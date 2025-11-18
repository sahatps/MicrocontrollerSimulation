import i18next from "i18next";

export function loadTranslations(){
    i18next.addResourceBundle('en_us', 'common', require('./en_us.json'));
    i18next.addResourceBundle('th_th', 'common', require('./th_th.json'));
}
import * as Localization from "expo-localization";
import i18n from "i18next";
import "intl-pluralrules";
import { initReactI18next } from "react-i18next";

import en from "./en-US";
import pt from "./pt-BR";

const resources = {
  "pt-BR": { translation: pt },
  "en-US": { translation: en },
  // Map generic language codes
  pt: { translation: pt },
  en: { translation: en },
};

const initI18n = async () => {
  try {
    const locales = Localization.getLocales();
    console.log("Detected locales:", JSON.stringify(locales));

    const locale = locales[0];
    const deviceLanguage = locale?.languageTag || "en-US";
    const languageCode = locale?.languageCode || "en";

    const availableResources: Record<string, any> = resources;

    // Tenta usar a tag completa (pt-BR), se não, o código (pt), se não fallback
    const usedLanguage = availableResources[deviceLanguage] ? deviceLanguage : availableResources[languageCode] ? languageCode : "en-US";

    console.log("Initializing i18n with language:", usedLanguage);

    await i18n.use(initReactI18next).init({
      resources,
      lng: usedLanguage,
      fallbackLng: "en-US",
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      compatibilityJSON: "v4",
    });
  } catch (e) {
    console.error("Failed to init i18n", e);
  }
};

initI18n();

export default i18n;

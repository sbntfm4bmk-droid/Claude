import Constants from "expo-constants";

// Working/provisional app name. Change here to rebrand the whole UI.
export const APP_NAME = "ProConnect";

export const APP_TAGLINE = "Le bon pro, près de chez vous";

// Base URL of the backend API. Reads from app.json -> expo.extra.apiUrl.
// On a physical device, replace localhost with your machine's LAN IP.
export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:4000";

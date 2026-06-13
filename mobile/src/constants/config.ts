import Constants from "expo-constants";

// Working/provisional app name. Change here to rebrand the whole UI.
export const APP_NAME = "ProConnect";

export const APP_TAGLINE = "Tout le meilleur, autour de vous";

// Base URL of the backend API. Reads from app.json -> expo.extra.apiUrl.
// On a physical device, replace localhost with your machine's LAN IP.
export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:4000";

// Default discovery radius (km) and the steps offered in the UI.
export const DEFAULT_RADIUS_KM = 5;
export const RADIUS_STEPS = [1, 2, 5, 10, 25, 50];

// Fallback location (central Paris) when geolocation is unavailable.
export const FALLBACK_COORDS = { lat: 48.8566, lng: 2.3522 };

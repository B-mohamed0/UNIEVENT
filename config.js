import Constants from "expo-constants";

// Retrieve the host URI that Expo provides when running the app
const hostUri = Constants.expoConfig?.hostUri;
// Fallback to localhost if not available (e.g., production build)
const ip = hostUri ? hostUri.split(":")[0] : "localhost";

// Base URL for the backend API (adjust port if needed)
export const API_URL = `http://${ip}:3000/api`;

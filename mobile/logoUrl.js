// mobile/lib/logoUrl.js
import { Platform } from "react-native";

// If you use a physical device, replace with your computer's LAN IP:
const LAN_IP = "172.20.10.2"; // ← change to your machine's IP if needed

// Android emulator uses 10.0.2.2; iOS sim uses localhost; physical devices use your LAN IP
export const BASE_URL = Platform.select({
  ios: `http://localhost:8000`,
  android: `http://10.0.2.2:8000`,
  default: `http://${LAN_IP}:8000`,
});

export const LOGO_URL = `${BASE_URL}/static/images/doulacare-logo.png`;
// If you kept the long filename with spaces, URL-encode it:
// export const LOGO_URL = `${BASE_URL}/static/images/DoulaCare%20Logo%20-%20Mother%20%26%20Baby%20Embrace.png`;

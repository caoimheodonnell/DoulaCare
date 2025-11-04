// From Youtube Video "How to create a FastAPI and React Project frontend + backend - 22 mins
// Adapted for mobile Expo setup to use local Wi-Fi IP address instead of localhost)
// mobile/api.js (Expo Go on a phone and Expo Web fallback)
import axios from "axios";
import { Platform } from "react-native";

// You can override with EXPO_PUBLIC_API_BASE
const ENV = process.env.EXPO_PUBLIC_API_BASE;

// My laptop/hotspot IP
const LAN_IP = "172.20.10.2";

const base =
  ENV
    ? ENV
    : Platform.OS === "web"
    ? "http://127.0.0.1:8000"          // Expo Web in the browser
    : `http://${LAN_IP}:8000`;         // iOS/Android device on same Wi-Fi


const api = axios.create({
  baseURL: base,
  timeout: 20000,
});



//Get all doulas (with optional filters)
export const getDoulas = async (params = {}) => {
  const response = await api.get("/doulas", { params });
  return response.data;
};

// Example call:
// getDoulas({ location: "Galway", max_price: 150, q: "birth" });

// Get services (for all or one doula)
export const getServices = async (params = {}) => {
  const response = await api.get("/services", { params });
  return response.data;
};

// Example call:
// getServices({ doula_id: 1, max_price: 100 });

// Create a booking
export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);
  return response.data;
};


//  Get bookings (for a doula or mother)
export const getBookingsForDoula = async (doula_id) => {
  const response = await api.get(`/bookings/by-doula/${doula_id}`);
  return response.data;
};

export const getBookingsForMother = async (mother_id) => {
  const response = await api.get(`/bookings/by-mother/${mother_id}`);
  return response.data;
};

export const uploadCertificate = async (asset) => {
  const form = new FormData();

  if (Platform.OS === "web") {
    const blob = await fetch(asset.uri).then((r) => r.blob());
    const file = new File([blob], asset.name || "certificate.pdf", {
      type: blob.type || "application/pdf",
    });
    form.append("file", file);
  } else {
    form.append("file", {
      uri: asset.uri,
      name: asset.name || "certificate.pdf",
      type: asset.mimeType || asset.type || "application/pdf",
    });
  }

  const { data } = await api.post("/upload/certificate", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // make absolute for RN Linking
  return data?.url?.startsWith("http")
    ? data.url
    : `${api.defaults.baseURL?.replace(/\/$/, "")}${data?.url || ""}`;
};

export default api;


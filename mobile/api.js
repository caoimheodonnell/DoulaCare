/*
  (mobile/api.js) — key differences I implemented:

  - Use ONE base URL for all platforms (PUBLIC_BASE = LAN IP or EXPO_PUBLIC_API_BASE)
    so images/PDFs uploaded on laptop or phone are visible on both.
  - Web vs Native upload handling:
      - Web: fetch asset.uri to Blob to new File(...) to FormData
      - iOS/Android: append { uri, name, type } object to FormData
  - Upload helpers (uploadPhoto/uploadCertificate) always return an ABSOLUTE URL.
  - Axios instance shares PUBLIC_BASE for every call; no localhost/127.0.0.1 mismatches.

  References:
    - FastAPI file uploads: https://fastapi.tiangolo.com/tutorial/request-files/
    - Serving static files: https://fastapi.tiangolo.com/tutorial/static-files/
    - Expo env vars (EXPO_PUBLIC_*): https://docs.expo.dev/guides/environment-variables/
    - FormData basics (MDN): https://developer.mozilla.org/en-US/docs/Web/API/FormData
    - Video: Solving Image Upload Issues in React Native Using Expo and Axios
      https://www.youtube.com/watch?v=YTFvlPApae8
    - From YouTube video “How to create a FastAPI and React Project frontend + backend”
      https://www.youtube.com/watch?v=aSdVU9-SxH4&t=648s
    - Ensures images and PDF are displayed correctly on all devices
      https://chatgpt.com/c/690cc793-99e8-8328-aff9-68b370569d64
*/

import axios from "axios";
import { Platform } from "react-native";

// Uses EXPO_PUBLIC_API_BASE if defined; otherwise falls back to your LAN IP
// This ensures the phone (via Expo Go) and web app both access the same FastAPI backend
const ENV = process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, ""); // strip trailing slash
const LAN_IP = "172.20.10.2"; // update this if your machine’s IP changes
export const PUBLIC_BASE = ENV || `http://${LAN_IP}:8000`;

// Axios instance uses the same base on ALL platforms
const api = axios.create({
  baseURL: PUBLIC_BASE,
  timeout: 20000,
});

// ----- Data fetchers -----
// Each function corresponds to a FastAPI route and is used in React Native components

export const getDoulas = async (params = {}) => {
  const response = await api.get("/doulas", { params });
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);
  return response.data;
};

export const getBookingsForDoula = async (doula_id) => {
  const response = await api.get(`/bookings/by-doula/${doula_id}`);
  return response.data;
};

export const getBookingsForMother = async (mother_id) => {
  const response = await api.get(`/bookings/by-mother/${mother_id}`);
  return response.data;
};

// ----- Uploads -----
//
// Certificates (PDF)
// https://www.youtube.com/watch?v=YTFvlPApae8 — used for form uploads
// Extended to support both web (Blob to File) and mobile (URI) contexts in Expo.
export const uploadCertificate = async (asset) => {
  const form = new FormData();

  if (Platform.OS === "web") {
    // Web: convert URI to Blob → File
    const blob = await fetch(asset.uri).then((r) => r.blob());
    const file = new File([blob], asset.name || "certificate.pdf", {
      type: blob.type || "application/pdf",
    });
    form.append("file", file);
  } else {
    // Native (iOS/Android): use file descriptor format
    form.append("file", {
      uri: asset.uri,
      name: asset.name || "certificate.pdf",
      type: asset.mimeType || asset.type || "application/pdf",
    });
  }

  const { data } = await api.post("/upload/certificate", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Return full absolute URL for consistent rendering
  return data?.url?.startsWith("http")
    ? data.url
    : `${PUBLIC_BASE}${data?.url || ""}`;
};

// Photos (JPG/PNG/WebP)
// Upload profile photo (JPG, PNG, WebP)
// https://www.youtube.com/watch?v=YTFvlPApae8 - used for multipart form uploads
// Similar to certificate upload - supports both web (Blob to File) and mobile (URI) contexts in Expo
export const uploadPhoto = async (asset) => {
  const form = new FormData();

  if (Platform.OS === "web") {
    let fileObj;
    if (asset.file instanceof File) {
      fileObj = asset.file;
    } else {
      const blob = await fetch(asset.uri).then((r) => r.blob());
      fileObj = new File([blob], asset.name || "photo.jpg", {
        type: blob.type || asset.mimeType || "image/jpeg",
      });
    }
    form.append("file", fileObj);
  } else {
    form.append("file", {
      uri: asset.uri,
      name: asset.name || "photo.jpg",
      type: asset.mimeType || asset.type || "image/jpeg",
    });
  }

  const { data } = await api.post("/upload/photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Always return ABSOLUTE URL so RN + web can load it
  return data?.url?.startsWith("http")
    ? data.url
    : `${PUBLIC_BASE}${data?.url || ""}`;
};

// ----- Helpers -----
// Converts a relative URL (e.g. "/static/images/pic.jpg") into a full absolute URL
// by prepending PUBLIC_BASE - ensures images and PDFs display correctly on all devices.
// References:
//   - FastAPI StaticFiles docs: https://fastapi.tiangolo.com/tutorial/static-files/
//   - ChatGPT: https://chatgpt.com/c/690ded8b-75f0-832f-86f9-353f381f062b
export const toAbsolute = (u) => {
  if (!u) return u;
  const s = typeof u === "string" ? u.trim() : u;

  // If it’s already absolute, rewrite localhost/127.0.0.1 to PUBLIC_BASE
  if (/^https?:\/\//i.test(s)) {
    return s.replace(
      /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i,
      PUBLIC_BASE
    );
  }

  // Protocol-relative (rare): //host/path
  if (s.startsWith("//")) return `http:${s}`;

  // Relative to prepend PUBLIC_BASE
  return `${PUBLIC_BASE}${s.startsWith("/") ? s : "/" + s}`;
};

// Converts an absolute URL back to relative for storage consistency.
export const toRelative = (url) =>
  url?.startsWith(PUBLIC_BASE) ? url.slice(PUBLIC_BASE.length) : url;

// ----- Default export -----
export default api;

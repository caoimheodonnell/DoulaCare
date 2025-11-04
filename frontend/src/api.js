// From Youtube Video "How to create a FastAPI and React Project frontend and backend - 22 mins
// (Adapted for mobile Expo setup to use local hotspot address instead of localhost)
import axios from "axios";

// Connects your React frontend to the FastAPI backend
// This will automatically use localhost while testing on your laptop
// or your Wi-Fi IP when testing on your phone with Expo

const api = axios.create({

  // Otherwise, fall back to localhost for browser testing
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000",
});

export default api;

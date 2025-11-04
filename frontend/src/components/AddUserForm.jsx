/*
  Code adapted from YouTube video:
  "How to create a FastAPI and React Project frontend + backend" (23 mins, 2024)
  and further refined during ChatGPT consultation (October 2025) for better validation and error handling.

  Adaptations for DoulaCare project:
   - Integrated axios instance (api.js) for POST requests to FastAPI backend (/users).
   - Replaced tutorial’s minimal form logic with full input validation (empty fields and numeric price checks).
   - Added error alerts and console logging for easier debugging.
   - Used optional callback (onDoulaAdded) to trigger parent refresh (Users.jsx).
   - Included verified field (false by default) to match database schema.
   - Simplified the UI for readability — part of the proof-of-value prototype.

*/

import React, { useState } from "react";
import api from "../api";

// Functional component for adding a new user
// useState hooks store and update the user's input (name, location, price) so React can control form data dynamically

const AddUserForm = ({ onDoulaAdded }) => {
  // useState hooks for form field management
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");

  // Handles form submission and sends data to FastAPI backend
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevents page reload on form submit

    // Basic input validation
    if (!name || !location || !price) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // POST request to FastAPI backend (/users)
      await api.post("/users", {
        name,
        location,
        price: parseFloat(price), // convert to number
        verified: false, // default verification status
      });

      // Clear input fields after successful submission
      setName("");
      setLocation("");
      setPrice("");

      // Notify parent component (Users.jsx) to refresh the user list
      onDoulaAdded?.();
    } catch (err) {
      // Handle API or network errors gracefully
      const msg = err?.response
        ? `${err.response.status} ${err.response.statusText}\n${JSON.stringify(err.response.data)}`
        : err?.message || "Unknown error";
      alert("Error adding user:\n" + msg);
      console.error("Error details:", err);
    }
  };

  // JSX layout for the input form
  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
      {/* Input fields for name, location, and price */}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <input
        type="number"
        placeholder="Price (€)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      {/* Submit button triggers handleSubmit() */}
      <button type="submit">Add User</button>
    </form>
  );
};

export default AddUserForm;


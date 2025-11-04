/*
  Code adapted from YouTube video:
  "How to create a FastAPI and React Project frontend + backend" (23 mins)
  and modified for the DoulaCare web version

  Adaptations for DoulaCare project:
   - Integrated FastAPI backend using axios instance (api.js).
   - Replaced static examples from tutorial with dynamic MySQL data (GET + POST endpoints).
   - Added verified status display for users (boolean field from database).
   - Connected AddUserForm component to allow creating new users and refreshing the list.
   - Enhanced error handling for smoother user experience when backend is unavailable.
   - Adjusted UI layout for simplicity and readability for the front end.

*/

import React, { useEffect, useState } from "react";
import api from "../api";
import AddUserForm from "./AddUserForm";

// Functional component for displaying all users fetched from the FastAPI backend
const Users = () => {
  const [users, setUsers] = useState([]); // State variable to hold all users

  // Fetch all users from backend using GET request
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/"); // Backend accepts /users or /users/
      setUsers(response.data); // Update the user list in state
    } catch (error) {
      console.error("Error fetching users", error); // Log error if backend call fails
    }
  };

  // useEffect runs when component first loads — like componentDidMount()
  useEffect(() => {
    fetchUsers(); // Automatically load user data on page load
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>User List</h2>

      {/* Include AddUserForm, which POSTs new data and then calls fetchUsers() */}
      <AddUserForm onDoulaAdded={fetchUsers} />

      {/* Display all users in a simple HTML list */}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <strong>{u.name}</strong> — {u.location} (€{u.price}){" "}
            {u.verified ? "Verified" : "Not verified"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Users;


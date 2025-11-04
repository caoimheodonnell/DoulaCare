/*
 From Youtube Video "How to create a FastAPI and React Project frontend and backend - 25 mins
 This is the main point for the React frontend.
 It loads the Users component, which connects to the FastAPI backend
 and displays the list of users from the database.
*/
import "./App.css";
import Users from "./components/Users.jsx";

// Main App component = this is what gets rendered in the browser
export default function App() {
  return (
    <div className="App" style={{ padding: 16 }}>
      <header>
        <h1>DoulaCare</h1>
      </header>

      <main>
        <Users />
      </main>
    </div>
  );
}

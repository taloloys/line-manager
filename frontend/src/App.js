import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import QueueDisplay from "./pages/QueueDisplay";
import QueueManagement from "./pages/QueueManagement";
import ServedRecords from "./pages/ServedRecords";
import SettingsPage from "./pages/SettingsPage"; // Uncomment if you have a settings page
import './App.css';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Route without Sidebar */}
          <Route path="/queue-display" element={<QueueDisplay />} />
          
          {/* Routes with Sidebar */}
          <Route
            path="*"
            element={
              <div className="app">
                <Sidebar />
                <div className="content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/queue-management" element={<QueueManagement />} />
                    <Route path="/records" element={<ServedRecords />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    {/* Add more routes here */}
                  </Routes>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;

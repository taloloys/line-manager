import React, { useState } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const MenuButton = () => (
    <button 
      className="menu-toggle"
      onClick={toggleSidebar}
      aria-label="Toggle menu"
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        {isSidebarOpen ? (
          <path d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );

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
              <div className={`app ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <div className="content">
                  <MenuButton />
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

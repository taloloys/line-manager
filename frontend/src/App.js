import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import QueueDisplay from "./pages/QueueDisplay";
import QueueManagement from "./pages/QueueManagement";
import './App.css';

const App = () => {
  return (
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
                  {/* Add more routes here */}
                </Routes>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

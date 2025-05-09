import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Line Manager</h2>
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/queue-management">Queue Management</Link></li>
        <li><Link to="/records">Served Records</Link></li>
        <li><Link to="/settings">Settings</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
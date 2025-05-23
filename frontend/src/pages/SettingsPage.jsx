import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import "./SettingsPage.css";

const SettingsPage = () => {
  const [maxQueueSize, setMaxQueueSize] = useState(50);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  // ✅ Fetch the current max queue size
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/settings/queue-size")
      .then(response => setMaxQueueSize(response.data.max_queue_size))
      .catch(error => console.error("Error fetching queue size:", error));
  }, []);

  // ✅ Update max queue size
  const updateQueueSize = () => {
    axios.put("http://127.0.0.1:8000/api/settings/queue-size", { max_queue_size: maxQueueSize })
      .then(response => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      })
      .catch(error => console.error("Error updating queue size:", error));
  };

  // ✅ Reset queue
  const resetQueue = () => {
    axios.delete("http://127.0.0.1:8000/api/settings/reset-queue")
      .then(response => {
        setShowResetSuccess(true);
        setShowResetModal(false);
        setTimeout(() => setShowResetSuccess(false), 3000);
      })
      .catch(error => console.error("Error resetting queue:", error));
  };

  // Confirmation Modal Component
  const ResetConfirmationModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">⚠️ Reset Queue Confirmation</h3>
        <p className="modal-message">
          Are you sure you want to reset the queue? This action will:
          <ul>
            <li>Remove all customers from the current queue</li>
            <li>Reset all queue numbers</li>
            <li>This action cannot be undone</li>
          </ul>
        </p>
        <div className="modal-buttons">
          <button className="modal-cancel" onClick={() => setShowResetModal(false)}>
            Cancel
          </button>
          <button className="modal-confirm" onClick={resetQueue}>
            Yes, Reset Queue
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="theme-switch-wrapper">
        <label className="theme-switch">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleTheme}
          />
          <span className="slider"></span>
        </label>
        <span className="label">{darkMode ? '🌙' : '☀️'}</span>
      </div>

      <h2>Queue Settings</h2>
      

      <div className="settings-section">
        <h3>Queue Configuration</h3>
        <div className="input-group">
          <label>Maximum Queue Size:</label>
          <input
            type="number"
            min="1"
            max="1000"
            value={maxQueueSize}
            onChange={(e) => setMaxQueueSize(e.target.value)}
          />
          <p className="input-help">Set the maximum number of customers that can be in the queue at once.</p>
        </div>
        
        <button className="settings-btn" onClick={updateQueueSize}>
          Update Queue Size
        </button>

        {showSuccess && (
          <div className="success-message">
            Queue size updated successfully!
          </div>
        )}
      </div>

      <div className="settings-section danger-zone">
        <h3>⚠️ Danger Zone</h3>
        <p className="input-help">
          Reset the entire queue system. This will remove all customers from the queue and reset all queue numbers.
          This action cannot be undone.
        </p>
        <button className="reset-btn" onClick={() => setShowResetModal(true)}>
          <span>🗑️</span> Reset Queue
        </button>
        {showResetSuccess && (
          <div className="success-message">
            Queue reset successfully!
          </div>
        )}
      </div>

      {showResetModal && <ResetConfirmationModal />}
    </div>
  );
};

export default SettingsPage;
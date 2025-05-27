import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import Swal from 'sweetalert2';
import { 
  FaSun, 
  FaMoon, 
  FaExclamationTriangle, 
  FaTrash 
} from "react-icons/fa";
import "./SettingsPage.css";

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    max_queue_size: 50,
    notification_sound: true,
    auto_refresh_interval: 5,
    display_timeout: 30,
    privacy_mode: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode, toggleTheme } = useTheme();

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/settings");
        setSettings(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load settings. Please try again later.");
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Update settings
  const updateSettings = async () => {
    try {
      await axios.put("http://127.0.0.1:8000/api/settings", settings);
      
      // Show success popup
      Swal.fire({
        icon: 'success',
        title: 'Settings Updated!',
        text: 'Your settings have been saved successfully.',
        showConfirmButton: false,
        timer: 2000,
        position: 'center',
        background: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#ecf0f1' : '#2c3e50'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to update settings. Please try again later.',
        confirmButtonColor: '#27ae60',
        background: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#ecf0f1' : '#2c3e50'
      });
      console.error("Error updating settings:", err);
    }
  };

  // Reset queue with confirmation
  const confirmResetQueue = () => {
    Swal.fire({
      title: 'Reset Queue Confirmation',
      html: `
        <div class="reset-confirmation">
          <p>Are you sure you want to reset the queue? This action will:</p>
          <ul>
            <li>Remove all customers from the current queue</li>
            <li>Reset all queue numbers</li>
            <li>Clear all waiting and served records</li>
          </ul>
          <p class="warning">This action cannot be undone!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e67e22',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Yes, Reset Queue',
      cancelButtonText: 'Cancel',
      background: darkMode ? '#2d2d2d' : '#ffffff',
      color: darkMode ? '#ecf0f1' : '#2c3e50'
    }).then((result) => {
      if (result.isConfirmed) {
        resetQueue();
      }
    });
  };

  // Reset queue
  const resetQueue = async () => {
    try {
      await axios.delete("http://127.0.0.1:8000/api/settings/reset-queue");
      
      // Show success popup
      Swal.fire({
        icon: 'success',
        title: 'Queue Reset Successfully!',
        text: 'The queue has been cleared and reset.',
        showConfirmButton: false,
        timer: 2000,
        position: 'center',
        background: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#ecf0f1' : '#2c3e50'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to reset queue. Please try again later.',
        confirmButtonColor: '#27ae60',
        background: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#ecf0f1' : '#2c3e50'
      });
      console.error("Error resetting queue:", err);
    }
  };

  // Test notification sound
  const testNotificationSound = () => {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play()
      .then(() => {
        // Show success toast
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: darkMode ? '#2d2d2d' : '#ffffff',
          color: darkMode ? '#ecf0f1' : '#2c3e50'
        });

        Toast.fire({
          icon: 'success',
          title: 'Playing notification sound'
        });
      })
      .catch(err => {
        console.error("Error playing sound:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to play notification sound.',
          confirmButtonColor: '#27ae60',
          background: darkMode ? '#2d2d2d' : '#ffffff',
          color: darkMode ? '#ecf0f1' : '#2c3e50'
        });
      });
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-content">
        <div className="settings-header">
          <h2>
            Settings
          </h2>
          <div className="theme-switch-wrapper">
            <label className="theme-switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={toggleTheme}
              />
              <span className="slider"></span>
            </label>
            <span className="label">{darkMode ? <FaMoon /> : <FaSun />}</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="icon"><FaExclamationTriangle /></span>
            {error}
          </div>
        )}

        <div className="settings-section">
          <h3>
            Queue Configuration
          </h3>
          <div className="input-group">
            <label htmlFor="maxQueueSize">Maximum Queue Size:</label>
            <input
              id="maxQueueSize"
              type="number"
              min="1"
              max="1000"
              value={settings.max_queue_size}
              onChange={(e) => setSettings({
                ...settings,
                max_queue_size: parseInt(e.target.value)
              })}
            />
            <p className="input-help">Set the maximum number of customers that can be in the queue at once.</p>
          </div>

          <div className="input-group">
            <label htmlFor="autoRefresh">Auto-refresh Interval (seconds):</label>
            <input
              id="autoRefresh"
              type="number"
              min="1"
              max="60"
              value={settings.auto_refresh_interval}
              onChange={(e) => setSettings({
                ...settings,
                auto_refresh_interval: parseInt(e.target.value)
              })}
            />
            <p className="input-help">How often the queue display should refresh automatically.</p>
          </div>

          <div className="input-group">
            <label htmlFor="displayTimeout">Display Timeout (seconds):</label>
            <input
              id="displayTimeout"
              type="number"
              min="5"
              max="300"
              value={settings.display_timeout}
              onChange={(e) => setSettings({
                ...settings,
                display_timeout: parseInt(e.target.value)
              })}
            />
            <p className="input-help">How long to show each customer's information on the display screen.</p>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            Notification Settings
          </h3>
          <div className="input-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.notification_sound}
                onChange={(e) => setSettings({
                  ...settings,
                  notification_sound: e.target.checked
                })}
              />
              Enable notification sound
            </label>
            <button 
              className="test-sound-btn"
              onClick={testNotificationSound}
              disabled={!settings.notification_sound}
            >
              Test Sound
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            Privacy Settings
          </h3>
          <div className="input-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.privacy_mode}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy_mode: e.target.checked
                })}
              />
              Enable privacy mode
            </label>
            <p className="input-help">When enabled, customer names will be hidden on the public display screen.</p>
          </div>
        </div>

        <div className="settings-actions">
          <button className="settings-btn save" onClick={updateSettings}>
            Save Changes
          </button>
        </div>

        <div className="settings-section danger-zone">
          <h3>
            <span className="icon"><FaExclamationTriangle /></span>
            Danger Zone
          </h3>
          <p className="warning-text">
            Reset the entire queue system. This will remove all customers from the queue and reset all queue numbers.
            This action cannot be undone.
          </p>
          <button 
            className="reset-btn" 
            onClick={confirmResetQueue}
          >
            <span className="icon"><FaTrash /></span>
            Reset Queue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
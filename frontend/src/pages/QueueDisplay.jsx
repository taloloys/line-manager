import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { FaExclamationTriangle, FaBullhorn } from "react-icons/fa";
import "./QueueDisplay.css";

const QueueDisplay = () => {
  const [currentQueue, setCurrentQueue] = useState(null);
  const [nextQueue, setNextQueue] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settings, setSettings] = useState({
    notification_sound: true,
    privacy_mode: true
  });
  const { darkMode } = useTheme();
  const [lastNotifiedQueueNumber, setLastNotifiedQueueNumber] = useState(null);
  const lastNotifiedRef = useRef(null); // <-- add this line

  const fetchSettings = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/settings");
      setSettings(response.data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueueData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/queue/status");
      const queue = Array.isArray(response.data.queue) ? response.data.queue : [];
      const waitingCustomers = queue.filter(q => q.status === "waiting");

      // Get current queue
      const current = waitingCustomers[0] || null;

      // Only play notification if the queue number is new
      if (
        current?.queue_number &&
        current.queue_number !== lastNotifiedRef.current
      ) {
        playNotification();
        setLastNotifiedQueueNumber(current.queue_number);
        lastNotifiedRef.current = current.queue_number; // <-- update ref here
      }

      setCurrentQueue(current);

      // Get next 3 in queue (excluding current)
      setNextQueue(waitingCustomers.slice(1, 4));

      setError(null);
    } catch (err) {
      console.error("Queue Display Error:", err);
      if (err.response && err.response.status === 404) {
        setCurrentQueue(null);
        setNextQueue([]);
        setError(null);
      } else {
        setError("System is temporarily unavailable");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const playNotification = () => {
    if (settings.notification_sound) {
      const audio = new Audio("/sounds/notification.mp3");
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const displayCustomerInfo = (queue) => {
    if (!queue) return '';
    
    if (settings.privacy_mode) {
      return `${queue.purpose}`;
    }
    return `${queue.customer_name} - ${queue.purpose}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="queue-display">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading queue display...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="queue-display">
        <div className="error">
          <span className="error-icon"><FaExclamationTriangle /></span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-display">
      <div className="display-header">
        <div className="header-content">
          <h1>Queue Display</h1>
          <div className="current-time">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="queue-display-content">
        <div className="current-number">
          {currentQueue ? (
            <div className="current-queue-info">
              <div className="number">#{currentQueue.queue_number}</div>
              <div className="purpose">{displayCustomerInfo(currentQueue)}</div>
              <div className="status-indicator">
                <span className="pulse"></span>
                Now Serving
              </div>
            </div>
          ) : (
            <div className="no-queue">
              <p>No Active Queue</p>
              <div className="subtitle">The service counter is ready for customers</div>
            </div>
          )}
        </div>

        <div className="next-numbers">
          <h2>Next in Line</h2>
          {nextQueue.length > 0 ? (
            <div className="next-grid">
              {nextQueue.map((queue, index) => (
                <div key={queue.queue_number} className="next-item">
                  <div className="position-label">Position {index + 1}</div>
                  <div className="next-number">#{queue.queue_number}</div>
                  <div className="next-purpose">{displayCustomerInfo(queue)}</div>
                  <div className="wait-time">
                    Waiting since {new Date(queue.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-waiting">
              <p>No customers waiting</p>
              <small>Queue is currently empty</small>
            </div>
          )}
        </div>
      </div>

      <div className="display-footer">
        <div className="announcement">
          <span className="icon"><FaBullhorn /></span>
          Please wait for your number to be called
        </div>
        <p className="footer-note">Thank you for your patience</p>
      </div>
    </div>
  );
};

export default QueueDisplay;
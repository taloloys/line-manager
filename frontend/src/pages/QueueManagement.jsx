import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import Swal from 'sweetalert2';
import "./QueueManagement.css";

const QueueManagement = () => {
  const [queueList, setQueueList] = useState([]);
  const [currentQueue, setCurrentQueue] = useState(null);
  const [nextCustomer, setNextCustomer] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [settings, setSettings] = useState({
    notification_sound: true,
    privacy_mode: true
  });
  const { darkMode } = useTheme();

  const fetchQueueData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/queue/status");
      // Handle empty or non-array response gracefully
      const queue = Array.isArray(response.data.queue) ? response.data.queue : [];
      const waitingCustomers = queue.filter(q => q.status === "waiting");
      setQueueList(waitingCustomers);
      setCurrentQueue(waitingCustomers[0] || null);
      setNextCustomer(waitingCustomers[1] || null);
      setError(null);
    } catch (err) {
      // Only set error for actual API failures, not for 404 (no queue data)
      if (err.response && err.response.status === 404) {
        // Reset states to empty values
        setQueueList([]);
        setCurrentQueue(null);
        setNextCustomer(null);
        setError(null);
      } else {
        // Only show error for actual API failures
        setError("Unable to connect to the server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/settings");
      setSettings(response.data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const playSound = () => {
    if (settings.notification_sound) {
      const audio = new Audio("/sounds/notification.mp3");
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const showNotification = (message, type = 'success') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });

    Toast.fire({
      icon: type,
      title: message
    });
  };

  const handleConfirmAction = (action, customer) => {
    setConfirmAction({ action, customer });
  };

  const handleServeCustomer = async () => {
    try {
      const response = await axios.put("http://127.0.0.1:8000/api/queue/serve-next");
      setQueueList(prev => prev.filter(q => q.queue_number !== currentQueue.queue_number));
      setCurrentQueue(response.data.nextQueue ?? null);
      
      // Show success popup
      Swal.fire({
        icon: 'success',
        title: 'Customer Served!',
        text: `Queue #${currentQueue.queue_number} has been served successfully.`,
        showConfirmButton: false,
        timer: 2000,
        position: 'center',
        background: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#ecf0f1' : '#2c3e50'
      });
      
      playSound();
      setConfirmAction(null);
    } catch (err) {
      console.error("Serve Error:", err.response?.data?.message || err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to serve the customer. Please try again.',
        confirmButtonColor: '#27ae60',
        background: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#ecf0f1' : '#2c3e50'
      });
    }
  };

  const handleSkipCustomer = async (queue_number) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/queue/skip/${queue_number}`);
      setQueueList(prev => prev.filter(q => q.queue_number !== queue_number));
      
      // Show success popup
      Swal.fire({
        icon: 'info',
        title: 'Customer Skipped',
        text: `Queue #${queue_number} has been skipped.`,
        showConfirmButton: false,
        timer: 2000,
        position: 'center',
        background: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#ecf0f1' : '#2c3e50'
      });
      
      setConfirmAction(null);
    } catch (err) {
      console.error("Skip Error:", err.response?.data?.message || err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to skip the customer. Please try again.',
        confirmButtonColor: '#27ae60',
        background: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#ecf0f1' : '#2c3e50'
      });
    }
  };

  const formatWaitingTime = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const displayCustomerInfo = (queue) => {
    if (!queue) return '';
    
    if (settings.privacy_mode) {
      return `${queue.purpose}`;
    }
    return `${queue.customer_name} - ${queue.purpose}`;
  };

  const ConfirmationModal = ({ action, customer, onConfirm, onCancel }) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>
          {action === 'serve' ? '✅ Serve Customer' : '⏩ Skip Customer'}
        </h3>
        <div className="modal-customer-info">
          <p className="queue-number">#{customer.queue_number}</p>
          <p className="purpose">{displayCustomerInfo(customer)}</p>
          <p className="waiting-time">
            Waiting for: {formatWaitingTime(customer.created_at)}
          </p>
        </div>
        <p className="confirmation-text">
          {action === 'serve'
            ? 'Are you sure you want to mark this customer as served?'
            : 'Are you sure you want to skip this customer?'}
        </p>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className={action === 'serve' ? 'serve-btn' : 'skip-btn'}
            onClick={() => onConfirm(customer.queue_number)}
          >
            {action === 'serve' ? 'Yes, Serve Customer' : 'Yes, Skip Customer'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="queue-management">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading queue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-management">
      <div className="queue-management-content">
        <div className="management-header">
          <h2>Queue Management</h2>
          <div className="queue-stats">
            <div className="stat">
              <span className="stat-label">Total Waiting</span>
              <span className="stat-value">{queueList.length}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message connection-error">
            <span className="icon">🔌</span>
            {error}
          </div>
        )}
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="queue-grid">
          <div className="queue-card current">
            <div className="card-header">
              <h3>🔄 Currently Serving</h3>
              {currentQueue && (
                <span className="status-badge active">
                  <span className="pulse"></span>
                  Active
                </span>
              )}
            </div>
            {currentQueue ? (
              <div className="customer-info">
                <div className="queue-number">#{currentQueue.queue_number}</div>
                <div className="purpose">{displayCustomerInfo(currentQueue)}</div>
                <div className="waiting-time">
                  Waiting for: {formatWaitingTime(currentQueue.created_at)}
                </div>
                <div className="action-buttons">
                  <button 
                    className="serve-btn"
                    onClick={() => handleConfirmAction('serve', currentQueue)}
                  >
                    ✅ Serve
                  </button>
                  <button 
                    className="skip-btn"
                    onClick={() => handleConfirmAction('skip', currentQueue)}
                  >
                    ⏩ Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No active queue</p>
                <small>Ready to serve next customer</small>
              </div>
            )}
          </div>

          <div className="queue-card next">
            <div className="card-header">
              <h3>⏩ Next in Line</h3>
              {nextCustomer && (
                <span className="status-badge waiting">
                  Ready
                </span>
              )}
            </div>
            {nextCustomer ? (
              <div className="customer-info">
                <div className="queue-number">#{nextCustomer.queue_number}</div>
                <div className="purpose">{displayCustomerInfo(nextCustomer)}</div>
                <div className="waiting-time">
                  Waiting for: {formatWaitingTime(nextCustomer.created_at)}
                </div>
                <button 
                  className="skip-btn"
                  onClick={() => handleConfirmAction('skip', nextCustomer)}
                >
                  ⏩ Skip
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <p>No customers waiting</p>
                <small>Queue is currently empty</small>
              </div>
            )}
          </div>
        </div>

        {queueList.length > 2 && (
          <div className="waiting-list">
            <h3>📋 Waiting List</h3>
            <div className="waiting-customers-grid">
              {queueList.slice(2, 6).map((customer) => (
                <div key={customer.queue_number} className="waiting-card">
                  <div className="queue-number">#{customer.queue_number}</div>
                  <div className="purpose">{displayCustomerInfo(customer)}</div>
                  <div className="waiting-time">
                    Waiting for: {formatWaitingTime(customer.created_at)}
                  </div>
                  <button 
                    className="skip-btn"
                    onClick={() => handleConfirmAction('skip', customer)}
                  >
                    ⏩ Skip
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {confirmAction && (
          <ConfirmationModal
            action={confirmAction.action}
            customer={confirmAction.customer}
            onConfirm={confirmAction.action === 'serve' ? handleServeCustomer : handleSkipCustomer}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </div>
    </div>
  );
};

export default QueueManagement;
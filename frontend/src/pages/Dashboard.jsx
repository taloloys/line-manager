import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FaTv, 
  FaPlug, 
  FaUsers, 
  FaCheckCircle, 
  FaClock, 
  FaChartBar, 
  FaSync, 
  FaForward 
} from "react-icons/fa";
import "./Dashboard.css";

const Dashboard = () => {
  const [currentQueue, setCurrentQueue] = useState(null);
  const [nextCustomer, setNextCustomer] = useState(null);
  const [servedCount, setServedCount] = useState(0);
  const [queueStats, setQueueStats] = useState({
    waitingCount: 0,
    averageWaitTime: 0,
    peakHour: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    privacy_mode: true
  });
  const navigate = useNavigate();

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
  }, []);

  const displayCustomerInfo = (queue) => {
    if (!queue) return '';
    
    if (settings.privacy_mode) {
      return queue.purpose;
    }
    return `${queue.customer_name} - ${queue.purpose}`;
  };

  const fetchQueueData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/queue/status");
      const queue = Array.isArray(response.data.queue) ? response.data.queue : [];

      // Even if queue is empty, we'll just set empty values without throwing an error
      const waitingCustomers = queue.filter(q => q.status === "waiting");
      const servedCustomers = queue.filter(q => q.status === "served");

      // Filter served customers for today
      const today = new Date();
      const servedToday = servedCustomers.filter(c => {
        if (!c.served_at) return false;
        const servedDate = new Date(c.served_at);
        return (
          servedDate.getFullYear() === today.getFullYear() &&
          servedDate.getMonth() === today.getMonth() &&
          servedDate.getDate() === today.getDate()
        );
      });

      // Calculate average wait time
      const waitTimes = servedToday.map(customer => {
        const created = new Date(customer.created_at);
        const served = new Date(customer.served_at);
        return (served - created) / (1000 * 60); // Convert to minutes
      });
      const avgWaitTime = waitTimes.length 
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 0;

      // Calculate peak hour
      const hourCounts = servedToday.reduce((acc, customer) => {
        const hour = new Date(customer.served_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      let peakHour = 'N/A';
      if (Object.keys(hourCounts).length > 0) {
        const maxHour = parseInt(Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)[0][0]);
        
        // Convert to 12-hour format with AM/PM
        const period = maxHour >= 12 ? 'PM' : 'AM';
        const hour12 = maxHour === 0 ? 12 : maxHour > 12 ? maxHour - 12 : maxHour;
        peakHour = `${hour12}:00 ${period}`;
      }

      setCurrentQueue(waitingCustomers[0] || null);
      setNextCustomer(waitingCustomers[1] || null);
      setServedCount(servedToday.length);
      setQueueStats({
        waitingCount: waitingCustomers.length,
        averageWaitTime: avgWaitTime,
        peakHour: peakHour,
      });
      setError(null);
    } catch (err) {
      // Only set error for actual API failures, not for 404 (no queue data)
      if (err.response && err.response.status === 404) {
        // Reset states to empty/default values
        setCurrentQueue(null);
        setNextCustomer(null);
        setServedCount(0);
        setQueueStats({
          waitingCount: 0,
          averageWaitTime: 0,
          peakHour: 'N/A',
        });
        setError(null);
      } else {
        // Only show error for actual API failures
        setError("Unable to connect to the server. Please check your connection.");
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Queue Management Dashboard</h2>
          <button 
            className="display-button"
            onClick={() => {
              const width = window.screen.availWidth;
              const height = window.screen.availHeight;
              window.open(
                '/queue-display',
                '_blank',
                `noopener,noreferrer,width=${width},height=${height},left=0,top=0`
              );
            }}
          >
            <span className="icon"><FaTv /></span>
            Open Queue Display
          </button>
        </div>

        {error && (
          <div className="error-message connection-error">
            <span className="icon"><FaPlug /></span>
            {error}
          </div>
        )}

        <div className="stats-overview">
          <div className="stat-card total-waiting">
            <div className="stat-icon"><FaUsers /></div>
            <div className="stat-content">
              <h3>Waiting in Queue</h3>
              <p className="stat-value">{queueStats.waitingCount}</p>
            </div>
          </div>
          <div className="stat-card total-served">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-content">
              <h3>Served Today</h3>
              <p className="stat-value">{servedCount}</p>
            </div>
          </div>
          <div className="stat-card avg-wait">
            <div className="stat-icon"><FaClock /></div>
            <div className="stat-content">
              <h3>Average Wait Time</h3>
              <p className="stat-value">{queueStats.averageWaitTime} min</p>
            </div>
          </div>
          <div className="stat-card peak-hour">
            <div className="stat-icon"><FaChartBar /></div>
            <div className="stat-content">
              <h3>Peak Hour</h3>
              <p className="stat-value">{queueStats.peakHour}</p>
            </div>
          </div>
        </div>

        <div className="queue-status-grid">
          <div className="status-card current-status">
            <h3><FaSync /> Currently Serving</h3>
            {currentQueue ? (
              <div className="queue-info">
                <div className="number-badge">#{currentQueue.queue_number}</div>
                <p className="purpose">{displayCustomerInfo(currentQueue)}</p>
                <div className="time-info">
                  <span>Waiting since: {new Date(currentQueue.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No active queue</p>
                <small>Queue management is ready for new customers</small>
              </div>
            )}
          </div>

          <div className="status-card next-customer">
            <h3><FaForward /> Next in Line</h3>
            {nextCustomer ? (
              <div className="queue-info">
                <div className="number-badge">#{nextCustomer.queue_number}</div>
                <p className="purpose">{displayCustomerInfo(nextCustomer)}</p>
                <div className="time-info">
                  <span>Waiting since: {new Date(nextCustomer.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No customers waiting</p>
                <small>Queue is currently empty</small>
              </div>
            )}
          </div>
        </div>

        <div className="quick-actions">
          <button 
            className="action-button primary"
            onClick={() => navigate('/queue-management')}
          >
            Manage Queue
          </button>
          <button 
            className="action-button secondary"
            onClick={() => navigate('/records')}
          >
            View Records
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
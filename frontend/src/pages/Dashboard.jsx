import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [currentQueue, setCurrentQueue] = useState(null);
  const [nextCustomer, setNextCustomer] = useState(null);
  const [servedCount, setServedCount] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

 const fetchQueueData = async () => {
  try {
    const response = await axios.get("http://127.0.0.1:8000/api/queue/status");
    const queue = Array.isArray(response.data.queue) ? response.data.queue : [];

    const waitingCustomers = queue.filter(q => q.status === "waiting");
    const servedCustomers = queue.filter(q => q.status === "served");

    setCurrentQueue(waitingCustomers[0] || null);
    setNextCustomer(waitingCustomers[1] || null);
    setServedCount(servedCustomers.length);
    setError(null);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Gracefully handle 404: no data yet
      setCurrentQueue(null);
      setNextCustomer(null);
      setServedCount(0);
      setError(null); // Do NOT show error
    } else {
      setError("Failed to load queue data.");
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

  const openQueueDisplay = () => {
    window.open("/queue-display", "_blank", "width=800,height=600");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h2>Queue Management Dashboard</h2>
        {loading && <p className="loading">Loading queue data...</p>}
        {error && <p className="error">{error}</p>}
        <div className="grid-container">
          <div className="box current-status">
            <h3>🔄 Currently Serving</h3>
            {currentQueue ? (
              <div>
                <p style={{ fontSize: "3rem", fontWeight: "bold" }}>#{currentQueue.queue_number}</p>
                <p>{currentQueue.customer_name}</p>
              </div>
            ) : <p>No active queue</p>}
          </div>
          <div className="box next-customer">
            <h3>⏩ Next in Line</h3>
            {nextCustomer ? (
              <div>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>#{nextCustomer.queue_number}</p>
                <p>{nextCustomer.customer_name}</p>
              </div>
            ) : <p>Waiting for next request...</p>}
          </div>
          <div className="box served-records">
            <h3>✅ Served Customers</h3>
            <p>Total Served: {servedCount}</p>
          </div>
        </div>
        <button onClick={openQueueDisplay} style={{ marginTop: "20px", padding: "10px 20px", fontSize: "1rem" }}>
          Open Queue Display
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
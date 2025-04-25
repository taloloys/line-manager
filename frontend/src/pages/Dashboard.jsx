import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [queueData, setQueueData] = useState([]);
  const [nextCustomer, setNextCustomer] = useState(null);

  const [servedCount, setServedCount] = useState(0);
  const [error, setError] = useState(null);

  // Fetch queue data from Laravel API
  const fetchQueueData = () => {
    axios.get("http://127.0.0.1:8000/api/queue/status")
      .then((response) => {
        setQueueData(response.data.queue);
        setNextCustomer(response.data.queue.find(q => q.status === 'waiting'));
        setServedCount(response.data.queue.filter(q => q.status === 'served').length);
      })
      .catch((error) => {
        console.error("API Error:", error);
        setError("Failed to load queue data.");
      });
  };

  // Auto-refresh queue every 5 seconds
  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h2>Queue Management Dashboard</h2>
        {error ? <p className="error">{error}</p> : null}

        <div className="grid-container">
          <div className="box queue-requests">
            <h3>📥 Incoming Requests</h3>
            {queueData.length > 0 ? (
              queueData.map(customer => (
                <p key={customer.id}>{customer.customer_name} - Queue #{customer.queue_number}</p>
              ))
            ) : <p>No new requests</p>}
          </div>

          <div className="box current-status">
            <h3>🔄 Current Queue Status</h3>
            {queueData.length > 0 ? (
              queueData.filter(q => q.status === "waiting").map(customer => (
                <p key={customer.queue_number}>#{customer.queue_number} - {customer.customer_name}</p>
              ))
            ) : <p>No active queue</p>}
          </div>

          <div className="box next-customer">
            <h3>⏩ Next in Line</h3>
            {nextCustomer ? (
              <p>#{nextCustomer.queue_number} - {nextCustomer.customer_name}</p>
            ) : <p>Waiting for next request...</p>}
          </div>

          <div className="box served-records">
            <h3>✅ Served Customers ({servedCount})</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
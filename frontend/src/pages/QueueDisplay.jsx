import React, { useState, useEffect } from "react";
import axios from "axios";
import "./QueueDisplay.css";

const QueueDisplay = () => {
  const [currentQueue, setCurrentQueue] = useState(null);
  const [nextCustomer, setNextCustomer] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueueData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/queue/status");
      const waitingCustomers = response.data.queue.filter(q => q.status === "waiting");
      setCurrentQueue(waitingCustomers.length > 0 ? waitingCustomers[0] : null);
      setNextCustomer(waitingCustomers.length > 1 ? waitingCustomers[1] : null);
      setError(null);
    } catch (err) {
      setError("Failed to load queue data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="queue-display">
      <h2>Queue Display</h2>
      {loading && <p className="loading">Loading queue data...</p>}
      {error && <p className="error">{error}</p>}
      <div className="queue-info">
        <div className="current-customer">
          <h3>🔄 Currently Serving</h3>
          {currentQueue ? (
            <p style={{ fontSize: "4rem", fontWeight: "bold" }}>#{currentQueue.queue_number}</p>
          ) : <p>No active queue</p>}
        </div>
        <div className="next-customer">
          <h3>⏩ Next in Line</h3>
          {nextCustomer ? (
            <p style={{ fontSize: "3rem", fontWeight: "bold" }}>#{nextCustomer.queue_number}</p>
          ) : <p>Waiting for next request...</p>}
        </div>
      </div>
    </div>
  );
};

export default QueueDisplay;
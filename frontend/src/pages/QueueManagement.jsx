import React, { useState, useEffect } from "react";
import axios from "axios";
import "./QueueManagement.css";

const QueueManagement = () => {
  const [queueList, setQueueList] = useState([]);
  const [currentQueue, setCurrentQueue] = useState(null);
  const [nextCustomer, setNextCustomer] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(""); // <-- Add this

  // Fetch queue data from Laravel API
  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/queue/status");
        const waitingCustomers = response.data.queue.filter(q => q.status === "waiting");
        setQueueList(waitingCustomers);
        setCurrentQueue(waitingCustomers.length > 0 ? waitingCustomers[0] : null);
        setNextCustomer(waitingCustomers.length > 1 ? waitingCustomers[1] : null);
        setError(null);
      } catch (err) {
        setError("Failed to load queue data.");
      } finally {
        setLoading(false);
      }
    };

    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Function to play sound when serving a customer
  const playSound = () => {
    new Audio("/sounds/notification.mp3").play();
  };

  // Serve current customer using backend `serveNext()`
  const serveCustomer = async () => {
    try {
      const response = await axios.put("http://127.0.0.1:8000/api/queue/serve-next");
      setQueueList(queueList.filter(q => q.queue_number !== currentQueue.queue_number));
      setCurrentQueue(response.data.nextQueue ?? null);
      playSound()
    } catch (err) {
      console.error("Serve Error:", err.response?.data?.message || err.message);
      setError("Failed to serve the customer. Please try again.");
    }
  };

  // Skip current or next customer
  const skipCustomer = async (queue_number) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/queue/skip/${queue_number}`);
      setQueueList(queueList.filter(q => q.queue_number !== queue_number));
      setNotification("Customer skipped successfully!"); // <-- Set notification
      setTimeout(() => setNotification(""), 2000); // Hide after 3 seconds
    } catch (err) {
      console.error("Skip Error:", err.response?.data?.message || err.message);
      setError("Failed to skip the customer. Please try again.");
    }
  };

return (
    <div className="queue-management">
        <h2>Queue Management</h2>

        {loading && <p>Loading queue data...</p>}
        {error && <p className="error">{error}</p>}
        {notification && <p className="notification">{notification}</p>} {/* Show notification */}

        <div className="queue-grid">
            {/* Current Queue */}
            <div className="queue-card">
                <h3>🔄 Currently Serving</h3>
                {currentQueue ? (
                    <div>
                        <p className="queue-number">#{currentQueue.queue_number}</p>
                        <p className="customer-name">{currentQueue.customer_name}</p>
                        <button className="serve-btn" onClick={async () => {
                            try {
                                await serveCustomer();
                            } catch (err) {
                                console.error("Serve Button Error:", err);
                            }
                        }}>✅ Serve</button>
                        <button className="skip-btn" onClick={async () => {
                            try {
                                await skipCustomer(currentQueue.queue_number);
                            } catch (err) {
                                console.error("Skip Current Customer Error:", err);
                            }
                        }}>⏩ Skip</button>
                    </div>
                ) : <p>No active queue</p>}
            </div>

            {/* Next in Line */}
            <div className="queue-card">
                <h3>⏩ Next in Line</h3>
                {nextCustomer ? (
                    <div>
                        <p className="queue-number">#{nextCustomer.queue_number}</p>
                        <p className="customer-name">{nextCustomer.customer_name}</p>
                        <button className="skip-btn" onClick={async () => {
                            try {
                                await skipCustomer(nextCustomer.queue_number);
                            } catch (err) {
                                console.error("Skip Next Customer Error:", err);
                            }
                        }}>⏩ Skip</button>
                    </div>
                ) : <p>Waiting for next request...</p>}
            </div>
        </div>

        {/* Waiting List */}
        <div className="waiting-list">
            <h3>📋 Waiting Customers</h3>
            {queueList.length > 2 ? (
                queueList.slice(2).map((customer) => (
                    <div key={customer.queue_number} className="queue-card">
                        <p className="queue-number">#{customer.queue_number}</p>
                        <p className="customer-name">{customer.customer_name}</p>
                    </div>
                ))
            ) : (
                <p>No additional customers in queue.</p>
            )}
        </div>

    </div>
);
};

export default QueueManagement;
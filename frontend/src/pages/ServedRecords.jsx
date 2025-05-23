import React, { useState, useEffect } from 'react';
import './ServedRecords.css';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';


const ServedRecords = () => {
  // State variables
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [purpose, setPurpose] = useState('all');
  const [purposes, setPurposes] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('all'); // 'all', 'served', 'skipped'
  const [stats, setStats] = useState({
    total_served: 0,
    total_skipped: 0,
    by_purpose: []
  });

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // Fetch records based on filters
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/records?page=${currentPage}&date=${selectedDate}&purpose=${purpose}&search=${search}&status=${sortBy}&per_page=10`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.records || !data.records.data) {
        throw new Error('Invalid response format from server');
      }
      
      setRecords(data.records.data);
      setTotalPages(Math.ceil(data.records.total / data.records.per_page));
      setPurposes(data.purposes || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecords([]);
      setTotalPages(1);
      setPurposes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily stats
  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/records/stats', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.hasOwnProperty('total_served') || !Array.isArray(data.by_purpose)) {
        throw new Error('Invalid response format from server');
      }

      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        total_served: 0,
        total_skipped: 0,
        by_purpose: []
      });
    }
  };

  // Effect hook to fetch records when filters change
  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, [currentPage, selectedDate, purpose, sortBy]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchRecords();
  };

  // Format date and time for display
  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Generate pagination buttons
  const paginationButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          className={currentPage === i ? 'active' : ''}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  // Generate CSV data from records
  const csvData = records.map(record => ({
    Queue_Number: record.queue_number,
    Customer_Name: record.customer_name,
    Student_ID: record.student_id,
    Purpose: record.purpose,
    Email: record.email,
    Served_At: formatDateTime(record.served_at),
    Wait_Time: record.created_at && record.served_at
      ? `${Math.round((new Date(record.served_at) - new Date(record.created_at)) / (1000 * 60))} min`
      : '-'
  }));

  // Generate PDF document
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Served Customer Records', 14, 22);
    
    // Add date and filters info
    doc.setFontSize(11);
    doc.text(`Date: ${format(new Date(selectedDate), 'MMMM d, yyyy')}`, 14, 30);
    doc.text(`Purpose: ${purpose === 'all' ? 'All' : purpose}`, 14, 36);
    if (search) doc.text(`Search: ${search}`, 14, 42);

    // Create table data
    const tableColumn = ["Queue #", "Name", "Student ID", "Purpose", "Email", "Served At", "Wait Time"];
    const tableRows = records.map(record => [
      record.queue_number,
      record.customer_name,
      record.student_id,
      record.purpose,
      record.email,
      formatDateTime(record.served_at),
      record.created_at && record.served_at
        ? `${Math.round((new Date(record.served_at) - new Date(record.created_at)) / (1000 * 60))} min`
        : '-'
    ]);
    
    // Generate the table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] }
    });
    
    // Save document
    doc.save(`served-records-${selectedDate}.pdf`);
  };

  // Get top purpose
  const getTopPurpose = () => {
    if (!stats.by_purpose || stats.by_purpose.length === 0) {
      return { purpose: 'No top purpose', count: 0 };
    }
    return stats.by_purpose.reduce((max, current) => 
      current.count > max.count ? current : max
    , { purpose: 'No top purpose', count: 0 });
  };

  // Function to get status badge class
  const getStatusBadgeClass = (status) => {
    return status === 'served' ? 'status-badge served' : 'status-badge skipped';
  };

  return (
    <div className="served-records-container">
      <h1>Served Customer Records</h1>
      
      {/* Export Options */}
      <div className="export-options">
        <CSVLink 
          data={csvData} 
          filename={`served-records-${selectedDate}.csv`}
          className="export-btn csv"
        >
          Export to CSV
        </CSVLink>
        <button onClick={exportToPDF} className="export-btn pdf">
          Export to PDF
        </button>
      </div>
      
      {/* Stats Panel */}
        <div className="stats-panel">
          <div className="stat-card">
            <h3>Total Served Today</h3>
            <p className="stat-value">{stats.total_served ?? 0}</p>
          </div>
          <div className="stat-card">
            <h3>Skipped Today</h3>
            <p className="stat-value">{stats.total_skipped ?? 0}</p>
          </div>
          <div className="stat-card">
            <h3>Top Purpose</h3>
            <div className="top-purpose">
          {getTopPurpose().purpose === 'No top purpose' ? (
            <p>No top purpose</p>
          ) : (
            <>
              <p>{getTopPurpose().purpose}</p>
              <strong>{getTopPurpose().count}</strong>
            </>
          )}
            </div>
          </div>
        </div>
        

      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="date-filter">Date:</label>
          <input
            type="date"
            id="date-filter"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCurrentPage(1); // Reset to first page when date changes
            }}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1); // Reset to first page when status changes
            }}
          >
            <option value="all">All Records</option>
            <option value="served">Served</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="purpose-filter">Purpose:</label>
          <select
            id="purpose-filter"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            <option value="all">All Purposes</option>
            {purposes.map((p, index) => (
              <option key={index} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>
      
      {/* Records Table */}
      {loading ? (
        <div className="loading">Loading records...</div>
      ) : records.length === 0 ? (
        <div className="no-records">No records found for selected filters.</div>
      ) : (
        <div className="table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>Queue #</th>
                <th>Customer Name</th>
                <th>Student ID</th>
                <th>Purpose</th>
                <th>Email</th>
                <th>Status</th>
                <th>Served At</th>
                <th>Wait Time</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.queue_number}</td>
                  <td>{record.customer_name}</td>
                  <td>{record.student_id}</td>
                  <td>{record.purpose}</td>
                  <td>{record.email}</td>
                  <td>
                    <span className={getStatusBadgeClass(record.status)}>
                      {record.status}
                    </span>
                  </td>
                  <td>{formatDateTime(record.served_at)}</td>
                  <td>
                    {record.created_at && record.served_at
                      ? `${Math.round(
                          (new Date(record.served_at) - new Date(record.created_at)) /
                            (1000 * 60)
                        )} min`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {paginationButtons()}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ServedRecords;
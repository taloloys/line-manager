import React, { useState, useEffect } from 'react';
import './ServedRecords.css';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useTheme } from "../context/ThemeContext";
import { 
  FaFileExcel, 
  FaFilePdf, 
  FaCheckCircle, 
  FaForward, 
  FaChartLine, 
  FaBullseye,
  FaCalendarAlt,
  FaSearch,
  FaExclamationTriangle,
  FaInbox
} from "react-icons/fa";

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
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();

  // Initialize theme from localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Fetch records based on filters
  const fetchRecords = async () => {
    setLoading(true); // Set loading at start
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
      setError(null);
    } catch (error) {
      console.error('Error fetching records:', error);
      setError('Failed to load records. Please try again later.');
      setRecords([]);
      setTotalPages(1);
      setPurposes([]);
    } finally {
      setLoading(false); // Always ensure loading is set to false when done
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
    let isSubscribed = true;

    const fetchData = async () => {
      await fetchRecords();
      if (isSubscribed) {
        await fetchStats();
      }
    };

    fetchData();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isSubscribed = false;
    };
  }, [currentPage, selectedDate, purpose, sortBy]);

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    await fetchRecords();
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
  const generatePaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button key="1" onClick={() => handlePageChange(1)}>1</button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
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

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="ellipsis">...</span>);
      }
      buttons.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  // Generate CSV data from records
  const csvData = records.map(record => ({
    Queue_Number: record.queue_number,
    Customer_Name: record.customer_name,
    Student_ID: record.student_id || '-',
    Purpose: record.purpose || '-',
    Email: record.email || '-',
    Status: record.status,
    Served_At: formatDateTime(record.served_at),
    Wait_Time: record.created_at && record.served_at
      ? `${Math.round((new Date(record.served_at) - new Date(record.created_at)) / (1000 * 60))} min`
      : '-'
  }));

  // Generate PDF document
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title and header info
    doc.setFontSize(18);
    doc.text('Served Customer Records', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Date: ${format(new Date(selectedDate), 'MMMM d, yyyy')}`, 14, 30);
    doc.text(`Purpose: ${purpose === 'all' ? 'All' : purpose}`, 14, 36);
    if (search) doc.text(`Search: ${search}`, 14, 42);

    // Add stats
    doc.text('Summary:', 14, 50);
    doc.text(`Total Served: ${stats.total_served}`, 14, 56);
    doc.text(`Total Skipped: ${stats.total_skipped}`, 14, 62);

    // Create table
    const tableColumn = ["Queue #", "Name", "Student ID", "Purpose", "Status", "Served At", "Wait Time"];
    const tableRows = records.map(record => [
      record.queue_number,
      record.customer_name,
      record.student_id || '-',
      record.purpose || '-',
      record.status,
      formatDateTime(record.served_at),
      record.created_at && record.served_at
        ? `${Math.round((new Date(record.served_at) - new Date(record.created_at)) / (1000 * 60))} min`
        : '-'
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [39, 174, 96] }
    });
    
    doc.save(`served-records-${selectedDate}.pdf`);
  };

  // Get top purpose
  const getTopPurpose = () => {
    if (!stats.by_purpose || stats.by_purpose.length === 0) {
      return { purpose: 'No data available', count: 0 };
    }
    return stats.by_purpose.reduce((max, current) => 
      current.count > max.count ? current : max
    , { purpose: 'No data available', count: 0 });
  };

  // Function to get status badge class
  const getStatusBadgeClass = (status) => {
    return `status-badge ${status === 'served' ? 'served' : 'skipped'}`;
  };

  const calculateEfficiency = () => {
    const total = stats.total_served + stats.total_skipped;
    if (total === 0) return 0;
    return Math.round((stats.total_served / total) * 100);
  };

  if (loading) {
    return (
      <div className="served-records-container">
        <div className="served-records-content">
          <div className="records-header">
            <h1>Served Customer Records</h1>
            <div className="export-options">
              <CSVLink 
                data={csvData} 
                filename={`served-records-${selectedDate}.csv`}
                className="export-btn csv"
              >
                <span className="icon"><FaFileExcel /></span>
                Export to CSV
              </CSVLink>
              <button onClick={exportToPDF} className="export-btn pdf">
                <span className="icon"><FaFilePdf /></span>
                Export to PDF
              </button>
            </div>
          </div>
          
          {/* Stats Panel */}
          <div className="stats-panel">
            <div className="stat-card">
              <div className="stat-icon"><FaCheckCircle /></div>
              <div className="stat-content">
                <h3>Total Served</h3>
                <p className="stat-value">{stats.total_served}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaForward /></div>
              <div className="stat-content">
                <h3>Total Skipped</h3>
                <p className="stat-value">{stats.total_skipped}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaChartLine /></div>
              <div className="stat-content">
                <h3>Service Efficiency</h3>
                <p className="stat-value">{calculateEfficiency()}%</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaBullseye /></div>
              <div className="stat-content">
                <h3>Top Purpose</h3>
                <div className="top-purpose">
                  <p>{getTopPurpose().purpose}</p>
                  <strong>{getTopPurpose().count}</strong>
                </div>
              </div>
            </div>
          </div>
          
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="date-filter">
                <span className="icon"><FaCalendarAlt /></span>
                Date
              </label>
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
              <label htmlFor="status-filter">
                <span className="icon"><FaSearch /></span>
                Status
              </label>
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
              <label htmlFor="purpose-filter">
                <span className="icon"><FaBullseye /></span>
                Purpose
              </label>
              <select
                id="purpose-filter"
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  setCurrentPage(1);
                }}
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
              <button type="submit">
                <span className="icon"><FaSearch /></span>
                Search
              </button>
            </form>
          </div>
          
          {/* Records Table */}
          {error ? (
            <div className="error-message">
              <span className="icon"><FaExclamationTriangle /></span>
              {error}
            </div>
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
                  {loading ? (
                    <tr>
                      <td colSpan="8">
                        <div className="table-loading">
                          <div className="loading-spinner"></div>
                          <p>Loading records...</p>
                        </div>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        <div className="no-records">
                          <span className="icon"><FaInbox /></span>
                          <p>No records found for the selected filters</p>
                          <small>Try adjusting your search criteria</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id}>
                        <td>#{record.queue_number}</td>
                        <td>{record.customer_name}</td>
                        <td>{record.student_id || '-'}</td>
                        <td>{record.purpose || '-'}</td>
                        <td>{record.email || '-'}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <div className="pagination">
            <button
              className="nav-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {generatePaginationButtons()}
            <button
              className="nav-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="served-records-container">
      <div className="served-records-content">
        <div className="records-header">
          <h1>Served Customer Records</h1>
          <div className="export-options">
            <CSVLink 
              data={csvData} 
              filename={`served-records-${selectedDate}.csv`}
              className="export-btn csv"
            >
              <span className="icon"><FaFileExcel /></span>
              Export to CSV
            </CSVLink>
            <button onClick={exportToPDF} className="export-btn pdf">
              <span className="icon"><FaFilePdf /></span>
              Export to PDF
            </button>
          </div>
        </div>
        
        {/* Stats Panel */}
        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-content">
              <h3>Total Served</h3>
              <p className="stat-value">{stats.total_served}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaForward /></div>
            <div className="stat-content">
              <h3>Total Skipped</h3>
              <p className="stat-value">{stats.total_skipped}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaChartLine /></div>
            <div className="stat-content">
              <h3>Service Efficiency</h3>
              <p className="stat-value">{calculateEfficiency()}%</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaBullseye /></div>
            <div className="stat-content">
              <h3>Top Purpose</h3>
              <div className="top-purpose">
                <p>{getTopPurpose().purpose}</p>
                <strong>{getTopPurpose().count}</strong>
              </div>
            </div>
          </div>
        </div>
        
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="date-filter">
              <span className="icon"><FaCalendarAlt /></span>
              Date
            </label>
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
            <label htmlFor="status-filter">
              <span className="icon"><FaSearch /></span>
              Status
            </label>
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
            <label htmlFor="purpose-filter">
              <span className="icon"><FaBullseye /></span>
              Purpose
            </label>
            <select
              id="purpose-filter"
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                setCurrentPage(1);
              }}
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
            <button type="submit">
              <span className="icon"><FaSearch /></span>
              Search
            </button>
          </form>
        </div>
        
        {/* Records Table */}
        {error ? (
          <div className="error-message">
            <span className="icon"><FaExclamationTriangle /></span>
            {error}
          </div>
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
                {loading ? (
                  <tr>
                    <td colSpan="8">
                      <div className="table-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading records...</p>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="no-records">
                        <span className="icon"><FaInbox /></span>
                        <p>No records found for the selected filters</p>
                        <small>Try adjusting your search criteria</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id}>
                      <td>#{record.queue_number}</td>
                      <td>{record.customer_name}</td>
                      <td>{record.student_id || '-'}</td>
                      <td>{record.purpose || '-'}</td>
                      <td>{record.email || '-'}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        <div className="pagination">
          <button
            className="nav-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {generatePaginationButtons()}
          <button
            className="nav-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServedRecords;
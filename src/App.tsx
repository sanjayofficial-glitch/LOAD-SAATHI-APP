import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MonitoringDashboard from './pages/admin/MonitoringDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/admin/monitoring" element={<MonitoringDashboard />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
};

export default App;
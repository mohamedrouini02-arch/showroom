import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Rentals from './pages/Rentals';
import Customers from './pages/Customers';
import HR from './pages/HR';
import Appointments from './pages/Appointments';

function App() {
  return (
    <div className="dark">
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/hr" element={<HR />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

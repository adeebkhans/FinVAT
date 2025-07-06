import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/authPage';
import UserDetailsForm from './pages/userDetailsForm';
import UserDashboard from './pages/userDashboard';
import CibilScore from './pages/cibilScore';
import Navbar from './components/navbar';
import './App.css';

function AppContent() {
  const location = useLocation();
  // Show Navbar only on dashboard and cibil-score
  const showNavbar = ['/dashboard', '/cibil-score'].includes(location.pathname);

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        
        {/* User Details Route */}
        <Route path="/user-details" element={<UserDetailsForm />} />
        
        {/* Dashboard Route */}
        <Route path="/dashboard" element={<UserDashboard />} />
        {/* CIBIL Score Route */}
        <Route path="/cibil-score" element={<CibilScore />} />
        <Route path="/admin-dashboard" element={<div>Admin Dashboard (Coming Soon)</div>} />
        
        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

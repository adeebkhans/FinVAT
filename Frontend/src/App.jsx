import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/authPage';
import UserDetailsForm from './pages/userDetailsForm';
import UserDashboard from './pages/userDashboard';
import CibilScore from './pages/cibilScore';
import AdminDashboard from './pages/adminDashboard';
import OnfidoPage from './pages/onfidoPage'; 
import Navbar from './components/navbar';
import './App.css';

function AppContent() {
  const location = useLocation();
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
        
        {/* Onfido Verification Route */}
        <Route path="/onfido" element={<OnfidoPage />} />
        
        {/* Admin Dashboard Route */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
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

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/authPage';
import UserDetailsForm from './pages/userDetailsForm';
import UserDashboard from './pages/userDashboard';
import Navbar from './components/navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          
          {/* User Details Route */}
          <Route path="/user-details" element={<UserDetailsForm />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin-dashboard" element={<div>Admin Dashboard (Coming Soon)</div>} />
          
          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

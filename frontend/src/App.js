import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Confirm from './components/Confirm';
import ConfirmPassword from './components/ConfirmPassword';
import AccessDenied from './components/AccessDenied';
import Welcome from './components/Welcome';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/confirm-password" element={<ConfirmPassword />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

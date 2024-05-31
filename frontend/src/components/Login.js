// src/components/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login form submitted:', { username, password });
    try {
      const response = await axios.post('http://localhost:3001/auth/login', { // Verifique a URL
        username,
        password,
      });
      console.log('Response:', response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/welcome');
      } else {
        setMessage('Login não realizado');
      }
    } catch (error) {
      console.error('Error during login:', error.response ? error.response.data : error.message);
      setMessage('Login não realizado');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="main-container">
      <div className="login-container">
        <div className="login-header">
          <h2>Login</h2>
          <p>Se você já é um membro, faça login facilmente</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Nome de Usuário:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Senha:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="eye-icon" onClick={togglePasswordVisibility}>
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </span>
          </div>
          <button type="submit">Login</button>
        </form>
        {message && <p>{message}</p>}
        <p>
          Esqueceu a senha? <a href="/forgot-password">Recuperar Senha</a>
        </p>
        <p>
          Não tem uma conta? <a href="/register">Registre-se</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

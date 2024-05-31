import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/auth/forgot-password', { username });
      setMessage('Código de redefinição de senha enviado com sucesso. Verifique seu email.');
      navigate('/reset-password', { state: { username } }); // Redirecionar para a tela de redefinição de senha
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error.response ? error.response.data : error.message);
      setMessage('Erro ao solicitar redefinição de senha.');
    }
  };

  return (
    <div className="main-container">
      <form onSubmit={handleSubmit}>
        <label>Nome de Usuário:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit">Enviar Código de Redefinição</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ForgotPassword;

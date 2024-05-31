import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Confirm = () => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/auth/confirm', {
        username,
        code,
      });
      setMessage('Conta confirmada com sucesso. Agora você pode fazer login.');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao confirmar conta:', error.response ? error.response.data : error.message);
      setMessage('Erro ao confirmar conta.');
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
        <label>Código de Confirmação:</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit">Confirmar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Confirm;

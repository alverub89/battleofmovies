import React, { useState } from 'react';
import axios from 'axios';

const ResetPassword = () => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://54.207.54.15:3001/auth/confirm-password', {
        username,
        code,
        newPassword,
      });
      setMessage('Senha redefinida com sucesso. Agora você pode fazer login com sua nova senha.');
    } catch (error) {
      console.error('Erro ao redefinir a senha:', error.response ? error.response.data : error.message);
      setMessage('Erro ao redefinir a senha.');
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
        <label>Código de Redefinição:</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <label>Nova Senha:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Redefinir Senha</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ResetPassword;

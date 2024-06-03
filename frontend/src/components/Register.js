import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [nickname, setNickname] = useState('');
  const [locale, setLocale] = useState('');
  const [givenName, setGivenName] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://54.207.54.15/:3001/auth/register', {
        username,
        password,
        email,
        birthdate,
        nickname,
        locale,
        givenName,
      });
      setMessage('Cadastro realizado com sucesso.');
      navigate('/welcome', { state: { token: response.data.token } });
    } catch (error) {
      console.error('Error during registration:', error.response ? error.response.data : error.message);
      setMessage('Erro ao realizar o cadastro.');
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
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Senha:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label>Data de Nascimento:</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />
        <label>Apelido:</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <label>Localidade:</label>
        <input
          type="text"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          required
        />
        <label>Nome:</label>
        <input
          type="text"
          value={givenName}
          onChange={(e) => setGivenName(e.target.value)}
          required
        />
        <button type="submit">Registrar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;

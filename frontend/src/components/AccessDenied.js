import React from 'react';

const AccessDenied = () => {
  return (
    <div>
      <h2>Login Não Realizado</h2>
      <p>Seu login não foi realizado. Por favor, tente novamente.</p>
      <p>
        Esqueceu a senha? <a href="/forgot-password">Recuperar Senha</a>
      </p>
      <p>
        Não tem uma conta? <a href="/register">Registre-se</a>
      </p>
    </div>
  );
};

export default AccessDenied;

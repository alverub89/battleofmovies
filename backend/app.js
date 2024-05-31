const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes'); // Importe as rotas de autenticação

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Use as rotas de autenticação
app.use('/auth', authRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

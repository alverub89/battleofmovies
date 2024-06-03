const express = require('express');
const authController = require('../controllers/authController'); // Certifique-se de que o caminho está correto
const router = express.Router();

// Rota para login
router.post('/login', authController.login);

// Rota para registro
router.post('/register', authController.register);

// Rota para iniciar a recuperação de senha
router.post('/forgot-password', authController.forgotPassword);

// Rota para confirmar a nova senha
router.post('/confirm-password', authController.confirmPassword);

module.exports = router;

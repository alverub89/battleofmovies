const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword); // Nova rota para iniciar a recuperação de senha
router.post('/confirm-password', authController.confirmPassword); // Nova rota para confirmar a nova senha

module.exports = router;

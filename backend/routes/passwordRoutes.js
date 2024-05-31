// routes/passwordRoutes.js

const express = require('express');
const passwordController = require('../controllers/passwordController');
const router = express.Router();

router.post('/forgot-password', passwordController.forgotPassword);
router.post('/confirm-password', passwordController.confirmPassword);

module.exports = router;

// routes/userRoutes.js

const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

router.post('/register', userController.register);
router.post('/confirm', userController.confirm);

module.exports = router;

const passwordService = require('../services/passwordService');

exports.forgotPassword = async (req, res) => {
  const { username } = req.body;
  try {
    const response = await passwordService.forgotPassword(username);
    res.send(response);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.confirmPassword = async (req, res) => {
  const { username, code, newPassword } = req.body;
  try {
    const response = await passwordService.confirmPassword(username, code, newPassword);
    res.send(response);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Adicione outras funções relacionadas à senha aqui

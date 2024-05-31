const authService = require('../services/authService');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await authService.login(username, password);
    res.send({ token });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.register = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const result = await authService.register(username, password, email);
    res.send(result);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.forgotPassword = async (req, res) => {
  const { username } = req.body;
  try {
    await authService.forgotPassword(username);
    res.send({ message: 'Password reset code sent successfully' });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.confirmPassword = async (req, res) => {
  const { username, code, newPassword } = req.body;
  try {
    await authService.confirmPassword(username, code, newPassword);
    res.send({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const authService = require('../services/authService');

// Controlador para login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await authService.login(username, password);
    res.status(200).send({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).send({ message: error.message });
  }
};

// Controlador para registro
exports.register = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const result = await authService.register(username, password, email);
    res.status(200).send(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).send({ message: error.message });
  }
};

// Controlador para iniciar a recuperação de senha
exports.forgotPassword = async (req, res) => {
  const { username } = req.body;
  try {
    await authService.forgotPassword(username);
    res.status(200).send({ message: 'Password reset code sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).send({ message: error.message });
  }
};

// Controlador para confirmar a nova senha
exports.confirmPassword = async (req, res) => {
  const { username, code, newPassword } = req.body;
  try {
    await authService.confirmPassword(username, code, newPassword);
    res.status(200).send({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Confirm password error:', error);
    res.status(400).send({ message: error.message });
  }
};

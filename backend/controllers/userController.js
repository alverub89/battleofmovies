// controllers/userController.js

const userService = require('../services/userService');

exports.register = async (req, res) => {
  const { username, password, email, birthdate, nickname, locale, givenName } = req.body;
  console.log('Register request received:', { username, password, email, birthdate, nickname, locale, givenName });
  try {
    const response = await userService.register(username, password, email, birthdate, nickname, locale, givenName);
    res.send(response);
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(400).send(error.message);
  }
};

exports.confirm = async (req, res) => {
  const { username, code } = req.body;
  console.log('Confirm request received:', { username, code });
  try {
    const response = await userService.confirmRegistration(username, code);
    res.send(response);
  } catch (error) {
    console.error('Error during confirmation:', error.message);
    res.status(400).send(error.message);
  }
};

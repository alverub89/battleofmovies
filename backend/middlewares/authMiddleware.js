const jwt = require('jsonwebtoken');
const { aws } = require('../config/config');
const tokenUtils = require('../utils/tokenUtils');

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decoded = await tokenUtils.verifyToken(token, aws.userPoolId);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
};

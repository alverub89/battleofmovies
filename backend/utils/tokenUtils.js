const jwt = require('jsonwebtoken');
const request = require('request');

exports.verifyToken = (token, userPoolId) => {
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded.header.kid;

  const jwksUrl = `https://cognito-idp.${userPoolId}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

  return new Promise((resolve, reject) => {
    request({ url: jwksUrl, json: true }, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        return reject('Failed to download JWKs');
      }
      const key = body.keys.find((key) => key.kid === kid);
      if (!key) {
        return reject('Public key not found in JWKs');
      }
      jwt.verify(token, key, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      });
    });
  });
};

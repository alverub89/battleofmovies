const AWS = require('aws-sdk');
const { aws } = require('../config/config');

AWS.config.update({
  region: aws.region,
  accessKeyId: aws.accessKeyId,
  secretAccessKey: aws.secretAccessKey,
});

const cognito = new AWS.CognitoIdentityServiceProvider();

exports.forgotPassword = async (username) => {
  const params = {
    ClientId: aws.clientId,
    Username: username,
  };

  return new Promise((resolve, reject) => {
    cognito.forgotPassword(params, (err, data) => {
      if (err) {
        return reject(new Error(err.message || JSON.stringify(err)));
      }
      resolve(data);
    });
  });
};

exports.confirmPassword = async (username, code, newPassword) => {
  const params = {
    ClientId: aws.clientId,
    Username: username,
    ConfirmationCode: code,
    Password: newPassword,
  };

  return new Promise((resolve, reject) => {
    cognito.confirmForgotPassword(params, (err, data) => {
      if (err) {
        return reject(new Error(err.message || JSON.stringify(err)));
      }
      resolve(data);
    });
  });
};

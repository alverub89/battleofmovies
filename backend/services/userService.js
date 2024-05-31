// services/userService.js

const AWS = require('aws-sdk');
const { aws } = require('../config/config');

AWS.config.update({
  region: aws.region,
  accessKeyId: aws.accessKeyId,
  secretAccessKey: aws.secretAccessKey,
});

const cognito = new AWS.CognitoIdentityServiceProvider();

exports.register = async (username, password, email, birthdate, nickname, locale, givenName) => {
  const params = {
    ClientId: aws.clientId,
    Username: username,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email,
      },
      {
        Name: 'birthdate',
        Value: birthdate,
      },
      {
        Name: 'nickname',
        Value: nickname,
      },
      {
        Name: 'locale',
        Value: locale,
      },
      {
        Name: 'given_name',
        Value: givenName,
      },
    ],
  };

  return new Promise((resolve, reject) => {
    cognito.signUp(params, (err, data) => {
      if (err) {
        return reject(new Error(err.message || JSON.stringify(err)));
      }
      resolve(data);
    });
  });
};

exports.confirmRegistration = async (username, code) => {
  const params = {
    ClientId: aws.clientId,
    Username: username,
    ConfirmationCode: code,
  };

  return new Promise((resolve, reject) => {
    cognito.confirmSignUp(params, (err, data) => {
      if (err) {
        return reject(new Error(err.message || JSON.stringify(err)));
      }
      resolve(data);
    });
  });
};

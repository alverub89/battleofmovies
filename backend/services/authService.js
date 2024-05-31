const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const AWS = require('aws-sdk');

// Função para obter segredos do Secrets Manager
async function getSecret() {
  const client = new SecretsManagerClient({ region: 'sa-east-1' });
  const command = new GetSecretValueCommand({ SecretId: 'arn:aws:secretsmanager:sa-east-1:922810227889:secret:battleofmovies_cognito-Iu4Cmv' });

  try {
    const data = await client.send(command);
    console.log('Secret fetched successfully:', data);
    return JSON.parse(data.SecretString);
  } catch (error) {
    console.error('Erro ao buscar segredo:', error);
    throw new Error('Erro ao buscar segredo do Secrets Manager');
  }
}

// Função para configurar o AWS SDK com os segredos
async function configureAWS() {
  const secrets = await getSecret();
  console.log('Secrets:', secrets);

  if (!secrets.region || !secrets.accessKeyId || !secrets.secretAccessKey || !secrets.clientId) {
    throw new Error('Missing required AWS configuration in secrets');
  }

  AWS.config.update({
    region: secrets.region,
    accessKeyId: secrets.accessKeyId,
    secretAccessKey: secrets.secretAccessKey,
  });

  console.log('AWS SDK configured with region:', AWS.config.region);

  return secrets;
}

exports.login = async (username, password) => {
  const secrets = await configureAWS();
  console.log('ClientId:', secrets.clientId);

  const cognito = new AWS.CognitoIdentityServiceProvider({ region: secrets.region });

  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: secrets.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  console.log('InitiateAuth params:', params);

  return new Promise((resolve, reject) => {
    cognito.initiateAuth(params, (err, data) => {
      if (err) {
        console.error('Error during Cognito authentication:', err);
        return reject(new Error(err.message || JSON.stringify(err)));
      }
      console.log('Authentication successful:', data);
      if (data.AuthenticationResult && data.AuthenticationResult.IdToken) {
        return resolve(data.AuthenticationResult.IdToken);
      }
      reject(new Error('Authentication failed'));
    });
  });
};

exports.register = async (username, password, email) => {
  const secrets = await configureAWS();
  console.log('ClientId:', secrets.clientId);

  const cognito = new AWS.CognitoIdentityServiceProvider({ region: secrets.region });

  const params = {
    UserPoolId: secrets.userPoolId,
    Username: username,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' }
    ],
    TemporaryPassword: password,
    MessageAction: 'SUPPRESS'
  };

  console.log('SignUp params:', params);

  return new Promise((resolve, reject) => {
    cognito.adminCreateUser(params, async (err, data) => {
      if (err) {
        console.error('Error during Cognito registration:', err);
        return reject(new Error(err.message || JSON.stringify(err)));
      }
      console.log('Registration successful:', data);

      const setPasswordParams = {
        UserPoolId: secrets.userPoolId,
        Username: username,
        Password: password,
        Permanent: true
      };

      cognito.adminSetUserPassword(setPasswordParams, async (err, data) => {
        if (err) {
          console.error('Error during setting user password:', err);
          return reject(new Error(err.message || JSON.stringify(err)));
        }
        console.log('Password set successfully:', data);

        // Login the user automatically after successful registration
        try {
          const token = await exports.login(username, password);
          resolve({ message: 'User registered and logged in successfully', token });
        } catch (error) {
          reject(new Error('Registration successful, but login failed: ' + error.message));
        }
      });
    });
  });
};

exports.forgotPassword = async (username) => {
  const secrets = await configureAWS();
  console.log('ClientId:', secrets.clientId);

  const cognito = new AWS.CognitoIdentityServiceProvider({ region: secrets.region });

  const params = {
    ClientId: secrets.clientId,
    Username: username,
  };

  console.log('ForgotPassword params:', params);

  return new Promise((resolve, reject) => {
    cognito.forgotPassword(params, (err, data) => {
      if (err) {
        console.error('Error during forgotPassword:', err);
        return reject(new Error(err.message || JSON.stringify(err)));
      }
      console.log('ForgotPassword successful:', data);
      resolve(data);
    });
  });
};

exports.confirmPassword = async (username, code, newPassword) => {
  const secrets = await configureAWS();
  console.log('ClientId:', secrets.clientId);

  const cognito = new AWS.CognitoIdentityServiceProvider({ region: secrets.region });

  const params = {
    ClientId: secrets.clientId,
    Username: username,
    ConfirmationCode: code,
    Password: newPassword,
  };

  console.log('ConfirmPassword params:', params);

  return new Promise((resolve, reject) => {
    cognito.confirmForgotPassword(params, (err, data) => {
      if (err) {
        console.error('Error during confirmForgotPassword:', err);
        return reject(new Error(err.message || JSON.stringify(err)));
      }
      console.log('ConfirmPassword successful:', data);
      resolve(data);
    });
  });
};

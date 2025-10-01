const http = require('http');

const CONFIG = {
  baseURL: 'http://localhost:3000',
  adminEmail: 'joao@example.com',
  adminPassword: 'password123',
};

// Função para fazer login como admin
async function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: CONFIG.adminEmail,
      password: CONFIG.adminPassword,
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 201) {
          const responseBody = JSON.parse(data);
          console.log('✅ Login realizado com sucesso!');
          resolve(responseBody.accessToken);
        } else {
          const errorBody = JSON.parse(data);
          console.error('❌ Erro no login:', errorBody);
          reject(new Error('Login failed'));
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro na requisição de login:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Função para testar criação de um usuário simples
async function testCreateUser(accessToken) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      name: 'Teste User',
      email: 'teste@example.com',
      password: 'password123',
      phone: '+5511999999999',
      role: 'teacher',
      completed: true,
      commonUser: false,
      active: true,
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${accessToken}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', data);
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro na requisição:', e.message);
      resolve({ error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

// Função principal
async function main() {
  console.log('🧪 Testando criação de usuário...');

  try {
    const accessToken = await login();
    const result = await testCreateUser(accessToken);
    
    if (result.statusCode === 201) {
      console.log('✅ Usuário criado com sucesso!');
    } else {
      console.log('❌ Falha na criação do usuário');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();

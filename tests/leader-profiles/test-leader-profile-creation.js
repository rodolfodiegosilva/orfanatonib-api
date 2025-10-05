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

// Função para testar criação de leader profile
async function testCreateLeaderProfile(userId, accessToken) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/leader-profiles/create-for-user/${userId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    req.end();
  });
}

// Função principal
async function main() {
  console.log('🧪 Testando criação de leader profile...');

  try {
    const accessToken = await login();
    
    // Usar o primeiro usuário leader
    const testUserId = 'd80040f8-3b13-4f76-97ba-f8826835665a'; // Zeca Ferreira
    console.log(`\n🔍 Testando com usuário ID: ${testUserId}`);
    
    const result = await testCreateLeaderProfile(testUserId, accessToken);
    
    if (result.statusCode === 201) {
      console.log('✅ Leader profile criado com sucesso!');
    } else {
      console.log('❌ Falha na criação do leader profile');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();

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

// Função para buscar usuários com diferentes parâmetros
async function getUsers(accessToken, params = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/users${params}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const responseBody = JSON.parse(data);
          resolve(responseBody);
        } else {
          const errorBody = JSON.parse(data);
          console.error('❌ Erro ao buscar usuários:', errorBody);
          reject(new Error('Failed to fetch users'));
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro na requisição de usuários:', e.message);
      reject(e);
    });

    req.end();
  });
}

// Função principal
async function main() {
  console.log('🔍 Investigando endpoint de usuários...');

  try {
    const accessToken = await login();

    // Testar diferentes parâmetros
    const tests = [
      { params: '', description: 'Sem parâmetros' },
      { params: '?limit=10', description: 'Com limite 10' },
      { params: '?limit=100', description: 'Com limite 100' },
      { params: '?page=1&limit=10', description: 'Com paginação' },
      { params: '?role=leader', description: 'Filtrar por role leader' },
      { params: '?role=teacher', description: 'Filtrar por role teacher' },
    ];

    for (const test of tests) {
      console.log(`\n🔍 Testando: ${test.description}`);
      try {
        const result = await getUsers(accessToken, test.params);
        console.log(`   📊 Status: 200`);
        console.log(`   📋 Estrutura da resposta:`, Object.keys(result));
        
        if (result.data) {
          console.log(`   📋 Usuários encontrados: ${result.data.length}`);
          if (result.data.length > 0) {
            console.log(`   👤 Primeiro usuário: ${result.data[0].name} (${result.data[0].role})`);
          }
        } else if (result.items) {
          console.log(`   📋 Items encontrados: ${result.items.length}`);
        } else if (Array.isArray(result)) {
          console.log(`   📋 Array direto: ${result.length}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();

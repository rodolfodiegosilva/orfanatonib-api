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

// Função para buscar todos os usuários
async function getAllUsers(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/users?limit=100',
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
          resolve(responseBody.data || []);
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
  console.log('🔍 Verificando usuários existentes...');

  try {
    const accessToken = await login();
    const users = await getAllUsers(accessToken);

    console.log(`\n📊 Total de usuários encontrados: ${users.length}`);
    
    // Agrupar por role
    const usersByRole = users.reduce((acc, user) => {
      const role = user.role || 'sem-role';
      if (!acc[role]) acc[role] = [];
      acc[role].push(user);
      return acc;
    }, {});

    console.log('\n📋 Usuários por role:');
    Object.keys(usersByRole).forEach(role => {
      console.log(`   ${role}: ${usersByRole[role].length} usuários`);
      usersByRole[role].forEach(user => {
        console.log(`     - ${user.name} (${user.email})`);
      });
    });

    // Verificar se há usuários com role 'leader'
    const leaderUsers = usersByRole['leader'] || [];
    if (leaderUsers.length === 0) {
      console.log('\n⚠️ Nenhum usuário com role "leader" encontrado.');
      console.log('💡 Sugestões:');
      console.log('   1. Execute a automação de criação de usuários primeiro');
      console.log('   2. Ou atualize alguns usuários para role "leader"');
    } else {
      console.log(`\n✅ Encontrados ${leaderUsers.length} usuários com role "leader"`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();

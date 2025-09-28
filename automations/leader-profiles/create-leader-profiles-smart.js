const http = require('http');
const fs = require('fs');
const path = require('path');

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
          resolve(responseBody.items || []);
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

// Função para buscar leader profiles existentes
async function getExistingLeaderProfiles(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/leader-profiles?limit=100',
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
          resolve(responseBody.items || []);
        } else {
          const errorBody = JSON.parse(data);
          console.error('❌ Erro ao buscar leader profiles:', errorBody);
          reject(new Error('Failed to fetch leader profiles'));
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro na requisição de leader profiles:', e.message);
      reject(e);
    });

    req.end();
  });
}

// Função para criar leader profile para um usuário
async function createLeaderProfile(userId, userName, accessToken) {
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
        if (res.statusCode === 201) {
          const responseBody = JSON.parse(data);
          console.log(`✅ Leader profile criado: ${userName} (${userId})`);
          resolve({ 
            ...responseBody, 
            userId,
            userName,
            success: true
          });
        } else {
          const errorBody = JSON.parse(data);
          console.error(`❌ Erro ao criar leader profile para ${userName}:`, errorBody);
          resolve({ 
            error: errorBody, 
            userId,
            userName,
            success: false
          });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Erro na requisição para criar leader profile ${userName}:`, e.message);
      resolve({ 
        error: e.message, 
        userId,
        userName,
        success: false
      });
    });

    req.end();
  });
}

// Função principal
async function main() {
  console.log('🚀 Iniciando automação de criação de leader profiles...');
  console.log('\n📊 Configuração:');
  console.log(`   - Admin: ${CONFIG.adminEmail}`);
  console.log(`   - Base URL: ${CONFIG.baseURL}`);

  try {
    // Fazer login como admin
    console.log('\n🔐 Fazendo login como admin...');
    const accessToken = await login();

    // Buscar todos os usuários
    console.log('\n👥 Buscando usuários existentes...');
    const allUsers = await getAllUsers(accessToken);
    
    console.log(`📊 Total de usuários encontrados: ${allUsers.length}`);

    // Filtrar usuários com role 'leader'
    const leaderUsers = allUsers.filter(user => user.role === 'leader');
    console.log(`👨‍💼 Usuários com role "leader": ${leaderUsers.length}`);

    if (leaderUsers.length === 0) {
      console.log('⚠️ Nenhum usuário com role "leader" encontrado.');
      console.log('💡 Execute primeiro a automação de criação de usuários.');
      return;
    }

    // Listar usuários leaders
    console.log('\n📋 Usuários leaders encontrados:');
    leaderUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    // Buscar leader profiles existentes
    console.log('\n🔍 Verificando leader profiles existentes...');
    const existingProfiles = await getExistingLeaderProfiles(accessToken);
    const existingUserIds = existingProfiles.map(profile => profile.user?.id).filter(Boolean);
    
    console.log(`📋 Leader profiles existentes: ${existingProfiles.length}`);

    // Filtrar usuários que ainda não têm leader profile
    const usersWithoutProfile = leaderUsers.filter(user => !existingUserIds.includes(user.id));
    
    console.log(`\n📝 Usuários sem leader profile: ${usersWithoutProfile.length}`);

    if (usersWithoutProfile.length === 0) {
      console.log('✅ Todos os usuários leaders já possuem leader profile!');
      return;
    }

    // Criar leader profiles
    console.log('\n🏗️ Criando leader profiles...');
    const createdProfiles = [];
    
    for (let i = 0; i < usersWithoutProfile.length; i++) {
      const user = usersWithoutProfile[i];
      console.log(`\n📝 Criando leader profile ${i + 1}/${usersWithoutProfile.length}...`);
      console.log(`   👤 Usuário: ${user.name} (${user.email})`);
      
      const result = await createLeaderProfile(user.id, user.name, accessToken);
      createdProfiles.push(result);
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Consolidar resultados
    const successCount = createdProfiles.filter(p => p.success).length;
    const failureCount = createdProfiles.filter(p => !p.success).length;

    // Salvar resultados em arquivo
    const outputFileName = `created-leader-profiles-${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(path.join(__dirname, outputFileName), JSON.stringify(createdProfiles, null, 2));

    // Relatório final
    console.log('\n📊 RESUMO DA AUTOMAÇÃO:');
    console.log('==================================================');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Falhas: ${failureCount}`);
    console.log(`📊 Total processados: ${createdProfiles.length}`);
    console.log(`📈 Taxa de sucesso: ${((successCount / createdProfiles.length) * 100).toFixed(1)}%`);

    console.log('\n👨‍💼 LEADER PROFILES CRIADOS:');
    console.log('==================================================');
    const successfulProfiles = createdProfiles.filter(p => p.success);
    if (successfulProfiles.length > 0) {
      console.log('📋 Lista de leader profiles criados:');
      successfulProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.userName} - ID: ${profile.id}`);
      });
    }

    if (failureCount > 0) {
      console.log('\n❌ FALHAS:');
      console.log('==================================================');
      const failedProfiles = createdProfiles.filter(p => !p.success);
      failedProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.userName} - ${profile.error?.message || 'Erro desconhecido'}`);
      });
    }

    console.log(`\n📁 Arquivo salvo: ${outputFileName}`);
    console.log('\n🎉 Automação concluída!');

  } catch (error) {
    console.error('❌ Erro fatal na automação:', error.message);
  }
}

main();

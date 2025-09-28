const https = require('https');
const http = require('http');

const baseUrl = 'http://localhost:3000';
const adminCredentials = {
  email: 'joao@example.com',
  password: 'password123'
};

async function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(adminCredentials);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            resolve(response.accessToken);
          } else {
            reject(new Error(`Login failed: ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function listUsers(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/users?page=1&limit=100',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`Failed to list users: ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function listTeacherProfiles(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/teacher-profiles?page=1&limit=100',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`Failed to list teacher profiles: ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function createTeacherProfile(token, userId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/teacher-profiles/create-for-user/${userId}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Iniciando automação de criação de teacher profiles...\n');
    
    console.log('📊 Configuração:');
    console.log('   - Admin:', adminCredentials.email);
    console.log('   - Base URL:', baseUrl);
    console.log('');

    console.log('🔐 Fazendo login como admin...');
    const token = await login();
    console.log('✅ Login realizado com sucesso!');
    console.log('');

    console.log('👥 Buscando usuários existentes...');
    const usersResponse = await listUsers(token);
    console.log(`📊 Total de usuários encontrados: ${usersResponse.total || 0}`);
    
    if (!usersResponse.items || !Array.isArray(usersResponse.items)) {
      console.log('❌ Erro: Resposta da API não contém dados válidos');
      console.log('📄 Resposta:', JSON.stringify(usersResponse, null, 2));
      return;
    }
    
    const teacherUsers = usersResponse.items.filter(user => user.role === 'teacher');
    console.log(`👨‍🏫 Usuários com role "teacher": ${teacherUsers.length}`);
    console.log('');

    if (teacherUsers.length === 0) {
      console.log('⚠️ Nenhum usuário com role "teacher" encontrado!');
      return;
    }

    console.log('📋 Usuários teachers encontrados:');
    teacherUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    console.log('');

    console.log('🔍 Verificando teacher profiles existentes...');
    const teacherProfilesResponse = await listTeacherProfiles(token);
    console.log(`📋 Teacher profiles existentes: ${teacherProfilesResponse.total || 0}`);
    
    if (!teacherProfilesResponse.items || !Array.isArray(teacherProfilesResponse.items)) {
      console.log('⚠️ Erro ao obter teacher profiles existentes');
      console.log('📄 Resposta:', JSON.stringify(teacherProfilesResponse, null, 2));
      return;
    }
    
    const existingTeacherProfileUserIds = teacherProfilesResponse.items.map(tp => tp.user.id);
    const usersWithoutTeacherProfile = teacherUsers.filter(user => 
      !existingTeacherProfileUserIds.includes(user.id)
    );
    
    console.log(`📝 Usuários sem teacher profile: ${usersWithoutTeacherProfile.length}`);
    console.log('');

    if (usersWithoutTeacherProfile.length === 0) {
      console.log('✅ Todos os usuários teachers já possuem teacher profiles!');
      return;
    }

    console.log('🏗️ Criando teacher profiles...');
    console.log('');

    const results = {
      success: 0,
      failed: 0,
      createdProfiles: []
    };

    for (let i = 0; i < usersWithoutTeacherProfile.length; i++) {
      const user = usersWithoutTeacherProfile[i];
      
      console.log(`📝 Criando teacher profile ${i + 1}/${usersWithoutTeacherProfile.length}...`);
      console.log(`   👤 Usuário: ${user.name} (${user.email})`);
      
      try {
        const result = await createTeacherProfile(token, user.id);
        
        if (result.statusCode === 201) {
          console.log(`✅ Teacher profile criado: ${user.name} (${result.data.id})`);
          results.success++;
          results.createdProfiles.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            teacherProfileId: result.data.id
          });
        } else {
          console.log(`❌ Erro ao criar teacher profile para ${user.name}:`, result.data);
          results.failed++;
        }
      } catch (error) {
        console.log(`❌ Erro ao criar teacher profile para ${user.name}:`, error.message);
        results.failed++;
      }
      
      console.log('');
    }

    console.log('📊 RESUMO DA AUTOMAÇÃO:');
    console.log('==================================================');
    console.log(`✅ Sucessos: ${results.success}`);
    console.log(`❌ Falhas: ${results.failed}`);
    console.log(`📊 Total processados: ${results.success + results.failed}`);
    console.log(`📈 Taxa de sucesso: ${((results.success / (results.success + results.failed)) * 100).toFixed(1)}%`);
    console.log('');

    if (results.createdProfiles.length > 0) {
      console.log('👨‍🏫 TEACHER PROFILES CRIADOS:');
      console.log('==================================================');
      console.log('📋 Lista de teacher profiles criados:');
      results.createdProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.userName} - ID: ${profile.teacherProfileId}`);
      });
      console.log('');

      // Salvar resultados em arquivo
      const fs = require('fs');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `created-teacher-profiles-${timestamp}.json`;
      
      fs.writeFileSync(filename, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          totalProcessed: results.success + results.failed,
          success: results.success,
          failed: results.failed,
          successRate: ((results.success / (results.success + results.failed)) * 100).toFixed(1) + '%'
        },
        createdProfiles: results.createdProfiles
      }, null, 2));
      
      console.log(`📁 Arquivo salvo: ${filename}`);
    }

    console.log('');
    console.log('🎉 Automação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();

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

async function listShelters(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/shelters?page=1&limit=20',
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
            reject(new Error(`Failed to list shelters: ${res.statusCode}`));
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

async function listLeaderProfiles(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/leader-profiles?page=1&limit=20',
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
            reject(new Error(`Failed to list leader profiles: ${res.statusCode}`));
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

async function linkShelterToLeader(token, leaderId, shelterId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ shelterId });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/leader-profiles/${leaderId}/assign-shelter`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
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
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function unlinkShelterFromLeader(token, leaderId, shelterId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ shelterId });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/leader-profiles/${leaderId}/unassign-shelter`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
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
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Iniciando teste de vinculação de shelters...\n');
    
    console.log('🔐 Fazendo login como admin...');
    const token = await login();
    console.log('✅ Login realizado com sucesso!\n');
    
    console.log('🏠 Listando shelters...');
    const sheltersResponse = await listShelters(token);
    console.log(`📊 Total de shelters: ${sheltersResponse.total}`);
    
    if (sheltersResponse.data && sheltersResponse.data.length > 0) {
      console.log('\n📋 Shelters disponíveis:');
      sheltersResponse.data.forEach((shelter, index) => {
        console.log(`   ${index + 1}. ${shelter.name} - ID: ${shelter.id}`);
      });
    } else {
      console.log('⚠️ Nenhum shelter encontrado!');
      return;
    }
    
    console.log('\n👨‍💼 Listando leader profiles...');
    const leadersResponse = await listLeaderProfiles(token);
    console.log(`📊 Total de leader profiles: ${leadersResponse.total}`);
    
    if (leadersResponse.data && leadersResponse.data.length > 0) {
      console.log('\n📋 Leader profiles disponíveis:');
      leadersResponse.data.forEach((leader, index) => {
        console.log(`   ${index + 1}. ${leader.user.name} - ID: ${leader.id}`);
      });
    } else {
      console.log('⚠️ Nenhum leader profile encontrado!');
      return;
    }
    
    // Teste de vinculação
    if (sheltersResponse.data.length > 0 && leadersResponse.data.length > 0) {
      const firstShelter = sheltersResponse.data[0];
      const firstLeader = leadersResponse.data[0];
      
      console.log('\n🔗 TESTE DE VINCULAÇÃO:');
      console.log(`   Shelter: ${firstShelter.name} (${firstShelter.id})`);
      console.log(`   Leader: ${firstLeader.user.name} (${firstLeader.id})`);
      
      console.log('\n📝 Vinculando shelter ao leader...');
      const linkResult = await linkShelterToLeader(token, firstLeader.id, firstShelter.id);
      
      if (linkResult.statusCode === 200) {
        console.log('✅ Shelter vinculado com sucesso!');
        console.log('📄 Resposta:', JSON.stringify(linkResult.data, null, 2));
        
        console.log('\n🔓 TESTE DE DESVINCULAÇÃO:');
        console.log('📝 Desvinculando shelter do leader...');
        const unlinkResult = await unlinkShelterFromLeader(token, firstLeader.id, firstShelter.id);
        
        if (unlinkResult.statusCode === 200) {
          console.log('✅ Shelter desvinculado com sucesso!');
          console.log('📄 Resposta:', JSON.stringify(unlinkResult.data, null, 2));
        } else {
          console.log(`❌ Erro ao desvincular: ${unlinkResult.statusCode}`);
          console.log('📄 Resposta:', JSON.stringify(unlinkResult.data, null, 2));
        }
      } else {
        console.log(`❌ Erro ao vincular: ${linkResult.statusCode}`);
        console.log('📄 Resposta:', JSON.stringify(linkResult.data, null, 2));
      }
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();

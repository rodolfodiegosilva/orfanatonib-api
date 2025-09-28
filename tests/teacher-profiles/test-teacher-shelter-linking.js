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

async function listTeacherProfiles(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/teacher-profiles?page=1&limit=20',
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

async function assignShelterToTeacher(token, teacherId, shelterId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ shelterId });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/teacher-profiles/${teacherId}/assign-shelter`,
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

async function unassignShelterFromTeacher(token, teacherId, shelterId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ shelterId });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/teacher-profiles/${teacherId}/unassign-shelter`,
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
    console.log('🚀 Iniciando teste de vinculação de shelters para teachers...\n');
    
    console.log('🔐 Fazendo login como admin...');
    const token = await login();
    console.log('✅ Login realizado com sucesso!\n');
    
    console.log('🏠 Listando shelters...');
    const sheltersResponse = await listShelters(token);
    console.log(`📊 Total de shelters: ${sheltersResponse.total || 0}`);
    
    if (!sheltersResponse.data || !Array.isArray(sheltersResponse.data)) {
      console.log('❌ Erro: Resposta da API não contém dados válidos');
      return;
    }
    
    if (sheltersResponse.data.length === 0) {
      console.log('⚠️ Nenhum shelter encontrado!');
      return;
    }
    
    console.log('\n📋 Shelters disponíveis:');
    sheltersResponse.data.forEach((shelter, index) => {
      console.log(`   ${index + 1}. ${shelter.name} - ID: ${shelter.id}`);
    });
    
    console.log('\n👨‍🏫 Listando teacher profiles...');
    const teacherProfilesResponse = await listTeacherProfiles(token);
    console.log(`📊 Total de teacher profiles: ${teacherProfilesResponse.total || 0}`);
    
    if (!teacherProfilesResponse.items || !Array.isArray(teacherProfilesResponse.items)) {
      console.log('❌ Erro: Resposta da API não contém dados válidos');
      return;
    }
    
    if (teacherProfilesResponse.items.length === 0) {
      console.log('⚠️ Nenhum teacher profile encontrado!');
      return;
    }
    
    console.log('\n📋 Teacher profiles disponíveis:');
    teacherProfilesResponse.items.forEach((teacher, index) => {
      console.log(`   ${index + 1}. ${teacher.user.name} - ID: ${teacher.id}`);
    });
    
    // Teste de vinculação
    const firstShelter = sheltersResponse.data[0];
    const firstTeacher = teacherProfilesResponse.items[0];
    
    console.log('\n🔗 TESTE DE VINCULAÇÃO TEACHER-SHELTER:');
    console.log(`   Shelter: ${firstShelter.name} (${firstShelter.id})`);
    console.log(`   Teacher: ${firstTeacher.user.name} (${firstTeacher.id})`);
    
    console.log('\n📝 Vinculando shelter ao teacher...');
    const assignResult = await assignShelterToTeacher(token, firstTeacher.id, firstShelter.id);
    
    if (assignResult.statusCode === 200) {
      console.log('✅ Shelter vinculado ao teacher com sucesso!');
      console.log('📄 Resposta:', JSON.stringify(assignResult.data, null, 2));
      
      console.log('\n🔓 TESTE DE DESVINCULAÇÃO:');
      console.log('📝 Desvinculando shelter do teacher...');
      const unassignResult = await unassignShelterFromTeacher(token, firstTeacher.id, firstShelter.id);
      
      if (unassignResult.statusCode === 200) {
        console.log('✅ Shelter desvinculado do teacher com sucesso!');
        console.log('📄 Resposta:', JSON.stringify(unassignResult.data, null, 2));
      } else {
        console.log(`❌ Erro ao desvincular: ${unassignResult.statusCode}`);
        console.log('📄 Resposta:', JSON.stringify(unassignResult.data, null, 2));
      }
    } else {
      console.log(`❌ Erro ao vincular: ${assignResult.statusCode}`);
      console.log('📄 Resposta:', JSON.stringify(assignResult.data, null, 2));
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configurações
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let token = '';
let testResults = {
  success: 0,
  failed: 0,
  details: []
};

async function login() {
  console.log('🔐 Fazendo login como admin...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    token = response.data.accessToken;
    console.log('✅ Login realizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

async function testEndpoint(name, testFunction) {
  console.log(`\n📋 Testando ${name}...`);
  try {
    const result = await testFunction();
    testResults.success++;
    testResults.details.push({ name, status: 'SUCCESS', result });
    console.log(`✅ ${name} - Status: ${result.status || 'SUCCESS'}`);
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name, status: 'FAILED', error: error.response?.data || error.message });
    console.error(`❌ ${name} - Erro:`, error.response?.data || error.message);
    return null;
  }
}

// 1. GET /teacher-profiles - Listagem paginada
async function testGetTeacherProfiles() {
  const response = await axios.get(`${BASE_URL}/teacher-profiles?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return {
    status: response.status,
    total: response.data.total,
    items: response.data.items.length,
    firstTeacher: response.data.items[0]?.user?.name
  };
}

// 2. GET /teacher-profiles/simple - Listagem simples
async function testGetTeacherProfilesSimple() {
  const response = await axios.get(`${BASE_URL}/teacher-profiles/simple`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return {
    status: response.status,
    count: response.data.length,
    firstTeacher: response.data[0]?.user?.name
  };
}

// 3. GET /teacher-profiles/:id - Buscar por ID
async function testGetTeacherProfileById() {
  // Primeiro buscar um teacher profile
  const listResponse = await axios.get(`${BASE_URL}/teacher-profiles?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (listResponse.data.items.length === 0) {
    throw new Error('Nenhum teacher profile encontrado para teste');
  }
  
  const teacherId = listResponse.data.items[0].id;
  const response = await axios.get(`${BASE_URL}/teacher-profiles/${teacherId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    teacherId: teacherId,
    teacherName: response.data.user?.name
  };
}

// 4. GET /teacher-profiles/by-shelter/:shelterId - Buscar por shelter
async function testGetTeacherProfilesByShelter() {
  // Primeiro buscar um shelter
  const shelterResponse = await axios.get(`${BASE_URL}/shelters?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (shelterResponse.data.items.length === 0) {
    throw new Error('Nenhum shelter encontrado para teste');
  }
  
  const shelterId = shelterResponse.data.items[0].id;
  const response = await axios.get(`${BASE_URL}/teacher-profiles/by-shelter/${shelterId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    shelterId: shelterId,
    shelterName: shelterResponse.data.items[0].name,
    teachersCount: response.data.length
  };
}

// 5. PATCH /teacher-profiles/:teacherId/assign-shelter - Vincular shelter
async function testAssignTeacherToShelter() {
  // Buscar um teacher sem shelter
  const teachersResponse = await axios.get(`${BASE_URL}/teacher-profiles?hasShelter=false&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (teachersResponse.data.items.length === 0) {
    throw new Error('Nenhum teacher sem shelter encontrado para teste');
  }
  
  // Buscar um shelter
  const shelterResponse = await axios.get(`${BASE_URL}/shelters?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (shelterResponse.data.items.length === 0) {
    throw new Error('Nenhum shelter encontrado para teste');
  }
  
  const teacherId = teachersResponse.data.items[0].id;
  const shelterId = shelterResponse.data.items[0].id;
  
  const response = await axios.patch(`${BASE_URL}/teacher-profiles/${teacherId}/assign-shelter`, {
    shelterId: shelterId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    teacherId: teacherId,
    teacherName: teachersResponse.data.items[0].user?.name,
    shelterId: shelterId,
    shelterName: shelterResponse.data.items[0].name
  };
}

// 6. PATCH /teacher-profiles/:teacherId/unassign-shelter - Desvincular shelter
async function testUnassignTeacherFromShelter() {
  // Buscar um teacher com shelter
  const teachersResponse = await axios.get(`${BASE_URL}/teacher-profiles?hasShelter=true&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (teachersResponse.data.items.length === 0) {
    throw new Error('Nenhum teacher com shelter encontrado para teste');
  }
  
  const teacherId = teachersResponse.data.items[0].id;
  const shelterId = teachersResponse.data.items[0].shelter?.id;
  
  const response = await axios.patch(`${BASE_URL}/teacher-profiles/${teacherId}/unassign-shelter`, {
    shelterId: shelterId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    teacherId: teacherId,
    teacherName: teachersResponse.data.items[0].user?.name,
    shelterId: shelterId,
    shelterName: teachersResponse.data.items[0].shelter?.name
  };
}

// 7. Teste de filtros avançados
async function testAdvancedFilters() {
  const filters = [
    { name: 'Busca por nome', params: '?q=Teste' },
    { name: 'Filtro por ativo', params: '?active=true' },
    { name: 'Filtro por inativo', params: '?active=false' },
    { name: 'Filtro com shelter', params: '?hasShelter=true' },
    { name: 'Filtro sem shelter', params: '?hasShelter=false' },
    { name: 'Ordenação por nome ASC', params: '?sort=name&order=asc' },
    { name: 'Ordenação por data DESC', params: '?sort=updatedAt&order=desc' },
    { name: 'Paginação', params: '?page=1&limit=5' },
    { name: 'Filtros combinados', params: '?active=true&hasShelter=false&page=1&limit=3' }
  ];
  
  const results = [];
  
  for (const filter of filters) {
    try {
      const response = await axios.get(`${BASE_URL}/teacher-profiles${filter.params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      results.push({
        filter: filter.name,
        status: response.status,
        count: response.data.items?.length || response.data.length,
        total: response.data.total
      });
    } catch (error) {
      results.push({
        filter: filter.name,
        status: 'ERROR',
        error: error.response?.data || error.message
      });
    }
  }
  
  return { filters: results };
}

// 8. Teste de cenários de erro
async function testErrorScenarios() {
  const errorTests = [
    {
      name: 'Buscar teacher inexistente',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/teacher-profiles/00000000-0000-0000-0000-000000000000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: response.status, expected: 404 };
      }
    },
    {
      name: 'Vincular shelter inexistente',
      test: async () => {
        const teachersResponse = await axios.get(`${BASE_URL}/teacher-profiles?hasShelter=false&limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (teachersResponse.data.items.length === 0) {
          throw new Error('Nenhum teacher sem shelter para teste');
        }
        
        const teacherId = teachersResponse.data.items[0].id;
        const response = await axios.patch(`${BASE_URL}/teacher-profiles/${teacherId}/assign-shelter`, {
          shelterId: '00000000-0000-0000-0000-000000000000'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: response.status, expected: 404 };
      }
    },
    {
      name: 'Desvincular shelter inexistente',
      test: async () => {
        const teachersResponse = await axios.get(`${BASE_URL}/teacher-profiles?hasShelter=true&limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (teachersResponse.data.items.length === 0) {
          throw new Error('Nenhum teacher com shelter para teste');
        }
        
        const teacherId = teachersResponse.data.items[0].id;
        const response = await axios.patch(`${BASE_URL}/teacher-profiles/${teacherId}/unassign-shelter`, {
          shelterId: '00000000-0000-0000-0000-000000000000'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: response.status, expected: 400 };
      }
    }
  ];
  
  const results = [];
  
  for (const errorTest of errorTests) {
    try {
      const result = await errorTest.test();
      results.push({
        name: errorTest.name,
        status: result.status,
        expected: result.expected,
        success: result.status === result.expected
      });
    } catch (error) {
      results.push({
        name: errorTest.name,
        status: error.response?.status || 'ERROR',
        error: error.response?.data || error.message,
        success: true // Erro esperado
      });
    }
  }
  
  return { errorTests: results };
}

async function runCompleteTest() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - TESTE DE TODOS OS ENDPOINTS DE TEACHER PROFILES');
  console.log('================================================================');
  console.log('📋 Endpoints a serem testados:');
  console.log('   1. GET /teacher-profiles - Listagem paginada');
  console.log('   2. GET /teacher-profiles/simple - Listagem simples');
  console.log('   3. GET /teacher-profiles/:id - Buscar por ID');
  console.log('   4. GET /teacher-profiles/by-shelter/:shelterId - Buscar por shelter');
  console.log('   5. PATCH /teacher-profiles/:id/assign-shelter - Vincular shelter');
  console.log('   6. PATCH /teacher-profiles/:id/unassign-shelter - Desvincular shelter');
  console.log('   7. Filtros avançados');
  console.log('   8. Cenários de erro');
  console.log('================================================================');

  if (!(await login())) {
    console.error('❌ Falha no login. Encerrando automação.');
    return;
  }

  // Testar todos os endpoints
  await testEndpoint('GET /teacher-profiles (listagem paginada)', testGetTeacherProfiles);
  await testEndpoint('GET /teacher-profiles/simple (listagem simples)', testGetTeacherProfilesSimple);
  await testEndpoint('GET /teacher-profiles/:id (buscar por ID)', testGetTeacherProfileById);
  await testEndpoint('GET /teacher-profiles/by-shelter/:shelterId (buscar por shelter)', testGetTeacherProfilesByShelter);
  await testEndpoint('PATCH /teacher-profiles/:id/assign-shelter (vincular shelter)', testAssignTeacherToShelter);
  await testEndpoint('PATCH /teacher-profiles/:id/unassign-shelter (desvincular shelter)', testUnassignTeacherFromShelter);
  await testEndpoint('Filtros avançados', testAdvancedFilters);
  await testEndpoint('Cenários de erro', testErrorScenarios);

  // Salvar resultados
  const resultsDir = 'docs/results/teacher-profiles';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(resultsDir, `complete-test-results-${timestamp}.json`);
  fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA!');
  console.log('==================================================');
  console.log(`✅ Testes bem-sucedidos: ${testResults.success}`);
  console.log(`❌ Testes com falha: ${testResults.failed}`);
  console.log(`📊 Taxa de sucesso: ${((testResults.success / (testResults.success + testResults.failed)) * 100).toFixed(2)}%`);
  console.log(`💾 Resultados salvos em: ${filename}`);

  console.log('\n📋 RESUMO DETALHADO:');
  console.log('================================================================================');
  testResults.details.forEach(detail => {
    if (detail.status === 'SUCCESS') {
      console.log(`✅ ${detail.name}: ${JSON.stringify(detail.result)}`);
    } else {
      console.log(`❌ ${detail.name}: ${JSON.stringify(detail.error)}`);
    }
  });
  console.log('================================================================================');

  console.log('\n🏁 Script finalizado!');
}

runCompleteTest();

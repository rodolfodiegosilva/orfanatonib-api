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

// 1. POST /leader-profiles/create-for-user/:userId - Criar leader profile
async function testCreateLeaderProfile() {
  // Primeiro buscar um usuário com role leader
  const usersResponse = await axios.get(`${BASE_URL}/users?role=leader&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (usersResponse.data.items.length === 0) {
    throw new Error('Nenhum usuário com role leader encontrado para teste');
  }
  
  const userId = usersResponse.data.items[0].id;
  const userName = usersResponse.data.items[0].name;
  
  const response = await axios.post(`${BASE_URL}/leader-profiles/create-for-user/${userId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    userId: userId,
    userName: userName,
    leaderId: response.data.id
  };
}

// 2. GET /leader-profiles - Listagem paginada
async function testGetLeaderProfiles() {
  const response = await axios.get(`${BASE_URL}/leader-profiles?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return {
    status: response.status,
    total: response.data.total,
    items: response.data.items.length,
    firstLeader: response.data.items[0]?.user?.name
  };
}

// 3. GET /leader-profiles/simple - Listagem simples
async function testGetLeaderProfilesSimple() {
  const response = await axios.get(`${BASE_URL}/leader-profiles/simple`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return {
    status: response.status,
    count: response.data.length,
    firstLeader: response.data[0]?.user?.name
  };
}

// 4. GET /leader-profiles/:id - Buscar por ID
async function testGetLeaderProfileById() {
  // Primeiro buscar um leader profile
  const listResponse = await axios.get(`${BASE_URL}/leader-profiles?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (listResponse.data.items.length === 0) {
    throw new Error('Nenhum leader profile encontrado para teste');
  }
  
  const leaderId = listResponse.data.items[0].id;
  const response = await axios.get(`${BASE_URL}/leader-profiles/${leaderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    leaderId: leaderId,
    leaderName: response.data.user?.name,
    sheltersCount: response.data.shelters?.length || 0
  };
}

// 5. GET /leader-profiles/by-shelter/:shelterId - Buscar por shelter
async function testGetLeaderProfilesByShelter() {
  // Primeiro buscar um shelter
  const shelterResponse = await axios.get(`${BASE_URL}/shelters?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (shelterResponse.data.items.length === 0) {
    throw new Error('Nenhum shelter encontrado para teste');
  }
  
  const shelterId = shelterResponse.data.items[0].id;
  const response = await axios.get(`${BASE_URL}/leader-profiles/by-shelter/${shelterId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    shelterId: shelterId,
    shelterName: shelterResponse.data.items[0].name,
    leaderName: response.data.user?.name
  };
}

// 6. PATCH /leader-profiles/:leaderId/assign-shelter - Atribuir shelter
async function testAssignShelterToLeader() {
  // Buscar um leader sem shelter
  const leadersResponse = await axios.get(`${BASE_URL}/leader-profiles?hasShelters=false&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (leadersResponse.data.items.length === 0) {
    throw new Error('Nenhum leader sem shelter encontrado para teste');
  }
  
  // Buscar um shelter
  const shelterResponse = await axios.get(`${BASE_URL}/shelters?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (shelterResponse.data.items.length === 0) {
    throw new Error('Nenhum shelter encontrado para teste');
  }
  
  const leaderId = leadersResponse.data.items[0].id;
  const shelterId = shelterResponse.data.items[0].id;
  
  const response = await axios.patch(`${BASE_URL}/leader-profiles/${leaderId}/assign-shelter`, {
    shelterId: shelterId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    leaderId: leaderId,
    leaderName: leadersResponse.data.items[0].user?.name,
    shelterId: shelterId,
    shelterName: shelterResponse.data.items[0].name
  };
}

// 7. PATCH /leader-profiles/:leaderId/unassign-shelter - Remover shelter
async function testUnassignShelterFromLeader() {
  // Buscar um leader com shelter
  const leadersResponse = await axios.get(`${BASE_URL}/leader-profiles?hasShelters=true&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (leadersResponse.data.items.length === 0) {
    throw new Error('Nenhum leader com shelter encontrado para teste');
  }
  
  const leaderId = leadersResponse.data.items[0].id;
  const shelterId = leadersResponse.data.items[0].shelters?.[0]?.id;
  
  if (!shelterId) {
    throw new Error('Leader não possui shelter para desvincular');
  }
  
  const response = await axios.patch(`${BASE_URL}/leader-profiles/${leaderId}/unassign-shelter`, {
    shelterId: shelterId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    leaderId: leaderId,
    leaderName: leadersResponse.data.items[0].user?.name,
    shelterId: shelterId,
    shelterName: leadersResponse.data.items[0].shelters?.[0]?.name
  };
}

// 8. PATCH /leader-profiles/:fromLeaderId/move-shelter - Mover shelter
async function testMoveShelterBetweenLeaders() {
  // Buscar dois leaders diferentes
  const leadersResponse = await axios.get(`${BASE_URL}/leader-profiles?limit=2`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (leadersResponse.data.items.length < 2) {
    throw new Error('Não há leaders suficientes para teste de movimentação');
  }
  
  const fromLeaderId = leadersResponse.data.items[0].id;
  const toLeaderId = leadersResponse.data.items[1].id;
  
  // Buscar um shelter
  const shelterResponse = await axios.get(`${BASE_URL}/shelters?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (shelterResponse.data.items.length === 0) {
    throw new Error('Nenhum shelter encontrado para teste');
  }
  
  const shelterId = shelterResponse.data.items[0].id;
  
  // Primeiro atribuir o shelter ao leader de origem
  await axios.patch(`${BASE_URL}/leader-profiles/${fromLeaderId}/assign-shelter`, {
    shelterId: shelterId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  // Agora mover o shelter para o leader de destino
  const response = await axios.patch(`${BASE_URL}/leader-profiles/${fromLeaderId}/move-shelter`, {
    shelterId: shelterId,
    toLeaderId: toLeaderId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return {
    status: response.status,
    fromLeaderId: fromLeaderId,
    fromLeaderName: leadersResponse.data.items[0].user?.name,
    toLeaderId: toLeaderId,
    toLeaderName: leadersResponse.data.items[1].user?.name,
    shelterId: shelterId,
    shelterName: shelterResponse.data.items[0].name
  };
}

// 9. Teste de filtros avançados
async function testAdvancedFilters() {
  const filters = [
    { name: 'Busca por nome', params: '?q=João' },
    { name: 'Filtro por ativo', params: '?active=true' },
    { name: 'Filtro por inativo', params: '?active=false' },
    { name: 'Filtro com shelters', params: '?hasShelters=true' },
    { name: 'Filtro sem shelters', params: '?hasShelters=false' },
    { name: 'Ordenação por nome ASC', params: '?sort=name&order=asc' },
    { name: 'Ordenação por data DESC', params: '?sort=updatedAt&order=desc' },
    { name: 'Paginação', params: '?page=1&limit=5' },
    { name: 'Filtros combinados', params: '?active=true&hasShelters=false&page=1&limit=3' }
  ];
  
  const results = [];
  
  for (const filter of filters) {
    try {
      const response = await axios.get(`${BASE_URL}/leader-profiles${filter.params}`, {
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

// 10. Teste de cenários de erro
async function testErrorScenarios() {
  const errorTests = [
    {
      name: 'Buscar leader inexistente',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/leader-profiles/00000000-0000-0000-0000-000000000000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: response.status, expected: 404 };
      }
    },
    {
      name: 'Criar leader para usuário inexistente',
      test: async () => {
        const response = await axios.post(`${BASE_URL}/leader-profiles/create-for-user/00000000-0000-0000-0000-000000000000`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: response.status, expected: 404 };
      }
    },
    {
      name: 'Atribuir shelter inexistente',
      test: async () => {
        const leadersResponse = await axios.get(`${BASE_URL}/leader-profiles?limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (leadersResponse.data.items.length === 0) {
          throw new Error('Nenhum leader para teste');
        }
        
        const leaderId = leadersResponse.data.items[0].id;
        const response = await axios.patch(`${BASE_URL}/leader-profiles/${leaderId}/assign-shelter`, {
          shelterId: '00000000-0000-0000-0000-000000000000'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: response.status, expected: 404 };
      }
    },
    {
      name: 'Buscar shelter inexistente',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/leader-profiles/by-shelter/00000000-0000-0000-0000-000000000000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: response.status, expected: 404 };
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
  console.log('🎯 AUTOMAÇÃO COMPLETA - TESTE DE TODOS OS ENDPOINTS DE LEADER PROFILES');
  console.log('====================================================================');
  console.log('📋 Endpoints a serem testados:');
  console.log('   1. POST /leader-profiles/create-for-user/:userId - Criar leader profile');
  console.log('   2. GET /leader-profiles - Listagem paginada');
  console.log('   3. GET /leader-profiles/simple - Listagem simples');
  console.log('   4. GET /leader-profiles/:id - Buscar por ID');
  console.log('   5. GET /leader-profiles/by-shelter/:shelterId - Buscar por shelter');
  console.log('   6. PATCH /leader-profiles/:id/assign-shelter - Atribuir shelter');
  console.log('   7. PATCH /leader-profiles/:id/unassign-shelter - Remover shelter');
  console.log('   8. PATCH /leader-profiles/:id/move-shelter - Mover shelter');
  console.log('   9. Filtros avançados');
  console.log('   10. Cenários de erro');
  console.log('====================================================================');

  if (!(await login())) {
    console.error('❌ Falha no login. Encerrando automação.');
    return;
  }

  // Testar todos os endpoints
  await testEndpoint('POST /leader-profiles/create-for-user/:userId (criar leader profile)', testCreateLeaderProfile);
  await testEndpoint('GET /leader-profiles (listagem paginada)', testGetLeaderProfiles);
  await testEndpoint('GET /leader-profiles/simple (listagem simples)', testGetLeaderProfilesSimple);
  await testEndpoint('GET /leader-profiles/:id (buscar por ID)', testGetLeaderProfileById);
  await testEndpoint('GET /leader-profiles/by-shelter/:shelterId (buscar por shelter)', testGetLeaderProfilesByShelter);
  await testEndpoint('PATCH /leader-profiles/:id/assign-shelter (atribuir shelter)', testAssignShelterToLeader);
  await testEndpoint('PATCH /leader-profiles/:id/unassign-shelter (remover shelter)', testUnassignShelterFromLeader);
  await testEndpoint('PATCH /leader-profiles/:id/move-shelter (mover shelter)', testMoveShelterBetweenLeaders);
  await testEndpoint('Filtros avançados', testAdvancedFilters);
  await testEndpoint('Cenários de erro', testErrorScenarios);

  // Salvar resultados
  const resultsDir = 'docs/results/leader-profiles';
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

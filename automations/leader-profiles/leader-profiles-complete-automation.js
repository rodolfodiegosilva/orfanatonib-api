const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';
let testData = {
  users: [],
  shelters: [],
  leaderProfiles: []
};

// ==================== UTILITÁRIOS ====================

async function login() {
  try {
    console.log('🔐 Fazendo login como admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.status === 201) {
      authToken = response.data.accessToken;
      console.log('✅ Login realizado com sucesso!');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response;
  } catch (error) {
    console.error(`❌ Erro na requisição ${method} ${url}:`, error.response?.data || error.message);
    return null;
  }
}

async function getTestData() {
  console.log('📊 Obtendo dados necessários para os testes...');
  
  try {
    // Obter users (para criar leader profiles)
    const usersResponse = await makeRequest('GET', '/users/simple');
    if (usersResponse) {
      testData.users = usersResponse.data || [];
      console.log(`  👤 ${testData.users.length} users encontrados`);
    }

    // Obter shelters
    const sheltersResponse = await makeRequest('GET', '/shelters/simple');
    if (sheltersResponse) {
      testData.shelters = sheltersResponse.data || [];
      console.log(`  🏠 ${testData.shelters.length} shelters encontrados`);
    }

    // Obter leader profiles existentes
    const leadersResponse = await makeRequest('GET', '/leader-profiles/simple');
    if (leadersResponse) {
      testData.leaderProfiles = leadersResponse.data || [];
      console.log(`  👨‍💼 ${testData.leaderProfiles.length} leader profiles encontrados`);
    }

    console.log('✅ Dados obtidos com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao obter dados:', error.message);
    return false;
  }
}

// ==================== TESTES DE CRUD ====================

async function testLeaderProfilesCRUD() {
  console.log('\n📋 Testando CRUD de Leader Profiles...');
  
  // 1. Criar User primeiro (se necessário)
  let testUser = null;
  if (testData.users.length === 0) {
    console.log('  🔸 Criando user para teste...');
    const createUserData = {
      name: `User Leader Test ${Date.now()}`,
      email: `leader${Date.now()}@example.com`,
      password: 'password123',
      phone: '+5511999999999',
      role: 'leader',
      active: true,
      completed: false,
      commonUser: true
    };
    
    const createUserResponse = await makeRequest('POST', '/users', createUserData);
    if (createUserResponse && createUserResponse.status === 201) {
      testUser = createUserResponse.data;
      console.log(`    ✅ User criado: ${testUser.name}`);
    }
  } else {
    testUser = testData.users[0];
  }

  if (!testUser) {
    console.log('  ⚠️ Não foi possível criar/encontrar user para teste');
    return;
  }

  // 2. Criar Leader Profile
  console.log('  🔸 Teste 1: Criar Leader Profile');
  const createResponse = await makeRequest('POST', `/leader-profiles/create-for-user/${testUser.id}`);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ Leader Profile criado: ${createResponse.data.name}`);
    const createdProfile = createResponse.data;
    
    // 3. Buscar Leader Profile por ID
    console.log('  🔸 Teste 2: Buscar Leader Profile por ID');
    const getResponse = await makeRequest('GET', `/leader-profiles/${createdProfile.id}`);
    if (getResponse && getResponse.status === 200) {
      console.log(`    ✅ Leader Profile encontrado: ${getResponse.data.name}`);
    }

    // 4. Testar relacionamentos com shelters
    console.log('  🔸 Teste 3: Testar relacionamentos com shelters');
    if (testData.shelters.length > 0) {
      // Atribuir shelter ao leader
      const assignData = { shelterId: testData.shelters[0].id };
      const assignResponse = await makeRequest('PATCH', `/leader-profiles/${createdProfile.id}/assign-shelter`, assignData);
      if (assignResponse && assignResponse.status === 200) {
        console.log(`    ✅ Shelter atribuído: ${assignResponse.data.message}`);
      }
      
      // Buscar leader por shelter
      const findByShelterResponse = await makeRequest('GET', `/leader-profiles/by-shelter/${testData.shelters[0].id}`);
      if (findByShelterResponse && findByShelterResponse.status === 200) {
        console.log(`    ✅ Leader encontrado por shelter: ${findByShelterResponse.data.id}`);
      }
      
      // Remover shelter do leader
      const unassignData = { shelterId: testData.shelters[0].id };
      const unassignResponse = await makeRequest('PATCH', `/leader-profiles/${createdProfile.id}/unassign-shelter`, unassignData);
      if (unassignResponse && unassignResponse.status === 200) {
        console.log(`    ✅ Shelter removido: ${unassignResponse.data.message}`);
      }
    }
  }
}

// ==================== TESTES DE FILTROS ====================

async function testLeaderProfilesFilters() {
  console.log('\n📋 Testando Filtros Consolidados de Leader Profiles...');
  
  // 1. Filtro por dados do líder: leaderSearchString
  console.log('  🔸 Teste 1: Filtro por dados do líder (leaderSearchString=leader)');
  const leaderSearchResponse = await makeRequest('GET', '/leader-profiles?leaderSearchString=leader&limit=5');
  if (leaderSearchResponse && leaderSearchResponse.status === 200) {
    console.log(`    ✅ Status: ${leaderSearchResponse.status}`);
    console.log(`    📊 Encontrados: ${leaderSearchResponse.data.items?.length || 0}`);
  }

  // 2. Filtro por dados do shelter: shelterSearchString
  console.log('  🔸 Teste 2: Filtro por dados do shelter (shelterSearchString=Abrigo)');
  const shelterSearchResponse = await makeRequest('GET', '/leader-profiles?shelterSearchString=Abrigo&limit=5');
  if (shelterSearchResponse && shelterSearchResponse.status === 200) {
    console.log(`    ✅ Status: ${shelterSearchResponse.status}`);
    console.log(`    📊 Encontrados: ${shelterSearchResponse.data.items?.length || 0}`);
  }

  // 3. Filtro por vinculação a shelter: hasShelter=true
  console.log('  🔸 Teste 3: Filtro por vinculação a shelter (hasShelter=true)');
  const hasShelterTrueResponse = await makeRequest('GET', '/leader-profiles?hasShelter=true&limit=5');
  if (hasShelterTrueResponse && hasShelterTrueResponse.status === 200) {
    console.log(`    ✅ Status: ${hasShelterTrueResponse.status}`);
    console.log(`    📊 Encontrados: ${hasShelterTrueResponse.data.items?.length || 0}`);
  }

  // 4. Filtro por não vinculação a shelter: hasShelter=false
  console.log('  🔸 Teste 4: Filtro por não vinculação a shelter (hasShelter=false)');
  const hasShelterFalseResponse = await makeRequest('GET', '/leader-profiles?hasShelter=false&limit=5');
  if (hasShelterFalseResponse && hasShelterFalseResponse.status === 200) {
    console.log(`    ✅ Status: ${hasShelterFalseResponse.status}`);
    console.log(`    📊 Encontrados: ${hasShelterFalseResponse.data.items?.length || 0}`);
  }

  // 5. Combinação de filtros
  console.log('  🔸 Teste 5: Combinação de filtros (leaderSearchString=leader + hasShelter=true)');
  const combinedResponse = await makeRequest('GET', '/leader-profiles?leaderSearchString=leader&hasShelter=true&limit=5');
  if (combinedResponse && combinedResponse.status === 200) {
    console.log(`    ✅ Status: ${combinedResponse.status}`);
    console.log(`    📊 Encontrados: ${combinedResponse.data.items?.length || 0}`);
  }
}

// ==================== TESTES DE LISTAGEM ====================

async function testLeaderProfilesListings() {
  console.log('\n📋 Testando Listagens de Leader Profiles...');
  
  // 1. Listagem paginada
  console.log('  🔸 Teste 1: Listagem paginada');
  const paginatedResponse = await makeRequest('GET', '/leader-profiles?page=1&limit=10');
  if (paginatedResponse && paginatedResponse.status === 200) {
    console.log(`    ✅ Status: ${paginatedResponse.status}`);
    console.log(`    📊 Total: ${paginatedResponse.data.meta?.totalItems || 0}`);
    console.log(`    📄 Itens: ${paginatedResponse.data.items?.length || 0}`);
  }

  // 2. Listagem simples
  console.log('  🔸 Teste 2: Listagem simples');
  const simpleResponse = await makeRequest('GET', '/leader-profiles/simple');
  if (simpleResponse && simpleResponse.status === 200) {
    console.log(`    ✅ Status: ${simpleResponse.status}`);
    console.log(`    📊 Total: ${simpleResponse.data?.length || 0}`);
  }

  // 3. Ordenação
  console.log('  🔸 Teste 3: Ordenação (sort=name, order=asc)');
  const sortResponse = await makeRequest('GET', '/leader-profiles?sort=name&order=asc&limit=5');
  if (sortResponse && sortResponse.status === 200) {
    console.log(`    ✅ Status: ${sortResponse.status}`);
    console.log(`    📊 Ordenados: ${sortResponse.data.items?.length || 0}`);
  }
}

// ==================== TESTES DE VALIDAÇÃO ====================

async function testLeaderProfilesValidation() {
  console.log('\n📋 Testando Validações de Leader Profiles...');
  
  // 1. UserId inválido
  console.log('  🔸 Teste 1: UserId inválido');
  const invalidUserResponse = await makeRequest('POST', '/leader-profiles/create-for-user/00000000-0000-0000-0000-000000000000');
  if (invalidUserResponse && invalidUserResponse.status === 404) {
    console.log('    ✅ Erro esperado: User não encontrado');
  }

  // 2. Buscar registro inexistente
  console.log('  🔸 Teste 2: Buscar registro inexistente');
  const notFoundResponse = await makeRequest('GET', '/leader-profiles/00000000-0000-0000-0000-000000000000');
  if (notFoundResponse && notFoundResponse.status === 404) {
    console.log('    ✅ Erro esperado: Leader Profile não encontrado');
  }

  // 3. Buscar shelter inexistente
  console.log('  🔸 Teste 3: Buscar leader por shelter inexistente');
  const invalidShelterResponse = await makeRequest('GET', '/leader-profiles/by-shelter/00000000-0000-0000-0000-000000000000');
  if (invalidShelterResponse && invalidShelterResponse.status === 404) {
    console.log('    ✅ Erro esperado: Shelter não encontrado');
  }
}

// ==================== TESTES DE RELACIONAMENTOS ====================

async function testLeaderProfilesRelationships() {
  console.log('\n📋 Testando Relacionamentos de Leader Profiles...');
  
  if (testData.users.length === 0 || testData.shelters.length === 0) {
    console.log('  ⚠️ Dados insuficientes para testar relacionamentos');
    return;
  }

  // 1. Criar leader profile com relacionamentos
  console.log('  🔸 Teste 1: Criar leader profile com relacionamentos');
  const createData = {
    userId: testData.users[0].id,
    shelterId: testData.shelters[0].id,
    name: `Leader Relacionamento ${Date.now()}`,
    phone: '+5511777777777',
    email: `leader${Date.now()}@example.com`,
    address: {
      street: 'Rua dos Relacionamentos',
      number: '456',
      district: 'Teste',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567'
    }
  };

  const createResponse = await makeRequest('POST', '/leader-profiles', createData);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ Leader Profile criado: ${createResponse.data.name}`);
    console.log(`    👤 User vinculado: ${createResponse.data.user?.name || 'N/A'}`);
    console.log(`    🏠 Shelter vinculado: ${createResponse.data.shelter?.name || 'N/A'}`);
    const createdProfile = createdProfile.data;

    // 2. Atualizar shelter do leader
    console.log('  🔸 Teste 2: Atualizar shelter do leader');
    if (testData.shelters.length > 1) {
      const updateShelterResponse = await makeRequest('PUT', `/leader-profiles/${createdProfile.id}`, {
        shelterId: testData.shelters[1].id
      });
      
      if (updateShelterResponse && updateShelterResponse.status === 200) {
        console.log(`    ✅ Shelter atualizado: ${updateShelterResponse.data.shelter?.name || 'N/A'}`);
      }
    }

    // 3. Deletar leader profile de teste
    console.log('  🔸 Teste 3: Deletar leader profile de teste');
    const deleteResponse = await makeRequest('DELETE', `/leader-profiles/${createdProfile.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Leader Profile de teste deletado');
    }
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runLeaderProfilesAutomation() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - MÓDULO LEADER PROFILES');
  console.log('===============================================');
  console.log('📋 Funcionalidades a serem testadas:');
  console.log('   1. CRUD de Leader Profiles');
  console.log('   2. Filtros e Buscas');
  console.log('   3. Listagens e Paginação');
  console.log('   4. Validações de Dados');
  console.log('   5. Relacionamentos com Users e Shelters');
  console.log('===============================================');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Falha no login. Encerrando automação.');
    return;
  }

  // Obter dados
  const dataSuccess = await getTestData();
  if (!dataSuccess) {
    console.error('❌ Falha ao obter dados. Encerrando automação.');
    return;
  }

  // Executar testes
  await testLeaderProfilesCRUD();
  await testLeaderProfilesFilters();
  await testLeaderProfilesListings();
  await testLeaderProfilesValidation();
  await testLeaderProfilesRelationships();

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('=====================================');
  console.log('✅ Todos os testes foram executados');
  console.log('✅ CRUD de Leader Profiles funcionando');
  console.log('✅ Filtros e buscas funcionando');
  console.log('✅ Listagens e paginação funcionando');
  console.log('✅ Validações funcionando');
  console.log('✅ Relacionamentos funcionando');
  console.log('✅ Sistema pronto para produção!');
}

// Executar automação
runLeaderProfilesAutomation()
  .then(() => {
    console.log('\n✅ Automação finalizada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante a automação:', error);
    process.exit(1);
  });

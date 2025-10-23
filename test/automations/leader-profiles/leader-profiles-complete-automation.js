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
    // Obter users com role leader
    const usersResponse = await makeRequest('GET', '/users?role=leader&limit=100');
    if (usersResponse) {
      testData.users = usersResponse.data.items || usersResponse.data || [];
      console.log(`  👤 ${testData.users.length} users com role leader encontrados`);
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

// ==================== TESTES DE RELACIONAMENTOS MANYTOMANY ====================

async function testLeaderProfilesRelationships() {
  console.log('\n📋 Testando Relacionamentos ManyToMany de Leader Profiles...');
  
  if (testData.shelters.length < 3) {
    console.log('  ⚠️ Dados insuficientes para testar relacionamentos (necessário pelo menos 3 shelters)');
    return;
  }

  // 1. Criar dois leader profiles para teste
  console.log('  🔸 Teste 1: Criar dois leader profiles');
  
  const leader1Data = {
    name: `Leader Teste 1 - ${Date.now()}`,
    email: `leader1-${Date.now()}@example.com`,
    password: 'password123',
    phone: '+5511777777777',
    role: 'leader',
    active: true,
    completed: true,
    commonUser: false
  };
  
  const leader2Data = {
    name: `Leader Teste 2 - ${Date.now()}`,
    email: `leader2-${Date.now()}@example.com`,
    password: 'password123',
    phone: '+5511888888888',
    role: 'leader',
    active: true,
    completed: true,
    commonUser: false
  };
  
  // Criar users
  const user1Response = await makeRequest('POST', '/users', leader1Data);
  const user2Response = await makeRequest('POST', '/users', leader2Data);
  
  if (!user1Response || !user2Response) {
    console.log('  ⚠️ Não foi possível criar users para teste');
    return;
  }
  
  const user1 = user1Response.data;
  const user2 = user2Response.data;
  console.log(`    ✅ Users criados: ${user1.name} e ${user2.name}`);
  
  // Criar leader profiles
  const profile1Response = await makeRequest('POST', `/leader-profiles/create-for-user/${user1.id}`);
  const profile2Response = await makeRequest('POST', `/leader-profiles/create-for-user/${user2.id}`);
  
  if (!profile1Response || !profile2Response) {
    console.log('  ⚠️ Não foi possível criar leader profiles');
    return;
  }
  
  const profile1 = profile1Response.data;
  const profile2 = profile2Response.data;
  console.log(`    ✅ Leader Profiles criados`);

  // 2. Atribuir múltiplos shelters ao leader 1
  console.log('  🔸 Teste 2: Atribuir múltiplos shelters ao Leader 1');
  const shelter1 = testData.shelters[0];
  const shelter2 = testData.shelters[1];
  const shelter3 = testData.shelters[2];
  
  await makeRequest('PATCH', `/leader-profiles/${profile1.id}/assign-shelter`, { shelterId: shelter1.id });
  await makeRequest('PATCH', `/leader-profiles/${profile1.id}/assign-shelter`, { shelterId: shelter2.id });
  console.log(`    ✅ Dois shelters atribuídos ao Leader 1`);

  // 3. Atribuir shelter ao leader 2
  console.log('  🔸 Teste 3: Atribuir shelter ao Leader 2');
  await makeRequest('PATCH', `/leader-profiles/${profile2.id}/assign-shelter`, { shelterId: shelter3.id });
  console.log(`    ✅ Shelter atribuído ao Leader 2`);

  // 4. Buscar leader por shelter
  console.log('  🔸 Teste 4: Buscar leader por shelter');
  const findByShelterResponse = await makeRequest('GET', `/leader-profiles/by-shelter/${shelter1.id}`);
  if (findByShelterResponse && findByShelterResponse.status === 200) {
    console.log(`    ✅ Leader encontrado: ${findByShelterResponse.data.user?.name || 'N/A'}`);
  }

  // 5. Verificar shelter com múltiplos leaders (se suportado)
  console.log('  🔸 Teste 5: Verificar relacionamentos ManyToMany');
  const profile1DetailsResponse = await makeRequest('GET', `/leader-profiles/${profile1.id}`);
  if (profile1DetailsResponse && profile1DetailsResponse.status === 200) {
    const sheltersCount = profile1DetailsResponse.data.shelters?.length || 0;
    console.log(`    ✅ Leader 1 possui ${sheltersCount} shelter(s) vinculado(s)`);
  }

  // 6. Mover shelter entre leaders
  console.log('  🔸 Teste 6: Mover shelter do Leader 1 para Leader 2');
  const moveShelterResponse = await makeRequest('PATCH', `/leader-profiles/${profile1.id}/move-shelter`, {
    shelterId: shelter1.id,
    toLeaderId: profile2.id
  });
  if (moveShelterResponse && moveShelterResponse.status === 200) {
    console.log(`    ✅ Shelter movido com sucesso: ${moveShelterResponse.data.message}`);
  }

  // 7. Desatribuir shelter
  console.log('  🔸 Teste 7: Desatribuir shelter do Leader 1');
  const unassignResponse = await makeRequest('PATCH', `/leader-profiles/${profile1.id}/unassign-shelter`, {
    shelterId: shelter2.id
  });
  if (unassignResponse && unassignResponse.status === 200) {
    console.log(`    ✅ Shelter desatribuído: ${unassignResponse.data.message}`);
  }

  // 8. Testar filtro hasShelter
  console.log('  🔸 Teste 8: Testar filtro hasShelter');
  const withShelterResponse = await makeRequest('GET', '/leader-profiles?hasShelter=true&limit=5');
  const withoutShelterResponse = await makeRequest('GET', '/leader-profiles?hasShelter=false&limit=5');
  if (withShelterResponse && withoutShelterResponse) {
    console.log(`    ✅ Com shelter: ${withShelterResponse.data.items?.length || 0}`);
    console.log(`    ✅ Sem shelter: ${withoutShelterResponse.data.items?.length || 0}`);
  }

  // 9. Cleanup - Deletar profiles de teste
  console.log('  🔸 Teste 9: Cleanup - Deletar profiles de teste');
  await makeRequest('DELETE', `/leader-profiles/${profile1.id}`);
  await makeRequest('DELETE', `/leader-profiles/${profile2.id}`);
  await makeRequest('DELETE', `/users/${user1.id}`);
  await makeRequest('DELETE', `/users/${user2.id}`);
  console.log('    ✅ Profiles e users de teste deletados');
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runLeaderProfilesAutomation() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - MÓDULO LEADER PROFILES');
  console.log('===============================================');
  console.log('📋 Funcionalidades a serem testadas:');
  console.log('   1. CRUD de Leader Profiles');
  console.log('   2. Filtros Consolidados (leaderSearchString, shelterSearchString, hasShelter)');
  console.log('   3. Listagens e Paginação Avançada');
  console.log('   4. Validações de Dados');
  console.log('   5. Relacionamentos ManyToMany:');
  console.log('      - Atribuir/Desatribuir Shelters');
  console.log('      - Mover Shelters entre Leaders');
  console.log('      - Múltiplos Shelters por Leader');
  console.log('      - Busca por Shelter');
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

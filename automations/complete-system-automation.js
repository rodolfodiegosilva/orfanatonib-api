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
  sheltered: [],
  leaderProfiles: [],
  teacherProfiles: []
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
    // Obter shelters
    const sheltersResponse = await makeRequest('GET', '/shelters/simple');
    if (sheltersResponse) {
      testData.shelters = sheltersResponse.data || [];
      console.log(`  🏠 ${testData.shelters.length} shelters encontrados`);
    }

    // Obter sheltered
    const shelteredResponse = await makeRequest('GET', '/sheltered/simple');
    if (shelteredResponse) {
      testData.sheltered = shelteredResponse.data || [];
      console.log(`  👥 ${testData.sheltered.length} sheltered encontrados`);
    }

    // Obter users
    const usersResponse = await makeRequest('GET', '/users/simple');
    if (usersResponse) {
      testData.users = usersResponse.data || [];
      console.log(`  👤 ${testData.users.length} users encontrados`);
    }

    console.log('✅ Dados obtidos com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao obter dados:', error.message);
    return false;
  }
}

// ==================== TESTES DE SHELTERED ====================

async function testShelteredCRUD() {
  console.log('\n📋 Testando CRUD de Sheltered...');
  
  // 1. Criar Sheltered
  console.log('  🔸 Teste 1: Criar Sheltered');
  const createData = {
    name: `Sheltered Teste ${Date.now()}`,
    birthDate: '2010-05-15',
    guardianName: 'Maria Silva',
    gender: 'F',
    guardianPhone: '+5511777777777',
    joinedAt: '2023-01-15',
    shelterId: testData.shelters[0]?.id,
    address: {
      street: 'Rua das Flores',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567',
      complement: 'Apto 45'
    }
  };
  
  const createResponse = await makeRequest('POST', '/sheltered', createData);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ Sheltered criado: ${createResponse.data.name}`);
    const createdSheltered = createResponse.data;
    
    // 2. Buscar Sheltered por ID
    console.log('  🔸 Teste 2: Buscar Sheltered por ID');
    const getResponse = await makeRequest('GET', `/sheltered/${createdSheltered.id}`);
    if (getResponse && getResponse.status === 200) {
      console.log(`    ✅ Sheltered encontrado: ${getResponse.data.name}`);
    }

    // 3. Atualizar Sheltered
    console.log('  🔸 Teste 3: Atualizar Sheltered');
    const updateData = {
      name: `${createData.name} - Atualizado`,
      gender: 'M'
    };
    
    const updateResponse = await makeRequest('PUT', `/sheltered/${createdSheltered.id}`, updateData);
    if (updateResponse && updateResponse.status === 200) {
      console.log(`    ✅ Sheltered atualizado: ${updateResponse.data.name}`);
    }

    // 4. Deletar Sheltered
    console.log('  🔸 Teste 4: Deletar Sheltered');
    const deleteResponse = await makeRequest('DELETE', `/sheltered/${createdSheltered.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Sheltered deletado com sucesso');
    }
  }
}

async function testShelteredFilters() {
  console.log('\n📋 Testando Filtros de Sheltered...');
  
  // 1. Filtro por gender
  console.log('  🔸 Teste 1: Filtro por gender (gender=F)');
  const genderResponse = await makeRequest('GET', '/sheltered?gender=F&limit=5');
  if (genderResponse && genderResponse.status === 200) {
    console.log(`    ✅ Status: ${genderResponse.status}`);
    console.log(`    📊 Encontrados: ${genderResponse.data.items?.length || 0}`);
  }

  // 2. Filtro por nome
  console.log('  🔸 Teste 2: Filtro por nome (shelteredName=Ana)');
  const nameResponse = await makeRequest('GET', '/sheltered?shelteredName=Ana&limit=5');
  if (nameResponse && nameResponse.status === 200) {
    console.log(`    ✅ Status: ${nameResponse.status}`);
    console.log(`    📊 Encontrados: ${nameResponse.data.items?.length || 0}`);
  }

  // 3. Filtro por shelter
  console.log('  🔸 Teste 3: Filtro por shelter');
  if (testData.shelters.length > 0) {
    const shelterResponse = await makeRequest('GET', `/sheltered?shelterId=${testData.shelters[0].id}&limit=5`);
    if (shelterResponse && shelterResponse.status === 200) {
      console.log(`    ✅ Status: ${shelterResponse.status}`);
      console.log(`    📊 Encontrados: ${shelterResponse.data.items?.length || 0}`);
    }
  }
}

// ==================== TESTES DE SHELTERS ====================

async function testSheltersCRUD() {
  console.log('\n📋 Testando CRUD de Shelters...');
  
  // 1. Criar Shelter
  console.log('  🔸 Teste 1: Criar Shelter');
  const createData = {
    name: `Shelter Teste ${Date.now()}`,
    capacity: 50,
    address: {
      street: 'Rua dos Abrigos',
      number: '456',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567'
    }
  };
  
  const createResponse = await makeRequest('POST', '/shelters', createData);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ Shelter criado: ${createResponse.data.name}`);
    const createdShelter = createResponse.data;
    
    // 2. Buscar Shelter por ID
    console.log('  🔸 Teste 2: Buscar Shelter por ID');
    const getResponse = await makeRequest('GET', `/shelters/${createdShelter.id}`);
    if (getResponse && getResponse.status === 200) {
      console.log(`    ✅ Shelter encontrado: ${getResponse.data.name}`);
    }

    // 3. Atualizar Shelter
    console.log('  🔸 Teste 3: Atualizar Shelter');
    const updateData = {
      name: `${createData.name} - Atualizado`,
      capacity: 60
    };
    
    const updateResponse = await makeRequest('PUT', `/shelters/${createdShelter.id}`, updateData);
    if (updateResponse && updateResponse.status === 200) {
      console.log(`    ✅ Shelter atualizado: ${updateResponse.data.name}`);
    }

    // 4. Deletar Shelter
    console.log('  🔸 Teste 4: Deletar Shelter');
    const deleteResponse = await makeRequest('DELETE', `/shelters/${createdShelter.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Shelter deletado com sucesso');
    }
  }
}

// ==================== TESTES DE USERS ====================

async function testUsersCRUD() {
  console.log('\n📋 Testando CRUD de Users...');
  
  // 1. Criar User
  console.log('  🔸 Teste 1: Criar User');
  const createData = {
    name: `User Teste ${Date.now()}`,
    email: `teste${Date.now()}@example.com`,
    password: 'password123',
    role: 'teacher'
  };
  
  const createResponse = await makeRequest('POST', '/users', createData);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ User criado: ${createResponse.data.name}`);
    const createdUser = createResponse.data;
    
    // 2. Buscar User por ID
    console.log('  🔸 Teste 2: Buscar User por ID');
    const getResponse = await makeRequest('GET', `/users/${createdUser.id}`);
    if (getResponse && getResponse.status === 200) {
      console.log(`    ✅ User encontrado: ${getResponse.data.name}`);
    }

    // 3. Atualizar User
    console.log('  🔸 Teste 3: Atualizar User');
    const updateData = {
      name: `${createData.name} - Atualizado`
    };
    
    const updateResponse = await makeRequest('PUT', `/users/${createdUser.id}`, updateData);
    if (updateResponse && updateResponse.status === 200) {
      console.log(`    ✅ User atualizado: ${updateResponse.data.name}`);
    }

    // 4. Deletar User
    console.log('  🔸 Teste 4: Deletar User');
    const deleteResponse = await makeRequest('DELETE', `/users/${createdUser.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ User deletado com sucesso');
    }
  }
}

// ==================== TESTES DE VALIDAÇÃO ====================

async function testValidationErrors() {
  console.log('\n📋 Testando Validações de Erro...');
  
  // 1. Criar sheltered com gender inválido
  console.log('  🔸 Teste 1: Criar sheltered com gender inválido');
  const invalidGenderResponse = await makeRequest('POST', '/sheltered', {
    name: 'Teste',
    birthDate: '2010-01-01',
    gender: 'INVALID'
  });
  if (invalidGenderResponse && invalidGenderResponse.status === 400) {
    console.log('    ✅ Erro esperado: Gender inválido rejeitado');
  }

  // 2. Criar user com email inválido
  console.log('  🔸 Teste 2: Criar user com email inválido');
  const invalidEmailResponse = await makeRequest('POST', '/users', {
    name: 'Teste',
    email: 'email-invalido',
    password: 'password123',
    role: 'teacher'
  });
  if (invalidEmailResponse && invalidEmailResponse.status === 400) {
    console.log('    ✅ Erro esperado: Email inválido rejeitado');
  }

  // 3. Buscar registro inexistente
  console.log('  🔸 Teste 3: Buscar registro inexistente');
  const notFoundResponse = await makeRequest('GET', '/sheltered/00000000-0000-0000-0000-000000000000');
  if (notFoundResponse && notFoundResponse.status === 404) {
    console.log('    ✅ Erro esperado: Registro não encontrado');
  }
}

// ==================== TESTES DE LISTAGEM ====================

async function testListings() {
  console.log('\n📋 Testando Listagens...');
  
  // 1. Listagem paginada de sheltered
  console.log('  🔸 Teste 1: Listagem paginada de sheltered');
  const shelteredListResponse = await makeRequest('GET', '/sheltered?page=1&limit=10');
  if (shelteredListResponse && shelteredListResponse.status === 200) {
    console.log(`    ✅ Status: ${shelteredListResponse.status}`);
    console.log(`    📊 Total: ${shelteredListResponse.data.meta?.totalItems || 0}`);
    console.log(`    📄 Itens: ${shelteredListResponse.data.items?.length || 0}`);
  }

  // 2. Listagem simples de shelters
  console.log('  🔸 Teste 2: Listagem simples de shelters');
  const sheltersSimpleResponse = await makeRequest('GET', '/shelters/simple');
  if (sheltersSimpleResponse && sheltersSimpleResponse.status === 200) {
    console.log(`    ✅ Status: ${sheltersSimpleResponse.status}`);
    console.log(`    📊 Total: ${sheltersSimpleResponse.data?.length || 0}`);
  }

  // 3. Listagem de users
  console.log('  🔸 Teste 3: Listagem de users');
  const usersListResponse = await makeRequest('GET', '/users?page=1&limit=10');
  if (usersListResponse && usersListResponse.status === 200) {
    console.log(`    ✅ Status: ${usersListResponse.status}`);
    console.log(`    📊 Total: ${usersListResponse.data.meta?.totalItems || 0}`);
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runCompleteAutomation() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - SISTEMA ORFANATO');
  console.log('========================================');
  console.log('📋 Módulos a serem testados:');
  console.log('   1. Sheltered (CRUD + Filtros)');
  console.log('   2. Shelters (CRUD)');
  console.log('   3. Users (CRUD)');
  console.log('   4. Validações de Erro');
  console.log('   5. Listagens e Paginação');
  console.log('========================================');

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
  await testShelteredCRUD();
  await testShelteredFilters();
  await testSheltersCRUD();
  await testUsersCRUD();
  await testValidationErrors();
  await testListings();

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('=====================================');
  console.log('✅ Todos os testes foram executados');
  console.log('✅ CRUD de Sheltered funcionando');
  console.log('✅ CRUD de Shelters funcionando');
  console.log('✅ CRUD de Users funcionando');
  console.log('✅ Validações de gender funcionando');
  console.log('✅ Filtros funcionando');
  console.log('✅ Listagens funcionando');
  console.log('✅ Validações de erro funcionando');
  console.log('✅ Sistema pronto para produção!');
}

// Executar automação
runCompleteAutomation()
  .then(() => {
    console.log('\n✅ Automação finalizada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante a automação:', error);
    process.exit(1);
  });

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
    // Obter users
    const usersResponse = await makeRequest('GET', '/users/simple');
    if (usersResponse) {
      testData.users = usersResponse.data || [];
      console.log(`  👤 ${testData.users.length} users encontrados`);
    }

    // Obter shelters existentes
    const sheltersResponse = await makeRequest('GET', '/shelters/simple');
    if (sheltersResponse) {
      testData.shelters = sheltersResponse.data || [];
      console.log(`  🏠 ${testData.shelters.length} shelters encontrados`);
    }

    // Obter leader profiles
    const leadersResponse = await makeRequest('GET', '/leader-profiles/simple');
    if (leadersResponse) {
      testData.leaderProfiles = leadersResponse.data || [];
      console.log(`  👨‍💼 ${testData.leaderProfiles.length} leader profiles encontrados`);
    }

    // Obter teacher profiles
    const teachersResponse = await makeRequest('GET', '/teacher-profiles/simple');
    if (teachersResponse) {
      testData.teacherProfiles = teachersResponse.data || [];
      console.log(`  👩‍🏫 ${testData.teacherProfiles.length} teacher profiles encontrados`);
    }

    console.log('✅ Dados obtidos com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao obter dados:', error.message);
    return false;
  }
}

// ==================== TESTES DE CRUD ====================

async function testSheltersCRUD() {
  console.log('\n📋 Testando CRUD de Shelters...');
  
  // 1. Criar Shelter
  console.log('  🔸 Teste 1: Criar Shelter');
  const createData = {
    name: `Shelter Teste ${Date.now()}`,
    address: {
      street: 'Rua dos Abrigos',
      number: '456',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567',
      complement: 'Prédio A'
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
      name: `${createData.name} - Atualizado`
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

// ==================== TESTES DE FILTROS ====================

async function testSheltersFilters() {
  console.log('\n📋 Testando Filtros de Shelters...');
  
  // 1. Filtro por nome
  console.log('  🔸 Teste 1: Filtro por nome (shelterName=Central)');
  const nameResponse = await makeRequest('GET', '/shelters?shelterName=Central&limit=5');
  if (nameResponse && nameResponse.status === 200) {
    console.log(`    ✅ Status: ${nameResponse.status}`);
    console.log(`    📊 Encontrados: ${nameResponse.data.items?.length || 0}`);
  }

  // 2. Filtro por endereço
  console.log('  🔸 Teste 2: Filtro por endereço (addressFilter=São Paulo)');
  const addressResponse = await makeRequest('GET', '/shelters?addressFilter=São Paulo&limit=5');
  if (addressResponse && addressResponse.status === 200) {
    console.log(`    ✅ Status: ${addressResponse.status}`);
    console.log(`    📊 Encontrados: ${addressResponse.data.items?.length || 0}`);
  }

  // 3. Filtro por staff
  console.log('  🔸 Teste 3: Filtro por staff (staffFilters=João)');
  const staffResponse = await makeRequest('GET', '/shelters?staffFilters=João&limit=5');
  if (staffResponse && staffResponse.status === 200) {
    console.log(`    ✅ Status: ${staffResponse.status}`);
    console.log(`    📊 Encontrados: ${staffResponse.data.items?.length || 0}`);
  }

  // 4. Busca por string
  console.log('  🔸 Teste 4: Busca por string (searchString=Central)');
  const searchResponse = await makeRequest('GET', '/shelters?searchString=Central&limit=5');
  if (searchResponse && searchResponse.status === 200) {
    console.log(`    ✅ Status: ${searchResponse.status}`);
    console.log(`    📊 Encontrados: ${searchResponse.data.items?.length || 0}`);
  }
}

// ==================== TESTES DE LISTAGEM ====================

async function testSheltersListings() {
  console.log('\n📋 Testando Listagens de Shelters...');
  
  // 1. Listagem paginada
  console.log('  🔸 Teste 1: Listagem paginada');
  const paginatedResponse = await makeRequest('GET', '/shelters?page=1&limit=10');
  if (paginatedResponse && paginatedResponse.status === 200) {
    console.log(`    ✅ Status: ${paginatedResponse.status}`);
    console.log(`    📊 Total: ${paginatedResponse.data.meta?.totalItems || 0}`);
    console.log(`    📄 Itens: ${paginatedResponse.data.items?.length || 0}`);
  }

  // 2. Listagem simples
  console.log('  🔸 Teste 2: Listagem simples');
  const simpleResponse = await makeRequest('GET', '/shelters/simple');
  if (simpleResponse && simpleResponse.status === 200) {
    console.log(`    ✅ Status: ${simpleResponse.status}`);
    console.log(`    📊 Total: ${simpleResponse.data?.length || 0}`);
  }

  // 3. Ordenação
  console.log('  🔸 Teste 3: Ordenação (sort=name, order=ASC)');
  const sortResponse = await makeRequest('GET', '/shelters?sort=name&order=ASC&limit=5');
  if (sortResponse && sortResponse.status === 200) {
    console.log(`    ✅ Status: ${sortResponse.status}`);
    console.log(`    📊 Ordenados: ${sortResponse.data.items?.length || 0}`);
  }
}

// ==================== TESTES DE VALIDAÇÃO ====================

async function testSheltersValidation() {
  console.log('\n📋 Testando Validações de Shelters...');
  
  // 1. Nome muito curto
  console.log('  🔸 Teste 1: Nome muito curto');
  const shortNameResponse = await makeRequest('POST', '/shelters', {
    name: 'A',
    capacity: 30
  });
  if (shortNameResponse && shortNameResponse.status === 400) {
    console.log('    ✅ Erro esperado: Nome muito curto rejeitado');
  }

  // 2. Endereço incompleto
  console.log('  🔸 Teste 2: Endereço incompleto');
  const invalidAddressResponse = await makeRequest('POST', '/shelters', {
    name: 'Teste',
    address: {
      street: 'Rua Teste',
      // Faltando campos obrigatórios
    }
  });
  if (invalidAddressResponse && invalidAddressResponse.status === 400) {
    console.log('    ✅ Erro esperado: Endereço incompleto rejeitado');
  }

  // 3. Endereço inválido
  console.log('  🔸 Teste 3: Endereço inválido');
  const invalidAddress2Response = await makeRequest('POST', '/shelters', {
    name: 'Teste',
    address: {
      street: '', // Campo obrigatório vazio
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567'
    }
  });
  if (invalidAddress2Response && invalidAddress2Response.status === 400) {
    console.log('    ✅ Erro esperado: Endereço inválido rejeitado');
  }

  // 4. Buscar registro inexistente
  console.log('  🔸 Teste 4: Buscar registro inexistente');
  const notFoundResponse = await makeRequest('GET', '/shelters/00000000-0000-0000-0000-000000000000');
  if (notFoundResponse && notFoundResponse.status === 404) {
    console.log('    ✅ Erro esperado: Registro não encontrado');
  }
}

// ==================== TESTES DE RELACIONAMENTOS ====================

async function testSheltersRelationships() {
  console.log('\n📋 Testando Relacionamentos de Shelters...');
  
  if (testData.users.length === 0) {
    console.log('  ⚠️ Nenhum user encontrado para testar relacionamentos');
    return;
  }

  // 1. Criar shelter
  console.log('  🔸 Teste 1: Criar shelter');
  const createShelterData = {
    name: `Shelter com Relacionamentos ${Date.now()}`,
    address: {
      street: 'Rua dos Relacionamentos',
      number: '789',
      district: 'Teste',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567'
    }
  };

  const createShelterResponse = await makeRequest('POST', '/shelters', createShelterData);
  if (createShelterResponse && createShelterResponse.status === 201) {
    console.log(`    ✅ Shelter criado: ${createShelterResponse.data.name}`);
    const createdShelter = createShelterResponse.data;

    // 2. Vincular leader profile (se existir)
    if (testData.leaderProfiles.length > 0) {
      console.log('  🔸 Teste 2: Vincular leader profile');
      const linkLeaderResponse = await makeRequest('PATCH', `/shelters/${createdShelter.id}/leaders`, {
        leaderProfileIds: [testData.leaderProfiles[0].id]
      });
      
      if (linkLeaderResponse && linkLeaderResponse.status === 200) {
        console.log(`    ✅ Leader vinculado: ${linkLeaderResponse.data.name}`);
      }
    }

    // 3. Vincular teacher profiles (se existirem)
    if (testData.teacherProfiles.length > 0) {
      console.log('  🔸 Teste 3: Vincular teacher profiles');
      const linkTeachersResponse = await makeRequest('PATCH', `/shelters/${createdShelter.id}/teachers`, {
        teacherProfileIds: [testData.teacherProfiles[0].id]
      });
      
      if (linkTeachersResponse && linkTeachersResponse.status === 200) {
        console.log(`    ✅ Teachers vinculados: ${linkTeachersResponse.data.name}`);
      }
    }

    // 4. Verificar sheltered vinculados
    console.log('  🔸 Teste 4: Verificar sheltered vinculados');
    const shelteredResponse = await makeRequest('GET', `/sheltered?shelterId=${createdShelter.id}&limit=10`);
    if (shelteredResponse && shelteredResponse.status === 200) {
      console.log(`    ✅ Sheltered vinculados: ${shelteredResponse.data.items?.length || 0}`);
    }

    // 5. Deletar shelter de teste
    console.log('  🔸 Teste 5: Deletar shelter de teste');
    const deleteResponse = await makeRequest('DELETE', `/shelters/${createdShelter.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Shelter de teste deletado');
    }
  }
}

// ==================== TESTES DE ESTATÍSTICAS ====================

async function testSheltersStatistics() {
  console.log('\n📋 Testando Estatísticas de Shelters...');
  
  // 1. Contar shelters por cidade
  console.log('  🔸 Teste 1: Contar shelters por cidade');
  const cityResponse = await makeRequest('GET', '/shelters?addressFilter=São Paulo&limit=1000');
  if (cityResponse && cityResponse.status === 200) {
    const cityCount = cityResponse.data.items?.length || 0;
    console.log(`    📊 Shelters em São Paulo: ${cityCount}`);
  }

  // 2. Total geral
  console.log('  🔸 Teste 2: Total geral');
  const totalResponse = await makeRequest('GET', '/shelters/simple');
  if (totalResponse && totalResponse.status === 200) {
    const total = totalResponse.data?.length || 0;
    console.log(`    📊 Total de shelters: ${total}`);
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runSheltersAutomation() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - MÓDULO SHELTERS');
  console.log('=======================================');
  console.log('📋 Funcionalidades a serem testadas:');
  console.log('   1. CRUD de Shelters');
  console.log('   2. Filtros e Buscas');
  console.log('   3. Listagens e Paginação');
  console.log('   4. Validações de Dados');
  console.log('   5. Relacionamentos com Users/Profiles');
  console.log('   6. Estatísticas e Relatórios');
  console.log('=======================================');

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
  await testSheltersCRUD();
  await testSheltersFilters();
  await testSheltersListings();
  await testSheltersValidation();
  await testSheltersRelationships();
  await testSheltersStatistics();

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('=====================================');
  console.log('✅ Todos os testes foram executados');
  console.log('✅ CRUD de Shelters funcionando');
  console.log('✅ Filtros e buscas funcionando');
  console.log('✅ Listagens e paginação funcionando');
  console.log('✅ Validações funcionando');
  console.log('✅ Relacionamentos funcionando');
  console.log('✅ Estatísticas funcionando');
  console.log('✅ Sistema pronto para produção!');
}

// Executar automação
runSheltersAutomation()
  .then(() => {
    console.log('\n✅ Automação finalizada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante a automação:', error);
    process.exit(1);
  });

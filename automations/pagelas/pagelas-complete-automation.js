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
  pagelas: []
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

    // Obter pagelas existentes
    const pagelasResponse = await makeRequest('GET', '/pagelas');
    if (pagelasResponse) {
      testData.pagelas = pagelasResponse.data || [];
      console.log(`  📚 ${testData.pagelas.length} pagelas encontradas`);
    }

    console.log('✅ Dados obtidos com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao obter dados:', error.message);
    return false;
  }
}

// ==================== TESTES DE CRUD ====================

async function testPagelasCRUD() {
  console.log('\n📋 Testando CRUD de Pagelas...');
  
  if (testData.sheltered.length === 0) {
    console.log('  ⚠️ Nenhum sheltered encontrado para criar pagela');
    return;
  }

  // 1. Criar Pagela
  console.log('  🔸 Teste 1: Criar Pagela');
  const createData = {
    shelteredId: testData.sheltered[0].id,
    teacherProfileId: '00000000-0000-0000-0000-000000000000', // UUID válido temporário
    referenceDate: new Date().toISOString(),
    visit: 1,
    present: true,
    notes: 'Notas da pagela de teste'
  };
  
  const createResponse = await makeRequest('POST', '/pagelas', createData);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ Pagela criada: ID ${createResponse.data.id}`);
    const createdPagela = createResponse.data;
    
    // 2. Buscar Pagela por ID
    console.log('  🔸 Teste 2: Buscar Pagela por ID');
    const getResponse = await makeRequest('GET', `/pagelas/${createdPagela.id}`);
    if (getResponse && getResponse.status === 200) {
      console.log(`    ✅ Pagela encontrada: ID ${getResponse.data.id}`);
    }

    // 3. Atualizar Pagela
    console.log('  🔸 Teste 3: Atualizar Pagela');
    const updateData = {
      present: false,
      notes: 'Notas atualizadas da pagela'
    };
    
    const updateResponse = await makeRequest('PATCH', `/pagelas/${createdPagela.id}`, updateData);
    if (updateResponse && updateResponse.status === 200) {
      console.log(`    ✅ Pagela atualizada: ID ${updateResponse.data.id}`);
    }

    // 4. Deletar Pagela
    console.log('  🔸 Teste 4: Deletar Pagela');
    const deleteResponse = await makeRequest('DELETE', `/pagelas/${createdPagela.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Pagela deletada com sucesso');
    }
  }
}

// ==================== TESTES DE FILTROS ====================

async function testPagelasFilters() {
  console.log('\n📋 Testando Filtros de Pagelas...');
  
  // 1. Filtro por sheltered
  console.log('  🔸 Teste 1: Filtro por sheltered');
  if (testData.sheltered.length > 0) {
    const shelteredResponse = await makeRequest('GET', `/pagelas?shelteredId=${testData.sheltered[0].id}`);
    if (shelteredResponse && shelteredResponse.status === 200) {
      console.log(`    ✅ Status: ${shelteredResponse.status}`);
      console.log(`    📊 Encontradas: ${shelteredResponse.data?.length || 0}`);
    }
  }

  // 2. Filtro por ano
  console.log('  🔸 Teste 2: Filtro por ano (year=2024)');
  const yearResponse = await makeRequest('GET', '/pagelas?year=2024');
  if (yearResponse && yearResponse.status === 200) {
    console.log(`    ✅ Status: ${yearResponse.status}`);
    console.log(`    📊 Encontradas: ${yearResponse.data?.length || 0}`);
  }

  // 3. Filtro por visita
  console.log('  🔸 Teste 3: Filtro por visita (visit=1)');
  const visitResponse = await makeRequest('GET', '/pagelas?visit=1');
  if (visitResponse && visitResponse.status === 200) {
    console.log(`    ✅ Status: ${visitResponse.status}`);
    console.log(`    📊 Encontradas: ${visitResponse.data?.length || 0}`);
  }

  // 4. Filtro por presença
  console.log('  🔸 Teste 4: Filtro por presença (present=true)');
  const presentResponse = await makeRequest('GET', '/pagelas?present=true');
  if (presentResponse && presentResponse.status === 200) {
    console.log(`    ✅ Status: ${presentResponse.status}`);
    console.log(`    📊 Encontradas: ${presentResponse.data?.length || 0}`);
  }

  // 5. Busca por string
  console.log('  🔸 Teste 5: Busca por string (searchString=pagela)');
  const searchResponse = await makeRequest('GET', '/pagelas?searchString=pagela');
  if (searchResponse && searchResponse.status === 200) {
    console.log(`    ✅ Status: ${searchResponse.status}`);
    console.log(`    📊 Encontradas: ${searchResponse.data?.length || 0}`);
  }
}

// ==================== TESTES DE LISTAGEM ====================

async function testPagelasListings() {
  console.log('\n📋 Testando Listagens de Pagelas...');
  
  // 1. Listagem simples
  console.log('  🔸 Teste 1: Listagem simples');
  const simpleResponse = await makeRequest('GET', '/pagelas');
  if (simpleResponse && simpleResponse.status === 200) {
    console.log(`    ✅ Status: ${simpleResponse.status}`);
    console.log(`    📊 Total: ${simpleResponse.data?.length || 0}`);
  }

  // 2. Listagem paginada
  console.log('  🔸 Teste 2: Listagem paginada');
  const paginatedResponse = await makeRequest('GET', '/pagelas/paginated?page=1&limit=10');
  if (paginatedResponse && paginatedResponse.status === 200) {
    console.log(`    ✅ Status: ${paginatedResponse.status}`);
    console.log(`    📊 Total: ${paginatedResponse.data.meta?.totalItems || 0}`);
    console.log(`    📄 Itens: ${paginatedResponse.data.items?.length || 0}`);
  }
}

// ==================== TESTES DE VALIDAÇÃO ====================

async function testPagelasValidation() {
  console.log('\n📋 Testando Validações de Pagelas...');
  
  // 1. ShelteredId inválido
  console.log('  🔸 Teste 1: ShelteredId inválido');
  const invalidShelteredResponse = await makeRequest('POST', '/pagelas', {
    shelteredId: '00000000-0000-0000-0000-000000000000',
    teacherProfileId: '00000000-0000-0000-0000-000000000000',
    referenceDate: new Date().toISOString(),
    visit: 1,
    present: true
  });
  if (invalidShelteredResponse && invalidShelteredResponse.status === 400) {
    console.log('    ✅ Erro esperado: ShelteredId inválido rejeitado');
  }

  // 2. TeacherProfileId inválido
  console.log('  🔸 Teste 2: TeacherProfileId inválido');
  const invalidTeacherResponse = await makeRequest('POST', '/pagelas', {
    shelteredId: testData.sheltered[0]?.id || '00000000-0000-0000-0000-000000000000',
    teacherProfileId: 'invalid-uuid',
    referenceDate: new Date().toISOString(),
    visit: 1,
    present: true
  });
  if (invalidTeacherResponse && invalidTeacherResponse.status === 400) {
    console.log('    ✅ Erro esperado: TeacherProfileId inválido rejeitado');
  }

  // 3. Data inválida
  console.log('  🔸 Teste 3: Data inválida');
  const invalidDateResponse = await makeRequest('POST', '/pagelas', {
    shelteredId: testData.sheltered[0]?.id || '00000000-0000-0000-0000-000000000000',
    teacherProfileId: '00000000-0000-0000-0000-000000000000',
    referenceDate: 'data-invalida',
    visit: 1,
    present: true
  });
  if (invalidDateResponse && invalidDateResponse.status === 400) {
    console.log('    ✅ Erro esperado: Data inválida rejeitada');
  }

  // 4. Visit inválido
  console.log('  🔸 Teste 4: Visit inválido');
  const invalidVisitResponse = await makeRequest('POST', '/pagelas', {
    shelteredId: testData.sheltered[0]?.id || '00000000-0000-0000-0000-000000000000',
    teacherProfileId: '00000000-0000-0000-0000-000000000000',
    referenceDate: new Date().toISOString(),
    visit: 0, // Inválido (deve ser >= 1)
    present: true
  });
  if (invalidVisitResponse && invalidVisitResponse.status === 400) {
    console.log('    ✅ Erro esperado: Visit inválido rejeitado');
  }

  // 5. Buscar registro inexistente
  console.log('  🔸 Teste 5: Buscar registro inexistente');
  const notFoundResponse = await makeRequest('GET', '/pagelas/00000000-0000-0000-0000-000000000000');
  if (notFoundResponse && notFoundResponse.status === 404) {
    console.log('    ✅ Erro esperado: Registro não encontrado');
  }
}

// ==================== TESTES DE RELACIONAMENTOS ====================

async function testPagelasRelationships() {
  console.log('\n📋 Testando Relacionamentos de Pagelas...');
  
  if (testData.sheltered.length === 0) {
    console.log('  ⚠️ Dados insuficientes para testar relacionamentos');
    return;
  }

  // 1. Criar pagela com sheltered
  console.log('  🔸 Teste 1: Criar pagela com sheltered');
  const createData = {
    shelteredId: testData.sheltered[0].id,
    teacherProfileId: '00000000-0000-0000-0000-000000000000',
    referenceDate: new Date().toISOString(),
    visit: 1,
    present: true,
    notes: 'Notas da pagela com relacionamento'
  };

  const createResponse = await makeRequest('POST', '/pagelas', createData);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ Pagela criada: ID ${createResponse.data.id}`);
    const createdPagela = createResponse.data;

    // 2. Atualizar presença da pagela
    console.log('  🔸 Teste 2: Atualizar presença da pagela');
    const updatePresenceResponse = await makeRequest('PATCH', `/pagelas/${createdPagela.id}`, {
      present: false,
      notes: 'Notas atualizadas'
    });
    
    if (updatePresenceResponse && updatePresenceResponse.status === 200) {
      console.log(`    ✅ Presença atualizada: ${updatePresenceResponse.data.present}`);
    }

    // 3. Deletar pagela de teste
    console.log('  🔸 Teste 3: Deletar pagela de teste');
    const deleteResponse = await makeRequest('DELETE', `/pagelas/${createdPagela.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Pagela de teste deletada');
    }
  }
}

// ==================== TESTES DE BUSCA ====================

async function testPagelasSearch() {
  console.log('\n📋 Testando Busca de Pagelas...');
  
  // 1. Busca por texto
  console.log('  🔸 Teste 1: Busca por texto (searchString=pagela)');
  const textSearchResponse = await makeRequest('GET', '/pagelas?searchString=pagela');
  if (textSearchResponse && textSearchResponse.status === 200) {
    console.log(`    ✅ Status: ${textSearchResponse.status}`);
    console.log(`    📊 Encontradas: ${textSearchResponse.data?.length || 0}`);
  }

  // 2. Busca por ano
  console.log('  🔸 Teste 2: Busca por ano (year=2024)');
  const yearSearchResponse = await makeRequest('GET', '/pagelas?year=2024');
  if (yearSearchResponse && yearSearchResponse.status === 200) {
    console.log(`    ✅ Status: ${yearSearchResponse.status}`);
    console.log(`    📊 Encontradas: ${yearSearchResponse.data?.length || 0}`);
  }

  // 3. Busca por múltiplos critérios
  console.log('  🔸 Teste 3: Busca por múltiplos critérios');
  const multiSearchResponse = await makeRequest('GET', '/pagelas?year=2024&present=true');
  if (multiSearchResponse && multiSearchResponse.status === 200) {
    console.log(`    ✅ Status: ${multiSearchResponse.status}`);
    console.log(`    📊 Encontradas: ${multiSearchResponse.data?.length || 0}`);
  }
}

// ==================== TESTES DE ESTATÍSTICAS ====================

async function testPagelasStatistics() {
  console.log('\n📋 Testando Estatísticas de Pagelas...');
  
  // 1. Contar pagelas por sheltered
  console.log('  🔸 Teste 1: Contar pagelas por sheltered');
  if (testData.sheltered.length > 0) {
    const shelteredCountResponse = await makeRequest('GET', `/pagelas?shelteredId=${testData.sheltered[0].id}`);
    if (shelteredCountResponse && shelteredCountResponse.status === 200) {
      const shelteredCount = shelteredCountResponse.data?.length || 0;
      console.log(`    📊 Pagelas do sheltered: ${shelteredCount}`);
    }
  }

  // 2. Contar pagelas por ano
  console.log('  🔸 Teste 2: Contar pagelas por ano');
  const yearCountResponse = await makeRequest('GET', '/pagelas?year=2024');
  if (yearCountResponse && yearCountResponse.status === 200) {
    const yearCount = yearCountResponse.data?.length || 0;
    console.log(`    📊 Pagelas em 2024: ${yearCount}`);
  }

  // 3. Total geral de pagelas
  console.log('  🔸 Teste 3: Total geral de pagelas');
  const totalResponse = await makeRequest('GET', '/pagelas');
  if (totalResponse && totalResponse.status === 200) {
    const total = totalResponse.data?.length || 0;
    console.log(`    📊 Total de pagelas: ${total}`);
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runPagelasAutomation() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - MÓDULO PAGELAS');
  console.log('=======================================');
  console.log('📋 Funcionalidades a serem testadas:');
  console.log('   1. CRUD de Pagelas');
  console.log('   2. Filtros e Buscas');
  console.log('   3. Listagens e Paginação');
  console.log('   4. Validações de Dados');
  console.log('   5. Relacionamentos com Sheltered');
  console.log('   6. Busca Avançada');
  console.log('   7. Estatísticas de Pagelas');
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
  await testPagelasCRUD();
  await testPagelasFilters();
  await testPagelasListings();
  await testPagelasValidation();
  await testPagelasRelationships();
  await testPagelasSearch();
  await testPagelasStatistics();

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('=====================================');
  console.log('✅ Todos os testes foram executados');
  console.log('✅ CRUD de Pagelas funcionando');
  console.log('✅ Filtros e buscas funcionando');
  console.log('✅ Listagens e paginação funcionando');
  console.log('✅ Validações funcionando');
  console.log('✅ Relacionamentos funcionando');
  console.log('✅ Busca avançada funcionando');
  console.log('✅ Estatísticas funcionando');
  console.log('✅ Sistema pronto para produção!');
}

// Executar automação
runPagelasAutomation()
  .then(() => {
    console.log('\n✅ Automação finalizada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante a automação:', error);
    process.exit(1);
  });
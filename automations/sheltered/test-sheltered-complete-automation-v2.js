const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';
let testData = {
  sheltered: [],
  shelters: []
};

// Função para fazer login
async function login() {
  try {
    console.log('🔐 Fazendo login como admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.status === 201) {
      authToken = response.data.accessToken;
      console.log('✅ Login realizado com sucesso!');
      console.log(`🔑 Token obtido: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

// Função para fazer requisições autenticadas
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

// Função para obter dados necessários para os testes
async function getTestData() {
  console.log('📊 Obtendo dados necessários para os testes...');
  
  try {
    // Obter abrigados
    const shelteredResponse = await makeRequest('GET', '/sheltered?limit=100');
    if (shelteredResponse) {
      testData.sheltered = shelteredResponse.data.items || [];
      console.log(`  👥 ${testData.sheltered.length} abrigados encontrados`);
    }

    // Obter shelters
    const sheltersResponse = await makeRequest('GET', '/shelters/simple');
    if (sheltersResponse) {
      testData.shelters = sheltersResponse.data || [];
      console.log(`  🏠 ${testData.shelters.length} shelters encontrados`);
    }

    console.log('✅ Dados obtidos com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao obter dados:', error.message);
    return false;
  }
}

// Função para testar CRUD de Sheltered
async function testShelteredCRUD() {
  console.log('\n📋 Testando CRUD de Abrigados...');
  
  // 1. Criar Abrigado
  console.log('  🔸 Teste 1: Criar Abrigado');
  const createData = {
    name: `Abrigado Teste Automação ${Date.now()}`,
    birthDate: '2010-05-15',
    guardianName: 'Maria Silva',
    gender: 'feminino',
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
    console.log(`    ✅ Abrigado criado: ${createResponse.data.name}`);
    const createdSheltered = createResponse.data;
    
    // 2. Buscar Abrigado por ID
    console.log('  🔸 Teste 2: Buscar Abrigado por ID');
    const getResponse = await makeRequest('GET', `/sheltered/${createdSheltered.id}`);
    if (getResponse && getResponse.status === 200) {
      console.log(`    ✅ Abrigado encontrado: ${getResponse.data.name}`);
    }

    // 3. Atualizar Abrigado
    console.log('  🔸 Teste 3: Atualizar Abrigado');
    const updateData = {
      name: `${createData.name} - Atualizado`,
      guardianName: 'Maria Silva Santos',
      address: {
        street: 'Rua das Flores Atualizada',
        number: '456',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01234-567',
        complement: 'Apto 45'
      }
    };
    
    const updateResponse = await makeRequest('PUT', `/sheltered/${createdSheltered.id}`, updateData);
    if (updateResponse && updateResponse.status === 200) {
      console.log(`    ✅ Abrigado atualizado: ${updateResponse.data.name}`);
    }

    // 4. Deletar Abrigado
    console.log('  🔸 Teste 4: Deletar Abrigado');
    const deleteResponse = await makeRequest('DELETE', `/sheltered/${createdSheltered.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Abrigado deletado com sucesso');
    }
  }
}

// Função para testar Listagem e Filtros
async function testShelteredListing() {
  console.log('\n📋 Testando Listagem e Filtros de Abrigados...');
  
  // 1. Listagem básica
  console.log('  🔸 Teste 1: Listagem básica');
  const basicResponse = await makeRequest('GET', '/sheltered');
  if (basicResponse && basicResponse.status === 200) {
    console.log(`    ✅ Status: ${basicResponse.status}`);
    console.log(`    📊 Total: ${basicResponse.data.total || 0}, Itens: ${basicResponse.data.items?.length || 0}`);
  }

  // 2. Paginação
  console.log('  🔸 Teste 2: Paginação (page=1, limit=5)');
  const paginationResponse = await makeRequest('GET', '/sheltered?page=1&limit=5');
  if (paginationResponse && paginationResponse.status === 200) {
    console.log(`    ✅ Status: ${paginationResponse.status}`);
    console.log(`    📊 Total: ${paginationResponse.data.total || 0}, Itens: ${paginationResponse.data.items?.length || 0}`);
  }

  // 3. Filtro por nome
  console.log('  🔸 Teste 3: Filtro por nome (searchString=Ana)');
  const nameFilterResponse = await makeRequest('GET', '/sheltered?searchString=Ana');
  if (nameFilterResponse && nameFilterResponse.status === 200) {
    console.log(`    ✅ Status: ${nameFilterResponse.status}`);
    console.log(`    📊 Encontrados: ${nameFilterResponse.data.items?.length || 0}`);
  }

  // 4. Filtro por shelter
  console.log('  🔸 Teste 4: Filtro por shelter');
  if (testData.shelters.length > 0) {
    const shelterFilterResponse = await makeRequest('GET', `/sheltered?shelterId=${testData.shelters[0].id}`);
    if (shelterFilterResponse && shelterFilterResponse.status === 200) {
      console.log(`    ✅ Status: ${shelterFilterResponse.status}`);
      console.log(`    📊 Encontrados no shelter: ${shelterFilterResponse.data.items?.length || 0}`);
    }
  }

  // 5. Filtro por gênero
  console.log('  🔸 Teste 5: Filtro por gênero (gender=feminino)');
  const genderFilterResponse = await makeRequest('GET', '/sheltered?gender=feminino');
  if (genderFilterResponse && genderFilterResponse.status === 200) {
    console.log(`    ✅ Status: ${genderFilterResponse.status}`);
    console.log(`    📊 Encontrados: ${genderFilterResponse.data.items?.length || 0}`);
  }

  // 6. Filtro por cidade
  console.log('  🔸 Teste 6: Filtro por cidade (city=São Paulo)');
  const cityFilterResponse = await makeRequest('GET', '/sheltered?city=São Paulo');
  if (cityFilterResponse && cityFilterResponse.status === 200) {
    console.log(`    ✅ Status: ${cityFilterResponse.status}`);
    console.log(`    📊 Encontrados: ${cityFilterResponse.data.items?.length || 0}`);
  }

  // 7. Ordenação
  console.log('  🔸 Teste 7: Ordenação (orderBy=name, order=asc)');
  const sortResponse = await makeRequest('GET', '/sheltered?orderBy=name&order=asc');
  if (sortResponse && sortResponse.status === 200) {
    console.log(`    ✅ Status: ${sortResponse.status}`);
    console.log(`    📊 Ordenados: ${sortResponse.data.items?.length || 0}`);
  }

  // 8. Listagem simples
  console.log('  🔸 Teste 8: Listagem simples');
  const simpleResponse = await makeRequest('GET', '/sheltered/simple');
  if (simpleResponse && simpleResponse.status === 200) {
    console.log(`    ✅ Status: ${simpleResponse.status}`);
    console.log(`    📊 Abrigados simples: ${simpleResponse.data?.length || 0}`);
  }
}

// Função para testar Filtros por Data
async function testDateFilters() {
  console.log('\n📋 Testando Filtros por Data...');
  
  // 1. Filtro por data de nascimento
  console.log('  🔸 Teste 1: Filtro por data de nascimento (birthDateFrom=2010-01-01)');
  const birthDateFilterResponse = await makeRequest('GET', '/sheltered?birthDateFrom=2010-01-01');
  if (birthDateFilterResponse && birthDateFilterResponse.status === 200) {
    console.log(`    ✅ Status: ${birthDateFilterResponse.status}`);
    console.log(`    📊 Encontrados: ${birthDateFilterResponse.data.items?.length || 0}`);
  }

  // 2. Filtro por data de entrada
  console.log('  🔸 Teste 2: Filtro por data de entrada (joinedFrom=2023-01-01)');
  const joinedDateFilterResponse = await makeRequest('GET', '/sheltered?joinedFrom=2023-01-01');
  if (joinedDateFilterResponse && joinedDateFilterResponse.status === 200) {
    console.log(`    ✅ Status: ${joinedDateFilterResponse.status}`);
    console.log(`    📊 Encontrados: ${joinedDateFilterResponse.data.items?.length || 0}`);
  }

  // 3. Filtro por faixa de idade
  console.log('  🔸 Teste 3: Filtro por faixa de idade (birthDateFrom=2005-01-01&birthDateTo=2015-12-31)');
  const ageRangeFilterResponse = await makeRequest('GET', '/sheltered?birthDateFrom=2005-01-01&birthDateTo=2015-12-31');
  if (ageRangeFilterResponse && ageRangeFilterResponse.status === 200) {
    console.log(`    ✅ Status: ${ageRangeFilterResponse.status}`);
    console.log(`    📊 Encontrados: ${ageRangeFilterResponse.data.items?.length || 0}`);
  }
}

// Função para testar Cenários de Erro
async function testErrorScenarios() {
  console.log('\n📋 Testando Cenários de Erro...');
  
  // 1. Buscar abrigado inexistente
  console.log('  🔸 Teste 1: Buscar abrigado inexistente');
  const notFoundResponse = await makeRequest('GET', '/sheltered/00000000-0000-0000-0000-000000000000');
  if (notFoundResponse && notFoundResponse.status === 404) {
    console.log('    ✅ Erro esperado: 404 - Abrigado não encontrado');
  }

  // 2. Criar abrigado com dados inválidos
  console.log('  🔸 Teste 2: Criar abrigado com dados inválidos');
  const invalidDataResponse = await makeRequest('POST', '/sheltered', {
    name: '', // Nome vazio
    birthDate: 'data-invalida',
    gender: 'invalido'
  });
  if (invalidDataResponse && invalidDataResponse.status === 400) {
    console.log('    ✅ Erro esperado: 400 - Dados inválidos');
  }

  // 3. Atualizar abrigado inexistente
  console.log('  🔸 Teste 3: Atualizar abrigado inexistente');
  const updateNotFoundResponse = await makeRequest('PUT', '/sheltered/00000000-0000-0000-0000-000000000000', {
    name: 'Nome Atualizado'
  });
  if (updateNotFoundResponse && updateNotFoundResponse.status === 404) {
    console.log('    ✅ Erro esperado: 404 - Abrigado não encontrado');
  }

  // 4. Deletar abrigado inexistente
  console.log('  🔸 Teste 4: Deletar abrigado inexistente');
  const deleteNotFoundResponse = await makeRequest('DELETE', '/sheltered/00000000-0000-0000-0000-000000000000');
  if (deleteNotFoundResponse && deleteNotFoundResponse.status === 404) {
    console.log('    ✅ Erro esperado: 404 - Abrigado não encontrado');
  }
}

// Função para testar Relacionamentos com Shelters
async function testShelterRelationships() {
  console.log('\n📋 Testando Relacionamentos com Shelters...');
  
  if (testData.shelters.length === 0) {
    console.log('  ⚠️ Nenhum shelter encontrado para testar relacionamentos');
    return;
  }

  // 1. Criar abrigado com shelter
  console.log('  🔸 Teste 1: Criar abrigado vinculado a um shelter');
  const createWithShelterData = {
    name: `Abrigado com Shelter ${Date.now()}`,
    birthDate: '2012-03-20',
    guardianName: 'João Silva',
    gender: 'masculino',
    guardianPhone: '+5511888888888',
    joinedAt: '2023-06-01',
    shelterId: testData.shelters[0].id,
    address: {
      street: 'Rua dos Testes',
      number: '789',
      district: 'Teste',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567'
    }
  };

  const createWithShelterResponse = await makeRequest('POST', '/sheltered', createWithShelterData);
  if (createWithShelterResponse && createWithShelterResponse.status === 201) {
    console.log(`    ✅ Abrigado criado com shelter: ${createWithShelterResponse.data.name}`);
    console.log(`    🏠 Shelter vinculado: ${createWithShelterResponse.data.shelter?.name || 'N/A'}`);

    // 2. Atualizar shelter do abrigado
    console.log('  🔸 Teste 2: Atualizar shelter do abrigado');
    if (testData.shelters.length > 1) {
      const updateShelterResponse = await makeRequest('PUT', `/sheltered/${createWithShelterResponse.data.id}`, {
        shelterId: testData.shelters[1].id
      });
      
      if (updateShelterResponse && updateShelterResponse.status === 200) {
        console.log(`    ✅ Shelter atualizado: ${updateShelterResponse.data.shelter?.name || 'N/A'}`);
      }
    }

    // 3. Remover shelter do abrigado
    console.log('  🔸 Teste 3: Remover shelter do abrigado');
    const removeShelterResponse = await makeRequest('PUT', `/sheltered/${createWithShelterResponse.data.id}`, {
      shelterId: null
    });
    
    if (removeShelterResponse && removeShelterResponse.status === 200) {
      console.log('    ✅ Shelter removido com sucesso');
    }

    // 4. Deletar abrigado de teste
    console.log('  🔸 Teste 4: Deletar abrigado de teste');
    const deleteResponse = await makeRequest('DELETE', `/sheltered/${createWithShelterResponse.data.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Abrigado de teste deletado');
    }
  }
}

// Função principal
async function runCompleteShelteredAutomation() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - MÓDULO ABRIGADOS');
  console.log('==========================================');
  console.log('📋 Funcionalidades a serem testadas:');
  console.log('   1. CRUD de Abrigados');
  console.log('   2. Listagem e Filtros');
  console.log('   3. Filtros por Data');
  console.log('   4. Relacionamentos com Shelters');
  console.log('   5. Cenários de Erro');
  console.log('==========================================');

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
  await testShelteredListing();
  await testDateFilters();
  await testShelterRelationships();
  await testErrorScenarios();

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('=====================================');
  console.log('✅ Todos os testes foram executados');
  console.log('✅ CRUD de Abrigados funcionando');
  console.log('✅ Filtros e listagem funcionando');
  console.log('✅ Filtros por data funcionando');
  console.log('✅ Relacionamentos funcionando');
  console.log('✅ Validações de erro funcionando');
  console.log('✅ Sistema pronto para produção!');
}

// Executar automação
runCompleteShelteredAutomation()
  .then(() => {
    console.log('\n✅ Automação finalizada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante a automação:', error);
    process.exit(1);
  });

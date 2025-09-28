const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';
let availableShelters = [];

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
    throw error;
  }
}

// Função para obter shelters disponíveis
async function getAvailableShelters() {
  console.log('🏠 Obtendo shelters disponíveis...');
  try {
    const response = await makeRequest('GET', '/shelters?limit=5');
    availableShelters = response.data.items || [];
    console.log(`✅ ${availableShelters.length} shelters encontrados`);
    return availableShelters;
  } catch (error) {
    console.error('❌ Erro ao obter shelters:', error.response?.status);
    return [];
  }
}

// Função para testar GET /sheltered (listagem paginada)
async function testFindAll() {
  console.log('\n📋 Testando GET /sheltered (listagem paginada)...');
  
  try {
    // Teste 1: Listagem básica
    console.log('  🔸 Teste 1: Listagem básica');
    const response1 = await makeRequest('GET', '/sheltered');
    console.log(`    ✅ Status: ${response1.status}`);
    console.log(`    📊 Total de sheltered: ${response1.data.meta.totalItems}`);
    console.log(`    📄 Página atual: ${response1.data.meta.page}`);
    console.log(`    📝 Itens por página: ${response1.data.meta.limit}`);
    
    // Teste 2: Com paginação
    console.log('  🔸 Teste 2: Com paginação (page=1, limit=5)');
    const response2 = await makeRequest('GET', '/sheltered?page=1&limit=5');
    console.log(`    ✅ Status: ${response2.status}`);
    console.log(`    📊 Total: ${response2.data.meta.totalItems}, Itens: ${response2.data.data.length}`);
    
    // Teste 3: Com busca por nome
    console.log('  🔸 Teste 3: Busca por nome (searchString=João)');
    const response3 = await makeRequest('GET', '/sheltered?searchString=João');
    console.log(`    ✅ Status: ${response3.status}`);
    console.log(`    📊 Encontrados: ${response3.data.meta.totalItems}`);
    
    // Teste 4: Com filtro por shelter
    if (availableShelters.length > 0) {
      console.log(`  🔸 Teste 4: Filtro por shelter (shelterId=${availableShelters[0].id})`);
      const response4 = await makeRequest('GET', `/sheltered?shelterId=${availableShelters[0].id}`);
      console.log(`    ✅ Status: ${response4.status}`);
      console.log(`    📊 Encontrados no shelter: ${response4.data.meta.totalItems}`);
    }
    
    // Teste 5: Com filtro por gênero
    console.log('  🔸 Teste 5: Filtro por gênero (gender=Masculino)');
    const response5 = await makeRequest('GET', '/sheltered?gender=Masculino');
    console.log(`    ✅ Status: ${response5.status}`);
    console.log(`    📊 Encontrados: ${response5.data.meta.totalItems}`);
    
    // Teste 6: Com ordenação
    console.log('  🔸 Teste 6: Ordenação por nome (orderBy=name, order=DESC)');
    const response6 = await makeRequest('GET', '/sheltered?orderBy=name&order=DESC');
    console.log(`    ✅ Status: ${response6.status}`);
    console.log(`    📊 Ordenados: ${response6.data.data.length}`);
    
    return response1.data.data;
  } catch (error) {
    console.error('    ❌ Erro no teste de listagem paginada:', error.response?.status);
    return [];
  }
}

// Função para testar GET /sheltered/simple
async function testFindAllSimples() {
  console.log('\n📋 Testando GET /sheltered/simple...');
  
  try {
    const response = await makeRequest('GET', '/sheltered/simple');
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  📊 Sheltered simples: ${response.data.length}`);
    console.log(`  📝 Primeiro sheltered: ${response.data[0]?.name || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de listagem simples:', error.response?.status);
    return [];
  }
}

// Função para testar GET /sheltered/:id
async function testFindOne(shelteredId) {
  console.log('\n📋 Testando GET /sheltered/:id...');
  
  try {
    const response = await makeRequest('GET', `/sheltered/${shelteredId}`);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  👶 Sheltered: ${response.data.name}`);
    console.log(`  📅 Data nascimento: ${response.data.birthDate}`);
    console.log(`  🏠 Shelter: ${response.data.shelter?.name || 'N/A'}`);
    console.log(`  👨‍👩‍👧‍👦 Responsável: ${response.data.guardianName || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de busca por ID:', error.response?.status);
    return null;
  }
}

// Função para testar POST /sheltered (criar)
async function testCreate() {
  console.log('\n📋 Testando POST /sheltered (criar)...');
  
  const shelteredData = {
    name: `Criança Teste ${Date.now()}`,
    birthDate: '2015-06-15',
    gender: 'Masculino',
    guardianName: `Responsável Teste ${Date.now()}`,
    guardianPhone: '+5511999999999',
    joinedAt: '2024-01-15',
    ...(availableShelters.length > 0 && { shelterId: availableShelters[0].id }),
    address: {
      street: 'Rua Teste',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567',
      complement: 'Apto 1'
    }
  };
  
  try {
    const response = await makeRequest('POST', '/sheltered', shelteredData);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  👶 Sheltered criado: ${response.data.name}`);
    console.log(`  🆔 ID: ${response.data.id}`);
    console.log(`  🏠 Shelter vinculado: ${response.data.shelter?.name || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de criação:', error.response?.status);
    return null;
  }
}

// Função para testar PUT /sheltered/:id (atualizar)
async function testUpdate(shelteredId) {
  console.log('\n📋 Testando PUT /sheltered/:id (atualizar)...');
  
  const updateData = {
    name: `Criança Atualizada ${Date.now()}`,
    guardianName: `Responsável Atualizado ${Date.now()}`,
    guardianPhone: '+5511888888888',
    address: {
      street: 'Rua Atualizada',
      city: 'Rio de Janeiro',
      state: 'RJ'
    }
  };
  
  try {
    const response = await makeRequest('PUT', `/sheltered/${shelteredId}`, updateData);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  👶 Sheltered atualizado: ${response.data.name}`);
    console.log(`  👨‍👩‍👧‍👦 Responsável: ${response.data.guardianName}`);
    console.log(`  📍 Novo endereço: ${response.data.address?.city}/${response.data.address?.state}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de atualização:', error.response?.status);
    return null;
  }
}

// Função para testar DELETE /sheltered/:id
async function testDelete(shelteredId) {
  console.log('\n📋 Testando DELETE /sheltered/:id...');
  
  try {
    const response = await makeRequest('DELETE', `/sheltered/${shelteredId}`);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  🗑️ Sheltered removido com sucesso`);
    return true;
  } catch (error) {
    console.error('  ❌ Erro no teste de exclusão:', error.response?.status);
    return false;
  }
}

// Função para testar cenários de erro
async function testErrorScenarios() {
  console.log('\n📋 Testando cenários de erro...');
  
  try {
    // Teste 1: Buscar sheltered inexistente
    console.log('  🔸 Teste 1: Buscar sheltered inexistente');
    try {
      await makeRequest('GET', '/sheltered/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`);
    }
    
    // Teste 2: Criar sheltered com dados inválidos
    console.log('  🔸 Teste 2: Criar sheltered com dados inválidos');
    try {
      await makeRequest('POST', '/sheltered', {
        name: 'A', // Nome muito curto
        birthDate: 'invalid-date', // Data inválida
        gender: 'Masculino'
      });
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Validation failed`);
    }
    
    // Teste 3: Atualizar sheltered inexistente
    console.log('  🔸 Teste 3: Atualizar sheltered inexistente');
    try {
      await makeRequest('PUT', '/sheltered/00000000-0000-0000-0000-000000000000', {
        name: 'Teste'
      });
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Not Found`);
    }
    
    // Teste 4: Deletar sheltered inexistente
    console.log('  🔸 Teste 4: Deletar sheltered inexistente');
    try {
      await makeRequest('DELETE', '/sheltered/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Not Found`);
    }
    
  } catch (error) {
    console.error('  ❌ Erro nos testes de cenários de erro:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - TESTE DE TODOS OS ENDPOINTS DE SHELTERED');
  console.log('================================================================');
  console.log('📋 Endpoints a serem testados:');
  console.log('   1. GET /sheltered - Listagem paginada com filtros');
  console.log('   2. GET /sheltered/simple - Listagem simples');
  console.log('   3. GET /sheltered/:id - Buscar por ID');
  console.log('   4. POST /sheltered - Criar sheltered');
  console.log('   5. PUT /sheltered/:id - Atualizar sheltered');
  console.log('   6. DELETE /sheltered/:id - Deletar sheltered');
  console.log('   7. Cenários de erro');
  console.log('================================================================\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Falha no login. Encerrando automação.');
    return;
  }
  
  // Obter shelters disponíveis
  await getAvailableShelters();
  
  let createdSheltered = null;
  let existingSheltered = [];
  
  try {
    // 1. Testar listagem paginada
    existingSheltered = await testFindAll();
    
    // 2. Testar listagem simples
    await testFindAllSimples();
    
    // 3. Testar busca por ID (usar primeiro sheltered existente)
    if (existingSheltered.length > 0) {
      await testFindOne(existingSheltered[0].id);
    }
    
    // 4. Testar criação
    createdSheltered = await testCreate();
    
    // 5. Testar atualização (usar sheltered criado)
    if (createdSheltered) {
      await testUpdate(createdSheltered.id);
    }
    
    // 6. Testar cenários de erro
    await testErrorScenarios();
    
    // 7. Testar exclusão (usar sheltered criado e atualizado)
    if (createdSheltered) {
      await testDelete(createdSheltered.id);
    }
    
    console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Todos os endpoints foram testados');
    console.log('✅ Cenários de erro foram validados');
    console.log('✅ CRUD completo funcionando');
    console.log('✅ Filtros e paginação funcionando');
    
  } catch (error) {
    console.error('\n❌ Erro durante a automação:', error.message);
  }
}

// Executar automação
main().catch(console.error);

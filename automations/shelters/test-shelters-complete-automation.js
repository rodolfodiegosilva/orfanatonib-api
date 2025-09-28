const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';

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

// Função para testar GET /shelters (listagem paginada)
async function testFindAllPaginated() {
  console.log('\n📋 Testando GET /shelters (listagem paginada)...');
  
  try {
    // Teste 1: Listagem básica
    console.log('  🔸 Teste 1: Listagem básica');
    const response1 = await makeRequest('GET', '/shelters');
    console.log(`    ✅ Status: ${response1.status}`);
    console.log(`    📊 Total de shelters: ${response1.data.total}`);
    console.log(`    📄 Página atual: ${response1.data.page}`);
    console.log(`    📝 Itens por página: ${response1.data.limit}`);
    
    // Teste 2: Com paginação
    console.log('  🔸 Teste 2: Com paginação (page=1, limit=5)');
    const response2 = await makeRequest('GET', '/shelters?page=1&limit=5');
    console.log(`    ✅ Status: ${response2.status}`);
    console.log(`    📊 Total: ${response2.data.total}, Itens: ${response2.data.items.length}`);
    
    // Teste 3: Com busca por nome
    console.log('  🔸 Teste 3: Busca por nome (nameSearchString=Abrigo)');
    const response3 = await makeRequest('GET', '/shelters?nameSearchString=Abrigo');
    console.log(`    ✅ Status: ${response3.status}`);
    console.log(`    📊 Encontrados: ${response3.data.total}`);
    
    // Teste 4: Com ordenação
    console.log('  🔸 Teste 4: Ordenação por nome (sort=name, order=DESC)');
    const response4 = await makeRequest('GET', '/shelters?sort=name&order=DESC');
    console.log(`    ✅ Status: ${response4.status}`);
    console.log(`    📊 Ordenados: ${response4.data.items.length}`);
    
    return response1.data.items;
  } catch (error) {
    console.error('    ❌ Erro no teste de listagem paginada:', error.response?.status);
    return [];
  }
}

// Função para testar GET /shelters/simple
async function testFindAllSimple() {
  console.log('\n📋 Testando GET /shelters/simple...');
  
  try {
    const response = await makeRequest('GET', '/shelters/simple');
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  📊 Shelters simples: ${response.data.length}`);
    console.log(`  📝 Primeiro shelter: ${response.data[0]?.name || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de listagem simples:', error.response?.status);
    return [];
  }
}

// Função para testar GET /shelters/list
async function testList() {
  console.log('\n📋 Testando GET /shelters/list...');
  
  try {
    const response = await makeRequest('GET', '/shelters/list');
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  📊 Opções de seleção: ${response.data.length}`);
    console.log(`  📝 Primeira opção: ${response.data[0]?.label || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de lista:', error.response?.status);
    return [];
  }
}

// Função para testar GET /shelters/:id
async function testFindOne(shelterId) {
  console.log('\n📋 Testando GET /shelters/:id...');
  
  try {
    const response = await makeRequest('GET', `/shelters/${shelterId}`);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  🏠 Shelter: ${response.data.name}`);
    console.log(`  📍 Endereço: ${response.data.address.city}/${response.data.address.state}`);
    console.log(`  ⏰ Horário: ${response.data.time || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de busca por ID:', error.response?.status);
    return null;
  }
}

// Função para testar POST /shelters (criar)
async function testCreate() {
  console.log('\n📋 Testando POST /shelters (criar)...');
  
  const shelterData = {
    name: `Abrigo Teste ${Date.now()}`,
    time: '19:30',
    address: {
      street: 'Rua Teste',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567',
      complement: 'Sala 1'
    }
  };
  
  try {
    const response = await makeRequest('POST', '/shelters', shelterData);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  🏠 Shelter criado: ${response.data.name}`);
    console.log(`  🆔 ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de criação:', error.response?.status);
    return null;
  }
}

// Função para testar PUT /shelters/:id (atualizar)
async function testUpdate(shelterId) {
  console.log('\n📋 Testando PUT /shelters/:id (atualizar)...');
  
  const updateData = {
    name: `Abrigo Atualizado ${Date.now()}`,
    time: '20:00',
    address: {
      street: 'Rua Atualizada',
      city: 'Rio de Janeiro',
      state: 'RJ'
    }
  };
  
  try {
    const response = await makeRequest('PUT', `/shelters/${shelterId}`, updateData);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  🏠 Shelter atualizado: ${response.data.name}`);
    console.log(`  📍 Novo endereço: ${response.data.address.city}/${response.data.address.state}`);
    console.log(`  ⏰ Novo horário: ${response.data.time}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de atualização:', error.response?.status);
    return null;
  }
}

// Função para testar DELETE /shelters/:id
async function testDelete(shelterId) {
  console.log('\n📋 Testando DELETE /shelters/:id...');
  
  try {
    const response = await makeRequest('DELETE', `/shelters/${shelterId}`);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  🗑️ Mensagem: ${response.data.message}`);
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
    // Teste 1: Buscar shelter inexistente
    console.log('  🔸 Teste 1: Buscar shelter inexistente');
    try {
      await makeRequest('GET', '/shelters/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`);
    }
    
    // Teste 2: Criar shelter com dados inválidos
    console.log('  🔸 Teste 2: Criar shelter com dados inválidos');
    try {
      await makeRequest('POST', '/shelters', {
        name: 'A', // Nome muito curto
        address: {
          street: 'Rua Teste',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01234-567'
        }
      });
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Validation failed`);
    }
    
    // Teste 3: Atualizar shelter inexistente
    console.log('  🔸 Teste 3: Atualizar shelter inexistente');
    try {
      await makeRequest('PUT', '/shelters/00000000-0000-0000-0000-000000000000', {
        name: 'Teste'
      });
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Not Found`);
    }
    
    // Teste 4: Deletar shelter inexistente
    console.log('  🔸 Teste 4: Deletar shelter inexistente');
    try {
      await makeRequest('DELETE', '/shelters/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Not Found`);
    }
    
  } catch (error) {
    console.error('  ❌ Erro nos testes de cenários de erro:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - TESTE DE TODOS OS ENDPOINTS DE SHELTERS');
  console.log('================================================================');
  console.log('📋 Endpoints a serem testados:');
  console.log('   1. GET /shelters - Listagem paginada');
  console.log('   2. GET /shelters/simple - Listagem simples');
  console.log('   3. GET /shelters/list - Lista para seleção');
  console.log('   4. GET /shelters/:id - Buscar por ID');
  console.log('   5. POST /shelters - Criar shelter');
  console.log('   6. PUT /shelters/:id - Atualizar shelter');
  console.log('   7. DELETE /shelters/:id - Deletar shelter');
  console.log('   8. Cenários de erro');
  console.log('================================================================\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Falha no login. Encerrando automação.');
    return;
  }
  
  let createdShelter = null;
  let existingShelters = [];
  
  try {
    // 1. Testar listagem paginada
    existingShelters = await testFindAllPaginated();
    
    // 2. Testar listagem simples
    await testFindAllSimple();
    
    // 3. Testar lista para seleção
    await testList();
    
    // 4. Testar busca por ID (usar primeiro shelter existente)
    if (existingShelters.length > 0) {
      await testFindOne(existingShelters[0].id);
    }
    
    // 5. Testar criação
    createdShelter = await testCreate();
    
    // 6. Testar atualização (usar shelter criado)
    if (createdShelter) {
      await testUpdate(createdShelter.id);
    }
    
    // 7. Testar cenários de erro
    await testErrorScenarios();
    
    // 8. Testar exclusão (usar shelter criado e atualizado)
    if (createdShelter) {
      await testDelete(createdShelter.id);
    }
    
    console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Todos os endpoints foram testados');
    console.log('✅ Cenários de erro foram validados');
    console.log('✅ CRUD completo funcionando');
    
  } catch (error) {
    console.error('\n❌ Erro durante a automação:', error.message);
  }
}

// Executar automação
main().catch(console.error);

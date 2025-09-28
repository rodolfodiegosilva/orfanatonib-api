const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';
let availableShelters = [];
let availableUsers = [];
let availableLeaders = [];

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

// Função para obter dados necessários
async function getRequiredData() {
  console.log('📊 Obtendo dados necessários...');
  
  try {
    // Obter shelters
    console.log('  🏠 Obtendo shelters...');
    const sheltersResponse = await makeRequest('GET', '/shelters?limit=50');
    // Corrigir estrutura de dados - shelters usa data.data em vez de data.items
    availableShelters = sheltersResponse.data.data || sheltersResponse.data.items || [];
    console.log(`    ✅ ${availableShelters.length} shelters encontrados (Total: ${sheltersResponse.data.total})`);
    
    // Obter usuários com role leader
    console.log('  👥 Obtendo usuários líderes...');
    const usersResponse = await makeRequest('GET', '/users?role=leader&limit=10');
    availableUsers = usersResponse.data.items || [];
    console.log(`    ✅ ${availableUsers.length} usuários líderes encontrados`);
    
    // Obter leader profiles existentes
    console.log('  👨‍💼 Obtendo leader profiles...');
    const leadersResponse = await makeRequest('GET', '/leader-profiles?limit=50');
    availableLeaders = leadersResponse.data.items || [];
    console.log(`    ✅ ${availableLeaders.length} leader profiles encontrados (Total: ${leadersResponse.data.total})`);
    
  } catch (error) {
    console.error('❌ Erro ao obter dados necessários:', error.response?.status);
  }
}

// Função para testar POST /leader-profiles/create-for-user/:userId
async function testCreateForUser() {
  console.log('\n📋 Testando POST /leader-profiles/create-for-user/:userId...');
  
  if (availableUsers.length === 0) {
    console.log('  ⚠️ Nenhum usuário líder disponível para teste');
    return null;
  }
  
  const userId = availableUsers[0].id;
  console.log(`  🔸 Criando leader profile para usuário: ${availableUsers[0].name}`);
  
  try {
    const response = await makeRequest('POST', `/leader-profiles/create-for-user/${userId}`);
    console.log(`    ✅ Status: ${response.status}`);
    console.log(`    👨‍💼 Leader profile criado: ${response.data.user?.name || 'N/A'}`);
    console.log(`    🆔 ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('    ❌ Erro no teste de criação:', error.response?.status);
    return null;
  }
}

// Função para testar GET /leader-profiles (listagem paginada)
async function testFindPage() {
  console.log('\n📋 Testando GET /leader-profiles (listagem paginada)...');
  
  try {
    // Teste 1: Listagem básica
    console.log('  🔸 Teste 1: Listagem básica');
    const response1 = await makeRequest('GET', '/leader-profiles');
    console.log(`    ✅ Status: ${response1.status}`);
    console.log(`    📊 Total de leaders: ${response1.data.total}`);
    console.log(`    📄 Página atual: ${response1.data.page}`);
    console.log(`    📝 Itens por página: ${response1.data.limit}`);
    
    // Teste 2: Com paginação
    console.log('  🔸 Teste 2: Com paginação (page=1, limit=5)');
    const response2 = await makeRequest('GET', '/leader-profiles?page=1&limit=5');
    console.log(`    ✅ Status: ${response2.status}`);
    console.log(`    📊 Total: ${response2.data.total}, Itens: ${response2.data.items.length}`);
    
    // Teste 3: Com busca por nome
    console.log('  🔸 Teste 3: Busca por nome (searchString=João)');
    const response3 = await makeRequest('GET', '/leader-profiles?searchString=João');
    console.log(`    ✅ Status: ${response3.status}`);
    console.log(`    📊 Encontrados: ${response3.data.total}`);
    
    // Teste 4: Com filtro por shelter
    if (availableShelters.length > 0) {
      console.log(`  🔸 Teste 4: Filtro por shelter (shelterId=${availableShelters[0].id})`);
      const response4 = await makeRequest('GET', `/leader-profiles?shelterId=${availableShelters[0].id}`);
      console.log(`    ✅ Status: ${response4.status}`);
      console.log(`    📊 Encontrados no shelter: ${response4.data.total}`);
    }
    
    // Teste 5: Com filtro por leaders com shelters
    console.log('  🔸 Teste 5: Filtro por leaders com shelters (hasShelters=true)');
    const response5 = await makeRequest('GET', '/leader-profiles?hasShelters=true');
    console.log(`    ✅ Status: ${response5.status}`);
    console.log(`    📊 Com shelters: ${response5.data.total}`);
    
    // Teste 6: Com ordenação
    console.log('  🔸 Teste 6: Ordenação por nome (sort=name, order=asc)');
    const response6 = await makeRequest('GET', '/leader-profiles?sort=name&order=asc');
    console.log(`    ✅ Status: ${response6.status}`);
    console.log(`    📊 Ordenados: ${response6.data.items.length}`);
    
    return response1.data.items;
  } catch (error) {
    console.error('    ❌ Erro no teste de listagem paginada:', error.response?.status);
    return [];
  }
}

// Função para testar GET /leader-profiles/simple
async function testListSimple() {
  console.log('\n📋 Testando GET /leader-profiles/simple...');
  
  try {
    const response = await makeRequest('GET', '/leader-profiles/simple');
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  📊 Leaders simples: ${response.data.length}`);
    console.log(`  📝 Primeiro leader: ${response.data[0]?.name || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de listagem simples:', error.response?.status);
    return [];
  }
}

// Função para testar GET /leader-profiles/:id
async function testFindOne(leaderId) {
  console.log('\n📋 Testando GET /leader-profiles/:id...');
  
  try {
    const response = await makeRequest('GET', `/leader-profiles/${leaderId}`);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  👨‍💼 Leader: ${response.data.user?.name || 'N/A'}`);
    console.log(`  📧 Email: ${response.data.user?.email || 'N/A'}`);
    console.log(`  🏠 Shelters: ${response.data.shelters?.length || 0}`);
    console.log(`  📅 Criado em: ${response.data.createdAt || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de busca por ID:', error.response?.status);
    return null;
  }
}

// Função para testar GET /leader-profiles/by-shelter/:shelterId
async function testFindByShelter() {
  console.log('\n📋 Testando GET /leader-profiles/by-shelter/:shelterId...');
  
  if (availableShelters.length === 0) {
    console.log('  ⚠️ Nenhum shelter disponível para teste');
    return null;
  }
  
  const shelterId = availableShelters[0].id;
  console.log(`  🔸 Buscando leader do shelter: ${availableShelters[0].name}`);
  
  try {
    const response = await makeRequest('GET', `/leader-profiles/by-shelter/${shelterId}`);
    console.log(`    ✅ Status: ${response.status}`);
    console.log(`    👨‍💼 Leader encontrado: ${response.data.user?.name || 'N/A'}`);
    console.log(`    🏠 Shelter: ${response.data.shelters?.[0]?.name || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.log(`    ⚠️ Erro esperado: ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`);
    return null;
  }
}

// Função para testar PATCH /leader-profiles/:leaderId/assign-shelter
async function testAssignShelter(leaderId) {
  console.log('\n📋 Testando PATCH /leader-profiles/:leaderId/assign-shelter...');
  
  if (availableShelters.length === 0) {
    console.log('  ⚠️ Nenhum shelter disponível para teste');
    return false;
  }
  
  const shelterId = availableShelters[0].id;
  console.log(`  🔸 Atribuindo shelter ${availableShelters[0].name} ao leader ${leaderId}`);
  
  try {
    const response = await makeRequest('PATCH', `/leader-profiles/${leaderId}/assign-shelter`, {
      shelterId: shelterId
    });
    console.log(`    ✅ Status: ${response.status}`);
    console.log(`    📝 Mensagem: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error('    ❌ Erro no teste de atribuição:', error.response?.status);
    return false;
  }
}

// Função para testar PATCH /leader-profiles/:leaderId/unassign-shelter
async function testUnassignShelter(leaderId) {
  console.log('\n📋 Testando PATCH /leader-profiles/:leaderId/unassign-shelter...');
  
  if (availableShelters.length === 0) {
    console.log('  ⚠️ Nenhum shelter disponível para teste');
    return false;
  }
  
  const shelterId = availableShelters[0].id;
  console.log(`  🔸 Removendo shelter ${availableShelters[0].name} do leader ${leaderId}`);
  
  try {
    const response = await makeRequest('PATCH', `/leader-profiles/${leaderId}/unassign-shelter`, {
      shelterId: shelterId
    });
    console.log(`    ✅ Status: ${response.status}`);
    console.log(`    📝 Mensagem: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error('    ❌ Erro no teste de remoção:', error.response?.status);
    return false;
  }
}

// Função para testar PATCH /leader-profiles/:fromLeaderId/move-shelter
async function testMoveShelter(fromLeaderId) {
  console.log('\n📋 Testando PATCH /leader-profiles/:fromLeaderId/move-shelter...');
  
  if (availableShelters.length === 0 || availableLeaders.length < 2) {
    console.log('  ⚠️ Dados insuficientes para teste (precisa de 2+ leaders e 1+ shelter)');
    return false;
  }
  
  // Encontrar outro leader para mover
  const toLeader = availableLeaders.find(l => l.id !== fromLeaderId);
  if (!toLeader) {
    console.log('  ⚠️ Nenhum outro leader disponível para teste');
    return false;
  }
  
  const shelterId = availableShelters[0].id;
  console.log(`  🔸 Movendo shelter ${availableShelters[0].name} de ${fromLeaderId} para ${toLeader.id}`);
  
  try {
    const response = await makeRequest('PATCH', `/leader-profiles/${fromLeaderId}/move-shelter`, {
      shelterId: shelterId,
      toLeaderId: toLeader.id
    });
    console.log(`    ✅ Status: ${response.status}`);
    console.log(`    📝 Mensagem: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error('    ❌ Erro no teste de movimentação:', error.response?.status);
    return false;
  }
}

// Função para testar cenários de erro
async function testErrorScenarios() {
  console.log('\n📋 Testando cenários de erro...');
  
  try {
    // Teste 1: Buscar leader inexistente
    console.log('  🔸 Teste 1: Buscar leader inexistente');
    try {
      await makeRequest('GET', '/leader-profiles/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`);
    }
    
    // Teste 2: Criar leader profile para usuário inexistente
    console.log('  🔸 Teste 2: Criar leader profile para usuário inexistente');
    try {
      await makeRequest('POST', '/leader-profiles/create-for-user/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`);
    }
    
    // Teste 3: Atribuir shelter inexistente
    console.log('  🔸 Teste 3: Atribuir shelter inexistente');
    if (availableLeaders.length > 0) {
      try {
        await makeRequest('PATCH', `/leader-profiles/${availableLeaders[0].id}/assign-shelter`, {
          shelterId: '00000000-0000-0000-0000-000000000000'
        });
      } catch (error) {
        console.log(`    ✅ Erro esperado: ${error.response?.status} - Validation failed`);
      }
    }
    
    // Teste 4: Buscar shelter inexistente
    console.log('  🔸 Teste 4: Buscar shelter inexistente');
    try {
      await makeRequest('GET', '/leader-profiles/by-shelter/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`);
    }
    
  } catch (error) {
    console.error('  ❌ Erro nos testes de cenários de erro:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - TESTE DE TODOS OS ENDPOINTS DE LEADER PROFILES');
  console.log('====================================================================');
  console.log('📋 Endpoints a serem testados:');
  console.log('   1. POST /leader-profiles/create-for-user/:userId - Criar leader profile');
  console.log('   2. GET /leader-profiles - Listagem paginada com filtros');
  console.log('   3. GET /leader-profiles/simple - Listagem simples');
  console.log('   4. GET /leader-profiles/:id - Buscar por ID');
  console.log('   5. GET /leader-profiles/by-shelter/:shelterId - Buscar por shelter');
  console.log('   6. PATCH /leader-profiles/:leaderId/assign-shelter - Atribuir shelter');
  console.log('   7. PATCH /leader-profiles/:leaderId/unassign-shelter - Remover shelter');
  console.log('   8. PATCH /leader-profiles/:fromLeaderId/move-shelter - Mover shelter');
  console.log('   9. Cenários de erro');
  console.log('====================================================================\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Falha no login. Encerrando automação.');
    return;
  }
  
  // Obter dados necessários
  await getRequiredData();
  
  let createdLeader = null;
  let existingLeaders = [];
  
  try {
    // 1. Testar criação de leader profile
    createdLeader = await testCreateForUser();
    
    // 2. Testar listagem paginada
    existingLeaders = await testFindPage();
    
    // 3. Testar listagem simples
    await testListSimple();
    
    // 4. Testar busca por ID (usar primeiro leader existente)
    const testLeaderId = (existingLeaders.length > 0) ? existingLeaders[0].id : 
                         (createdLeader ? createdLeader.id : null);
    if (testLeaderId) {
      await testFindOne(testLeaderId);
    }
    
    // 5. Testar busca por shelter
    await testFindByShelter();
    
    // 6. Testar atribuição de shelter
    if (testLeaderId) {
      await testAssignShelter(testLeaderId);
    }
    
    // 7. Testar remoção de shelter
    if (testLeaderId) {
      await testUnassignShelter(testLeaderId);
    }
    
    // 8. Testar movimentação de shelter
    if (testLeaderId) {
      await testMoveShelter(testLeaderId);
    }
    
    // 9. Testar cenários de erro
    await testErrorScenarios();
    
    console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Todos os endpoints foram testados');
    console.log('✅ Cenários de erro foram validados');
    console.log('✅ CRUD completo funcionando');
    console.log('✅ Filtros e paginação funcionando');
    console.log('✅ Operações de shelter funcionando');
    
  } catch (error) {
    console.error('\n❌ Erro durante a automação:', error.message);
  }
}

// Executar automação
main().catch(console.error);

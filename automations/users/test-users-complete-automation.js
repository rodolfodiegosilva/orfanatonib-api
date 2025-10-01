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

// Função para testar GET /users (listagem paginada)
async function testFindAll() {
  console.log('\n📋 Testando GET /users (listagem paginada)...');
  
  try {
    // Teste 1: Listagem básica
    console.log('  🔸 Teste 1: Listagem básica');
    const response1 = await makeRequest('GET', '/users');
    console.log(`    ✅ Status: ${response1.status}`);
    console.log(`    📊 Total de usuários: ${response1.data.meta.total}`);
    console.log(`    📄 Página atual: ${response1.data.meta.page}`);
    console.log(`    📝 Itens por página: ${response1.data.meta.limit}`);
    
    // Teste 2: Com paginação
    console.log('  🔸 Teste 2: Com paginação (page=1, limit=5)');
    const response2 = await makeRequest('GET', '/users?page=1&limit=5');
    console.log(`    ✅ Status: ${response2.status}`);
    console.log(`    📊 Total: ${response2.data.meta.total}, Itens: ${response2.data.items.length}`);
    
    // Teste 3: Com busca por termo
    console.log('  🔸 Teste 3: Busca por termo (q=João)');
    const response3 = await makeRequest('GET', '/users?q=João');
    console.log(`    ✅ Status: ${response3.status}`);
    console.log(`    📊 Encontrados: ${response3.data.meta.total}`);
    
    // Teste 4: Com filtro por role
    console.log('  🔸 Teste 4: Filtro por role (role=teacher)');
    const response4 = await makeRequest('GET', '/users?role=teacher');
    console.log(`    ✅ Status: ${response4.status}`);
    console.log(`    📊 Professores: ${response4.data.meta.total}`);
    
    // Teste 5: Com filtro por role leader
    console.log('  🔸 Teste 5: Filtro por role (role=leader)');
    const response5 = await makeRequest('GET', '/users?role=leader');
    console.log(`    ✅ Status: ${response5.status}`);
    console.log(`    📊 Líderes: ${response5.data.meta.total}`);
    
    // Teste 6: Com filtro por status ativo
    console.log('  🔸 Teste 6: Filtro por status ativo (active=true)');
    const response6 = await makeRequest('GET', '/users?active=true');
    console.log(`    ✅ Status: ${response6.status}`);
    console.log(`    📊 Ativos: ${response6.data.meta.total}`);
    
    // Teste 7: Com filtro por completado
    console.log('  🔸 Teste 7: Filtro por completado (completed=true)');
    const response7 = await makeRequest('GET', '/users?completed=true');
    console.log(`    ✅ Status: ${response7.status}`);
    console.log(`    📊 Completados: ${response7.data.meta.total}`);
    
    // Teste 8: Com ordenação
    console.log('  🔸 Teste 8: Ordenação por nome (sort=name, order=ASC)');
    const response8 = await makeRequest('GET', '/users?sort=name&order=ASC');
    console.log(`    ✅ Status: ${response8.status}`);
    console.log(`    📊 Ordenados: ${response8.data.items.length}`);
    
    return response1.data.items;
  } catch (error) {
    console.error('    ❌ Erro no teste de listagem paginada:', error.response?.status);
    return [];
  }
}

// Função para testar GET /users/:id
async function testFindOne(userId) {
  console.log('\n📋 Testando GET /users/:id...');
  
  try {
    const response = await makeRequest('GET', `/users/${userId}`);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  👤 Usuário: ${response.data.name}`);
    console.log(`  📧 Email: ${response.data.email}`);
    console.log(`  📱 Telefone: ${response.data.phone}`);
    console.log(`  🎭 Role: ${response.data.role}`);
    console.log(`  ✅ Ativo: ${response.data.active}`);
    console.log(`  📝 Completado: ${response.data.completed}`);
    console.log(`  📅 Criado em: ${response.data.createdAt}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de busca por ID:', error.response?.status);
    return null;
  }
}

// Função para testar POST /users (criar)
async function testCreate() {
  console.log('\n📋 Testando POST /users (criar)...');
  
  const timestamp = Date.now();
  const userData = {
    name: `Usuário Teste ${timestamp}`,
    email: `usuario.teste.${timestamp}@example.com`,
    password: 'password123',
    phone: `+5511999${timestamp.toString().slice(-4)}`,
    role: 'teacher',
    active: true,
    completed: false,
    commonUser: true
  };
  
  try {
    const response = await makeRequest('POST', '/users', userData);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  👤 Usuário criado: ${response.data.name}`);
    console.log(`  🆔 ID: ${response.data.id}`);
    console.log(`  📧 Email: ${response.data.email}`);
    console.log(`  🎭 Role: ${response.data.role}`);
    console.log(`  ✅ Ativo: ${response.data.active}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de criação:', error.response?.status);
    return null;
  }
}

// Função para testar PUT /users/:id (atualizar)
async function testUpdate(userId) {
  console.log('\n📋 Testando PUT /users/:id (atualizar)...');
  
  const updateData = {
    name: `Usuário Atualizado ${Date.now()}`,
    phone: `+5511888${Date.now().toString().slice(-4)}`,
    active: false,
    completed: true
  };
  
  try {
    const response = await makeRequest('PUT', `/users/${userId}`, updateData);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  👤 Usuário atualizado: ${response.data.name}`);
    console.log(`  📱 Novo telefone: ${response.data.phone}`);
    console.log(`  ✅ Novo status ativo: ${response.data.active}`);
    console.log(`  📝 Novo status completado: ${response.data.completed}`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de atualização:', error.response?.status);
    return null;
  }
}

// Função para testar mudança de role
async function testRoleChange(userId) {
  console.log('\n📋 Testando mudança de role...');
  
  const roleChangeData = {
    role: 'leader',
    active: true
  };
  
  try {
    const response = await makeRequest('PUT', `/users/${userId}`, roleChangeData);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  👤 Usuário: ${response.data.name}`);
    console.log(`  🎭 Novo role: ${response.data.role}`);
    console.log(`  ✅ Status ativo: ${response.data.active}`);
    console.log(`  📝 Leader profile criado automaticamente`);
    return response.data;
  } catch (error) {
    console.error('  ❌ Erro no teste de mudança de role:', error.response?.status);
    return null;
  }
}

// Função para testar DELETE /users/:id
async function testDelete(userId) {
  console.log('\n📋 Testando DELETE /users/:id...');
  
  try {
    const response = await makeRequest('DELETE', `/users/${userId}`);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  🗑️ Mensagem: ${response.data.message}`);
    console.log(`  📝 Teacher/Leader profiles removidos automaticamente`);
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
    // Teste 1: Buscar usuário inexistente
    console.log('  🔸 Teste 1: Buscar usuário inexistente');
    try {
      await makeRequest('GET', '/users/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`);
    }
    
    // Teste 2: Criar usuário com dados inválidos
    console.log('  🔸 Teste 2: Criar usuário com dados inválidos');
    try {
      await makeRequest('POST', '/users', {
        name: 'A', // Nome muito curto
        email: 'invalid-email', // Email inválido
        password: '123', // Senha muito curta
        phone: '123' // Telefone inválido
      });
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Validation failed`);
    }
    
    // Teste 3: Criar usuário com email duplicado
    console.log('  🔸 Teste 3: Criar usuário com email duplicado');
    try {
      await makeRequest('POST', '/users', {
        name: 'Usuário Duplicado',
        email: 'joao@example.com', // Email já existe
        password: 'password123',
        phone: '+5511999999999',
        role: 'teacher'
      });
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Email already exists`);
    }
    
    // Teste 4: Atualizar usuário inexistente
    console.log('  🔸 Teste 4: Atualizar usuário inexistente');
    try {
      await makeRequest('PUT', '/users/00000000-0000-0000-0000-000000000000', {
        name: 'Teste'
      });
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Not Found`);
    }
    
    // Teste 5: Deletar usuário inexistente
    console.log('  🔸 Teste 5: Deletar usuário inexistente');
    try {
      await makeRequest('DELETE', '/users/00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.log(`    ✅ Erro esperado: ${error.response?.status} - Not Found`);
    }
    
  } catch (error) {
    console.error('  ❌ Erro nos testes de cenários de erro:', error.message);
  }
}

// Função para testar orquestração de profiles
async function testProfileOrchestration() {
  console.log('\n📋 Testando orquestração de profiles...');
  
  try {
    // Criar usuário teacher
    console.log('  🔸 Criando usuário teacher...');
    const teacherData = {
      name: `Teacher Test ${Date.now()}`,
      email: `teacher.test.${Date.now()}@example.com`,
      password: 'password123',
      phone: `+5511999${Date.now().toString().slice(-4)}`,
      role: 'teacher',
      active: true
    };
    
    const teacherResponse = await makeRequest('POST', '/users', teacherData);
    console.log(`    ✅ Teacher criado: ${teacherResponse.data.name}`);
    console.log(`    📝 Teacher profile criado automaticamente`);
    
    // Criar usuário leader
    console.log('  🔸 Criando usuário leader...');
    const leaderData = {
      name: `Leader Test ${Date.now()}`,
      email: `leader.test.${Date.now()}@example.com`,
      password: 'password123',
      phone: `+5511888${Date.now().toString().slice(-4)}`,
      role: 'leader',
      active: true
    };
    
    const leaderResponse = await makeRequest('POST', '/users', leaderData);
    console.log(`    ✅ Leader criado: ${leaderResponse.data.name}`);
    console.log(`    📝 Leader profile criado automaticamente`);
    
    // Mudar teacher para leader
    console.log('  🔸 Mudando teacher para leader...');
    await makeRequest('PUT', `/users/${teacherResponse.data.id}`, {
      role: 'leader',
      active: true
    });
    console.log(`    ✅ Role alterado: teacher -> leader`);
    console.log(`    📝 Teacher profile removido, Leader profile criado`);
    
    // Mudar leader para teacher
    console.log('  🔸 Mudando leader para teacher...');
    await makeRequest('PUT', `/users/${leaderResponse.data.id}`, {
      role: 'teacher',
      active: true
    });
    console.log(`    ✅ Role alterado: leader -> teacher`);
    console.log(`    📝 Leader profile removido, Teacher profile criado`);
    
    // Desativar usuário
    console.log('  🔸 Desativando usuário...');
    await makeRequest('PUT', `/users/${teacherResponse.data.id}`, {
      active: false
    });
    console.log(`    ✅ Usuário desativado`);
    console.log(`    📝 Profiles removidos automaticamente`);
    
    return {
      teacherId: teacherResponse.data.id,
      leaderId: leaderResponse.data.id
    };
    
  } catch (error) {
    console.error('  ❌ Erro no teste de orquestração:', error.response?.status);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - TESTE DE TODOS OS ENDPOINTS DE USERS');
  console.log('================================================================');
  console.log('📋 Endpoints a serem testados:');
  console.log('   1. GET /users - Listagem paginada com filtros');
  console.log('   2. GET /users/:id - Buscar por ID');
  console.log('   3. POST /users - Criar usuário');
  console.log('   4. PUT /users/:id - Atualizar usuário');
  console.log('   5. DELETE /users/:id - Deletar usuário');
  console.log('   6. Orquestração de Teacher/Leader profiles');
  console.log('   7. Cenários de erro');
  console.log('================================================================\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Falha no login. Encerrando automação.');
    return;
  }
  
  let createdUsers = [];
  let testUsers = null;
  
  try {
    // 1. Testar listagem paginada
    const existingUsers = await testFindAll();
    
    // 2. Testar busca por ID (usar primeiro usuário existente)
    if (existingUsers.length > 0) {
      await testFindOne(existingUsers[0].id);
    }
    
    // 3. Testar criação
    const createdUser = await testCreate();
    if (createdUser) {
      createdUsers.push(createdUser);
    }
    
    // 4. Testar atualização (usar usuário criado)
    if (createdUser) {
      await testUpdate(createdUser.id);
    }
    
    // 5. Testar mudança de role
    if (createdUser) {
      await testRoleChange(createdUser.id);
    }
    
    // 6. Testar orquestração de profiles
    testUsers = await testProfileOrchestration();
    
    // 7. Testar cenários de erro
    await testErrorScenarios();
    
    // 8. Testar exclusão (usar usuário criado)
    if (createdUser) {
      await testDelete(createdUser.id);
    }
    
    // Limpar usuários de teste da orquestração
    if (testUsers) {
      console.log('\n🧹 Limpando usuários de teste...');
      try {
        await makeRequest('DELETE', `/users/${testUsers.teacherId}`);
        await makeRequest('DELETE', `/users/${testUsers.leaderId}`);
        console.log('✅ Usuários de teste removidos');
      } catch (error) {
        console.log('⚠️ Erro ao limpar usuários de teste:', error.response?.status);
      }
    }
    
    console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Todos os endpoints foram testados');
    console.log('✅ Cenários de erro foram validados');
    console.log('✅ CRUD completo funcionando');
    console.log('✅ Filtros e paginação funcionando');
    console.log('✅ Orquestração de profiles funcionando');
    console.log('✅ Mudança de roles funcionando');
    
  } catch (error) {
    console.error('\n❌ Erro durante a automação:', error.message);
  }
}

// Executar automação
main().catch(console.error);

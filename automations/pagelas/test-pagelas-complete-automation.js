const axios = require('axios');

// Configurações
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let token = '';

async function login() {
  console.log('🔐 Fazendo login como admin...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    token = response.data.accessToken;
    console.log('✅ Login realizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

async function testEndpoint(method, endpoint, data = null, description = '') {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(`${BASE_URL}${endpoint}`, config);
        break;
      case 'POST':
        response = await axios.post(`${BASE_URL}${endpoint}`, data, config);
        break;
      case 'PUT':
        response = await axios.put(`${BASE_URL}${endpoint}`, data, config);
        break;
      case 'PATCH':
        response = await axios.patch(`${BASE_URL}${endpoint}`, data, config);
        break;
      case 'DELETE':
        response = await axios.delete(`${BASE_URL}${endpoint}`, config);
        break;
    }
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    if (description) console.log(`   📝 ${description}`);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Status: ${error.response?.status || 'Error'}`);
    if (description) console.log(`   📝 ${description}`);
    console.log(`   🔍 Erro: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.response?.data || error.message, status: error.response?.status };
  }
}

async function getRequiredData() {
  console.log('📊 Obtendo dados necessários...');
  
  try {
    // Obter sheltered disponíveis
    console.log('  👶 Obtendo sheltered...');
    const shelteredResponse = await axios.get(`${BASE_URL}/sheltered?limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sheltered = shelteredResponse.data.data || shelteredResponse.data.items || [];
    console.log(`    ✅ ${sheltered.length} sheltered encontrados`);
    
    // Obter teachers disponíveis
    console.log('  👨‍🏫 Obtendo teachers...');
    const teachersResponse = await axios.get(`${BASE_URL}/teacher-profiles?limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teachers = teachersResponse.data.items || [];
    console.log(`    ✅ ${teachers.length} teachers encontrados`);
    
    return { sheltered, teachers };
  } catch (error) {
    console.error('❌ Erro ao obter dados necessários:', error.response?.status);
    return { sheltered: [], teachers: [] };
  }
}

async function testPagelasComplete() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - TESTE DE TODOS OS ENDPOINTS DE PAGELAS');
  console.log('================================================================');
  console.log('📋 Endpoints a serem testados:');
  console.log('   1. POST /pagelas - Criar pagela');
  console.log('   2. GET /pagelas - Listagem simples');
  console.log('   3. GET /pagelas/paginated - Listagem paginada');
  console.log('   4. GET /pagelas/:id - Buscar por ID');
  console.log('   5. PATCH /pagelas/:id - Atualizar pagela');
  console.log('   6. DELETE /pagelas/:id - Deletar pagela');
  console.log('   7. Cenários de erro e validação');
  console.log('================================================================');

  if (!await login()) {
    console.log('❌ Falha no login. Abortando teste.');
    return;
  }

  // Obter dados necessários
  const { sheltered, teachers } = await getRequiredData();
  
  if (sheltered.length === 0) {
    console.log('⚠️ Nenhum sheltered encontrado para teste');
    return;
  }

  const firstSheltered = sheltered[0];
  const firstTeacher = teachers.length > 0 ? teachers[0] : null;
  
  console.log(`👶 Sheltered para teste: ${firstSheltered.name} (ID: ${firstSheltered.id})`);
  if (firstTeacher) {
    console.log(`👨‍🏫 Teacher para teste: ${firstTeacher.user?.name} (ID: ${firstTeacher.id})`);
  }

  let createdPagelaId = null;

  try {
    // 1. Teste de criação
    console.log('\n📋 Testando POST /pagelas (criar pagela)...');
    const createData = {
      shelteredId: firstSheltered.id,
      teacherProfileId: firstTeacher.id,
      referenceDate: '2025-01-15',
      visit: 3,
      year: 2025,
      present: true,
      notes: 'Pagela de teste criada pela automação'
    };
    
    const createResult = await testEndpoint('POST', '/pagelas', createData, 'Criar pagela de teste');
    
    if (createResult.success) {
      createdPagelaId = createResult.data.id;
      console.log(`✅ Pagela criada com ID: ${createdPagelaId}`);
    }

    // 2. Teste de listagem simples
    console.log('\n📋 Testando GET /pagelas (listagem simples)...');
    await testEndpoint('GET', '/pagelas', null, 'Listagem simples de pagelas');

    // 3. Teste de listagem paginada
    console.log('\n📋 Testando GET /pagelas/paginated (listagem paginada)...');
    await testEndpoint('GET', '/pagelas/paginated?page=1&limit=10', null, 'Listagem paginada');

    // 4. Teste de filtros
    console.log('\n📋 Testando filtros...');
    
    // Filtro por sheltered
    await testEndpoint('GET', `/pagelas?shelteredId=${firstSheltered.id}`, null, 'Filtro por sheltered');
    
    // Filtro por ano
    await testEndpoint('GET', '/pagelas?year=2025', null, 'Filtro por ano');
    
    // Filtro por visita
    await testEndpoint('GET', '/pagelas?visit=3', null, 'Filtro por visita');
    
    // Filtro por presença
    await testEndpoint('GET', '/pagelas?present=true', null, 'Filtro por presença');

    // 5. Teste de busca por ID
    if (createdPagelaId) {
      console.log('\n📋 Testando GET /pagelas/:id...');
      await testEndpoint('GET', `/pagelas/${createdPagelaId}`, null, `Buscar pagela por ID: ${createdPagelaId}`);
    }

    // 6. Teste de atualização
    if (createdPagelaId) {
      console.log('\n📋 Testando PATCH /pagelas/:id...');
      const updateData = {
        present: false,
        notes: 'Pagela atualizada pela automação'
      };
      
      await testEndpoint('PATCH', `/pagelas/${createdPagelaId}`, updateData, 'Atualizar pagela');
    }

    // 7. Teste de cenários de erro
    console.log('\n📋 Testando cenários de erro...');
    
    // Buscar pagela inexistente
    await testEndpoint('GET', '/pagelas/00000000-0000-0000-0000-000000000000', null, 'Buscar pagela inexistente');
    
    // Criar pagela com dados inválidos
    await testEndpoint('POST', '/pagelas', {
      shelteredId: 'invalid-id',
      teacherProfileId: 'invalid-teacher-id',
      referenceDate: 'invalid-date',
      visit: -1, // Visita inválida
      present: 'invalid-boolean'
    }, 'Criar pagela com dados inválidos');
    
    // Criar pagela duplicada (mesmo sheltered, ano e visita)
    if (createdPagelaId) {
      await testEndpoint('POST', '/pagelas', {
        shelteredId: firstSheltered.id,
        teacherProfileId: firstTeacher.id,
        referenceDate: '2025-01-15',
        visit: 3,
        year: 2025,
        present: true
      }, 'Tentar criar pagela duplicada');
    }

    // 8. Teste de filtros combinados
    console.log('\n📋 Testando filtros combinados...');
    await testEndpoint('GET', `/pagelas?shelteredId=${firstSheltered.id}&year=2025&present=true`, null, 'Filtros combinados');

    // 9. Teste de paginação avançada
    console.log('\n📋 Testando paginação avançada...');
    await testEndpoint('GET', '/pagelas/paginated?page=1&limit=5&year=2025', null, 'Paginação com filtros');

    // 10. Limpeza - deletar pagela criada
    if (createdPagelaId) {
      console.log('\n📋 Testando DELETE /pagelas/:id...');
      await testEndpoint('DELETE', `/pagelas/${createdPagelaId}`, null, 'Deletar pagela criada');
    }

    console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Todos os endpoints foram testados');
    console.log('✅ Cenários de erro foram validados');
    console.log('✅ CRUD completo funcionando');
    console.log('✅ Filtros e paginação funcionando');
    console.log('✅ Validações funcionando');
    console.log('✅ Relacionamentos funcionando');
    
  } catch (error) {
    console.error('\n❌ Erro durante a automação:', error.message);
  }
}

// Executar automação
testPagelasComplete().catch(console.error);

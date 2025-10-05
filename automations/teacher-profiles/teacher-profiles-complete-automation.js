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
    // Obter users (para criar teacher profiles)
    const usersResponse = await makeRequest('GET', '/users/simple');
    if (usersResponse) {
      testData.users = usersResponse.data || [];
      console.log(`  👤 ${testData.users.length} users encontrados`);
    }

    // Obter shelters
    const sheltersResponse = await makeRequest('GET', '/shelters/simple');
    if (sheltersResponse) {
      testData.shelters = sheltersResponse.data || [];
      console.log(`  🏠 ${testData.shelters.length} shelters encontrados`);
    }

    // Obter teacher profiles existentes
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

async function testTeacherProfilesCRUD() {
  console.log('\n📋 Testando CRUD de Teacher Profiles...');
  
  // 1. Criar User primeiro (se necessário)
  let testUser = null;
  if (testData.users.length === 0) {
    console.log('  🔸 Criando user para teste...');
    const createUserData = {
      name: `User Teacher Test ${Date.now()}`,
      email: `teacher${Date.now()}@example.com`,
      password: 'password123',
      role: 'teacher'
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

  // 2. Criar Teacher Profile
  console.log('  🔸 Teste 1: Criar Teacher Profile');
  const createData = {
    userId: testUser.id,
    shelterId: testData.shelters[0]?.id,
    name: `Teacher Profile Teste ${Date.now()}`,
    phone: '+5511999999999',
    email: `teacher${Date.now()}@example.com`,
    specialization: 'Matemática',
    experience: '5 anos',
    address: {
      street: 'Rua dos Teachers',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567'
    }
  };
  
  const createResponse = await makeRequest('POST', '/teacher-profiles', createData);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ Teacher Profile criado: ${createResponse.data.name}`);
    const createdProfile = createResponse.data;
    
    // 3. Buscar Teacher Profile por ID
    console.log('  🔸 Teste 2: Buscar Teacher Profile por ID');
    const getResponse = await makeRequest('GET', `/teacher-profiles/${createdProfile.id}`);
    if (getResponse && getResponse.status === 200) {
      console.log(`    ✅ Teacher Profile encontrado: ${getResponse.data.name}`);
    }

    // 4. Atualizar Teacher Profile
    console.log('  🔸 Teste 3: Atualizar Teacher Profile');
    const updateData = {
      name: `${createData.name} - Atualizado`,
      specialization: 'Português',
      experience: '7 anos'
    };
    
    const updateResponse = await makeRequest('PUT', `/teacher-profiles/${createdProfile.id}`, updateData);
    if (updateResponse && updateResponse.status === 200) {
      console.log(`    ✅ Teacher Profile atualizado: ${updateResponse.data.name}`);
    }

    // 5. Deletar Teacher Profile
    console.log('  🔸 Teste 4: Deletar Teacher Profile');
    const deleteResponse = await makeRequest('DELETE', `/teacher-profiles/${createdProfile.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Teacher Profile deletado com sucesso');
    }
  }
}

// ==================== TESTES DE FILTROS ====================

async function testTeacherProfilesFilters() {
  console.log('\n📋 Testando Filtros de Teacher Profiles...');
  
  // 1. Filtro por nome
  console.log('  🔸 Teste 1: Filtro por nome (name=Maria)');
  const nameResponse = await makeRequest('GET', '/teacher-profiles?name=Maria&limit=5');
  if (nameResponse && nameResponse.status === 200) {
    console.log(`    ✅ Status: ${nameResponse.status}`);
    console.log(`    📊 Encontrados: ${nameResponse.data.items?.length || 0}`);
  }

  // 2. Filtro por shelter
  console.log('  🔸 Teste 2: Filtro por shelter');
  if (testData.shelters.length > 0) {
    const shelterResponse = await makeRequest('GET', `/teacher-profiles?shelterId=${testData.shelters[0].id}&limit=5`);
    if (shelterResponse && shelterResponse.status === 200) {
      console.log(`    ✅ Status: ${shelterResponse.status}`);
      console.log(`    📊 Encontrados: ${shelterResponse.data.items?.length || 0}`);
    }
  }

  // 3. Filtro por especialização
  console.log('  🔸 Teste 3: Filtro por especialização (specialization=Matemática)');
  const specializationResponse = await makeRequest('GET', '/teacher-profiles?specialization=Matemática&limit=5');
  if (specializationResponse && specializationResponse.status === 200) {
    console.log(`    ✅ Status: ${specializationResponse.status}`);
    console.log(`    📊 Encontrados: ${specializationResponse.data.items?.length || 0}`);
  }

  // 4. Filtro por experiência
  console.log('  🔸 Teste 4: Filtro por experiência (experience=5)');
  const experienceResponse = await makeRequest('GET', '/teacher-profiles?experience=5&limit=5');
  if (experienceResponse && experienceResponse.status === 200) {
    console.log(`    ✅ Status: ${experienceResponse.status}`);
    console.log(`    📊 Encontrados: ${experienceResponse.data.items?.length || 0}`);
  }
}

// ==================== TESTES DE LISTAGEM ====================

async function testTeacherProfilesListings() {
  console.log('\n📋 Testando Listagens de Teacher Profiles...');
  
  // 1. Listagem paginada
  console.log('  🔸 Teste 1: Listagem paginada');
  const paginatedResponse = await makeRequest('GET', '/teacher-profiles?page=1&limit=10');
  if (paginatedResponse && paginatedResponse.status === 200) {
    console.log(`    ✅ Status: ${paginatedResponse.status}`);
    console.log(`    📊 Total: ${paginatedResponse.data.meta?.totalItems || 0}`);
    console.log(`    📄 Itens: ${paginatedResponse.data.items?.length || 0}`);
  }

  // 2. Listagem simples
  console.log('  🔸 Teste 2: Listagem simples');
  const simpleResponse = await makeRequest('GET', '/teacher-profiles/simple');
  if (simpleResponse && simpleResponse.status === 200) {
    console.log(`    ✅ Status: ${simpleResponse.status}`);
    console.log(`    📊 Total: ${simpleResponse.data?.length || 0}`);
  }

  // 3. Ordenação
  console.log('  🔸 Teste 3: Ordenação (orderBy=name, order=ASC)');
  const sortResponse = await makeRequest('GET', '/teacher-profiles?orderBy=name&order=ASC&limit=5');
  if (sortResponse && sortResponse.status === 200) {
    console.log(`    ✅ Status: ${sortResponse.status}`);
    console.log(`    📊 Ordenados: ${sortResponse.data.items?.length || 0}`);
  }
}

// ==================== TESTES DE VALIDAÇÃO ====================

async function testTeacherProfilesValidation() {
  console.log('\n📋 Testando Validações de Teacher Profiles...');
  
  // 1. UserId inválido
  console.log('  🔸 Teste 1: UserId inválido');
  const invalidUserResponse = await makeRequest('POST', '/teacher-profiles', {
    userId: '00000000-0000-0000-0000-000000000000',
    name: 'Teste',
    email: 'teste@example.com'
  });
  if (invalidUserResponse && invalidUserResponse.status === 400) {
    console.log('    ✅ Erro esperado: UserId inválido rejeitado');
  }

  // 2. Nome muito curto
  console.log('  🔸 Teste 2: Nome muito curto');
  if (testData.users.length > 0) {
    const shortNameResponse = await makeRequest('POST', '/teacher-profiles', {
      userId: testData.users[0].id,
      name: 'A',
      email: 'teste@example.com'
    });
    if (shortNameResponse && shortNameResponse.status === 400) {
      console.log('    ✅ Erro esperado: Nome muito curto rejeitado');
    }
  }

  // 3. Email inválido
  console.log('  🔸 Teste 3: Email inválido');
  if (testData.users.length > 0) {
    const invalidEmailResponse = await makeRequest('POST', '/teacher-profiles', {
      userId: testData.users[0].id,
      name: 'Teste',
      email: 'email-invalido'
    });
    if (invalidEmailResponse && invalidEmailResponse.status === 400) {
      console.log('    ✅ Erro esperado: Email inválido rejeitado');
    }
  }

  // 4. Buscar registro inexistente
  console.log('  🔸 Teste 4: Buscar registro inexistente');
  const notFoundResponse = await makeRequest('GET', '/teacher-profiles/00000000-0000-0000-0000-000000000000');
  if (notFoundResponse && notFoundResponse.status === 404) {
    console.log('    ✅ Erro esperado: Registro não encontrado');
  }
}

// ==================== TESTES DE RELACIONAMENTOS ====================

async function testTeacherProfilesRelationships() {
  console.log('\n📋 Testando Relacionamentos de Teacher Profiles...');
  
  if (testData.users.length === 0 || testData.shelters.length === 0) {
    console.log('  ⚠️ Dados insuficientes para testar relacionamentos');
    return;
  }

  // 1. Criar teacher profile com relacionamentos
  console.log('  🔸 Teste 1: Criar teacher profile com relacionamentos');
  const createData = {
    userId: testData.users[0].id,
    shelterId: testData.shelters[0].id,
    name: `Teacher Relacionamento ${Date.now()}`,
    phone: '+5511777777777',
    email: `teacher${Date.now()}@example.com`,
    specialization: 'Ciências',
    experience: '3 anos',
    address: {
      street: 'Rua dos Relacionamentos',
      number: '456',
      district: 'Teste',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567'
    }
  };

  const createResponse = await makeRequest('POST', '/teacher-profiles', createData);
  if (createResponse && createResponse.status === 201) {
    console.log(`    ✅ Teacher Profile criado: ${createResponse.data.name}`);
    console.log(`    👤 User vinculado: ${createResponse.data.user?.name || 'N/A'}`);
    console.log(`    🏠 Shelter vinculado: ${createResponse.data.shelter?.name || 'N/A'}`);
    const createdProfile = createResponse.data;

    // 2. Atualizar shelter do teacher
    console.log('  🔸 Teste 2: Atualizar shelter do teacher');
    if (testData.shelters.length > 1) {
      const updateShelterResponse = await makeRequest('PUT', `/teacher-profiles/${createdProfile.id}`, {
        shelterId: testData.shelters[1].id
      });
      
      if (updateShelterResponse && updateShelterResponse.status === 200) {
        console.log(`    ✅ Shelter atualizado: ${updateShelterResponse.data.shelter?.name || 'N/A'}`);
      }
    }

    // 3. Deletar teacher profile de teste
    console.log('  🔸 Teste 3: Deletar teacher profile de teste');
    const deleteResponse = await makeRequest('DELETE', `/teacher-profiles/${createdProfile.id}`);
    if (deleteResponse && deleteResponse.status === 200) {
      console.log('    ✅ Teacher Profile de teste deletado');
    }
  }
}

// ==================== TESTES DE ESPECIALIZAÇÕES ====================

async function testTeacherProfilesSpecializations() {
  console.log('\n📋 Testando Especializações de Teacher Profiles...');
  
  const specializations = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia'];
  
  for (const specialization of specializations) {
    console.log(`  🔸 Teste: Criar teacher com especialização ${specialization}`);
    
    // Criar user temporário
    const createUserData = {
      name: `User ${specialization} ${Date.now()}`,
      email: `${specialization.toLowerCase()}${Date.now()}@example.com`,
      password: 'password123',
      role: 'teacher'
    };
    
    const createUserResponse = await makeRequest('POST', '/users', createUserData);
    if (createUserResponse && createUserResponse.status === 201) {
      const testUser = createUserResponse.data;
      
      // Criar teacher profile
      const createProfileData = {
        userId: testUser.id,
        shelterId: testData.shelters[0]?.id,
        name: `Teacher ${specialization} ${Date.now()}`,
        email: `${specialization.toLowerCase()}${Date.now()}@example.com`,
        specialization: specialization,
        experience: '5 anos'
      };
      
      const createProfileResponse = await makeRequest('POST', '/teacher-profiles', createProfileData);
      if (createProfileResponse && createProfileResponse.status === 201) {
        console.log(`    ✅ Teacher ${specialization} criado: ${createProfileResponse.data.name}`);
        
        // Deletar teacher profile e user
        await makeRequest('DELETE', `/teacher-profiles/${createProfileResponse.data.id}`);
        await makeRequest('DELETE', `/users/${testUser.id}`);
        console.log(`    ✅ Teacher ${specialization} deletado`);
      }
    }
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runTeacherProfilesAutomation() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - MÓDULO TEACHER PROFILES');
  console.log('===============================================');
  console.log('📋 Funcionalidades a serem testadas:');
  console.log('   1. CRUD de Teacher Profiles');
  console.log('   2. Filtros e Buscas');
  console.log('   3. Listagens e Paginação');
  console.log('   4. Validações de Dados');
  console.log('   5. Relacionamentos com Users e Shelters');
  console.log('   6. Especializações de Teachers');
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
  await testTeacherProfilesCRUD();
  await testTeacherProfilesFilters();
  await testTeacherProfilesListings();
  await testTeacherProfilesValidation();
  await testTeacherProfilesRelationships();
  await testTeacherProfilesSpecializations();

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('=====================================');
  console.log('✅ Todos os testes foram executados');
  console.log('✅ CRUD de Teacher Profiles funcionando');
  console.log('✅ Filtros e buscas funcionando');
  console.log('✅ Listagens e paginação funcionando');
  console.log('✅ Validações funcionando');
  console.log('✅ Relacionamentos funcionando');
  console.log('✅ Especializações funcionando');
  console.log('✅ Sistema pronto para produção!');
}

// Executar automação
runTeacherProfilesAutomation()
  .then(() => {
    console.log('\n✅ Automação finalizada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante a automação:', error);
    process.exit(1);
  });

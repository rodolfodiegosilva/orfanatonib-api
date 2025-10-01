const axios = require('axios');

// Configurações
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let adminToken = '';
let teacherToken = '';
let teacherUserId = 'd6cc5020-aa4b-450b-a7ac-0c41b4e41ca3'; // Usuário já criado
let teacherProfileId = '';
let shelterId = '';
let shelteredId = '';

async function loginAsAdmin() {
  console.log('🔐 Fazendo login como admin...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    adminToken = response.data.accessToken;
    console.log('✅ Login admin realizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no login admin:', error.response?.data || error.message);
    return false;
  }
}

async function activateTeacherUser() {
  console.log('\n✅ Ativando usuário teacher existente...');
  try {
    const updateData = {
      active: true,
      completed: true
    };

    await axios.put(`${BASE_URL}/users/${teacherUserId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Usuário teacher ativado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao ativar usuário teacher:', error.response?.data || error.message);
    return false;
  }
}

async function getShelters() {
  console.log('\n🏠 Obtendo shelters disponíveis...');
  try {
    const response = await axios.get(`${BASE_URL}/shelters?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const shelters = response.data.data || response.data.items || [];
    console.log(`✅ ${shelters.length} shelters encontrados`);
    
    if (shelters.length > 0) {
      shelterId = shelters[0].id;
      console.log('🏠 Shelter selecionado:', shelters[0].name, '(ID:', shelterId + ')');
    }
    
    return shelters.length > 0;
  } catch (error) {
    console.error('❌ Erro ao obter shelters:', error.response?.data || error.message);
    return false;
  }
}

async function createTeacherProfile() {
  console.log('\n👨‍🏫 Criando teacher profile...');
  try {
    const profileData = {
      userId: teacherUserId,
      shelterId: shelterId
    };

    const response = await axios.post(`${BASE_URL}/teacher-profiles`, profileData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    teacherProfileId = response.data.id;
    console.log('✅ Teacher profile criado - ID:', teacherProfileId);
    console.log('🏠 Vinculado ao shelter:', shelterId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar teacher profile:', error.response?.data || error.message);
    return false;
  }
}

async function loginAsTeacher() {
  console.log('\n🔐 Fazendo login como teacher...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'teste.teacher@example.com',
      password: 'password123'
    });

    teacherToken = response.data.accessToken;
    console.log('✅ Login teacher realizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no login teacher:', error.response?.data || error.message);
    return false;
  }
}

async function createSheltered() {
  console.log('\n👶 Criando sheltered pelo teacher...');
  try {
    const shelteredData = {
      name: 'Criança Teste Pagelas',
      birthDate: '2015-06-15',
      gender: 'Masculino',
      shelterId: shelterId,
      guardianName: 'Responsável Teste',
      guardianPhone: '+5511888888888'
    };

    const response = await axios.post(`${BASE_URL}/sheltered`, shelteredData, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    shelteredId = response.data.id;
    console.log('✅ Sheltered criado - ID:', shelteredId);
    console.log('👶 Nome:', shelteredData.name);
    console.log('🏠 Shelter:', shelterId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar sheltered:', error.response?.data || error.message);
    return false;
  }
}

async function testPagelasEndpoints() {
  console.log('\n📋 Testando endpoints de pagelas como teacher...');
  
  try {
    // 1. Criar pagela
    console.log('\n📝 Criando pagela...');
    const pagelaData = {
      shelteredId: shelteredId,
      teacherProfileId: teacherProfileId,
      referenceDate: '2025-01-15',
      visit: 1,
      year: 2025,
      present: true,
      notes: 'Primeira visita - participou ativamente'
    };

    const createResponse = await axios.post(`${BASE_URL}/pagelas`, pagelaData, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    const pagelaId = createResponse.data.id;
    console.log('✅ Pagela criada - ID:', pagelaId);

    // 2. Listar pagelas
    console.log('\n📋 Listando pagelas...');
    const listResponse = await axios.get(`${BASE_URL}/pagelas`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagelas listadas:', listResponse.data.length);

    // 3. Listar pagelas paginadas
    console.log('\n📋 Listando pagelas paginadas...');
    const paginatedResponse = await axios.get(`${BASE_URL}/pagelas/paginated?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagelas paginadas - Total:', paginatedResponse.data.total);

    // 4. Buscar pagela por ID
    console.log('\n🔍 Buscando pagela por ID...');
    const getResponse = await axios.get(`${BASE_URL}/pagelas/${pagelaId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagela encontrada:', getResponse.data.id);

    // 5. Atualizar pagela
    console.log('\n✏️ Atualizando pagela...');
    const updateData = {
      present: false,
      notes: 'Atualizada - faltou na segunda visita'
    };

    const updateResponse = await axios.patch(`${BASE_URL}/pagelas/${pagelaId}`, updateData, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagela atualizada');

    // 6. Testar filtros
    console.log('\n🔍 Testando filtros...');
    const filterResponse = await axios.get(`${BASE_URL}/pagelas?shelteredId=${shelteredId}&year=2025`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Filtros funcionando - Resultados:', filterResponse.data.length);

    // 7. Testar paginação com filtros
    console.log('\n🔍 Testando paginação com filtros...');
    const paginatedFilterResponse = await axios.get(`${BASE_URL}/pagelas/paginated?page=1&limit=5&year=2025&present=false`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Paginação com filtros funcionando - Total:', paginatedFilterResponse.data.total);

    // 8. Deletar pagela
    console.log('\n🗑️ Deletando pagela...');
    await axios.delete(`${BASE_URL}/pagelas/${pagelaId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagela deletada');

    return true;
  } catch (error) {
    console.error('❌ Erro nos testes de pagelas:', error.response?.data || error.message);
    return false;
  }
}

async function runCompleteFlow() {
  console.log('🎯 FLUXO COMPLETO - TEACHER CRIANDO PAGELAS');
  console.log('==========================================');
  console.log('📋 Fluxo:');
  console.log('   1. Usar usuário teacher existente');
  console.log('   2. Admin ativar usuário');
  console.log('   3. Vincular teacher a abrigo');
  console.log('   4. Login como teacher');
  console.log('   5. Teacher criar sheltered');
  console.log('   6. Teacher criar/editar/excluir pagelas');
  console.log('==========================================');

  // 1. Login como admin
  if (!await loginAsAdmin()) return false;

  // 2. Ativar usuário teacher existente
  if (!await activateTeacherUser()) return false;

  // 3. Obter shelters
  if (!await getShelters()) return false;

  // 4. Criar teacher profile (vincular a abrigo)
  if (!await createTeacherProfile()) return false;

  // 5. Login como teacher
  if (!await loginAsTeacher()) return false;

  // 6. Criar sheltered
  if (!await createSheltered()) return false;

  // 7. Testar endpoints de pagelas
  if (!await testPagelasEndpoints()) return false;

  console.log('\n🎉 FLUXO COMPLETO EXECUTADO COM SUCESSO!');
  console.log('==========================================');
  console.log('✅ Todos os passos foram executados');
  console.log('✅ Teacher pode criar/editar/excluir pagelas');
  console.log('✅ Paginação funcionando corretamente');
  console.log('✅ Filtros funcionando corretamente');
  console.log('✅ Fluxo de permissões funcionando corretamente');
  
  return true;
}

// Executar fluxo completo
runCompleteFlow().catch(console.error);

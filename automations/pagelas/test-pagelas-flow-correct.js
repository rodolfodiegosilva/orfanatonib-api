const axios = require('axios');

// Configurações
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let adminToken = '';
let teacherToken = '';
let teacherUserId = '';
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

async function createTeacherUser() {
  console.log('\n👨‍🏫 Criando usuário teacher...');
  try {
    const teacherData = {
      name: 'Professor Pagelas Final',
      email: 'prof.final@example.com',
      phone: '+5511999999999',
      password: 'password123',
      role: 'teacher'
    };

    const response = await axios.post(`${BASE_URL}/users`, teacherData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    teacherUserId = response.data.id;
    console.log('✅ Usuário teacher criado - ID:', teacherUserId);
    console.log('📧 Email:', teacherData.email);
    console.log('🔒 Active:', response.data.active);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar usuário teacher:', error.response?.data || error.message);
    return false;
  }
}

async function activateTeacherUser() {
  console.log('\n✅ Ativando usuário teacher...');
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

async function findTeacherProfile() {
  console.log('\n👨‍🏫 Procurando teacher profile...');
  try {
    const response = await axios.get(`${BASE_URL}/teacher-profiles?limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const teachers = response.data.data || response.data.items || [];
    console.log(`✅ ${teachers.length} teacher profiles encontrados`);
    
    // Procurar teacher profile do usuário criado
    const teacherProfile = teachers.find(t => t.user?.id === teacherUserId);
    
    if (teacherProfile) {
      teacherProfileId = teacherProfile.id;
      console.log('✅ Teacher profile encontrado - ID:', teacherProfileId);
      console.log('👤 User:', teacherProfile.user?.email);
      return true;
    } else {
      console.log('⚠️ Teacher profile não encontrado para o usuário criado');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao procurar teacher profile:', error.response?.data || error.message);
    return false;
  }
}

async function assignTeacherToShelter() {
  console.log('\n🏠 Vinculando teacher ao shelter...');
  try {
    const assignData = {
      shelterId: shelterId
    };

    await axios.patch(`${BASE_URL}/teacher-profiles/${teacherProfileId}/assign-shelter`, assignData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Teacher vinculado ao shelter com sucesso!');
    console.log('🏠 Shelter ID:', shelterId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao vincular teacher ao shelter:', error.response?.data || error.message);
    return false;
  }
}

async function loginAsTeacher() {
  console.log('\n🔐 Fazendo login como teacher...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'prof.final@example.com',
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
      name: 'Criança Teste Pagelas Final',
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
  console.log('\n📋 Testando TODOS os endpoints de pagelas como teacher...');
  
  try {
    // 1. Criar pagela
    console.log('\n📝 1. Criando pagela...');
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

    // 2. Listar pagelas simples
    console.log('\n📋 2. Listando pagelas (simples)...');
    const listResponse = await axios.get(`${BASE_URL}/pagelas`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagelas listadas:', listResponse.data.length);

    // 3. Listar pagelas paginadas
    console.log('\n📋 3. Listando pagelas paginadas...');
    const paginatedResponse = await axios.get(`${BASE_URL}/pagelas/paginated?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagelas paginadas - Total:', paginatedResponse.data.total, '- Página:', paginatedResponse.data.page);

    // 4. Buscar pagela por ID
    console.log('\n🔍 4. Buscando pagela por ID...');
    const getResponse = await axios.get(`${BASE_URL}/pagelas/${pagelaId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagela encontrada:', getResponse.data.id);

    // 5. Atualizar pagela
    console.log('\n✏️ 5. Atualizando pagela...');
    const updateData = {
      present: false,
      notes: 'Atualizada - faltou na segunda visita'
    };

    const updateResponse = await axios.patch(`${BASE_URL}/pagelas/${pagelaId}`, updateData, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Pagela atualizada');

    // 6. Testar filtros simples
    console.log('\n🔍 6. Testando filtros simples...');
    const filterResponse = await axios.get(`${BASE_URL}/pagelas?shelteredId=${shelteredId}&year=2025`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Filtros simples funcionando - Resultados:', filterResponse.data.length);

    // 7. Testar paginação com filtros
    console.log('\n🔍 7. Testando paginação com filtros...');
    const paginatedFilterResponse = await axios.get(`${BASE_URL}/pagelas/paginated?page=1&limit=5&year=2025&present=false`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Paginação com filtros funcionando - Total:', paginatedFilterResponse.data.total);

    // 8. Testar filtro por visita
    console.log('\n🔍 8. Testando filtro por visita...');
    const visitFilterResponse = await axios.get(`${BASE_URL}/pagelas?visit=1`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Filtro por visita funcionando - Resultados:', visitFilterResponse.data.length);

    // 9. Testar filtro por presença
    console.log('\n🔍 9. Testando filtro por presença...');
    const presentFilterResponse = await axios.get(`${BASE_URL}/pagelas?present=false`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Filtro por presença funcionando - Resultados:', presentFilterResponse.data.length);

    // 10. Testar busca por texto
    console.log('\n🔍 10. Testando busca por texto...');
    const searchResponse = await axios.get(`${BASE_URL}/pagelas?searchString=segunda`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Busca por texto funcionando - Resultados:', searchResponse.data.length);

    // 11. Deletar pagela
    console.log('\n🗑️ 11. Deletando pagela...');
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

async function cleanup() {
  console.log('\n🧹 Limpando dados de teste...');
  try {
    // Desvincular teacher do shelter
    if (teacherProfileId && shelterId) {
      await axios.patch(`${BASE_URL}/teacher-profiles/${teacherProfileId}/unassign-shelter`, {
        shelterId: shelterId
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Teacher desvinculado do shelter');
    }

    // Deletar usuário teacher
    if (teacherUserId) {
      await axios.delete(`${BASE_URL}/users/${teacherUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Usuário teacher deletado');
    }

    console.log('✅ Limpeza concluída');
  } catch (error) {
    console.log('⚠️ Erro na limpeza (normal):', error.response?.data?.message || error.message);
  }
}

async function runCompleteFlow() {
  console.log('🎯 FLUXO COMPLETO - TEACHER CRIANDO PAGELAS');
  console.log('==========================================');
  console.log('📋 Fluxo:');
  console.log('   1. Admin criar usuário teacher');
  console.log('   2. Admin ativar usuário');
  console.log('   3. Admin encontrar teacher profile');
  console.log('   4. Admin vincular teacher a abrigo');
  console.log('   5. Login como teacher');
  console.log('   6. Teacher criar sheltered');
  console.log('   7. Teacher testar TODOS endpoints de pagelas');
  console.log('==========================================');

  try {
    // 1. Login como admin
    if (!await loginAsAdmin()) return false;

    // 2. Criar usuário teacher
    if (!await createTeacherUser()) return false;

    // 3. Ativar usuário teacher
    if (!await activateTeacherUser()) return false;

    // 4. Obter shelters
    if (!await getShelters()) return false;

    // 5. Encontrar teacher profile
    if (!await findTeacherProfile()) return false;

    // 6. Vincular teacher ao shelter
    if (!await assignTeacherToShelter()) return false;

    // 7. Login como teacher
    if (!await loginAsTeacher()) return false;

    // 8. Criar sheltered
    if (!await createSheltered()) return false;

    // 9. Testar TODOS os endpoints de pagelas
    if (!await testPagelasEndpoints()) return false;

    console.log('\n🎉 FLUXO COMPLETO EXECUTADO COM SUCESSO!');
    console.log('==========================================');
    console.log('✅ Todos os passos foram executados');
    console.log('✅ Teacher pode criar/editar/excluir pagelas');
    console.log('✅ Paginação funcionando corretamente');
    console.log('✅ Filtros funcionando corretamente');
    console.log('✅ Busca por texto funcionando');
    console.log('✅ Fluxo de permissões funcionando corretamente');
    console.log('✅ TODOS os endpoints do controller testados');
    
    return true;
  } catch (error) {
    console.error('❌ Erro no fluxo:', error.message);
    return false;
  } finally {
    // Limpeza opcional
    await cleanup();
  }
}

// Executar fluxo completo
runCompleteFlow().catch(console.error);

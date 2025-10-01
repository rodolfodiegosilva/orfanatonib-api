const axios = require('axios');

// Configurações
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let token = '';
let shelterId = '';
let leaderIds = [];
let teacherIds = [];

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

async function getShelters() {
  console.log('🏠 Obtendo shelters disponíveis...');
  try {
    const response = await axios.get(`${BASE_URL}/shelters?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const shelters = response.data.items || [];
    if (shelters.length > 0) {
      shelterId = shelters[0].id;
      console.log(`✅ Shelter selecionado: ${shelters[0].name} (${shelterId})`);
    }
    return shelters;
  } catch (error) {
    console.error('❌ Erro ao obter shelters:', error.response?.data || error.message);
    return [];
  }
}

async function getLeaders() {
  console.log('👨‍💼 Obtendo líderes disponíveis...');
  try {
    const response = await axios.get(`${BASE_URL}/leader-profiles?limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const leaders = response.data.items || [];
    leaderIds = leaders.slice(0, 3).map(l => l.id);
    console.log(`✅ ${leaders.length} líderes encontrados, selecionados: ${leaderIds.length}`);
    return leaders;
  } catch (error) {
    console.error('❌ Erro ao obter líderes:', error.response?.data || error.message);
    return [];
  }
}

async function getTeachers() {
  console.log('👩‍🏫 Obtendo professores disponíveis...');
  try {
    const response = await axios.get(`${BASE_URL}/teacher-profiles?limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teachers = response.data.items || [];
    teacherIds = teachers.slice(0, 3).map(t => t.id);
    console.log(`✅ ${teachers.length} professores encontrados, selecionados: ${teacherIds.length}`);
    return teachers;
  } catch (error) {
    console.error('❌ Erro ao obter professores:', error.response?.data || error.message);
    return [];
  }
}

async function testAssignLeaders() {
  console.log('\n📋 Testando PATCH /shelters/:id/leaders (Atribuir Líderes)...');
  try {
    const response = await axios.patch(
      `${BASE_URL}/shelters/${shelterId}/leaders`,
      { leaderProfileIds: leaderIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Líderes atribuídos com sucesso!');
    console.log(`📊 Líderes vinculados: ${response.data.leaders.length}`);
    response.data.leaders.forEach(leader => {
      console.log(`   👨‍💼 ${leader.user.name} (${leader.id})`);
    });
    return true;
  } catch (error) {
    console.error('❌ Erro ao atribuir líderes:', error.response?.data || error.message);
    return false;
  }
}

async function testAssignTeachers() {
  console.log('\n📋 Testando PATCH /shelters/:id/teachers (Atribuir Professores)...');
  try {
    const response = await axios.patch(
      `${BASE_URL}/shelters/${shelterId}/teachers`,
      { teacherProfileIds: teacherIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Professores atribuídos com sucesso!');
    console.log(`📊 Professores vinculados: ${response.data.teachers.length}`);
    response.data.teachers.forEach(teacher => {
      console.log(`   👩‍🏫 ${teacher.user.name} (${teacher.id})`);
    });
    return true;
  } catch (error) {
    console.error('❌ Erro ao atribuir professores:', error.response?.data || error.message);
    return false;
  }
}

async function testRemoveLeaders() {
  console.log('\n📋 Testando DELETE /shelters/:id/leaders (Remover Líderes)...');
  try {
    // Remove apenas o primeiro líder
    const leadersToRemove = [leaderIds[0]];
    const response = await axios.delete(
      `${BASE_URL}/shelters/${shelterId}/leaders`,
      {
        data: { leaderProfileIds: leadersToRemove },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('✅ Líderes removidos com sucesso!');
    console.log(`📊 Líderes restantes: ${response.data.leaders.length}`);
    response.data.leaders.forEach(leader => {
      console.log(`   👨‍💼 ${leader.user.name} (${leader.id})`);
    });
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover líderes:', error.response?.data || error.message);
    return false;
  }
}

async function testRemoveTeachers() {
  console.log('\n📋 Testando DELETE /shelters/:id/teachers (Remover Professores)...');
  try {
    // Remove apenas o primeiro professor
    const teachersToRemove = [teacherIds[0]];
    const response = await axios.delete(
      `${BASE_URL}/shelters/${shelterId}/teachers`,
      {
        data: { teacherProfileIds: teachersToRemove },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('✅ Professores removidos com sucesso!');
    console.log(`📊 Professores restantes: ${response.data.teachers.length}`);
    response.data.teachers.forEach(teacher => {
      console.log(`   👩‍🏫 ${teacher.user.name} (${teacher.id})`);
    });
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover professores:', error.response?.data || error.message);
    return false;
  }
}

async function testShelterDetails() {
  console.log('\n📋 Testando GET /shelters/:id (Detalhes com Relacionamentos)...');
  try {
    const response = await axios.get(`${BASE_URL}/shelters/${shelterId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Detalhes do shelter obtidos!');
    console.log(`🏠 Shelter: ${response.data.name}`);
    console.log(`📍 Endereço: ${response.data.address.city}/${response.data.address.state}`);
    console.log(`👨‍💼 Líderes: ${response.data.leaders.length}`);
    console.log(`👩‍🏫 Professores: ${response.data.teachers.length}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao obter detalhes:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 AUTOMAÇÃO - TESTE DE RELACIONAMENTOS MANY-TO-MANY');
  console.log('============================================================');
  console.log('📋 Endpoints a serem testados:');
  console.log('   1. PATCH /shelters/:id/leaders - Atribuir líderes');
  console.log('   2. PATCH /shelters/:id/teachers - Atribuir professores');
  console.log('   3. DELETE /shelters/:id/leaders - Remover líderes');
  console.log('   4. DELETE /shelters/:id/teachers - Remover professores');
  console.log('   5. GET /shelters/:id - Verificar relacionamentos');
  console.log('============================================================\n');

  // Login
  if (!await login()) {
    console.log('❌ Falha no login. Encerrando...');
    return;
  }

  // Obter dados necessários
  const shelters = await getShelters();
  if (shelters.length === 0) {
    console.log('❌ Nenhum shelter encontrado. Encerrando...');
    return;
  }

  const leaders = await getLeaders();
  if (leaders.length === 0) {
    console.log('❌ Nenhum líder encontrado. Encerrando...');
    return;
  }

  const teachers = await getTeachers();
  if (teachers.length === 0) {
    console.log('❌ Nenhum professor encontrado. Encerrando...');
    return;
  }

  // Executar testes
  const results = [];
  
  results.push(await testAssignLeaders());
  results.push(await testAssignTeachers());
  results.push(await testShelterDetails());
  results.push(await testRemoveLeaders());
  results.push(await testRemoveTeachers());
  results.push(await testShelterDetails());

  // Resumo
  const successCount = results.filter(r => r).length;
  const totalTests = results.length;
  
  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA!');
  console.log('=====================================');
  console.log(`✅ Testes bem-sucedidos: ${successCount}/${totalTests}`);
  console.log(`❌ Testes com erro: ${totalTests - successCount}/${totalTests}`);
  console.log(`📊 Taxa de sucesso: ${((successCount / totalTests) * 100).toFixed(1)}%`);
  
  if (successCount === totalTests) {
    console.log('\n🎊 TODOS OS RELACIONAMENTOS MANY-TO-MANY FUNCIONANDO PERFEITAMENTE!');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.');
  }
}

main().catch(console.error);

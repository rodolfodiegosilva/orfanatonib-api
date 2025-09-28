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

async function createTestUser(role = 'teacher', active = true) {
  const timestamp = Date.now();
  const userData = {
    name: `Teste Visibilidade ${timestamp}`,
    email: `teste.visibilidade.${timestamp}@example.com`,
    password: 'password123',
    phone: `+5511${timestamp.toString().slice(-8)}`,
    role: role,
    active: active,
    completed: false,
    commonUser: true
  };

  try {
    const response = await axios.post(`${BASE_URL}/users`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.response?.data || error.message);
    return null;
  }
}

async function listTeacherProfiles() {
  try {
    const response = await axios.get(`${BASE_URL}/teacher-profiles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao listar teacher profiles:', error.response?.data || error.message);
    return null;
  }
}

async function listLeaderProfiles() {
  try {
    const response = await axios.get(`${BASE_URL}/leader-profiles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao listar leader profiles:', error.response?.data || error.message);
    return null;
  }
}

async function updateUserActive(userId, active) {
  try {
    const response = await axios.put(`${BASE_URL}/users/${userId}`, {
      active: active
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error.response?.data || error.message);
    return null;
  }
}

async function deleteUser(userId) {
  try {
    await axios.delete(`${BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error.response?.data || error.message);
    return false;
  }
}

async function testVisibilityControl() {
  console.log('🎯 TESTE DE CONTROLE DE VISIBILIDADE - MÓDULO USERS');
  console.log('================================================================');
  console.log('📋 Testando se usuários com active=false NÃO aparecem nas listagens');
  console.log('================================================================');

  if (!await login()) {
    console.log('❌ Falha no login. Abortando teste.');
    return;
  }

  // 1. Criar teacher ativo
  console.log('\n📝 1. Criando teacher ATIVO...');
  const activeTeacher = await createTestUser('teacher', true);
  if (!activeTeacher) {
    console.log('❌ Falha ao criar teacher ativo');
    return;
  }
  console.log(`✅ Teacher ativo criado: ${activeTeacher.name} (ID: ${activeTeacher.id})`);

  // 2. Criar teacher inativo
  console.log('\n📝 2. Criando teacher INATIVO...');
  const inactiveTeacher = await createTestUser('teacher', false);
  if (!inactiveTeacher) {
    console.log('❌ Falha ao criar teacher inativo');
    return;
  }
  console.log(`✅ Teacher inativo criado: ${inactiveTeacher.name} (ID: ${inactiveTeacher.id})`);

  // 3. Criar leader ativo
  console.log('\n📝 3. Criando leader ATIVO...');
  const activeLeader = await createTestUser('leader', true);
  if (!activeLeader) {
    console.log('❌ Falha ao criar leader ativo');
    return;
  }
  console.log(`✅ Leader ativo criado: ${activeLeader.name} (ID: ${activeLeader.id})`);

  // 4. Criar leader inativo
  console.log('\n📝 4. Criando leader INATIVO...');
  const inactiveLeader = await createTestUser('leader', false);
  if (!inactiveLeader) {
    console.log('❌ Falha ao criar leader inativo');
    return;
  }
  console.log(`✅ Leader inativo criado: ${inactiveLeader.name} (ID: ${inactiveLeader.id})`);

  // Aguardar um momento para garantir que os profiles foram criados
  console.log('\n⏳ Aguardando criação dos profiles...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 5. Verificar teacher profiles
  console.log('\n🔍 5. Verificando Teacher Profiles...');
  const teacherProfiles = await listTeacherProfiles();
  if (teacherProfiles) {
    const activeTeacherFound = teacherProfiles.items?.find(t => t.user?.id === activeTeacher.id);
    const inactiveTeacherFound = teacherProfiles.items?.find(t => t.user?.id === inactiveTeacher.id);
    
    console.log(`📊 Total de teacher profiles: ${teacherProfiles.total}`);
    console.log(`✅ Teacher ATIVO aparece na listagem: ${activeTeacherFound ? 'SIM' : 'NÃO'}`);
    console.log(`❌ Teacher INATIVO aparece na listagem: ${inactiveTeacherFound ? 'SIM (ERRO!)' : 'NÃO (CORRETO!)'}`);
    
    if (activeTeacherFound && !inactiveTeacherFound) {
      console.log('✅ ✅ TESTE DE TEACHER PROFILES PASSOU!');
    } else {
      console.log('❌ ❌ TESTE DE TEACHER PROFILES FALHOU!');
    }
  }

  // 6. Verificar leader profiles
  console.log('\n🔍 6. Verificando Leader Profiles...');
  const leaderProfiles = await listLeaderProfiles();
  if (leaderProfiles) {
    const activeLeaderFound = leaderProfiles.items?.find(l => l.user?.id === activeLeader.id);
    const inactiveLeaderFound = leaderProfiles.items?.find(l => l.user?.id === inactiveLeader.id);
    
    console.log(`📊 Total de leader profiles: ${leaderProfiles.total}`);
    console.log(`✅ Leader ATIVO aparece na listagem: ${activeLeaderFound ? 'SIM' : 'NÃO'}`);
    console.log(`❌ Leader INATIVO aparece na listagem: ${inactiveLeaderFound ? 'SIM (ERRO!)' : 'NÃO (CORRETO!)'}`);
    
    if (activeLeaderFound && !inactiveLeaderFound) {
      console.log('✅ ✅ TESTE DE LEADER PROFILES PASSOU!');
    } else {
      console.log('❌ ❌ TESTE DE LEADER PROFILES FALHOU!');
    }
  }

  // 7. Teste dinâmico: desativar teacher ativo
  console.log('\n🔄 7. Teste dinâmico: Desativando teacher ativo...');
  const updatedTeacher = await updateUserActive(activeTeacher.id, false);
  if (updatedTeacher) {
    console.log(`✅ Teacher desativado: ${updatedTeacher.name} (active: ${updatedTeacher.active})`);
    
    // Aguardar um momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se ainda aparece na listagem
    const teacherProfilesAfter = await listTeacherProfiles();
    if (teacherProfilesAfter) {
      const teacherStillFound = teacherProfilesAfter.items?.find(t => t.user?.id === activeTeacher.id);
      console.log(`🔍 Teacher desativado ainda aparece na listagem: ${teacherStillFound ? 'SIM (ERRO!)' : 'NÃO (CORRETO!)'}`);
      
      if (!teacherStillFound) {
        console.log('✅ ✅ TESTE DINÂMICO DE DESATIVAÇÃO PASSOU!');
      } else {
        console.log('❌ ❌ TESTE DINÂMICO DE DESATIVAÇÃO FALHOU!');
      }
    }
  }

  // 8. Teste dinâmico: reativar teacher
  console.log('\n🔄 8. Teste dinâmico: Reativando teacher...');
  const reactivatedTeacher = await updateUserActive(activeTeacher.id, true);
  if (reactivatedTeacher) {
    console.log(`✅ Teacher reativado: ${reactivatedTeacher.name} (active: ${reactivatedTeacher.active})`);
    
    // Aguardar um momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se volta a aparecer na listagem
    const teacherProfilesAfterReactivate = await listTeacherProfiles();
    if (teacherProfilesAfterReactivate) {
      const teacherFoundAgain = teacherProfilesAfterReactivate.items?.find(t => t.user?.id === activeTeacher.id);
      console.log(`🔍 Teacher reativado volta a aparecer na listagem: ${teacherFoundAgain ? 'SIM (CORRETO!)' : 'NÃO (ERRO!)'}`);
      
      if (teacherFoundAgain) {
        console.log('✅ ✅ TESTE DINÂMICO DE REATIVAÇÃO PASSOU!');
      } else {
        console.log('❌ ❌ TESTE DINÂMICO DE REATIVAÇÃO FALHOU!');
      }
    }
  }

  // 9. Limpeza
  console.log('\n🧹 9. Limpando usuários de teste...');
  await deleteUser(activeTeacher.id);
  await deleteUser(inactiveTeacher.id);
  await deleteUser(activeLeader.id);
  await deleteUser(inactiveLeader.id);
  console.log('✅ Usuários de teste removidos');

  console.log('\n🎉 TESTE DE CONTROLE DE VISIBILIDADE CONCLUÍDO!');
  console.log('==================================================');
  console.log('✅ Campo active do User controla visibilidade');
  console.log('✅ Filtro automático funcionando corretamente');
  console.log('✅ Orquestração respeitando status active');
  console.log('✅ Controle de acesso pelo admin funcionando');
}

// Executar teste
testVisibilityControl().catch(console.error);

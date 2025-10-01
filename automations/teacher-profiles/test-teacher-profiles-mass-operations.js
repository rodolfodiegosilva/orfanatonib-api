const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

async function getAllTeachers() {
  console.log('👩‍🏫 Obtendo todos os professores...');
  try {
    const response = await axios.get(`${BASE_URL}/teacher-profiles?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teachers = response.data.items || [];
    console.log(`✅ ${teachers.length} professores encontrados`);
    return teachers;
  } catch (error) {
    console.error('❌ Erro ao obter professores:', error.response?.data || error.message);
    return [];
  }
}

async function getAllShelters() {
  console.log('🏠 Obtendo todos os shelters...');
  try {
    const response = await axios.get(`${BASE_URL}/shelters?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const shelters = response.data.items || [];
    console.log(`✅ ${shelters.length} shelters encontrados`);
    return shelters;
  } catch (error) {
    console.error('❌ Erro ao obter shelters:', error.response?.data || error.message);
    return [];
  }
}

async function assignTeacherToShelter(teacherId, shelterId) {
  try {
    const response = await axios.patch(`${BASE_URL}/teacher-profiles/${teacherId}/assign-shelter`, {
      shelterId: shelterId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function unassignTeacherFromShelter(teacherId, shelterId) {
  try {
    const response = await axios.patch(`${BASE_URL}/teacher-profiles/${teacherId}/unassign-shelter`, {
      shelterId: shelterId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testMassAssignment() {
  console.log('\n📋 Testando atribuição em massa de professores...');
  
  const teachers = await getAllTeachers();
  const shelters = await getAllShelters();
  
  if (teachers.length === 0 || shelters.length === 0) {
    console.log('❌ Não há professores ou shelters suficientes para teste');
    return;
  }

  let assignedCount = 0;
  let failedCount = 0;
  const assignments = [];

  // Pegar professores sem shelter
  const teachersWithoutShelter = teachers.filter(t => !t.shelter);
  console.log(`📊 Professores sem shelter: ${teachersWithoutShelter.length}`);

  // Atribuir professores aos shelters de forma distribuída
  for (let i = 0; i < Math.min(teachersWithoutShelter.length, 10); i++) {
    const teacher = teachersWithoutShelter[i];
    const shelter = shelters[i % shelters.length]; // Distribuir entre os shelters
    
    console.log(`📝 Atribuindo ${teacher.user?.name} ao shelter ${shelter.name}...`);
    const result = await assignTeacherToShelter(teacher.id, shelter.id);
    
    if (result.success) {
      assignedCount++;
      assignments.push({
        teacher: teacher.user?.name,
        shelter: shelter.name,
        status: 'SUCCESS'
      });
      console.log(`✅ ${teacher.user?.name} atribuído ao ${shelter.name}`);
    } else {
      failedCount++;
      assignments.push({
        teacher: teacher.user?.name,
        shelter: shelter.name,
        status: 'FAILED',
        error: result.error
      });
      console.log(`❌ Falha ao atribuir ${teacher.user?.name}: ${JSON.stringify(result.error)}`);
    }
  }

  console.log(`\n📊 RESUMO DA ATRIBUIÇÃO EM MASSA:`);
  console.log(`✅ Atribuições bem-sucedidas: ${assignedCount}`);
  console.log(`❌ Atribuições com falha: ${failedCount}`);
  console.log(`📈 Taxa de sucesso: ${((assignedCount / (assignedCount + failedCount)) * 100).toFixed(2)}%`);

  return { assignments, assignedCount, failedCount };
}

async function testMassUnassignment() {
  console.log('\n📋 Testando desvinculação em massa de professores...');
  
  const teachers = await getAllTeachers();
  
  if (teachers.length === 0) {
    console.log('❌ Não há professores para teste');
    return;
  }

  // Pegar professores com shelter
  const teachersWithShelter = teachers.filter(t => t.shelter);
  console.log(`📊 Professores com shelter: ${teachersWithShelter.length}`);

  if (teachersWithShelter.length === 0) {
    console.log('⚠️ Nenhum professor com shelter para desvincular');
    return;
  }

  let unassignedCount = 0;
  let failedCount = 0;
  const unassignments = [];

  // Desvincular até 5 professores
  const teachersToUnassign = teachersWithShelter.slice(0, 5);
  
  for (const teacher of teachersToUnassign) {
    console.log(`📝 Desvinculando ${teacher.user?.name} do shelter ${teacher.shelter?.name}...`);
    const result = await unassignTeacherFromShelter(teacher.id, teacher.shelter?.id);
    
    if (result.success) {
      unassignedCount++;
      unassignments.push({
        teacher: teacher.user?.name,
        shelter: teacher.shelter?.name,
        status: 'SUCCESS'
      });
      console.log(`✅ ${teacher.user?.name} desvinculado do ${teacher.shelter?.name}`);
    } else {
      failedCount++;
      unassignments.push({
        teacher: teacher.user?.name,
        shelter: teacher.shelter?.name,
        status: 'FAILED',
        error: result.error
      });
      console.log(`❌ Falha ao desvincular ${teacher.user?.name}: ${JSON.stringify(result.error)}`);
    }
  }

  console.log(`\n📊 RESUMO DA DESVINCULAÇÃO EM MASSA:`);
  console.log(`✅ Desvinculações bem-sucedidas: ${unassignedCount}`);
  console.log(`❌ Desvinculações com falha: ${failedCount}`);
  console.log(`📈 Taxa de sucesso: ${((unassignedCount / (unassignedCount + failedCount)) * 100).toFixed(2)}%`);

  return { unassignments, unassignedCount, failedCount };
}

async function testShelterDistribution() {
  console.log('\n📋 Testando distribuição de professores por shelter...');
  
  const teachers = await getAllTeachers();
  const shelters = await getAllShelters();
  
  if (teachers.length === 0 || shelters.length === 0) {
    console.log('❌ Não há professores ou shelters suficientes para teste');
    return;
  }

  // Contar professores por shelter
  const shelterDistribution = {};
  
  for (const teacher of teachers) {
    if (teacher.shelter) {
      const shelterName = teacher.shelter.name;
      shelterDistribution[shelterName] = (shelterDistribution[shelterName] || 0) + 1;
    }
  }

  console.log('\n📊 DISTRIBUIÇÃO DE PROFESSORES POR SHELTER:');
  console.log('================================================================================');
  
  let totalWithShelter = 0;
  for (const [shelterName, count] of Object.entries(shelterDistribution)) {
    console.log(`🏠 ${shelterName}: ${count} professor(es)`);
    totalWithShelter += count;
  }
  
  const totalWithoutShelter = teachers.length - totalWithShelter;
  console.log(`📝 Sem shelter: ${totalWithoutShelter} professor(es)`);
  console.log(`📊 Total: ${teachers.length} professores`);
  console.log('================================================================================');

  return { shelterDistribution, totalWithShelter, totalWithoutShelter };
}

async function testEdgeCases() {
  console.log('\n📋 Testando casos extremos...');
  
  const edgeCases = [];
  
  // 1. Tentar atribuir professor já vinculado a outro shelter
  console.log('🔸 Teste 1: Atribuir professor já vinculado...');
  try {
    const teachersWithShelter = await axios.get(`${BASE_URL}/teacher-profiles?hasShelter=true&limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (teachersWithShelter.data.items.length > 0) {
      const teacher = teachersWithShelter.data.items[0];
      const shelters = await axios.get(`${BASE_URL}/shelters?limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (shelters.data.items.length > 0) {
        const differentShelter = shelters.data.items[0];
        if (differentShelter.id !== teacher.shelter?.id) {
          const result = await assignTeacherToShelter(teacher.id, differentShelter.id);
          edgeCases.push({
            test: 'Atribuir professor já vinculado',
            expected: 'FAIL',
            result: result.success ? 'PASS' : 'FAIL',
            error: result.error
          });
        }
      }
    }
  } catch (error) {
    edgeCases.push({
      test: 'Atribuir professor já vinculado',
      expected: 'FAIL',
      result: 'PASS',
      error: error.response?.data || error.message
    });
  }

  // 2. Tentar desvincular professor sem shelter
  console.log('🔸 Teste 2: Desvincular professor sem shelter...');
  try {
    const teachersWithoutShelter = await axios.get(`${BASE_URL}/teacher-profiles?hasShelter=false&limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (teachersWithoutShelter.data.items.length > 0) {
      const teacher = teachersWithoutShelter.data.items[0];
      const result = await unassignTeacherFromShelter(teacher.id, '00000000-0000-0000-0000-000000000000');
      edgeCases.push({
        test: 'Desvincular professor sem shelter',
        expected: 'FAIL',
        result: result.success ? 'FAIL' : 'PASS',
        error: result.error
      });
    }
  } catch (error) {
    edgeCases.push({
      test: 'Desvincular professor sem shelter',
      expected: 'FAIL',
      result: 'PASS',
      error: error.response?.data || error.message
    });
  }

  console.log('\n📊 RESULTADOS DOS CASOS EXTREMOS:');
  console.log('================================================================================');
  edgeCases.forEach(edgeCase => {
    const status = edgeCase.result === edgeCase.expected ? '✅' : '❌';
    console.log(`${status} ${edgeCase.test}: ${edgeCase.result} (esperado: ${edgeCase.expected})`);
    if (edgeCase.error) {
      console.log(`   Erro: ${JSON.stringify(edgeCase.error)}`);
    }
  });
  console.log('================================================================================');

  return edgeCases;
}

async function runMassOperationsTest() {
  console.log('🎯 AUTOMAÇÃO - OPERAÇÕES EM MASSA DE TEACHER PROFILES');
  console.log('============================================================');
  console.log('📋 Operações a serem testadas:');
  console.log('   1. Atribuição em massa de professores');
  console.log('   2. Desvinculação em massa de professores');
  console.log('   3. Distribuição por shelter');
  console.log('   4. Casos extremos');
  console.log('============================================================');

  if (!(await login())) {
    console.error('❌ Falha no login. Encerrando automação.');
    return;
  }

  const results = {};

  // Executar testes
  results.massAssignment = await testMassAssignment();
  results.massUnassignment = await testMassUnassignment();
  results.shelterDistribution = await testShelterDistribution();
  results.edgeCases = await testEdgeCases();

  // Salvar resultados
  const resultsDir = 'docs/results/teacher-profiles';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(resultsDir, `mass-operations-test-${timestamp}.json`);
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA!');
  console.log('==================================================');
  console.log(`💾 Resultados salvos em: ${filename}`);
  console.log('\n🏁 Script finalizado!');
}

runMassOperationsTest();

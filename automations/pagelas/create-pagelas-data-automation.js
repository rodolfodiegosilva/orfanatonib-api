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

async function getRequiredData() {
  console.log('📊 Obtendo dados necessários...');
  
  try {
    // Obter sheltered disponíveis
    console.log('  👶 Obtendo sheltered...');
    const shelteredResponse = await axios.get(`${BASE_URL}/sheltered?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sheltered = shelteredResponse.data.data || shelteredResponse.data.items || [];
    console.log(`    ✅ ${sheltered.length} sheltered encontrados`);
    
    // Obter teachers disponíveis
    console.log('  👨‍🏫 Obtendo teachers...');
    const teachersResponse = await axios.get(`${BASE_URL}/teacher-profiles?limit=20`, {
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

function getRandomBoolean() {
  return Math.random() > 0.5;
}

function getRandomNotes() {
  const notes = [
    'Participou ativamente da aula',
    'Precisou de atenção especial',
    'Demonstrou interesse na meditação',
    'Recitou o versículo com clareza',
    'Comportamento exemplar',
    'Precisou de orientação adicional',
    'Colaborou com os colegas',
    'Mostrou dificuldade na concentração',
    'Excelente participação',
    'Precisou de reforço positivo'
  ];
  return Math.random() > 0.7 ? notes[Math.floor(Math.random() * notes.length)] : null;
}

function getRandomDateInYear(year) {
  // Calcular uma data aleatória dentro do ano
  const startDate = new Date(year, 0, 1);
  const dayOfYear = Math.floor(Math.random() * 365);
  const date = new Date(startDate.getTime() + dayOfYear * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

async function createPagela(sheltered, teacher, year, visit) {
  try {
    const pagelaData = {
      shelteredId: sheltered.id,
      teacherProfileId: teacher.id,
      referenceDate: getRandomDateInYear(year),
      visit: visit,
      year: year,
      present: getRandomBoolean(),
      notes: getRandomNotes()
    };

    const response = await axios.post(`${BASE_URL}/pagelas`, pagelaData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('Já existe Pagela')) {
      console.log(`    ⚠️ Pagela já existe para ${sheltered.name} - visita ${visit}/${year}`);
      return null;
    }
    throw error;
  }
}

async function createPagelasData() {
  console.log('🎯 AUTOMAÇÃO DE CRIAÇÃO DE DADOS - MÓDULO PAGELAS');
  console.log('==================================================');
  console.log('📋 Criando pagelas de teste para diferentes cenários...');

  if (!await login()) {
    console.log('❌ Falha no login. Abortando criação de dados.');
    return;
  }

  // Obter dados necessários
  const { sheltered, teachers } = await getRequiredData();
  
  if (sheltered.length === 0) {
    console.log('⚠️ Nenhum sheltered encontrado para criar pagelas');
    return;
  }

  console.log(`📊 Dados disponíveis:`);
  console.log(`   👶 Sheltered: ${sheltered.length}`);
  console.log(`   👨‍🏫 Teachers: ${teachers.length}`);

  const createdPagelas = [];
  const currentYear = 2025;
  const visitsToCreate = [1, 2, 3, 4, 5]; // Primeiras 5 visitas do ano

  console.log('\n🏗️ Criando pagelas...');

  for (let visit of visitsToCreate) {
    console.log(`\n📅 Visita ${visit}/${currentYear}:`);
    
    for (let i = 0; i < Math.min(sheltered.length, 10); i++) {
      const shelteredItem = sheltered[i];
      const teacher = teachers[i % teachers.length];
      
      try {
        console.log(`  📝 Criando pagela ${i + 1}/10 para ${shelteredItem.name}...`);
        
        const pagela = await createPagela(shelteredItem, teacher, currentYear, visit);
        
        if (pagela) {
          createdPagelas.push(pagela);
          console.log(`    ✅ Pagela criada - ID: ${pagela.id}`);
          console.log(`    📊 Presente: ${pagela.present ? 'Sim' : 'Não'}`);
          if (pagela.notes) {
            console.log(`    📝 Notas: ${pagela.notes}`);
          }
        }
        
        // Pequena pausa para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`    ❌ Erro ao criar pagela para ${shelteredItem.name}:`, error.response?.data?.message || error.message);
      }
    }
  }

  // Criar algumas pagelas para anos anteriores
  console.log('\n📅 Criando pagelas para anos anteriores...');
  const previousYears = [2024, 2023];
  
  for (let year of previousYears) {
    console.log(`\n📅 Ano ${year}:`);
    
    for (let visit of [10, 15, 20]) { // Algumas visitas do ano
      for (let i = 0; i < Math.min(sheltered.length, 5); i++) {
        const shelteredItem = sheltered[i];
        const teacher = teachers[i % teachers.length];
        
        try {
          console.log(`  📝 Criando pagela para ${shelteredItem.name} - visita ${visit}/${year}...`);
          
          const pagela = await createPagela(shelteredItem, teacher, year, visit);
          
          if (pagela) {
            createdPagelas.push(pagela);
            console.log(`    ✅ Pagela criada - ID: ${pagela.id}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`    ❌ Erro ao criar pagela:`, error.response?.data?.message || error.message);
        }
      }
    }
  }

  // Salvar resultados
  const results = {
    created_at: new Date().toISOString(),
    total_created: createdPagelas.length,
    pagelas: createdPagelas,
    summary: {
      sheltered_used: sheltered.slice(0, 10).map(s => ({ id: s.id, name: s.name })),
      teachers_used: teachers.slice(0, 10).map(t => ({ id: t.id, name: t.user?.name })),
      visits_created: visitsToCreate,
      years_created: [currentYear, ...previousYears]
    }
  };

  const fs = require('fs');
  const filename = `docs/results/pagelas/created-pagelas-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  console.log('\n🎉 AUTOMAÇÃO DE CRIAÇÃO CONCLUÍDA!');
  console.log('==================================');
  console.log(`✅ Total de pagelas criadas: ${createdPagelas.length}`);
  console.log(`📁 Arquivo salvo: ${filename}`);
  console.log(`📊 Resumo:`);
  console.log(`   👶 Sheltered utilizados: ${results.summary.sheltered_used.length}`);
  console.log(`   👨‍🏫 Teachers utilizados: ${results.summary.teachers_used.length}`);
  console.log(`   📅 Visitas criadas: ${results.summary.visits_created.join(', ')}`);
  console.log(`   📅 Anos criados: ${results.summary.years_created.join(', ')}`);
}

// Executar automação
createPagelasData().catch(console.error);

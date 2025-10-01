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

async function getAllSheltered() {
  console.log('👶 Obtendo todos os abrigados...');
  try {
    const response = await axios.get(`${BASE_URL}/sheltered?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sheltered = response.data.data || response.data.items || [];
    console.log(`✅ ${sheltered.length} abrigados encontrados`);
    return sheltered;
  } catch (error) {
    console.error('❌ Erro ao obter abrigados:', error.response?.data || error.message);
    return [];
  }
}

async function getAllTeachers() {
  console.log('👨‍🏫 Obtendo todos os professores...');
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

function getRandomBoolean() {
  return Math.random() > 0.3; // 70% de chance de estar presente
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
    'Precisou de reforço positivo',
    'Demonstrou liderança',
    'Precisou de paciência extra',
    'Mostrou progresso significativo',
    'Participou com entusiasmo',
    'Precisou de encorajamento'
  ];
  return Math.random() > 0.6 ? notes[Math.floor(Math.random() * notes.length)] : null;
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
      return null; // Pagela já existe
    }
    throw error;
  }
}

async function createPagelasForAllSheltered() {
  console.log('🎯 AUTOMAÇÃO - CRIAR PAGELAS PARA TODOS OS ABRIGADOS');
  console.log('=====================================================');
  console.log('📋 Criando pagelas para todos os abrigados disponíveis...');

  if (!await login()) {
    console.log('❌ Falha no login. Abortando criação de pagelas.');
    return;
  }

  // Obter todos os dados necessários
  const [sheltered, teachers] = await Promise.all([
    getAllSheltered(),
    getAllTeachers()
  ]);
  
  if (sheltered.length === 0) {
    console.log('⚠️ Nenhum abrigado encontrado para criar pagelas');
    return;
  }

  if (teachers.length === 0) {
    console.log('⚠️ Nenhum professor encontrado para criar pagelas');
    return;
  }

  console.log(`📊 Dados disponíveis:`);
  console.log(`   👶 Abrigados: ${sheltered.length}`);
  console.log(`   👨‍🏫 Professores: ${teachers.length}`);

  const createdPagelas = [];
  const currentYear = 2025;
  const visitsToCreate = [6, 7, 8, 9, 10]; // Próximas 5 visitas do ano

  console.log('\n🏗️ Criando pagelas para todos os abrigados...');

  for (let visit of visitsToCreate) {
    console.log(`\n📅 Visita ${visit}/${currentYear}:`);
    
    let createdInThisVisit = 0;
    let skippedInThisVisit = 0;
    
    for (let i = 0; i < sheltered.length; i++) {
      const shelteredItem = sheltered[i];
      const teacher = teachers[i % teachers.length]; // Distribui professores entre abrigados
      
      try {
        console.log(`  📝 [${i + 1}/${sheltered.length}] Criando pagela para ${shelteredItem.name}...`);
        
        const pagela = await createPagela(shelteredItem, teacher, currentYear, visit);
        
        if (pagela) {
          createdPagelas.push(pagela);
          createdInThisVisit++;
          console.log(`    ✅ Pagela criada - ID: ${pagela.id}`);
          console.log(`    📊 Presente: ${pagela.present ? 'Sim' : 'Não'}`);
          if (pagela.notes) {
            console.log(`    📝 Notas: ${pagela.notes}`);
          }
        } else {
          skippedInThisVisit++;
          console.log(`    ⚠️ Pagela já existe para ${shelteredItem.name} - visita ${visit}/${currentYear}`);
        }
        
        // Pequena pausa para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`    ❌ Erro ao criar pagela para ${shelteredItem.name}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log(`  📊 Resumo da visita ${visit}: ${createdInThisVisit} criadas, ${skippedInThisVisit} já existiam`);
  }

  // Criar pagelas para anos anteriores também
  console.log('\n📅 Criando pagelas para anos anteriores...');
  const previousYears = [2024, 2023];
  
  for (let year of previousYears) {
    console.log(`\n📅 Ano ${year}:`);
    
    for (let visit of [25, 30, 35]) { // Algumas visitas do ano
      let createdInThisVisit = 0;
      let skippedInThisVisit = 0;
      
      for (let i = 0; i < Math.min(sheltered.length, 20); i++) { // Limita a 20 por visita em anos anteriores
        const shelteredItem = sheltered[i];
        const teacher = teachers[i % teachers.length];
        
        try {
          console.log(`  📝 [${i + 1}/20] Criando pagela para ${shelteredItem.name} - visita ${visit}/${year}...`);
          
          const pagela = await createPagela(shelteredItem, teacher, year, visit);
          
          if (pagela) {
            createdPagelas.push(pagela);
            createdInThisVisit++;
            console.log(`    ✅ Pagela criada - ID: ${pagela.id}`);
          } else {
            skippedInThisVisit++;
            console.log(`    ⚠️ Pagela já existe`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.error(`    ❌ Erro ao criar pagela:`, error.response?.data?.message || error.message);
        }
      }
      
      console.log(`  📊 Resumo da visita ${visit}/${year}: ${createdInThisVisit} criadas, ${skippedInThisVisit} já existiam`);
    }
  }

  // Salvar resultados
  const results = {
    created_at: new Date().toISOString(),
    total_created: createdPagelas.length,
    total_sheltered: sheltered.length,
    total_teachers: teachers.length,
    pagelas: createdPagelas,
    summary: {
      sheltered_used: sheltered.map(s => ({ id: s.id, name: s.name })),
      teachers_used: teachers.map(t => ({ id: t.id, name: t.user?.name })),
      visits_created: visitsToCreate,
      years_created: [currentYear, ...previousYears],
      visits_per_year: {
        2025: visitsToCreate,
        2024: [25, 30, 35],
        2023: [25, 30, 35]
      }
    }
  };

  const fs = require('fs');
  const filename = `docs/results/pagelas/created-pagelas-all-sheltered-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  console.log('\n🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('=====================================');
  console.log(`✅ Total de pagelas criadas: ${createdPagelas.length}`);
  console.log(`👶 Total de abrigados processados: ${sheltered.length}`);
  console.log(`👨‍🏫 Total de professores utilizados: ${teachers.length}`);
  console.log(`📁 Arquivo salvo: ${filename}`);
  console.log(`📊 Resumo:`);
  console.log(`   📅 Visitas criadas em 2025: ${visitsToCreate.join(', ')}`);
  console.log(`   📅 Visitas criadas em 2024: 25, 30, 35`);
  console.log(`   📅 Visitas criadas em 2023: 25, 30, 35`);
  console.log(`   🎯 Taxa de sucesso: ${((createdPagelas.length / (sheltered.length * (visitsToCreate.length + 6))) * 100).toFixed(1)}%`);
}

// Executar automação
createPagelasForAllSheltered().catch(console.error);

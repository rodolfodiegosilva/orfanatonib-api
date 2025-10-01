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
    const response = await axios.get(`${BASE_URL}/sheltered?limit=200`, {
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
  return Math.random() > 0.25; // 75% de chance de estar presente
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
    'Precisou de encorajamento',
    'Foi muito colaborativo',
    'Demonstrou criatividade',
    'Precisou de motivação',
    'Foi um exemplo para os outros',
    'Mostrou interesse em aprender',
    'Precisou de disciplina',
    'Demonstrou responsabilidade',
    'Foi muito atencioso',
    'Precisou de orientação espiritual',
    'Mostrou crescimento pessoal'
  ];
  return Math.random() > 0.5 ? notes[Math.floor(Math.random() * notes.length)] : null;
}

function getRandomDateInYear(year) {
  // Calcular uma data aleatória dentro do ano
  const startDate = new Date(year, 0, 1);
  const dayOfYear = Math.floor(Math.random() * 365);
  const date = new Date(startDate.getTime() + dayOfYear * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

function generateVisitsForYear(year) {
  // Gerar 10 visitas distribuídas ao longo do ano
  const visits = [];
  const visitsPerMonth = Math.floor(10 / 12); // ~0.8 visitas por mês
  const extraVisits = 10 % 12; // visitas extras para distribuir
  
  let visitNumber = 1;
  
  for (let month = 0; month < 12; month++) {
    const visitsThisMonth = visitsPerMonth + (month < extraVisits ? 1 : 0);
    
    for (let i = 0; i < visitsThisMonth; i++) {
      if (visitNumber <= 10) {
        visits.push(visitNumber);
        visitNumber++;
      }
    }
  }
  
  return visits;
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

async function createPagelasForAllYears() {
  console.log('🎯 AUTOMAÇÃO MASSIVA - 10 PAGELAS POR ANO POR ABRIGADO');
  console.log('========================================================');
  console.log('📋 Criando 10 pagelas por ano para cada abrigado (últimos 10 anos)...');

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
  const currentYear = new Date().getFullYear();
  const yearsToCreate = [];
  
  // Gerar anos dos últimos 10 anos
  for (let i = 0; i < 10; i++) {
    yearsToCreate.push(currentYear - i);
  }

  console.log(`📅 Anos a serem processados: ${yearsToCreate.join(', ')}`);

  let totalProcessed = 0;
  let totalCreated = 0;
  let totalSkipped = 0;

  for (let year of yearsToCreate) {
    console.log(`\n📅 PROCESSANDO ANO ${year}:`);
    console.log('='.repeat(50));
    
    const visitsForYear = generateVisitsForYear(year);
    console.log(`📋 Visitas para ${year}: ${visitsForYear.join(', ')}`);
    
    let yearCreated = 0;
    let yearSkipped = 0;
    
    for (let visit of visitsForYear) {
      console.log(`\n📅 Visita ${visit}/${year}:`);
      
      let visitCreated = 0;
      let visitSkipped = 0;
      
      for (let i = 0; i < sheltered.length; i++) {
        const shelteredItem = sheltered[i];
        const teacher = teachers[i % teachers.length]; // Distribui professores entre abrigados
        
        try {
          totalProcessed++;
          
          if (totalProcessed % 100 === 0) {
            console.log(`  📊 Progresso geral: ${totalProcessed} processadas, ${totalCreated} criadas`);
          }
          
          const pagela = await createPagela(shelteredItem, teacher, year, visit);
          
          if (pagela) {
            createdPagelas.push(pagela);
            totalCreated++;
            yearCreated++;
            visitCreated++;
            
            if (visitCreated <= 5) { // Mostra apenas os primeiros 5 de cada visita
              console.log(`    ✅ [${i + 1}/${sheltered.length}] ${shelteredItem.name} - ID: ${pagela.id}`);
              console.log(`       📊 Presente: ${pagela.present ? 'Sim' : 'Não'}`);
              if (pagela.notes) {
                console.log(`       📝 Notas: ${pagela.notes}`);
              }
            }
          } else {
            totalSkipped++;
            yearSkipped++;
            visitSkipped++;
          }
          
          // Pequena pausa para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 25));
          
        } catch (error) {
          console.error(`    ❌ Erro ao criar pagela para ${shelteredItem.name}:`, error.response?.data?.message || error.message);
        }
      }
      
      console.log(`  📊 Resumo da visita ${visit}/${year}: ${visitCreated} criadas, ${visitSkipped} já existiam`);
    }
    
    console.log(`\n📊 RESUMO DO ANO ${year}:`);
    console.log(`   ✅ Pagelas criadas: ${yearCreated}`);
    console.log(`   ⚠️ Pagelas já existiam: ${yearSkipped}`);
    console.log(`   📈 Taxa de sucesso: ${((yearCreated / (sheltered.length * visitsForYear.length)) * 100).toFixed(1)}%`);
  }

  // Salvar resultados
  const results = {
    created_at: new Date().toISOString(),
    total_processed: totalProcessed,
    total_created: totalCreated,
    total_skipped: totalSkipped,
    total_sheltered: sheltered.length,
    total_teachers: teachers.length,
    years_processed: yearsToCreate,
    success_rate: ((totalCreated / totalProcessed) * 100).toFixed(2),
    pagelas: createdPagelas.slice(0, 100), // Salva apenas as primeiras 100 para não sobrecarregar o arquivo
    summary: {
      sheltered_used: sheltered.map(s => ({ id: s.id, name: s.name })),
      teachers_used: teachers.map(t => ({ id: t.id, name: t.user?.name })),
      years_created: yearsToCreate,
      visits_per_year: yearsToCreate.map(year => ({
        year: year,
        visits: generateVisitsForYear(year)
      }))
    }
  };

  const fs = require('fs');
  const filename = `docs/results/pagelas/created-pagelas-massive-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  console.log('\n🎉 AUTOMAÇÃO MASSIVA CONCLUÍDA COM SUCESSO!');
  console.log('=============================================');
  console.log(`✅ Total de pagelas processadas: ${totalProcessed}`);
  console.log(`✅ Total de pagelas criadas: ${totalCreated}`);
  console.log(`⚠️ Total de pagelas já existiam: ${totalSkipped}`);
  console.log(`👶 Total de abrigados processados: ${sheltered.length}`);
  console.log(`👨‍🏫 Total de professores utilizados: ${teachers.length}`);
  console.log(`📅 Anos processados: ${yearsToCreate.join(', ')}`);
  console.log(`📁 Arquivo salvo: ${filename}`);
  console.log(`📊 Resumo:`);
  console.log(`   🎯 Taxa de sucesso geral: ${results.success_rate}%`);
  console.log(`   📈 Pagelas por abrigado por ano: 10`);
  console.log(`   📅 Período coberto: ${yearsToCreate.length} anos`);
  console.log(`   🔢 Total esperado: ${sheltered.length * yearsToCreate.length * 10}`);
  console.log(`   ✅ Total criado: ${totalCreated}`);
  
  // Estatísticas por ano
  console.log(`\n📊 ESTATÍSTICAS POR ANO:`);
  yearsToCreate.forEach(year => {
    const yearVisits = generateVisitsForYear(year);
    const expectedForYear = sheltered.length * yearVisits.length;
    const actualForYear = createdPagelas.filter(p => p.year === year).length;
    console.log(`   ${year}: ${actualForYear}/${expectedForYear} pagelas (${((actualForYear/expectedForYear)*100).toFixed(1)}%)`);
  });
}

// Executar automação
createPagelasForAllYears().catch(console.error);

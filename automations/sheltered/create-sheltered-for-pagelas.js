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

async function getAvailableShelters() {
  console.log('🏠 Obtendo shelters disponíveis...');
  try {
    const response = await axios.get(`${BASE_URL}/shelters?limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const shelters = response.data.data || response.data.items || [];
    console.log(`✅ ${shelters.length} shelters encontrados`);
    return shelters;
  } catch (error) {
    console.error('❌ Erro ao obter shelters:', error.response?.status);
    return [];
  }
}

async function createSheltered(shelteredData, shelterId) {
  try {
    const response = await axios.post(`${BASE_URL}/sheltered`, {
      ...shelteredData,
      shelterId: shelterId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

async function createShelteredData() {
  console.log('🎯 AUTOMAÇÃO DE CRIAÇÃO DE SHELTERED PARA PAGELAS');
  console.log('==================================================');
  console.log('📋 Criando sheltered com shelters válidos...');

  if (!await login()) {
    console.log('❌ Falha no login. Abortando criação de dados.');
    return;
  }

  // Obter shelters disponíveis
  const shelters = await getAvailableShelters();
  
  if (shelters.length === 0) {
    console.log('⚠️ Nenhum shelter encontrado para criar sheltered');
    return;
  }

  console.log(`📊 Shelters disponíveis: ${shelters.length}`);

  // Dados de sheltered para criar
  const shelteredNames = [
    'Ana Silva', 'Bruno Santos', 'Carlos Oliveira', 'Diana Costa', 'Eduardo Lima',
    'Fernanda Rocha', 'Gabriel Alves', 'Helena Pereira', 'Igor Martins', 'Julia Ferreira',
    'Kleber Souza', 'Larissa Barbosa', 'Marcos Dias', 'Natália Campos', 'Otávio Nunes',
    'Patrícia Vieira', 'Rafael Mendes', 'Sandra Gomes', 'Thiago Ramos', 'Vanessa Lopes'
  ];

  const createdSheltered = [];
  const errors = [];

  console.log('\n🏗️ Criando sheltered...');

  for (let i = 0; i < Math.min(shelteredNames.length, 20); i++) {
    const name = shelteredNames[i];
    const shelter = shelters[i % shelters.length]; // Rotacionar entre shelters
    
    // Calcular data de nascimento (idade entre 5 e 14 anos)
    const age = Math.floor(Math.random() * 10) + 5;
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    const birthDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
    
    const shelteredData = {
      name: name,
      birthDate: birthDate,
      gender: Math.random() > 0.5 ? 'Masculino' : 'Feminino',
      guardianName: Math.random() > 0.3 ? `Guardião de ${name}` : undefined, // 70% têm guardião
      guardianPhone: Math.random() > 0.3 ? `+5511${Math.floor(Math.random() * 900000000) + 100000000}` : undefined
    };

    try {
      console.log(`📝 Criando sheltered ${i + 1}/20: ${name}...`);
      console.log(`   🏠 Shelter: ${shelter.name} (${shelter.id})`);
      
      const sheltered = await createSheltered(shelteredData, shelter.id);
      
      createdSheltered.push(sheltered);
      console.log(`   ✅ Sheltered criado - ID: ${sheltered.id}`);
      console.log(`   👶 Nome: ${sheltered.name}, Idade: ${sheltered.age}`);
      
      // Pequena pausa para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error(`   ❌ Erro ao criar sheltered ${name}:`, errorMsg);
      errors.push({ name, error: errorMsg });
    }
  }

  // Salvar resultados
  const results = {
    created_at: new Date().toISOString(),
    total_created: createdSheltered.length,
    total_errors: errors.length,
    sheltered: createdSheltered,
    errors: errors,
    summary: {
      shelters_used: shelters.slice(0, 20).map(s => ({ id: s.id, name: s.name })),
      success_rate: `${((createdSheltered.length / shelteredNames.length) * 100).toFixed(1)}%`
    }
  };

  const fs = require('fs');
  const filename = `docs/results/sheltered/created-sheltered-for-pagelas-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  console.log('\n🎉 AUTOMAÇÃO DE CRIAÇÃO CONCLUÍDA!');
  console.log('==================================');
  console.log(`✅ Total de sheltered criados: ${createdSheltered.length}`);
  console.log(`❌ Total de erros: ${errors.length}`);
  console.log(`📁 Arquivo salvo: ${filename}`);
  console.log(`📊 Taxa de sucesso: ${results.summary.success_rate}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Erros encontrados:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.name}: ${error.error}`);
    });
  }

  return createdSheltered;
}

// Executar automação
createShelteredData().catch(console.error);

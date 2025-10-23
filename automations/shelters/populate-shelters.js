const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';

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

// ==================== FUNÇÃO PARA CRIAR MEDIA ITEM ====================

async function createMediaItem(shelterId, imageUrl) {
  const mediaData = {
    title: 'Foto do Abrigo',
    description: 'Imagem principal do abrigo',
    mediaType: 'IMAGE',
    uploadType: 'LINK',
    url: imageUrl,
    isLocalFile: false,
    targetId: shelterId,
    targetType: 'ShelterEntity'
  };
  
  try {
    const response = await makeRequest('POST', '/media-items', mediaData);
    if (response && response.status === 201) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.log('    ⚠️ Não foi possível criar media item via API');
    return null;
  }
}

// ==================== POPULAR SHELTERS ====================

async function populateShelters() {
  console.log('\n📦 Carregando dados mockados...');
  
  // Carregar dados do JSON
  const mockDataPath = path.join(__dirname, 'shelters-mock-data.json');
  const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));
  
  console.log(`✅ ${mockData.length} shelters carregados do arquivo\n`);

  let created = 0;
  let failed = 0;
  const createdShelters = [];

  for (let i = 0; i < mockData.length; i++) {
    const shelterData = mockData[i];
    console.log(`📝 [${i + 1}/${mockData.length}] Criando: ${shelterData.name}`);

    // Preparar dados para a API (sem imageUrl)
    const apiData = {
      name: shelterData.name,
      description: shelterData.description,
      address: shelterData.address
    };

    // Criar shelter
    const response = await makeRequest('POST', '/shelters', apiData);
    
    if (response && response.status === 201) {
      const shelter = response.data;
      console.log(`    ✅ Shelter criado: ${shelter.id}`);
      console.log(`    📝 Descrição: ${shelter.description?.substring(0, 50)}...`);
      
      // Tentar criar media item
      const mediaItem = await createMediaItem(shelter.id, shelterData.imageUrl);
      if (mediaItem) {
        console.log(`    🖼️ Media item criado: ${mediaItem.id}`);
      } else {
        console.log(`    ⚠️ Media item não criado (use script SQL alternativo)`);
      }
      
      createdShelters.push({
        ...shelter,
        imageUrl: shelterData.imageUrl
      });
      created++;
    } else {
      console.log(`    ❌ Falha ao criar shelter`);
      failed++;
    }

    // Pequeno delay para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Salvar resultado
  if (createdShelters.length > 0) {
    const outputPath = path.join(__dirname, `created-shelters-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(createdShelters, null, 2));
    console.log(`\n💾 Resultado salvo em: ${outputPath}`);
  }

  console.log('\n📊 Resumo:');
  console.log(`  ✅ Shelters criados: ${created}`);
  console.log(`  ❌ Falhas: ${failed}`);
  console.log(`  📊 Total: ${mockData.length}`);

  return createdShelters;
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runPopulation() {
  console.log('🎯 POPULANDO BANCO COM SHELTERS MOCKADOS');
  console.log('=========================================');
  console.log('📋 Este script irá:');
  console.log('   1. Fazer login como admin');
  console.log('   2. Criar shelters com descrição');
  console.log('   3. Criar media items (imagens)');
  console.log('   4. Salvar resultado em arquivo JSON');
  console.log('=========================================\n');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Falha no login. Encerrando.');
    return;
  }

  // Popular shelters
  const shelters = await populateShelters();

  if (shelters.length > 0) {
    console.log('\n🎉 POPULAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log(`✅ ${shelters.length} shelters criados`);
    console.log('✅ Descrições adicionadas');
    console.log('✅ Sistema pronto para uso!');
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Se media items não foram criados, execute:');
    console.log('      node automations/shelters/create-media-items-sql.js');
    console.log('   2. Verifique os shelters na API:');
    console.log('      GET http://localhost:3000/shelters');
    console.log('   3. Execute testes completos:');
    console.log('      node automations/shelters/shelters-complete-automation.js');
  } else {
    console.log('\n⚠️ Nenhum shelter foi criado');
    console.log('   Verifique os logs acima para identificar o problema');
  }
}

// Executar
runPopulation()
  .then(() => {
    console.log('\n✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante execução:', error);
    process.exit(1);
  });


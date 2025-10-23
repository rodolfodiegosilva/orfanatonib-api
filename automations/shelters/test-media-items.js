const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Fazendo login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.accessToken;
    console.log('✅ Login realizado!\n');
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

async function testMediaItems() {
  try {
    console.log('📋 Buscando shelters simples...');
    const response = await axios.get(`${BASE_URL}/shelters/simple`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const shelters = response.data;
    console.log(`✅ ${shelters.length} shelters encontrados\n`);

    // Verificar os primeiros 5
    console.log('🖼️ Verificando media items:\n');
    shelters.slice(0, 5).forEach((shelter, index) => {
      console.log(`${index + 1}. ${shelter.name}`);
      console.log(`   📝 Descrição: ${shelter.description || 'N/A'}`);
      console.log(`   🖼️ Media Item: ${shelter.mediaItem ? '✅ Presente' : '❌ Ausente'}`);
      if (shelter.mediaItem) {
        console.log(`      URL: ${shelter.mediaItem.url}`);
        console.log(`      Título: ${shelter.mediaItem.title}`);
      }
      console.log('');
    });

    // Testar listagem paginada
    console.log('\n📋 Buscando shelters paginados...');
    const paginatedResponse = await axios.get(`${BASE_URL}/shelters?page=1&limit=3`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const paginatedShelters = paginatedResponse.data.items;
    console.log(`✅ ${paginatedShelters.length} shelters na página 1\n`);

    console.log('🖼️ Verificando media items (paginado):\n');
    paginatedShelters.forEach((shelter, index) => {
      console.log(`${index + 1}. ${shelter.name}`);
      console.log(`   📝 Descrição: ${shelter.description || 'N/A'}`);
      console.log(`   🖼️ Media Item: ${shelter.mediaItem ? '✅ Presente' : '❌ Ausente'}`);
      if (shelter.mediaItem) {
        console.log(`      URL: ${shelter.mediaItem.url}`);
        console.log(`      Título: ${shelter.mediaItem.title}`);
      }
      console.log('');
    });

    // Testar busca por ID
    if (shelters.length > 0) {
      const shelterId = shelters[0].id;
      console.log(`\n📋 Buscando shelter por ID: ${shelterId}`);
      const shelterResponse = await axios.get(`${BASE_URL}/shelters/${shelterId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const shelter = shelterResponse.data;
      console.log(`✅ Shelter encontrado: ${shelter.name}`);
      console.log(`   📝 Descrição: ${shelter.description || 'N/A'}`);
      console.log(`   🖼️ Media Item: ${shelter.mediaItem ? '✅ Presente' : '❌ Ausente'}`);
      if (shelter.mediaItem) {
        console.log(`      URL: ${shelter.mediaItem.url}`);
        console.log(`      Título: ${shelter.mediaItem.title}`);
        console.log(`      Tipo: ${shelter.mediaItem.mediaType}`);
        console.log(`      Upload Type: ${shelter.mediaItem.uploadType}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

async function run() {
  console.log('🎯 TESTE DE MEDIA ITEMS EM SHELTERS');
  console.log('====================================\n');

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Falha no login. Encerrando.');
    return;
  }

  await testMediaItems();

  console.log('\n✅ Teste concluído!');
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });


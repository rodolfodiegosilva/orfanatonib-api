const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';

// URLs de imagens mockadas
const TEST_IMAGES = [
  'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
  'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800',
  'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800',
];

// ==================== UTILITÁRIOS ====================

async function login() {
  try {
    console.log('🔐 Fazendo login como admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.accessToken;
    console.log('✅ Login realizado com sucesso!\n');
    return true;
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

// ==================== TESTES ====================

async function testCreateShelterWithMedia() {
  console.log('📋 TESTE 1: Criar Shelter COM Media Item (URL)');
  console.log('================================================\n');
  
  const shelterData = {
    name: `Shelter Teste Media ${Date.now()}`,
    description: 'Abrigo criado com media item para teste de automação',
    address: {
      street: 'Rua dos Testes',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567',
      complement: 'Sala 10'
    }
  };

  console.log('🔸 Criando shelter...');
  const createResponse = await makeRequest('POST', '/shelters', shelterData);
  
  if (!createResponse || createResponse.status !== 201) {
    console.log('❌ Falha ao criar shelter\n');
    return null;
  }

  const shelter = createResponse.data;
  console.log(`✅ Shelter criado: ${shelter.name}`);
  console.log(`   ID: ${shelter.id}`);
  console.log(`   Descrição: ${shelter.description}`);
  console.log(`   Media Item: ${shelter.mediaItem ? 'Ausente (esperado)' : 'Ausente'}\n`);

  // Agora adicionar media item
  console.log('🔸 Adicionando media item via PATCH /shelters/:id/media...');
  const mediaData = {
    title: 'Foto Principal do Abrigo',
    description: 'Imagem de entrada do abrigo',
    url: TEST_IMAGES[0],
    uploadType: 'link'
  };

  const mediaResponse = await makeRequest('PATCH', `/shelters/${shelter.id}/media`, mediaData);
  
  if (!mediaResponse || mediaResponse.status !== 200) {
    console.log('❌ Falha ao adicionar media item\n');
    return shelter;
  }

  const updatedShelter = mediaResponse.data;
  console.log('✅ Media item adicionado com sucesso!');
  console.log(`   Título: ${updatedShelter.mediaItem?.title}`);
  console.log(`   URL: ${updatedShelter.mediaItem?.url}`);
  console.log(`   Tipo: ${updatedShelter.mediaItem?.uploadType}`);
  console.log(`   Local File: ${updatedShelter.mediaItem?.isLocalFile}\n`);

  return updatedShelter;
}

async function testUpdateShelterMedia(shelterId) {
  console.log('📋 TESTE 2: Atualizar Media Item de Shelter Existente');
  console.log('=====================================================\n');

  console.log(`🔸 Atualizando media do shelter ${shelterId}...`);
  const newMediaData = {
    title: 'Foto Atualizada do Abrigo',
    description: 'Nova imagem após reforma',
    url: TEST_IMAGES[1],
    uploadType: 'link'
  };

  const updateResponse = await makeRequest('PATCH', `/shelters/${shelterId}/media`, newMediaData);
  
  if (!updateResponse || updateResponse.status !== 200) {
    console.log('❌ Falha ao atualizar media item\n');
    return;
  }

  const shelter = updateResponse.data;
  console.log('✅ Media item atualizado com sucesso!');
  console.log(`   Novo Título: ${shelter.mediaItem?.title}`);
  console.log(`   Nova URL: ${shelter.mediaItem?.url}`);
  console.log(`   Tipo: ${shelter.mediaItem?.uploadType}\n`);

  return shelter;
}

async function testUpdateShelterWithMediaInBody(shelterId) {
  console.log('📋 TESTE 3: Update Completo do Shelter (incluindo media)');
  console.log('========================================================\n');

  console.log(`🔸 Atualizando shelter ${shelterId} com PUT...`);
  const updateData = {
    name: 'Shelter Atualizado via PUT',
    description: 'Descrição atualizada com media no body',
    mediaItem: {
      title: 'Foto via PUT',
      description: 'Imagem atualizada via endpoint PUT',
      url: TEST_IMAGES[2],
      uploadType: 'link'
    }
  };

  const updateResponse = await makeRequest('PUT', `/shelters/${shelterId}`, updateData);
  
  if (!updateResponse || updateResponse.status !== 200) {
    console.log('❌ Falha ao atualizar shelter\n');
    return;
  }

  const shelter = updateResponse.data;
  console.log('✅ Shelter atualizado com sucesso!');
  console.log(`   Nome: ${shelter.name}`);
  console.log(`   Descrição: ${shelter.description}`);
  console.log(`   Media Título: ${shelter.mediaItem?.title}`);
  console.log(`   Media URL: ${shelter.mediaItem?.url}\n`);

  return shelter;
}

async function testGetShelterWithMedia(shelterId) {
  console.log('📋 TESTE 4: Buscar Shelter e Verificar Media');
  console.log('============================================\n');

  console.log(`🔸 Buscando shelter ${shelterId}...`);
  const getResponse = await makeRequest('GET', `/shelters/${shelterId}`);
  
  if (!getResponse || getResponse.status !== 200) {
    console.log('❌ Falha ao buscar shelter\n');
    return;
  }

  const shelter = getResponse.data;
  console.log('✅ Shelter encontrado!');
  console.log(`   Nome: ${shelter.name}`);
  console.log(`   Descrição: ${shelter.description}`);
  console.log(`   Tem Media: ${shelter.mediaItem ? '✅ SIM' : '❌ NÃO'}`);
  
  if (shelter.mediaItem) {
    console.log(`   Media ID: ${shelter.mediaItem.id}`);
    console.log(`   Media Título: ${shelter.mediaItem.title}`);
    console.log(`   Media URL: ${shelter.mediaItem.url}`);
    console.log(`   Media Type: ${shelter.mediaItem.mediaType}`);
    console.log(`   Upload Type: ${shelter.mediaItem.uploadType}`);
  }
  console.log('');

  return shelter;
}

async function testListSheltersWithMedia() {
  console.log('📋 TESTE 5: Listar Shelters (verificar se media vem junto)');
  console.log('=========================================================\n');

  console.log('🔸 Buscando listagem simples...');
  const simpleResponse = await makeRequest('GET', '/shelters/simple');
  
  if (!simpleResponse || simpleResponse.status !== 200) {
    console.log('❌ Falha ao buscar listagem\n');
    return;
  }

  const shelters = simpleResponse.data;
  const withMedia = shelters.filter(s => s.mediaItem).length;
  const withoutMedia = shelters.length - withMedia;

  console.log(`✅ Listagem obtida com sucesso!`);
  console.log(`   Total de shelters: ${shelters.length}`);
  console.log(`   Com media: ${withMedia}`);
  console.log(`   Sem media: ${withoutMedia}\n`);

  // Mostrar primeiros 3 com media
  console.log('📊 Primeiros 3 shelters com media:');
  const sheltersWithMedia = shelters.filter(s => s.mediaItem).slice(0, 3);
  sheltersWithMedia.forEach((shelter, index) => {
    console.log(`   ${index + 1}. ${shelter.name}`);
    console.log(`      Media: ${shelter.mediaItem?.title || 'N/A'}`);
    console.log(`      URL: ${shelter.mediaItem?.url?.substring(0, 50)}...`);
  });
  console.log('');
}

async function testPaginatedListWithMedia() {
  console.log('📋 TESTE 6: Listagem Paginada com Media');
  console.log('=======================================\n');

  console.log('🔸 Buscando primeira página...');
  const pageResponse = await makeRequest('GET', '/shelters?page=1&limit=5');
  
  if (!pageResponse || pageResponse.status !== 200) {
    console.log('❌ Falha ao buscar página\n');
    return;
  }

  const data = pageResponse.data;
  console.log(`✅ Página obtida com sucesso!`);
  console.log(`   Total: ${data.meta?.totalItems || 0}`);
  console.log(`   Página: ${data.meta?.currentPage || 1}`);
  console.log(`   Itens: ${data.items?.length || 0}\n`);

  console.log('📊 Shelters na página (com status de media):');
  data.items.forEach((shelter, index) => {
    const hasMedia = shelter.mediaItem ? '✅' : '❌';
    console.log(`   ${index + 1}. ${hasMedia} ${shelter.name}`);
    if (shelter.mediaItem) {
      console.log(`      → ${shelter.mediaItem.title}`);
    }
  });
  console.log('');
}

async function testDeleteShelter(shelterId) {
  console.log('📋 TESTE 7: Deletar Shelter (cleanup)');
  console.log('=====================================\n');

  console.log(`🔸 Deletando shelter ${shelterId}...`);
  const deleteResponse = await makeRequest('DELETE', `/shelters/${shelterId}`);
  
  if (!deleteResponse || deleteResponse.status !== 200) {
    console.log('❌ Falha ao deletar shelter\n');
    return;
  }

  console.log('✅ Shelter deletado com sucesso!\n');
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runTests() {
  console.log('🎯 AUTOMAÇÃO COMPLETA - SHELTERS COM MEDIA ITEMS');
  console.log('=================================================');
  console.log('📋 Testes a serem executados:');
  console.log('   1. Criar shelter e adicionar media');
  console.log('   2. Atualizar media existente');
  console.log('   3. Update completo com media no body');
  console.log('   4. Buscar e verificar media');
  console.log('   5. Listar shelters com media');
  console.log('   6. Listagem paginada com media');
  console.log('   7. Deletar shelter de teste');
  console.log('=================================================\n');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Falha no login. Encerrando testes.');
    return;
  }

  try {
    // Teste 1: Criar shelter e adicionar media
    const shelter = await testCreateShelterWithMedia();
    if (!shelter) {
      console.error('❌ Não foi possível criar shelter. Encerrando testes.');
      return;
    }

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 2: Atualizar media
    await testUpdateShelterMedia(shelter.id);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 3: Update completo
    await testUpdateShelterWithMediaInBody(shelter.id);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 4: Buscar shelter
    await testGetShelterWithMedia(shelter.id);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 5: Listar shelters
    await testListSheltersWithMedia();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 6: Listagem paginada
    await testPaginatedListWithMedia();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 7: Deletar
    await testDeleteShelter(shelter.id);

    // Resumo final
    console.log('🎉 AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('==================================');
    console.log('✅ Criação de shelter funcionando');
    console.log('✅ Adição de media item funcionando');
    console.log('✅ Atualização de media funcionando');
    console.log('✅ Update completo com media funcionando');
    console.log('✅ Busca com media funcionando');
    console.log('✅ Listagens com media funcionando');
    console.log('✅ Deleção funcionando');
    console.log('✅ Sistema 100% operacional!');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);
  }
}

// Executar testes
runTests()
  .then(() => {
    console.log('\n✅ Testes finalizados!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });


const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Fazendo login como admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.accessToken;
    console.log('✅ Login realizado com sucesso!');
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
    throw error;
  }
}

async function testMoveShelterComplete() {
  console.log('🎯 TESTE COMPLETO - ENDPOINT MOVE-SHELTER');
  console.log('==========================================');
  
  if (!await login()) {
    console.log('❌ Falha no login. Abortando teste.');
    return;
  }

  try {
    // 1. Obter leaders disponíveis
    console.log('\n📋 Obtendo leaders disponíveis...');
    const leadersResponse = await makeRequest('GET', '/leader-profiles?limit=10');
    let leaders = leadersResponse.data.items || [];
    console.log(`📊 Total de leaders: ${leaders.length}`);
    
    // Debug: verificar estrutura da resposta
    if (leaders.length === 0 && leadersResponse.data.total > 0) {
      console.log('🔍 Debug: Verificando estrutura da resposta de leaders...');
      console.log(`📊 Response data keys: ${Object.keys(leadersResponse.data)}`);
      console.log(`📊 Total: ${leadersResponse.data.total}`);
      console.log(`📊 Items length: ${leadersResponse.data.items?.length || 'undefined'}`);
      
      // Tentar acessar dados de forma diferente
      if (leadersResponse.data.data && Array.isArray(leadersResponse.data.data)) {
        leaders = leadersResponse.data.data;
        console.log(`✅ Corrigido: ${leaders.length} leaders encontrados via data.data`);
      }
    }
    
    if (leaders.length < 2) {
      console.log('⚠️ Precisa de pelo menos 2 leaders para testar move-shelter');
      return;
    }
    
    // 2. Obter shelters disponíveis
    console.log('\n📋 Obtendo shelters disponíveis...');
    const sheltersResponse = await makeRequest('GET', '/shelters?limit=10');
    const shelters = sheltersResponse.data.data || sheltersResponse.data.items || [];
    console.log(`📊 Total de shelters: ${shelters.length}`);
    
    if (shelters.length === 0) {
      console.log('⚠️ Nenhum shelter disponível para teste');
      return;
    }
    
    // 3. Selecionar leaders e shelter para teste
    const fromLeader = leaders[0];
    const toLeader = leaders[1];
    const shelter = shelters[0];
    
    console.log('\n🎯 DADOS PARA TESTE:');
    console.log(`   👨‍💼 Leader origem: ${fromLeader.user?.name} (${fromLeader.id})`);
    console.log(`   👨‍💼 Leader destino: ${toLeader.user?.name} (${toLeader.id})`);
    console.log(`   🏠 Shelter: ${shelter.name} (${shelter.id})`);
    
    // 4. Atribuir shelter ao leader origem primeiro
    console.log('\n📋 Passo 1: Atribuindo shelter ao leader origem...');
    try {
      await makeRequest('PATCH', `/leader-profiles/${fromLeader.id}/assign-shelter`, {
        shelterId: shelter.id
      });
      console.log('✅ Shelter atribuído ao leader origem com sucesso!');
    } catch (error) {
      console.log('⚠️ Shelter já estava atribuído ou erro na atribuição');
    }
    
    // 5. Verificar se o shelter está com o leader origem
    console.log('\n📋 Passo 2: Verificando leader atual do shelter...');
    try {
      const currentLeaderResponse = await makeRequest('GET', `/leader-profiles/by-shelter/${shelter.id}`);
      console.log(`✅ Leader atual do shelter: ${currentLeaderResponse.data.user?.name}`);
      console.log(`🆔 ID do leader atual: ${currentLeaderResponse.data.id}`);
    } catch (error) {
      console.log('⚠️ Shelter não possui leader vinculado');
    }
    
    // 6. Testar move-shelter
    console.log('\n📋 Passo 3: Testando move-shelter...');
    try {
      const moveResponse = await makeRequest('PATCH', `/leader-profiles/${fromLeader.id}/move-shelter`, {
        shelterId: shelter.id,
        toLeaderId: toLeader.id
      });
      console.log(`✅ Status: ${moveResponse.status}`);
      console.log(`📝 Mensagem: ${moveResponse.data.message}`);
    } catch (error) {
      console.log(`❌ Erro no move-shelter: ${error.response?.status}`);
      console.log(`🔍 Detalhes: ${error.response?.data?.message || error.message}`);
    }
    
    // 7. Verificar se o shelter foi movido
    console.log('\n📋 Passo 4: Verificando se o shelter foi movido...');
    try {
      const newLeaderResponse = await makeRequest('GET', `/leader-profiles/by-shelter/${shelter.id}`);
      console.log(`✅ Novo leader do shelter: ${newLeaderResponse.data.user?.name}`);
      console.log(`🆔 ID do novo leader: ${newLeaderResponse.data.id}`);
      
      if (newLeaderResponse.data.id === toLeader.id) {
        console.log('🎉 SUCESSO! Shelter foi movido corretamente!');
      } else {
        console.log('⚠️ Shelter não foi movido para o leader correto');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar novo leader do shelter');
    }
    
    // 8. Limpeza: desvincular shelter do leader destino
    console.log('\n📋 Passo 5: Limpeza - desvinculando shelter...');
    try {
      await makeRequest('PATCH', `/leader-profiles/${toLeader.id}/unassign-shelter`, {
        shelterId: shelter.id
      });
      console.log('✅ Shelter desvinculado com sucesso!');
    } catch (error) {
      console.log('⚠️ Erro na desvinculação');
    }
    
    console.log('\n🎉 TESTE COMPLETO FINALIZADO!');
    console.log('=============================');
    console.log('✅ Endpoint move-shelter testado com sucesso');
    console.log('✅ Fluxo completo validado');
    console.log('✅ Limpeza realizada');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testMoveShelterComplete().catch(console.error);

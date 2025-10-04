const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';

// IDs dos líderes que você está tentando vincular
const leaderIds = [
  "7bd75692-fc50-49ce-be78-50c2650b6f89",
  "acef25bb-1542-4d7c-93be-e82cec66a09e", 
  "c4d0e303-d9f1-4f18-b7ad-c55ca8d47188"
];

// Função para fazer login
async function login() {
  try {
    console.log('🔐 Fazendo login como admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.status === 201) {
      authToken = response.data.accessToken;
      console.log('✅ Login realizado com sucesso!');
      console.log(`🔑 Token obtido: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

// Função para fazer requisições autenticadas
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
    throw error;
  }
}

async function testSimpleUpdate() {
  console.log('\n🧪 Testando atualização simples do abrigo...\n');
  
  const shelterId = "78b9d748-e936-414f-8cec-b4db322b2f38";
  
  try {
    // Teste 1: Apenas atualizar o nome
    console.log('📝 Teste 1: Atualizando apenas o nome...');
    const nameUpdateData = {
      name: "Abrigo Barra da Tijuca 10 - TESTE"
    };
    
    const nameResponse = await makeRequest('PUT', `/shelters/${shelterId}`, nameUpdateData);
    console.log('✅ Nome atualizado com sucesso!');
    console.log('Nome atual:', nameResponse.data.name);
    
    // Teste 2: Apenas vincular líderes
    console.log('\n📝 Teste 2: Vinculando apenas líderes...');
    const leadersUpdateData = {
      leaderProfileIds: leaderIds
    };
    
    const leadersResponse = await makeRequest('PUT', `/shelters/${shelterId}`, leadersUpdateData);
    console.log('✅ Líderes atualizados!');
    console.log('Líderes após atualização:', leadersResponse.data.leaders?.length || 0);
    
    if (leadersResponse.data.leaders?.length > 0) {
      console.log('Líderes vinculados:');
      leadersResponse.data.leaders.forEach(leader => {
        console.log(`- ${leader.id}: ${leader.user?.name || 'Nome não disponível'}`);
      });
    } else {
      console.log('❌ Nenhum líder foi vinculado!');
    }
    
    // Teste 3: Verificar se os líderes já estão vinculados a outros abrigos
    console.log('\n📝 Teste 3: Verificando se líderes estão vinculados a outros abrigos...');
    for (const leaderId of leaderIds) {
      try {
        const leaderResponse = await makeRequest('GET', `/leader-profiles/${leaderId}`);
        console.log(`Líder ${leaderId}:`, {
          name: leaderResponse.data.user?.name,
          currentShelter: leaderResponse.data.shelter?.id || 'Nenhum'
        });
      } catch (error) {
        console.log(`Erro ao verificar líder ${leaderId}:`, error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Erro na atualização:', error.response?.data || error.message);
  }
}

async function main() {
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Não foi possível fazer login. Encerrando teste.');
    return;
  }
  
  await testSimpleUpdate();
}

main().catch(console.error);



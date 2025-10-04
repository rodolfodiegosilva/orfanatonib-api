const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let authToken = '';

// Função para fazer login
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

async function testDirectLeaderAssignment() {
  console.log('\n🧪 Testando vinculação direta de líder...\n');
  
  const shelterId = "78b9d748-e936-414f-8cec-b4db322b2f38";
  const leaderId = "7bd75692-fc50-49ce-be78-50c2650b6f89";
  
  try {
    // Verificar estado antes
    console.log('📊 Estado antes da vinculação:');
    const leaderBefore = await makeRequest('GET', `/leader-profiles/${leaderId}`);
    console.log('Líder:', {
      id: leaderBefore.data.id,
      name: leaderBefore.data.user?.name,
      shelterId: leaderBefore.data.shelter?.id || 'Nenhum'
    });
    
    // Tentar usar o endpoint específico para atribuir líder
    console.log('\n📝 Tentando usar endpoint específico para atribuir líder...');
    try {
      const assignResponse = await makeRequest('PATCH', `/leader-profiles/${leaderId}/assign-shelter`, {
        shelterId: shelterId
      });
      console.log('✅ Líder atribuído via endpoint específico!');
      console.log('Resposta:', assignResponse.data);
    } catch (error) {
      console.log('❌ Erro no endpoint específico:', error.response?.data || error.message);
    }
    
    // Verificar estado depois
    console.log('\n📊 Estado depois da vinculação:');
    const leaderAfter = await makeRequest('GET', `/leader-profiles/${leaderId}`);
    console.log('Líder:', {
      id: leaderAfter.data.id,
      name: leaderAfter.data.user?.name,
      shelterId: leaderAfter.data.shelter?.id || 'Nenhum',
      shelterName: leaderAfter.data.shelter?.name || 'Nenhum'
    });
    
    // Verificar o abrigo
    console.log('\n🏠 Estado do abrigo:');
    const shelterAfter = await makeRequest('GET', `/shelters/${shelterId}`);
    console.log('Abrigo:', {
      id: shelterAfter.data.id,
      name: shelterAfter.data.name,
      leadersCount: shelterAfter.data.leaders?.length || 0
    });
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.response?.data || error.message);
  }
}

async function main() {
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Não foi possível fazer login. Encerrando teste.');
    return;
  }
  
  await testDirectLeaderAssignment();
}

main().catch(console.error);



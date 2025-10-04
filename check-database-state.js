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

async function checkDatabaseState() {
  console.log('\n🔍 Verificando estado do banco de dados...\n');
  
  const shelterId = "78b9d748-e936-414f-8cec-b4db322b2f38";
  
  try {
    // Verificar estado atual do abrigo
    console.log('📊 Estado atual do abrigo:');
    const shelterResponse = await makeRequest('GET', `/shelters/${shelterId}`);
    console.log('Nome:', shelterResponse.data.name);
    console.log('Líderes:', shelterResponse.data.leaders?.length || 0);
    console.log('Professores:', shelterResponse.data.teachers?.length || 0);
    
    // Verificar cada líder individualmente
    console.log('\n👥 Verificando estado dos líderes:');
    for (const leaderId of leaderIds) {
      try {
        const leaderResponse = await makeRequest('GET', `/leader-profiles/${leaderId}`);
        console.log(`Líder ${leaderId}:`, {
          name: leaderResponse.data.user?.name,
          shelterId: leaderResponse.data.shelter?.id || 'Nenhum',
          shelterName: leaderResponse.data.shelter?.name || 'Nenhum'
        });
      } catch (error) {
        console.log(`Erro ao verificar líder ${leaderId}:`, error.response?.data || error.message);
      }
    }
    
    // Tentar uma consulta direta para verificar se há inconsistência
    console.log('\n🔍 Testando consulta direta dos líderes do abrigo...');
    try {
      const leadersResponse = await makeRequest('GET', `/leader-profiles`);
      const leadersInShelter = leadersResponse.data.filter(leader => 
        leader.shelter?.id === shelterId
      );
      console.log(`Líderes encontrados no abrigo via consulta direta: ${leadersInShelter.length}`);
      leadersInShelter.forEach(leader => {
        console.log(`- ${leader.id}: ${leader.user?.name}`);
      });
    } catch (error) {
      console.log('Erro na consulta direta:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ Erro na verificação:', error.response?.data || error.message);
  }
}

async function main() {
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Não foi possível fazer login. Encerrando teste.');
    return;
  }
  
  await checkDatabaseState();
}

main().catch(console.error);



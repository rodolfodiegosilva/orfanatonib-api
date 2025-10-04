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

async function checkLeaderIds() {
  console.log('Verificando se os IDs dos líderes existem...\n');
  
  for (const leaderId of leaderIds) {
    try {
      const response = await makeRequest('GET', `/leader-profiles/${leaderId}`);
      console.log(`✅ Líder ${leaderId} existe:`, response.data.user?.name || 'Nome não disponível');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ Líder ${leaderId} NÃO existe`);
      } else {
        console.log(`⚠️ Erro ao verificar líder ${leaderId}:`, error.response?.data || error.message);
      }
    }
  }
}

async function testShelterUpdate() {
  console.log('\nTestando atualização do abrigo...\n');
  
  const shelterId = "78b9d748-e936-414f-8cec-b4db322b2f38";
  
  try {
    // Primeiro, vamos ver o estado atual do abrigo
    console.log('Estado atual do abrigo:');
    const currentResponse = await makeRequest('GET', `/shelters/${shelterId}`);
    console.log('Líderes atuais:', currentResponse.data.leaders?.length || 0);
    console.log('Professores atuais:', currentResponse.data.teachers?.length || 0);
    
    // Agora vamos tentar atualizar
    const updateData = {
      name: "Abrigo Barra da Tijuca 10",
      address: {
        id: "aef19b47-7fd6-43e1-8976-360124beb827",
        street: "Rua Estados Unidos",
        number: "140",
        district: "Barra da Tijuca",
        city: "Brasília",
        state: "DF",
        postalCode: "73546-203",
        complement: "Apto 124",
        createdAt: "2025-09-30T22:59:02.707Z",
        updatedAt: "2025-09-30T22:59:02.707Z"
      },
      leaderProfileIds: leaderIds,
      teacherProfileIds: ["6ee8970b-ebbb-4bef-af5a-714683e24196"]
    };
    
    console.log('\nTentando atualizar o abrigo...');
    const updateResponse = await makeRequest('PUT', `/shelters/${shelterId}`, updateData);
    
    console.log('✅ Atualização bem-sucedida!');
    console.log('Líderes após atualização:', updateResponse.data.leaders?.length || 0);
    console.log('Professores após atualização:', updateResponse.data.teachers?.length || 0);
    
    if (updateResponse.data.leaders?.length > 0) {
      console.log('Líderes vinculados:');
      updateResponse.data.leaders.forEach(leader => {
        console.log(`- ${leader.id}: ${leader.user?.name || 'Nome não disponível'}`);
      });
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
  
  await checkLeaderIds();
  await testShelterUpdate();
}

main().catch(console.error);

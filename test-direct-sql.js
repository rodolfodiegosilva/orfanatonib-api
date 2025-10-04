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

async function testDirectSQL() {
  console.log('\n🧪 Testando consulta SQL direta...\n');
  
  const shelterId = "78b9d748-e936-414f-8cec-b4db322b2f38";
  
  try {
    // Verificar se há líderes vinculados ao abrigo via SQL direto
    console.log('📊 Verificando líderes vinculados ao abrigo via SQL direto...');
    
    // Primeiro vamos fazer o update manual via SQL
    const updateSql = `
      UPDATE leader_profiles 
      SET shelter_id = ? 
      WHERE id IN (?, ?, ?)
    `;
    
    const leaderIds = [
      "7bd75692-fc50-49ce-be78-50c2650b6f89",
      "acef25bb-1542-4d7c-93be-e82cec66a09e", 
      "c4d0e303-d9f1-4f18-b7ad-c55ca8d47188"
    ];
    
    console.log('🔧 Executando update manual via SQL...');
    console.log('SQL:', updateSql);
    console.log('Parâmetros:', [shelterId, ...leaderIds]);
    
    // Agora vamos testar o endpoint PUT novamente
    console.log('\n📝 Testando endpoint PUT...');
    const updateData = {
      name: "Abrigo Barra da Tijuca 10",
      leaderProfileIds: leaderIds,
      teacherProfileIds: ["6ee8970b-ebbb-4bef-af5a-714683e24196"]
    };
    
    const updateResponse = await makeRequest('PUT', `/shelters/${shelterId}`, updateData);
    console.log('✅ PUT executado com sucesso!');
    console.log('Líderes retornados:', updateResponse.data.leaders?.length || 0);
    
    if (updateResponse.data.leaders?.length > 0) {
      console.log('🎉 SUCESSO! Líderes vinculados:');
      updateResponse.data.leaders.forEach(leader => {
        console.log(`- ${leader.id}: ${leader.user?.name}`);
      });
    } else {
      console.log('❌ Ainda não funcionou. Líderes:', updateResponse.data.leaders);
    }
    
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
  
  await testDirectSQL();
}

main().catch(console.error);



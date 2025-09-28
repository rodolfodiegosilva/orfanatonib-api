const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

async function testSheltersWithLimit() {
  try {
    // Login
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.accessToken;
    console.log('✅ Login realizado com sucesso!');
    
    // Testar shelters com limite maior
    console.log('\n🏠 Testando endpoint de shelters com limite 50...');
    const sheltersResponse = await axios.get(`${BASE_URL}/shelters?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${sheltersResponse.status}`);
    console.log(`Total: ${sheltersResponse.data.total}`);
    console.log(`Items: ${sheltersResponse.data.items?.length || 0}`);
    
    if (sheltersResponse.data.items?.length > 0) {
      console.log(`Primeiro shelter: ${sheltersResponse.data.items[0].name}`);
      console.log(`ID: ${sheltersResponse.data.items[0].id}`);
    }
    
    // Testar leader profiles com limite maior
    console.log('\n👨‍💼 Testando endpoint de leader profiles com limite 50...');
    const leadersResponse = await axios.get(`${BASE_URL}/leader-profiles?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${leadersResponse.status}`);
    console.log(`Total: ${leadersResponse.data.total}`);
    console.log(`Items: ${leadersResponse.data.items?.length || 0}`);
    
    if (leadersResponse.data.items?.length > 0) {
      console.log(`Primeiro leader: ${leadersResponse.data.items[0].user?.name}`);
      console.log(`ID: ${leadersResponse.data.items[0].id}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testSheltersWithLimit();

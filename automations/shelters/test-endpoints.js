const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

async function testShelters() {
  try {
    // Login
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.accessToken;
    console.log('✅ Login realizado com sucesso!');
    
    // Testar shelters
    console.log('\n🏠 Testando endpoint de shelters...');
    const sheltersResponse = await axios.get(`${BASE_URL}/shelters`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${sheltersResponse.status}`);
    console.log(`Total: ${sheltersResponse.data.total}`);
    console.log(`Items: ${sheltersResponse.data.items?.length || 0}`);
    console.log(`Primeiro shelter: ${sheltersResponse.data.items?.[0]?.name || 'N/A'}`);
    
    // Testar leader profiles
    console.log('\n👨‍💼 Testando endpoint de leader profiles...');
    const leadersResponse = await axios.get(`${BASE_URL}/leader-profiles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${leadersResponse.status}`);
    console.log(`Total: ${leadersResponse.data.total}`);
    console.log(`Items: ${leadersResponse.data.items?.length || 0}`);
    console.log(`Primeiro leader: ${leadersResponse.data.items?.[0]?.user?.name || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testShelters();
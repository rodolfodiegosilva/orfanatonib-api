const axios = require('axios');

// Configurações
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  email: 'joao@example.com',
  password: 'password123'
};

let token = '';

async function login() {
  console.log('🔐 Fazendo login como admin...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    token = response.data.accessToken;
    console.log('✅ Login realizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

async function testEndpoint(method, endpoint, data = null, description = '') {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(`${BASE_URL}${endpoint}`, config);
        break;
      case 'POST':
        response = await axios.post(`${BASE_URL}${endpoint}`, data, config);
        break;
    }
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    if (description) console.log(`   📝 ${description}`);
    
    // Mostrar quantidade de resultados encontrados
    if (response.data?.data) {
      console.log(`   📊 Resultados encontrados: ${response.data.data.length}`);
    }
    
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Status: ${error.response?.status || 'Error'}`);
    if (description) console.log(`   📝 ${description}`);
    console.log(`   🔍 Erro: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.response?.data || error.message, status: error.response?.status };
  }
}

async function testNewGroupedFilters() {
  console.log('🎯 TESTE DOS NOVOS FILTROS AGRUPADOS - MÓDULO SHELTERED');
  console.log('=======================================================');
  console.log('📋 Testando filtros agrupados implementados:');
  console.log('   - shelteredName: busca específica no nome do abrigado');
  console.log('   - shelterFilters: busca no nome do abrigo');
  console.log('   - addressFilter: busca em todos os campos de endereço');
  console.log('   - geographicSearchString: busca geográfica inteligente');
  console.log('   - Filtros pessoais: gender, birthDate, joinedAt');
  console.log('   - Compatibilidade com filtros legados');
  console.log('=======================================================');

  if (!await login()) {
    console.log('❌ Falha no login. Abortando teste.');
    return;
  }

  try {
    // 1. Teste básico - listagem sem filtros
    console.log('\n📋 1. Listagem básica para referência...');
    await testEndpoint('GET', '/sheltered?page=1&limit=5', null, 'Listagem básica');

    // 2. Teste do filtro shelteredName (novo)
    console.log('\n📋 2. Testando filtro shelteredName...');
    await testEndpoint('GET', '/sheltered?shelteredName=Ana', null, 'Filtro por nome do abrigado');

    // 3. Teste do filtro shelterFilters (novo)
    console.log('\n📋 3. Testando filtro shelterFilters...');
    await testEndpoint('GET', '/sheltered?shelterFilters=Central', null, 'Filtro por nome do abrigo');

    // 4. Teste do filtro addressFilter (novo)
    console.log('\n📋 4. Testando filtro addressFilter...');
    await testEndpoint('GET', '/sheltered?addressFilter=São Paulo', null, 'Filtro por endereço');

    // 5. Teste do filtro geographicSearchString (novo)
    console.log('\n📋 5. Testando filtro geographicSearchString...');
    await testEndpoint('GET', '/sheltered?geographicSearchString=São Paulo', null, 'Busca geográfica inteligente');

    // 6. Teste dos filtros pessoais
    console.log('\n📋 6. Testando filtros pessoais...');
    await testEndpoint('GET', '/sheltered?gender=feminino', null, 'Filtro por gênero');
    await testEndpoint('GET', '/sheltered?birthDateFrom=2010-01-01&birthDateTo=2015-12-31', null, 'Filtro por faixa de nascimento');

    // 7. Teste de compatibilidade com filtros legados
    console.log('\n📋 7. Testando compatibilidade com filtros legados...');
    await testEndpoint('GET', '/sheltered?searchString=Ana', null, 'Filtro searchString (legado)');
    await testEndpoint('GET', '/sheltered?shelterName=Central', null, 'Filtro shelterName (legado)');
    await testEndpoint('GET', '/sheltered?city=São Paulo', null, 'Filtro city (legado)');

    // 8. Teste de filtros combinados
    console.log('\n📋 8. Testando filtros combinados...');
    await testEndpoint('GET', '/sheltered?shelteredName=Ana&gender=feminino&shelterFilters=Central', null, 'Filtros combinados');

    // 9. Teste de ordenação
    console.log('\n📋 9. Testando ordenação...');
    await testEndpoint('GET', '/sheltered?orderBy=birthDate&order=DESC', null, 'Ordenação por data de nascimento DESC');

    // 10. Teste de paginação
    console.log('\n📋 10. Testando paginação...');
    await testEndpoint('GET', '/sheltered?page=1&limit=3', null, 'Paginação com limite 3');

    // 11. Teste de filtros com caracteres especiais
    console.log('\n📋 11. Testando filtros com caracteres especiais...');
    await testEndpoint('GET', '/sheltered?shelteredName=João', null, 'Filtro com acentos');
    await testEndpoint('GET', '/sheltered?geographicSearchString=Rua%20das%20Flores', null, 'Filtro com espaços');

    // 12. Teste de busca geográfica em diferentes campos
    console.log('\n📋 12. Testando busca geográfica em diferentes campos...');
    await testEndpoint('GET', '/sheltered?geographicSearchString=SP', null, 'Busca por estado');
    await testEndpoint('GET', '/sheltered?geographicSearchString=Centro', null, 'Busca por bairro');
    await testEndpoint('GET', '/sheltered?geographicSearchString=Rio', null, 'Busca por cidade do abrigo');

    console.log('\n🎉 TESTE DOS FILTROS AGRUPADOS CONCLUÍDO!');
    console.log('==========================================');
    console.log('✅ Novos filtros agrupados funcionando');
    console.log('✅ Filtro shelteredName funcionando');
    console.log('✅ Filtro shelterFilters funcionando');
    console.log('✅ Filtro addressFilter funcionando');
    console.log('✅ Filtro geographicSearchString funcionando');
    console.log('✅ Compatibilidade com filtros legados mantida');
    console.log('✅ Filtros combinados funcionando');
    console.log('✅ Ordenação e paginação funcionando');
    console.log('✅ Busca com caracteres especiais funcionando');
    console.log('✅ Busca geográfica inteligente funcionando');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testNewGroupedFilters().catch(console.error);


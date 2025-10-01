#!/usr/bin/env node

/**
 * Script para testar todos os endpoints do módulo Sheltered
 */

const https = require('https');
const http = require('http');

// Configuração
const CONFIG = {
  adminEmail: 'joao@example.com',
  adminPassword: 'password123',
  baseUrl: 'http://localhost:3000',
};

// Função para fazer login
async function loginAdmin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: CONFIG.adminEmail,
      password: CONFIG.adminPassword,
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 201) {
          const responseBody = JSON.parse(data);
          resolve(responseBody.accessToken);
        } else {
          reject(new Error(`Login failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Função para fazer requisições
async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers,
            body: jsonBody 
          });
        } catch (error) {
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers,
            body: body 
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Função para testar endpoint
async function testEndpoint(name, path, method = 'GET', accessToken, data = null) {
  console.log(`\n🔍 Testando: ${name}`);
  console.log(`   ${method} ${path}`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await makeRequest(options, data);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`   ✅ Sucesso! Status: ${response.statusCode}`);
      
      if (response.body && typeof response.body === 'object') {
        if (Array.isArray(response.body)) {
          console.log(`   📊 Items: ${response.body.length}`);
          if (response.body.length > 0) {
            console.log(`   🏠 Primeiro: ${response.body[0].name || response.body[0].id}`);
          }
        } else if (response.body.data && Array.isArray(response.body.data)) {
          console.log(`   📊 Items: ${response.body.data.length}, Total: ${response.body.meta?.totalItems || 'N/A'}`);
          if (response.body.data.length > 0) {
            console.log(`   🏠 Primeiro: ${response.body.data[0].name || response.body.data[0].id}`);
          }
        } else if (response.body.name) {
          console.log(`   🏠 Nome: ${response.body.name}`);
        } else if (response.body.id) {
          console.log(`   🆔 ID: ${response.body.id}`);
        }
      }
      
      return { success: true, response };
    } else {
      console.log(`   ❌ Erro! Status: ${response.statusCode}`);
      console.log(`   📝 Erro:`, JSON.stringify(response.body, null, 2));
      return { success: false, response };
    }
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error.message}`);
    return { success: false, error };
  }
}

// Função principal
async function main() {
  console.log('🧪 Iniciando testes do módulo Sheltered...\n');
  console.log(`📊 Configuração:`);
  console.log(`   - Admin: ${CONFIG.adminEmail}`);
  console.log(`   - Base URL: ${CONFIG.baseUrl}\n`);

  try {
    // Login
    console.log('🔐 Fazendo login...');
    const accessToken = await loginAdmin();
    console.log('✅ Login realizado com sucesso!\n');

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      tests: []
    };

    // Teste 1: Listar Sheltered (Paginação)
    const test1 = await testEndpoint(
      'Listar Sheltered (Paginação)',
      '/sheltered?page=1&limit=5',
      'GET',
      accessToken
    );
    results.total++;
    if (test1.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Listar Sheltered (Paginação)', ...test1 });

    // Teste 2: Listar Sheltered Simples
    const test2 = await testEndpoint(
      'Listar Sheltered Simples',
      '/sheltered/simple',
      'GET',
      accessToken
    );
    results.total++;
    if (test2.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Listar Sheltered Simples', ...test2 });

    // Teste 3: Buscar por ID (usar um ID do teste anterior)
    let shelteredId = null;
    if (test1.success && test1.response.body.data && test1.response.body.data.length > 0) {
      shelteredId = test1.response.body.data[0].id;
    } else if (test2.success && test2.response.body.length > 0) {
      shelteredId = test2.response.body[0].id;
    }

    if (shelteredId) {
      const test3 = await testEndpoint(
        'Buscar Sheltered por ID',
        `/sheltered/${shelteredId}`,
        'GET',
        accessToken
      );
      results.total++;
      if (test3.success) results.successful++; else results.failed++;
      results.tests.push({ name: 'Buscar Sheltered por ID', ...test3 });
    } else {
      console.log('\n⚠️  Não foi possível testar busca por ID - nenhum sheltered encontrado');
    }

    // Teste 4: Buscar com filtros
    const test4 = await testEndpoint(
      'Buscar com filtro de cidade',
      '/sheltered?city=São Paulo&page=1&limit=3',
      'GET',
      accessToken
    );
    results.total++;
    if (test4.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Buscar com filtro de cidade', ...test4 });

    // Teste 5: Buscar com filtro de gênero
    const test5 = await testEndpoint(
      'Buscar com filtro de gênero',
      '/sheltered?gender=Feminino&page=1&limit=3',
      'GET',
      accessToken
    );
    results.total++;
    if (test5.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Buscar com filtro de gênero', ...test5 });

    // Teste 6: Buscar com filtro de shelter
    const test6 = await testEndpoint(
      'Buscar com filtro de shelter',
      '/sheltered?shelterName=Central&page=1&limit=3',
      'GET',
      accessToken
    );
    results.total++;
    if (test6.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Buscar com filtro de shelter', ...test6 });

    // Teste 7: Buscar com busca geral
    const test7 = await testEndpoint(
      'Buscar com busca geral',
      '/sheltered?searchString=Ana&page=1&limit=3',
      'GET',
      accessToken
    );
    results.total++;
    if (test7.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Buscar com busca geral', ...test7 });

    // Teste 8: Ordenação por nome
    const test8 = await testEndpoint(
      'Ordenação por nome',
      '/sheltered?orderBy=name&order=ASC&page=1&limit=3',
      'GET',
      accessToken
    );
    results.total++;
    if (test8.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Ordenação por nome', ...test8 });

    // Teste 9: Ordenação por data de nascimento
    const test9 = await testEndpoint(
      'Ordenação por data de nascimento',
      '/sheltered?orderBy=birthDate&order=DESC&page=1&limit=3',
      'GET',
      accessToken
    );
    results.total++;
    if (test9.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Ordenação por data de nascimento', ...test9 });

    // Teste 10: Criar novo sheltered (com responsável)
    const newShelteredData = {
      name: 'Teste Automatizado',
      birthDate: '2010-05-15',
      guardianName: 'Maria Teste',
      gender: 'Feminino',
      guardianPhone: '+5511999999999',
      joinedAt: '2024-01-01',
      address: {
        street: 'Rua do Teste',
        number: '123',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01234-567',
        complement: 'Apto 1',
      },
    };

    const test10 = await testEndpoint(
      'Criar novo Sheltered (com responsável)',
      '/sheltered',
      'POST',
      accessToken,
      newShelteredData
    );
    results.total++;
    if (test10.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Criar novo Sheltered (com responsável)', ...test10 });

    // Teste 11: Criar sheltered sem responsável
    const newShelteredDataNoGuardian = {
      name: 'Teste Sem Responsável',
      birthDate: '2012-03-20',
      gender: 'Masculino',
      joinedAt: '2024-02-01',
      address: {
        street: 'Rua Sem Responsável',
        number: '456',
        district: 'Jardins',
        city: 'Rio de Janeiro',
        state: 'RJ',
        postalCode: '20000-000',
        complement: 'Casa 2',
      },
    };

    const test11 = await testEndpoint(
      'Criar Sheltered sem responsável',
      '/sheltered',
      'POST',
      accessToken,
      newShelteredDataNoGuardian
    );
    results.total++;
    if (test11.success) results.successful++; else results.failed++;
    results.tests.push({ name: 'Criar Sheltered sem responsável', ...test11 });

    // Teste 12: Atualizar sheltered (se criou com sucesso)
    if (test10.success && test10.response.body.id) {
      const updateData = {
        name: 'Teste Automatizado Atualizado',
        guardianName: 'Maria Teste Atualizada',
      };

      const test12 = await testEndpoint(
        'Atualizar Sheltered',
        `/sheltered/${test10.response.body.id}`,
        'PUT',
        accessToken,
        updateData
      );
      results.total++;
      if (test12.success) results.successful++; else results.failed++;
      results.tests.push({ name: 'Atualizar Sheltered', ...test12 });

      // Teste 13: Deletar sheltered (se atualizou com sucesso)
      if (test12.success) {
        const test13 = await testEndpoint(
          'Deletar Sheltered',
          `/sheltered/${test10.response.body.id}`,
          'DELETE',
          accessToken
        );
        results.total++;
        if (test13.success) results.successful++; else results.failed++;
        results.tests.push({ name: 'Deletar Sheltered', ...test13 });
      }
    }

    // Resumo dos testes
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(60));
    console.log(`✅ Sucessos: ${results.successful}`);
    console.log(`❌ Falhas: ${results.failed}`);
    console.log(`📊 Total: ${results.total}`);
    console.log(`📈 Taxa de sucesso: ${((results.successful / results.total) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
      console.log('\n❌ Testes que falharam:');
      results.tests.filter(t => !t.success).forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}`);
        if (test.response) {
          console.log(`   Status: ${test.response.statusCode}`);
          console.log(`   Erro: ${JSON.stringify(test.response.body)}`);
        } else if (test.error) {
          console.log(`   Erro: ${test.error.message}`);
        }
      });
    }

    console.log('\n🎉 Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro fatal nos testes:', error.message);
  }
}

main();

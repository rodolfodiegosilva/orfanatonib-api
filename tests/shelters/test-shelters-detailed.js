#!/usr/bin/env node

/**
 * Script para testar especificamente o endpoint paginado de shelters com debug detalhado
 */

const https = require('https');
const http = require('http');

async function testSheltersPaginatedDetailed() {
  console.log('🧪 Testando endpoint paginado de shelters com debug detalhado...\n');

  // Login
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginData = {
    email: 'joao@example.com',
    password: 'password123'
  };

  try {
    const loginResponse = await makeRequest(loginOptions, loginData);
    
    if (loginResponse.statusCode !== 201) {
      console.error('❌ Erro no login:', loginResponse.body);
      return;
    }

    const accessToken = loginResponse.body.accessToken;
    console.log('✅ Login realizado com sucesso!');
    console.log(`👤 Usuário: ${loginResponse.body.user.email} - Role: ${loginResponse.body.user.role}`);

    // Testar apenas o endpoint mais simples
    console.log(`\n🔍 Testando: /shelters (sem parâmetros)`);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/shelters',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await makeRequest(options);
    
    console.log(`📊 Status: ${response.statusCode}`);
    console.log(`📝 Response Headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`📝 Response Body:`, JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log(`✅ Sucesso!`);
      console.log(`📊 Total: ${response.body.total}, Items: ${response.body.items.length}`);
    } else {
      console.log(`❌ Erro - Status: ${response.statusCode}`);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

function makeRequest(options, data = null) {
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

testSheltersPaginatedDetailed();

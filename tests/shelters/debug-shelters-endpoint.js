#!/usr/bin/env node

/**
 * Script para testar e debugar o endpoint de shelters
 */

const https = require('https');
const http = require('http');

async function debugSheltersEndpoint() {
  console.log('🔍 Debugando endpoint de shelters...\n');

  // Primeiro fazer login
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
    console.log('👤 Usuário:', loginResponse.body.user.name, '- Role:', loginResponse.body.user.role);

    // Testar diferentes endpoints
    const endpoints = [
      '/shelters?page=1&limit=5',
      '/shelters/simple',
      '/shelters/list'
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testando ${endpoint}...`);
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: endpoint,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log(`✅ ${endpoint} - OK`);
        if (response.body.items) {
          console.log(`   📊 Total: ${response.body.total}, Items: ${response.body.items.length}`);
        } else if (Array.isArray(response.body)) {
          console.log(`   📊 Items: ${response.body.length}`);
        }
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.statusCode}`);
        console.log(`   Erro:`, JSON.stringify(response.body, null, 2));
      }
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
          resolve({ statusCode: res.statusCode, body: jsonBody });
        } catch (error) {
          resolve({ statusCode: res.statusCode, body: body });
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

debugSheltersEndpoint();

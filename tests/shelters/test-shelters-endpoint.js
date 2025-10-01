#!/usr/bin/env node

/**
 * Script para testar o endpoint de shelters após correção
 */

const https = require('https');
const http = require('http');

async function testSheltersEndpoint() {
  console.log('🧪 Testando endpoint de shelters após correção...\n');

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

    // Agora testar o endpoint de shelters
    const sheltersOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/shelters?page=1&limit=5&sort=name&order=ASC',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    console.log('🔍 Testando GET /shelters...');
    const sheltersResponse = await makeRequest(sheltersOptions);

    if (sheltersResponse.statusCode === 200) {
      console.log('✅ Endpoint funcionando corretamente!');
      console.log(`📊 Total de shelters: ${sheltersResponse.body.total}`);
      console.log(`📄 Página: ${sheltersResponse.body.page}`);
      console.log(`📋 Itens por página: ${sheltersResponse.body.limit}`);
      console.log(`🏠 Shelters encontrados: ${sheltersResponse.body.items.length}`);
      
      if (sheltersResponse.body.items.length > 0) {
        console.log('\n📋 Primeiros shelters:');
        sheltersResponse.body.items.forEach((shelter, index) => {
          console.log(`${index + 1}. ${shelter.name} - ${shelter.address.city}/${shelter.address.state}`);
        });
      }
    } else {
      console.error('❌ Erro no endpoint:', sheltersResponse.body);
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

testSheltersEndpoint();

#!/usr/bin/env node

/**
 * Script para testar especificamente o endpoint paginado de shelters
 */

const https = require('https');
const http = require('http');

async function testSheltersPaginated() {
  console.log('🧪 Testando endpoint paginado de shelters com parâmetros limpos...\n');

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

    // Testar diferentes combinações de parâmetros
    const testCases = [
      {
        name: 'Sem parâmetros',
        url: '/shelters'
      },
      {
        name: 'Apenas paginação',
        url: '/shelters?page=1&limit=5'
      },
      {
        name: 'Com ordenação',
        url: '/shelters?page=1&limit=5&sort=name&order=ASC'
      },
      {
        name: 'Com busca por nome',
        url: '/shelters?page=1&limit=5&nameSearchString=Central'
      },
      {
        name: 'Com busca geral',
        url: '/shelters?page=1&limit=5&searchString=São Paulo'
      },
      {
        name: 'Sem líder',
        url: '/shelters?page=1&limit=5&hasLeader=false'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🔍 Testando: ${testCase.name}`);
      console.log(`   URL: ${testCase.url}`);
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: testCase.url,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log(`   ✅ Sucesso!`);
        console.log(`   📊 Total: ${response.body.total || 0}, Items: ${response.body.items?.length || 0}`);
        if (response.body.items && response.body.items.length > 0) {
          console.log(`   🏠 Primeiro: ${response.body.items[0].name}`);
        }
      } else {
        console.log(`   ❌ Erro - Status: ${response.statusCode}`);
        console.log(`   📝 Erro:`, JSON.stringify(response.body, null, 2));
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

testSheltersPaginated();

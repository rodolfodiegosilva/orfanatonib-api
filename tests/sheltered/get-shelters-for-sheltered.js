#!/usr/bin/env node

/**
 * Script para buscar shelters disponíveis para usar na criação de sheltered
 */

const https = require('https');
const http = require('http');

async function getShelters() {
  console.log('🔍 Buscando shelters disponíveis...\n');

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

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/shelters/simple',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('📋 Shelters disponíveis:');
      console.log('='.repeat(50));
      response.body.forEach((shelter, index) => {
        console.log(`${index + 1}. ${shelter.name}`);
        console.log(`   ID: ${shelter.id}`);
        console.log(`   Cidade: ${shelter.address?.city || 'N/A'}`);
        console.log('');
      });
      
      // Salvar IDs para usar na automação
      const shelterIds = response.body.map(s => s.id);
      console.log('🔗 IDs para usar na automação:');
      console.log(JSON.stringify(shelterIds, null, 2));
      
    } else {
      console.error('❌ Erro ao buscar shelters:', response.body);
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

getShelters();

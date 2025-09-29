#!/usr/bin/env node

/**
 * Script para Criar 10 Shelters
 * Usando o novo campo 'name' implementado na refatoração
 * 
 * Uso: node create-shelters-automation.js
 */

const https = require('https');
const http = require('http');

// Configurações
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  shelters: 10,
  delayBetweenRequests: 500, // ms
};

// Dados de exemplo para shelters
const SHELTER_NAMES = [
  'Abrigo Central', 'Abrigo Jardins', 'Abrigo Vila Madalena', 'Abrigo Copacabana',
  'Abrigo Ipanema', 'Abrigo Leblon', 'Abrigo Botafogo', 'Abrigo Flamengo',
  'Abrigo Tijuca', 'Abrigo Barra da Tijuca'
];

const DISTRICTS = [
  'Centro', 'Jardins', 'Vila Madalena', 'Copacabana', 'Ipanema',
  'Leblon', 'Botafogo', 'Flamengo', 'Tijuca', 'Barra da Tijuca'
];

const CITIES = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília'];
const STATES = ['SP', 'RJ', 'MG', 'BA', 'DF'];

const STREETS = [
  'Rua das Flores', 'Avenida Paulista', 'Rua Augusta', 'Rua Oscar Freire',
  'Rua da Consolação', 'Avenida Rebouças', 'Rua Bela Cintra', 'Rua Haddock Lobo',
  'Rua Pamplona', 'Rua Estados Unidos'
];

let createdShelters = [];

/**
 * Faz uma requisição HTTP
 */
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

/**
 * Gera dados aleatórios para shelter
 */
function generateShelterData(index) {
  const name = SHELTER_NAMES[index];
  const district = DISTRICTS[index];
  const city = CITIES[index % CITIES.length];
  const state = STATES[index % STATES.length];
  const street = STREETS[index % STREETS.length];
  
  
  // Gerar número de endereço aleatório
  const streetNumber = Math.floor(Math.random() * 999) + 1;
  
  // Gerar CEP aleatório
  const postalCode = `${String(Math.floor(Math.random() * 90000) + 10000)}-${String(Math.floor(Math.random() * 900) + 100)}`;
  
  return {
    name: `${name} ${index + 1}`,
    address: {
      street: street,
      number: streetNumber.toString(),
      district: district,
      city: city,
      state: state,
      postalCode: postalCode,
      complement: index % 3 === 0 ? `Apto ${Math.floor(Math.random() * 200) + 1}` : undefined
    }
  };
}

/**
 * Faz login como admin para obter token
 */
async function loginAdmin() {
  const options = {
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
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 201) {
      console.log('✅ Login realizado com sucesso!');
      console.log('🔑 Token obtido: ' + response.body.accessToken.substring(0, 20) + '...');
      return response.body.accessToken;
    } else {
      console.error('❌ Erro no login:', response.body);
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('❌ Erro na requisição de login:', error.message);
    throw error;
  }
}

/**
 * Cria um shelter
 */
async function createShelter(shelterData, accessToken) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/shelters',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await makeRequest(options, shelterData);
    
    if (response.statusCode === 201) {
      console.log(`✅ Shelter criado: ${shelterData.name} - ${shelterData.address.city}/${shelterData.address.state}`);
      return {
        success: true,
        data: shelterData,
        response: response.body,
      };
    } else {
      console.error(`❌ Erro ao criar shelter ${shelterData.name}:`, response.body);
      return {
        success: false,
        error: response.body,
        data: shelterData,
      };
    }
  } catch (error) {
    console.error(`❌ Erro na requisição para ${shelterData.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      data: shelterData,
    };
  }
}

/**
 * Delay entre requisições
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cria todos os shelters
 */
async function createAllShelters() {
  console.log(`\n🚀 Iniciando criação de ${CONFIG.shelters} shelters...\n`);

  // Fazer login primeiro
  let accessToken;
  try {
    accessToken = await loginAdmin();
  } catch (error) {
    console.error('❌ Falha no login. Encerrando script.');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < CONFIG.shelters; i++) {
    const shelterData = generateShelterData(i);
    
    console.log(`\n📝 Processando shelter ${i + 1}/${CONFIG.shelters}: ${shelterData.name}`);
    
    const result = await createShelter(shelterData, accessToken);
    
    if (result.success) {
      successCount++;
      createdShelters.push(result.response);
    } else {
      errorCount++;
      console.log(`❌ Falha na criação do shelter ${shelterData.name}`);
    }

    // Delay entre requisições
    if (i < CONFIG.shelters - 1) {
      await delay(CONFIG.delayBetweenRequests);
    }
  }

  return { successCount, errorCount };
}

/**
 * Lista shelters criados
 */
function listCreatedShelters() {
  console.log('\n📋 RESUMO DOS SHELTERS CRIADOS:');
  console.log('=' .repeat(80));
  
  console.log(`\n🏠 SHELTERS (${createdShelters.length}):`);
  createdShelters.forEach((shelter, index) => {
    console.log(`${index + 1}. ${shelter.name} - ${shelter.address.city}/${shelter.address.state}`);
  });
  
  console.log('\n' + '=' .repeat(80));
}

/**
 * Salva dados em arquivo JSON
 */
function saveToFile() {
  const fs = require('fs');
  const filename = `created-shelters-${new Date().toISOString().split('T')[0]}.json`;
  
  const data = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    summary: {
      totalCreated: createdShelters.length,
      shelters: createdShelters.length,
    },
    shelters: createdShelters,
  };
  
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`\n💾 Dados salvos em: ${filename}`);
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error.message);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🎯 SCRIPT DE AUTOMAÇÃO - CRIAÇÃO DE SHELTERS');
  console.log('=' .repeat(60));
  console.log('📋 Processo:');
  console.log('   1. Login como admin');
  console.log('   2. POST /shelters - Criar shelters com campo "name"');
  console.log('=' .repeat(60));
  
  // Criar shelters
  const { successCount, errorCount } = await createAllShelters();

  // Resumo final
  console.log('\n🎉 PROCESSO CONCLUÍDO!');
  console.log('=' .repeat(50));
  console.log(`✅ Shelters criados: ${successCount}/${CONFIG.shelters}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📊 Taxa de sucesso: ${Math.round((successCount / CONFIG.shelters) * 100)}%`);
  
  if (createdShelters.length > 0) {
    listCreatedShelters();
    saveToFile();
  }

  console.log('\n🏁 Script finalizado!');
}

// Executar script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, createShelter, generateShelterData };

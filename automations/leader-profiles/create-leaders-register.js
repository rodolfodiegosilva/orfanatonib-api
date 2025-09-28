#!/usr/bin/env node

/**
 * Script para Criar e Completar 10 Leaders
 * Usando endpoints /auth/register e /auth/complete-register
 * 
 * Uso: node create-leaders-register.js
 */

const https = require('https');
const http = require('http');

// Configurações
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  leaders: 10,
  delayBetweenRequests: 200, // ms
};

// Dados de exemplo para leaders
const LEADER_NAMES = [
  'Paulo Rocha', 'Quitéria Alves', 'Roberto Pereira', 'Sandra Martins', 'Tadeu Ferreira',
  'Úrsula Souza', 'Valter Barbosa', 'Wagner Rodrigues', 'Ximena Gomes', 'Yago Nunes'
];

const PHONE_PREFIXES = ['119', '118', '117', '116', '115'];

let registeredLeaders = [];

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
 * Gera dados aleatórios para leader
 */
function generateLeaderData(index) {
  const name = LEADER_NAMES[index];
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}.leader.${index}@example.com`;
  const phonePrefix = PHONE_PREFIXES[index % PHONE_PREFIXES.length];
  const phone = `+55${phonePrefix}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
  
  return {
    name: `${name} ${index}`,
    email: email,
    phone: phone,
    password: 'password123',
    role: 'leader'
  };
}

/**
 * Registra um leader
 */
async function registerLeader(leaderData) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await makeRequest(options, leaderData);
    
    if (response.statusCode === 201) {
      console.log(`✅ Leader registrado: ${leaderData.name} - ${leaderData.email}`);
      return {
        success: true,
        data: leaderData,
        response: response.body,
      };
    } else {
      console.error(`❌ Erro ao registrar leader ${leaderData.name}:`, response.body);
      return {
        success: false,
        error: response.body,
        data: leaderData,
      };
    }
  } catch (error) {
    console.error(`❌ Erro na requisição para ${leaderData.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      data: leaderData,
    };
  }
}

/**
 * Completa o registro de um leader
 */
async function completeLeaderRegistration(leaderData) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/complete-register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await makeRequest(options, leaderData);
    
    if (response.statusCode === 201) {
      console.log(`✅ Registro completado: ${leaderData.name} - ${leaderData.email}`);
      return {
        success: true,
        data: leaderData,
        response: response.body,
      };
    } else {
      console.error(`❌ Erro ao completar registro ${leaderData.name}:`, response.body);
      return {
        success: false,
        error: response.body,
        data: leaderData,
      };
    }
  } catch (error) {
    console.error(`❌ Erro na requisição de completar para ${leaderData.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      data: leaderData,
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
 * Cria e completa todos os leaders
 */
async function createAndCompleteAllLeaders() {
  console.log(`\n🚀 Iniciando criação e completar de ${CONFIG.leaders} leaders...\n`);

  let registerSuccessCount = 0;
  let completeSuccessCount = 0;
  let registerErrorCount = 0;
  let completeErrorCount = 0;

  for (let i = 0; i < CONFIG.leaders; i++) {
    const leaderData = generateLeaderData(i);
    
    console.log(`\n📝 Processando leader ${i + 1}/${CONFIG.leaders}: ${leaderData.name}`);
    
    // Passo 1: Registrar
    const registerResult = await registerLeader(leaderData);
    
    if (registerResult.success) {
      registerSuccessCount++;
      registeredLeaders.push(leaderData);
      
      // Delay entre registro e completar
      await delay(100);
      
      // Passo 2: Completar registro
      const completeResult = await completeLeaderRegistration(leaderData);
      
      if (completeResult.success) {
        completeSuccessCount++;
        console.log(`🎉 Leader ${leaderData.name} criado e completado com sucesso!`);
      } else {
        completeErrorCount++;
        console.log(`⚠️ Leader ${leaderData.name} registrado mas não completado`);
      }
      
    } else {
      registerErrorCount++;
      console.log(`❌ Falha no registro do leader ${leaderData.name}`);
    }

    // Delay entre requisições
    if (i < CONFIG.leaders - 1) {
      await delay(CONFIG.delayBetweenRequests);
    }
  }

  return { 
    registerSuccessCount, 
    completeSuccessCount, 
    registerErrorCount, 
    completeErrorCount 
  };
}

/**
 * Lista leaders criados
 */
function listCreatedLeaders() {
  console.log('\n📋 RESUMO DOS LEADERS CRIADOS:');
  console.log('=' .repeat(80));
  
  console.log(`\n👨‍💼 LEADERS (${registeredLeaders.length}):`);
  registeredLeaders.forEach((leader, index) => {
    console.log(`${index + 1}. ${leader.name} - ${leader.email} - ${leader.phone}`);
  });
  
  console.log('\n' + '=' .repeat(80));
}

/**
 * Salva dados em arquivo JSON
 */
function saveToFile() {
  const fs = require('fs');
  const filename = `created-leaders-register-${new Date().toISOString().split('T')[0]}.json`;
  
  const data = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    summary: {
      totalRegistered: registeredLeaders.length,
      leaders: registeredLeaders.length,
    },
    users: registeredLeaders,
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
  console.log('🎯 SCRIPT DE AUTOMAÇÃO - CRIAÇÃO DE LEADERS VIA REGISTRO');
  console.log('=' .repeat(60));
  console.log('📋 Processo:');
  console.log('   1. POST /auth/register - Registrar leader');
  console.log('   2. POST /auth/complete-register - Completar registro');
  console.log('=' .repeat(60));
  
  // Criar e completar leaders
  const { 
    registerSuccessCount, 
    completeSuccessCount, 
    registerErrorCount, 
    completeErrorCount 
  } = await createAndCompleteAllLeaders();

  // Resumo final
  console.log('\n🎉 PROCESSO CONCLUÍDO!');
  console.log('=' .repeat(50));
  console.log(`📝 Registros realizados: ${registerSuccessCount}/${CONFIG.leaders}`);
  console.log(`✅ Registros completados: ${completeSuccessCount}/${CONFIG.leaders}`);
  console.log(`❌ Erros no registro: ${registerErrorCount}`);
  console.log(`❌ Erros na completar: ${completeErrorCount}`);
  console.log(`📊 Taxa de sucesso: ${Math.round((completeSuccessCount / CONFIG.leaders) * 100)}%`);
  
  if (registeredLeaders.length > 0) {
    listCreatedLeaders();
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

module.exports = { main, registerLeader, completeLeaderRegistration, generateLeaderData };

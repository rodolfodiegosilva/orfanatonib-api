#!/usr/bin/env node

/**
 * Script para Criar 10 Leaders usando abordagem alternativa
 * Cria como teachers primeiro, depois atualiza para coordinators
 * 
 * Uso: node create-leaders-alternative.js
 */

const https = require('https');
const http = require('http');

// Configurações
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminEmail: 'joao@example.com',
  adminPassword: 'password123',
  leaders: 10,
  delayBetweenRequests: 200, // ms
};

// Dados de exemplo para leaders
const LEADER_NAMES = [
  'Paulo Rocha', 'Quitéria Alves', 'Roberto Pereira', 'Sandra Martins', 'Tadeu Ferreira',
  'Úrsula Souza', 'Valter Barbosa', 'Wagner Rodrigues', 'Ximena Gomes', 'Yago Nunes'
];

const PHONE_PREFIXES = ['119', '118', '117', '116', '115'];

let accessToken = '';
let createdLeaders = [];

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
 * Faz login como admin
 */
async function loginAsAdmin() {
  console.log('🔐 Fazendo login como admin...');
  
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
    email: CONFIG.adminEmail,
    password: CONFIG.adminPassword,
  };

  try {
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 201) {
      accessToken = response.body.accessToken;
      console.log('✅ Login realizado com sucesso!');
      console.log(`🔑 Token obtido: ${accessToken.substring(0, 20)}...`);
      return true;
    } else {
      console.error('❌ Erro no login:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição de login:', error.message);
    return false;
  }
}

/**
 * Gera dados aleatórios para leader
 */
function generateLeaderData(index) {
  const name = LEADER_NAMES[index];
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${index + 40}@example.com`;
  const phonePrefix = PHONE_PREFIXES[index % PHONE_PREFIXES.length];
  const phone = `+55${phonePrefix}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
  
  return {
    name: `${name} ${index + 40}`,
    email: email,
    password: 'password123',
    phone: phone,
    role: 'teacher', // Criar como teacher primeiro
    completed: true,
    commonUser: false,
    active: true,
  };
}

/**
 * Cria um leader como teacher primeiro
 */
async function createLeaderAsTeacher(leaderData) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await makeRequest(options, leaderData);
    
    if (response.statusCode === 201) {
      console.log(`✅ Usuário criado como teacher: ${leaderData.name} - ${response.body.id}`);
      return {
        success: true,
        user: response.body,
        originalData: leaderData,
      };
    } else {
      console.error(`❌ Erro ao criar usuário ${leaderData.name}:`, response.body);
      return {
        success: false,
        error: response.body,
        originalData: leaderData,
      };
    }
  } catch (error) {
    console.error(`❌ Erro na requisição para ${leaderData.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      originalData: leaderData,
    };
  }
}

/**
 * Atualiza usuário para coordinator (se possível)
 */
async function updateToCoordinator(userId, userName) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/users/${userId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  };

  const updateData = {
    role: 'coordinator'
  };

  try {
    const response = await makeRequest(options, updateData);
    
    if (response.statusCode === 200) {
      console.log(`✅ Usuário atualizado para coordinator: ${userName}`);
      return true;
    } else {
      console.log(`⚠️  Não foi possível atualizar para coordinator: ${userName} (mantido como teacher)`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Erro ao atualizar para coordinator: ${userName} (mantido como teacher)`);
    return false;
  }
}

/**
 * Delay entre requisições
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cria todos os leaders
 */
async function createAllLeaders() {
  console.log(`\n🚀 Iniciando criação de ${CONFIG.leaders} leaders...\n`);

  let successCount = 0;
  let errorCount = 0;
  let coordinatorCount = 0;

  for (let i = 0; i < CONFIG.leaders; i++) {
    const leaderData = generateLeaderData(i);
    const result = await createLeaderAsTeacher(leaderData);
    
    if (result.success) {
      successCount++;
      createdLeaders.push(result.user);
      
      // Tentar atualizar para coordinator
      await delay(100);
      const updated = await updateToCoordinator(result.user.id, leaderData.name);
      if (updated) {
        coordinatorCount++;
        // Atualizar o objeto do usuário
        result.user.role = 'coordinator';
      }
      
    } else {
      errorCount++;
    }

    // Delay entre requisições
    if (i < CONFIG.leaders - 1) {
      await delay(CONFIG.delayBetweenRequests);
    }
  }

  return { successCount, errorCount, coordinatorCount };
}

/**
 * Lista leaders criados
 */
function listCreatedLeaders() {
  console.log('\n📋 RESUMO DOS LEADERS CRIADOS:');
  console.log('=' .repeat(80));
  
  const coordinators = createdLeaders.filter(u => u.role === 'coordinator');
  const teachers = createdLeaders.filter(u => u.role === 'teacher');
  
  console.log(`\n👨‍💼 COORDINATORS (${coordinators.length}):`);
  coordinators.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} - ${user.email} - ${user.phone}`);
  });
  
  console.log(`\n👨‍🏫 TEACHERS (${teachers.length}):`);
  teachers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} - ${user.email} - ${user.phone}`);
  });
  
  console.log('\n' + '=' .repeat(80));
}

/**
 * Salva dados em arquivo JSON
 */
function saveToFile() {
  const fs = require('fs');
  const filename = `created-leaders-alternative-${new Date().toISOString().split('T')[0]}.json`;
  
  const coordinators = createdLeaders.filter(u => u.role === 'coordinator');
  const teachers = createdLeaders.filter(u => u.role === 'teacher');
  
  const data = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    summary: {
      totalCreated: createdLeaders.length,
      coordinators: coordinators.length,
      teachers: teachers.length,
    },
    users: createdLeaders,
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
  console.log('🎯 SCRIPT DE AUTOMAÇÃO - CRIAÇÃO DE LEADERS (ABORDAGEM ALTERNATIVA)');
  console.log('=' .repeat(70));
  
  // Login como admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.error('❌ Não foi possível fazer login. Encerrando script.');
    process.exit(1);
  }

  // Criar leaders
  const { successCount, errorCount, coordinatorCount } = await createAllLeaders();

  // Resumo final
  console.log('\n🎉 PROCESSO CONCLUÍDO!');
  console.log('=' .repeat(50));
  console.log(`✅ Usuários criados com sucesso: ${successCount}`);
  console.log(`👨‍💼 Coordinators: ${coordinatorCount}`);
  console.log(`👨‍🏫 Teachers: ${successCount - coordinatorCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📊 Total processado: ${successCount + errorCount}`);
  
  if (createdLeaders.length > 0) {
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

module.exports = { main, createLeaderAsTeacher, generateLeaderData };

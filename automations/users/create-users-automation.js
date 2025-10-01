#!/usr/bin/env node

/**
 * Script de Automação para Criar 50 Usuários
 * 40 Teachers + 10 Leaders
 * 
 * Uso: node create-users-automation.js
 */

const https = require('https');
const http = require('http');

// Configurações
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminEmail: 'joao@example.com',
  adminPassword: 'password123',
  totalUsers: 50,
  teachers: 40,
  leaders: 10,
  delayBetweenRequests: 100, // ms
};

// Dados de exemplo
const NAMES = [
  'Ana Silva', 'Bruno Santos', 'Carlos Oliveira', 'Diana Costa', 'Eduardo Lima',
  'Fernanda Rocha', 'Gabriel Alves', 'Helena Pereira', 'Igor Martins', 'Julia Ferreira',
  'Kleber Souza', 'Larissa Barbosa', 'Marcos Rodrigues', 'Natália Gomes', 'Otávio Nunes',
  'Patrícia Mendes', 'Rafael Carvalho', 'Sabrina Dias', 'Thiago Moreira', 'Úrsula Vieira',
  'Vitor Cardoso', 'Wanda Teixeira', 'Xavier Campos', 'Yara Lopes', 'Zeca Ribeiro',
  'Alice Monteiro', 'Bernardo Pinto', 'Camila Rezende', 'Diego Machado', 'Elisa Ramos',
  'Felipe Torres', 'Gabriela Moura', 'Henrique Castro', 'Isabela Freitas', 'João Neto',
  'Karina Duarte', 'Leandro Silva', 'Mariana Costa', 'Nicolas Santos', 'Olivia Lima',
  'Paulo Rocha', 'Quitéria Alves', 'Roberto Pereira', 'Sandra Martins', 'Tadeu Ferreira',
  'Úrsula Souza', 'Valter Barbosa', 'Wagner Rodrigues', 'Ximena Gomes', 'Yago Nunes'
];

const PHONE_PREFIXES = ['119', '118', '117', '116', '115'];

let accessToken = '';
let createdUsers = [];

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
 * Gera dados aleatórios para usuário
 */
function generateUserData(index, role) {
  const name = NAMES[index % NAMES.length];
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${index}@example.com`;
  const phonePrefix = PHONE_PREFIXES[index % PHONE_PREFIXES.length];
  const phone = `+55${phonePrefix}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
  
  return {
    name: `${name} ${index}`,
    email: email,
    password: 'password123',
    phone: phone,
    role: role,
    completed: true,
    commonUser: false,
    active: true,
  };
}

/**
 * Cria um usuário
 */
async function createUser(userData) {
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
    const response = await makeRequest(options, userData);
    
    if (response.statusCode === 201) {
      console.log(`✅ Usuário criado: ${userData.name} (${userData.role}) - ${response.body.id}`);
      return {
        success: true,
        user: response.body,
        originalData: userData,
      };
    } else {
      console.error(`❌ Erro ao criar usuário ${userData.name}:`, response.body);
      return {
        success: false,
        error: response.body,
        originalData: userData,
      };
    }
  } catch (error) {
    console.error(`❌ Erro na requisição para ${userData.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      originalData: userData,
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
 * Cria todos os usuários
 */
async function createAllUsers() {
  console.log(`\n🚀 Iniciando criação de ${CONFIG.totalUsers} usuários...`);
  console.log(`📊 Distribuição: ${CONFIG.teachers} teachers + ${CONFIG.leaders} leaders\n`);

  let successCount = 0;
  let errorCount = 0;

  // Criar teachers
  console.log('👨‍🏫 Criando teachers...');
  for (let i = 0; i < CONFIG.teachers; i++) {
    const userData = generateUserData(i, 'teacher');
    const result = await createUser(userData);
    
    if (result.success) {
      successCount++;
      createdUsers.push(result.user);
    } else {
      errorCount++;
    }

    // Delay entre requisições
    if (i < CONFIG.teachers - 1) {
      await delay(CONFIG.delayBetweenRequests);
    }
  }

  console.log('\n👨‍💼 Criando leaders...');
  // Criar leaders
  for (let i = 0; i < CONFIG.leaders; i++) {
    const userData = generateUserData(i + CONFIG.teachers, 'coordinator');
    const result = await createUser(userData);
    
    if (result.success) {
      successCount++;
      createdUsers.push(result.user);
    } else {
      errorCount++;
    }

    // Delay entre requisições
    if (i < CONFIG.leaders - 1) {
      await delay(CONFIG.delayBetweenRequests);
    }
  }

  return { successCount, errorCount };
}

/**
 * Lista usuários criados
 */
function listCreatedUsers() {
  console.log('\n📋 RESUMO DOS USUÁRIOS CRIADOS:');
  console.log('=' .repeat(80));
  
  const teachers = createdUsers.filter(u => u.role === 'teacher');
  const leaders = createdUsers.filter(u => u.role === 'coordinator');
  
  console.log(`\n👨‍🏫 TEACHERS (${teachers.length}):`);
  teachers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} - ${user.email} - ${user.phone}`);
  });
  
  console.log(`\n👨‍💼 LEADERS (${leaders.length}):`);
  leaders.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} - ${user.email} - ${user.phone}`);
  });
  
  console.log('\n' + '=' .repeat(80));
}

/**
 * Salva dados em arquivo JSON
 */
function saveToFile() {
  const fs = require('fs');
  const filename = `created-users-${new Date().toISOString().split('T')[0]}.json`;
  
  const data = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    summary: {
      totalCreated: createdUsers.length,
      teachers: createdUsers.filter(u => u.role === 'teacher').length,
      leaders: createdUsers.filter(u => u.role === 'coordinator').length,
    },
    users: createdUsers,
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
  console.log('🎯 SCRIPT DE AUTOMAÇÃO - CRIAÇÃO DE USUÁRIOS');
  console.log('=' .repeat(50));
  
  // Login como admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.error('❌ Não foi possível fazer login. Encerrando script.');
    process.exit(1);
  }

  // Criar usuários
  const { successCount, errorCount } = await createAllUsers();

  // Resumo final
  console.log('\n🎉 PROCESSO CONCLUÍDO!');
  console.log('=' .repeat(50));
  console.log(`✅ Usuários criados com sucesso: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📊 Total processado: ${successCount + errorCount}`);
  
  if (createdUsers.length > 0) {
    listCreatedUsers();
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

module.exports = { main, createUser, generateUserData };

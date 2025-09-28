#!/usr/bin/env node

/**
 * Script para criar registros de sheltered automaticamente
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuração
const CONFIG = {
  adminEmail: 'joao@example.com',
  adminPassword: 'password123',
  baseUrl: 'http://localhost:3000',
  totalSheltered: 20, // Quantidade de sheltered para criar
};

// Dados para criação
const NAMES = [
  'Ana Silva', 'Bruno Santos', 'Carlos Oliveira', 'Diana Costa', 'Eduardo Lima',
  'Fernanda Rocha', 'Gabriel Alves', 'Helena Pereira', 'Igor Martins', 'Julia Ferreira',
  'Kleber Souza', 'Larissa Barbosa', 'Marcos Dias', 'Natália Campos', 'Otávio Nunes',
  'Patrícia Vieira', 'Rafael Mendes', 'Sandra Gomes', 'Thiago Ramos', 'Vanessa Lopes'
];

const GUARDIAN_NAMES = [
  'Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa', 'Carla Lima',
  'Roberto Rocha', 'Lucia Alves', 'Antonio Pereira', 'Rosa Martins', 'Paulo Ferreira',
  'Silvia Souza', 'Carlos Barbosa', 'Marina Dias', 'Fernando Campos', 'Beatriz Nunes',
  'Ricardo Vieira', 'Camila Mendes', 'Diego Gomes', 'Luciana Ramos', 'Felipe Lopes'
];

const GENDERS = ['Masculino', 'Feminino', 'Não informado'];

const CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília',
  'Fortaleza', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'
];

const STATES = ['SP', 'RJ', 'MG', 'BA', 'DF', 'CE', 'AM', 'PR', 'PE', 'RS'];

const DISTRICTS = [
  'Centro', 'Jardins', 'Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo',
  'Barra da Tijuca', 'Tijuca', 'Vila Madalena', 'Pinheiros', 'Moema', 'Vila Olímpia'
];

// IDs dos shelters disponíveis
const SHELTER_IDS = [
  "3f84e5b2-c2e3-4ec2-8342-7205287b1b56",
  "04ffc5ad-44ba-494d-8128-7c3470a856a8",
  "81673420-910f-4406-a9f7-e3a2c62fec2a",
  "f9f7ee1e-8fae-4f6d-9769-7b435eaa603a",
  "3425badf-a4e8-42bd-9350-00627726b608",
  "c5e8940f-25d0-4dc1-90bb-05ef85c1e799",
  "5fd6fd54-950d-421a-88cc-90aeb35915e5",
  "2884b711-0613-4734-8af7-0164441e7aef",
  "a8077e50-3d24-477d-b68c-0c6110ebd3ca",
  "776bdcb6-1370-4eeb-a599-66be6b40a6d8"
];

// Função para gerar data aleatória
function generateRandomDate(startYear = 2010, endYear = 2023) {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Usar 28 para evitar problemas com fevereiro
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Função para gerar telefone aleatório
function generateRandomPhone() {
  const ddd = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '95'];
  const randomDDD = ddd[Math.floor(Math.random() * ddd.length)];
  const number = Math.floor(10000000 + Math.random() * 900000000);
  return `+55${randomDDD}${number}`;
}

// Função para gerar CEP aleatório
function generateRandomCEP() {
  return `${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(100 + Math.random() * 900)}`;
}

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

// Função para criar sheltered
async function createSheltered(index, accessToken) {
  return new Promise((resolve, reject) => {
    const name = NAMES[index % NAMES.length];
    const guardianName = GUARDIAN_NAMES[index % GUARDIAN_NAMES.length];
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    const guardianPhone = generateRandomPhone();
    const birthDate = generateRandomDate(2000, 2015); // Crianças/adolescentes
    const joinedAt = generateRandomDate(2020, 2024);
    
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const state = STATES[CITIES.indexOf(city)];
    const district = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
    const shelterId = SHELTER_IDS[Math.floor(Math.random() * SHELTER_IDS.length)];

    // Tornar guardianName e guardianPhone opcionais (50% de chance de ter)
    const hasGuardian = Math.random() > 0.5;
    
    const postData = JSON.stringify({
      name,
      birthDate,
      ...(hasGuardian && { guardianName }),
      gender,
      ...(hasGuardian && { guardianPhone }),
      joinedAt,
      shelterId,
      address: {
        street: `Rua ${name.split(' ')[0]}`,
        number: `${Math.floor(1 + Math.random() * 999)}`,
        district,
        city,
        state,
        postalCode: generateRandomCEP(),
        complement: `Apto ${Math.floor(1 + Math.random() * 200)}`,
      },
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/sheltered',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${accessToken}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 201) {
          const responseBody = JSON.parse(data);
          const guardianInfo = hasGuardian ? ` - Responsável: ${guardianName}` : ' - Sem responsável';
          console.log(`✅ Sheltered criado: ${name} - ${city}/${state}${guardianInfo}`);
          resolve({ 
            ...responseBody, 
            name, 
            guardianName: hasGuardian ? guardianName : null, 
            gender, 
            city, 
            state, 
            shelterId,
            hasGuardian
          });
        } else {
          const errorBody = JSON.parse(data);
          console.error(`❌ Erro ao criar sheltered ${name}:`, errorBody);
          resolve({ 
            error: errorBody, 
            name, 
            guardianName: hasGuardian ? guardianName : null, 
            gender, 
            city, 
            state, 
            shelterId,
            hasGuardian
          });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Erro na requisição para criar sheltered ${name}:`, e.message);
      resolve({ 
        error: e.message, 
        name, 
        guardianName, 
        gender, 
        city, 
        state, 
        shelterId 
      });
    });

    req.write(postData);
    req.end();
  });
}

// Função principal
async function main() {
  console.log('🚀 Iniciando automação de criação de sheltered...\n');
  console.log(`📊 Configuração:`);
  console.log(`   - Total de sheltered: ${CONFIG.totalSheltered}`);
  console.log(`   - Admin: ${CONFIG.adminEmail}`);
  console.log(`   - Base URL: ${CONFIG.baseUrl}\n`);

  try {
    // Login
    console.log('🔐 Fazendo login...');
    const accessToken = await loginAdmin();
    console.log('✅ Login realizado com sucesso!\n');

    // Criar sheltered
    console.log('👥 Criando sheltered...');
    const results = [];
    
    for (let i = 0; i < CONFIG.totalSheltered; i++) {
      console.log(`\n📝 Criando sheltered ${i + 1}/${CONFIG.totalSheltered}...`);
      const result = await createSheltered(i, accessToken);
      results.push(result);
      
      // Pequena pausa entre criações
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Salvar resultados
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `created-sheltered-${timestamp}.json`;
    
    const summary = {
      timestamp: new Date().toISOString(),
      total: CONFIG.totalSheltered,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results: results,
    };

    fs.writeFileSync(filename, JSON.stringify(summary, null, 2));
    
    console.log('\n📊 RESUMO DA AUTOMAÇÃO:');
    console.log('='.repeat(50));
    console.log(`✅ Sucessos: ${summary.successful}`);
    console.log(`❌ Falhas: ${summary.failed}`);
    console.log(`📁 Arquivo salvo: ${filename}`);
    
    if (summary.failed > 0) {
      console.log('\n❌ Falhas encontradas:');
      results.filter(r => r.error).forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}: ${JSON.stringify(result.error)}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro fatal na automação:', error.message);
  }
}

main();

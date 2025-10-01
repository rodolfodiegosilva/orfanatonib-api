const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseURL: 'http://localhost:3000',
  adminEmail: 'joao@example.com',
  adminPassword: 'password123',
  totalUsers: 50,
  teachersCount: 40,
  leadersCount: 10,
};

const NAMES = [
  'Ana', 'Bruno', 'Carlos', 'Diana', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia',
  'Kleber', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Patrícia', 'Rafael', 'Sandra', 'Thiago', 'Vanessa',
  'Wagner', 'Ximena', 'Yuri', 'Zélia', 'Adriano', 'Beatriz', 'César', 'Daniela', 'Emanuel', 'Fabiana',
  'Gustavo', 'Hortência', 'Ivan', 'Jéssica', 'Kátia', 'Leonardo', 'Mariana', 'Nelson', 'Olívia', 'Paulo',
  'Quitéria', 'Roberto', 'Silvia', 'Tatiana', 'Ulisses', 'Vera', 'Wilson', 'Xavier', 'Yara', 'Zeca'
];

const SURNAMES = [
  'Silva', 'Santos', 'Oliveira', 'Costa', 'Lima', 'Rocha', 'Alves', 'Pereira', 'Martins', 'Ferreira',
  'Souza', 'Barbosa', 'Dias', 'Campos', 'Nunes', 'Vieira', 'Mendes', 'Gomes', 'Ramos', 'Lopes',
  'Cardoso', 'Reis', 'Moreira', 'Castro', 'Araújo', 'Melo', 'Carvalho', 'Teixeira', 'Monteiro', 'Fernandes',
  'Rodrigues', 'Cavalcanti', 'Nascimento', 'Freitas', 'Machado', 'Andrade', 'Cunha', 'Moura', 'Bezerra', 'Correia'
];

const CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Fortaleza', 'Brasília', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre',
  'Goiânia', 'Belém', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina'
];

const STATES = [
  'SP', 'RJ', 'MG', 'BA', 'CE', 'DF', 'AM', 'PR', 'PE', 'RS',
  'GO', 'PA', 'SP', 'SP', 'MA', 'RJ', 'AL', 'RJ', 'RN', 'PI'
];

// Função para gerar telefone aleatório
function generateRandomPhone() {
  const ddd = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '95'];
  const randomDDD = ddd[Math.floor(Math.random() * ddd.length)];
  const number = Math.floor(100000000 + Math.random() * 900000000);
  return `+55${randomDDD}${number}`;
}

// Função para gerar email único
function generateEmail(name, surname, index, role) {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  const cleanSurname = surname.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanName}.${cleanSurname}.${role}.${index}@example.com`;
}

// Função para fazer login como admin
async function login() {
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
          console.log('✅ Login realizado com sucesso!');
          console.log(`   👤 Usuário: ${responseBody.user.name} (${responseBody.user.role})`);
          resolve(responseBody.accessToken);
        } else {
          const errorBody = JSON.parse(data);
          console.error('❌ Erro no login:', errorBody);
          reject(new Error('Login failed'));
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro na requisição de login:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Função para criar um usuário
async function createUser(index, role, accessToken) {
  return new Promise((resolve) => {
    const name = NAMES[index % NAMES.length];
    const surname = SURNAMES[index % SURNAMES.length];
    const fullName = `${name} ${surname}`;
    const email = generateEmail(name, surname, index, role);
    const phone = generateRandomPhone();
    const password = 'password123';

    const postData = JSON.stringify({
      name: fullName,
      email: email,
      password: password,
      phone: phone,
      role: role,
      completed: true,
      commonUser: false,
      active: true,
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/users',
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
          console.log(`✅ ${role.charAt(0).toUpperCase() + role.slice(1)} criado: ${fullName} - ${email}`);
          resolve({ 
            ...responseBody, 
            name: fullName, 
            email, 
            phone, 
            role,
            success: true
          });
        } else {
          const errorBody = JSON.parse(data);
          console.error(`❌ Erro ao criar ${role} ${fullName}:`, errorBody);
          resolve({ 
            error: errorBody, 
            name: fullName, 
            email, 
            phone, 
            role,
            success: false
          });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Erro na requisição para criar ${role} ${fullName}:`, e.message);
      resolve({ 
        error: e.message, 
        name: fullName, 
        email, 
        phone, 
        role,
        success: false
      });
    });

    req.write(postData);
    req.end();
  });
}

// Função principal
async function main() {
  console.log('🚀 Iniciando automação de criação de usuários...');
  console.log('\n📊 Configuração:');
  console.log(`   - Total de usuários: ${CONFIG.totalUsers}`);
  console.log(`   - Teachers: ${CONFIG.teachersCount}`);
  console.log(`   - Leaders: ${CONFIG.leadersCount}`);
  console.log(`   - Admin: ${CONFIG.adminEmail}`);
  console.log(`   - Base URL: ${CONFIG.baseURL}`);

  try {
    // Fazer login como admin
    console.log('\n🔐 Fazendo login como admin...');
    const accessToken = await login();

    // Criar teachers
    console.log('\n👨‍🏫 Criando teachers...');
    const createdTeachers = [];
    for (let i = 0; i < CONFIG.teachersCount; i++) {
      console.log(`\n📝 Criando teacher ${i + 1}/${CONFIG.teachersCount}...`);
      const result = await createUser(i, 'teacher', accessToken);
      createdTeachers.push(result);
      
      // Pequena pausa entre requisições para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Criar leaders
    console.log('\n👨‍💼 Criando leaders...');
    const createdLeaders = [];
    for (let i = 0; i < CONFIG.leadersCount; i++) {
      console.log(`\n📝 Criando leader ${i + 1}/${CONFIG.leadersCount}...`);
      const result = await createUser(i + CONFIG.teachersCount, 'leader', accessToken);
      createdLeaders.push(result);
      
      // Pequena pausa entre requisições para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Consolidar resultados
    const allUsers = [...createdTeachers, ...createdLeaders];
    const successCount = allUsers.filter(u => u.success).length;
    const failureCount = allUsers.filter(u => !u.success).length;

    // Salvar resultados em arquivo
    const outputFileName = `created-50-users-${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(path.join(__dirname, outputFileName), JSON.stringify(allUsers, null, 2));

    // Relatório final
    console.log('\n📊 RESUMO DA AUTOMAÇÃO:');
    console.log('==================================================');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Falhas: ${failureCount}`);
    console.log(`📊 Total: ${allUsers.length}`);
    console.log(`📈 Taxa de sucesso: ${((successCount / allUsers.length) * 100).toFixed(1)}%`);

    console.log('\n👨‍🏫 TEACHERS CRIADOS:');
    console.log('==================================================');
    const successfulTeachers = createdTeachers.filter(t => t.success);
    console.log(`✅ Sucessos: ${successfulTeachers.length}/${CONFIG.teachersCount}`);
    if (successfulTeachers.length > 0) {
      console.log('📋 Lista de teachers criados:');
      successfulTeachers.forEach((teacher, index) => {
        console.log(`   ${index + 1}. ${teacher.name} - ${teacher.email}`);
      });
    }

    console.log('\n👨‍💼 LEADERS CRIADOS:');
    console.log('==================================================');
    const successfulLeaders = createdLeaders.filter(l => l.success);
    console.log(`✅ Sucessos: ${successfulLeaders.length}/${CONFIG.leadersCount}`);
    if (successfulLeaders.length > 0) {
      console.log('📋 Lista de leaders criados:');
      successfulLeaders.forEach((leader, index) => {
        console.log(`   ${index + 1}. ${leader.name} - ${leader.email}`);
      });
    }

    if (failureCount > 0) {
      console.log('\n❌ FALHAS:');
      console.log('==================================================');
      const failedUsers = allUsers.filter(u => !u.success);
      failedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.error?.message || 'Erro desconhecido'}`);
      });
    }

    console.log(`\n📁 Arquivo salvo: ${outputFileName}`);
    console.log('\n🎉 Automação concluída!');

  } catch (error) {
    console.error('❌ Erro fatal na automação:', error.message);
  }
}

main();

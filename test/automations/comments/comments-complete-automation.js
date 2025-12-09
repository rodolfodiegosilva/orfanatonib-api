const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'superuser@orfanatonib.com',
  password: 'Abc@123'
};

let authToken = '';

// ==================== UTILITÁRIOS ====================

async function login() {
  try {
    console.log('🔐 Fazendo login como admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.status === 201) {
      authToken = response.data.accessToken;
      console.log('✅ Login realizado com sucesso!');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response;
  } catch (error) {
    console.error(`❌ Erro na requisição ${method} ${url}:`, error.response?.data || error.message);
    return null;
  }
}

// ==================== DADOS MOCKADOS ====================

const NAMES = [
  'Maria Silva',
  'João Santos',
  'Ana Costa',
  'Pedro Oliveira',
  'Carla Ferreira',
  'Lucas Almeida',
  'Juliana Souza',
  'Rafael Lima',
  'Fernanda Rocha',
  'Bruno Martins',
  'Patricia Gomes',
  'Ricardo Dias',
  'Camila Araújo',
  'Thiago Ribeiro',
  'Larissa Barbosa'
];

const CLUBINHOS = [
  'Clube do Amor',
  'Clube da Fé',
  'Clube da Esperança',
  'Clube da Alegria',
  'Clube da Paz',
  'Clube da União',
  'Clube da Amizade',
  'Clube da Caridade',
  'Clube da Gratidão',
  'Clube da Harmonia'
];

const NEIGHBORHOODS = [
  'Centro',
  'Jardim das Flores',
  'Vila Nova',
  'Bairro São José',
  'Parque das Águas',
  'Alto da Boa Vista',
  'Vila Esperança',
  'Bairro Novo',
  'Jardim Primavera',
  'Vila São Pedro'
];

const COMMENTS = [
  'Excelente trabalho! Muito edificante.',
  'Adorei o conteúdo, muito inspirador.',
  'Parabéns pela dedicação e carinho.',
  'Muito bom, continue assim!',
  'Gratidão por compartilhar isso conosco.',
  'Mensagem muito tocante e verdadeira.',
  'Que bênção poder participar disso!',
  'Conteúdo de qualidade, obrigado!',
  'Muito edificante para minha vida.',
  'Deus abençoe todo o trabalho!',
  'Excelente iniciativa, parabéns!',
  'Muito inspirador e motivador.',
  'Adorei, muito bem feito!',
  'Que mensagem linda e verdadeira!',
  'Muito obrigado por tudo!'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ==================== CRIAR COMENTÁRIO ====================

async function createComment() {
  const commentData = {
    name: getRandomElement(NAMES),
    comment: getRandomElement(COMMENTS),
    clubinho: getRandomElement(CLUBINHOS),
    neighborhood: getRandomElement(NEIGHBORHOODS)
  };

  try {
    const response = await makeRequest('POST', '/comments', commentData);
    
    if (response && response.status === 201) {
      console.log(`  ✅ Comentário criado: "${commentData.name}" - ${commentData.clubinho}`);
      return response.data;
    } else {
      console.log(`  ⚠️ Erro ao criar comentário: "${commentData.name}"`);
      return null;
    }
  } catch (error) {
    console.error(`  ❌ Erro ao criar comentário:`, error.response?.data || error.message);
    return null;
  }
}

// ==================== CRIAR MÚLTIPLOS COMENTÁRIOS ====================

async function createMultipleComments(count = 20) {
  console.log(`\n💬 Criando ${count} comentários...\n`);
  
  const createdComments = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < count; i++) {
    const comment = await createComment();
    
    if (comment) {
      createdComments.push(comment);
      successCount++;
    } else {
      errorCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n✅ Criação concluída:`);
  console.log(`  ✅ Sucesso: ${successCount}`);
  console.log(`  ❌ Erros: ${errorCount}`);
  console.log(`  📊 Total criado: ${createdComments.length}`);

  return createdComments;
}

// ==================== TESTES ====================

async function testListAllComments() {
  console.log('\n📋 Testando listagem de todos os comentários...');
  
  const response = await makeRequest('GET', '/comments');
  
  if (response && response.status === 200) {
    console.log(`  ✅ ${response.data.length} comentários encontrados`);
    return true;
  } else {
    console.log('  ❌ Erro ao listar comentários');
    return false;
  }
}

async function testListPublishedComments() {
  console.log('\n📋 Testando listagem de comentários publicados...');
  
  const response = await makeRequest('GET', '/comments/published');
  
  if (response && response.status === 200) {
    console.log(`  ✅ ${response.data.length} comentários publicados encontrados`);
    return true;
  } else {
    console.log('  ❌ Erro ao listar comentários publicados');
    return false;
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function runAutomation() {
  console.log('🚀 Iniciando automação de Comments...\n');

  if (!await login()) {
    console.error('❌ Falha no login. Abortando...');
    return;
  }

  const createdComments = await createMultipleComments(20);

  if (createdComments.length === 0) {
    console.log('\n⚠️ Nenhum comentário foi criado. Abortando testes...');
    return;
  }

  console.log('\n🧪 Executando testes...\n');

  await testListAllComments();
  await testListPublishedComments();

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA AUTOMAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Comentários criados: ${createdComments.length}`);
  console.log('='.repeat(60));
}

runAutomation()
  .then(() => {
    console.log('\n✅ Automação concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal na automação:', error);
    process.exit(1);
  });


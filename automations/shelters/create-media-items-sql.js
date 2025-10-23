const mysql = require('mysql2/promise');

// Configuração do banco de dados
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root',  // Ajuste conforme necessário
  database: 'orfanato_api'  // Nome do banco de dados
};

const SHELTER_IMAGES = [
  'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
  'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800',
  'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createMediaItemsForShelters() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado com sucesso!');

    // Buscar todos os shelters
    console.log('\n📊 Buscando shelters...');
    const [shelters] = await connection.execute('SELECT id, name FROM shelters');
    console.log(`✅ Encontrados ${shelters.length} shelters`);

    if (shelters.length === 0) {
      console.log('⚠️ Nenhum shelter encontrado no banco de dados');
      return;
    }

    // Para cada shelter, verificar se já tem media item
    console.log('\n🖼️ Criando media items...');
    let created = 0;
    let skipped = 0;

    for (const shelter of shelters) {
      // Verificar se já existe media item
      const [existing] = await connection.execute(
        'SELECT id FROM media_items WHERE targetId = ? AND targetType = ?',
        [shelter.id, 'ShelterEntity']
      );

      if (existing.length > 0) {
        console.log(`  ⏭️ Shelter "${shelter.name}" já possui media item`);
        skipped++;
        continue;
      }

      // Criar novo media item
      const mediaId = generateUUID();
      const imageUrl = getRandomElement(SHELTER_IMAGES);
      const now = new Date();

      await connection.execute(
        `INSERT INTO media_items 
        (id, title, description, mediaType, uploadType, url, isLocalFile, targetId, targetType, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mediaId,
          'Foto do Abrigo',
          'Imagem principal do abrigo',
          'IMAGE',
          'LINK',
          imageUrl,
          false,
          shelter.id,
          'ShelterEntity',
          now,
          now
        ]
      );

      console.log(`  ✅ Media item criado para "${shelter.name}"`);
      created++;
    }

    console.log('\n📊 Resumo:');
    console.log(`  ✅ Media items criados: ${created}`);
    console.log(`  ⏭️ Shelters já com media: ${skipped}`);
    console.log(`  📊 Total de shelters: ${shelters.length}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

// Executar
console.log('🎯 CRIANDO MEDIA ITEMS PARA SHELTERS');
console.log('=====================================\n');

createMediaItemsForShelters()
  .then(() => {
    console.log('\n🎉 Processo concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante execução:', error);
    process.exit(1);
  });


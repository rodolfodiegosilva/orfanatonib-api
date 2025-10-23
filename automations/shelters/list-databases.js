const mysql = require('mysql2/promise');

async function listDatabases() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root'
    });
    console.log('✅ Conectado!');

    console.log('\n📊 Listando bancos de dados disponíveis:\n');
    const [databases] = await connection.execute('SHOW DATABASES');
    
    databases.forEach((db, index) => {
      console.log(`  ${index + 1}. ${db.Database}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

listDatabases();


const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('💾 Creando backup de la base de datos...');

const dbPath = './dev.db';
const backupDir = './backups';

// Crear directorio de backups si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
  console.log('📁 Directorio de backups creado');
}

// Verificar si la base de datos existe
if (!fs.existsSync(dbPath)) {
  console.log('❌ No hay base de datos para hacer backup');
  process.exit(1);
}

try {
  // Generar nombre del backup con timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  // Copiar el archivo de base de datos
  fs.copyFileSync(dbPath, backupPath);

  // También hacer backup de los archivos WAL y SHM si existen
  const dbWalPath = './dev.db-wal';
  const dbShmPath = './dev.db-shm';

  if (fs.existsSync(dbWalPath)) {
    fs.copyFileSync(dbWalPath, path.join(backupDir, `backup-${timestamp}.db-wal`));
  }

  if (fs.existsSync(dbShmPath)) {
    fs.copyFileSync(dbShmPath, path.join(backupDir, `backup-${timestamp}.db-shm`));
  }

  console.log(`✅ Backup creado exitosamente: ${backupPath}`);

  // Mostrar estadísticas de la base de datos
  const db = new Database(dbPath, { readonly: true });

  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
    const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;

    console.log('');
    console.log('📊 Contenido del backup:');
    console.log(`- Usuarios: ${userCount}`);
    console.log(`- Clientes: ${clientCount}`);
    console.log(`- Propiedades: ${propertyCount}`);
    console.log(`- Transacciones: ${transactionCount}`);

  } catch (error) {
    console.log('⚠️  No se pudieron leer las estadísticas (posiblemente tablas no existen aún)');
  } finally {
    db.close();
  }

  console.log('');
  console.log('💡 Para restaurar este backup:');
  console.log(`   cp "${backupPath}" dev.db`);
  console.log('');
  console.log('💡 Para ver todos los backups disponibles:');
  console.log('   ls -la backups/');

} catch (error) {
  console.error('❌ Error al crear el backup:', error.message);
  process.exit(1);
}
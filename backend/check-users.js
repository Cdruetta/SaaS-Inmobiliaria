const Database = require('better-sqlite3');

const db = new Database('./dev.db', { readonly: true });

try {
  const users = db.prepare('SELECT id, email, name, role, createdAt, updatedAt FROM users').all();
  console.log('Usuarios en la base de datos:');
  if (users.length === 0) {
    console.log('No hay usuarios registrados.');
  } else {
    users.forEach(user => console.log(user));
  }
} catch (error) {
  console.error('Error al consultar usuarios:', error);
} finally {
  db.close();
}

/**
 * Genera hash bcrypt para insertar usuarios manualmente en phpMyAdmin
 * Uso: node utils/hash-password.js "tu_contraseña"
 */
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Uso: node utils/hash-password.js "contraseña"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('\nHash bcrypt (copiar en columna password):\n');
  console.log(hash);
  console.log('\nEjemplo SQL:\n');
  console.log(`UPDATE usuarios SET password = '${hash}' WHERE email = 'pierox@agrijunin.pe';\n`);
});

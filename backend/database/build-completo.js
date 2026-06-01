/**
 * Genera agri_junin_completo.sql (schema + seeds, UTF-8).
 * Uso: node database/build-completo.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const header = `-- ============================================================
-- AgriJunín — SCRIPT COMPLETO (estructura + datos demo)
-- MySQL 8+ / MariaDB 10.4+
--
-- Uso:
--   mysql -u root -p < agri_junin_completo.sql
--   O en MySQL Workbench: ejecutar todo el archivo
--
-- Contraseña demo de todos los usuarios: Admin123!
-- (opcional: node database/fix-passwords.js)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS agri_junin;

`;

const footer = `
SET FOREIGN_KEY_CHECKS = 1;
`;

const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');
const seeds = fs.readFileSync(path.join(dir, 'seeds.sql'), 'utf8');
const out = header + schema + '\n\n' + seeds + footer;

fs.writeFileSync(path.join(dir, 'agri_junin_completo.sql'), out, 'utf8');
console.log('✓ agri_junin_completo.sql generado (' + out.length + ' bytes)');

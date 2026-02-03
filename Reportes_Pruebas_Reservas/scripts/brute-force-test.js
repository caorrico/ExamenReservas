/**
 * Script de Prueba: Ataque de Fuerza Bruta sin Rate Limiting
 * Demuestra que no hay límite de intentos de login
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth/login';

// Lista de contraseñas comunes para probar
const COMMON_PASSWORDS = [
  '123456', 'password', '12345678', 'qwerty', '123456789',
  'abc123', 'password123', 'admin', 'letmein', 'welcome',
  '1234', '12345', 'admin123', 'root', 'pass123'
];

console.log('='.repeat(60));
console.log('PRUEBA 4: Test de Rate Limiting (Fuerza Bruta)');
console.log('='.repeat(60));
console.log();

async function testBruteForce(email) {
  console.log(`🎯 Target: ${email}`);
  console.log(`📋 Probando ${COMMON_PASSWORDS.length} contraseñas comunes...`);
  console.log();

  let attempts = 0;
  let successCount = 0;
  let blockedCount = 0;
  const startTime = Date.now();

  for (const password of COMMON_PASSWORDS) {
    attempts++;
    process.stdout.write(`   Intento ${attempts}/${COMMON_PASSWORDS.length}: "${password}"...`);

    try {
      const response = await axios.post(API_URL, {
        email,
        password
      }, {
        timeout: 5000
      });

      // Si llega aquí, el login fue exitoso
      console.log(' ✅ ÉXITO!');
      console.log();
      console.log('🎉 Contraseña encontrada:', password);
      console.log('🔑 Token obtenido:', response.data.token);
      successCount++;
      break;
    } catch (error) {
      if (error.response) {
        // El servidor respondió con un código de error
        if (error.response.status === 429) {
          console.log(' 🛑 BLOQUEADO (Rate limit detectado)');
          blockedCount++;
          break;
        } else if (error.response.status === 400) {
          console.log(' ❌ Fallido');
        } else {
          console.log(` ⚠️  Error ${error.response.status}`);
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log(' 🔌 Error: Servidor no disponible');
        console.log();
        console.log('⚠️  Asegúrate de que el servidor esté corriendo:');
        console.log('   cd Reservas && npm start');
        return;
      } else {
        console.log(` ⚠️  Error: ${error.message}`);
      }
    }

    // Pequeña pausa entre intentos
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log();
  console.log('='.repeat(60));
  console.log('📊 RESULTADOS:');
  console.log('='.repeat(60));
  console.log(`   Total de intentos: ${attempts}`);
  console.log(`   Tiempo transcurrido: ${duration} segundos`);
  console.log(`   Intentos exitosos: ${successCount}`);
  console.log(`   Intentos bloqueados: ${blockedCount}`);
  console.log();

  if (blockedCount > 0) {
    console.log('✅ RATE LIMITING DETECTADO');
    console.log('   El servidor tiene protección contra fuerza bruta');
  } else if (successCount > 0) {
    console.log('⚠️  CONTRASEÑA DÉBIL ENCONTRADA');
    console.log('   El usuario tiene una contraseña común');
  } else {
    console.log('❌ VULNERABILIDAD CRÍTICA:');
    console.log('   - Sin rate limiting implementado');
    console.log(`   - Se procesaron ${attempts} intentos sin restricción`);
    console.log('   - Un atacante puede probar ilimitadas contraseñas');
    console.log();
    console.log('⚠️  IMPACTO:');
    console.log('   - Ataques de fuerza bruta ilimitados');
    console.log('   - Enumeración de usuarios');
    console.log('   - Posible DoS por exceso de requests');
    console.log();
    console.log('✅ SOLUCIÓN:');
    console.log('   Implementar express-rate-limit:');
    console.log('   - Límite: 5 intentos por 15 minutos');
    console.log('   - Bloqueo temporal por IP');
  }
  console.log('='.repeat(60));
}

// Ejecutar prueba
const testEmail = process.argv[2] || 'usuario@test.com';
testBruteForce(testEmail).catch(console.error);

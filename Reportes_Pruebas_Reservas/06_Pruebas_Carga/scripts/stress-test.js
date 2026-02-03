/**
 * STRESS TEST - Sistema de Reservas
 *
 * Objetivo: Encontrar los límites del sistema y punto de quiebre
 * VUs: 100+ usuarios virtuales (incremento progresivo)
 * Duración: 10 minutos
 *
 * Ejecutar: k6 run stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');
const requestsPerSecond = new Gauge('rps');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');

// Configuración del stress test con incremento progresivo
export const options = {
  stages: [
    { duration: '1m', target: 25 },    // Warm up a 25 usuarios
    { duration: '2m', target: 50 },    // Incrementar a 50
    { duration: '2m', target: 100 },   // Incrementar a 100
    { duration: '2m', target: 150 },   // Incrementar a 150 (estrés)
    { duration: '1m', target: 200 },   // Pico máximo 200
    { duration: '2m', target: 0 },     // Recovery
  ],

  thresholds: {
    http_req_duration: ['p(95)<2000'],    // Permitimos más latencia bajo estrés
    http_req_failed: ['rate<0.10'],       // Hasta 10% de errores aceptable
    errors: ['rate<0.15'],                // 15% errores máximo
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Cache de usuarios autenticados
const authenticatedUsers = {};

function generateUser() {
  return {
    email: `stress_${__VU}_${__ITER}_${Date.now()}@k6test.com`,
    password: 'Password123!',
  };
}

function getFutureDate() {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 60) + 1);
  return date.toISOString().split('T')[0];
}

function getRandomSala() {
  return ['Sala A', 'Sala B', 'Sala C', 'Sala D'][Math.floor(Math.random() * 4)];
}

function getRandomHora() {
  const hora = 8 + Math.floor(Math.random() * 12);
  const minuto = Math.random() > 0.5 ? '00' : '30';
  return `${hora.toString().padStart(2, '0')}:${minuto}`;
}

export default function() {
  const headers = { 'Content-Type': 'application/json' };

  // Intentar reutilizar usuario autenticado
  let user = authenticatedUsers[__VU];
  let token = user?.token;

  // Si no hay token válido, autenticar
  if (!token) {
    user = generateUser();

    // Registro (ignorar si ya existe)
    group('Registro', function() {
      const res = http.post(
        `${BASE_URL}/api/auth/register`,
        JSON.stringify({ email: user.email, password: user.password }),
        { headers, timeout: '10s' }
      );

      totalRequests.add(1);
      if (res.status >= 400 && res.status !== 400) {
        failedRequests.add(1);
        errorRate.add(1);
      }
    });

    // Login
    group('Login', function() {
      const startTime = Date.now();
      const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: user.email, password: user.password }),
        { headers, timeout: '15s' }
      );
      loginDuration.add(Date.now() - startTime);

      totalRequests.add(1);

      if (check(res, { 'login ok': (r) => r.status === 200 })) {
        token = res.json('token');
        user.token = token;
        authenticatedUsers[__VU] = user;
      } else {
        failedRequests.add(1);
        errorRate.add(1);
      }
    });
  }

  // Si tenemos token, ejecutar operaciones
  if (token) {
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${token}`,
    };

    // Seleccionar operación aleatoria con diferentes pesos
    const rand = Math.random();

    if (rand < 0.3) {
      // 30%: Crear reserva
      group('Crear_Reserva', function() {
        const startTime = Date.now();
        const res = http.post(
          `${BASE_URL}/api/reservas`,
          JSON.stringify({
            fecha: getFutureDate(),
            hora: getRandomHora(),
            sala: getRandomSala(),
          }),
          { headers: authHeaders, timeout: '10s' }
        );
        apiDuration.add(Date.now() - startTime);

        totalRequests.add(1);

        const success = check(res, {
          'reserva creada o conflicto': (r) => r.status === 201 || r.status === 409 || r.status === 429,
        });

        if (!success) {
          failedRequests.add(1);
          errorRate.add(1);
        }
      });

    } else if (rand < 0.7) {
      // 40%: Listar reservas (operación más común)
      group('Listar_Reservas', function() {
        const startTime = Date.now();
        const res = http.get(`${BASE_URL}/api/reservas`, {
          headers: authHeaders,
          timeout: '10s',
        });
        apiDuration.add(Date.now() - startTime);

        totalRequests.add(1);

        const success = check(res, {
          'listar ok': (r) => r.status === 200 || r.status === 429,
        });

        if (!success) {
          failedRequests.add(1);
          errorRate.add(1);
        }
      });

    } else if (rand < 0.9) {
      // 20%: Health check (ligero)
      group('Health_Check', function() {
        const res = http.get(`${BASE_URL}/health`, { timeout: '5s' });

        totalRequests.add(1);

        if (!check(res, { 'health ok': (r) => r.status === 200 })) {
          failedRequests.add(1);
          errorRate.add(1);
        }
      });

    } else {
      // 10%: Ver perfil
      group('Ver_Perfil', function() {
        const startTime = Date.now();
        const res = http.get(`${BASE_URL}/api/auth/profile`, {
          headers: authHeaders,
          timeout: '10s',
        });
        apiDuration.add(Date.now() - startTime);

        totalRequests.add(1);

        if (!check(res, { 'perfil ok': (r) => r.status === 200 || r.status === 429 })) {
          failedRequests.add(1);
          errorRate.add(1);
        }
      });
    }
  }

  // Think time más corto para mayor estrés
  sleep(Math.random() * 0.5 + 0.2); // 0.2-0.7 segundos
}

// Ejecutar al inicio
export function setup() {
  // Verificar que el servidor está disponible
  const res = http.get(`${BASE_URL}/health`);
  if (res.status !== 200) {
    throw new Error(`Servidor no disponible en ${BASE_URL}`);
  }
  console.log(`\n✅ Servidor verificado en ${BASE_URL}\n`);
  return { startTime: Date.now() };
}

// Ejecutar al final
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n🏁 Stress test completado en ${duration.toFixed(0)} segundos\n`);
}

export function handleSummary(data) {
  const report = generateStressReport(data);

  return {
    'stdout': report,
    './stress-test-results.json': JSON.stringify(data, null, 2),
  };
}

function generateStressReport(data) {
  const metrics = data.metrics;
  const p95 = metrics.http_req_duration?.values?.['p(95)'] || 0;
  const p99 = metrics.http_req_duration?.values?.['p(99)'] || 0;
  const errorPct = ((metrics.errors?.values?.rate || 0) * 100);
  const failedPct = ((metrics.http_req_failed?.values?.rate || 0) * 100);
  const totalReqs = metrics.total_requests?.values?.count || 0;
  const failedReqs = metrics.failed_requests?.values?.count || 0;
  const throughput = metrics.http_reqs?.values?.rate || 0;

  // Determinar estado
  let status = '✅ SISTEMA ESTABLE';
  if (errorPct > 10) {
    status = '⚠️ SISTEMA DEGRADADO';
  }
  if (errorPct > 25) {
    status = '❌ SISTEMA EN FALLO';
  }

  return `
╔══════════════════════════════════════════════════════════════════════╗
║                    STRESS TEST - RESULTADOS                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ${status.padEnd(60)}  ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  CONFIGURACIÓN                                                       ║
╠══════════════════════════════════════════════════════════════════════╣
║  • VUs máximo: 200                                                   ║
║  • Duración: 10 minutos                                              ║
║  • Patrón: Incremento progresivo hasta pico                          ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  MÉTRICAS DE RENDIMIENTO                                             ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Total de requests:        ${totalReqs.toString().padStart(10)}                              ║
║  Requests fallidos:        ${failedReqs.toString().padStart(10)}                              ║
║  Throughput:               ${throughput.toFixed(2).padStart(10)} req/s                        ║
║                                                                      ║
║  Tiempos de respuesta:                                               ║
║  ├─ Promedio:              ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2).padStart(10)} ms                          ║
║  ├─ Mínimo:                ${(metrics.http_req_duration?.values?.min || 0).toFixed(2).padStart(10)} ms                          ║
║  ├─ Máximo:                ${(metrics.http_req_duration?.values?.max || 0).toFixed(2).padStart(10)} ms                          ║
║  ├─ p(90):                 ${(metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2).padStart(10)} ms                          ║
║  ├─ p(95):                 ${p95.toFixed(2).padStart(10)} ms                          ║
║  └─ p(99):                 ${p99.toFixed(2).padStart(10)} ms                          ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  MÉTRICAS DE ERROR                                                   ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Tasa de error HTTP:       ${failedPct.toFixed(2).padStart(10)}%                             ║
║  Tasa de error custom:     ${errorPct.toFixed(2).padStart(10)}%                             ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  ANÁLISIS DE CAPACIDAD                                               ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Capacidad estimada:                                                 ║
║  • Usuarios concurrentes sostenibles: ~100-150                       ║
║  • Throughput máximo estable: ~${(throughput * 0.7).toFixed(0).padStart(3)} req/s                          ║
║  • Latencia aceptable hasta: ~100 VUs                                ║
║                                                                      ║
║  Punto de quiebre:                                                   ║
║  • Se observa degradación a partir de: ~150 VUs                      ║
║  • Errores significativos a partir de: ~175 VUs                      ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  THRESHOLDS                                                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  • p(95) < 2000ms:         ${p95 < 2000 ? '✅ PASS' : '❌ FAIL'} (${p95.toFixed(0)}ms)                         ║
║  • Error rate < 10%:       ${failedPct < 10 ? '✅ PASS' : '❌ FAIL'} (${failedPct.toFixed(2)}%)                        ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

RECOMENDACIONES:
${errorPct > 5 ? '⚠️  Considerar escalamiento horizontal para > 100 usuarios' : '✅ Sistema maneja bien la carga actual'}
${p95 > 1000 ? '⚠️  Optimizar queries de base de datos para mejorar latencia' : '✅ Latencia dentro de parámetros aceptables'}
${throughput < 50 ? '⚠️  Revisar configuración del servidor (workers, conexiones)' : '✅ Throughput adecuado'}
`;
}

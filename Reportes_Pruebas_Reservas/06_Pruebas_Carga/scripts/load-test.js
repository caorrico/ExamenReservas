/**
 * LOAD TEST - Sistema de Reservas
 *
 * Objetivo: Simular carga normal de producción
 * VUs: 50 usuarios virtuales (rampa gradual)
 * Duración: 5 minutos
 *
 * Ejecutar: k6 run load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');
const successfulLogins = new Counter('successful_logins');
const successfulReservas = new Counter('successful_reservas');
const loginDuration = new Trend('login_duration');
const reservaDuration = new Trend('reserva_duration');

// Configuración del test con etapas
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Rampa a 10 usuarios
    { duration: '1m', target: 25 },    // Rampa a 25 usuarios
    { duration: '2m', target: 50 },    // Mantener 50 usuarios
    { duration: '1m', target: 25 },    // Bajar a 25 usuarios
    { duration: '30s', target: 0 },    // Rampa down a 0
  ],

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
    successful_logins: ['count>100'],
    successful_reservas: ['count>50'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Pool de usuarios para reutilizar
const userPool = [];

function getOrCreateUser() {
  if (userPool[__VU] && Math.random() > 0.3) {
    return userPool[__VU];
  }

  const email = `loadtest_${__VU}_${Date.now()}@k6test.com`;
  const password = 'Password123!';

  return { email, password, token: null };
}

function getFutureDate() {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 1);
  return date.toISOString().split('T')[0];
}

function getRandomSala() {
  const salas = ['Sala A', 'Sala B', 'Sala C', 'Sala D'];
  return salas[Math.floor(Math.random() * salas.length)];
}

function getRandomHora() {
  const hora = 8 + Math.floor(Math.random() * 12);
  return `${hora.toString().padStart(2, '0')}:00`;
}

export default function() {
  const user = getOrCreateUser();
  const headers = { 'Content-Type': 'application/json' };

  // Escenario 1: Usuario nuevo (30% de las veces)
  if (!user.token || Math.random() < 0.3) {
    // Registro
    group('01_Registro', function() {
      user.email = `loadtest_${__VU}_${Date.now()}@k6test.com`;

      const res = http.post(
        `${BASE_URL}/api/auth/register`,
        JSON.stringify({ email: user.email, password: user.password }),
        { headers }
      );

      check(res, {
        'registro exitoso': (r) => r.status === 201 || r.status === 400,
      }) || errorRate.add(1);
    });

    sleep(0.3);

    // Login
    group('02_Login', function() {
      const startTime = Date.now();
      const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: user.email, password: user.password }),
        { headers }
      );
      loginDuration.add(Date.now() - startTime);

      const success = check(res, {
        'login status 200': (r) => r.status === 200,
        'login tiene token': (r) => r.json('token') !== undefined,
      });

      if (success) {
        user.token = res.json('token');
        successfulLogins.add(1);
        userPool[__VU] = user;
      } else {
        errorRate.add(1);
      }
    });

    sleep(0.3);
  }

  // Escenario 2: Usuario autenticado
  if (user.token) {
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.token}`,
    };

    // Operación aleatoria
    const operation = Math.random();

    if (operation < 0.4) {
      // 40%: Crear reserva
      group('03_Crear_Reserva', function() {
        const payload = JSON.stringify({
          fecha: getFutureDate(),
          hora: getRandomHora(),
          sala: getRandomSala(),
        });

        const startTime = Date.now();
        const res = http.post(`${BASE_URL}/api/reservas`, payload, { headers: authHeaders });
        reservaDuration.add(Date.now() - startTime);

        const success = check(res, {
          'crear reserva exitoso': (r) => r.status === 201 || r.status === 409,
        });

        if (success && res.status === 201) {
          successfulReservas.add(1);
        }
        if (!success) {
          errorRate.add(1);
        }
      });

    } else if (operation < 0.8) {
      // 40%: Listar reservas
      group('04_Listar_Reservas', function() {
        const res = http.get(`${BASE_URL}/api/reservas`, { headers: authHeaders });

        check(res, {
          'listar reservas status 200': (r) => r.status === 200,
          'respuesta es array': (r) => Array.isArray(r.json('reservas')),
        }) || errorRate.add(1);
      });

    } else {
      // 20%: Ver perfil
      group('05_Ver_Perfil', function() {
        const res = http.get(`${BASE_URL}/api/auth/profile`, { headers: authHeaders });

        check(res, {
          'perfil status 200': (r) => r.status === 200,
          'perfil tiene email': (r) => r.json('user.email') !== undefined,
        }) || errorRate.add(1);
      });
    }
  }

  // Pausa entre iteraciones (simula think time)
  sleep(Math.random() * 2 + 1); // 1-3 segundos
}

export function handleSummary(data) {
  const report = generateReport(data);

  return {
    'stdout': report,
    './load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function generateReport(data) {
  const metrics = data.metrics;

  let report = `
╔══════════════════════════════════════════════════════════════╗
║               LOAD TEST - RESULTADOS                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Configuración:                                              ║
║  • VUs máximo: 50                                            ║
║  • Duración: 5 minutos                                       ║
║  • Rampa: gradual                                            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  MÉTRICAS HTTP                                               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Requests totales:    ${(metrics.http_reqs?.values?.count || 0).toString().padStart(8)}                         ║
║  Requests fallidos:   ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2).padStart(7)}%                        ║
║  Throughput:          ${(metrics.http_reqs?.values?.rate || 0).toFixed(2).padStart(8)} req/s                   ║
║                                                              ║
║  Tiempo de respuesta:                                        ║
║  • Promedio:          ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2).padStart(8)} ms                     ║
║  • Mínimo:            ${(metrics.http_req_duration?.values?.min || 0).toFixed(2).padStart(8)} ms                     ║
║  • Máximo:            ${(metrics.http_req_duration?.values?.max || 0).toFixed(2).padStart(8)} ms                     ║
║  • p(90):             ${(metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2).padStart(8)} ms                     ║
║  • p(95):             ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2).padStart(8)} ms                     ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  MÉTRICAS DE NEGOCIO                                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Logins exitosos:     ${(metrics.successful_logins?.values?.count || 0).toString().padStart(8)}                         ║
║  Reservas creadas:    ${(metrics.successful_reservas?.values?.count || 0).toString().padStart(8)}                         ║
║  Tasa de error:       ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2).padStart(7)}%                        ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  THRESHOLDS                                                  ║
╠══════════════════════════════════════════════════════════════╣
`;

  // Verificar thresholds
  const thresholds = data.root_group?.checks || {};
  const p95 = metrics.http_req_duration?.values?.['p(95)'] || 0;
  const failRate = (metrics.http_req_failed?.values?.rate || 0) * 100;

  report += `║                                                              ║
║  • p(95) < 500ms:     ${p95 < 500 ? '✅ PASS' : '❌ FAIL'} (${p95.toFixed(0)}ms)                      ║
║  • Error rate < 1%:   ${failRate < 1 ? '✅ PASS' : '❌ FAIL'} (${failRate.toFixed(2)}%)                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

  return report;
}

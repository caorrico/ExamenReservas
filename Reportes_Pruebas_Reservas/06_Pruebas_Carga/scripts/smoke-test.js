/**
 * SMOKE TEST - Sistema de Reservas
 *
 * Objetivo: Verificar que el sistema responde correctamente
 * VUs: 5 usuarios virtuales
 * Duración: 1 minuto
 *
 * Ejecutar: k6 run smoke-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const reservaDuration = new Trend('reserva_duration');

// Configuración del test
export const options = {
  vus: 5,                    // 5 usuarios virtuales
  duration: '1m',            // 1 minuto de duración

  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% de requests < 500ms
    http_req_failed: ['rate<0.01'],    // < 1% de errores
    errors: ['rate<0.01'],             // Tasa de error personalizada
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Genera email único por VU e iteración
function generateEmail() {
  return `user_${__VU}_${Date.now()}@k6test.com`;
}

// Genera fecha futura
function getFutureDate() {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 1);
  return date.toISOString().split('T')[0];
}

export default function() {
  const email = generateEmail();
  const password = 'Password123!';
  let token = '';

  // Grupo 1: Health Check
  group('Health Check', function() {
    const res = http.get(`${BASE_URL}/health`);

    check(res, {
      'health check status 200': (r) => r.status === 200,
      'health check response OK': (r) => r.json('status') === 'OK',
    }) || errorRate.add(1);
  });

  sleep(0.5);

  // Grupo 2: Registro
  group('Registro de Usuario', function() {
    const payload = JSON.stringify({
      email: email,
      password: password,
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${BASE_URL}/api/auth/register`, payload, params);

    check(res, {
      'registro status 201': (r) => r.status === 201,
      'registro tiene mensaje': (r) => r.json('message') !== undefined,
    }) || errorRate.add(1);
  });

  sleep(0.5);

  // Grupo 3: Login
  group('Login', function() {
    const payload = JSON.stringify({
      email: email,
      password: password,
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);
    loginDuration.add(Date.now() - startTime);

    const success = check(res, {
      'login status 200': (r) => r.status === 200,
      'login tiene token': (r) => r.json('token') !== undefined,
    });

    if (success) {
      token = res.json('token');
    } else {
      errorRate.add(1);
    }
  });

  sleep(0.5);

  // Grupo 4: Crear Reserva
  if (token) {
    group('Crear Reserva', function() {
      const payload = JSON.stringify({
        fecha: getFutureDate(),
        hora: `${10 + (__VU % 10)}:00`,
        sala: ['Sala A', 'Sala B', 'Sala C', 'Sala D'][__VU % 4],
      });

      const params = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      const startTime = Date.now();
      const res = http.post(`${BASE_URL}/api/reservas`, payload, params);
      reservaDuration.add(Date.now() - startTime);

      check(res, {
        'crear reserva status 201 o 409': (r) => r.status === 201 || r.status === 409,
      }) || errorRate.add(1);
    });

    sleep(0.5);

    // Grupo 5: Obtener Reservas
    group('Obtener Reservas', function() {
      const params = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      const res = http.get(`${BASE_URL}/api/reservas`, params);

      check(res, {
        'obtener reservas status 200': (r) => r.status === 200,
        'respuesta es array': (r) => Array.isArray(r.json('reservas')),
      }) || errorRate.add(1);
    });
  }

  sleep(1);
}

// Resumen al finalizar
export function handleSummary(data) {
  console.log('\n========== SMOKE TEST COMPLETADO ==========\n');

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    './smoke-test-results.json': JSON.stringify(data, null, 2),
  };
}

// Función auxiliar para resumen de texto
function textSummary(data, options) {
  const metrics = data.metrics;
  let summary = '';

  summary += `\nMétricas de HTTP:\n`;
  summary += `  Requests totales: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `  Requests fallidos: ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `  Duración promedio: ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += `  Duración p(95): ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;

  summary += `\nMétricas Personalizadas:\n`;
  summary += `  Login duración avg: ${(metrics.login_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += `  Reserva duración avg: ${(metrics.reserva_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += `  Tasa de errores: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\n`;

  return summary;
}

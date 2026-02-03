# FASE 2: Pruebas Funcionales con Postman

**Proyecto**: Sistema de Reservas Backend
**Herramienta**: Postman
**Fecha**: 2026-02-03

---

## 📋 Objetivo

Verificar el correcto funcionamiento de todas las funcionalidades de la API del Sistema de Reservas, validando:

- Endpoints de autenticación (registro, login, perfil)
- Endpoints de reservas (CRUD completo)
- Validaciones de entrada
- Códigos de respuesta HTTP
- Estructura de respuestas JSON
- Manejo de errores

---

## 📁 Contenido de esta Carpeta

```
04_Pruebas_Funcionales/
├── README.md                           # Este archivo
├── Reservas_API.postman_collection.json # Colección de Postman
├── Reservas_Dev.postman_environment.json # Variables de entorno
├── REPORTE_PRUEBAS_FUNCIONALES.md      # Resultados de las pruebas
└── capturas/                           # Screenshots de Postman
```

---

## 🚀 Cómo Usar

### 1. Importar en Postman

1. Abrir Postman
2. Click en **Import** (botón superior izquierdo)
3. Arrastrar o seleccionar los archivos:
   - `Reservas_API.postman_collection.json`
   - `Reservas_Dev.postman_environment.json`
4. Seleccionar el environment "Reservas - Development"

### 2. Configurar el Servidor

```bash
# Iniciar el servidor de Reservas_Corregido
cd C:\ESPE\Pruebas\3erParcial\Reservas_Corregido
npm install
npm start
```

El servidor estará en `http://localhost:3000`

### 3. Ejecutar las Pruebas

**Opción A - Manual:**
- Abrir cada request y ejecutar con "Send"
- Verificar respuestas

**Opción B - Collection Runner:**
1. Click derecho en la colección → "Run collection"
2. Configurar iteraciones (1 para prueba básica)
3. Click "Run Reservas API"
4. Revisar resultados

**Opción C - Newman (CLI):**
```bash
# Instalar Newman
npm install -g newman

# Ejecutar colección
newman run Reservas_API.postman_collection.json \
  -e Reservas_Dev.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export reporte_postman.html
```

---

## 📊 Casos de Prueba

### Autenticación (5 tests)

| ID | Caso de Prueba | Método | Endpoint | Resultado Esperado |
|----|----------------|--------|----------|-------------------|
| TC-001 | Registro exitoso | POST | /api/auth/register | 201 Created |
| TC-002 | Registro con email duplicado | POST | /api/auth/register | 400 Bad Request |
| TC-003 | Login exitoso | POST | /api/auth/login | 200 OK + Token |
| TC-004 | Login con credenciales inválidas | POST | /api/auth/login | 400 Bad Request |
| TC-005 | Obtener perfil autenticado | GET | /api/auth/profile | 200 OK + User data |

### Reservas (8 tests)

| ID | Caso de Prueba | Método | Endpoint | Resultado Esperado |
|----|----------------|--------|----------|-------------------|
| TC-006 | Crear reserva exitosa | POST | /api/reservas | 201 Created |
| TC-007 | Crear reserva sin autenticación | POST | /api/reservas | 401 Unauthorized |
| TC-008 | Crear reserva con datos inválidos | POST | /api/reservas | 400 Bad Request |
| TC-009 | Crear reserva duplicada | POST | /api/reservas | 409 Conflict |
| TC-010 | Obtener mis reservas | GET | /api/reservas | 200 OK + Array |
| TC-011 | Obtener reserva por ID | GET | /api/reservas/:id | 200 OK + Reserva |
| TC-012 | Eliminar reserva propia | DELETE | /api/reservas/:id | 200 OK |
| TC-013 | Eliminar reserva de otro usuario | DELETE | /api/reservas/:id | 403 Forbidden |

### Validaciones (5 tests)

| ID | Caso de Prueba | Método | Endpoint | Resultado Esperado |
|----|----------------|--------|----------|-------------------|
| TC-014 | Email formato inválido | POST | /api/auth/register | 400 + mensaje |
| TC-015 | Contraseña débil | POST | /api/auth/register | 400 + mensaje |
| TC-016 | Fecha en el pasado | POST | /api/reservas | 400 + mensaje |
| TC-017 | Hora fuera de rango | POST | /api/reservas | 400 + mensaje |
| TC-018 | Sala inválida | POST | /api/reservas | 400 + mensaje |

---

## ✅ Criterios de Aceptación

- [ ] Todos los endpoints responden correctamente
- [ ] Los códigos HTTP son apropiados
- [ ] Las validaciones rechazan datos inválidos
- [ ] Los mensajes de error son informativos
- [ ] El token JWT funciona correctamente
- [ ] Las operaciones CRUD funcionan
- [ ] La autenticación protege las rutas

---

## 📈 Métricas Esperadas

| Métrica | Objetivo |
|---------|----------|
| Tests Pasados | 18/18 (100%) |
| Tiempo de Respuesta Promedio | < 200ms |
| Errores de Servidor (5xx) | 0 |

---

## 📝 Notas

- Ejecutar los tests en orden (registro → login → reservas)
- El token se guarda automáticamente en las variables de entorno
- Algunos tests dependen de datos creados en tests anteriores


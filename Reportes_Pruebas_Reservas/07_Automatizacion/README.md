# FASE 5: Automatización con Jest y CI/CD

**Proyecto**: Sistema de Reservas Backend
**Herramientas**: Jest, GitHub Actions
**Fecha**: 2026-02-03

---

## 📋 Objetivo

Implementación de pruebas automáticas en el ciclo de desarrollo continuo:

- **Jest**: Pruebas unitarias y de integración
- **CI/CD**: Pipeline automatizado con GitHub Actions

---

## 📁 Contenido de esta Carpeta

```
07_Automatizacion/
├── README.md                           # Este archivo
├── jest/
│   ├── jest.config.js                  # Configuración de Jest
│   ├── setup.js                        # Setup de tests
│   └── tests/
│       ├── unit/
│       │   ├── auth.test.js            # Tests de autenticación
│       │   ├── reserva.test.js         # Tests de reservas
│       │   └── validators.test.js      # Tests de validadores
│       └── integration/
│           ├── auth.integration.test.js
│           └── reserva.integration.test.js
├── ci-cd/
│   ├── github-actions.yml              # Pipeline GitHub Actions
│   └── GUIA_CICD.md                    # Guía de CI/CD
└── REPORTE_AUTOMATIZACION.md           # Resultados
```

---

## 🔧 Configuración

### Instalar Dependencias

```bash
cd Reservas_Corregido
npm install --save-dev jest supertest mongodb-memory-server
```

### Estructura de Tests

```
Reservas_Corregido/
├── src/
├── tests/
│   ├── unit/           # Pruebas unitarias
│   ├── integration/    # Pruebas de integración
│   └── setup.js        # Configuración global
├── jest.config.js
└── package.json
```

---

## 🚀 Ejecución de Tests

```bash
# Todos los tests
npm test

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Con cobertura
npm run test:coverage

# Watch mode (desarrollo)
npm run test:watch
```

---

## 📊 Cobertura Esperada

| Módulo | Objetivo | Estado |
|--------|----------|--------|
| Controllers | > 80% | ✅ |
| Models | > 90% | ✅ |
| Middlewares | > 85% | ✅ |
| Validators | > 95% | ✅ |
| **Total** | **> 80%** | ✅ |

---

## 🔄 Pipeline CI/CD

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## ✅ Checklist

- [ ] Jest configurado
- [ ] Tests unitarios escritos
- [ ] Tests de integración escritos
- [ ] Cobertura > 80%
- [ ] CI/CD pipeline funcionando
- [ ] Reportes generados


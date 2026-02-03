# FASE 4: Pruebas de Carga con k6

**Proyecto**: Sistema de Reservas Backend
**Herramienta**: k6 (Grafana k6)
**Fecha**: 2026-02-03

---

## 📋 Objetivo

Medir el rendimiento y estabilidad del sistema bajo altas demandas utilizando k6, una herramienta moderna de pruebas de carga escrita en Go con scripts en JavaScript.

---

## 📁 Contenido de esta Carpeta

```
06_Pruebas_Carga/
├── README.md                           # Este archivo
├── scripts/
│   ├── smoke-test.js                   # Test básico (5 VUs)
│   ├── load-test.js                    # Test de carga (50 VUs)
│   ├── stress-test.js                  # Test de estrés (100+ VUs)
│   ├── spike-test.js                   # Test de picos
│   ├── soak-test.js                    # Test de resistencia
│   └── utils/
│       └── helpers.js                  # Funciones de utilidad
├── GUIA_K6.md                          # Guía de instalación y uso
└── REPORTE_PRUEBAS_CARGA.md            # Resultados de las pruebas
```

---

## 🔧 Instalación de k6

### Windows
```bash
# Usando Chocolatey
choco install k6

# O descarga directa desde GitHub releases
# https://github.com/grafana/k6/releases
```

### Linux
```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### MacOS
```bash
brew install k6
```

### Docker
```bash
docker pull grafana/k6
```

---

## 🚀 Ejecución Rápida

```bash
# Smoke Test (5 usuarios, 1 minuto)
k6 run scripts/smoke-test.js

# Load Test (50 usuarios, 5 minutos)
k6 run scripts/load-test.js

# Stress Test (100 usuarios, 10 minutos)
k6 run scripts/stress-test.js

# Con reporte HTML
k6 run --out json=results.json scripts/load-test.js

# Con visualización en tiempo real (InfluxDB + Grafana)
k6 run --out influxdb=http://localhost:8086/k6 scripts/load-test.js
```

---

## 📊 Tipos de Pruebas

| Tipo | VUs | Duración | Objetivo |
|------|-----|----------|----------|
| **Smoke** | 5 | 1 min | Verificar que funciona |
| **Load** | 50 | 5 min | Carga normal esperada |
| **Stress** | 100+ | 10 min | Encontrar límites |
| **Spike** | 0→200→0 | 5 min | Picos repentinos |
| **Soak** | 50 | 30+ min | Estabilidad prolongada |

---

## 📈 Métricas Objetivo

| Métrica | Objetivo |
|---------|----------|
| http_req_duration (p95) | < 500ms |
| http_req_failed | < 1% |
| http_reqs (throughput) | > 100/s |
| iterations | Sin errores |

---

## ✅ Checklist

- [ ] k6 instalado
- [ ] Servidor corriendo en localhost:3000
- [ ] Ejecutar smoke-test.js
- [ ] Ejecutar load-test.js
- [ ] Ejecutar stress-test.js
- [ ] Documentar resultados
- [ ] Generar reportes


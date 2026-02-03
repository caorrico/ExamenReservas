# FASE 3: Pruebas de Sistema

**Proyecto**: Sistema de Reservas Backend
**Herramientas**: JMeter, OWASP ZAP
**Fecha**: 2026-02-03

---

## 📋 Objetivo

Evaluación integral del sistema bajo diversas condiciones, incluyendo:

- **JMeter**: Pruebas de rendimiento y stress
- **OWASP ZAP**: Pruebas de seguridad automatizadas (escaneo de vulnerabilidades)

---

## 📁 Contenido de esta Carpeta

```
05_Pruebas_Sistema/
├── README.md                               # Este archivo
├── JMeter/
│   ├── Reservas_TestPlan.jmx              # Plan de pruebas JMeter
│   ├── GUIA_JMETER.md                     # Guía de uso
│   └── REPORTE_JMETER.md                  # Resultados
├── OWASP_ZAP/
│   ├── GUIA_OWASP_ZAP.md                  # Guía de configuración
│   ├── REPORTE_SEGURIDAD_ZAP.md           # Resultados del escaneo
│   └── zap_config.yaml                    # Configuración ZAP
└── REPORTE_PRUEBAS_SISTEMA.md             # Reporte consolidado
```

---

## 🔧 Herramientas Requeridas

### JMeter
- **Versión**: Apache JMeter 5.6+
- **Descarga**: https://jmeter.apache.org/download_jmeter.cgi
- **Requisitos**: Java 8+

### OWASP ZAP
- **Versión**: ZAP 2.14+
- **Descarga**: https://www.zaproxy.org/download/
- **Tipo**: Instalador o Docker

---

## 📊 Tipos de Pruebas

### 3.1 JMeter - Pruebas de Rendimiento

| Tipo | Descripción | Objetivo |
|------|-------------|----------|
| **Smoke Test** | Verificación básica | Sistema responde |
| **Load Test** | Carga normal | 50 usuarios concurrentes |
| **Stress Test** | Carga extrema | Encontrar punto de quiebre |
| **Endurance Test** | Carga sostenida | Estabilidad en el tiempo |

### 3.2 OWASP ZAP - Pruebas de Seguridad

| Tipo | Descripción | Objetivo |
|------|-------------|----------|
| **Spider** | Descubrimiento de URLs | Mapear la aplicación |
| **Passive Scan** | Análisis pasivo | Detectar issues sin atacar |
| **Active Scan** | Análisis activo | Pruebas de penetración |
| **API Scan** | Escaneo de API | Vulnerabilidades en endpoints |

---

## 🚀 Guía Rápida

### JMeter

```bash
# 1. Descargar e instalar JMeter
# 2. Abrir JMeter GUI
./bin/jmeter.bat  # Windows
./bin/jmeter.sh   # Linux/Mac

# 3. Cargar el plan de pruebas
File → Open → Reservas_TestPlan.jmx

# 4. Ejecutar
Run → Start (Ctrl+R)

# Ejecución CLI (recomendado para pruebas reales)
jmeter -n -t Reservas_TestPlan.jmx -l results.jtl -e -o report/
```

### OWASP ZAP

```bash
# 1. Iniciar ZAP
zap.bat  # Windows
zap.sh   # Linux/Mac

# 2. Configurar target
http://localhost:3000

# 3. Ejecutar Spider
# 4. Ejecutar Active Scan
# 5. Exportar reporte

# Ejecución con Docker
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t http://localhost:3000/api \
  -f openapi
```

---

## ✅ Checklist de Ejecución

### JMeter
- [ ] JMeter instalado y funcionando
- [ ] Plan de pruebas cargado
- [ ] Servidor de Reservas ejecutándose
- [ ] Ejecutar Smoke Test (5 usuarios)
- [ ] Ejecutar Load Test (50 usuarios)
- [ ] Ejecutar Stress Test (100+ usuarios)
- [ ] Generar reportes HTML
- [ ] Documentar resultados

### OWASP ZAP
- [ ] ZAP instalado y funcionando
- [ ] Target configurado (localhost:3000)
- [ ] Ejecutar Spider
- [ ] Ejecutar Passive Scan
- [ ] Ejecutar Active Scan (con precaución)
- [ ] Revisar alertas encontradas
- [ ] Exportar reporte HTML
- [ ] Documentar hallazgos

---

## 📈 Métricas Objetivo

### Rendimiento (JMeter)

| Métrica | Objetivo |
|---------|----------|
| Tiempo de respuesta (avg) | < 500ms |
| Tiempo de respuesta (p95) | < 1000ms |
| Throughput | > 100 req/s |
| Tasa de error | < 1% |

### Seguridad (OWASP ZAP)

| Nivel de Alerta | Objetivo |
|-----------------|----------|
| Alto | 0 alertas |
| Medio | 0-2 alertas |
| Bajo | < 5 alertas |
| Informativo | N/A |


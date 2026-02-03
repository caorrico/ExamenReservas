# Guía de Pruebas con JMeter - Sistema de Reservas

**Herramienta**: Apache JMeter 5.6+
**Proyecto**: Sistema de Reservas Backend
**Fecha**: 2026-02-03

---

## 1. Instalación de JMeter

### Windows
```bash
# 1. Descargar desde https://jmeter.apache.org/download_jmeter.cgi
# 2. Extraer el archivo ZIP
# 3. Ejecutar:
cd apache-jmeter-5.6/bin
jmeter.bat
```

### Linux/Mac
```bash
# Usando Homebrew (Mac)
brew install jmeter

# Manual
wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz
tar -xzf apache-jmeter-5.6.3.tgz
cd apache-jmeter-5.6.3/bin
./jmeter.sh
```

### Requisitos
- Java 8+ instalado
- Mínimo 2GB RAM disponible

---

## 2. Estructura del Plan de Pruebas

### Reservas_TestPlan.jmx

```
Test Plan
├── HTTP Request Defaults (localhost:3000)
├── HTTP Header Manager (Content-Type: application/json)
│
├── 01 - Smoke Test (5 usuarios)
│   ├── Health Check
│   ├── Registro Usuario
│   ├── Login
│   ├── Crear Reserva
│   └── Obtener Reservas
│
├── 02 - Load Test (50 usuarios) [disabled]
│
├── 03 - Stress Test (100 usuarios) [disabled]
│
└── Listeners
    ├── View Results Tree
    ├── Summary Report
    └── Aggregate Report
```

---

## 3. Configuración del Plan de Pruebas

### Variables Globales

| Variable | Valor | Descripción |
|----------|-------|-------------|
| BASE_URL | localhost | Host del servidor |
| PORT | 3000 | Puerto del servidor |
| PROTOCOL | http | Protocolo |

### Thread Groups

| Grupo | Usuarios | Ramp-Up | Loops | Descripción |
|-------|----------|---------|-------|-------------|
| Smoke Test | 5 | 5s | 1 | Verificación básica |
| Load Test | 50 | 30s | 5 | Carga normal esperada |
| Stress Test | 100 | 60s | 10 | Encontrar límites |

---

## 4. Ejecución de Pruebas

### Modo GUI (para desarrollo)

```bash
# 1. Abrir JMeter
./jmeter.bat  # Windows
./jmeter.sh   # Linux/Mac

# 2. File → Open → Reservas_TestPlan.jmx

# 3. Habilitar el Thread Group deseado
#    Click derecho → Enable

# 4. Ejecutar
#    Run → Start (Ctrl+R)
```

### Modo CLI (recomendado para pruebas reales)

```bash
# Prueba básica
jmeter -n -t Reservas_TestPlan.jmx -l results.jtl

# Con reporte HTML
jmeter -n -t Reservas_TestPlan.jmx -l results.jtl -e -o ./report

# Con parámetros personalizados
jmeter -n -t Reservas_TestPlan.jmx \
  -l results.jtl \
  -e -o ./report \
  -JBASE_URL=localhost \
  -JPORT=3000 \
  -Jthreads=50 \
  -Jrampup=30
```

### Opciones CLI

| Opción | Descripción |
|--------|-------------|
| `-n` | Modo no-GUI |
| `-t` | Archivo de plan de pruebas |
| `-l` | Archivo de resultados (.jtl) |
| `-e` | Generar reporte al finalizar |
| `-o` | Directorio de salida del reporte |
| `-J` | Definir propiedad JMeter |

---

## 5. Escenarios de Prueba

### 5.1 Smoke Test (5 usuarios)

**Objetivo**: Verificar que el sistema responde correctamente

**Configuración**:
- Usuarios: 5
- Ramp-up: 5 segundos
- Iteraciones: 1

**Criterios de éxito**:
- 0% errores
- Todas las respuestas < 2000ms
- Códigos HTTP correctos

**Ejecución**:
```bash
# Habilitar solo Smoke Test en el plan
jmeter -n -t Reservas_TestPlan.jmx -l smoke_results.jtl -e -o ./smoke_report
```

---

### 5.2 Load Test (50 usuarios)

**Objetivo**: Simular carga normal de producción

**Configuración**:
- Usuarios: 50
- Ramp-up: 30 segundos
- Iteraciones: 5

**Criterios de éxito**:
- Error rate < 1%
- Tiempo respuesta promedio < 500ms
- p95 < 1000ms
- Throughput > 50 req/s

**Ejecución**:
```bash
# Habilitar Load Test, deshabilitar otros
jmeter -n -t Reservas_TestPlan.jmx -l load_results.jtl -e -o ./load_report
```

---

### 5.3 Stress Test (100 usuarios)

**Objetivo**: Encontrar el punto de quiebre del sistema

**Configuración**:
- Usuarios: 100
- Ramp-up: 60 segundos
- Iteraciones: 10

**Criterios de éxito**:
- Identificar cuando empiezan errores
- Documentar comportamiento bajo estrés
- Sistema se recupera después

**Ejecución**:
```bash
jmeter -n -t Reservas_TestPlan.jmx -l stress_results.jtl -e -o ./stress_report
```

---

## 6. Interpretación de Resultados

### Métricas Clave

| Métrica | Descripción | Objetivo |
|---------|-------------|----------|
| **Samples** | Total de requests | - |
| **Average** | Tiempo promedio (ms) | < 500ms |
| **Median** | Percentil 50 | < 300ms |
| **90% Line** | Percentil 90 | < 800ms |
| **95% Line** | Percentil 95 | < 1000ms |
| **99% Line** | Percentil 99 | < 2000ms |
| **Min** | Tiempo mínimo | - |
| **Max** | Tiempo máximo | < 5000ms |
| **Error %** | Porcentaje de errores | < 1% |
| **Throughput** | Requests por segundo | > 50/s |

### Ejemplo de Aggregate Report

```
Label           | Samples | Avg  | Min | Max  | Error% | Throughput
----------------|---------|------|-----|------|--------|------------
Health Check    | 50      | 15   | 5   | 45   | 0.00%  | 10.5/sec
Registro        | 50      | 180  | 120 | 350  | 0.00%  | 8.2/sec
Login           | 50      | 150  | 100 | 280  | 0.00%  | 9.1/sec
Crear Reserva   | 50      | 120  | 80  | 250  | 0.00%  | 9.8/sec
Obtener Reservas| 50      | 35   | 20  | 85   | 0.00%  | 12.3/sec
TOTAL           | 250     | 100  | 5   | 350  | 0.00%  | 49.9/sec
```

---

## 7. Generación de Reportes

### Reporte HTML Automático

```bash
# Durante la ejecución
jmeter -n -t Reservas_TestPlan.jmx -l results.jtl -e -o ./html_report

# Post-ejecución
jmeter -g results.jtl -o ./html_report
```

### Estructura del Reporte HTML

```
html_report/
├── index.html          # Dashboard principal
├── content/
│   ├── js/
│   ├── css/
│   └── pages/
│       ├── OverTime.html
│       ├── ResponseTimes.html
│       ├── Throughput.html
│       └── ...
└── statistics.json
```

### Reporte CSV

```bash
# En el plan de pruebas, agregar Simple Data Writer
# O usar el archivo .jtl directamente (es CSV)
```

---

## 8. Mejores Prácticas

### Antes de la Prueba

1. ✅ Cerrar JMeter GUI durante pruebas reales
2. ✅ Limpiar base de datos si es necesario
3. ✅ Verificar que el servidor está corriendo
4. ✅ Monitorear recursos del servidor

### Durante la Prueba

1. ✅ Usar modo CLI (-n) para pruebas de carga
2. ✅ No usar View Results Tree con muchos datos
3. ✅ Guardar resultados en archivo .jtl
4. ✅ Monitorear CPU/RAM del servidor

### Después de la Prueba

1. ✅ Generar reporte HTML
2. ✅ Analizar errores si los hay
3. ✅ Comparar con ejecuciones anteriores
4. ✅ Documentar hallazgos

---

## 9. Troubleshooting

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Connection refused | Servidor no corriendo | Iniciar servidor |
| Timeout | Servidor lento | Aumentar timeout |
| OutOfMemory | Muchos resultados | Usar modo CLI, reducir listeners |
| 401 Unauthorized | Token inválido | Verificar extracción de token |
| 429 Too Many Requests | Rate limiting | Reducir usuarios o aumentar ramp-up |

### Aumentar Memoria de JMeter

```bash
# Editar jmeter.bat o jmeter.sh
set HEAP=-Xms1g -Xmx4g

# O al ejecutar
JVM_ARGS="-Xms1g -Xmx4g" jmeter -n -t plan.jmx -l results.jtl
```

---

## 10. Recursos Adicionales

- [Documentación oficial JMeter](https://jmeter.apache.org/usermanual/)
- [JMeter Best Practices](https://jmeter.apache.org/usermanual/best-practices.html)
- [Plugins JMeter](https://jmeter-plugins.org/)

---

**Última actualización**: 2026-02-03

# Guía de Pruebas de Seguridad con OWASP ZAP

**Herramienta**: OWASP ZAP (Zed Attack Proxy) 2.14+
**Proyecto**: Sistema de Reservas Backend
**Fecha**: 2026-02-03

---

## 1. Introducción

OWASP ZAP es una herramienta de código abierto para encontrar vulnerabilidades de seguridad en aplicaciones web. Funciona como un proxy entre el navegador y la aplicación, permitiendo inspeccionar y modificar el tráfico.

### Tipos de Escaneo

| Tipo | Descripción | Riesgo |
|------|-------------|--------|
| **Spider** | Descubre URLs y recursos | Ninguno |
| **Passive Scan** | Analiza respuestas sin atacar | Ninguno |
| **Active Scan** | Pruebas de penetración | ⚠️ Puede afectar datos |
| **API Scan** | Escaneo específico de APIs | Medio |

---

## 2. Instalación

### Windows
```bash
# Descargar desde https://www.zaproxy.org/download/
# Ejecutar el instalador .exe
# O descargar la versión portable .zip
```

### Linux
```bash
# Usando Snap
sudo snap install zaproxy --classic

# O descarga directa
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2_14_0_unix.sh
chmod +x ZAP_2_14_0_unix.sh
./ZAP_2_14_0_unix.sh
```

### Docker
```bash
# Imagen oficial
docker pull owasp/zap2docker-stable

# Ejecutar GUI
docker run -u zap -p 8080:8080 -p 8090:8090 -i owasp/zap2docker-stable zap-webswing.sh
```

---

## 3. Configuración Inicial

### 3.1 Configurar el Target

1. Abrir ZAP
2. En la barra de herramientas, ingresar URL:
   ```
   http://localhost:3000
   ```
3. Click en el botón de ataque (flecha)

### 3.2 Configurar Autenticación

Para APIs con JWT:

1. **Sites** → Click derecho en el sitio → **Include in Context** → **New Context**
2. Ir a **Session Management** → **Script-based Session Management**
3. Agregar script para incluir el token JWT

**Script de autenticación para ZAP:**

```javascript
// authentication.js para ZAP
function authenticate(helper, paramsValues, credentials) {
    var loginUrl = "http://localhost:3000/api/auth/login";
    var postData = JSON.stringify({
        "email": credentials.getParam("username"),
        "password": credentials.getParam("password")
    });

    var msg = helper.prepareMessage();
    msg.setRequestHeader(
        new org.parosproxy.paros.network.HttpRequestHeader(
            org.parosproxy.paros.network.HttpRequestHeader.POST,
            new java.net.URI(loginUrl, false),
            "HTTP/1.1"
        )
    );
    msg.getRequestHeader().setHeader("Content-Type", "application/json");
    msg.setRequestBody(postData);

    helper.sendAndReceive(msg);

    var response = JSON.parse(msg.getResponseBody().toString());
    return response.token;
}
```

### 3.3 Configurar Headers

1. **Tools** → **Options** → **Replacer**
2. Agregar regla:
   - Description: `JWT Token`
   - Match Type: `Request Header`
   - Match String: `Authorization`
   - Replacement: `Bearer <tu-token>`
   - Enable: ✅

---

## 4. Tipos de Escaneo

### 4.1 Spider (Descubrimiento)

**Propósito**: Descubrir todas las URLs de la aplicación

**Ejecución**:
1. Click derecho en el sitio → **Attack** → **Spider**
2. Configurar:
   - Recurse: ✅
   - Max depth: 5
   - Max children: 10
3. Click **Start Scan**

**Para APIs REST**:
```bash
# Importar definición OpenAPI si existe
# File → Import → Import OpenAPI Definition
```

### 4.2 Passive Scan (Análisis Pasivo)

**Propósito**: Detectar issues sin atacar

El escaneo pasivo se ejecuta automáticamente mientras navegas o ejecutas el spider.

**Issues que detecta**:
- Headers de seguridad faltantes
- Cookies inseguras
- Información sensible expuesta
- Versiones de software

### 4.3 Active Scan (Análisis Activo)

⚠️ **PRECAUCIÓN**: El escaneo activo puede modificar datos

**Propósito**: Pruebas de penetración automatizadas

**Ejecución**:
1. Click derecho en el sitio → **Attack** → **Active Scan**
2. Configurar política de escaneo
3. Click **Start Scan**

**Políticas de escaneo**:
| Política | Descripción |
|----------|-------------|
| Default | Balance entre velocidad y cobertura |
| High | Más tests, más tiempo |
| Low | Rápido, menos cobertura |
| Custom | Seleccionar tests específicos |

---

## 5. Escaneo de API

### Usando ZAP API Scan (Docker)

```bash
# Escaneo básico de API
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t http://host.docker.internal:3000/api \
  -f openapi

# Con archivo de definición
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-api-scan.py \
  -t /zap/wrk/openapi.yaml \
  -f openapi \
  -r api_scan_report.html
```

### Desde la GUI

1. **Import** → **Import OpenAPI Definition from URL**
2. Ingresar URL o cargar archivo
3. ZAP creará requests automáticamente
4. Ejecutar Spider y Active Scan

---

## 6. Interpretación de Resultados

### Niveles de Alerta

| Nivel | Color | Descripción | Acción |
|-------|-------|-------------|--------|
| **High** | 🔴 Rojo | Vulnerabilidad crítica | Corregir inmediatamente |
| **Medium** | 🟠 Naranja | Riesgo significativo | Corregir pronto |
| **Low** | 🟡 Amarillo | Bajo riesgo | Evaluar |
| **Informational** | 🔵 Azul | Información | Revisar |
| **False Positive** | ⚪ Blanco | Falso positivo | Marcar y omitir |

### Alertas Comunes en APIs

| Alerta | Descripción | Solución |
|--------|-------------|----------|
| **Missing Anti-CSRF Tokens** | Sin protección CSRF | Normal en APIs (usar JWT) |
| **X-Frame-Options Header Not Set** | Sin protección clickjacking | Agregar header |
| **X-Content-Type-Options Missing** | Sin protección MIME sniffing | Agregar `nosniff` |
| **CSP Header Not Set** | Sin Content Security Policy | Agregar CSP |
| **Strict-Transport-Security Missing** | Sin HSTS | Agregar en producción |
| **Cookie Without Secure Flag** | Cookie insegura | Agregar flag secure |
| **SQL Injection** | Inyección SQL posible | Usar ORM/prepared statements |
| **Cross-Site Scripting** | XSS posible | Sanitizar entrada |

---

## 7. Generación de Reportes

### Reporte HTML

1. **Report** → **Generate HTML Report**
2. Seleccionar ubicación
3. Revisar configuración
4. Guardar

### Reporte XML (para CI/CD)

```bash
# Desde CLI
zap-cli report -o report.xml -f xml

# Desde Docker
docker run -v $(pwd):/zap/wrk/:rw owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r report.html \
  -x report.xml
```

### Reporte JSON

```bash
# Para procesamiento automatizado
zap-cli report -o report.json -f json
```

---

## 8. Configuración para CI/CD

### GitHub Actions

```yaml
name: OWASP ZAP Scan

on: [push]

jobs:
  zap_scan:
    runs-on: ubuntu-latest
    steps:
      - name: Start application
        run: |
          npm install
          npm start &
          sleep 10

      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: zap-report
          path: report_html.html
```

### Docker Compose

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"

  zap:
    image: owasp/zap2docker-stable
    depends_on:
      - app
    command: zap-baseline.py -t http://app:3000 -r report.html
    volumes:
      - ./reports:/zap/wrk
```

---

## 9. Configuración Avanzada

### Archivo de Configuración YAML

```yaml
# zap_config.yaml
env:
  contexts:
    - name: "Reservas API"
      urls:
        - "http://localhost:3000"
      includePaths:
        - "http://localhost:3000/api/.*"
      excludePaths:
        - "http://localhost:3000/health"
      authentication:
        method: "json"
        loginUrl: "http://localhost:3000/api/auth/login"
        loginRequestData: '{"email":"test@test.com","password":"Password123!"}'

  parameters:
    failOnError: true
    failOnWarning: false
    progressToStdout: true

jobs:
  - type: spider
    parameters:
      maxDuration: 5

  - type: passiveScan-wait
    parameters:
      maxDuration: 5

  - type: activeScan
    parameters:
      maxRuleDurationInMins: 5

  - type: report
    parameters:
      template: "traditional-html"
      reportDir: "/zap/wrk"
      reportFile: "zap-report"
```

### Ejecutar con configuración

```bash
zap.sh -cmd -autorun /path/to/zap_config.yaml
```

---

## 10. Mejores Prácticas

### Antes del Escaneo

1. ✅ Notificar al equipo de desarrollo
2. ✅ Usar ambiente de pruebas (no producción)
3. ✅ Tener backups de la base de datos
4. ✅ Configurar autenticación correctamente
5. ✅ Definir alcance claro

### Durante el Escaneo

1. ✅ Monitorear recursos del sistema
2. ✅ Revisar logs de la aplicación
3. ✅ Pausar si hay problemas

### Después del Escaneo

1. ✅ Revisar cada alerta manualmente
2. ✅ Marcar falsos positivos
3. ✅ Priorizar correcciones
4. ✅ Documentar hallazgos
5. ✅ Re-escanear después de correcciones

---

## 11. Recursos Adicionales

- [Documentación oficial OWASP ZAP](https://www.zaproxy.org/docs/)
- [ZAP API](https://www.zaproxy.org/docs/api/)
- [ZAP Automation Guide](https://www.zaproxy.org/docs/automate/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

**Última actualización**: 2026-02-03

# Instrucciones de Ejecución - Análisis Completo del Proyecto Reservas

## 📋 Guía Paso a Paso

---

## PASO 1: Preparar el Entorno ✅ COMPLETADO

### Lo que ya se hizo:
- ✅ Estructura de reportes creada
- ✅ SonarQube verificado (corriendo en puerto 9000)
- ✅ Configuración de SonarQube creada
- ✅ Análisis manual de código completado
- ✅ 15 vulnerabilidades identificadas y documentadas
- ✅ Scripts de prueba creados

---

## PASO 2: Generar Token de SonarQube ⏳ PENDIENTE

### Instrucciones:

1. **Abrir SonarQube en tu navegador**:
   ```
   http://localhost:9000
   ```

2. **Iniciar sesión**:
   - Credenciales por defecto:
     - Usuario: `admin`
     - Contraseña: `admin`
   - (Si ya cambiaste la contraseña, usa tus credenciales)

3. **Generar token**:
   - **Opción A - Crear proyecto (RECOMENDADO)**:
     1. Click en "+ Create Project"
     2. Seleccionar "Manually"
     3. Project key: `reservas-backend`
     4. Display name: `Sistema de Reservas Backend`
     5. Click "Set Up"
     6. Seleccionar "Locally"
     7. Generate token → Copiar el token
     8. Guardar el token en un lugar seguro

   - **Opción B - Token desde perfil**:
     1. Click en tu avatar (esquina superior derecha)
     2. "My Account" → "Security"
     3. En "Generate Tokens":
        - Name: `reservas-analysis`
        - Type: "User Token"
        - Expires: (seleccionar tiempo)
     4. Click "Generate"
     5. Copiar el token (solo se muestra una vez)

4. **Guardar el token**:
   - Copia el token y guárdalo temporalmente

### 📸 Captura requerida:
   - Screenshot del token generado (ocultar caracteres si es necesario)
   - Screenshot de la configuración del proyecto

---

## PASO 3: Ejecutar Análisis de SonarQube

### Una vez tengas el token:

```bash
# Navegar al proyecto
cd C:\ESPE\Pruebas\3erParcial\Reservas

# Ejecutar análisis
sonar-scanner -Dsonar.token=TU_TOKEN_AQUI
```

### Reemplaza `TU_TOKEN_AQUI` con el token que generaste.

### Tiempo estimado: 2-5 minutos

### Lo que verás:
- Inicio del análisis
- Escaneo de archivos
- Subida de resultados a SonarQube
- Link al reporte en SonarQube

### 📸 Capturas requeridas:
1. Salida completa del comando sonar-scanner
2. Dashboard de SonarQube con los resultados
3. Lista de bugs encontrados
4. Lista de vulnerabilidades encontradas
5. Lista de code smells
6. Métricas de calidad (coverage, duplicaciones, etc.)

---

## PASO 4: Ejecutar Scripts de Verificación de Vulnerabilidades

### 4.1. Instalar dependencias de los scripts:

```bash
cd C:\ESPE\Pruebas\3erParcial\Reportes_Pruebas_Reservas\scripts
npm install
```

### 4.2. Asegurarse de que el servidor del proyecto esté corriendo:

**En una terminal separada**:
```bash
cd C:\ESPE\Pruebas\3erParcial\Reservas
npm install  # Si no lo hiciste antes
npm start
```

Deberías ver: `Servidor corriendo en puerto 3000`

### 4.3. Ejecutar pruebas de vulnerabilidades:

**En otra terminal**:

#### Prueba 1: JWT Secret Débil
```bash
cd C:\ESPE\Pruebas\3erParcial\Reportes_Pruebas_Reservas\scripts
node test-jwt-fake.js
```

**📸 Captura**: Output completo del script mostrando el token falso generado

---

#### Prueba 2: Crear usuario de prueba

**Primero, registrar un usuario**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@prueba.com\", \"password\": \"test123\"}"
```

**📸 Captura**: Respuesta del servidor

---

#### Prueba 3: Test de Fuerza Bruta (Rate Limiting)
```bash
cd C:\ESPE\Pruebas\3erParcial\Reportes_Pruebas_Reservas\scripts
node brute-force-test.js test@prueba.com
```

**📸 Captura**: Output completo mostrando intentos sin límite

---

#### Prueba 4: Contraseña Débil Aceptada
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"weak@test.com\", \"password\": \"1\"}"
```

**📸 Captura**: Respuesta del servidor aceptando contraseña débil

---

#### Prueba 5: Mass Assignment Attack

**Login para obtener token**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@prueba.com\", \"password\": \"test123\"}"
```

Copia el token de la respuesta.

**Crear reserva con userId malicioso**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d "{\"fecha\": \"2026-02-10\", \"hora\": \"10:00\", \"sala\": \"Sala A\", \"userId\": \"123456789012345678901234\"}"
```

**📸 Captura**: Respuesta mostrando que acepta el userId del body

---

#### Prueba 6: Doble Reserva (Sin validación de conflictos)

**Primera reserva**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d "{\"fecha\": \"2026-02-15\", \"hora\": \"14:00\", \"sala\": \"Sala B\"}"
```

**Segunda reserva idéntica**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d "{\"fecha\": \"2026-02-15\", \"hora\": \"14:00\", \"sala\": \"Sala B\"}"
```

**📸 Captura**: Ambas reservas creadas exitosamente

---

#### Prueba 7: Headers de Seguridad

```bash
curl -I http://localhost:3000/api/auth/login
```

**📸 Captura**: Headers de respuesta mostrando ausencia de headers de seguridad

---

## PASO 5: Compilar Resultados

### 5.1. Revisar el dashboard de SonarQube:

1. Ir a http://localhost:9000
2. Click en el proyecto "Sistema de Reservas Backend"
3. Revisar:
   - Bugs
   - Vulnerabilities
   - Code Smells
   - Coverage
   - Duplications
   - Security Hotspots

### 5.2. Exportar reporte de SonarQube:

En SonarQube:
- Click en "More" → "PDF Report" (si está disponible)
- O tomar capturas de todas las secciones importantes

### 📸 Capturas necesarias del dashboard:
1. Vista general (Overview)
2. Issues → Bugs
3. Issues → Vulnerabilities
4. Issues → Code Smells
5. Security Hotspots
6. Measures → Reliability
7. Measures → Security
8. Measures → Maintainability

---

## PASO 6: Organizar Capturas y Evidencias

### Crear carpeta para capturas:

```bash
mkdir -p "C:\ESPE\Pruebas\3erParcial\Reportes_Pruebas_Reservas\capturas"
```

### Nombrar las capturas:

```
capturas/
├── 01_sonarqube_dashboard.png
├── 02_sonarqube_bugs.png
├── 03_sonarqube_vulnerabilities.png
├── 04_sonarqube_code_smells.png
├── 05_sonarqube_security_hotspots.png
├── 06_prueba_jwt_fake.png
├── 07_prueba_password_debil.png
├── 08_prueba_brute_force.png
├── 09_prueba_mass_assignment.png
├── 10_prueba_doble_reserva.png
└── 11_prueba_headers.png
```

---

## PASO 7: Actualizar Documentación

### Una vez completadas las pruebas:

1. **Crear reporte de SonarQube**:
   ```bash
   # Crear archivo con resultados de SonarQube
   # Copiar métricas principales
   ```

2. **Crear documento de evidencias**:
   - Compilar todas las capturas
   - Agregar descripciones
   - Comparar con análisis manual

---

## 📊 Checklist de Completitud

### Análisis
- [x] Análisis manual de código
- [ ] Análisis de SonarQube ejecutado
- [ ] Reporte de SonarQube generado

### Pruebas de Vulnerabilidades
- [ ] Test de JWT débil
- [ ] Test de contraseña débil
- [ ] Test de fuerza bruta
- [ ] Test de mass assignment
- [ ] Test de doble reserva
- [ ] Test de headers de seguridad

### Documentación
- [x] Reporte completo de vulnerabilidades
- [x] Resumen ejecutivo
- [x] Procedimientos de prueba
- [x] Scripts automatizados
- [ ] Capturas de pantalla
- [ ] Reporte de SonarQube
- [ ] Documento de evidencias

### Resoluciones (Próxima fase)
- [ ] Plan de correcciones
- [ ] Implementación de fixes
- [ ] Re-test de vulnerabilidades
- [ ] Validación con SonarQube

---

## ⚠️ Notas Importantes

1. **MongoDB debe estar corriendo** para que las pruebas funcionen
2. **El servidor debe estar en http://localhost:3000**
3. **Guardar todos los outputs** para documentación
4. **No ejecutar en producción** - solo en entorno de desarrollo

---

## 🆘 Solución de Problemas

### Error: "ECONNREFUSED"
- Verificar que el servidor esté corriendo
- Verificar que MongoDB esté corriendo

### Error: "sonar-scanner command not found"
- Reinstalar sonar-scanner globalmente
- Verificar PATH

### Error: Token inválido en SonarQube
- Generar nuevo token
- Verificar que no tenga espacios extras

### Error: MongoDB connection failed
- Iniciar MongoDB
- Verificar MONGO_URI en .env

---

## 📞 Siguiente Paso

**Cuando termines estos pasos**, me proporcionas:
1. El token de SonarQube generado
2. Las capturas de pantalla organizadas
3. Cualquier output de las pruebas

Y continuaremos con:
- Análisis de resultados de SonarQube
- Comparación con análisis manual
- Plan de remediación detallado
- Implementación de correcciones

---

*Documento generado el 2026-02-02*

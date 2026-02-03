# Generación de Token de Autenticación - SonarQube

## Problema Detectado

Al intentar ejecutar el análisis automático, se obtuvo un error 401 (No autorizado):
```
[ERROR] Bootstrapper: An error occurred: AxiosError: Request failed with status code 401
```

## Solución: Generar Token Manual

Para ejecutar el análisis de SonarQube, necesitamos generar un token de autenticación.

### Pasos para Generar el Token:

1. **Abrir SonarQube en el navegador**
   - URL: http://localhost:9000
   - Si es la primera vez, las credenciales por defecto son:
     - Usuario: `admin`
     - Contraseña: `admin`
   - Si ya fue configurado, usar las credenciales personalizadas

2. **Acceder a la configuración de tokens**
   - Hacer clic en el avatar/icono de usuario (esquina superior derecha)
   - Seleccionar "My Account"
   - Ir a la pestaña "Security"

3. **Generar nuevo token**
   - En la sección "Generate Tokens"
   - Nombre del token: `reservas-analysis`
   - Tipo: "User Token" o "Project Analysis Token"
   - Hacer clic en "Generate"
   - **IMPORTANTE**: Copiar el token inmediatamente (no se podrá ver después)

4. **Guardar el token**
   - Copiar el token generado
   - Guardarlo en un lugar seguro

### Uso del Token

Una vez generado el token, ejecutar:

```bash
cd Reservas
sonar-scanner -Dsonar.token=TU_TOKEN_AQUI
```

### Alternativa: Crear Proyecto Primero

También puedes crear el proyecto manualmente en SonarQube:
1. Ir a http://localhost:9000
2. Hacer clic en "Create Project"
3. Seleccionar "Manually"
4. Project key: `reservas-backend`
5. Display name: `Sistema de Reservas Backend`
6. Seguir el asistente que te dará el token automáticamente

---

## Estado Actual
- [x] SonarQube verificado (versión 26.1.0)
- [x] Sonar-scanner instalado
- [x] Archivo de configuración creado
- [ ] Token de autenticación generado
- [ ] Análisis ejecutado

---
*Próximo paso: Generar token y ejecutar análisis*

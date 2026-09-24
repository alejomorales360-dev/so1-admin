# SO1 · Admin

App web (Google Apps Script) de administración: gestión de socios, eventos/reuniones, aprobación de puntajes y eventos pendientes de comisiones, usuarios y reglas del sistema.

Este repositorio es una de las tres apps que originalmente vivían en un mismo proyecto de Apps Script (Puntajes, Admin, Tesorería). Cada una quedó separada en su propio repositorio, pero **comparten el mismo backend (`Codigo.gs`)** porque todas leen/escriben la misma planilla de Google Sheets.

## Estructura

- `index.html` — interfaz de la app de administración (frontend que corre dentro de Apps Script).
- `Codigo.gs` — backend compartido (`doGet`/`doPost` + toda la lógica de negocio contra Google Sheets).
- `appsscript.json` — manifest del proyecto Apps Script.
- `.clasp.json.example` — plantilla de configuración para [`clasp`](https://github.com/google/clasp). Copia a `.clasp.json` y reemplaza `scriptId` por el ID real del proyecto Apps Script antes de hacer `clasp push`.

## Desarrollo con clasp

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json   # y edita el scriptId
clasp push
```

## Notas

- `SS_ID` en `Codigo.gs` apunta a la planilla de Google Sheets compartida entre las 3 apps — no cambiarlo sin coordinar con los otros repos.
- El usuario/clave admin inicial vive en la hoja `USUARIOS` (se autogenera con `admin` / `so1admin2026` la primera vez que corre `getSheetUsuarios_()`); cámbiala después del primer despliegue.
- Si vas a desplegar este proyecto como Web App independiente, el `doGet` sin `?page=` sirve `index.html` (esta app de administración).

## Puesta en marcha (despliegue)

1. En <https://script.google.com> crea un proyecto nuevo (o usa el existente) y copia su **ID de script** (Configuración del proyecto).
2. `cp .clasp.json.example .clasp.json`, pega el ID en `scriptId` y ejecuta `clasp push`.
3. En el editor de Apps Script: **Implementar → Nueva implementación → Aplicación web** (Ejecutar como: *Yo*; Acceso: *Cualquier usuario*). Autoriza los permisos (Sheets, Drive, llamadas externas).
4. Copia la URL `/exec` resultante. El frontend tiene la URL del backend fija (`GAS_URL` / `GAS_PS` en `index.html`); si tu implementación genera otra URL, actualízala ahí y vuelve a hacer `clasp push` + nueva versión de la implementación.

`doGet` sirve siempre el `index.html` de este repo (aunque se pase `?page=admin` o `?page=tesoreria` y ese archivo no exista aquí) y toma el título de la pestaña del `<title>` del HTML.

### "Analizar con IA" (lectura de listado escaneado)

Usa la API de Claude. Agrega la propiedad de script `ANTHROPIC_API_KEY` (Configuración del proyecto → Propiedades del script). Sin ella el botón muestra un error explicativo y el resto de la app funciona normal.

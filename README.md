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

## Otras apps en este repositorio

- [`cupos-tarjetas/`](cupos-tarjetas/README.md) — Control de cupos temporales de tarjetas de crédito con alertas de vencimiento. Es un proyecto de Apps Script **independiente** (su propio `appsscript.json` y `scriptId`); el `.claspignore` de la raíz lo excluye para que `clasp push` de SO1 Admin no lo suba.

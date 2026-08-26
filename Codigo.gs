// ════════════════════════════════════════════════════════════════
// SO1 · Sistema de Puntajes — Codigo.gs
// ═══════════════════════════════════════════════════════════════
//
// ════════ ESTRUCTURA DE HOJAS (crear en Google Sheets) ════════
//
// SOCIOS (ya existe)
//   A:ID  B:RUT  C:NOMBRE  D:TELEFONO  E:EMAIL  F:ESTADO  G:FECHA_INGRESO
//
// EVENTOS_2026  (cada evento queda registrado)
//   A:ID  B:NOMBRE  C:TIPO  D:FECHA  E:PTS_COMPLETO  F:PTS_PARCIAL
//
// ASISTENCIAS  (cada marca de cada socio)
//   A:ID  B:ID_EVENTO  C:NOMBRE_EVENTO  D:TIPO_EVENTO  E:FECHA
//   F:RUT_TITULAR  G:TIPO_ASISTENCIA  H:PUNTAJE
//   I:NOMBRE_REPRESENTANTE  J:RUT_REPRESENTANTE
//   K:OBSERVACION  L:TIMESTAMP  M:ENTRADA_MARCADA  N:SALIDA_MARCADA
//
// PUNTAJE_BASE  (puntajes históricos y previos a 2026)
//   A:ID  B:RUT  C:AÑO  D:CONCEPTO  E:PUNTOS  F:OBSERVACION  G:TIMESTAMP
//
// CONFIG
//   A:CLAVE  B:VALOR
//   admin_usuario | admin
//   admin_clave   | so1admin2026
//   cupo_estacionamiento | 80
//
// COMISIONES  (opcional, cargado manualmente)
//   A:ID  B:NOMBRE  C:TIPO  D:DESCRIPCION  E:ACTIVA
//
// COMISION_MIEMBROS  (opcional)
//   A:ID  B:ID_COMISION  C:RUT_SOCIO  D:CARGO  E:FECHA_INICIO  F:ACTIVO
//
// ═══════════════════════════════════════════════════════════════

const SS_ID         = "1-SLawUBXUvYQro37dnVC_2g6KLT1_xE4stoxl7oUJUk";
const SH_SOCIOS     = "SOCIOS";
const SH_ASIST      = "ASISTENCIAS";
const SH_BASE       = "PUNTAJE_BASE";
const SH_EVENTOS    = "EVENTOS";
const SH_ASISTENCIAS = SH_ASIST;  // alias — evita ReferenceError

function testBaseOps() {
  const sheet = getSS().getSheetByName(SH_BASE);
  if(!sheet) { Logger.log('ERROR: hoja PUNTAJE_BASE no encontrada'); return; }
  const rows = sheet.getDataRange().getValues();
  Logger.log('Total filas en PUNTAJE_BASE: ' + rows.length);
  if(rows.length > 1) {
    Logger.log('Primera fila de datos: ' + JSON.stringify(rows[1]));
    Logger.log('rowNum seria: 2');
  }
}

function jsonOut(d){
  return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e){
  const p=e&&e.parameter||{},action=p.action,key=p.key;
  if(!action){
    const page=p.page||'index';
    const titles={admin:'SO1 - Administrador',tesoreria:'SO1 - Tesoreria',index:'SO1 - Puntajes'};
    const file=['admin','tesoreria'].includes(page)?page:'index';
    return HtmlService.createHtmlOutputFromFile(file).setTitle(titles[file]||'SO1');
  }
  const AK='so1admin2026';
  const publicas=['obtenerPuntajePorRut','obtenerPuntajeCompletoSocio','actualizarDatosSocio','autenticarUsuario'];
  if(key!==AK&&!publicas.includes(action))return jsonOut({error:'No autorizado'});
  const arg=p.arg?decodeURIComponent(p.arg):'';
  let payload={};
  if(p.data){try{payload=JSON.parse(p.data);}catch(ex){}}
  try{
    let r;
    switch(action){
      case 'obtenerDashboardAdmin':r=obtenerDashboardAdmin();break;
      case 'obtenerRankingCompleto':r=obtenerRankingCompleto();break;
      case 'obtenerAusenciasObligatorias':r=obtenerAusenciasObligatorias();break;
      case 'obtenerAusenciasComisiones':r=obtenerAusenciasComisiones();break;
      case 'obtenerMiembrosComision':r=obtenerMiembrosComision(arg||p.tipo||(typeof payload==='string'?payload:'')||'');break;
      case 'actualizarMiembrosComision':r=actualizarMiembrosComision(payload);break;
      case 'obtenerPuntajePorRut':r=obtenerPuntajePorRut(arg||p.rut||'');break;
      case 'obtenerPuntajeCompletoSocio':r=obtenerPuntajeCompletoSocio(arg||p.rut||'');break;
      case 'buscarSocioPorRut':r=buscarSocioPorRut(arg||p.rut||'');break;
      case 'obtenerEventoActivo':r=obtenerEventoActivo({usuario:p.usuario||arg||''});break;
      case 'obtenerHistoricoBase':r=obtenerHistoricoBase(arg||p.rut||'');break;
      case 'obtenerListaEventos':r=obtenerListaEventos();break;
      case 'obtenerDetalleEvento':r=obtenerDetalleEvento(arg||p.evId||'');break;
      case 'obtenerSociosCuotas':r=obtenerSociosCuotas(arg||p.mes||'');break;
      case 'obtenerDashTesoreria':r=obtenerDashTesoreria();break;
      case 'obtenerHistorialSocioTes':r=obtenerHistorialSocioTes(arg||p.rut||'');break;
      case 'obtenerMovimientos':r=obtenerMovimientos({tipo:p.tipo||'todos',mes:p.mes||''});break;
      case 'obtenerResumenAnualCuotas':r=obtenerResumenAnualCuotas({anio:p.anio||'2026'});break;
      case 'iniciarEvento':r=iniciarEvento(payload);break;
      case 'registrarMarcaInstantanea':r=registrarMarcaInstantanea(payload);break;
      case 'cerrarEventoActivo':r=cerrarEventoActivo(payload);break;
      case 'inyectarPuntajeBase':r=inyectarPuntajeBase(payload);break;
      case 'editarPuntajeBase':r=editarPuntajeBase(payload);break;
      case 'eliminarPuntajeBase':r=eliminarPuntajeBase(payload);break;
      case 'editarCuota':r=editarCuota(payload);break;
      case 'eliminarCuota':r=eliminarCuota(payload);break;
      case 'registrarMovimiento': r=registrarMovimiento(payload); break;
      case 'registrarCuota':r=registrarCuota(payload);break;
      case 'registrarCuotasMultiples':r=registrarCuotasMultiples(payload);break;
      case 'actualizarDatosSocio':r=actualizarDatosSocio(payload);break;
      case 'actualizarEstadoSocio':if(key!=='so1admin2026'){return jsonOut({error:'No autorizado'});}r=actualizarEstadoSocio(payload);break;
      case 'cerrarEventoMasivo':r=cerrarEventoMasivo(payload);break;
      case 'autenticarUsuario':      r=autenticarUsuario(payload);       break;
      case 'obtenerUsuariosAdmin':   r=obtenerUsuariosAdmin();           break;
      case 'crearUsuarioAdmin':      r=crearUsuarioAdmin(payload);        break;
      case 'editarUsuarioAdmin':     r=editarUsuarioAdmin(payload);       break;
      case 'toggleActivoUsuario':    r=toggleActivoUsuario(payload);      break;
      case 'eliminarUsuarioAdmin':   r=eliminarUsuarioAdmin(payload);     break;
      case 'iniciarEventoPendiente':  r=iniciarEventoPendiente(payload);  break;
      case 'obtenerPendientesAdmin':  r=obtenerPendientesAdmin();          break;
      case 'obtenerResumenPendientes': r=obtenerResumenPendientes();       break;
      case 'aprobarEventoPendiente':  r=aprobarEventoPendiente(payload);   break;
      case 'rechazarEventoPendiente': r=rechazarEventoPendiente(payload);  break;
      case 'aprobarPuntajePendiente':  r=aprobarPuntajePendiente(payload);  break;
      case 'rechazarPuntajePendiente': r=rechazarPuntajePendiente(payload); break;
      case 'obtenerResultadoUpload': r=obtenerResultadoUpload(arg||p.ticketId||''); break;
      case 'subirArchivo': r=subirArchivoDesdeGet(payload); break;
      case 'inyectarLoteBase':   r=inyectarLoteBase(payload);  break;
      case 'aprobarLoteBase':    r=aprobarLoteBase(payload);   break;
      case 'rechazarLoteBase':   r=rechazarLoteBase(payload);  break;
      case 'obtenerDashYSocios': r=obtenerDashYSocios(arg||p.mes||''); break;
      case 'editarAsistencia': r=editarAsistencia(payload); break;
      case 'eliminarAsistencia': r=eliminarAsistencia(payload); break;
      case 'actualizarObservacionAsistencia': r=actualizarObservacionAsistencia(payload); break;
      case 'eliminarMovimiento': r = eliminarMovimiento(payload); break;
      case 'obtenerTodosLosSocios': r = obtenerTodosLosSocios(); break;
      case 'actualizarSocio':       r = actualizarSocio(payload);       break;
      case 'crearSocio':            r = crearSocio(payload);            break;
      case 'cambiarEstadoSocio':    r = cambiarEstadoSocio(payload);    break;
      case 'eliminarSocio':   r = eliminarSocio(payload);   break;
      case 'obtenerEventosDeComision': r=obtenerEventosDeComision({usuario:p.usuario||'',rol:p.rol||''}); break;
      case 'reabrirEventoComision':    r=reabrirEventoComision(payload);   break;
      case 'editarEventoComision':     r=editarEventoComision(payload);    break;
      case 'eliminarEventoComision':   r=eliminarEventoComision(payload);  break;
      case 'importarPuntajeBaseMatriz': r=importarPuntajeBaseMatriz(payload); break;
      default:r={error:'Accion desconocida: '+action};
    }
    return jsonOut(r);
  }catch(err){return jsonOut({error:err.toString()});}
}
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if(data.action === 'subirFotoSocio') {
      var resultadoFoto = subirFotoSocio(data.data);
      return jsonOut(resultadoFoto);
    }

    if(data.key !== 'so1admin2026') return ContentService.createTextOutput('no_auth').setMimeType(ContentService.MimeType.TEXT);

if(data.action === 'importarReunionesMatriz') {
      var resultadoImport = importarReunionesMatriz(data.data);
      return jsonOut(resultadoImport);
    }

    if(data.action === 'importarAsistenciaEvento') {
      var resultadoImportEv = importarAsistenciaEvento(data.data);
      return jsonOut(resultadoImportEv);
    }

    if(data.action === 'subirArchivo') {
      var resultado = subirArchivoDesdeServer({
        base64:        data.base64,
        mimeType:      data.mimeType,
        nombre:        data.nombre,
        ticketId:      data.ticketId,
        subfolder:     data.subfolder,
        carpetaNombre: data.carpetaNombre,
        rutaCompleta:  data.rutaCompleta
      });

      // ── NUEVO: si viene rut+mes de cuota, guardar URL directamente en CUOTAS col K ──
      if(resultado.ok && data.cuotaRut && data.cuotaMes) {
        try {
          var url = PropertiesService.getScriptProperties().getProperty(data.ticketId);
          if(url) {
            var urlData = JSON.parse(url);
            var cuSheet = SpreadsheetApp.openById(SS_ID).getSheetByName('CUOTAS');
            if(cuSheet) {
              var rk = lRut(data.cuotaRut);
              var mes = String(data.cuotaMes);
              var rows = cuSheet.getDataRange().getValues();
              for(var i=1; i<rows.length; i++) {
                if(lRut(String(rows[i][1]||''))===rk && normMes(rows[i][3])===mes) {
                  cuSheet.getRange(i+1, 11).setValue(urlData.url);
                  Logger.log('URL guardada en CUOTAS fila '+(i+1)+': '+urlData.url);
                  break;
                }
              }
            }
          }
        } catch(ex) { Logger.log('Error guardando URL en CUOTAS: '+ex.toString()); }
      }

      Logger.log('doPost subirArchivo: '+JSON.stringify(resultado));
    }
    return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    Logger.log('doPost ERROR: '+err.toString());
    return ContentService.createTextOutput('error').setMimeType(ContentService.MimeType.TEXT);
  }
}
function obtenerResultadoUpload(ticketId) {
  try {
    var props = PropertiesService.getScriptProperties();
    var val = props.getProperty(String(ticketId||''));
    if(!val) return {pending: true};
    props.deleteProperty(String(ticketId));
    return JSON.parse(val);
  } catch(e) { return {pending: true}; }
}
function getSS()   { return SpreadsheetApp.openById(SS_ID); }
function safe(o)   { return JSON.parse(JSON.stringify(o)); }
function ts()      { return new Date().toLocaleString('es-CL'); }
function lRut(r)   { return String(r||'').replace(/\./g,'').replace(/-/g,'').replace(/\s/g,'').trim().toUpperCase(); }

function subirArchivoDesdeGet(payload) {
  try {
    if(!payload||!payload.base64||!payload.ticketId)
      return {ok:false, error:'Faltan parametros'};

    var iter = DriveApp.getFoldersByName('SO1_Respaldos');
    var carpeta = iter.hasNext() ? iter.next() : DriveApp.createFolder('SO1_Respaldos');

    var partes = [];
    if(payload.rutaCompleta){
      partes = String(payload.rutaCompleta).split('/').map(function(p){
        return p.replace(/[\\:*?"<>|]/g,'_').trim().slice(0,60);
      }).filter(function(p){return p.length>0;});
    } else {
      if(payload.subfolder) partes.push(String(payload.subfolder).replace(/[\\:*?"<>|]/g,'_').slice(0,60));
      if(payload.carpetaNombre) partes.push(String(payload.carpetaNombre).replace(/[\\:*?"<>|]/g,'_').slice(0,60));
    }

    partes.forEach(function(nombre){
      if(!nombre) return;
      var sub = carpeta.getFoldersByName(nombre);
      carpeta = sub.hasNext() ? sub.next() : carpeta.createFolder(nombre);
    });

    var blob = Utilities.newBlob(
      Utilities.base64Decode(payload.base64),
      payload.mimeType || 'application/octet-stream',
      payload.nombre || 'archivo'
    );
    var file = carpeta.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = file.getUrl();

    PropertiesService.getScriptProperties().setProperty(
      payload.ticketId,
      JSON.stringify({url: url, nombre: payload.nombre || 'archivo'})
    );

    Logger.log('subirArchivoDesdeGet OK: '+payload.nombre+' url:'+url);
    return {ok: true, url: url, nombre: payload.nombre || 'archivo'};
  } catch(e) {
    Logger.log('subirArchivoDesdeGet ERROR: '+e.toString());
    return {ok: false, error: e.toString()};
  }
}

function subirArchivoDesdeServer(payload) {
  try {
    if(!payload||!payload.base64||!payload.ticketId)
      return {ok:false, error:'Faltan parametros'};

    var iter = DriveApp.getFoldersByName('SO1_Respaldos');
    var carpeta = iter.hasNext() ? iter.next() : DriveApp.createFolder('SO1_Respaldos');

    var partes = [];
    if(payload.rutaCompleta){
      partes = String(payload.rutaCompleta).split('/').map(function(p){
        return p.replace(/[\\:*?"<>|]/g,'_').trim().slice(0,60);
      }).filter(function(p){return p.length>0;});
    } else {
      if(payload.subfolder) partes.push(String(payload.subfolder).replace(/[\\:*?"<>|]/g,'_').slice(0,60));
      if(payload.carpetaNombre) partes.push(String(payload.carpetaNombre).replace(/[\\:*?"<>|]/g,'_').slice(0,60));
    }

    partes.forEach(function(nombre){
      if(!nombre) return;
      var sub = carpeta.getFoldersByName(nombre);
      carpeta = sub.hasNext() ? sub.next() : carpeta.createFolder(nombre);
    });

    var blob = Utilities.newBlob(
      Utilities.base64Decode(payload.base64),
      payload.mimeType || 'application/octet-stream',
      payload.nombre || 'archivo'
    );
    var file = carpeta.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    PropertiesService.getScriptProperties().setProperty(
      payload.ticketId,
      JSON.stringify({url: file.getUrl(), nombre: payload.nombre || 'archivo'})
    );
    Logger.log('Subido: '+payload.nombre+' en '+JSON.stringify(partes));
    return {ok: true};
  } catch(e) {
    Logger.log('subirArchivoDesdeServer ERROR: '+e.toString());
    return {ok: false, error: e.toString()};
  }
}
function parseBool(v){
  if(v===true)return true;
  if(v===false)return false;
  var s=String(v||'').trim().toLowerCase();
  return s==='true'||s==='verdadero'||s==='si'||s==='sí'||s==='1';
}
function normMes(m){ if(!m)return''; if(m instanceof Date){try{return Utilities.formatDate(m,Session.getScriptTimeZone(),'yyyy-MM');}catch(e){}} var s=String(m).trim(); if(/^\d{4}-\d{2}$/.test(s))return s; var d=new Date(s); if(!isNaN(d.getTime()))try{return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM');}catch(e){} return s; }
function normFecha(f){ if(!f)return''; if(f instanceof Date){try{return Utilities.formatDate(f,Session.getScriptTimeZone(),'yyyy-MM-dd');}catch(e){}} var s=String(f).trim(); if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10); var d=new Date(s); if(!isNaN(d.getTime()))try{return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd');}catch(e){} return s; }
function normTA(ta){var v=String(ta||'').trim().toUpperCase(); if(!v||v==='0'||v==='A'||v==='AU'||v==='AUSENTE')return 'AUSENTE'; if(v==='J'||v==='JU'||v==='JUSTIFICADO')return 'JUSTIFICADO'; if(v==='R'||v==='RE'||v==='REP'||v==='REPRESENTANTE'||v==='REPRESENTADO')return 'REPRESENTADO'; if(v==='PA'||v==='PARCIAL')return 'PARCIAL'; if(v==='P'||v==='PR'||v==='PRESENTE')return 'PRESENTE'; return v; }
function fmtFecha(f){
  if(!f) return '';
  if(f instanceof Date){
    try{return Utilities.formatDate(f,Session.getScriptTimeZone(),'dd-MM-yyyy');}catch(e){}
  }
  var s=String(f);
  if(s.includes('T')) s=s.split('T')[0];
  if(!s.includes('-')||s.length!==10) return s||'';
  const[y,m,d]=s.split('-');
  return d+'-'+m+'-'+y;
}

function editarPuntajeBase(payload) {
  try {
    const sheet = getSS().getSheetByName(SH_BASE);
    if(!sheet) return safe({ ok:false, error:'Hoja no encontrada' });

    let rowNum = Number(payload.rowNum);

    if(rowNum >= 2) {
      sheet.getRange(rowNum, 3).setValue(String(payload.nuevoAnio||'2026'));
      sheet.getRange(rowNum, 4).setValue(payload.nuevoConcepto||'');
      sheet.getRange(rowNum, 5).setValue(Number(payload.nuevosPuntos)||0);
      sheet.getRange(rowNum, 7).setValue(ts() + ' (editado)');
      Logger.log('editarPuntajeBase OK rowNum='+rowNum);
      return safe({ ok:true });
    }

    const bk = lRut(payload.rutSocio||'');
    const rows = sheet.getDataRange().getValues();
    for(let i=1; i<rows.length; i++){
      if(lRut(rows[i][1]||'')===bk && String(rows[i][3]||'')===String(payload.concepto||'')){
        rowNum = i + 1;
        sheet.getRange(rowNum, 3).setValue(String(payload.nuevoAnio||'2026'));
        sheet.getRange(rowNum, 4).setValue(payload.nuevoConcepto||'');
        sheet.getRange(rowNum, 5).setValue(Number(payload.nuevosPuntos)||0);
        sheet.getRange(rowNum, 7).setValue(ts() + ' (editado)');
        return safe({ ok:true });
      }
    }

    return safe({ ok:false, error:'Fila no encontrada' });
  } catch(e){
    return safe({ ok:false, error:e.toString() });
  }
}

function eliminarPuntajeBase(payload) {
  try {
    const sheet = getSS().getSheetByName(SH_BASE);
    if(!sheet) return safe({ ok:false, error:'Hoja no encontrada' });

    let rowNum = Number(payload.rowNum);

    if(rowNum >= 2) {
      sheet.deleteRow(rowNum);
      Logger.log('eliminarPuntajeBase OK rowNum='+rowNum);
      return safe({ ok:true });
    }

    const bk = lRut(payload.rutSocio||'');
    const rows = sheet.getDataRange().getValues();
    for(let i=rows.length-1; i>=1; i--){
      if(lRut(rows[i][1]||'')===bk && String(rows[i][3]||'')===String(payload.concepto||'')){
        sheet.deleteRow(i+1);
        return safe({ ok:true });
      }
    }

    return safe({ ok:false, error:'Fila no encontrada' });
  } catch(e){
    return safe({ ok:false, error:e.toString() });
  }
}
// ─────────────────────────────────────────────────────────────
// BUSCAR SOCIO
// ─────────────────────────────────────────────────────────────
function buscarSocioPorRut(rut) {
  try {
    const rows = getSS().getSheetByName(SH_SOCIOS).getDataRange().getValues();
    const bk   = lRut(rut);
    for(let i=1;i<rows.length;i++){
      const f=rows[i];
      if(lRut(f[1]||'')===bk){
        return safe({ socio:{ id:f[0]||'', rut:f[1]||'', rutLimpio:lRut(f[1]||''), nombre:f[2]||'', telefono:f[3]||'', email:f[4]||'', estado:f[5]||'ACTIVO', fechaIngreso:normFecha(f[6]||''), direccion:f[7]||'', fechaNacimiento:normFecha(f[8]||''), fotoUrl:f[9]||'' } });
      }
    }
    return safe({ socio:null });
  } catch(e){ return safe({ error:e.toString() }); }
}

// ─────────────────────────────────────────────────────────────
// CERRAR EVENTO MASIVO (doble marca)
// ─────────────────────────────────────────────────────────────
function cerrarEventoMasivo(payload) {
  try {
    const ss = getSS();
    const ev = payload.evento;
    const regs = payload.registros || [];

    let evSheet = ss.getSheetByName(SH_EVENTOS);
    if(!evSheet){
      evSheet = ss.insertSheet(SH_EVENTOS);
      evSheet.appendRow(['ID','NOMBRE','TIPO','FECHA','PTS_COMPLETO','PTS_PARCIAL','TIMESTAMP','NOTAS']);
    } else if(evSheet.getLastRow() === 0){
      evSheet.appendRow(['ID','NOMBRE','TIPO','FECHA','PTS_COMPLETO','PTS_PARCIAL','TIMESTAMP','NOTAS']);
    }
    const evId = evSheet.getLastRow();
    evSheet.appendRow([evId, ev.nombre, ev.tipo, fmtFecha(ev.fecha), ev.ptsCompleto, ev.ptsParcial, ts(), '']);

    let asSheet = ss.getSheetByName(SH_ASIST);
    if(!asSheet){
      asSheet = ss.insertSheet(SH_ASIST);
      asSheet.appendRow(['ID','ID_EVENTO','RUT_TITULAR','TIPO_ASISTENCIA','PUNTAJE','NOMBRE_REPRESENTANTE','RUT_REPRESENTANTE','OBSERVACION','TIMESTAMP','EVENTO','FECHA','TIPO_EVENTO']);
    } else if(asSheet.getLastRow() === 0){
      asSheet.appendRow(['ID','ID_EVENTO','RUT_TITULAR','TIPO_ASISTENCIA','PUNTAJE','NOMBRE_REPRESENTANTE','RUT_REPRESENTANTE','OBSERVACION','TIMESTAMP','EVENTO','FECHA','TIPO_EVENTO']);
    }

    const fecha = fmtFecha(ev.fecha);
    let guardados = 0;
    regs.forEach(r=>{
      const newId = asSheet.getLastRow();
      asSheet.appendRow([
        newId, evId, ev.nombre, ev.tipo, fecha,
        lRut(r.rutTitular||''),
        r.tipoAsistencia||'PRESENTE',
        Number(r.puntaje)||0,
        r.nombreRepresentante||'',
        lRut(r.rutRepresentante||''),
        r.observacion||'',
        ts()
      ]);
      guardados++;
    });

    return safe({ ok:true, guardados, idEvento: evId });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

// ─────────────────────────────────────────────────────────────
// REGISTRAR ASISTENCIA INDIVIDUAL (desde panel registrar)
// ─────────────────────────────────────────────────────────────
function registrarAsistencia(payload) {
  try {
    const ss = getSS();
    let sheet = ss.getSheetByName(SH_ASIST);
    if(!sheet){
      sheet = ss.insertSheet(SH_ASIST);
      sheet.appendRow(['ID','ID_EVENTO','RUT_TITULAR','TIPO_ASISTENCIA','PUNTAJE','NOMBRE_REPRESENTANTE','RUT_REPRESENTANTE','OBSERVACION','TIMESTAMP','EVENTO','FECHA','TIPO_EVENTO']);
    } else if(sheet.getLastRow() === 0){
      sheet.appendRow(['ID','ID_EVENTO','RUT_TITULAR','TIPO_ASISTENCIA','PUNTAJE','NOMBRE_REPRESENTANTE','RUT_REPRESENTANTE','OBSERVACION','TIMESTAMP','EVENTO','FECHA','TIPO_EVENTO']);
    }
    const newId = sheet.getLastRow();
    sheet.appendRow([
      newId,
      payload.idEvento||'',
      lRut(payload.rutSocio||''),
      payload.tipoAsistencia||'PRESENTE',
      Number(payload.puntaje)||0,
      payload.nombreRepresentante||'',
      lRut(payload.rutRepresentante||''),
      payload.observacion||'',
      ts(),
      payload.evento||'',
      fmtFecha(payload.fecha||''),
      payload.tipoEvento||'otro'
    ]);
    return safe({ ok:true, id:newId });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

// ─────────────────────────────────────────────────────────────
// INYECTAR PUNTAJE BASE (histórico)
// ─────────────────────────────────────────────────────────────
function inyectarPuntajeBase(payload) {
  try {
    const ss = getSS();
    let sheet = ss.getSheetByName(SH_BASE);
    if(!sheet){
      sheet = ss.insertSheet(SH_BASE);
      sheet.appendRow(['ID','RUT','AÑO','CONCEPTO','PUNTOS','OBSERVACION','TIMESTAMP']);
    } else if(sheet.getLastRow() === 0){
      sheet.appendRow(['ID','RUT','AÑO','CONCEPTO','PUNTOS','OBSERVACION','TIMESTAMP']);
    }
    const newId = sheet.getLastRow();
    const estado = payload.pendiente?('PENDIENTE|creadoPor:'+(payload.creadoPor||'comision')):'';
    sheet.appendRow([
      newId,
      lRut(payload.rut||''),
      String(payload.anio||payload['año']||'2026'),
      payload.concepto||'',
      Number(payload.puntos)||0,
      payload.observacion||'',
      ts(),
      estado
    ]);
    return safe({ ok:true, id:newId, pendiente:!!payload.pendiente });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

// ─────────────────────────────────────────────────────────────
// OBTENER HISTÓRICO BASE DE UN SOCIO
// ─────────────────────────────────────────────────────────────
function obtenerHistoricoBase(rut) {
  try {
    const ss    = getSS();
    const sheet = ss.getSheetByName(SH_BASE);
    if(!sheet) return safe({ historial:[] });
    const bk  = lRut(rut);
    const rows = sheet.getDataRange().getValues().slice(1);
    const hist = [];
    rows.forEach((r, i) => {
      if(lRut(r[1]||'') === bk) {
        hist.push({
          rowNum:  i + 2,
          ano:     String(r[2]||''),
          concepto:r[3]||'',
          puntos:  Number(r[4])||0,
          obs:     r[5]||'',
          estado:  String(r[7]||'')
        });
      }
    });
    return safe({ historial: hist });
  } catch(e){ return safe({ error:e.toString() }); }
}

// ─────────────────────────────────────────────────────────────
// HELPERS internos: calcular puntajes por fuente
// ─────────────────────────────────────────────────────────────
function _puntajesMap() {
  var _cache = CacheService.getScriptCache();
  var _cached = _cache.get('puntajesMap');
  if(_cached){
    try { return JSON.parse(_cached); } catch(e){}
  }
  const ss     = getSS();
  const soSheet= ss.getSheetByName(SH_SOCIOS);
  const asSheet= ss.getSheetByName(SH_ASIST);
  const bsSheet= ss.getSheetByName(SH_BASE);

  const mapa   = {};
  const rutIdx = {};

  if(soSheet){
    soSheet.getDataRange().getValues().slice(1).forEach(f=>{
      if(!f[0] && !f[2]) return;
      const id  = String(f[0]||'').trim();
      const rut = String(f[1]||'').trim();
      const rk  = lRut(rut);
      if(!id) return;
      mapa[id] = { id:f[0]||'', rut:f[1]||'', nombre:f[2]||'',
                   rutLimpio:rk, totalBase:0, total2026:0, total:0 };
      if(rk) rutIdx[rk] = id;
    });
  }

  if(bsSheet){
    bsSheet.getDataRange().getValues().slice(1).forEach(r=>{
      const estado = String(r[7]||'');
      if(estado.indexOf('PENDIENTE')===0) return;
      const rk  = lRut(r[1]||'');
      const pts = Number(r[4])||0;
      const id  = rutIdx[rk];
      if(id && mapa[id]) mapa[id].totalBase += pts;
    });
  }

  const evSheetPM = ss.getSheetByName(SH_EVENTOS);
  const evPendienteSet = new Set();
  if(evSheetPM){
    evSheetPM.getDataRange().getValues().slice(1).forEach(r=>{
      var estado=String(r[10]||'');
      if(estado==='PENDIENTE'||estado==='PENDIENTE_ABIERTO') evPendienteSet.add(String(r[0]||''));
    });
  }
  if(asSheet){
    asSheet.getDataRange().getValues().slice(1).forEach(r=>{
      if(evPendienteSet.has(String(r[1]||''))) return;
      const rk  = lRut(r[2]||'');
      const pts = Number(r[4])||0;
      const id  = rutIdx[rk];
      if(id && mapa[id]) mapa[id].total2026 += pts;
    });
  }

Object.values(mapa).forEach(s=>{ s.total = s.totalBase + s.total2026; });
  try { _cache.put('puntajesMap', JSON.stringify(mapa), 45); } catch(e) { }
  return mapa;
}

function obtenerRankingCompleto() {
  try {
    const mapa = _puntajesMap();
    return safe(Object.values(mapa).sort((a,b)=>b.total-a.total));
  } catch(e){ return safe({ error:e.toString() }); }
}
// ─────────────────────────────────────────────────────────────
// DASHBOARD ADMIN
// ─────────────────────────────────────────────────────────────
function obtenerDashboardAdmin() {
  try {
    const ss = getSS();
    const soSheet = ss.getSheetByName(SH_SOCIOS);
    const asSheet = ss.getSheetByName(SH_ASIST);
    const evSheet = ss.getSheetByName(SH_EVENTOS);

    const soRowsFull = soSheet ? soSheet.getDataRange().getValues() : [];
    const asRowsFull = asSheet ? asSheet.getDataRange().getValues() : [];
    const evRowsFull = evSheet ? evSheet.getDataRange().getValues() : [];
    const asRows = asRowsFull.slice(1);
    const evRows = evRowsFull.slice(1);

    const ranking = Object.values(_puntajesMap()).sort((a,b)=>b.total-a.total);

    const ausCalc = _calcAusencias(soRowsFull, asRowsFull);
    const todosConAus = [
      ...(ausCalc.reunion_presencial||[]),
      ...(ausCalc.reunion_online||[]),
      ...(ausCalc.marcha||[])
    ];
    const conAusSet = new Set(todosConAus.map(s=>s.rut));

    const ausMap = {};
    todosConAus.forEach(s=>{
      const k = String(s.id||s.rut);
      if(!ausMap[k]) ausMap[k] = { id:s.id, nombre:s.nombre, rut:s.rut, ausencias:0 };
      ausMap[k].ausencias += (s.ausencias||0);
    });
    const ausencias = Object.values(ausMap)
      .filter(s=>s.ausencias>0)
      .sort((a,b)=>b.ausencias-a.ausencias);

    const historialGlobal = asRows
      .filter(r=>r[2])
      .map(r=>({
        idEvento:       String(r[1]||''),
        rutTitular:     lRut(r[2]||''),
        tipoAsistencia: String(r[3]||''),
        puntaje:        Number(r[4]||0),
        evento:         String(r[9]||''),
        fecha:          fmtFecha(r[10]||''),
        tipoEvento:     String(r[11]||'').toLowerCase().replace(/ /g,'_')
      }));

    const eventosNombres = new Set(asRows.map(r=>r[9]).filter(Boolean));

    const eventosDetalle = evRows.map(r=>({
      id:     r[0],
      nombre: String(r[1]||''),
      tipo:   String(r[2]||'').toLowerCase().replace(/ /g,'_'),
      fecha:  fmtFecha(r[3]||''),
      notas:  String(r[7]||'')
    }));

    const evTipoMap = {};
    eventosDetalle.forEach(ev=>{ evTipoMap[String(ev.id)] = ev.tipo; });
    historialGlobal.forEach(reg=>{
      const mapped = evTipoMap[reg.idEvento];
      if(mapped) reg.tipoEvento = mapped;
    });

    const evOrdenados = eventosDetalle
      .filter(e=>e.fecha)
      .sort((a,b)=>{
        const toISO=f=>{const m=String(f||'').match(/^(\d{2})-(\d{2})-(\d{4})$/);return m?m[3]+'-'+m[2]+'-'+m[1]:String(f||'');};
        return toISO(b.fecha).localeCompare(toISO(a.fecha));
      });

    const conteoPorEv = {};
    asRows.forEach(r=>{
      const evId = String(r[1]||'');
      if(!evId) return;
      if(!conteoPorEv[evId]) conteoPorEv[evId] = { presentes:0, parciales:0, representados:0, ausentes:0, total:0 };
      const c = conteoPorEv[evId];
      c.total++;
      if(r[3]==='PRESENTE') c.presentes++;
      else if(r[3]==='PARCIAL') c.parciales++;
      else if(r[3]==='REPRESENTADO') c.representados++;
      else if(r[3]==='AUSENTE') c.ausentes++;
    });

    const eventosRecientes = evOrdenados.slice(0,3).map(ev=>{
      const c = conteoPorEv[String(ev.id)] || { presentes:0, parciales:0, representados:0, ausentes:0, total:0 };
      return { ...ev, presentes:c.presentes, parciales:c.parciales, representados:c.representados, ausentes:c.ausentes, totalMarcas:c.total };
    });

    return safe({
      ranking,
      totalSocios:       ranking.length,
      totalEventos:      eventosNombres.size,
      sociosConAusencias:conAusSet.size,
      ausencias,
      historialGlobal,
      eventosDetalle,
      eventosRecientes
    });

  } catch(e){ return safe({ error:e.toString() }); }
}
// ─────────────────────────────────────────────────────────────
// AUSENCIAS EN EVENTOS OBLIGATORIOS
// ─────────────────────────────────────────────────────────────
function obtenerAusenciasObligatorias() {
  try { return safe(_calcAusencias()); }
  catch(e){ return safe({ error:e.toString() }); }
}

function _calcAusencias(soRowsPre, asRowsPre) {
  const ss      = getSS();
  const soSheet = ss.getSheetByName(SH_SOCIOS);
  const asSheet = ss.getSheetByName(SH_ASIST);
  const evSheet = ss.getSheetByName(SH_EVENTOS);
  if(!soSheet) return { reunion_presencial:[], reunion_online:[], marcha:[] };

  const soRows = soRowsPre || soSheet.getDataRange().getValues();
  const asRows = asRowsPre || (asSheet ? asSheet.getDataRange().getValues() : []);

  const evTipoMapAus = {};
  if (evSheet) {
    evSheet.getDataRange().getValues().slice(1).forEach(r=>{
      var evIdAus = String(r[0]||'');
      if (evIdAus) evTipoMapAus[evIdAus] = String(r[2]||'').trim().toLowerCase().replace(/ /g,'_');
    });
  }

const socios = {};
  const rutIdx = {};
  soRows.slice(1).forEach(f=>{

    if(!f[0] && !f[2]) return;
    const id  = String(f[0]||'').trim();
    const rk  = lRut(f[1]||'');
    const key = id || rk;
    if(!key) return;
    socios[key] = { id:f[0]||'', rut:f[1]||'', nombre:f[2]||'', rutLimpio:rk, fechaIngresoISO:normFecha(f[6]||'') };
    if(rk) rutIdx[rk] = key;
  });

  const TIPOS_OBL = ['reunion_presencial','reunion_online','marcha'];

  const eventosInfo = { reunion_presencial:{}, reunion_online:{}, marcha:{} };
  const asistioEv   = { reunion_presencial:{}, reunion_online:{}, marcha:{} };

  if(asRows && asRows.length){
    asRows.slice(1).forEach(r=>{
      const evId  = String(r[1]||'');
      const tipo  = evTipoMapAus[evId] || String(r[11]||'').trim().toLowerCase().replace(/ /g,'_');
      const rk    = lRut(r[2]||'');
      const asist = normTA(r[3]||'');
      const evNom = String(r[9]||'');
      const evFec = fmtFecha(r[10]||'');

      if(!TIPOS_OBL.includes(tipo)) return;
      const evKey = evId || evNom;
      if(!evKey) return;

      if(!eventosInfo[tipo][evKey]){
        eventosInfo[tipo][evKey] = { nombre: evNom, fecha: evFec };
      }

      if(['PRESENTE','PARCIAL','REPRESENTADO','JUSTIFICADO'].includes(asist) && rk){
        if(!asistioEv[tipo][rk]) asistioEv[tipo][rk] = new Set();
        asistioEv[tipo][rk].add(evKey);
      }
    });
  }

  const result = {};
  TIPOS_OBL.forEach(tipo => result[tipo] = []);

  function _ddmmyyyyToISO(s){
    var m = String(s||'').match(/^(\d{2})-(\d{2})-(\d{4})$/);
    return m ? (m[3]+'-'+m[2]+'-'+m[1]) : '';
  }

  Object.entries(socios).forEach(([key, s])=>{
    TIPOS_OBL.forEach(tipo=>{
      const todosEvs = Object.keys(eventosInfo[tipo]).filter(evKey=>{
        if(!s.fechaIngresoISO) return true;
        const evISO = _ddmmyyyyToISO(eventosInfo[tipo][evKey].fecha);
        return !evISO || evISO >= s.fechaIngresoISO;
      });
      if(todosEvs.length === 0) return;

      const asistidos   = asistioEv[tipo][s.rutLimpio] || new Set();
      const eventosFaltados = todosEvs
        .filter(evKey => !asistidos.has(evKey))
        .map(evKey => ({
          evId:   evKey,
          nombre: eventosInfo[tipo][evKey].nombre,
          fecha:  eventosInfo[tipo][evKey].fecha
        }));

      if(eventosFaltados.length > 0){
        result[tipo].push({
          id:             s.id,
          rut:            s.rut,
          nombre:         s.nombre,
          tipo,
          ausencias:      eventosFaltados.length,
          totalEventos:   todosEvs.length,
          asistidos:      asistidos.size,
          eventosFaltados
        });
      }
    });
  });

  TIPOS_OBL.forEach(tipo=>{
    result[tipo].sort((a,b)=> b.ausencias - a.ausencias || (a.nombre||'').localeCompare(b.nombre||''));
  });

  return result;
}
// ─────────────────────────────────────────────────────────────
// OBTENER PUNTAJE COMPLETO (interfaz socio + buscar admin)
// ─────────────────────────────────────────────────────────────
function obtenerPuntajeCompletoSocio(rut) {
  return obtenerPuntajePorRut(rut);
}

function obtenerPuntajePorRut(rut) {
  try {
    const ss      = getSS();
    const soSheet = ss.getSheetByName(SH_SOCIOS);
    const asSheet = ss.getSheetByName(SH_ASIST);
    const bsSheet = ss.getSheetByName(SH_BASE);
    if(!soSheet) throw new Error('Hoja SOCIOS no encontrada');

    const rows   = soSheet.getDataRange().getValues();
    const bk     = lRut(rut);
    let socio    = null;
    const todos  = [];

    for(let i=1;i<rows.length;i++){
      const f=rows[i]; if(!f[1]) continue;
      const rk=lRut(f[1]||'');
      const s={ id:f[0]||'',rut:f[1]||'',rutLimpio:rk,nombre:f[2]||'',telefono:f[3]||'',email:f[4]||'',estado:f[5]||'ACTIVO',fechaIngreso:normFecha(f[6]||''),direccion:f[7]||'',fechaNacimiento:normFecha(f[8]||''),fotoUrl:f[9]||'' };
      todos.push(s);
      if(rk===bk) socio=s;
    }

    if(!socio) return safe({ socio:null,total:0,historial:[],ranking:0,totalSocios:todos.length });

    let historial=[]; let total2026=0;
    var asRowsFull = asSheet ? asSheet.getDataRange().getValues() : [];
    var evSheetPR = ss.getSheetByName(SH_EVENTOS);
    var evEstadoMap = {};
    if(evSheetPR){
      evSheetPR.getDataRange().getValues().slice(1).forEach(function(r){
        var eid=String(r[0]||''); if(eid) evEstadoMap[eid]=String(r[10]||'');
      });
    }
    if(asSheet){
      asRowsFull.slice(1).forEach(r=>{
        if(lRut(r[2]||'')!==bk) return;
        const pts=Number(r[4])||0;
var obs = String(r[7]||'');
var archivoUrl = obs.indexOf('Doc: ')===0 ? obs.slice(5) : '';
var estadoEvHist = evEstadoMap[String(r[1]||'')] || '';
var pendienteHist = (estadoEvHist==='PENDIENTE' || estadoEvHist==='PENDIENTE_ABIERTO');
if(!pendienteHist) total2026+=pts;
historial.push({ evento:r[9]||'',tipoAsistencia:r[3]||'',puntaje:pts,fecha:fmtFecha(r[10]||''),representante:r[5]||'',observacion:obs,archivoUrl:archivoUrl,tipoEvento:String(r[11]||'').trim().toLowerCase().replace(/ /g,'_'), pendiente:pendienteHist });
      });
    }

    let historicoBase=[],totalBase=0,actividades2026=[],totalAct2026=0;
    if(bsSheet){
      bsSheet.getDataRange().getValues().slice(1).forEach(r=>{
        if(lRut(r[1]||'')!==bk)return;
        const estado=String(r[7]||'');
        if(estado.indexOf('PENDIENTE')===0)return;
        const anoActualGAS = String(new Date().getFullYear());
        const pts=Number(r[4])||0,ano=String(r[2]||'').trim();
        if(ano===anoActualGAS){
          totalAct2026+=pts;
          if(!String(r[3]||'').startsWith('Cuota al dia')){
            actividades2026.push({ano,concepto:r[3]||'',puntos:pts,obs:r[5]||''});
          }
        }else{
          totalBase+=pts;
          historicoBase.push({ano,concepto:r[3]||'',puntos:pts,obs:r[5]||''});
        }
      });
    }

    const total2026Total=total2026+totalAct2026;
    const total=totalBase+total2026Total;

    const mapa = _puntajesMap();
    const sorted = Object.values(mapa).sort((a,b)=>b.total-a.total);
    let ranking=1;
    for(const s of sorted){ if(s.total>total) ranking++; else break; }

    let cuotas=[],totalCuotasPagado=0,cuotaPts=0;
    const cuSheet=ss.getSheetByName('CUOTAS');
    if(cuSheet){
      cuSheet.getDataRange().getValues().slice(1).forEach(r=>{
        if(!r[1]||lRut(r[1]||'')!==bk)return;
        const mes=normMes(r[3]||''),monto=Number(r[4]||0),fechaPago=normFecha(r[5]||'');
        const aTiempo=parseBool(r[6]),pts=Number(r[7]||0);
        cuotas.push({mes,monto,fechaPago,aTiempo,pts,obs:String(r[8]||''),archivoUrl:String(r[10]||'')});
        totalCuotasPagado+=monto;cuotaPts+=pts;
      });
      cuotas.sort((a,b)=>b.mes.localeCompare(a.mes));
    }

    var TIPOS_OBL_PR = ['reunion_presencial','reunion_online','marcha'];
    var ausOblPR = _calcAusencias(rows, asRowsFull);
    var obligatorioDetalle = [];
    TIPOS_OBL_PR.forEach(function(tipoObl){
      (ausOblPR[tipoObl]||[]).forEach(function(s){
        if(lRut(s.rut||'')===bk) obligatorioDetalle = obligatorioDetalle.concat(s.eventosFaltados||[]);
      });
    });
    var evRowsPR = ss.getSheetByName(SH_EVENTOS).getDataRange().getValues();
    var totalObligatoriosPR = 0;
    var fechaIngresoISO_PR = socio.fechaIngreso || '';
    for(var oi=1; oi<evRowsPR.length; oi++){
      var tipoNormPR = String(evRowsPR[oi][2]||'').trim().toLowerCase().replace(/ /g,'_');
      if(TIPOS_OBL_PR.indexOf(tipoNormPR)>=0){
        var evFechaISO_PR = normFecha(evRowsPR[oi][3]);
        if(!fechaIngresoISO_PR || !evFechaISO_PR || evFechaISO_PR >= fechaIngresoISO_PR) totalObligatoriosPR++;
      }
    }

    return safe({ socio, total, totalBase, total2026:total2026Total, historial, historicoBase, actividades2026, ranking, totalSocios:todos.length, cuotas, totalCuotasPagado, cuotaPts,
      obligatorioFaltas: obligatorioDetalle.length,
      obligatorioEventos: totalObligatoriosPR,
      obligatorioAsistidos: totalObligatoriosPR - obligatorioDetalle.length,
      obligatorioDetalle: obligatorioDetalle
    });

  } catch(e){ return safe({ error:e.toString() }); }
}
// ─────────────────────────────────────────────────────────────
// INICIAR EVENTO
// ─────────────────────────────────────────────────────────────
function iniciarEvento(payload) {
  try {
    var ss  = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    if (!evSheet) return { ok: false, error: 'No existe hoja EVENTOS' };

    var infoUsrIE = _rolYTipoDeUsuario(payload.creadoPor);
    var TIPOS_OBL_IE = ['reunion_presencial','reunion_online','marcha'];
    if (infoUsrIE.rol !== 'admin' && TIPOS_OBL_IE.indexOf(payload.tipo||'reunion_presencial') >= 0) {
      return { ok:false, error:'Solo el administrador puede crear reuniones obligatorias (Presencial/MEET/Marcha).' };
    }

    var newId = _nextEventoId(evSheet);

    var now   = new Date();
    var ts    = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd-MM-yyyy, HH:mm:ss');

    evSheet.appendRow([
      newId,
      payload.nombre    || '',
      payload.tipo      || 'reunion_presencial',
      payload.fecha     || '',
      payload.ptsCompleto || 20,
      payload.ptsParcial  || 10,
      ts,
      payload.horaInicio  || '',
      payload.horaTermino || '',
      payload.creadoPor   || 'admin',
      'ACTIVO'
    ]);

    var key = 'EVENTO_ACTIVO_' + (payload.creadoPor || 'admin');
    var datos = {
      evId:        newId,
      nombre:      payload.nombre     || '',
      fecha:       payload.fecha      || '',
      tipo:        payload.tipo       || 'reunion_presencial',
      horaInicio:  payload.horaInicio || '',
      horaTermino: payload.horaTermino|| '',
      ptsCompleto: payload.ptsCompleto || 20,
      ptsParcial:  payload.ptsParcial  || 10,
      creadoPor:   payload.creadoPor   || 'admin',
      pendiente:   false
    };
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(datos));

    Logger.log('iniciarEvento OK evId=' + newId + ' key=' + key);
    return { ok: true, evId: newId };
  } catch (e) {
    return { ok: false, error: e.toString() };
  }
}


// ─────────────────────────────────────────────────────────────
// OBTENER EVENTO ACTIVO
// ─────────────────────────────────────────────────────────────
function obtenerEventoActivo(payload) {
  try {
    var usuario = (payload && payload.usuario) || '';
    var key     = usuario ? 'EVENTO_ACTIVO_' + usuario : null;
    var props   = PropertiesService.getScriptProperties();
    var raw     = key ? props.getProperty(key) : null;
    if (!raw) return safe({ evento: null, marcas: {} });

    var ev = JSON.parse(raw);
    var ss = getSS();

    var soSheet = ss.getSheetByName(SH_SOCIOS);
    var nombrePorRut = {};
    if (soSheet) {
      soSheet.getDataRange().getValues().slice(1).forEach(function(f){
        var rk = lRut(String(f[1] || ''));
        if (rk) nombrePorRut[rk] = String(f[2] || '');
      });
    }

    var asSheet = ss.getSheetByName(SH_ASIST);
    var marcas  = {};
    if (asSheet) {
      var rows = asSheet.getDataRange().getValues();
      rows.slice(1).forEach(function(r) {
        if (String(r[1] || '') === String(ev.evId)) {
          var rk = lRut(String(r[2] || ''));
          var nombreSocio = nombrePorRut[rk] || String(r[5] || '') || '';
          marcas[rk] = {
            rut:           r[2] || '',
            tipoAsistencia:r[3] || '',
            puntaje:       Number(r[4] || 0),
            nombre:        nombreSocio,
            nombreRep:     String(r[5] || ''),
            id:            r[0] || ''
          };
        }
      });
    }

    return safe({ evento: ev, marcas: marcas });
  } catch (e) {
    return safe({ evento: null, marcas: {}, error: e.toString() });
  }
}
// ─────────────────────────────────────────────────────────────
// REGISTRAR MARCA INSTANTÁNEA
// ─────────────────────────────────────────────────────────────
function registrarMarcaInstantanea(payload) {
  try {
    const ss = getSS();
    let sheet = ss.getSheetByName(SH_ASIST);
    if(!sheet){
      sheet = ss.insertSheet(SH_ASIST);
      sheet.appendRow(['ID','ID_EVENTO','RUT_TITULAR','TIPO_ASISTENCIA','PUNTAJE',
                       'NOMBRE_REPRESENTANTE','RUT_REPRESENTANTE','OBSERVACION',
                       'TIMESTAMP','EVENTO','FECHA','TIPO_EVENTO']);
    } else if(sheet.getLastRow()===0){
      sheet.appendRow(['ID','ID_EVENTO','RUT_TITULAR','TIPO_ASISTENCIA','PUNTAJE',
                       'NOMBRE_REPRESENTANTE','RUT_REPRESENTANTE','OBSERVACION',
                       'TIMESTAMP','EVENTO','FECHA','TIPO_EVENTO']);
    }

    const rk        = lRut(payload.rutSocio||'');
    const tipoNuevo = payload.tipoAsistencia||'PRESENTE';
    const ptsNuevo  = Number(payload.puntaje)||0;

    const rows = sheet.getDataRange().getValues();
    for(let i=1;i<rows.length;i++){
      if(String(rows[i][1])===String(payload.evId) && lRut(rows[i][2]||'')===rk){
        if(tipoNuevo==='AUSENTE'){
          sheet.deleteRow(i+1);
          return safe({ ok:true, accion:'eliminado', id:rows[i][0] });
        }
        sheet.getRange(i+1,4).setValue(tipoNuevo);
        sheet.getRange(i+1,5).setValue(ptsNuevo);
        if(payload.nombreRepresentante!==undefined) sheet.getRange(i+1,6).setValue(payload.nombreRepresentante||'');
        if(payload.rutRepresentante!==undefined)    sheet.getRange(i+1,7).setValue(lRut(payload.rutRepresentante||''));
        sheet.getRange(i+1,9).setValue(ts());
        return safe({ ok:true, accion:'actualizado', id:rows[i][0] });
      }
    }

    if(tipoNuevo==='AUSENTE'){
      return safe({ ok:true, accion:'sin_cambio' });
    }

    const newId = sheet.getLastRow();
    sheet.appendRow([
      newId,
      payload.evId||'',
      rk,
      tipoNuevo,
      ptsNuevo,
      payload.nombreRepresentante||'',
      lRut(payload.rutRepresentante||''),
      payload.observacion||'',
      ts(),
      payload.evento||'',
      fmtFecha(payload.fecha||''),
      payload.tipoEvento||'otro'
    ]);
    return safe({ ok:true, accion:'nuevo', id:newId });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}
// ─────────────────────────────────────────────────────────────
// CERRAR EVENTO ACTIVO
// ─────────────────────────────────────────────────────────────
function cerrarEventoActivo(evId) {
  try {
    var props = PropertiesService.getScriptProperties();

    var allKeys = props.getKeys();
    allKeys.forEach(function(k) {
      if (k.indexOf('EVENTO_ACTIVO_') === 0) {
        try {
          var val = props.getProperty(k);
          if (val) {
            var ev = JSON.parse(val);
            if (String(ev.evId) === String(evId)) {
              props.deleteProperty(k);
              Logger.log('cerrarEventoActivo: borrada key ' + k);
            }
          }
        } catch (ex) { }
      }
    });

    var ss      = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    if (evSheet) {
      var rows = evSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(evId)) {
          var estadoActual = String(rows[i][10] || '');
          var nuevoEstado  = estadoActual === 'PENDIENTE_ABIERTO' ? 'PENDIENTE' : 'CERRADO';
          evSheet.getRange(i + 1, 11).setValue(nuevoEstado);
          Logger.log('cerrarEventoActivo: evId=' + evId + ' estado=' + nuevoEstado);
          break;
        }
      }
    }

    return safe({ ok: true });
  } catch (e) {
    return safe({ ok: false, error: e.toString() });
  }
}

function fixTipoEventoCompleto() {
  const ss = SpreadsheetApp.openById('1-SLawUBXUvYQro37dnVC_2g6KLT1_xE4stoxl7oUJUk');
  let fixedAs = 0, fixedEv = 0;

  const asSheet = ss.getSheetByName('ASISTENCIAS');
  const asRows = asSheet.getDataRange().getValues();
  for(let i = 1; i < asRows.length; i++) {
    const evento = String(asRows[i][9] || '').toLowerCase();
    const tipo   = String(asRows[i][11] || '').toLowerCase();
    if(tipo !== 'comision') continue;
    let nuevo = tipo;
    if(evento.includes('fenapo'))            nuevo = 'comision_fenapo';
    else if(evento.includes('directiva'))    nuevo = 'comision_directiva';
    else if(evento.includes('jardincito'))   nuevo = 'comision_jardincito';
    else if(evento.includes('escuelita'))    nuevo = 'comision_escuelita';
    else if(evento.includes('comprando'))    nuevo = 'comision_comprando';
    else if(evento.includes('reglamento'))   nuevo = 'comision_reglamento';
    else if(evento.includes('bienestar'))    nuevo = 'comision_bienestar';
    else if(evento.includes('deportes'))     nuevo = 'comision_deportes';
    else if(evento.includes('comunicacion')) nuevo = 'comision_comunicaciones';
    else if(evento.includes('secretaria'))   nuevo = 'comision_secretaria';
    else if(evento.includes('tesoreria'))    nuevo = 'comision_tesoreria';
    else if(evento.includes('taller'))       nuevo = 'comision_talleres';
    if(nuevo !== tipo){ asSheet.getRange(i+1, 12).setValue(nuevo); fixedAs++; }
  }

  const evSheet = ss.getSheetByName('EVENTOS');
  if(evSheet){
    const evRows = evSheet.getDataRange().getValues();
    for(let i = 1; i < evRows.length; i++) {
      const nombre = String(evRows[i][1] || '').toLowerCase();
      const tipo   = String(evRows[i][2] || '').toLowerCase();
      if(tipo !== 'comision') continue;
      let nuevo = tipo;
      if(nombre.includes('fenapo'))          nuevo = 'fenapo';
      else if(nombre.includes('jardincito')) nuevo = 'comision_jardincito';
      else if(nombre.includes('escuelita'))  nuevo = 'comision_escuelita';
      else if(nombre.includes('comprando'))  nuevo = 'comision_comprando';
      else if(nombre.includes('reglamento')) nuevo = 'comision_reglamento';
      if(nuevo !== tipo){ evSheet.getRange(i+1, 3).setValue(nuevo); fixedEv++; }
    }
  }

  SpreadsheetApp.getUi().alert('Listo!\nASISTENCIAS corregidas: ' + fixedAs + '\nEVENTOS corregidos: ' + fixedEv);
}

function fixAsistenciasTipo() {
  const ss = SpreadsheetApp.openById('1-SLawUBXUvYQro37dnVC_2g6KLT1_xE4stoxl7oUJUk');
  const sheet = ss.getSheetByName('ASISTENCIAS');
  const rows = sheet.getDataRange().getValues();
  let fixed = 0;

  for(let i = 1; i < rows.length; i++) {
    const tipo = String(rows[i][11] || '').toLowerCase();
    if(tipo !== 'comision') continue;

    const evento = String(rows[i][9] || '').toLowerCase();
    let nuevo = tipo;
    if(evento.includes('fenapo'))          nuevo = 'fenapo';
    else if(evento.includes('jardincito')) nuevo = 'comision_jardincito';
    else if(evento.includes('escuelita'))  nuevo = 'comision_escuelita';
    else if(evento.includes('comprando'))  nuevo = 'comision_comprando';
    else if(evento.includes('reglamento')) nuevo = 'comision_reglamento';

    if(nuevo !== tipo) {
      sheet.getRange(i + 1, 12).setValue(nuevo);
      fixed++;
    }
  }

  SpreadsheetApp.getUi().alert('Listo. ASISTENCIAS corregidas: ' + fixed);
}

function fixAsistenciasDefinitivo() {
  const ss = SpreadsheetApp.openById('1-SLawUBXUvYQro37dnVC_2g6KLT1_xE4stoxl7oUJUk');
  const sheet = ss.getSheetByName('ASISTENCIAS');

  const cambios = [
    { filaInicio: 958,  filaFin: 1052, valor: 'fenapo' },
    { filaInicio: 1053, filaFin: 1123, valor: 'comision_jardincito' },
    { filaInicio: 1124, filaFin: 1130, valor: 'comision_comprando' },
    { filaInicio: 1131, filaFin: 1143, valor: 'comision_reglamento' },
    { filaInicio: 1144, filaFin: 1186, valor: 'comision_escuelita' }
  ];

  let total = 0;
  cambios.forEach(function(c) {
    const nFilas = c.filaFin - c.filaInicio + 1;
    const rango = sheet.getRange(c.filaInicio, 12, nFilas, 1);
    const vals = Array(nFilas).fill([c.valor]);
    rango.setValues(vals);
    total += nFilas;
  });

  SpreadsheetApp.getUi().alert('Listo. ' + total + ' filas actualizadas en ASISTENCIAS.');
}
function obtenerListaEventos() {
  try {
    const ss=getSS();
    const evSheet=ss.getSheetByName(SH_EVENTOS);
    const asSheet=ss.getSheetByName(SH_ASIST);
    const soSheet=ss.getSheetByName(SH_SOCIOS);
    if(!evSheet) return safe({eventos:[]});
    const TODOS=['reunion_presencial','reunion_online','marcha','comision_escuelita'];
    const totalSocios=soSheet?soSheet.getDataRange().getValues().slice(1).filter(r=>r[0]).length:160;
    function normT(t){t=String(t||'').toLowerCase().replace(/ /g,'_');if(t==='directiva')return 'comision_directiva';if(t==='fenapo')return 'comision_fenapo';return t;}
    const evTipoMap={};
    evSheet.getDataRange().getValues().slice(1).forEach(r=>{if(r[0])evTipoMap[String(r[0])]=normT(r[2]||'');});
    const asRows=asSheet?asSheet.getDataRange().getValues().slice(1):[];
    const comMiembros={};
    asRows.forEach(r=>{
      const evId=String(r[1]||''),rk=lRut(r[2]||'');
      if(!evId||!rk)return;
      const t=evTipoMap[evId]||normT(r[11]||'');
      if(!t)return;
      if(!comMiembros[t])comMiembros[t]=new Set();
      comMiembros[t].add(rk);
    });
    const asMap={};
    asRows.forEach(r=>{
      const evId=String(r[1]||'');if(!evId)return;
      if(!asMap[evId])asMap[evId]={p:0,pa:0,re:0};
      const ta=normTA(r[3]||'');
      if(ta==='PRESENTE')asMap[evId].p++;
      else if(ta==='PARCIAL')asMap[evId].pa++;
      else if(ta==='REPRESENTADO')asMap[evId].re++;
    });
    const eventos=evSheet.getDataRange().getValues().slice(1).map(r=>{
      const evId=String(r[0]||''),tipo=normT(r[2]||''),estado=String(r[10]||'').trim();
      const st=asMap[evId]||{p:0,pa:0,re:0};
      const asist=st.p+st.pa+st.re;
      const totalEsp=TODOS.includes(tipo)?totalSocios:(comMiembros[tipo]?comMiembros[tipo].size:0);
      const ausentes=totalEsp>0?Math.max(0,totalEsp-asist):0;
      const pct=totalEsp>0?Math.round((asist/totalEsp)*100):0;
      return {id:evId,nombre:String(r[1]||''),tipo,fecha:fmtFecha(r[3]||''),presentes:st.p,parciales:st.pa,representados:st.re,ausentes,totalEsp,pct,estado};
    }).filter(e=>e.nombre && e.estado!=='PENDIENTE' && e.estado!=='PENDIENTE_ABIERTO').sort((a,b)=>{
      const toISO=f=>{const m=String(f||'').match(/^(\d{2})-(\d{2})-(\d{4})$/);return m?m[3]+'-'+m[2]+'-'+m[1]:String(f||'');};
      return toISO(b.fecha).localeCompare(toISO(a.fecha));
    });
    return safe({eventos,totalSocios});
  } catch(e){return safe({error:e.toString()});}
}

function obtenerDetalleEvento(evId) {
  try {
    const ss=getSS();
    const asSheet=ss.getSheetByName(SH_ASIST);
    const soSheet=ss.getSheetByName(SH_SOCIOS);
    const evSheet=ss.getSheetByName(SH_EVENTOS);
    const TODOS=['reunion_presencial','reunion_online','marcha','comision_escuelita'];
    function normT(t){t=String(t||'').toLowerCase().replace(/ /g,'_');if(t==='directiva')return 'comision_directiva';if(t==='fenapo')return 'comision_fenapo';return t;}
    const socios={},rutIdx={};
    if(soSheet){soSheet.getDataRange().getValues().slice(1).forEach(f=>{if(!f[0])return;const id=String(f[0]).trim(),rk=lRut(f[1]||'');socios[id]={id:f[0],rut:f[1]||'',nombre:f[2]||'',rutLimpio:rk};if(rk)rutIdx[rk]=id;});}
    const evTipoMap={};
    if(evSheet)evSheet.getDataRange().getValues().slice(1).forEach(r=>{if(r[0])evTipoMap[String(r[0])]=normT(r[2]||'');});
    let evento=null;
    if(evSheet){evSheet.getDataRange().getValues().slice(1).forEach(r=>{if(String(r[0])===String(evId)){evento={id:r[0],nombre:String(r[1]||''),tipo:normT(r[2]||''),fecha:fmtFecha(r[3]||''),ptsCompleto:Number(r[4]||0),ptsParcial:Number(r[5]||0)};}});}
    if(!evento)return safe({registros:[],ausentes:[],evento:null,totalEsp:0});
    const asRows=asSheet?asSheet.getDataRange().getValues().slice(1):[];
    const registros=[],asistidos=new Set();
    asRows.filter(r=>String(r[1])===String(evId)).forEach(r=>{
      const rk=lRut(r[2]||''),id=rutIdx[rk],soc=id?socios[id]:null;
      const ta=normTA(r[3]||'');
      if(['PRESENTE','PARCIAL','REPRESENTADO'].includes(ta)&&rk)asistidos.add(rk);
      if(!rk||rk.length<5||!/^\d/.test(rk))return;
      registros.push({rut:r[2]||'',rutLimpio:rk,nombre:soc?soc.nombre:'?',id:soc?soc.id:'?',tipoAsistencia:ta,puntaje:Number(r[4]||0),nombreRepresentante:String(r[5]||''),observacion:String(r[7]||'')});
    });
    registros.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));
    let ausentes=[],totalEsp=0;
    if(TODOS.includes(evento.tipo)){
      totalEsp=Object.keys(socios).length;
      ausentes=Object.values(socios).filter(s=>s.rutLimpio&&!asistidos.has(s.rutLimpio)).map(s=>({id:s.id,nombre:s.nombre,rut:s.rut})).sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));
    } else {
      const miembros=new Set();
      asRows.forEach(r=>{const eid=String(r[1]||''),rk=lRut(r[2]||'');const t=evTipoMap[eid]||normT(r[11]||'');if(t===evento.tipo&&rk)miembros.add(rk);});
      totalEsp=miembros.size;
      ausentes=[...miembros].filter(rk=>!asistidos.has(rk)).map(rk=>{const id=rutIdx[rk],soc=id?socios[id]:null;return {id:soc?soc.id:'?',nombre:soc?soc.nombre:rk,rut:soc?soc.rut:rk};}).sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));
    }
    return safe({registros,ausentes,evento,totalEsp});
  } catch(e){return safe({error:e.toString()});}
}

// ═══════════════════════════════════════════════════════
// TESORERIA
// ═══════════════════════════════════════════════════════
const SH_CUOTAS='CUOTAS';
const SH_MOVIMIENTOS='MOVIMIENTOS';
const CUOTA_MONTO=3000;
const CUOTA_PTS=20;

function obtenerDashYSocios(mes) {
  try {
    var ss = getSS();
    var hoy = new Date();
    var mesActual = Utilities.formatDate(hoy, Session.getScriptTimeZone(), 'yyyy-MM');
    var mesStr = normMes(mes) || mesActual;

    var soRows = ss.getSheetByName(SH_SOCIOS).getDataRange().getValues();
    var cuSheet = ss.getSheetByName(SH_CUOTAS);
    var mvSheet = ss.getSheetByName(SH_MOVIMIENTOS);
    var cuRows = cuSheet ? cuSheet.getDataRange().getValues().slice(1) : [];
    var mvRows = mvSheet ? mvSheet.getDataRange().getValues().slice(1) : [];

    var soActivos = soRows.slice(1).filter(function(r){ return r[0] && String(r[5]||'').toUpperCase()!=='EXPULSADO'; });
    var totalSocios = soRows.slice(1).filter(function(r){ return r[0]; }).length || 160;

    var cuMap = {};
    cuRows.forEach(function(r){
      if(!r[0]) return;
      var rowMes = normMes(r[3]);
      var rk = lRut(String(r[1]||''));
      if(!cuMap[rk+'|'+rowMes]){
        var fp = normFecha(r[5]);
        var at = fp ? (fp.slice(0,7) <= rowMes) : parseBool(r[6]);
        cuMap[rk+'|'+rowMes] = {pagado:true,aTiempo:at,fechaPago:fp,monto:Number(r[4]||0),pts:at?20:0};
      }
    });
    var socios = soActivos.map(function(r){
      var rk = lRut(String(r[1]||''));
      var cu = cuMap[rk+'|'+mesStr];
      return Object.assign({id:r[0],rut:String(r[1]||''),nombre:String(r[2]||''),pagado:false,aTiempo:false,fechaPago:'',monto:0,pts:0}, cu||{});
    });

    var pagosMesArr = cuRows.filter(function(r){ return normMes(r[3])===mesActual; });
    var recaudadoMes = pagosMesArr.reduce(function(a,r){return a+Number(r[4]||0);},0);
    var sociosAlDia  = pagosMesArr.length;
    var pagosATiempo = pagosMesArr.filter(function(r){
      var fp=normFecha(r[5]||''); return fp?(fp.slice(0,7)<=mesActual):parseBool(r[6]);
    }).length;

    var mvMesArr = mvRows.filter(function(r){
      var f=normFecha(r[4]||''); return f.startsWith(mesActual);
    });
    var gastosMes   = mvMesArr.filter(function(r){return r[1]==='gasto';}).reduce(function(a,r){return a+Number(r[3]||0);},0);
    var ingresosMes = mvMesArr.filter(function(r){return r[1]==='ingreso';}).reduce(function(a,r){return a+Number(r[3]||0);},0);

    var totalIngresos = cuRows.reduce(function(a,r){return a+Number(r[4]||0);},0) +
                        mvRows.filter(function(r){return r[1]==='ingreso';}).reduce(function(a,r){return a+Number(r[3]||0);},0);
    var totalGastos   = mvRows.filter(function(r){return r[1]==='gasto';}).reduce(function(a,r){return a+Number(r[3]||0);},0);

    var meses6 = [];
    for(var i=5;i>=0;i--){
      var d2=new Date(hoy.getFullYear(),hoy.getMonth()-i,1);
      var m=Utilities.formatDate(d2,Session.getScriptTimeZone(),'yyyy-MM');
      var p=cuRows.filter(function(r){return normMes(r[3])===m;});
      meses6.push({mes:m,pagos:p.length,recaudado:p.reduce(function(a,r){return a+Number(r[4]||0);},0),esperado:totalSocios*CUOTA_MONTO});
    }

    var ultMovs = pagosMesArr.slice(-8).map(function(r){
      return {tipo:'cuota',concepto:'Cuota '+String(r[3]||''),monto:Number(r[4]||0),fecha:String(r[5]||''),nombre:String(r[2]||'')};
    }).concat(mvMesArr.slice(-5).map(function(r){
      return {tipo:String(r[1]||''),concepto:String(r[2]||''),monto:Number(r[3]||0),fecha:String(r[4]||''),nombre:String(r[7]||'')};
    })).sort(function(a,b){return String(b.fecha).localeCompare(String(a.fecha));}).slice(0,10);

    var m6Keys = meses6.map(function(m){return m.mes;});
    var pagM = {};
    cuRows.forEach(function(r){
      var mes=normMes(r[3]); if(m6Keys.indexOf(mes)<0) return;
      var fp=normFecha(r[5]||''); var at=fp?(fp.slice(0,7)<=mes):parseBool(r[6]);
      if(!at) return;
      var rk=lRut(String(r[1]||''));
      if(!pagM[rk]) pagM[rk]={rut:r[1]||'',nombre:String(r[2]||''),mesesAlDia:0};
      pagM[rk].mesesAlDia++;
    });
    var topPagadores = Object.values(pagM).sort(function(a,b){return b.mesesAlDia-a.mesesAlDia;}).slice(0,5);

    var nMes = parseInt(mesActual.slice(5));
    var mesesHoy = [];
    for(var mi=1;mi<=nMes;mi++) mesesHoy.push(mesActual.slice(0,4)+'-'+String(mi).padStart(2,'0'));
    var pagSet = {};
    cuRows.forEach(function(r){
      var rk=lRut(String(r[1]||'')); var mes=normMes(r[3]);
      if(!pagSet[rk]) pagSet[rk]={}; pagSet[rk][mes]=true;
    });
    var topDeudores = soActivos.filter(function(r){return String(r[5]||'').toUpperCase()==='ACTIVO';})
      .map(function(r){
        var rk=lRut(String(r[1]||''));
        var deuda=mesesHoy.filter(function(m){return !(pagSet[rk]&&pagSet[rk][m]);}).length;
        return {rut:r[1]||'',nombre:String(r[2]||''),mesesDeuda:deuda};
      }).filter(function(s){return s.mesesDeuda>0;})
        .sort(function(a,b){return b.mesesDeuda-a.mesesDeuda;}).slice(0,5);

    var catM = {};
    mvRows.filter(function(r){return r[1]==='gasto';}).forEach(function(r){
      var cat=String(r[5]||'otro').toLowerCase()||'otro';
      catM[cat]=(catM[cat]||0)+Number(r[3]||0);
    });
    var gastosPorCat = Object.keys(catM).map(function(k){return {cat:k,monto:catM[k]};})
      .sort(function(a,b){return b.monto-a.monto;});

    return safe({
      socios: socios,
      mesActual:mesActual, totalSocios:totalSocios,
      recaudadoMes:recaudadoMes, esperadoMes:totalSocios*CUOTA_MONTO,
      sociosAlDia:sociosAlDia, pagosATiempo:pagosATiempo,
      sociosMorosos:totalSocios-sociosAlDia,
      gastosMes:gastosMes, ingresosMes:ingresosMes,
      saldo:totalIngresos-totalGastos,
      totalIngresos:totalIngresos, totalGastos:totalGastos,
      meses6:meses6, ultMovs:ultMovs,
      topPagadores:topPagadores, topDeudores:topDeudores,
      gastosPorCat:gastosPorCat
    });
  } catch(e){ return safe({error:e.toString()}); }
}
// ═══════════════════════════════════════════════════
// REEMPLAZAR obtenerDashTesoreria en Codigo.gs
// ═══════════════════════════════════════════════════

function obtenerDashTesoreria(){
  try{
    const ss=getSS();
    const soSheet=ss.getSheetByName(SH_SOCIOS);
    const cuSheet=ss.getSheetByName(SH_CUOTAS);
    const mvSheet=ss.getSheetByName(SH_MOVIMIENTOS);
    const hoy=new Date();
    const mesActual=Utilities.formatDate(hoy,Session.getScriptTimeZone(),'yyyy-MM');

    const soRows=soSheet?soSheet.getDataRange().getValues():[];
    const cuRows=cuSheet?cuSheet.getDataRange().getValues().slice(1):[];
    const mvRows=mvSheet?mvSheet.getDataRange().getValues().slice(1):[];
    const totalSocios=soRows.slice(1).filter(r=>r[0]).length||160;

    const mesesHastaHoy=[];
    for(let i=1;i<=parseInt(mesActual.slice(5));i++)
      mesesHastaHoy.push(mesActual.slice(0,4)+'-'+String(i).padStart(2,'0'));

    const cuMesSet=new Set();
    const cuATSet=new Set();
    const pagadosMap={};
    const pagM6={};

    const mes6Keys=[];
    for(let i=5;i>=0;i--){
      const d=new Date(hoy.getFullYear(),hoy.getMonth()-i,1);
      mes6Keys.push(Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM'));
    }

    let recaudadoMes=0,totalIngrCuotas=0;
    const meses6Data={};
    mes6Keys.forEach(m=>{meses6Data[m]={pagos:0,recaudado:0};});

    cuRows.forEach(r=>{
      if(!r[0])return;
      const rk=lRut(String(r[1]||''));
      const mes=normMes(r[3]);
      const monto=Number(r[4]||0);
      const fp=normFecha(r[5]||'');
      const at=fp?(fp.slice(0,7)<=mes):parseBool(r[6]);
      const nombre=String(r[2]||'');
      totalIngrCuotas+=monto;
      if(mes===mesActual){recaudadoMes+=monto;cuMesSet.add(rk);if(at)cuATSet.add(rk);}
      if(!pagadosMap[rk])pagadosMap[rk]=new Set();
      pagadosMap[rk].add(mes);
      if(mes6Keys.includes(mes)&&at){
        if(!pagM6[rk])pagM6[rk]={rut:r[1]||'',nombre,meses:0};
        pagM6[rk].meses++;
        if(meses6Data[mes]){meses6Data[mes].pagos++;meses6Data[mes].recaudado+=monto;}
      }
    });

    let gastosMes=0,ingresosMes=0,totalGastos=0,totalIngrMovs=0;
    const catMap={};

    mvRows.forEach(r=>{
      if(!r[1])return;
      const tipo=String(r[1]||'');
      const monto=Number(r[3]||0);
      const f=normFecha(r[4]||'');
      const mes=f.slice(0,7);
      if(tipo==='gasto'){
        totalGastos+=monto;
        const cat=String(r[5]||'otro').toLowerCase()||'otro';
        catMap[cat]=(catMap[cat]||0)+monto;
        if(mes===mesActual)gastosMes+=monto;
      } else if(tipo==='ingreso'){
        totalIngrMovs+=monto;
        if(mes===mesActual)ingresosMes+=monto;
      }
    });

    const meses6=mes6Keys.map(m=>{
      const cuD=meses6Data[m]||{pagos:0,recaudado:0};
      return {mes:m,pagos:cuD.pagos,recaudado:cuD.recaudado,esperado:totalSocios*CUOTA_MONTO};
    });

    const topPagadores=Object.values(pagM6)
      .sort((a,b)=>b.meses-a.meses).slice(0,5)
      .map(p=>({rut:p.rut,nombre:p.nombre,mesesAlDia:p.meses}));

    const soActivos=soRows.slice(1).filter(r=>r[0]&&String(r[5]||'').toUpperCase()==='ACTIVO');
    const topDeudores=soActivos.map(r=>{
      const rk=lRut(String(r[1]||''));
      const pags=pagadosMap[rk]||new Set();
      const deuda=mesesHastaHoy.filter(m=>!pags.has(m)).length;
      return {rut:r[1]||'',nombre:String(r[2]||''),mesesDeuda:deuda};
    }).filter(s=>s.mesesDeuda>0)
      .sort((a,b)=>b.mesesDeuda-a.mesesDeuda).slice(0,5);

    const gastosPorCat=Object.entries(catMap)
      .map(([cat,monto])=>({cat,monto}))
      .sort((a,b)=>b.monto-a.monto);

    const pagosMes=cuRows.filter(r=>normMes(r[3])===mesActual).slice(-6);
    const mvMes=mvRows.filter(r=>{
      const f=normFecha(r[4]||''); return f.startsWith(mesActual);
    }).slice(-5);
    const ultMovs=[
      ...pagosMes.map(r=>({tipo:'cuota',concepto:'Cuota '+normMes(r[3]||''),monto:Number(r[4]||0),fecha:String(r[5]||''),nombre:String(r[2]||'')})),
      ...mvMes.map(r=>({tipo:String(r[1]||''),concepto:String(r[2]||''),monto:Number(r[3]||0),fecha:String(r[4]||''),nombre:String(r[7]||'')}))
    ].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,10);

    const pagosATiempo=cuATSet.size;
    const sociosAlDia=cuMesSet.size;
    const esperadoMes=totalSocios*CUOTA_MONTO;
    const totalIngresos=totalIngrCuotas+totalIngrMovs;

    return safe({
      mesActual,totalSocios,recaudadoMes,esperadoMes,
      sociosAlDia,pagosATiempo,
      sociosMorosos:totalSocios-sociosAlDia,
      gastosMes,ingresosMes,
      saldo:totalIngresos-totalGastos,
      totalIngresos,totalGastos,
      meses6,ultMovs,
      topPagadores,topDeudores,gastosPorCat
    });
  }catch(e){return safe({error:e.toString()});}
}

function obtenerSociosCuotas(mes) {
  try {
    var ss   = SpreadsheetApp.openById(SS_ID);
    var shSo = ss.getSheetByName(SH_SOCIOS);
    var shCu = ss.getSheetByName('CUOTAS');
    var mesStr = normMes(mes);

    var todos = shSo.getDataRange().getValues().slice(1)
      .filter(function(r){ return r[0] && String(r[5]||'').toUpperCase()!=='EXPULSADO'; })
      .map(function(r){
        return { id:r[0], rut:String(r[1]||'').trim(),
                 nombre:String(r[2]||'').trim(), pagado:false,
                 aTiempo:false, fechaPago:'', monto:0, pts:0 };
      });

    var cuMap = {};
    if(shCu){
      shCu.getDataRange().getValues().slice(1).forEach(function(r){
        if(!r[0]) return;
        var rowMes = normMes(r[3]);
        if(rowMes !== mesStr) return;
        var rk = lRut(String(r[1]||''));
       var fp2  = normFecha(r[5]);
        var ms2  = normMes(r[3]);
        var at2  = fp2 ? (fp2.slice(0,7) <= ms2) : parseBool(r[6]);
        cuMap[rk] = {
          pagado:    true,
          aTiempo:   at2,
          fechaPago: fp2,
          monto:     Number(r[4]||0),
          pts:       at2 ? 20 : 0
        };
      });
    }

    var result = todos.map(function(s){
      var rk = lRut(s.rut);
      var cu = cuMap[rk];
      if(cu) return Object.assign({}, s, cu);
      return s;
    });

    return { socios: result };
  } catch(e) { return { socios:[], error:e.toString() }; }
}

function editarCuota(payload) {
  try {
    var ss = getSS();
    var cuSheet = ss.getSheetByName('CUOTAS');
    if(!cuSheet) return {ok:false, error:'No existe hoja CUOTAS'};

    var rk  = lRut(String(payload.rut||''));
    var mes = String(payload.mes||'');
    var rows = cuSheet.getDataRange().getValues();

    var rowNum = -1;
    for(var i=1; i<rows.length; i++){
      if(lRut(String(rows[i][1]||''))===rk && normMes(rows[i][3])===mes){
        rowNum = i+1; break;
      }
    }
    if(rowNum < 0) return {ok:false, error:'Cuota no encontrada para '+mes};

    var anteriorATiempo = rows[rowNum-1][6]===true || String(rows[rowNum-1][6]).toLowerCase()==='true';
    var nuevaFecha = String(payload.fechaPago||'');
    var nuevoATiempo = nuevaFecha ? (nuevaFecha.slice(0,7) <= mes) : anteriorATiempo;
    var nuevoPts    = nuevoATiempo ? 20 : 0;
    var nuevoMonto  = Number(payload.monto)||3000;
    var nuevaObs    = String(payload.observacion||'');

    cuSheet.getRange(rowNum, 5).setValue(nuevoMonto);
    cuSheet.getRange(rowNum, 6).setValue(nuevaFecha);
    cuSheet.getRange(rowNum, 7).setValue(nuevoATiempo);
    cuSheet.getRange(rowNum, 8).setValue(nuevoPts);
    cuSheet.getRange(rowNum, 9).setValue(nuevaObs);
    cuSheet.getRange(rowNum, 10).setValue(ts());

    var bsSheet = ss.getSheetByName(SH_BASE);
    if(!anteriorATiempo && nuevoATiempo){
      var yaExiste = false;
      if(bsSheet){
        var bsRows = bsSheet.getDataRange().getValues();
        for(var j=1; j<bsRows.length; j++){
          if(lRut(String(bsRows[j][1]||''))===rk && String(bsRows[j][3]||'').indexOf('Cuota al dia - '+mes)===0){
            yaExiste = true; break;
          }
        }
      }
      if(!yaExiste){
        inyectarPuntajeBase({rut:payload.rut, anio:mes.slice(0,4), puntos:20,
          concepto:'Cuota al dia - '+mes, observacion:'Corregido tesoreria '+ts()});
      }
    } else if(anteriorATiempo && !nuevoATiempo){
      if(bsSheet){
        var bsRows2 = bsSheet.getDataRange().getValues();
        for(var k=bsRows2.length-1; k>=1; k--){
          if(lRut(String(bsRows2[k][1]||''))===rk &&
             String(bsRows2[k][3]||'').indexOf('Cuota al dia - '+mes)===0){
            bsSheet.deleteRow(k+1); break;
          }
        }
      }
    }

    return {ok:true, aTiempo:nuevoATiempo, pts:nuevoPts};
  } catch(e){ return {ok:false, error:e.toString()}; }
}
function eliminarCuota(payload) {
  try {
    var ss = getSS();
    var cuSheet = ss.getSheetByName('CUOTAS');
    if(!cuSheet) return {ok:false, error:'No existe hoja CUOTAS'};

    var rk  = lRut(String(payload.rut||''));
    var mes = String(payload.mes||'');
    var rows = cuSheet.getDataRange().getValues();

    var rowNum=-1, eraATiempo=false;
    for(var i=1; i<rows.length; i++){
      if(lRut(String(rows[i][1]||''))===rk && normMes(rows[i][3])===mes){
        rowNum=i+1;
        eraATiempo=rows[i][6]===true||String(rows[i][6]).toLowerCase()==='true';
        break;
      }
    }
    if(rowNum<0) return {ok:false, error:'Cuota no encontrada para '+mes};

    cuSheet.deleteRow(rowNum);

    var ptsQuitados=false;
    if(eraATiempo){
      var bsSheet=ss.getSheetByName(SH_BASE);
      if(bsSheet){
        var bsRows=bsSheet.getDataRange().getValues();
        for(var k=bsRows.length-1; k>=1; k--){
          if(lRut(String(bsRows[k][1]||''))===rk &&
             String(bsRows[k][3]||'').indexOf('Cuota al dia - '+mes)===0){
            bsSheet.deleteRow(k+1);
            ptsQuitados=true;
            break;
          }
        }
      }
    }
    return {ok:true, ptsQuitados:ptsQuitados};
  } catch(e){ return {ok:false, error:e.toString()}; }
}
function registrarCuota(payload){
  try{
    const ss=getSS();let cuSheet=ss.getSheetByName(SH_CUOTAS);
    if(!cuSheet){cuSheet=ss.insertSheet(SH_CUOTAS);cuSheet.appendRow(['ID','RUT','NOMBRE','MES','MONTO','FECHA_PAGO','A_TIEMPO','PTS_ASIGNADOS','OBSERVACION','TIMESTAMP']);}
    const rk=lRut(payload.rut||''),mes=String(payload.mes||''),monto=Number(payload.monto)||CUOTA_MONTO,fechaPago=String(payload.fechaPago||''),obs=String(payload.observacion||'');
    const rows=cuSheet.getLastRow()>1?cuSheet.getDataRange().getValues().slice(1):[];
    for(const r of rows){if(lRut(r[1]||'')===rk&&String(r[3]||'')===mes)return safe({ok:false,error:'Ya existe pago para este socio en '+mes});}
    const aTiempo=fechaPago.slice(0,7)<=mes;
    const pts=aTiempo?CUOTA_PTS:0;
    const soSheet=ss.getSheetByName(SH_SOCIOS);let nombre='';
    if(soSheet){for(const r of soSheet.getDataRange().getValues().slice(1)){if(lRut(r[1]||'')===rk){nombre=String(r[2]||'');break;}}}
    cuSheet.appendRow([cuSheet.getLastRow(),payload.rut||'',nombre,mes,monto,fechaPago,aTiempo,pts,obs,ts(),String(payload.archivoUrl||'')]);
    if(aTiempo&&pts>0){inyectarPuntajeBase({rut:payload.rut||'',anio:new Date().getFullYear(),puntos:pts,concepto:'Cuota al dia - '+mes,observacion:'Pago '+fechaPago});}
    return safe({ok:true,aTiempo,pts,nombre,monto});
  }catch(e){return safe({ok:false,error:e.toString()});}
}

function registrarMovimiento(payload){
  try{
    const ss=getSS();let mvSheet=ss.getSheetByName(SH_MOVIMIENTOS);
    if(!mvSheet){mvSheet=ss.insertSheet(SH_MOVIMIENTOS);mvSheet.appendRow(['ID','TIPO','CONCEPTO','MONTO','FECHA','CATEGORIA','RUT_SOCIO','RESPONSABLE','TIMESTAMP']);}
    mvSheet.appendRow([mvSheet.getLastRow(),String(payload.tipo||'ingreso'),String(payload.concepto||''),Number(payload.monto)||0,String(payload.fecha||''),String(payload.categoria||''),lRut(payload.rutSocio||''),String(payload.responsable||''),ts(),String(payload.archivoUrl||'')]);
    return safe({ok:true});
  }catch(e){return safe({ok:false,error:e.toString()});}
}
function obtenerMovimientos(filtros){
  try{
    const ss=getSS(),cuSheet=ss.getSheetByName(SH_CUOTAS),mvSheet=ss.getSheetByName(SH_MOVIMIENTOS);
    const tipo=(filtros&&filtros.tipo)||'todos',mes=(filtros&&filtros.mes)||'';
    const cuRows=cuSheet?cuSheet.getDataRange().getValues().slice(1):[];
    const mvRows=mvSheet?mvSheet.getDataRange().getValues().slice(1):[];
    let movs=[];
    if(tipo==='todos'||tipo==='ingreso'){
      cuRows.forEach(r=>{
        const f=normFecha(r[5]||'');
        if(mes&&!f.startsWith(mes))return;
        movs.push({tipo:'ingreso',concepto:'Cuota '+normMes(r[3]||''),monto:Number(r[4]||0),fecha:f,categoria:'cuota',nombre:String(r[2]||''),aTiempo:r[6]===true||String(r[6]).toLowerCase()==='true'});
      });
    }
    if(tipo==='todos'||tipo==='gasto'){
      mvRows.forEach(r=>{
        if(r[1]!=='gasto')return;
        const f=normFecha(r[4]||'');
        if(mes&&!f.startsWith(mes))return;
        movs.push({tipo:'gasto',concepto:String(r[2]||''),monto:Number(r[3]||0),fecha:f,categoria:String(r[5]||''),nombre:String(r[7]||''),archivoUrl:String(r[9]||'')});
      });
    }
    if(tipo==='todos'||tipo==='ingreso'){
      mvRows.forEach(r=>{
        if(r[1]!=='ingreso')return;
        const f=normFecha(r[4]||'');
        if(mes&&!f.startsWith(mes))return;
        movs.push({tipo:'ingreso',concepto:String(r[2]||''),monto:Number(r[3]||0),fecha:f,categoria:String(r[5]||''),nombre:String(r[7]||''),archivoUrl:String(r[9]||'')});
      });
    }
    movs.sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
    const totI=movs.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+m.monto,0);
    const totG=movs.filter(m=>m.tipo==='gasto').reduce((a,m)=>a+m.monto,0);
    return safe({movimientos:movs,totalIngresos:totI,totalGastos:totG,balance:totI-totG});
  }catch(e){return safe({error:e.toString()});}
}

function obtenerHistorialSocioTes(rut) {
  try {
    var ss   = SpreadsheetApp.openById(SS_ID);
    var shSo = ss.getSheetByName(SH_SOCIOS);
    var shCu = ss.getSheetByName('CUOTAS');
    var rk   = lRut(String(rut||''));

    var socio = null;
    shSo.getDataRange().getValues().slice(1).forEach(function(r){
      if(!socio && lRut(String(r[1]||''))===rk)
        socio = { id:r[0], rut:String(r[1]||'').trim(),
                  nombre:String(r[2]||'').trim(), telefono:String(r[3]||''),
                  email:String(r[4]||''), estado:String(r[5]||'ACTIVO') };
    });
    if(!socio) return { error:'Socio no encontrado' };

    var cuotas = [];
    var totalPagado = 0, mesesAlDia = 0, totalPts = 0;

    if(shCu){
      shCu.getDataRange().getValues().slice(1).forEach(function(r){
        if(!r[0]) return;
        if(lRut(String(r[1]||'')) !== rk) return;
        var mes      = normMes(r[3]);
        var fechaPago= normFecha(r[5]);
        var aTiempo  = fechaPago ? (fechaPago.slice(0,7) <= mes) : parseBool(r[6]);
        var monto    = Number(r[4]||0);
        var pts      = Number(r[7]||0);
        var obs      = String(r[8]||'');
        cuotas.push({ mes:mes, fechaPago:fechaPago,
              aTiempo:aTiempo, monto:monto, pts:pts, obs:obs,
              archivoUrl:String(r[10]||'') });
        totalPagado += monto;
        if(aTiempo) mesesAlDia++;
        totalPts += pts;
      });
    }

    cuotas.sort(function(a,b){ return a.mes.localeCompare(b.mes); });
    return { socio:socio, cuotas:cuotas,
             totalPagado:totalPagado, mesesAlDia:mesesAlDia, totalPts:totalPts };
  } catch(e) { return { error:e.toString() }; }
}

function registrarCuotasMultiples(payload){
  try{
    const ss=getSS();let cuSheet=ss.getSheetByName(SH_CUOTAS);
    if(!cuSheet){cuSheet=ss.insertSheet(SH_CUOTAS);cuSheet.appendRow(['ID','RUT','NOMBRE','MES','MONTO','FECHA_PAGO','A_TIEMPO','PTS_ASIGNADOS','OBSERVACION','TIMESTAMP']);}
    const rk=lRut(payload.rut||'');
    const meses=Array.isArray(payload.meses)?payload.meses:[];
    const fechaPago=String(payload.fechaPago||'');
    const montoPorMes=Number(payload.montoPorMes)||CUOTA_MONTO;
    const soSheet=ss.getSheetByName(SH_SOCIOS);
    let nombre='';
    if(soSheet){for(const r of soSheet.getDataRange().getValues().slice(1)){if(lRut(r[1]||'')===rk){nombre=String(r[2]||'');break;}}}
    const rows=cuSheet.getLastRow()>1?cuSheet.getDataRange().getValues().slice(1):[];
    const yaExiste=new Set();
    rows.forEach(r=>{if(lRut(r[1]||'')===rk)yaExiste.add(String(r[3]||''));});
    let guardados=0,totalPts=0,omitidos=[];
    meses.forEach(mes=>{
      if(yaExiste.has(mes)){omitidos.push(mes);return;}
      const aTiempo=fechaPago.slice(0,7)<=mes;
      const pts=aTiempo?CUOTA_PTS:0;
      cuSheet.appendRow([cuSheet.getLastRow(),payload.rut||'',nombre,mes,montoPorMes,fechaPago,aTiempo,pts,'',ts()]);
      if(aTiempo&&pts>0){inyectarPuntajeBase({rut:payload.rut||'',anio:2026,puntos:pts,concepto:'Cuota al dia - '+mes,observacion:'Pago '+fechaPago});}
      guardados++;totalPts+=pts;
    });
    return safe({ok:true,guardados,totalPts,omitidos});
  }catch(e){return safe({ok:false,error:e.toString()});}
}

function sincronizarPuntosCuotas(){
  try{
    const ss=getSS();
    const cuSheet=ss.getSheetByName(SH_CUOTAS);
    if(!cuSheet)return safe({ok:false,error:'No existe hoja CUOTAS'});
    const rows=cuSheet.getDataRange().getValues().slice(1);
    let asignados=0;
    rows.forEach(r=>{
      const aTiempo=r[6]===true||String(r[6]).toLowerCase()==='true';
      const pts=Number(r[7]||0);
      const rut=String(r[1]||'');
      const mes=String(r[3]||'');
      if(!aTiempo||pts<=0||!rut||!mes)return;
      inyectarPuntajeBase({rut,anio:2026,puntos:pts,concepto:'Cuota al dia - '+mes,observacion:'Sincronizacion automatica'});
      asignados++;
    });
    SpreadsheetApp.getUi().alert('Listo. '+asignados+' registros de puntos inyectados.');
    return safe({ok:true,asignados});
  }catch(e){return safe({ok:false,error:e.toString()});}
}
/* === ACTUALIZAR DATOS SOCIO (sin key - el socio actualiza sus propios datos) === */
function actualizarDatosSocio(payload){
  try{
    const ss=getSS();
    const sh=ss.getSheetByName('SOCIOS');
    if(!sh)return safe({ok:false,error:'No existe hoja SOCIOS'});
    const rows=sh.getDataRange().getValues();
    const bk=lRut(payload.rut||'');
    for(let i=1;i<rows.length;i++){
      if(lRut(String(rows[i][1]||''))!==bk)continue;
      if(payload.telefono!==undefined)sh.getRange(i+1,4).setValue(payload.telefono||'');
      if(payload.email!==undefined)sh.getRange(i+1,5).setValue(payload.email||'');
      if(payload.direccion!==undefined)sh.getRange(i+1,8).setValue(payload.direccion||'');
      if(payload.fechaNacimiento!==undefined)sh.getRange(i+1,9).setValue(payload.fechaNacimiento||'');
      return safe({ok:true});
    }
    return safe({ok:false,error:'Socio no encontrado'});
  }catch(e){return safe({ok:false,error:e.toString()});}
}

/* === ACTUALIZAR ESTADO SOCIO (solo directiva con key) === */
function actualizarEstadoSocio(payload){
  try{
    const ss=getSS();
    const sh=ss.getSheetByName('SOCIOS');
    if(!sh)return safe({ok:false,error:'No existe hoja SOCIOS'});
    const rows=sh.getDataRange().getValues();
    const bk=lRut(payload.rut||'');
    for(let i=1;i<rows.length;i++){
      if(lRut(String(rows[i][1]||''))!==bk)continue;
      sh.getRange(i+1,6).setValue(payload.estado||'ACTIVO');
      return safe({ok:true});
    }
    return safe({ok:false,error:'Socio no encontrado'});
  }catch(e){return safe({ok:false,error:e.toString()});}
}

function corregirPuntosCuotas(){
  try{
    const ss=getSS();
    const cuSheet=ss.getSheetByName('CUOTAS');
    const bsSheet=ss.getSheetByName(SH_BASE);
    if(!cuSheet){console.log('ERROR: No existe hoja CUOTAS');return;}
    const cuRows=cuSheet.getDataRange().getValues();
    console.log('Filas en CUOTAS: '+cuRows.length);

    for(let i=1;i<=Math.min(3,cuRows.length-1);i++){
      console.log('Fila '+i+': RUT='+cuRows[i][1]+' MES='+cuRows[i][3]+' ATIEMPO='+cuRows[i][6]+' (tipo:'+typeof cuRows[i][6]+') PTS='+cuRows[i][7]);
    }

    let eliminados=0;
    if(bsSheet){
      const bsRows=bsSheet.getDataRange().getValues();
      for(let i=bsRows.length-1;i>=1;i--){
        if(String(bsRows[i][3]||'').includes('Cuota al dia')){
          bsSheet.deleteRow(i+1);eliminados++;
        }
      }
    }
    console.log('Eliminados de PUNTAJE_BASE: '+eliminados);

    let corregidos=0,inyectados=0;
    for(let i=1;i<cuRows.length;i++){
      const aT=cuRows[i][6];
      const aTiempo=aT===true||aT===1||String(aT).toLowerCase()==='true';
      console.log('Fila '+i+' aTiempo='+aTiempo+' valor='+aT);
      if(!aTiempo)continue;
      cuSheet.getRange(i+1,8).setValue(20);
      const rut=String(cuRows[i][1]||'');
      const mes=normMes(cuRows[i][3]||'');
      const fechaPago=normFecha(cuRows[i][5]||'');
      console.log('Inyectando: rut='+rut+' mes='+mes);
      if(rut&&mes){
        inyectarPuntajeBase({rut,anio:2026,puntos:20,concepto:'Cuota al dia - '+mes,observacion:'Pago '+fechaPago});
        inyectados++;
      }
      corregidos++;
    }
    console.log('RESULTADO: '+corregidos+' corregidos · '+inyectados+' inyectados');
  }catch(e){console.log('Error: '+e.toString());}
}
// ═══════════════════════════════════════════════════
// MÓDULO DE ACCESOS — USUARIOS
// ═══════════════════════════════════════════════════

function getSheetUsuarios_() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sh = ss.getSheetByName('USUARIOS');
  if (!sh) {
    sh = ss.insertSheet('USUARIOS');
    sh.appendRow(['ID','USUARIO','PASSWORD','ROL','TIPO','TABS','ACTIVO','NOMBRE_MOSTRAR','TIMESTAMP']);
    sh.getRange(1,1,1,9).setFontWeight('bold').setBackground('#1e293b').setFontColor('white');
    _seedUsuarios_(sh);
  }
  return sh;
}

function _seedUsuarios_(sh) {
  var ts = new Date().toISOString();
  var TABS_ADMIN   = JSON.stringify([0,1,2,3,4,5,6,7,8]);
  var TABS_COM_M2  = JSON.stringify([0,6,1,2]);
  var TABS_COM_M   = JSON.stringify([0,6,1]);
  var TABS_BASE    = JSON.stringify([0,6]);
  [
    [1,'admin',        'so1admin2026','admin',    '',                       TABS_ADMIN, true,'Administrador',ts],
    [2,'directiva',    'dir2026',     'comision', 'comision_directiva',     TABS_COM_M2,true,'Directiva',ts],
    [3,'fenapo',       'fen2026',     'comision', 'comision_fenapo',        TABS_COM_M, true,'FENAPO',ts],
    [4,'jardincito',   'jar2026',     'comision', 'comision_jardincito',    TABS_COM_M, true,'Jardincito',ts],
    [5,'escuelita',    'esc2026',     'comision', 'comision_escuelita',     TABS_COM_M, true,'Escuelita',ts],
    [6,'comprando',    'com2026',     'comision', 'comision_comprando',     TABS_COM_M, true,'Comprando Juntos',ts],
    [7,'reglamento',   'reg2026',     'comision', 'comision_reglamento',    TABS_COM_M, true,'Reglamento Interno',ts],
    [8,'bienestar',    'bie2026',     'comision', 'comision_bienestar',     TABS_COM_M, true,'Bienestar',ts],
    [9,'deportes',     'dep2026',     'comision', 'comision_deportes',      TABS_COM_M, true,'Deportes',ts],
    [10,'comunicaciones','comu2026',  'comision', 'comision_comunicaciones',TABS_COM_M, true,'Comunicaciones',ts],
    [11,'secretaria',  'sec2026',     'comision', 'comision_secretaria',    TABS_COM_M, true,'Secretaría',ts],
    [12,'tesoreria',   'so1teso2026', 'tesoreria','',                       TABS_BASE,  true,'Tesorería',ts],
    [13,'talleres',    'tal2026',     'comision', 'comision_talleres',      TABS_COM_M, true,'Talleres Laborales',ts],
  ].forEach(function(r){ sh.appendRow(r); });
}

function autenticarUsuario(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var usr = String(p.usuario||'').toLowerCase().trim();
    var pwd = String(p.password||'').trim();
    var data = getSheetUsuarios_().getDataRange().getValues();
    for (var i=1; i<data.length; i++) {
      if (String(data[i][1]||'').toLowerCase().trim() !== usr) continue;
      if (!data[i][6]) return {ok:false, error:'Usuario inactivo'};
      if (String(data[i][2]||'').trim() !== pwd) return {ok:false, error:'Credenciales incorrectas'};
      var tabs = [];
      try { tabs = JSON.parse(String(data[i][5]||'[]')); } catch(e){ tabs=[0,6]; }
      return {ok:true, id:data[i][0], rol:String(data[i][3]||'comision'),
              tipo:String(data[i][4]||''), tabs:tabs,
              nombreMostrar:String(data[i][7]||usr)};
    }
    return {ok:false, error:'Usuario no encontrado'};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function obtenerUsuariosAdmin() {
  try {
    var data = getSheetUsuarios_().getDataRange().getValues();
    var list = [];
    for (var i=1; i<data.length; i++) {
      if (!data[i][0]) continue;
      var tabs = [];
      try { tabs = JSON.parse(String(data[i][5]||'[]')); } catch(e){ tabs=[0,6]; }
      list.push({id:data[i][0], usuario:String(data[i][1]||''), rol:String(data[i][3]||''),
                 tipo:String(data[i][4]||''), tabs:tabs, activo:!!data[i][6],
                 nombreMostrar:String(data[i][7]||''), rowNum:i+1});
    }
    return {ok:true, usuarios:list};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function crearUsuarioAdmin(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var sh = getSheetUsuarios_();
    var data = sh.getDataRange().getValues();
    var usr = String(p.usuario||'').toLowerCase().trim();
    if (!usr||!p.password) return {ok:false, error:'Usuario y contraseña requeridos'};
    for (var i=1; i<data.length; i++) {
      if (String(data[i][1]||'').toLowerCase()===usr) return {ok:false, error:'El usuario "'+usr+'" ya existe'};
    }
    var newId = data.length>1?(parseInt(data[data.length-1][0])||0)+1:1;
    var tabs = p.tabs||[0,6];
    sh.appendRow([newId,usr,p.password,p.rol||'comision',p.tipo||'',
                  JSON.stringify(tabs),true,p.nombreMostrar||usr,new Date().toISOString()]);
    return {ok:true, id:newId};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function editarUsuarioAdmin(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var sh = getSheetUsuarios_();
    var data = sh.getDataRange().getValues();
    var id = String(p.id);
    for (var i=1; i<data.length; i++) {
      if (String(data[i][0])!==id) continue;
      var row = i+1;
      if (p.password) sh.getRange(row,3).setValue(p.password);
      sh.getRange(row,4).setValue(p.rol||data[i][3]);
      sh.getRange(row,5).setValue(p.tipo||'');
      sh.getRange(row,6).setValue(JSON.stringify(p.tabs||[0,6]));
      sh.getRange(row,8).setValue(p.nombreMostrar||data[i][7]);
      return {ok:true};
    }
    return {ok:false, error:'Usuario no encontrado'};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function toggleActivoUsuario(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var sh = getSheetUsuarios_();
    var data = sh.getDataRange().getValues();
    var id = String(p.id);
    for (var i=1; i<data.length; i++) {
      if (String(data[i][0])!==id) continue;
      if (String(data[i][1]).toLowerCase()==='admin') return {ok:false,error:'No se puede desactivar el admin'};
      var nuevo = !data[i][6];
      sh.getRange(i+1,7).setValue(nuevo);
      return {ok:true, activo:nuevo};
    }
    return {ok:false, error:'No encontrado'};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function eliminarUsuarioAdmin(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var sh = getSheetUsuarios_();
    var data = sh.getDataRange().getValues();
    var id = String(p.id);
    for (var i=1; i<data.length; i++) {
      if (String(data[i][0])!==id) continue;
      if (String(data[i][1]).toLowerCase()==='admin') return {ok:false,error:'No se puede eliminar al admin'};
      sh.deleteRow(i+1);
      return {ok:true};
    }
    return {ok:false, error:'No encontrado'};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function resetearUsuarios() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sh = ss.getSheetByName('USUARIOS');
  if(sh) ss.deleteSheet(sh);
  getSheetUsuarios_();
}

// ═══ FLUJO PENDIENTES COMISIONES ═══

function iniciarEventoPendiente(payload) {
  try {
    var ss  = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    if (!evSheet) return { ok: false, error: 'No existe hoja EVENTOS' };

    var infoUsrIEP = _rolYTipoDeUsuario(payload.creadoPor);
    var TIPOS_OBL_IEP = ['reunion_presencial','reunion_online','marcha'];
    if (infoUsrIEP.rol !== 'admin' && TIPOS_OBL_IEP.indexOf(payload.tipo||'reunion_presencial') >= 0) {
      return { ok:false, error:'Tu cuenta no puede crear reuniones obligatorias (Presencial/MEET/Marcha) — solo el administrador.' };
    }

    var newId = _nextEventoId(evSheet);

    var now = new Date();
    var ts  = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd-MM-yyyy, HH:mm:ss');

    evSheet.appendRow([
      newId,
      payload.nombre    || '',
      payload.tipo      || 'reunion_presencial',
      payload.fecha     || '',
      payload.ptsCompleto || 20,
      payload.ptsParcial  || 10,
      ts,
      payload.horaInicio  || '',
      payload.horaTermino || '',
      payload.creadoPor   || 'comision',
      'PENDIENTE_ABIERTO'
    ]);

    var key = 'EVENTO_ACTIVO_' + (payload.creadoPor || 'comision');
    var datos = {
      evId:        newId,
      nombre:      payload.nombre      || '',
      fecha:       payload.fecha       || '',
      tipo:        payload.tipo        || 'reunion_presencial',
      horaInicio:  payload.horaInicio  || '',
      horaTermino: payload.horaTermino || '',
      ptsCompleto: payload.ptsCompleto  || 20,
      ptsParcial:  payload.ptsParcial   || 10,
      creadoPor:   payload.creadoPor    || 'comision',
      pendiente:   true
    };
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(datos));

    Logger.log('iniciarEventoPendiente OK evId=' + newId + ' key=' + key);
    return { ok: true, evId: newId };
  } catch (e) {
    return { ok: false, error: e.toString() };
  }
}
function obtenerPendientesAdmin() {
  try {
    var ss      = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    var pbSheet = ss.getSheetByName(SH_BASE);
    var soSheet = ss.getSheetByName(SH_SOCIOS);

    var eventos = [], puntajes = [], lotes = [];

    var nombrePorRut = {};
    if (soSheet) {
      soSheet.getDataRange().getValues().slice(1).forEach(function(f){
        var rk = lRut(String(f[1] || ''));
        if (rk) nombrePorRut[rk] = String(f[2] || '');
      });
    }

    if (evSheet) {
      var evRows = evSheet.getDataRange().getValues();
      var asRows = asSheet ? asSheet.getDataRange().getValues() : [];
      var conteoPorEv = {};
      for (var k = 1; k < asRows.length; k++) {
        var evIdK = String(asRows[k][1] || '');
        if (!evIdK) continue;
        if (!conteoPorEv[evIdK]) conteoPorEv[evIdK] = { presentes:0, parciales:0, total:0 };
        conteoPorEv[evIdK].total++;
        var ta = String(asRows[k][3] || '');
        if (ta === 'PRESENTE' || ta === 'REPRESENTADO') conteoPorEv[evIdK].presentes++;
        else if (ta === 'PARCIAL') conteoPorEv[evIdK].parciales++;
      }
      evRows.slice(1).forEach(function(r) {
        var estado = String(r[10] || '');
        if (estado !== 'PENDIENTE') return;
        var evId = r[0];
        var c = conteoPorEv[String(evId)] || { presentes:0, parciales:0, total:0 };
        eventos.push({
          evId:        evId,
          nombre:      String(r[1] || ''),
          tipo:        String(r[2] || ''),
          fecha:       normFecha(r[3] || ''),
          creadoPor:   String(r[9] || ''),
          ptsCompleto: Number(r[4] || 20),
          ptsParcial:  Number(r[5] || 10),
          totalMarcas: c.total,
          presentes:   c.presentes,
          parciales:   c.parciales
        });
      });
    }

    if (pbSheet) {
      var pbRows = pbSheet.getDataRange().getValues();
      var lotesMap = {};
      for (var i = 1; i < pbRows.length; i++) {
        var r = pbRows[i];
        var estado = String(r[7] || '');
        if (estado.indexOf('PENDIENTE') !== 0) continue;

        var rutRaw = String(r[1] || '');
        var rk     = lRut(rutRaw);
        var ano    = String(r[2] || '');
        var concepto = String(r[3] || '');
        var puntos = Number(r[4] || 0);
        var rowNum = i + 1;

        var loteMatch = estado.match(/lote:([^|]+)/);
        var creadoMatch = estado.match(/creadoPor:([^|]+)/);
        var creadoPor = creadoMatch ? creadoMatch[1] : '';

        if (loteMatch) {
          var loteId = loteMatch[1];
          if (!lotesMap[loteId]) {
            lotesMap[loteId] = {loteId:loteId, concepto:concepto, puntos:puntos,
                                ano:ano, creadoPor:creadoPor, socios:[], totalPts:0, rowNums:[]};
          }
          lotesMap[loteId].socios.push({rut:rutRaw, nombre:nombrePorRut[rk] || rutRaw});
          lotesMap[loteId].totalPts += puntos;
          lotesMap[loteId].rowNums.push(rowNum);
        } else {
          puntajes.push({
            rowNum:      rowNum,
            rut:         rutRaw,
            nombreSocio: nombrePorRut[rk] || rutRaw,
            ano:         ano,
            concepto:    concepto,
            puntos:      puntos,
            creadoPor:   creadoPor,
            obs:         String(r[5] || '')
          });
        }
      }
      lotes = Object.keys(lotesMap).map(function(k){ return lotesMap[k]; });
    }

    return safe({ ok: true, eventos: eventos, puntajes: puntajes, lotes: lotes });
  } catch (e) {
    return safe({ ok: true, eventos: [], puntajes: [], lotes: [], error: e.toString() });
  }
}

function aprobarEventoPendiente(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var evId = String(p.evId);
    var ss = SpreadsheetApp.openById(SS_ID);
    var shEv = ss.getSheetByName(SH_EVENTOS);
    var shAs = ss.getSheetByName(SH_ASIST);

    var ptsC = 20, ptsP = 10, encontrado = false;
    var evData = shEv.getDataRange().getValues();
    for (var i = 1; i < evData.length; i++) {
      if (String(evData[i][0]) === evId) {
        ptsC = Number(evData[i][4]) || 20;
        ptsP = Number(evData[i][5]) || 10;
        shEv.getRange(i + 1, 11).setValue('APROBADO');
        encontrado = true;
        break;
      }
    }
    if (!encontrado) return {ok:false, error:'Evento no encontrado: '+evId};

    if (shAs) {
      var asData = shAs.getDataRange().getValues();
      for (var j = 1; j < asData.length; j++) {
        if (String(asData[j][1]) !== evId) continue;
        var ta = String(asData[j][3] || '');
        var obsRow = String(asData[j][7] || '');
        var sinParticipacion = obsRow.indexOf('Sin participación') >= 0;
        var pts = 0;
        if (!sinParticipacion) {
          if (ta === 'PRESENTE' || ta === 'REPRESENTADO') pts = ptsC;
          else if (ta === 'PARCIAL') pts = ptsP;
        }
        shAs.getRange(j + 1, 5).setValue(pts);
      }
    }
    return {ok:true};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function rechazarEventoPendiente(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var evId = String(p.evId);
    var ss = SpreadsheetApp.openById(SS_ID);
    var shEv = ss.getSheetByName(SH_EVENTOS);
    var shAs = ss.getSheetByName(SH_ASIST);
    var evData = shEv.getDataRange().getValues();
    for(var i=evData.length-1;i>=1;i--){
      if(String(evData[i][0])===evId){ shEv.deleteRow(i+1); break; }
    }
    var asData = shAs.getDataRange().getValues();
    for(var i=asData.length-1;i>=1;i--){
      if(String(asData[i][1])===evId) shAs.deleteRow(i+1);
    }
    return {ok:true};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function aprobarPuntajePendiente(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var sh = getSS().getSheetByName(SH_BASE);
    if(!sh) return {ok:false, error:'Hoja no encontrada'};
    sh.getRange(Number(p.rowNum), 8).setValue('');
    return {ok:true};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function rechazarPuntajePendiente(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var sh = getSS().getSheetByName(SH_BASE);
    if(!sh) return {ok:false, error:'Hoja no encontrada'};
    sh.deleteRow(Number(p.rowNum));
    return {ok:true};
  } catch(e){ return {ok:false, error:e.toString()}; }
}
function testPendientes() {
  var shEv = getSS().getSheetByName(SH_EVENTOS);
  if(!shEv){Logger.log('NO EXISTE hoja EVENTOS');return;}
  var rows = shEv.getDataRange().getValues();
  Logger.log('Total filas EVENTOS: '+rows.length);
  for(var i=1;i<rows.length;i++){
    Logger.log('Fila '+i+': NOTAS='+rows[i][7]+' | NOMBRE='+rows[i][1]);
  }
}

// ═══ LOTES DE PUNTAJE BASE ═══

function inyectarLoteBase(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var ss = getSS();
    var sheet = ss.getSheetByName(SH_BASE);
    if(!sheet){
      sheet = ss.insertSheet(SH_BASE);
      sheet.appendRow(['ID','RUT','AÑO','CONCEPTO','PUNTOS','OBSERVACION','TIMESTAMP','ESTADO']);
    }
    var loteId = p.loteId || Date.now().toString(36);
    var concepto = p.concepto||'';
    var puntos = Number(p.puntos)||0;
    var anio = String(p.anio||'2026');
    var creadoPor = p.creadoPor||'comision';
    var estado = p.pendiente ? ('PENDIENTE|lote:'+loteId+'|creadoPor:'+creadoPor) : '';
    var socios = p.socios||[];
    var count = 0;
    socios.forEach(function(s){
      var newId = sheet.getLastRow();
      sheet.appendRow([newId, lRut(s.rut||''), anio, concepto, puntos, '', ts(), estado]);
      count++;
    });
    return {ok:true, count:count, loteId:loteId};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function aprobarLoteBase(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var loteId = String(p.loteId);
    var sh = getSS().getSheetByName(SH_BASE);
    if(!sh) return {ok:false, error:'Hoja no encontrada'};
    var data = sh.getDataRange().getValues();
    var count = 0;
    for(var i=1;i<data.length;i++){
      var est = String(data[i][7]||'');
      if(est.indexOf('PENDIENTE')===0 && est.indexOf('lote:'+loteId)>=0){
        sh.getRange(i+1,8).setValue('');
        count++;
      }
    }
    return {ok:true, count:count};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function rechazarLoteBase(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var loteId = String(p.loteId);
    var sh = getSS().getSheetByName(SH_BASE);
    if(!sh) return {ok:false, error:'Hoja no encontrada'};
    var data = sh.getDataRange().getValues();
    for(var i=data.length-1;i>=1;i--){
      var est = String(data[i][7]||'');
      if(est.indexOf('PENDIENTE')===0 && est.indexOf('lote:'+loteId)>=0){
        sh.deleteRow(i+1);
      }
    }
    return {ok:true};
  } catch(e){ return {ok:false, error:e.toString()}; }
}
function generarFaltasRetroactivas() {
  var EVENTO_ID  = 35;
  var EVENTO_NOM = 'Reunion MEET Mayo';
  var EVENTO_FEC = '23-05-2026';
  var EVENTO_TIP = 'reunion_online';

  var ss   = SpreadsheetApp.openById(SS_ID);
  var shAs = ss.getSheetByName('ASISTENCIAS');
  var shSo = ss.getSheetByName('SOCIOS');
  if(!shAs || !shSo){ Logger.log('ERROR: hojas no encontradas'); return; }

  var asRows  = shAs.getDataRange().getValues();
  var marcados = {};
  for(var j=1; j<asRows.length; j++){
    if(String(asRows[j][1]) === String(EVENTO_ID)){
      var rk = lRut(String(asRows[j][2]||''));
      if(rk) marcados[rk] = true;
    }
  }

  var soRows  = shSo.getDataRange().getValues();
  var nuevas  = [];
  var ahora   = ts();
  var baseId  = shAs.getLastRow();

  for(var k=1; k<soRows.length; k++){
    var est = String(soRows[k][5]||'').toUpperCase().trim();
    if(est !== 'ACTIVO' && est !== 'CONDICIONAL') continue;
    var rutLimpio = lRut(String(soRows[k][1]||''));
    if(!rutLimpio || marcados[rutLimpio]) continue;

    nuevas.push([
      baseId + nuevas.length + 1,
      EVENTO_ID,
      soRows[k][1]||'',
      'FALTA',
      0,
      '', '',
      'Falta retroactiva',
      ahora,
      EVENTO_NOM,
      EVENTO_FEC,
      EVENTO_TIP
    ]);
  }

  if(nuevas.length > 0){
    shAs.getRange(shAs.getLastRow()+1, 1, nuevas.length, 12).setValues(nuevas);
  }

  Logger.log('FALTAs generadas: ' + nuevas.length + ' de ' + (soRows.length-1) + ' socios');
  SpreadsheetApp.getUi().alert('Listo: ' + nuevas.length + ' FALTAs generadas para ' + EVENTO_NOM);
}

function obtenerResumenAnualCuotas(payload) {
  var anio = String((payload&&payload.anio)||'2026');
  try {
    var ss   = SpreadsheetApp.openById(SS_ID);
    var shSo = ss.getSheetByName(SH_SOCIOS);
    var shCu = ss.getSheetByName('CUOTAS');
    if(!shSo) return {ok:false,error:'Sin hoja SOCIOS'};

    var socios = shSo.getDataRange().getValues().slice(1)
      .filter(function(r){return r[0];})
      .map(function(r){return {id:r[0],rut:String(r[1]||''),nombre:String(r[2]||''),rutLimpio:lRut(String(r[1]||'')),estado:String(r[5]||'ACTIVO')};});

    var cuMap = {};
    if(shCu){
      shCu.getDataRange().getValues().slice(1).forEach(function(r){
        var mes = normMes(r[3]);
        if(!mes) return;
        var partes = mes.split('-');
        if(partes.length===2) mes = partes[0]+'-'+('0'+partes[1]).slice(-2);
        if(!mes.startsWith(anio)) return;
        var rk = lRut(String(r[1]||''));
        if(!rk) return;
        var fp = normFecha(r[5]);
        var at = fp ? (fp.slice(0,7) <= mes) : parseBool(r[6]);
        cuMap[rk+'|'+mes] = {
          aTiempo: at,
          pts:     at ? 20 : 0,
          monto:   Number(r[4]||0)
        };
      });
    }

    var meses=[]; for(var m=1;m<=12;m++) meses.push(anio+'-'+String(m).padStart(2,'0'));

    var resultado = socios.map(function(s){
      var pagos={};
      meses.forEach(function(mes){
        var c=cuMap[s.rutLimpio+'|'+mes];
        pagos[mes]=c?(c.aTiempo?'aldia':'tardio'):'pendiente';
      });
      var aldiaCount  = meses.filter(function(m){return pagos[m]==='aldia';}).length;
      var tardioCount = meses.filter(function(m){return pagos[m]==='tardio';}).length;
      return {id:s.id,rut:s.rut,nombre:s.nombre,estado:s.estado,pagos:pagos,aldia:aldiaCount,tardio:tardioCount};
    });

    return {ok:true, socios:resultado};
  } catch(e){ return {ok:false,error:e.toString()}; }
}

function sincronizarCuotas2026() {
  try {
    var ss = getSS();
    var cuSheet = ss.getSheetByName('CUOTAS');
    var bsSheet = ss.getSheetByName(SH_BASE);
    if(!cuSheet){ SpreadsheetApp.getUi().alert('Error: No existe hoja CUOTAS'); return; }

    var yaExiste = new Set();
    if(bsSheet){
      bsSheet.getDataRange().getValues().slice(1).forEach(function(r){
        var concepto = String(r[3]||'');
        var anio     = String(r[2]||'');
        if(anio === '2026' && concepto.indexOf('Cuota al dia - 2026') === 0){
          var mes = concepto.replace('Cuota al dia - ','').trim();
          yaExiste.add(lRut(String(r[1]||''))+'|'+mes);
        }
      });
    }
    Logger.log('Entradas 2026 ya en PUNTAJE_BASE: '+yaExiste.size);

    var inyectados = 0, omitidos = 0, tardios = 0;
    cuSheet.getDataRange().getValues().slice(1).forEach(function(r){
      var rut = String(r[1]||'').trim();
      var mes = normMes(r[3]);
      if(!rut || !mes || !mes.startsWith('2026')) return;

      var fp      = normFecha(r[5]);
      var aTiempo = fp ? (fp.slice(0,7) <= mes) : parseBool(r[6]);

      if(!aTiempo){ tardios++; return; }

      var key = lRut(rut)+'|'+mes;
      if(yaExiste.has(key)){ omitidos++; return; }

      inyectarPuntajeBase({
        rut:         rut,
        anio:        '2026',
        puntos:      20,
        concepto:    'Cuota al dia - '+mes,
        observacion: 'Sincronizado desde CUOTAS (pago '+fp+')'
      });
      yaExiste.add(key);
      inyectados++;
    });

    var msg = '✓ Cuotas 2026 sincronizadas:\n'
            + '  Inyectados:   '+inyectados+' registros (+'+(inyectados*20)+' pts)\n'
            + '  Ya existían:  '+omitidos+'\n'
            + '  Tardíos (0pts): '+tardios;
    Logger.log(msg);
    SpreadsheetApp.getUi().alert(msg);
    return {ok:true, inyectados:inyectados};

  } catch(e){
    SpreadsheetApp.getUi().alert('Error: '+e.toString());
    return {ok:false, error:e.toString()};
  }
}

function editarAsistencia(payload) {
  try {
    var ss = getSS();
    var asSheet = ss.getSheetByName(SH_ASIST);
    var bsSheet = ss.getSheetByName(SH_BASE);
    if(!asSheet) return {ok:false, error:'Hoja ASISTENCIAS no encontrada'};

    var rk        = lRut(String(payload.rut||''));
    var evento    = String(payload.evento||'').trim();
    var fechaPay  = String(payload.fecha||'').slice(0,10);
    var nuevoTipo = String(payload.nuevoTipo||'');
    var nuevoPts  = Number(payload.nuevoPts||0);
    var ptsAntes  = Number(payload.puntajeAnterior||0);

    var rows = asSheet.getDataRange().getValues();
    var rowNum = -1;

    for(var i=1; i<rows.length; i++){
      if(lRut(String(rows[i][2]||''))===rk && String(rows[i][9]||'').trim()===evento){
        rowNum = i+1; break;
      }
    }

    if(rowNum < 0 && fechaPay){
      for(var i=1; i<rows.length; i++){
        var fFila = String(rows[i][10]||'');
        if(fFila.indexOf('T')>0) fFila=fFila.slice(0,10);
        if(/^\d{2}-\d{2}-\d{4}$/.test(fFila)){var p=fFila.split('-');fFila=p[2]+'-'+p[1]+'-'+p[0];}
        if(lRut(String(rows[i][2]||''))===rk && fFila===fechaPay){
          rowNum = i+1; break;
        }
      }
    }

    if(rowNum < 0) return {ok:false, error:'No encontrada. RUT:'+rk+' Evento:'+evento};

    asSheet.getRange(rowNum, 4).setValue(nuevoTipo);
    asSheet.getRange(rowNum, 5).setValue(nuevoPts);
    asSheet.getRange(rowNum, 9).setValue(ts()+' (editado)');

    var diff = nuevoPts - ptsAntes;
    if(diff !== 0 && bsSheet){
      var concepto = 'Corrección asistencia: '+evento;
      var bsRows = bsSheet.getDataRange().getValues();
      for(var j=bsRows.length-1; j>=1; j--){
        if(lRut(String(bsRows[j][1]||''))===rk && String(bsRows[j][3]||'').indexOf(concepto)===0){
          bsSheet.deleteRow(j+1); break;
        }
      }
      if(nuevoPts > 0){
        inyectarPuntajeBase({
          rut: payload.rut, anio:'2026', puntos:nuevoPts,
          concepto: concepto,
          observacion:'Admin editó '+ts()+': '+payload.tipoAsistenciaAnterior+' '+ptsAntes+'pts → '+nuevoTipo+' '+nuevoPts+'pts'
        });
      }
    }
    return {ok:true};
  } catch(e){
    Logger.log('editarAsistencia ERROR: '+e.toString());
    return {ok:false, error:e.toString()};
  }
}

function eliminarAsistencia(payload) {
  try {
    var ss = getSS();
    var asSheet = ss.getSheetByName(SH_ASIST);
    if(!asSheet) return {ok:false, error:'Hoja ASISTENCIAS no encontrada'};

    var rk     = lRut(String(payload.rut||''));
    var evento = String(payload.evento||'').trim();
    var fechaPay = String(payload.fecha||'').slice(0,10);

    var rows = asSheet.getDataRange().getValues();
    var rowNum = -1;

    for(var i=1; i<rows.length; i++){
      if(lRut(String(rows[i][2]||''))===rk && String(rows[i][9]||'').trim()===evento){
        rowNum = i+1; break;
      }
    }
    if(rowNum < 0 && fechaPay){
      for(var i=1; i<rows.length; i++){
        var fFila = String(rows[i][10]||'');
        if(fFila.indexOf('T')>0) fFila=fFila.slice(0,10);
        if(/^\d{2}-\d{2}-\d{4}$/.test(fFila)){var p=fFila.split('-');fFila=p[2]+'-'+p[1]+'-'+p[0];}
        if(lRut(String(rows[i][2]||''))===rk && fFila===fechaPay){
          rowNum = i+1; break;
        }
      }
    }

    if(rowNum < 0) return {ok:false, error:'Asistencia no encontrada'};
    asSheet.deleteRow(rowNum);
    return {ok:true};
  } catch(e){
    Logger.log('eliminarAsistencia ERROR: '+e.toString());
    return {ok:false, error:e.toString()};
  }
}

function actualizarObservacionAsistencia(payload) {
  try {
    var ss = getSS();
    var asSheet = ss.getSheetByName(SH_ASIST);
    if(!asSheet) return {ok:false};
    var rk     = lRut(String(payload.rut||''));
    var evento = String(payload.evento||'').trim();
    var obs    = String(payload.observacion||'');
    var rows   = asSheet.getDataRange().getValues();
    for(var i=1; i<rows.length; i++){
      if(lRut(String(rows[i][2]||''))===rk && String(rows[i][9]||'').trim()===evento){
        asSheet.getRange(i+1, 8).setValue(obs);
        Logger.log('observacion actualizada fila '+(i+1)+': '+obs);
        return {ok:true};
      }
    }
    return {ok:false, error:'No encontrada'};
  } catch(e){ return {ok:false, error:e.toString()}; }
}

function eliminarMovimiento(payload) {
  try {
    var mvSheet = getSS().getSheetByName(SH_MOVIMIENTOS);
    if(!mvSheet) return {ok:false, error:'No existe hoja MOVIMIENTOS'};
    var tipo  = String(payload.tipo||'');
    var conc  = String(payload.concepto||'').trim();
    var fecha = String(payload.fecha||'').slice(0,10);
    var monto = Number(payload.monto||0);
    var rows  = mvSheet.getDataRange().getValues();
    for(var i = rows.length-1; i >= 1; i--){
      if(String(rows[i][1]||'') === tipo &&
         String(rows[i][2]||'').trim() === conc &&
         normFecha(rows[i][4]||'').slice(0,10) === fecha &&
         Number(rows[i][3]||0) === monto){
        mvSheet.deleteRow(i+1);
        return {ok:true};
      }
    }
    return {ok:false, error:'Registro no encontrado en MOVIMIENTOS'};
  } catch(e){ return {ok:false, error:e.toString()}; }
}
function actualizarSocio(payload) {
  try {
    var ss = getSS();
    var sh = ss.getSheetByName(SH_SOCIOS);
    var rows = sh.getDataRange().getValues();
    var rutBuscar = String(payload.rutActual || payload.rut || '');
    var rk = lRut(rutBuscar);
    var rowIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (lRut(String(rows[i][1]||'')) === rk) { rowIdx = i; break; }
    }
    if (rowIdx < 0) return safe({ ok:false, error:'Socio no encontrado' });

    var nuevoRut  = String(payload.nuevoRut || payload.rut || '').trim();
    var cambiaRut = nuevoRut && lRut(nuevoRut) !== rk;

    if (cambiaRut) {
      for (var j = 1; j < rows.length; j++) {
        if (j===rowIdx) continue;
        if (lRut(String(rows[j][1]||'')) === lRut(nuevoRut)) {
          return safe({ ok:false, error:'El RUT '+nuevoRut+' ya pertenece a otro socio ('+rows[j][2]+')' });
        }
      }
    }

    if (payload.nuevoId)         sh.getRange(rowIdx+1,1).setValue(payload.nuevoId);
    if (cambiaRut)               sh.getRange(rowIdx+1,2).setValue(nuevoRut);
    if (payload.nombre)          sh.getRange(rowIdx+1,3).setValue(payload.nombre);
    sh.getRange(rowIdx+1,4).setValue(payload.telefono || '');
    sh.getRange(rowIdx+1,5).setValue(payload.email    || '');
    if (payload.fechaIngreso)    sh.getRange(rowIdx+1,7).setValue(payload.fechaIngreso);
    if (payload.direccion !== undefined) sh.getRange(rowIdx+1,8).setValue(payload.direccion);
    if (payload.fechaNacimiento) sh.getRange(rowIdx+1,9).setValue(payload.fechaNacimiento);

    var filasActualizadas = 0;
    if (cambiaRut) {
      var hojas = [
        { sh: ss.getSheetByName(SH_ASIST), col: 3 },
        { sh: ss.getSheetByName(SH_BASE),  col: 2 },
        { sh: ss.getSheetByName('CUOTAS'), col: 2 }
      ];
      hojas.forEach(function(h){
        if (!h.sh) return;
        var lastRow = h.sh.getLastRow();
        if (lastRow < 2) return;
        var range = h.sh.getRange(2, h.col, lastRow-1, 1);
        var vals  = range.getValues();
        var cambiado = false;
        for (var k=0; k<vals.length; k++){
          if (lRut(String(vals[k][0]||'')) === rk) { vals[k][0] = nuevoRut; cambiado = true; filasActualizadas++; }
        }
        if (cambiado) range.setValues(vals);
      });
    }

    return safe({ ok:true, cambioRut:cambiaRut, filasActualizadas:filasActualizadas });
  } catch(e) { return safe({ ok: false, error: e.toString() }); }
}

function eliminarSocio(payload) {
  try {
    var ss = getSS();
    var sh = ss.getSheetByName(SH_SOCIOS);
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (lRut(String(rows[i][1]||'')) === lRut(String(payload.rut||''))) {
        var fila = rows[i].slice();
        var elimSheet = ss.getSheetByName('SOCIOS_ELIMINADOS');
        if (!elimSheet) {
          elimSheet = ss.insertSheet('SOCIOS_ELIMINADOS');
          elimSheet.appendRow(['ID','RUT','NOMBRE','TELEFONO','EMAIL','ESTADO','FECHA_INGRESO','DIRECCION','FECHA_NACIMIENTO','FECHA_ELIMINACION','MOTIVO']);
        }
        elimSheet.appendRow(fila.concat([ts(), String(payload.motivo||'')]));
        sh.deleteRow(i+1);
        _reordenarSociosPorNombre();
        return safe({ ok:true, movidoAEliminados:true });
      }
    }
    return safe({ ok:false, error:'Socio no encontrado' });
  } catch(e) { return safe({ ok:false, error:e.toString() }); }
}

function obtenerTodosLosSocios() {
  try {
    var rows = getSS().getSheetByName(SH_SOCIOS).getDataRange().getValues();
    var socios = rows.slice(1).filter(function(r){ return r[0]; }).map(function(r){
      return {
        id:              r[0],
        rut:             r[1] || '',
        nombre:          r[2] || '',
        telefono:        r[3] || '',
        email:           r[4] || '',
        estado:          r[5] || 'ACTIVO',
        fechaIngreso:    r[6] || '',
        direccion:       r[7] || '',
        fechaNacimiento: r[8] || '',
        fotoUrl:         r[9] || ''
      };
    });
    return safe({ socios: socios });
  } catch(e) { return safe({ socios: [], error: e.toString() }); }
}

function crearSocio(payload) {
  try {
    var sh   = getSS().getSheetByName(SH_SOCIOS);
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (lRut(String(rows[i][1]||'')) === lRut(String(payload.rut||'')))
        return safe({ ok: false, error: 'El RUT ya existe en el sistema' });
    }
    if (!payload.forzar) {
      var maxSocios = Number(getConfigValor('max_socios', 160)) || 160;
      var activos = 0;
      for (var k=1; k<rows.length; k++){
        var est = String(rows[k][5]||'').toUpperCase();
        if (rows[k][0] && (est==='ACTIVO'||est==='CONDICIONAL')) activos++;
      }
      var estadoNuevo = String(payload.estado||'ACTIVO').toUpperCase();
      if ((estadoNuevo==='ACTIVO'||estadoNuevo==='CONDICIONAL') && activos>=maxSocios) {
        return safe({ ok:false, error:'Se alcanzó el tope de '+maxSocios+' socios activos.', topeAlcanzado:true });
      }
    }
    var id = payload.id || rows.length;
    sh.appendRow([
      id,
      payload.rut             || '',
      payload.nombre          || '',
      payload.telefono        || '',
      payload.email           || '',
      payload.estado          || 'ACTIVO',
      payload.fechaIngreso    || '',
      payload.direccion       || '',
      payload.fechaNacimiento || ''
    ]);
    _reordenarSociosPorNombre();
    return safe({ ok: true, nuevoId: id });
  } catch(e) { return safe({ ok: false, error: e.toString() }); }
}

function cambiarEstadoSocio(payload) {
  try {
    var sh   = getSS().getSheetByName(SH_SOCIOS);
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (lRut(String(rows[i][1]||'')) === lRut(String(payload.rut||''))) {
        sh.getRange(i+1,6).setValue(payload.estado || 'INACTIVO');
        return safe({ ok: true });
      }
    }
    return safe({ ok: false, error: 'Socio no encontrado' });
  } catch(e) { return safe({ ok: false, error: e.toString() }); }
}

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE EVENTOS POR COMISIÓN
// ═══════════════════════════════════════════════════════════════

function obtenerEventosDeComision(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var usuario = String(p.usuario||'').trim();
    var esAdmin = String(p.rol||'')==='admin';
    var ss = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    if(!evSheet) return safe({ok:true, eventos:[]});

    var asRows = asSheet ? asSheet.getDataRange().getValues().slice(1) : [];
    var marcasPorEv = {};
    asRows.forEach(function(a){
      var eid = String(a[1]||'');
      if(!eid) return;
      marcasPorEv[eid] = (marcasPorEv[eid]||0) + 1;
    });

    var rows = evSheet.getDataRange().getValues();
    var eventos = [];
    for(var i=1; i<rows.length; i++){
      var r = rows[i];
      var creadoPor = String(r[9]||'').trim();
      var estado    = String(r[10]||'').trim();
      if(!esAdmin && creadoPor.toLowerCase() !== usuario.toLowerCase()) continue;
      eventos.push({
        evId:        r[0],
        nombre:      String(r[1]||''),
        tipo:        String(r[2]||''),
        fecha:       normFecha(r[3]||''),
        ptsCompleto: Number(r[4]||20),
        ptsParcial:  Number(r[5]||10),
        creadoPor:   creadoPor,
        estado:      estado || '(sin estado)',
        marcas:      marcasPorEv[String(r[0])]||0
      });
    }
    eventos.sort(function(a,b){ return Number(b.evId)-Number(a.evId); });
    return safe({ok:true, eventos:eventos});
  } catch(e){ return safe({ok:false, error:e.toString()}); }
}

function reabrirEventoComision(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var evId    = String(p.evId||'');
    var usuario = String(p.usuario||'').trim();
    var esAdmin = String(p.rol||'')==='admin';
    var ss = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    if(!evSheet) return safe({ok:false, error:'No existe hoja EVENTOS'});

    var rows = evSheet.getDataRange().getValues();
    for(var i=1; i<rows.length; i++){
      if(String(rows[i][0])!==evId) continue;
      var creadoPor = String(rows[i][9]||'').trim();
      if(!esAdmin && creadoPor.toLowerCase() !== usuario.toLowerCase())
        return safe({ok:false, error:'No autorizado: este evento no es tuyo'});

      var estado = String(rows[i][10]||'').trim();
      if(!esAdmin && estado==='APROBADO')
        return safe({ok:false, error:'Esta reunión ya fue aprobada, solo el admin puede reabrirla'});
      evSheet.getRange(i+1, 11).setValue('PENDIENTE_ABIERTO');

      var datos = {
        evId:        rows[i][0],
        nombre:      String(rows[i][1]||''),
        fecha:       String(rows[i][3]||''),
        tipo:        String(rows[i][2]||''),
        horaInicio:  String(rows[i][8]||''),
        horaTermino: '',
        ptsCompleto: Number(rows[i][4]||20),
        ptsParcial:  Number(rows[i][5]||10),
        creadoPor:   creadoPor || usuario,
        pendiente:   true
      };
      var key = 'EVENTO_ACTIVO_' + (creadoPor || usuario);
      PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(datos));
      return safe({ok:true, evento:datos});
    }
    return safe({ok:false, error:'Evento no encontrado'});
  } catch(e){ return safe({ok:false, error:e.toString()}); }
}
// Edita datos básicos del evento (nombre, fecha, tipo, puntos)
function editarEventoComision(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var evId    = String(p.evId||'');
    var usuario = String(p.usuario||'').trim();
    var esAdmin = String(p.rol||'')==='admin';
    var ss = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    if(!evSheet) return safe({ok:false, error:'No existe hoja EVENTOS'});

    var rows = evSheet.getDataRange().getValues();
    for(var i=1; i<rows.length; i++){
      if(String(rows[i][0])!==evId) continue;
      var creadoPor = String(rows[i][9]||'').trim();
      if(!esAdmin && creadoPor.toLowerCase() !== usuario.toLowerCase())
        return safe({ok:false, error:'No autorizado: este evento no es tuyo'});
      var estadoActualEv = String(rows[i][10]||'').trim();
      if(!esAdmin && estadoActualEv==='APROBADO')
        return safe({ok:false, error:'Esta reunión ya fue aprobada, solo el admin puede modificarla'});

      var nombreAnt = String(rows[i][1]||'');
      var nuevoNombre = p.nombre!==undefined ? String(p.nombre) : nombreAnt;
      var nuevaFecha  = p.fecha!==undefined ? String(p.fecha) : String(rows[i][3]||'');
      var nuevoTipo   = p.tipo!==undefined ? String(p.tipo) : String(rows[i][2]||'');
      var nuevoC      = p.ptsCompleto!==undefined ? Number(p.ptsCompleto) : Number(rows[i][4]||20);
      var nuevoP      = p.ptsParcial!==undefined ? Number(p.ptsParcial) : Number(rows[i][5]||10);

      evSheet.getRange(i+1, 2).setValue(nuevoNombre);
      evSheet.getRange(i+1, 3).setValue(nuevoTipo);
      evSheet.getRange(i+1, 4).setValue(fmtFecha(nuevaFecha));
      evSheet.getRange(i+1, 5).setValue(nuevoC);
      evSheet.getRange(i+1, 6).setValue(nuevoP);

      if(asSheet){
        var aRows = asSheet.getDataRange().getValues();
        for(var j=1; j<aRows.length; j++){
          if(String(aRows[j][1])===evId){
            asSheet.getRange(j+1, 10).setValue(nuevoNombre);
            asSheet.getRange(j+1, 11).setValue(fmtFecha(nuevaFecha));
            asSheet.getRange(j+1, 12).setValue(nuevoTipo);
          }
        }
      }
      return safe({ok:true});
    }
    return safe({ok:false, error:'Evento no encontrado'});
  } catch(e){ return safe({ok:false, error:e.toString()}); }
}

function eliminarEventoComision(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var evId    = String(p.evId||'');
    var usuario = String(p.usuario||'').trim();
    var esAdmin = String(p.rol||'')==='admin';
    var ss = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    if(!evSheet) return safe({ok:false, error:'No existe hoja EVENTOS'});

    var rows = evSheet.getDataRange().getValues();
    var filaEv = -1, creadoPor = '', estadoEv = '';
    for(var i=1; i<rows.length; i++){
      if(String(rows[i][0])===evId){ filaEv=i+1; creadoPor=String(rows[i][9]||'').trim(); estadoEv=String(rows[i][10]||'').trim(); break; }
    }
    if(filaEv<0) return safe({ok:false, error:'Evento no encontrado'});
    if(!esAdmin && creadoPor.toLowerCase() !== usuario.toLowerCase())
      return safe({ok:false, error:'No autorizado: este evento no es tuyo'});
    if(!esAdmin && estadoEv==='APROBADO')
      return safe({ok:false, error:'Esta reunión ya fue aprobada, solo el admin puede eliminarla'});

    var borradas = 0;
    if(asSheet){
      var aRows = asSheet.getDataRange().getValues();
      for(var k=aRows.length-1; k>=1; k--){
        if(String(aRows[k][1])===evId){ asSheet.deleteRow(k+1); borradas++; }
      }
    }
    evSheet.deleteRow(filaEv);

    var key = 'EVENTO_ACTIVO_' + (creadoPor || usuario);
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty(key);
    if(raw){
      try{ if(String(JSON.parse(raw).evId)===evId) props.deleteProperty(key); }catch(ex){}
    }
    return safe({ok:true, marcasBorradas:borradas});
  } catch(e){ return safe({ok:false, error:e.toString()}); }
}

function _nextEventoId(evSheet) {
  var rows = evSheet.getDataRange().getValues();
  var maxId = 0;
  for (var i = 1; i < rows.length; i++) {
    var n = Number(rows[i][0]);
    if (!isNaN(n) && n > maxId) maxId = n;
  }
  return maxId + 1;
}
// ═══════════════════════════════════════════════════════════════
// IMPORTAR REUNIONES DESDE MATRIZ EXCEL (multi-hoja)
// ═══════════════════════════════════════════════════════════════
function importarReunionesMatriz(payload) {
  try {
    var p = typeof payload === 'string' ? JSON.parse(payload) : payload;
    var eventosIn = p.eventos || [];
    var infoUsrImport = _rolYTipoDeUsuario(p.creadoPor);
    var esAdminImport = infoUsrImport.rol === 'admin';
    var creadoPorImport = String(p.creadoPor || (esAdminImport ? 'admin' : 'comision'));
    var ss = getSS();
    var soSheet = ss.getSheetByName(SH_SOCIOS);
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    if (!soSheet || !evSheet || !asSheet) return safe({ ok:false, error:'Faltan hojas SOCIOS/EVENTOS/ASISTENCIAS' });

    var idToRut = {};
    soSheet.getDataRange().getValues().slice(1).forEach(function(f){
      var id = String(f[0]||'').trim();
      if (id) idToRut[id] = String(f[1]||'');
    });

    var evRows = evSheet.getDataRange().getValues();
    var existentes = {};
    for (var i=1; i<evRows.length; i++){
      var tipoEx = String(evRows[i][2]||'');
      var fechaEx = normFecha(evRows[i][3]);
      if (tipoEx && fechaEx) existentes[tipoEx+'|'+fechaEx] = true;
    }

    var nuevoIdEvento = _nextEventoId(evSheet);
    var filasEventos = [], filasAsist = [];
    var asistIdBase = asSheet.getLastRow();
    var omitidos = [], noEncontrados = [];
    var eventosCreados = 0, marcasCreadas = 0;
    var estadoNuevo = esAdminImport ? 'APROBADO' : 'PENDIENTE';

    eventosIn.forEach(function(ev){
      var key = ev.tipo + '|' + ev.fechaISO;
      if (existentes[key]) { omitidos.push(ev.nombre+' ('+ev.fechaISO+')'); return; }
      existentes[key] = true;

      var evId = nuevoIdEvento++;
      var partes = ev.fechaISO.split('-');
      var fechaObj = new Date(Number(partes[0]), Number(partes[1])-1, Number(partes[2]));

      filasEventos.push([evId, ev.nombre, ev.tipo, fechaObj, ev.ptsCompleto, ev.ptsParcial, ts(), '', '', creadoPorImport, estadoNuevo]);
      eventosCreados++;

      (ev.marcas||[]).forEach(function(m){
        var rut = idToRut[String(m.id)];
        if (!rut) { noEncontrados.push('ID '+m.id+' ('+ev.nombre+')'); return; }
        var asId = ++asistIdBase;
        filasAsist.push([asId, evId, rut, m.tipoAsistencia, m.puntaje, '', '', '', ts(), ev.nombre, fechaObj, ev.tipo]);
        marcasCreadas++;
      });
    });

    if (filasEventos.length) evSheet.getRange(evSheet.getLastRow()+1, 1, filasEventos.length, 11).setValues(filasEventos);
    if (filasAsist.length)   asSheet.getRange(asSheet.getLastRow()+1, 1, filasAsist.length, 12).setValues(filasAsist);

    return safe({ ok:true, eventosCreados:eventosCreados, marcasCreadas:marcasCreadas, omitidos:omitidos, noEncontrados:noEncontrados, pendiente:!esAdminImport });
  } catch(e) { return safe({ ok:false, error:e.toString() }); }
}
function generarAusentesObligatorios() {
  try {
    var ss = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    var soSheet = ss.getSheetByName(SH_SOCIOS);
    if (!evSheet || !asSheet || !soSheet) return { ok:false, error:'Faltan hojas' };

    var TIPOS_OBL = ['reunion_presencial','reunion_online','marcha'];

    var socios = soSheet.getDataRange().getValues().slice(1)
      .filter(function(r){
        var est = String(r[5]||'').toUpperCase().trim();
        return r[0] && (est==='ACTIVO'||est==='CONDICIONAL');
      })
      .map(function(r){ return { rut: String(r[1]||'').trim() }; })
      .filter(function(s){ return s.rut; });

    var evRows = evSheet.getDataRange().getValues();
    var eventos = [];
    for (var i=1; i<evRows.length; i++){
      var tipo = String(evRows[i][2]||'').trim().toLowerCase().replace(/ /g,'_');
      if (TIPOS_OBL.indexOf(tipo)>=0){
        eventos.push({ evId:String(evRows[i][0]), nombre:String(evRows[i][1]||''), tipo:tipo, fecha:evRows[i][3] });
      }
    }

    var asRows = asSheet.getDataRange().getValues();
    var marcadosPorEv = {};
    for (var j=1; j<asRows.length; j++){
      var evId = String(asRows[j][1]||'');
      var rk = lRut(String(asRows[j][2]||''));
      if (!evId || !rk) continue;
      if (!marcadosPorEv[evId]) marcadosPorEv[evId] = {};
      marcadosPorEv[evId][rk] = true;
    }

    var nuevas = [];
    var asistIdBase = asSheet.getLastRow();
    var resumen = [];

    eventos.forEach(function(ev){
      var marcados = marcadosPorEv[ev.evId] || {};
      var agregados = 0;
      socios.forEach(function(s){
        var rk = lRut(s.rut);
        if (marcados[rk]) return;
        var asId = ++asistIdBase;
        nuevas.push([asId, ev.evId, s.rut, 'AUSENTE', 0, '', '', 'Ausente generado retroactivamente', ts(), ev.nombre, ev.fecha, ev.tipo]);
        marcados[rk] = true;
        agregados++;
      });
      if (agregados>0) resumen.push(ev.nombre+': +'+agregados);
    });

    if (nuevas.length) asSheet.getRange(asSheet.getLastRow()+1, 1, nuevas.length, 12).setValues(nuevas);

    Logger.log(JSON.stringify({ filasAgregadas: nuevas.length, detalle: resumen }));
    return { ok:true, filasAgregadas: nuevas.length, detalle: resumen };
  } catch(e){ return { ok:false, error:e.toString() }; }
}

// ═══ REGLAS / CONFIGURACIÓN ═══
function getConfigValor(clave, valorPorDefecto) {
  var sh = getSS().getSheetByName('CONFIG');
  if (!sh) return valorPorDefecto;
  var rows = sh.getDataRange().getValues();
  for (var i=0; i<rows.length; i++){
    if (String(rows[i][0]||'').trim() === clave) return rows[i][1];
  }
  return valorPorDefecto;
}

function actualizarConfig(clave, valor) {
  var ss = getSS();
  var sh = ss.getSheetByName('CONFIG');
  if (!sh) { sh = ss.insertSheet('CONFIG'); sh.appendRow(['CLAVE','VALOR']); }
  var rows = sh.getDataRange().getValues();
  for (var i=0; i<rows.length; i++){
    if (String(rows[i][0]||'').trim() === clave) { sh.getRange(i+1,2).setValue(valor); return; }
  }
  sh.appendRow([clave, valor]);
}

function obtenerReglas() {
  try {
    var maxSocios = Number(getConfigValor('max_socios', 160)) || 160;
    var cupo = Number(getConfigValor('cupo_estacionamiento', 116)) || 116;
    var soSheet = getSS().getSheetByName(SH_SOCIOS);
    var activos = 0, total = 0;
    if (soSheet) {
      soSheet.getDataRange().getValues().slice(1).forEach(function(r){
        if (!r[0]) return;
        total++;
        var est = String(r[5]||'').toUpperCase();
        if (est==='ACTIVO'||est==='CONDICIONAL') activos++;
      });
    }
    return safe({ ok:true, maxSocios:maxSocios, cupoEstacionamiento:cupo, sociosActivos:activos, sociosTotales:total });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

function actualizarReglas(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    if (p.maxSocios!==undefined && p.maxSocios!==null && p.maxSocios!=='') {
      actualizarConfig('max_socios', Number(p.maxSocios));
    }
    if (p.cupoEstacionamiento!==undefined && p.cupoEstacionamiento!==null && p.cupoEstacionamiento!=='') {
      actualizarConfig('cupo_estacionamiento', Number(p.cupoEstacionamiento));
    }
    return obtenerReglas();
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

function _reordenarSociosPorNombre() {
  var sh = getSS().getSheetByName(SH_SOCIOS);
  if(!sh) return;
  var rows = sh.getDataRange().getValues();
  var header = rows[0];
  var datos = rows.slice(1).filter(function(r){ return r[1]; });
  datos.sort(function(a,b){
    return String(a[2]||'').localeCompare(String(b[2]||''), 'es', {sensitivity:'base'});
  });
  datos.forEach(function(r, idx){ r[0] = idx+1; });
  if(datos.length){
    sh.getRange(2, 1, datos.length, header.length).setValues(datos);
  }
}

// ═══════════════════════════════════════════════════════════════
// IMPORTAR ASISTENCIA A UNA REUNIÓN YA CREADA (desde Excel puntual)
// ═══════════════════════════════════════════════════════════════
function importarAsistenciaEvento(payload) {
  try {
    var p = typeof payload === 'string' ? JSON.parse(payload) : payload;
    var evId = String(p.evId||'');
    var marcasIn = p.marcas || [];
    var ss = getSS();
    var soSheet = ss.getSheetByName(SH_SOCIOS);
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    if (!soSheet || !evSheet || !asSheet) return safe({ ok:false, error:'Faltan hojas' });

    var evRows = evSheet.getDataRange().getValues();
    var evento = null;
    for (var i=1; i<evRows.length; i++){
      if (String(evRows[i][0])===evId){
        evento = { nombre:String(evRows[i][1]||''), tipo:String(evRows[i][2]||''), fecha:evRows[i][3] };
        break;
      }
    }
    if (!evento) return safe({ ok:false, error:'Reunión no encontrada' });

    var idToRut = {};
    soSheet.getDataRange().getValues().slice(1).forEach(function(f){
      var id = String(f[0]||'').trim();
      if (id) idToRut[id] = String(f[1]||'');
    });

    var yaMarcados = {};
    var asRows = asSheet.getDataRange().getValues();
    for (var j=1; j<asRows.length; j++){
      if (String(asRows[j][1])===evId){
        yaMarcados[lRut(String(asRows[j][2]||''))] = true;
      }
    }

    var filas = [];
    var asistIdBase = asSheet.getLastRow();
    var agregadas=0, omitidas=0, noEncontrados=[];

    marcasIn.forEach(function(m){
      var rut = idToRut[String(m.id)];
      if (!rut) { noEncontrados.push('ID '+m.id); return; }
      if (yaMarcados[lRut(rut)]) { omitidas++; return; }
      yaMarcados[lRut(rut)] = true;
      var asId = ++asistIdBase;
      filas.push([asId, evId, rut, m.tipoAsistencia, m.puntaje, '', '', '', ts(), evento.nombre, evento.fecha, evento.tipo]);
      agregadas++;
    });

    if (filas.length) asSheet.getRange(asSheet.getLastRow()+1, 1, filas.length, 12).setValues(filas);

    return safe({ ok:true, agregadas:agregadas, omitidas:omitidas, noEncontrados:noEncontrados });
  } catch(e) { return safe({ ok:false, error:e.toString() }); }
}
function obtenerResumenPendientes() {
  try {
    var ss = getSS();
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    var soSheet = ss.getSheetByName(SH_SOCIOS);
    var pbSheet = ss.getSheetByName(SH_BASE);
    if (!evSheet) return safe({ ok:true, eventos:[], puntajes:[] });

    var nombrePorRut = {};
    if (soSheet) {
      soSheet.getDataRange().getValues().slice(1).forEach(function(f){
        var rk = lRut(String(f[1]||''));
        if (rk) nombrePorRut[rk] = String(f[2]||'');
      });
    }

    var usuarioTipoMap = {};
    try {
      var usData = getSheetUsuarios_().getDataRange().getValues();
      for (var u=1; u<usData.length; u++){
        var usr = String(usData[u][1]||'').toLowerCase().trim();
        if (usr) usuarioTipoMap[usr] = String(usData[u][4]||'');
      }
    } catch(exU){}

    var asRows = asSheet ? asSheet.getDataRange().getValues().slice(1) : [];
    var porEvento = {};
    asRows.forEach(function(r){
      var evId = String(r[1]||'');
      if (!evId) return;
      if (!porEvento[evId]) porEvento[evId] = [];
      var rk = lRut(String(r[2]||''));
      porEvento[evId].push({
        rut: r[2]||'',
        nombre: nombrePorRut[rk] || (r[2]||''),
        tipoAsistencia: String(r[3]||''),
        puntaje: Number(r[4]||0)
      });
    });

    var evRows = evSheet.getDataRange().getValues();
    var eventos = [];
    for (var i=1; i<evRows.length; i++){
      var estado = String(evRows[i][10]||'').trim();
      if (estado !== 'PENDIENTE') continue;
      var evId = String(evRows[i][0]);
      eventos.push({
        evId: evId,
        nombre: String(evRows[i][1]||''),
        tipo: String(evRows[i][2]||''),
        fecha: normFecha(evRows[i][3]||''),
        creadoPor: String(evRows[i][9]||''),
        registros: porEvento[evId] || []
      });
    }

    var puntajes = [];
    if (pbSheet) {
      var pbRows = pbSheet.getDataRange().getValues();
      for (var k=1; k<pbRows.length; k++){
        var r2 = pbRows[k];
        var est2 = String(r2[7]||'');
        if (est2.indexOf('PENDIENTE')!==0) continue;
        var rutRaw = String(r2[1]||'');
        var rk2 = lRut(rutRaw);
        var creadoMatch = est2.match(/creadoPor:([^|]+)/);
        var creadoPor2 = creadoMatch ? creadoMatch[1] : '';
        puntajes.push({
          rowNum: k+1,
          rut: rutRaw,
          nombre: nombrePorRut[rk2] || rutRaw,
          ano: String(r2[2]||''),
          concepto: String(r2[3]||''),
          puntos: Number(r2[4]||0),
          creadoPor: creadoPor2,
          tipo: usuarioTipoMap[creadoPor2.toLowerCase()] || ''
        });
      }
    }

    return safe({ ok:true, eventos:eventos, puntajes:puntajes });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

// ═══ INTEGRANTES POR COMISIÓN ═══
function obtenerMiembrosComision(tipo) {
  try {
    var sh = getSS().getSheetByName('COMISION_MIEMBROS');
    var soSheet = getSS().getSheetByName(SH_SOCIOS);
    var nombrePorRut = {};
    if (soSheet) {
      soSheet.getDataRange().getValues().slice(1).forEach(function(f){
        var rk = lRut(String(f[1]||'')); if (rk) nombrePorRut[rk] = String(f[2]||'');
      });
    }
    var miembros = [];
    if (sh) {
      sh.getDataRange().getValues().slice(1).forEach(function(r){
        if (String(r[1]||'') !== tipo) return;
        if (r[5] === false || String(r[5]).toUpperCase() === 'FALSE') return;
        var rk = lRut(String(r[2]||''));
        miembros.push({ rut: r[2]||'', nombre: nombrePorRut[rk] || r[2]||'', cargo: r[3]||'', fechaInicio: r[4]||'' });
      });
    }
    return safe({ ok:true, tipo:tipo, miembros:miembros });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

function actualizarMiembrosComision(payload) {
  try {
    var p = typeof payload==='string'?JSON.parse(payload):payload;
    var tipo = String(p.tipo||'');
    var ruts = Array.isArray(p.ruts) ? p.ruts : [];
    if (!tipo) return safe({ ok:false, error:'Falta el tipo de comisión' });
    var ss = getSS();
    var sh = ss.getSheetByName('COMISION_MIEMBROS');
    if (!sh) { sh = ss.insertSheet('COMISION_MIEMBROS'); sh.appendRow(['ID','ID_COMISION','RUT_SOCIO','CARGO','FECHA_INICIO','ACTIVO']); }

    var TIPO_LABELS_SYNC = {
      comision_directiva:'Directiva', comision_fenapo:'FENAPO', comision_jardincito:'Jardincito',
      comision_escuelita:'Escuelita', comision_comprando:'Comprando Juntos', comision_reglamento:'Reglamento Interno',
      comision_bienestar:'Bienestar', comision_deportes:'Deportes', comision_comunicaciones:'Comunicaciones',
      comision_secretaria:'Secretaría', comision_tesoreria:'Tesorería', comision_talleres:'Talleres Laborales'
    };
    var shCom = ss.getSheetByName('COMISIONES');
    if (!shCom) { shCom = ss.insertSheet('COMISIONES'); shCom.appendRow(['ID','NOMBRE','TIPO','DESCRIPCION','ACTIVA']); }
    var comRows = shCom.getDataRange().getValues();
    var existeEnCatalogo = false;
    for (var ci=1; ci<comRows.length; ci++){ if (String(comRows[ci][2]||'')===tipo){ existeEnCatalogo=true; break; } }
    if (!existeEnCatalogo) {
      var nuevoIdCom = shCom.getLastRow();
      shCom.appendRow([nuevoIdCom, TIPO_LABELS_SYNC[tipo]||tipo, tipo, '', true]);
    }

    var rows = sh.getDataRange().getValues();
    for (var i = rows.length-1; i >= 1; i--){
      if (String(rows[i][1]||'') === tipo) sh.deleteRow(i+1);
    }
    var nuevoId = sh.getLastRow();
    var filas = [];
    ruts.forEach(function(rut){
      nuevoId++;
      filas.push([nuevoId, tipo, rut, '', ts(), true]);
    });
    if (filas.length) sh.getRange(sh.getLastRow()+1, 1, filas.length, 6).setValues(filas);
    return safe({ ok:true, count: filas.length });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

// ═══ AUSENCIAS DE COMISIONES ═══
function obtenerAusenciasComisiones() {
  try {
    var ss = getSS();
    var soSheet = ss.getSheetByName(SH_SOCIOS);
    var asSheet = ss.getSheetByName(SH_ASIST);
    var evSheet = ss.getSheetByName(SH_EVENTOS);
    var cmSheet = ss.getSheetByName('COMISION_MIEMBROS');
    if (!soSheet || !evSheet) return safe({ ok:true, comisiones:{} });

    var nombrePorRut = {}, idPorRut = {};
    soSheet.getDataRange().getValues().slice(1).forEach(function(f){
      var rk = lRut(String(f[1]||'')); if (!rk) return;
      nombrePorRut[rk] = String(f[2]||''); idPorRut[rk] = f[0]||'';
    });

    var miembrosPorTipo = {};
    if (cmSheet) {
      cmSheet.getDataRange().getValues().slice(1).forEach(function(r){
        var tipo = String(r[1]||''); var rk = lRut(String(r[2]||''));
        var activo = !(r[5]===false || String(r[5]).toUpperCase()==='FALSE');
        if (!tipo || !rk || !activo) return;
        if (!miembrosPorTipo[tipo]) miembrosPorTipo[tipo] = new Set();
        miembrosPorTipo[tipo].add(rk);
      });
    }

    var evTipoMap = {}, evInfoMap = {};
    evSheet.getDataRange().getValues().slice(1).forEach(function(r){
      var evId = String(r[0]||''); if (!evId) return;
      evTipoMap[evId] = String(r[2]||'').trim().toLowerCase().replace(/ /g,'_');
      evInfoMap[evId] = { nombre: String(r[1]||''), fecha: fmtFecha(r[3]) };
    });

    var TIPOS_OBL = ['reunion_presencial','reunion_online','marcha'];
    var eventosPorTipo = {}, asistioPorTipo = {};

    var asRows = asSheet ? asSheet.getDataRange().getValues().slice(1) : [];
    asRows.forEach(function(r){
      var evId = String(r[1]||''); if (!evId) return;
      var tipo = evTipoMap[evId];
      if (!tipo || TIPOS_OBL.indexOf(tipo) >= 0) return;
      var rk = lRut(String(r[2]||''));
      var asist = normTA(r[3]||'');
      if (!eventosPorTipo[tipo]) eventosPorTipo[tipo] = new Set();
      eventosPorTipo[tipo].add(evId);
      if (['PRESENTE','PARCIAL','REPRESENTADO','JUSTIFICADO'].indexOf(asist) >= 0 && rk) {
        if (!asistioPorTipo[tipo]) asistioPorTipo[tipo] = {};
        if (!asistioPorTipo[tipo][rk]) asistioPorTipo[tipo][rk] = new Set();
        asistioPorTipo[tipo][rk].add(evId);
      }
    });

    var comisiones = {};
    Object.keys(eventosPorTipo).forEach(function(tipo){
      var miembros = miembrosPorTipo[tipo];
      if (!miembros || !miembros.size) return;
      var todosEvs = Array.from(eventosPorTipo[tipo]);
      var lista = [];
      miembros.forEach(function(rk){
        var asistidos = (asistioPorTipo[tipo] && asistioPorTipo[tipo][rk]) || new Set();
        var faltados = todosEvs.filter(function(evId){ return !asistidos.has(evId); })
          .map(function(evId){ return { evId:evId, nombre:evInfoMap[evId].nombre, fecha:evInfoMap[evId].fecha }; });
        if (faltados.length > 0){
          lista.push({ id:idPorRut[rk]||'', rut:rk, nombre:nombrePorRut[rk]||rk, ausencias:faltados.length, totalEventos:todosEvs.length, eventosFaltados:faltados });
        }
      });
      lista.sort(function(a,b){ return b.ausencias-a.ausencias || a.nombre.localeCompare(b.nombre); });
      comisiones[tipo] = lista;
    });

    return safe({ ok:true, comisiones:comisiones });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

function _rolYTipoDeUsuario(usuario) {
  try {
    var data = getSheetUsuarios_().getDataRange().getValues();
    var usr = String(usuario||'').toLowerCase().trim();
    for (var i=1; i<data.length; i++){
      if (String(data[i][1]||'').toLowerCase().trim() === usr) {
        return { rol: String(data[i][3]||''), tipo: String(data[i][4]||'') };
      }
    }
  } catch(e){}
  return { rol:'', tipo:'' };
}

function subirFotoSocio(payload) {
  try {
    if (!payload || !payload.base64 || !payload.rut) return { ok:false, error:'Faltan datos' };
    var iter = DriveApp.getFoldersByName('SO1_Fotos_Socios');
    var carpeta = iter.hasNext() ? iter.next() : DriveApp.createFolder('SO1_Fotos_Socios');
    var blob = Utilities.newBlob(Utilities.base64Decode(payload.base64), payload.mimeType||'image/jpeg', 'foto_'+lRut(payload.rut)+'.jpg');
    var file = carpeta.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400';

    var sh = getSS().getSheetByName(SH_SOCIOS);
    var rows = sh.getDataRange().getValues();
    var bk = lRut(payload.rut);
    for (var i=1; i<rows.length; i++){
      if (lRut(String(rows[i][1]||'')) === bk) {
        sh.getRange(i+1, 10).setValue(url);
        return { ok:true, url: url };
      }
    }
    return { ok:false, error:'Socio no encontrado' };
  } catch(e){ return { ok:false, error: e.toString() }; }
}

function importarPuntajeBaseMatriz(payload) {
  try {
    var p = typeof payload === 'string' ? JSON.parse(payload) : payload;
    var entradas = p.entradas || [];
    var creadoPor = p.creadoPor || 'admin';
    var infoUsrPbm = _rolYTipoDeUsuario(creadoPor);
    var pendiente = infoUsrPbm.rol !== 'admin';
    var ss = getSS();
    var soSheet = ss.getSheetByName(SH_SOCIOS);
    var sheet = ss.getSheetByName(SH_BASE);
    if (!soSheet) return safe({ ok:false, error:'Falta hoja SOCIOS' });
    if (!sheet) {
      sheet = ss.insertSheet(SH_BASE);
      sheet.appendRow(['ID','RUT','AÑO','CONCEPTO','PUNTOS','OBSERVACION','TIMESTAMP','ESTADO']);
    }
    var idToRut = {};
    soSheet.getDataRange().getValues().slice(1).forEach(function(f){
      var id = String(f[0]||'').trim();
      if (id) idToRut[id] = String(f[1]||'');
    });
    var loteId = 'import'+Date.now().toString(36);
    var estado = pendiente ? ('PENDIENTE|lote:'+loteId+'|creadoPor:'+creadoPor) : '';
    var nuevoId = sheet.getLastRow();
    var filas = [];
    var creados = 0, noEncontrados = [];
    entradas.forEach(function(e){
      var rut = idToRut[String(e.id)];
      if (!rut) { noEncontrados.push('ID '+e.id); return; }
      nuevoId++;
      filas.push([nuevoId, rut, String(e.anio||'2026'), e.concepto||'', Number(e.puntos)||0, '', ts(), estado]);
      creados++;
    });
    if (filas.length) sheet.getRange(sheet.getLastRow()+1, 1, filas.length, 8).setValues(filas);
    return safe({ ok:true, creados:creados, noEncontrados:noEncontrados, pendiente:pendiente });
  } catch(e){ return safe({ ok:false, error:e.toString() }); }
}

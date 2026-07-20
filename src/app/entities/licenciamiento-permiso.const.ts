import { Permiso } from './permiso.enum';

/** Alias de permisos de Locales Comerciales (strings para *appHasPermission). */
export const LicenciamientoPermiso = {
  ConsultarLocalesComerciales: String(Permiso.CONSULTAR_LOCALES_COMERCIALES),
  ActualizarLocalComercial: String(Permiso.ACTUALIZAR_LOCAL_COMERCIAL),
  AgregarLocalComercial: String(Permiso.AGREGAR_LOCAL_COMERCIAL),
  EliminarLocalComercial: String(Permiso.ELIMINAR_LOCAL_COMERCIAL),
  VisualizarDetalle: String(Permiso.VISUALIZAR_DETALLE_LOCAL),
  EstatusInformacionFaltante: String(Permiso.ESTATUS_INFORMACION_FALTANTE),
  EstatusRevision: String(Permiso.ESTATUS_REVISION),
  EstatusRechazo: String(Permiso.ESTATUS_RECHAZO),
  EstatusDatosCorrectos: String(Permiso.ESTATUS_DATOS_CORRECTOS),
} as const;

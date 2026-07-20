/**
 * IDs de permisos del backend (GET /permisos).
 * Fuente: listado real `data[].idPermiso` + `descripcionPermiso`.
 */
export enum Permiso {
  // Módulos
  AGREGAR_MODULO = 1,
  CONSULTAR_MODULO = 20,
  ELIMINAR_MODULO = 21,
  ACTUALIZAR_MODULO = 22,

  // Monitoreo
  CONSULTAR_MONITOREO = 2,

  // Usuarios
  CONSULTAR_USUARIO = 3,
  AGREGAR_USUARIO = 4,
  ACTUALIZAR_USUARIO = 5,
  ELIMINAR_USUARIO = 6,

  // Locales Comerciales
  CONSULTAR_LOCALES_COMERCIALES = 7,
  ACTUALIZAR_LOCAL_COMERCIAL = 8,
  AGREGAR_LOCAL_COMERCIAL = 9,
  ELIMINAR_LOCAL_COMERCIAL = 10,
  VISUALIZAR_DETALLE_LOCAL = 11,
  ESTATUS_INFORMACION_FALTANTE = 12,
  ESTATUS_REVISION = 13,
  ESTATUS_RECHAZO = 14,
  ESTATUS_DATOS_CORRECTOS = 15,

  // Permisos
  CONSULTAR_PERMISOS = 16,
  AGREGAR_PERMISO = 17,
  ELIMINAR_PERMISO = 18,
  ACTUALIZAR_PERMISO = 19,

  // Roles
  CONSULTAR_ROLES = 23,
  AGREGAR_ROL = 24,
  ELIMINAR_ROL = 25,
  ACTUALIZAR_ROL = 26,

  // Registros / Luminarias (no usados en esta app)
  VISUALIZAR_DETALLE_LUMINARIAS = 27,

  // Capturista (no usados en esta app)
  SVJ_AGERAS = 29,
  VENENO = 30,
  CAPTURISTA_720S = 31,
  ONE_77 = 32,

  // Datas (no usados en esta app)
  PERMISO_PRUEBAS = 33,
}

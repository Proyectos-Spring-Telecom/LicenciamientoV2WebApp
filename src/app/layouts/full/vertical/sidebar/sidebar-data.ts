import { NavItem } from './nav-item/nav-item';
import { Permiso } from 'src/app/entities/permiso.enum';
import { LicenciamientoPermiso } from 'src/app/entities/licenciamiento-permiso.const';

export const navItems: NavItem[] = [
  {
    navCap: 'Menú',
  },
  {
    displayName: 'Administración',
    iconName: 'box-multiple',
    route: '/menu-level',
    permission: [
      Permiso.CONSULTAR_MODULO,
      Permiso.AGREGAR_MODULO,
      Permiso.ACTUALIZAR_MODULO,
      Permiso.ELIMINAR_MODULO,
      Permiso.CONSULTAR_PERMISOS,
      Permiso.AGREGAR_PERMISO,
      Permiso.ACTUALIZAR_PERMISO,
      Permiso.ELIMINAR_PERMISO,
      Permiso.CONSULTAR_ROLES,
      Permiso.AGREGAR_ROL,
      Permiso.ACTUALIZAR_ROL,
      Permiso.ELIMINAR_ROL,
    ],
    children: [
      {
        displayName: 'Módulos',
        route: '/modulos',
        permission: Permiso.CONSULTAR_MODULO,
      },
      {
        displayName: 'Permisos',
        route: '/permisos',
        permission: Permiso.CONSULTAR_PERMISOS,
      },
      {
        displayName: 'Roles',
        route: '/roles',
        permission: Permiso.CONSULTAR_ROLES,
      },
    ],
  },
  {
    displayName: 'Usuarios',
    iconName: 'users',
    route: '/menu-level',
    permission: [
      Permiso.CONSULTAR_USUARIO,
      Permiso.AGREGAR_USUARIO,
      Permiso.ACTUALIZAR_USUARIO,
      Permiso.ELIMINAR_USUARIO,
    ],
    children: [
      {
        displayName: 'Agregar Usuario',
        route: '/usuarios/agregar-usuario',
        permission: Permiso.AGREGAR_USUARIO,
      },
      {
        displayName: 'Lista Usuarios',
        route: '/usuarios',
        permission: Permiso.CONSULTAR_USUARIO,
      },
    ],
  },
  {
    navCap: 'Licenciamiento',
  },
  {
    displayName: 'Tablero',
    iconName: 'layout-dashboard',
    route: '/dashboard',
    permission: Permiso.CONSULTAR_TABLERO,
  },
  {
    displayName: 'Monitoreo',
    iconName: 'map',
    route: '/monitoreo',
    permission: Permiso.CONSULTAR_MONITOREO,
  },
  {
    displayName: 'Locales Comerciales',
    iconName: 'building-store',
    route: '/local-comercial',
    permission: LicenciamientoPermiso.ConsultarLocalesComerciales,
  },
  {
    navCap: 'Ajustes',
  },
  {
    displayName: 'Perfil Usuario',
    iconName: 'user',
    route: '/usuarios/perfil-usuario',
  },
  {
    displayName: 'Cerrar Sesión',
    iconName: 'lock',
    route: '/login',
  },
];

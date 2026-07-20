import { ListaEstados, ListaMunicipios, ListaColonia, ListaLocalidad, ListaCalle } from "./agregar-local-comercial";
export interface LocalComercial {
    estatus: number;
    fechaHora: any;
    giro: string;
    grupo: string;
    id: number;
    lat: number;
    lng: number;
    nombreCapturista: any;
    nombreComercial : string;
    /** 0 = sin obra, 1 = predio en obra */
    predioObra?: number;
    /** Etiqueta legible para el grid */
    predioObraLabel?: string;
    nombreEstatus: any;
    rfc: any;
    urlLicencia: any;
}

export class AgregarLocal {
    id: number;
    Registro: any;
    Nombrecomercial: string;
    IdGiro: number;
    LicenciaSuelo: any;
    Nombre: string;
    ApellidoPaterno: string;
    ApellidoMaterno: string;
    RazonSocial: any;
    RFC: any;
    FechaExpedicion: any;
    FechaRefrendo: any;
    Lat: any;
    Lng: any;
    Tipo: any;
    TipoPersona: any;
    Estacionamiento: any;
    Clave: any;
    M2: any;
    Superficie: any;
    UsoSuelo: string;
    NumeroCuenta: number;
    NombreSapac: string;
    ApellidoPaternoSapac: string;
    ApellidoMaternoSapac: string;
    Rfc1: any;
    Sector: any;
    Ruta: any;
    Folio: any;
    Medidor: any;

    /*IMAGENES*/
    LicenciaFuncionamiento: any;
    ReciboPredial: any;
    ReciboSapac: any;
    CaratulaMedidor: any;
    CuadradoMedidor: any;
    FachadaEstablecimiento: any;
    EstacionamientoIMG: any;
    Bodega: any;
    /*Fin de imagenes */

    IdEntidadFederativaLicencia: number; 
    IdMunicipioLicencia: number;
    IdLocalidadLicencia: number;
    IdColoniaLicencia: number;
    IdCalleLicencia:number;
    IdTipoVialidadLicencia: number;
    NombreColoniaLicencia: string;
    NombreLocalidadLicencia: string;
    NombreCalleLicencia: string;
    NombreVialidadLicencia: string;
    NoInteriorLicencia: number;
    NoExteriorLicencia: number;
    CPLicencia: any;
    IdEntidadFederativaSapac: number;
    IdMunicipioSapac: number;
    IdColoniaSapac: number;
    IdLocalidadSapac: number;
    IdCalleSapac: number;
    IdTipoVialidadSapac: number;
    NombreColoniaSapac: string;
    NombreMunicipio: string;
    NombreCalleSapac: string;
    NombreVialidadSapac: string;
    NombreLocalidadSapac: string;
    NoInteriorSapac: number;
    NoExteriorSapac: number;
    CPSapac: any;
    RepresentanteLegalNombre: string;
    RepresentanteLegalPaterno: string;
    RepresentanteLegalMaterno: string;
    RepresentanteLegalTelefono: string;
    RepresentanteLegalEmail: string;
    ContactoNombre: string;
    ContactoPaterno: string;
    ContactoMaterno: string;
    ContactoTelefono: string;
    ContactoEmail: string;


    Estados: ListaEstados[];
    Municipios: ListaMunicipios[];
    Colonias:  ListaColonia[]
    Localidades: ListaLocalidad[];
    Calles: ListaCalle[];
}
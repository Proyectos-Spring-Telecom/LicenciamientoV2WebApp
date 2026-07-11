export class AgregarLocal {
    id: number;
    Registro: number;
    Nombrecomercial: string;
    IdGiro: number;
    LicenciaSuelo: number;
    Nombre: string;
    ApellidoPaterno: string;
    ApellidoMaterno: string;
    RazonSocial: number;
    RFC: any;
    FechaExpedicion: any;
    FechaRefrendo: any;
    Lat: any;
    Lng: any;
    Tipo: any;
    TipoPersona: number;
    Estacionamiento: string;
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
    RfcSapac: any;

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
    NombreMunicipio: string;
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
    
}

export class ListaEstados {
    id: number;
    nombre: string;
}

export class ListaMunicipios {
    id: number;
    nombre: string;
}

export class ListaColonia {
    id: number;
    nombre: string;
}

export class ListaLocalidad {
    id: number;
    nombre: string;
}

export class ListaCalle {
    id: number;
    nombre: string;
}
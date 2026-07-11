export class DetalleLocal{
    direccion: direccion;  
    direccionSapac: direccionSapac;
    contacto: contacto;
    proteccionCivil: proteccionCivil;
    representante: representante;
    fotos: fotos [];
    apellidoMaterno?: string;
    apellidoMaternoSapac?: string;
    apellidoPaterno?: string;
    apellidoPaternoSapac?: string;
    clave?: number;
    estacionamiento?: boolean;
    estatus?: number;
    fechaExpedicion?: any;
    fechaHora?: any;
    fechaRefrendo?: any;
    folio?: string;
    id?: number;
    idCatastro?: number; 
    idGiro?: number;
    idLicenciaCatastro?: number;
    idLicenciaSapac?: number;
    idSapac?: number;
    idTipoServicio?: number;
    lat?: number;
    licenciaSuelo?: any;
    lng?: number;
    m2?: number;
    medidor?: string;
    nombre?: string;
    nombreComercial?: string;
    nombreEstatus?: string;
    nombreGiro?: string;
    nombreSapac?: string;
    nombreTipoServicio?: string;
    numeroCuenta?: string;
    razonSocial?: string;
    registro?: string;
    rfc?: string;
    rfcsapac?: string;
    ruta?: any;
    sector?: any;
    superficie?: any;
    tipo?: number;
    tipoPersona?: number;
    usoSuelo?: string;
    EsEmpresa?: boolean;
    RfcProteccionCivil?: any;
    NombreProteccionCivil: any;
    ApellidoPaternoProteccionCivil: any;
    ApellidoMaternoProteccionCivil: any;
    TelefonoProteccionCivil: number;
    RegistroAcreditacion: any;
    TienePrograma: boolean;
    VistoBueno: any;
}


export class direccion{
    cpLicencia?: number;
    idCalleLicencia?: number;
    idColoniaLicencia?: number;
    idEntidadFederativaLicencia?: number;
    idLicenciaDireccion?: number;
    idLocalidadLicencia?: number;
    idMunicipioLicencia?: number;
    idTipoVialidadLicencia?: number;
    noExteriorLicencia?: string;
    noInteriorLicencia?: string;
    nombreCalleLicencia?: string;
    nombreColoniaLicencia?: string;
    nombreEntidadFederativaLicencia?: string;
    nombreLocalidadLicencia?: string;
    nombreMuncipioLicencia?: string;
    nombreVialidadLicencia?: string;
}

export class proteccionCivil{
    apellidoMaterno?: any;
    apellidoPaterno?: any;
    esEmpresa: boolean;
    id?: any;
    idLicencia?: any;
    nombre?: any;
    razonSocial?: any;
    registroAcreditacion?: any;
    rfc?: any;
    telefono?: number;
    tienePrograma?: any;
    vistoBueno?: any;
}

export class direccionSapac{
    cpSapac?: number;
    idCalleSapac?: number;
    idColoniaSapac?: number;
    idEntidadFederativaSapac?: number;
    idLicenciaDireccionSapac?: number;
    idLocalidadSapac?: number;
    idMunicipioSapac?: number;
    idTipoVialidadSapac?: number;
    noExteriorSapac?: string;
    noInteriorSapac?: string;
    nombreCalleSapac?: string;
    nombreColoniaSapac?: string;
    nombreEntidadFederativaSapac?: string;
    nombreLocalidadSapac?: string;
    nombreMuncipioSapac?: string;
    nombreVialidadSapac?: string;
}

export class contacto{
    contactoEmail?: string;
    contactoMaterno?: string;
    contactoNombre?: string;
    contactoPaterno?: string;
    contactoTelefono?:  string;
}

export class representante{
    representanteLegalEmail?: string;
    representanteLegalMaterno?: string;
    representanteLegalNombre?: string;
    representanteLegalPaterno?: string;
    representanteLegalTelefono?:  string;
}

export class fotos{
    fechaHora?: any;
    ruta?: string;
    tipoFoto?: string;
    idLicencia?: number;
    idTipoFoto?: number;
}
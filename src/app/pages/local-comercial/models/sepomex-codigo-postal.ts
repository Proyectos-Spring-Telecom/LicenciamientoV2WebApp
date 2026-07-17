export interface SepomexColonia {
  idAsentamiento: string;
  nombre: string;
  tipoAsentamiento: string;
}

export interface SepomexCodigoPostal {
  codigoPostal: string;
  estado: { clave: string; nombre: string };
  municipio: { clave: string; nombre: string };
  ciudad: { clave: string; nombre: string };
  zona: string;
  colonias: SepomexColonia[];
}

const fs = require('fs');
const html = fs.readFileSync(
  'src/app/pages/local-comercial/components/formulario/local-comercial-formulario.component.html',
  'utf8'
);
const ts = fs.readFileSync(
  'src/app/pages/local-comercial/components/formulario/local-comercial-formulario.component.ts',
  'utf8'
);
const util = fs.readFileSync(
  'src/app/pages/local-comercial/utils/local-comercial-form-payload.util.ts',
  'utf8'
);

const htmlSet = new Set([...html.matchAll(/formControlName="([^"]+)"/g)].map((m) => m[1]));
const m = ts.match(/initForm\(\)\s*\{[\s\S]*?this\.localForm = this\.fb\.group\(\{([\s\S]*?)\}\);\s*\}/);
const initBlock = m ? m[1] : '';
const initSet = new Set([...initBlock.matchAll(/([A-Za-z_][A-Za-z0-9_]*):\s*\[/g)].map((x) => x[1]));

console.log('=== HTML only (no initForm) ===');
console.log([...htmlSet].filter((x) => !initSet.has(x)).sort());
console.log('=== initForm only (no HTML formControlName) ===');
[...initSet]
  .filter((x) => !htmlSet.has(x))
  .sort()
  .forEach((x) => console.log(' ', x));
console.log('counts html', htmlSet.size, 'init', initSet.size);

const keys = [
  ...util.matchAll(/append(?:Campo|Documento|DocumentosMultiples)\(\s*formData,\s*'([^']+)'/g),
].map((m) => m[1]);
console.log('=== FormData keys ===');
keys.forEach((k) => console.log(k));
console.log('total', keys.length);

// Contract keys from user (explicit + known expansions)
const contract = new Set([
  'Latitud',
  'Longitud',
  'TipoRegistro',
  'PredioObra',
  'EntidadFederativa',
  'Municipio',
  'Localidad',
  'Colonia',
  'Calle',
  'NoInterior',
  'NoExterior',
  'CP',
  'Sapac.NumeroCuenta',
  'Sapac.Nombre',
  'Sapac.ApellidoPaterno',
  'Sapac.ApellidoMaterno',
  'Sapac.RFC',
  'Sapac.Sector',
  'Sapac.Ruta',
  'Sapac.Folio',
  'Sapac.IdTipoServicio',
  'Sapac.Medidor',
  'Sapac.reciboSapac',
  'Sapac.caratulamedidor',
  'Sapac.cuadromedidor',
  'Catastro.Clave',
  'Catastro.M2',
  'Catastro.Superficie',
  'Catastro.UsoSuelo',
  'Catastro.reciboPredial',
  'Licencias.Registro',
  'Licencias.NombreComercial',
  'Licencias.Giro',
  'Licencias.LicenciaSuelo',
  'Licencias.NombrePropietario',
  'Licencias.ApellidoPaternoPropietario',
  'Licencias.ApellidoMaternoPropietario',
  'Licencias.TipoPersona',
  'Licencias.RFC',
  'Licencias.FechaExpedicion',
  'Licencias.FechaRefrendo',
  'Licencias.Estacionamiento',
  'Licencias.Tipo',
  'Licencias.FechaHora',
  'Licencias.Contacto.Nombre',
  'Licencias.Contacto.ApellidoPaterno',
  'Licencias.Contacto.ApellidoMaterno',
  'Licencias.Contacto.Telefono',
  'Licencias.Contacto.Correo',
  'Licencias.licenciaFuncionamiento',
  'Licencias.fachada',
  'Licencias.estacionamiento',
  'Licencias.bodega',
  'ProteccionCivil.EsEmpresa',
  'ProteccionCivil.RazonSocial',
  'ProteccionCivil.RFC',
  'ProteccionCivil.Nombre',
  'ProteccionCivil.ApellidoPaterno',
  'ProteccionCivil.ApellidoMaterno',
  'ProteccionCivil.Telefono',
  'ProteccionCivil.RegistroAcreditacion',
  'ProteccionCivil.TienePrograma',
  'ProteccionCivil.ContactoRepresentante.Nombre',
  'ProteccionCivil.ContactoRepresentante.ApellidoPaterno',
  'ProteccionCivil.ContactoRepresentante.ApellidoMaterno',
  'ProteccionCivil.ContactoRepresentante.Telefono',
  'ProteccionCivil.ContactoRepresentante.Correo',
  'ProteccionCivil.vistoBueno',
]);

const formDataSet = new Set(keys);
const missing = [...contract].filter((k) => !formDataSet.has(k));
const extra = keys.filter((k) => !contract.has(k) && !k.startsWith('LicenciaConstruccion.'));
console.log('=== Missing from FormData (vs explicit contract) ===');
console.log(missing);
console.log('=== Extra in FormData (not root/Sapac/Catastro/Licencias/PC contract) ===');
console.log(extra);
console.log('=== LicenciaConstruccion keys in FormData ===');
keys.filter((k) => k.startsWith('LicenciaConstruccion.')).forEach((k) => console.log(k));

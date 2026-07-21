# Sepomex — Código Postal

Cómo trabaja el servicio y cómo se usa en la **primera parte del formulario** (pre-registro / ubicación física).

---

## 1. El servicio

### Endpoint

```text
https://spcode.ddns.net/api-sepomex/api-sepomex
```

```http
GET /codigos-postales/{cp}
```

Ejemplo:

```http
GET https://spcode.ddns.net/api-sepomex/api-sepomex/codigos-postales/58000
```

### Qué hace

1. Recibe un código postal (`cp`)
2. Lo normaliza: solo dígitos, máximo 5 caracteres
3. Llama `GET /codigos-postales/{codigo}`
4. Devuelve estado, municipio, ciudad, zona y lista de colonias

### Respuesta

```json
{
  "codigoPostal": "58000",
  "estado": { "clave": "...", "nombre": "Michoacán de Ocampo" },
  "municipio": { "clave": "...", "nombre": "Morelia" },
  "ciudad": { "clave": "...", "nombre": "..." },
  "zona": "...",
  "colonias": [
    {
      "idAsentamiento": "...",
      "nombre": "Centro",
      "tipoAsentamiento": "Colonia"
    }
  ]
}
```

| Campo | Descripción |
| --- | --- |
| `codigoPostal` | CP consultado |
| `estado.nombre` | Nombre del estado |
| `municipio.nombre` | Nombre del municipio |
| `ciudad` | Ciudad (`clave`, `nombre`) |
| `zona` | Zona |
| `colonias[]` | Lista con `idAsentamiento`, `nombre`, `tipoAsentamiento` |

### Si falla el servicio

- Propaga el error HTTP (CP inexistente, red, timeout, etc.)
- No regresa datos de dirección
- Quien lo consume decide qué hacer (ver sección 2)

---

## 2. Cómo funciona en la primera parte del formulario

Pantalla: **pre-registro → Ubicación física**

Campos involucrados: Código Postal, Estado, Municipio, Colonia (Calle / No. Int / No. Ext no dependen de Sepomex).

### Flujo al buscar CP

1. El usuario escribe el CP (máx. 5) y da clic en **Buscar**
2. Se normaliza el CP (solo números, 5 dígitos)
3. Si no son 5 dígitos → no se llama al servicio
4. Se llama `obtenerPorCp(cp)`

### Si responde bien

- Se llena **Estado** con `estado.nombre`
- Se llena **Municipio** con `municipio.nombre`
- Se llena el select de **Colonia** con `colonias`
- Estado y Municipio quedan **solo lectura**
- Colonia se muestra como **select** (el valor guardado es el `nombre`, no el id)
- Se limpia la colonia seleccionada (salvo cuando se preserva en edición)

### Si falla

- Se activa modo manual (`direccionManualPorErrorSepomex = true`)
- Se vacía la lista de colonias
- Estado, Municipio y Colonia pasan a **texto libre** (editables)
- Se muestra alerta:

> **Error al consultar el código postal**  
> No encontramos datos automáticos para el código postal (XXXXX).  
> Puedes escribir Estado, Municipio y Colonia de forma manual.

- El formulario **no se bloquea**; el usuario puede seguir capturando a mano
- El body que se envía al backend **no cambia**: siguen siendo strings (Estado, Municipio, Colonia, CP)

### Resumen UI

| Situación | Estado / Municipio | Colonia |
| --- | --- | --- |
| Sepomex OK | Readonly (autorrelleno) | Select con colonias |
| Sepomex falla | Editables (manual) | Input de texto libre |

---

## Referencia en Web App

- Servicio: `src/app/pages/local-comercial/services/sepomex.service.ts`
- Modelo: `src/app/pages/local-comercial/models/sepomex-codigo-postal.ts`
- Formulario (1ª parte): `src/app/pages/local-comercial/components/pre-registro/pre-registro-local.component.ts`
- Alerta de error: `mostrarSwalCodigoPostalNoEncontrado` en `local-comercial-swal.util.ts`

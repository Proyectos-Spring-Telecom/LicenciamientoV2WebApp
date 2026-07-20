import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';

const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const EXCEL_EXTENSION = '.xlsx';

export interface ExcelExportColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Genera un .xlsx con encabezados en negrita, celdas centradas y autofiltro.
 * `fileName` / `sheetName`: nombre del módulo (ej. "Permisos").
 */
export async function exportarTablaExcel(options: {
  sheetName: string;
  fileName: string;
  columns: ExcelExportColumn[];
  rows: Record<string, unknown>[];
}): Promise<void> {
  const { sheetName, fileName, columns, rows } = options;
  if (!rows.length) {
    throw new Error('EMPTY');
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 22,
  }));

  worksheet.addRows(rows);

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  for (let r = 2; r <= worksheet.rowCount; r++) {
    worksheet.getRow(r).eachCell((cell) => {
      cell.font = { bold: false };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  }

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: EXCEL_TYPE });
  FileSaver.saveAs(blob, `${fileName}${EXCEL_EXTENSION}`);
}

/** Normaliza estatus numérico 1/0 desde distintas formas del API. */
export function resolverEstatusActivo(item: any): number {
  const raw =
    item?.estatus ??
    item?.Estatus ??
    item?.status ??
    item?.Status ??
    item?.activo ??
    item?.Activo;

  if (typeof raw === 'boolean') {
    return raw ? 1 : 0;
  }
  if (typeof raw === 'string') {
    const t = raw.trim().toLowerCase();
    if (t === 'activo' || t === 'true' || t === '1') {
      return 1;
    }
    if (t === 'inactivo' || t === 'false' || t === '0') {
      return 0;
    }
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function estatusTexto(estatus: number): string {
  return estatus === 1 ? 'Activo' : 'Inactivo';
}

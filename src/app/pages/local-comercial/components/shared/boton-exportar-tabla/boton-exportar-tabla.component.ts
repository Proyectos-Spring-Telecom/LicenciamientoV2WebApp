import { Component, Input, OnInit } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as ExcelJS from 'exceljs';

const EXCEL_EXTENSION = '.xlsx';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Component({
  standalone: false,
  selector: 'app-boton-exportar-tabla',
  templateUrl: './boton-exportar-tabla.component.html',
  styleUrls: ['./boton-exportar-tabla.component.css']
})
export class BotonExportarTablaComponent implements OnInit {
  @Input() tipoBoton: string;
  @Input() nombreArchivo: string;
  @Input() style: { [key: string]: string };
  @Input() datos: any[];
  @Input() buttonDisabled: boolean;

  constructor() {}

  ngOnInit() {}

  async exportarExcel(): Promise<void> {
    const rows = Array.isArray(this.datos) ? this.datos : [];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('data');

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      worksheet.columns = headers.map((header) => ({ header, key: header, width: 18 }));
      worksheet.addRows(rows);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    this.guardarExcel(buffer, this.nombreArchivo);
  }

  private guardarExcel(buffer: ExcelJS.Buffer, nombreArchivo: string): void {
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, nombreArchivo + EXCEL_EXTENSION);
  }
}
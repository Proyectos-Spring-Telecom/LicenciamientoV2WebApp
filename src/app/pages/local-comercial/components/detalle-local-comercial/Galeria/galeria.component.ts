import { MAT_DIALOG_DATA,MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-galeria',
  templateUrl: './galeria.component.html',
  styleUrls: ['./galeria.component.css'],
  standalone: false,
})
export class GaleriaComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<GaleriaComponent>) { }

  ngOnInit(): void {
  }

  public minimizarPopup() {
		this.dialogRef.addPanelClass('displayNone');
	}

	public maximizarPopup() {
		this.dialogRef.removePanelClass('displayNone');
	}

	public cerrarPopup() {
		this.dialogRef.close();
	}

}

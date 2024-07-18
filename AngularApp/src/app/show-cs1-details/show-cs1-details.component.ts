/**
 * Eco Hybrid Platform - A tool to visualize LCIA Impacts and organize ILCD files
 * Copyright (C) 2024 Fraunhofer IGD
 * 
 * This program is free software: you can redistribute it and/or modify it under 
 * the terms of the GNU General  * Public License as published by the Free Software 
 * Foundation, either version 3 of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. 
 * If not, see <https://www.gnu.org/licenses/>.
 */
import { Component, OnInit, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

interface FlowTableRow {
  name: string,
  amount: number,
  unit: string
}

@Component({
  selector: 'app-show-cs1-details',
  templateUrl: './show-cs1-details.component.html',
  styleUrls: ['./show-cs1-details.component.css']
})
export class ShowCs1DetailsComponent implements OnInit, AfterViewInit {

  public outputFlowTableData: MatTableDataSource<FlowTableRow>;
  public inputFlowTableData: MatTableDataSource<FlowTableRow>;

  @ViewChild('inputTableSort') public firstTableSort: MatSort;
  @ViewChild('outputTableSort') public secondTableSort: MatSort;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ShowCs1DetailsComponent>) {

    this.outputFlowTableData = new MatTableDataSource<FlowTableRow>(data.outputs);
    this.inputFlowTableData = new MatTableDataSource<FlowTableRow>(data.inputs);
  }
  ngAfterViewInit(): void {
    this.outputFlowTableData.sort = this.firstTableSort;
    this.inputFlowTableData.sort = this.firstTableSort;
  }

  ngOnInit() {

  }

}

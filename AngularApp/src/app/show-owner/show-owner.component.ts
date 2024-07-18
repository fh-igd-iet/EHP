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
import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RestService } from '../rest.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { OwnerDBO } from '../Common/OwnerDBO';
import { EditOwnerComponent } from '../edit-owner/edit-owner.component';

@Component({
  selector: 'app-show-owner',
  templateUrl: './show-owner.component.html',
  styleUrls: ['./show-owner.component.css']
})
export class ShowOwnerComponent implements OnInit {

  private paginator: MatPaginator;
  private sort: MatSort;
  formGroup: UntypedFormGroup = new UntypedFormGroup({});

  @ViewChild(MatSort, { static: true }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }

  setDataSourceAttributes() {
    this.tableData.paginator = this.paginator;
    this.tableData.sort = this.sort;

    if (this.paginator && this.sort) {
      this.applyFilter('');
    }
  }

  applyFilter(filterValue: string) {
    this.tableData.filterPredicate = (data: OwnerDBO, filter: string) => {
      var rowDataString = "";
      Object.values(data).forEach(value => {
        var foo = value += ''
        rowDataString += value;
      })
      return rowDataString.trim().toLowerCase().includes(filter);
    };
    if (filterValue.length > 0)
      this.tableData.filter = filterValue.trim().toLowerCase();
  }

  tableData: MatTableDataSource<OwnerDBO> =
    new MatTableDataSource<OwnerDBO>([]);
  rawData: OwnerDBO[] = [];
  editId: number = -1
  questionsOverall: Object[];
  loaded: boolean = false;
  deleteProgress: number = -1;

  constructor(public rest: RestService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar) { }


  refresh() {
    this.loaded = false;
    this.rest.get('/Owners/permission').subscribe((d: OwnerDBO[]) => {
      this.tableData = new MatTableDataSource<OwnerDBO>(d)
      this.rawData = d;
      this.tableData.paginator = this.paginator;
      this.loaded = true;
      this.applyFilter('');
    });
  }

  ngOnInit() {
    this.questionsOverall = new Array(10);
    this.tableData.sort = this.sort;
    this.refresh()
  }

  edit(row) {
    let dialog = this.dialog.open(EditOwnerComponent, {
      data: row,
      disableClose: true
    });
    dialog.afterClosed().subscribe(d => {
      this.refresh();
    });
  }

  clear(row) {
    this.editId = -1;
    this.tableData = new MatTableDataSource<OwnerDBO>(this.rawData)
    this.tableData.paginator = this.paginator;
  }

  delete(row) {
    this.editId = -1;
    this.deleteProgress = row.id;
    let dialog = this.dialog.open(ConfirmDialogComponent, {
      data: { text: 'Delete ' + row.name + '?' }
    });
    dialog.afterClosed().subscribe(d => {
      if (d == 1) {
        this.rest.delete('/Owners/' + row.id).subscribe(
          (res) => {
            if (res == null || !('error' in res))
              this.refresh();
            else
              this.showError("an error occurred")
            this.deleteProgress = -1;
          },
          error => {
            this.showError("an error occurred")
            this.deleteProgress = -1;
          });
      }
      else {
        this.deleteProgress = -1;
      }
      this.refresh();
    })
  }

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

  openAddOwnerDialog() {
    let dialog = this.dialog.open(EditOwnerComponent, {
      data: {}
    });
    dialog.afterClosed().subscribe(d => {
      this.refresh();
    });
    return false;
  }
}

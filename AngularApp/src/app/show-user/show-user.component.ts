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
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UserDBO } from '../Common/UserDBO';
import { RestService } from '../rest.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { UntypedFormGroup } from '@angular/forms';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-show-user',
  templateUrl: './show-user.component.html',
  styleUrls: ['./show-user.component.css']
})
export class ShowUserComponent implements OnInit {

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
    this.tableData.filterPredicate = (data: UserDBO, filter: string) => {
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

  tableData: MatTableDataSource<UserDBO> =
    new MatTableDataSource<UserDBO>([]);
  rawData: UserDBO[] = [];
  editId: number = -1
  questionsOverall: Object[];
  loaded: boolean = false;
  deleteProgress: number = -1;

  constructor(public rest: RestService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar) { }


  refresh() {
    this.loaded = false;
    this.rest.get('/User').subscribe((d: UserDBO[]) => {
      this.tableData = new MatTableDataSource<UserDBO>(d)
      this.rawData = d;
      this.tableData.paginator = this.paginator;
      this.loaded = true;
    });
  }

  ngOnInit() {
    this.questionsOverall = new Array(10);
    this.tableData.sort = this.sort;
    this.refresh()
  }

  edit(row) {
    /*
    this.editId = row.id; 
    this.initializeForm(row)
    */
    let dialog = this.dialog.open(EditUserComponent, {
      data: row,
      disableClose: true
    });
    dialog.afterClosed().subscribe(d => {
      this.refresh();
    });
  }

  clear(row) {
    this.editId = -1;
    this.tableData = new MatTableDataSource<UserDBO>(this.rawData)
    this.tableData.paginator = this.paginator;
  }

  delete(row) {
    this.editId = -1;
    this.deleteProgress = row.id;
    let dialog = this.dialog.open(ConfirmDialogComponent, {
      data: { text: 'Delete ' + row.login + '?' }
    });
    dialog.afterClosed().subscribe(d => {
      if (d == 1) {
        this.rest.delete('/User/' + row.id).subscribe(
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

  openAddUserDialog() {
    let dialog = this.dialog.open(EditUserComponent, {
      data: {}
    });
    dialog.afterClosed().subscribe(d => {
      this.refresh();
    });
    return false;
  }

}

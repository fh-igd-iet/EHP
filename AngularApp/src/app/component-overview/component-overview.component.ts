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
import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { RestService } from '../rest.service';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { QuestionControlService } from '../question-control.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { ComponentDBO, componentDBOToTreeview } from '../Common/ComponentDBO';
import { ComponentEditDialogComponent } from '../component-edit-dialog/component-edit-dialog.component';
import { TreeviewDialogComponent } from '../treeview-dialog/treeview-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ActivatedRoute } from '@angular/router';

interface ComponentDBORow extends ComponentDBO {
  activity_count: number
}

@Component({
  selector: 'app-component-overview',
  templateUrl: './component-overview.component.html',
  styleUrls: ['./component-overview.component.css']
})
export class ComponentOverviewComponent implements OnInit {

  private paginator: MatPaginator;
  private sort: MatSort;
  private currentFilter: string;
  public initialFilter: string = '';

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
      this.applyFilter(this.currentFilter);
    }
  }
  
  applyFilter(filterValue: string) {
    if (this.currentFilter != filterValue)
      this.currentFilter = filterValue;
    if (filterValue.length > 0)
      this.tableData.filter = filterValue.trim().toLowerCase();
    else
      this.tableData.filter = "";
  }

  tableData: MatTableDataSource<ComponentDBORow> =
    new MatTableDataSource<ComponentDBORow>([]);
  rawData: ComponentDBORow[] = [];
  editId: number = -1
  loaded: boolean = false;
  deleteProgress: number = -1;

  constructor(public rest: RestService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    private snackBar: MatSnackBar) {
    this.currentFilter = "";
  }

  refresh() {
    this.loaded = false;
    this.rest.get('/Component/all').subscribe((d: ComponentDBO[]) => {

      let rows = d.map(d => {
        let row = {};
        Object.assign(row, d);
        Object.assign(row, {
          activity_count: d.activity_id_a.length + d.activity_id_b.length + d.activity_id_c.length + d.activity_id_d.length + d.activity_id_e.length
        });
        return (<ComponentDBORow>row)
      })

      this.tableData = new MatTableDataSource<ComponentDBORow>(rows)
      this.rawData = rows;
      this.tableData.paginator = this.paginator;
      this.loaded = true;
    });
  }

  showActivities(row) {
    this.dialog.open(TreeviewDialogComponent, {
      data: {
        name: 'Activities',
        searchRoot: '/showActivity',
        data: componentDBOToTreeview(row)
      }
    });
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      if ('search' in params) {
        this.initialFilter = decodeURI(params['search']);
        this.applyFilter(this.initialFilter);
      }
    });

    this.tableData.sort = this.sort;
    this.refresh()
  }

  edit(row) {
    let dialog = this.dialog.open(ComponentEditDialogComponent, {
      data: row,
      disableClose: true
    });
    dialog.afterClosed().subscribe(d => {
      this.refresh();
    });
  }

  clear(row) {
    this.editId = -1;
    this.tableData = new MatTableDataSource<ComponentDBORow>(this.rawData)
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
        this.rest.delete('/Component/' + row.id).subscribe(
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

  openAddComponentDialog() {
    this.dialog.open(ComponentEditDialogComponent, {
      data: {}
    });
    this.dialog.afterAllClosed.subscribe(d => {
      this.refresh()
    })
    return false;
  }

}

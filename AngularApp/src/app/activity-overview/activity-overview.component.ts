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
import { ActivityDBO } from '../Common/ActivityDBO';
import { TreeviewDialogComponent } from '../treeview-dialog/treeview-dialog.component';
import { ActivityEditDialogComponent } from '../activity-edit-dialog/activity-edit-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ActivatedRoute } from '@angular/router';


interface ActivityDBORow extends ActivityDBO {
  component_count: number,
  technology_count: number
}

@Component({
  selector: 'app-activity-overview',
  templateUrl: './activity-overview.component.html',
  styleUrls: ['./activity-overview.component.css']
})
export class ActivityOverviewComponent implements OnInit {

  private paginator: MatPaginator;
  private sort: MatSort;
  private currentFilter: string;
  public initialFilter: string = '';

  @ViewChild(MatSort, { static: true }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.sort.sortChange.subscribe(d => {
      if (d.active == 'component_count') {

      } else if (d.active == 'technology_count') {

      } else {
        this.tableData.sort = this.sort;
      }
    });
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

  tableData: MatTableDataSource<ActivityDBORow> =
    new MatTableDataSource<ActivityDBORow>([]);
  rawData: ActivityDBORow[] = [];
  editId: number = -1
  loaded: boolean = false;
  deleteProgress: number = -1;

  constructor(public rest: RestService,
    private questionControl: QuestionControlService,
    private questionGenerator: QuestionGeneratorService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    private snackBar: MatSnackBar) {
    this.currentFilter = "";
  }

  refresh() {
    this.loaded = false;
    this.rest.get('/Activity/tableview').subscribe((d: ActivityDBO[]) => {

      d.forEach(d => {
        if (d.technology_extern_ids.length == 1 && d.technology_extern_ids[0] == null) {
          d.technology_extern_ids = []
          d.technology_ids = []
          d.technology_names = []
          d.technology_parents = []
          d.technology_spds = []
        }
      })

      let rows = d.map(d => {
        let row = {};
        Object.assign(row, d);
        Object.assign(row, {
          technology_count: 0,
          component_count: 0
        });
        (<ActivityDBORow>row).technology_count = d.technology_ids.length;
        (<ActivityDBORow>row).component_count = d.comp_id_a.length + d.comp_id_b.length + d.comp_id_c.length + d.comp_id_d.length + d.comp_id_e.length
        return (<ActivityDBORow>row)
      })
      this.tableData = new MatTableDataSource<ActivityDBORow>(rows)
      this.rawData = rows;
      this.tableData.paginator = this.paginator;
      this.loaded = true;
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

  showTechnologies(row) {
    let id_lookup = {}
    let parent_lookup = {}
    let roots = []
    for (let i = 0; i < row.technology_names.length; i++) {
      let id = row.technology_ids[i]
      let parent = row.technology_parents[i]
      let node = {
        search: row.technology_names[i],
        name: row.technology_extern_ids[i] + ' ' + row.technology_names[i],
        children: []
      }
      id_lookup[id] = node
      if (!parent) {
        roots.push(node)
      } else {
        if (!(parent in parent_lookup))
          parent_lookup[parent] = []
        parent_lookup[parent].push(id)
      }
    }
    for (let id in id_lookup) {
      if (id in parent_lookup)
        id_lookup[id].children = parent_lookup[id].map(d => id_lookup[d])
    }
    this.dialog.open(TreeviewDialogComponent, {
      data: { name: 'Technologies', searchRoot: 'showProcesses', data: roots }
    });
  }

  showComponents(row) {
    let tree = [
    ]
    if (row.comp_name_a.length > 0) {
      tree.push({
        name: 'Multifunctional Fuselage & Cabin',
        children: row.comp_name_a.map(d => {
          return {
            name: d,
            search: d,
            children: []
          }
        })
      })
    }
    if (row.comp_name_b.length > 0) {
      tree.push({
        name: 'Advanced Wing Design',
        children: row.comp_name_b.map(d => {
          return {
            name: d,
            search: d,
            children: []
          }
        })
      })
    }
    if (row.comp_name_c.length > 0) {
      tree.push({
        name: 'Major systems Treatmens & Euipment Integration',
        children: row.comp_name_c.map(d => {
          return {
            name: d,
            search: d,
            children: []
          }
        })
      })
    }
    if (row.comp_name_d.length > 0) {
      tree.push({
        name: 'Engine',
        children: row.comp_name_d.map(d => {
          return {
            name: d,
            search: d,
            children: []
          }
        })
      })
    }
    if (row.comp_name_e.length > 0) {
      tree.push({
        name: 'Future connected Factory',
        children: row.comp_name_e.map(d => {
          return {
            name: d,
            search: d,
            children: []
          }
        })
      })
    }

    this.dialog.open(TreeviewDialogComponent, {
      data: { name: 'Components', searchRoot: 'showComponent', data: tree }
    });
  }

  edit(row) {
    /*
    this.editId = row.id; 
    this.initializeForm(row)
    */
    let dialog = this.dialog.open(ActivityEditDialogComponent, {
      data: row,
      disableClose: true
    });
    dialog.afterClosed().subscribe(d => {
      this.refresh();
    });
  }

  clear(row) {
    this.editId = -1;
    this.tableData = new MatTableDataSource<ActivityDBORow>(this.rawData)
    this.tableData.paginator = this.paginator;
  }

  delete(row) {
    this.editId = -1;
    this.deleteProgress = row.id;
    let dialog = this.dialog.open(ConfirmDialogComponent, {
      data: { text: 'Delete ' + row.title + '?' }
    });
    dialog.afterClosed().subscribe(d => {
      if (d == 1) {
        this.rest.delete('/Activity/' + row.id).subscribe(
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

  openAddProcessDialog() {
    this.dialog.open(ActivityEditDialogComponent, {
      data: {}
    });
    this.dialog.afterAllClosed.subscribe(d => {
      this.refresh();
    })
    return false;
  }

}

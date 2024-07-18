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
import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterContentInit, ChangeDetectionStrategy, ViewChildren, QueryList } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { RestService } from '../rest.service';
import { OLCAProcess, OLCAProcessDBO } from '../Common/OLCADBO';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ShowCs1DetailsComponent } from '../show-cs1-details/show-cs1-details.component';
//import { CS1ProcessDBO } from '../Common/OLCAProcessDBO';
import { Cs1EditDialogComponent } from '../cs1-edit-dialog/cs1-edit-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

import { MatCheckbox } from '@angular/material/checkbox';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-show-cs1',
  templateUrl: './show-cs1.component.html',
  styleUrls: ['./show-cs1.component.css'],
  imports: [MatCheckboxModule, FormsModule],
})
export class ShowCs1Component implements AfterContentInit {

  private paginator: MatPaginator;
  private sort: MatSort;
  downloading: boolean = false;
  download_id: number = -1;
  downloadIds: Set<number> = new Set();
  formGroup: UntypedFormGroup = new UntypedFormGroup({});
  title: string = "CS1 AED";
  csFilter: UntypedFormControl = new UntypedFormControl('cs1');
  textFilter: UntypedFormControl = new UntypedFormControl('');
  filterValues = {
    textFilter: "",
    csFilter: "cs1"
  }
  //csFilter: string = 'cs1';
  filterInput: string = '';

  @ViewChild(MatSort, { static: true }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }

  @ViewChildren(MatCheckbox) checkboxes: QueryList<MatCheckbox>;

  setDataSourceAttributes() {
    this.tableData.paginator = this.paginator;
    this.tableData.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'id': return item.lcaProcess.id;
        case 'name': return item.lcaProcess.name;
        case 'aggregated': return item.lcaProcess.aggregated;
        default: return item[property];
      }
    };

    this.tableData.sort = this.sort;
    this.tableData.paginator = this.paginator;
    this.tableData.filterPredicate = (data: OLCAProcessDBO, filter: string) => {
      let filterValues = JSON.parse(filter);
      var rowDataString = "";
      let csFilterPass = (data.lcaProcess.cs1 && filterValues.csFilter == 'cs1') ||
        (!data.lcaProcess.cs1 && filterValues.csFilter == 'cs2');

      if (filterValues.textFilter.length < 1)
        return csFilterPass;
      Object.values(data).forEach(value => {
        var foo = value += ''
        rowDataString += value;
      })
      rowDataString += data.lcaProcess.id;
      let filterLower = filterValues.textFilter.toLowerCase();
      return rowDataString.trim().toLowerCase().includes(filterLower) && csFilterPass;
    };

    if (this.paginator && this.sort) {
      this.refreshFilter();
    }
  }

  refreshFilter() {
    if (!this.loaded)
      return;
    this.tableData.filter = JSON.stringify(this.filterValues)
  }

  tableData: MatTableDataSource<OLCAProcessDBO> =
    new MatTableDataSource<OLCAProcessDBO>([]);
  rawData: OLCAProcessDBO[] = [];
  loaded: boolean = false;

  constructor(public rest: RestService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    public router: Router) { }


  refresh() {
    this.loaded = false;
    this.rest.get('/OLCAProcess').subscribe((d: OLCAProcessDBO[]) => {
      this.rawData = d.filter(e => { return e.lcaProcess != null });
      this.tableData = new MatTableDataSource<OLCAProcessDBO>(this.rawData)
      this.setDataSourceAttributes();
      this.loaded = true;
      this.refreshFilter()
    });
    this.refreshFilter();
  }

  ngAfterContentInit() {
    if (this.router.url.includes('CS2')) {
      this.filterValues.csFilter = "cs2";
      this.title = "CS2 ILCD Data";
    } else {
      this.filterValues.csFilter = "cs1";
      this.title = "CS1 AED";
    }
    this.tableData.sort = this.sort;
    this.csFilter.valueChanges
      .subscribe(
        cs => {
          this.filterValues.csFilter = cs
          this.tableData.filter = JSON.stringify(this.filterValues);
        }
      )
    this.textFilter.valueChanges
      .subscribe(
        text => {
          this.filterValues.textFilter = text
          this.tableData.filter = JSON.stringify(this.filterValues);
        }
      )
    this.refresh()
  }

  downloadAllClicked() {
    this.downloading = true;
    this.rest.downloadEveryProcess(
      d => {
        this.downloading = false;
        this.cd.detectChanges();
      },
      d => {
        this.downloading = false;
        this.snackBar.open('Could not get download', "close", {
          duration: 5000,
        })
        this.cd.detectChanges();
      }
    );
  }

  clearCheckboxes() {
    this.downloadIds.clear();
    this.checkboxes.forEach(c => {
      if (c.id.startsWith("download-")) {
        c.writeValue(false)
      }
    });
  }

  downloadClicked() {
    this.downloading = true;
    console.log("downloading id")
    console.log(this.downloadIds)
    this.rest.downloadProcesses(this.downloadIds,
      d => {
        this.downloading = false;
        this.downloadIds.clear();
        this.clearCheckboxes()
      },
      d => {
        this.downloading = false;
        this.snackBar.open('Could not get download', "close", {
          duration: 5000,
        })
        this.cd.detectChanges();
      }
    );
  }

  download(id: number) {
    this.downloading = true;
    this.download_id = id;
    this.rest.downloadProcess(id,
      d => {
        this.download_id = -1;
        this.downloading = false;
      },
      d => {
        this.download_id = -1;
        this.downloading = false;
        this.snackBar.open('Could not get download', "close", {
          duration: 5000,
        })
        console.log("failure")
      }
    );
  }

  showDetails(data: OLCAProcess) {
    this.dialog.open(ShowCs1DetailsComponent, {
      data: data
    });
  }

  delete(data: OLCAProcessDBO) {
    let dialog = this.dialog.open(ConfirmDialogComponent, {
      data: { text: 'Delete ' + data.name + '?' }
    });
    dialog.afterClosed().subscribe(d => {
      if (d == 1) {
        this.rest.delete('/OLCAProcess/' + data.id).subscribe(() => {
          this.refresh()
        });
      }
    })
  }

  showEdit(data: OLCAProcessDBO) {
    let dialog = this.dialog.open(Cs1EditDialogComponent, {
      data: data
    });
    dialog.afterClosed().subscribe(() => {
      this.refresh()
    })
  }

  showAdd() {
    let dialog = this.dialog.open(Cs1EditDialogComponent, null);
    dialog.afterClosed().subscribe(() => {
      this.refresh()
    })
  }

  toggleDownloadId(id: number) {
    console.log("toggle called")
    if (this.downloadIds.has(id))
      this.downloadIds.delete(id)
    else
      this.downloadIds.add(id)
  }


  async toggle_verify(row: string) {
    if (this.rest.can('is_qa_member')) {
      const id = row['id'];
      const new_verification_status = !row['verified'];

      this.rest.post('/OLCAProcess/verify/' + id, `{ "verified": ${new_verification_status} }`).subscribe(
        _ => {
          // row['verified'] = new_verification_status;
        },
        error => {
          // error is most likely 501 (unauthorized, in which case this should not have triggered at all)

          // cant find .check -> aria-checked
          // also very dirty..
          // var checkbox =<HTMLInputElement> document.getElementById(`verify-${id}-input`)
          // checkbox.checked = !new_verification_status;
          // console.log(checkbox)

          // model binding also doesnt work... ?
          // row['verified'] = !new_verification_status;

          console.log(error)
        }
      )
    }
  }
}

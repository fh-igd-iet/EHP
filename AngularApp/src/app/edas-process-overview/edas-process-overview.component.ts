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
import { TextboxQuestion } from '../Common/question-textbox';
import { Validators, UntypedFormGroup } from '@angular/forms';
import { QuestionBase } from '../Common/question-base';
import { EDASProcessDBO } from '../Common/EDASProcessDBO';
import { EDASProcessEditDialogComponent } from '../edas-process-edit-dialog/edas-process-edit-dialog.component';



// interface TableElement
// {
//   id: number,
//   Demo: string,
//   PD: string,
//   Explanation: string,
//   Owner_name: string,
//   SPD_name: string,
//   Cohort_letters: string,
//   Material_ids: string,
//   Keyword_names: string
// }


@Component({
  selector: 'app-edas-process-overview',
  templateUrl: './edas-process-overview.component.html',
  styleUrls: ['./edas-process-overview.component.css']
})

export class EDASProcessOverviewComponent implements OnInit {

  private paginator: MatPaginator;
  private sort: MatSort;
  private currentFilter: string;

  @Input() autoInit: boolean = true;

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

  tableData: MatTableDataSource<EDASProcessDBO> =
    new MatTableDataSource<EDASProcessDBO>([]);
  rawData: EDASProcessDBO[] = [];
  editId: number = -1
  questionsOverall: Object[];
  formGroup: UntypedFormGroup = new UntypedFormGroup({});
  questionsPromise: Promise<QuestionBase<any>[]>;
  loaded: boolean = false;
  deleteProgress: number = -1;

  constructor(public rest: RestService,
    private questionControl: QuestionControlService,
    private questionGenerator: QuestionGeneratorService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar) {
    this.currentFilter = "";
  }

  initializeForm(row) {
    /*
    this.questionsOverall = new Array(10);
    let questions:any[] = [
      this.questionGenerator.getOwnerQuestion({
        key: 'Owner_id',
        label: 'Owner',
        value: row.Owner_id,
        validators: [Validators.required],
        order: 1
      }),
      new TextboxQuestion({
        key: 'Demo',
        label: 'Demo',
        value: row.Demo,
        validators: [Validators.nullValidator],
        order: 2
      }),
      new TextboxQuestion({
        key: 'PD',
        label: 'PD',
        value: row.PD,
        validators: [Validators.nullValidator],
        order: 3
      }),
      new TextboxQuestion({
        key: 'Explanation',
        label: 'Explanation',
        value: row.Explanation,
        validators: [Validators.nullValidator],
        order: 4
      }),
      this.questionGenerator.getSPDQuestion({
        key: 'SPD_id',
        label: 'SPD',
        value: row.SPD_id,
        validators: [Validators.required],
        order: 5
      })
    ]
    this.questionsPromise = <Promise<QuestionBase<any>[]>>(Promise.all(questions));
    this.questionsPromise.then((questions:QuestionBase<any>[])=>{
      this.questionsOverall = questions
      this.formGroup = this.questionControl.toFormGroup(questions);
      this.formGroup.statusChanges.subscribe((status)=>{
      })

    })
    */
  }

  refresh() {
    this.loaded = false;
    this.rest.get('/EDASProcess').subscribe((d: EDASProcessDBO[]) => {
      this.tableData = new MatTableDataSource<EDASProcessDBO>(d)
      this.rawData = d;
      this.tableData.paginator = this.paginator;
      this.loaded = true;
    });
  }

  ngOnInit() {
    this.questionsOverall = new Array(10);
    this.tableData.sort = this.sort;
    if (this.autoInit)
      this.refresh()
    else
      this.loaded = true
  }

  edit(row) {
    /*
    this.editId = row.id; 
    this.initializeForm(row)
    */
    let dialog = this.dialog.open(EDASProcessEditDialogComponent, {
      data: row,
      disableClose: true
    });
    dialog.afterClosed().subscribe(d => {
      this.refresh();
    });
  }

  clear(row) {
    this.editId = -1;
    this.tableData = new MatTableDataSource<EDASProcessDBO>(this.rawData)
    this.tableData.paginator = this.paginator;
  }

  delete(row) {
    this.editId = -1;
    this.deleteProgress = row.id;
    this.rest.delete('/EDASProcess/' + row.id).subscribe(
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

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

  save(row) {
    if (this.formGroup.valid) {
      this.editId = -1;
      let id = row.id;
      let data = this.formGroup.value;
      this.rest.put('/EDASProcess/' + row.id, data).subscribe((res) => {
        this.refresh()
      })
    } else {
      for (let k in this.formGroup.controls)
        this.formGroup.controls[k].markAsTouched();
    }


  }

  openAddProcessDialog() {
    this.dialog.open(EDASProcessEditDialogComponent, {
      data: {}
    });
    return false;
  }
}

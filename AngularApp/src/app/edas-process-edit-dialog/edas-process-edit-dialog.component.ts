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
import { Component, OnInit, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TextboxQuestion } from '../Common/question-textbox';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { isNumberValidator } from '../Common/validators';
import { Validators, FormGroup } from '@angular/forms';
import { EDASProcessDBO } from '../Common/EDASProcessDBO';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-edas-process-edit-dialog',
  templateUrl: './edas-process-edit-dialog.component.html',
  styleUrls: ['./edas-process-edit-dialog.component.css']
})
export class EDASProcessEditDialogComponent implements OnInit {

  process: EDASProcessDBO;

  questionsOverall: any[];
  questionsBudget: any[];
  questionsEDAS: any[];
  overallDataStatus: boolean = false;
  budgetDataStatus: boolean = false;
  overallData: Object;
  budgetData: Object;
  finalData: Object[];

  loaded: boolean = false;
  submitted: boolean = false;
  ownerOptions: Object[];

  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<EDASProcessEditDialogComponent>,
    private rest: RestService,
    private questionGenerator: QuestionGeneratorService,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar) {
  }

  generateQuestions() {
    if (this.data.id)
      this.process = this.data;
    this.questionsOverall = [
      this.questionGenerator.getDropdownQuestion(
        '/Owner',
        d => d['owner_id'],
        d => d['name'],
        {
          key: 'owner_id',
          label: 'Owner',
          value: this.process ? this.process.owner_id : undefined,
          validators: [Validators.required],
          order: 1
        }
      ),
      new TextboxQuestion({
        key: 'demo',
        label: 'Demo',
        value: this.process ? this.process.demo : undefined,
        validators: [Validators.required],
        order: 2
      }),
      new TextboxQuestion({
        key: 'pd',
        label: 'PD',
        value: this.process ? this.process.pd : undefined,
        validators: [Validators.required],
        order: 3
      }),
      new TextboxQuestion({
        key: 'explanation',
        label: 'Explanation',
        value: this.process ? this.process.explanation : undefined,
        validators: [Validators.required],
        order: 4
      }),
      this.questionGenerator.getDropdownQuestion(
        '/Workpackage',
        d => d['workpackage'],
        d => d['workpackage'],
        {
          key: 'workpackage',
          label: 'Workpackage',
          value: this.process ? this.process.workpackage : undefined,
          validators: [Validators.required],
          order: 5
        }
      ),
      this.questionGenerator.getDropdownQuestion(
        '/SPD',
        d => d['id'],
        d => d['name'],
        {
          key: 'itd_id',
          label: 'ITD',
          value: this.process ? this.process.itd_id : undefined,
          validators: [Validators.required],
          order: 5
        }
      ),
      this.questionGenerator.getDropdownQuestion(
        '/SPD',
        d => d['id'],
        d => d['name'],
        {
          key: 'spd_id',
          label: 'SPD',
          value: this.process ? this.process.spd_id : undefined,
          validators: [Validators.required],
          order: 5
        }
      ),
      this.questionGenerator.getChipsQuestion('/Cohort',
        d => d['id'],
        d => d['letter'] + ') ' + d['description'],
        {
          key: 'cohort_ids',
          label: 'Cohort-Inventory',
          value: this.process ? this.process.cohort_ids : undefined,
          acceptNewChips: false,
          validators: [],
          order: 6
        }),
      this.questionGenerator.getChipsQuestion('/Material',
        d => d['id'],
        d => d['name'],
        {
          key: 'material_ids',
          label: 'Materialien',
          value: this.process ? this.process.material_ids : undefined,
          validators: [],
          order: 7
        }),
      this.questionGenerator.getChipsQuestion('/Keyword',
        d => d['id'],
        d => d['keyword'],
        {
          key: 'keyword_ids',
          label: 'Keywords',
          value: this.process ? this.process.keyword_ids : undefined,
          validators: [],
          order: 8
        })
    ]
    Promise.all(this.questionsOverall).then(questions => {
      this.questionsOverall = questions
      this.loaded = true;
    })

    this.questionsBudget = [
      new TextboxQuestion({
        key: 'a',
        label: 'A',
        value: this.process ? '' + this.process.a : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
      new TextboxQuestion({
        key: 'b',
        label: 'B',
        value: this.process ? '' + this.process.b : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
      new TextboxQuestion({
        key: 'c',
        label: 'C',
        value: this.process ? '' + this.process.c : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
      new TextboxQuestion({
        key: 'd',
        label: 'D',
        value: this.process ? '' + this.process.d : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
      new TextboxQuestion({
        key: 'reup',
        label: 'REUP',
        value: this.process ? '' + this.process.reup : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
      new TextboxQuestion({
        key: 'eol',
        label: 'EoL',
        value: this.process ? '' + this.process.eol : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
      new TextboxQuestion({
        key: 'ads',
        label: 'ADS',
        value: this.process ? '' + this.process.ads : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
      new TextboxQuestion({
        key: 'asa',
        label: 'ASA',
        value: this.process ? '' + this.process.asa : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
      new TextboxQuestion({
        key: 'grossfactor',
        label: 'grossfactor',
        value: this.process ? '' + this.process.grossfactor : '0.0',
        order: 1,
        validators: [isNumberValidator(), Validators.min(0)]
      }),
    ]
  }

  ngOnInit() {
    this.generateQuestions()
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  validationOverall(form) {
    this.overallData = form.value;
    this.overallDataStatus = form.valid;
    this.finalData = [this.overallData, this.budgetData]
  }

  validationBudget(form) {
    this.budgetData = form.value;
    this.budgetDataStatus = form.valid;
    this.finalData = [this.overallData, this.budgetData]
  }

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

  submit() {
    if (this.isValid()) {
      this.submitted = true;
      let data = this.budgetData;
      Object.assign(data, this.overallData);
      if (this.process) {
        let obs = this.rest.put('/EDASProcess/' + this.process.id, data).subscribe(
          d => {
            if (!d)
              this.dialogRef.close()
            else {
              if (!('error' in d))
                this.dialogRef.close()
              else
                this.showError("an error occurred");
            }

            this.submitted = false;
          },
          error => {
            this.showError("an error occurred");
            this.submitted = false;
          }
        );
      } else {
        let obs = this.rest.post('/EDASProcess', data).subscribe(
          d => {
            if (!d)
              this.dialogRef.close()
            else {
              if (!('error' in d))
                this.dialogRef.close()
              else
                this.showError("an error occurred");
            }

            this.submitted = false;
          },
          error => {
            console.log('error');
            this.showError("an error occurred");
            this.submitted = false;
          }
        );
      }
    }
  }

  isValid() {
    return this.overallDataStatus && this.budgetDataStatus;
  }

}

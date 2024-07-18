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
import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TextboxQuestion } from '../Common/question-textbox';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { Validators } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { ProcessDBO } from '../Common/ProcessDBO';

@Component({
  selector: 'app-process-edit-dialog',
  templateUrl: './process-edit-dialog.component.html',
  styleUrls: ['./process-edit-dialog.component.css']
})
export class ProcessEditDialogComponent implements OnInit {

  process: ProcessDBO;

  questions: any[];
  formData: Object;
  dataStatus: boolean = false;

  loaded: boolean = false;
  submitted: boolean = false;
  files: FileList = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ProcessEditDialogComponent>,
    private rest: RestService,
    private questionGenerator: QuestionGeneratorService,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar) {
  }

  generateQuestions() {

    let parentQuestion = null;
    if (this.data.id) {
      this.process = this.data;
      parentQuestion = this.questionGenerator.getDropdownQuestion(
        '/Process/parentfor/' + this.process.id,
        d => d['id'],
        d => d['extern_id'] + ' ' + d['name'],
        {
          key: 'parent_id',
          label: 'Parent',
          value: this.process ? this.process.parent_id : undefined,
          validators: [],
          order: 1
        }
      )
    } else {
      parentQuestion = this.questionGenerator.getDropdownQuestion(
        '/Process',
        d => d['id'],
        d => d['extern_id'] + ' ' + d['name'],
        {
          key: 'parent_id',
          label: 'Parent',
          value: this.process ? this.process.parent_id : undefined,
          validators: [],
          order: 1
        }
      )
    }

    this.questions = [
      new TextboxQuestion({
        key: 'extern_id',
        label: 'Identification',
        value: this.process ? this.process.extern_id : undefined,
        validators: [Validators.required], //TODO add id-validator
        order: 2
      }),
      new TextboxQuestion({
        key: 'name',
        label: 'Name',
        value: this.process ? this.process.name : undefined,
        validators: [Validators.required], //TODO add id-validator
        order: 2
      }),
      this.questionGenerator.getDropdownQuestion(
        '/Spd',
        d => d['id'],
        d => d['name'],
        {
          key: 'spd_id',
          label: 'SPD',
          value: this.process ? this.process.spd_id : undefined,
          validators: [Validators.required],
          order: 1
        }
      ),
      this.questionGenerator.getDropdownQuestion(
        '/Activity',
        d => d['id'],
        d => d['extern_id'] + ' ' + d['title'],
        {
          key: 'activity_id',
          label: 'Activity',
          value: this.process ? this.process.activity_id : undefined,
          validators: [Validators.required],
          order: 1
        }
      ),
      parentQuestion,
      this.questionGenerator.getDropdownQuestion(
        "/OLCAProcessFiltered",
        d => d['id'],
        d => d['name'],
        {
          key: 'olca_id',
          label: 'ILCD Data',
          value: this.process ? this.process.olca_id : undefined,
          validators: [],
          order: 1
        }
      )
    ]
    Promise.all(this.questions).then(questions => {
      this.questions = questions
      this.loaded = true;
    })
  }

  ngOnInit() {
    this.generateQuestions()
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  validation(form) {
    this.formData = form.value;
    this.dataStatus = form.valid;
  }

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

  fileChanged(event) {
    this.files = event.files
  }

  submit() {
    if (this.isValid()) {
      this.submitted = true;
      let data = this.formData;
      if (this.process) {
        let obs = this.rest.put('/Process/' + this.process.id, data).subscribe(
          d => {
            if (!d) {
              this.dialogRef.close()
            } else {
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
        let obs = this.rest.post('/Process', data).subscribe(
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
          });
      }
    }
  }

  isValid() {
    return this.dataStatus;
  }


}

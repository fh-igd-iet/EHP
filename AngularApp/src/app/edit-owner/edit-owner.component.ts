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
import { Component, OnInit, ChangeDetectorRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TextboxQuestion } from '../Common/question-textbox';
import { UniqueDBValidator } from '../Common/customValidators';
import { Validators } from '@angular/forms';
import { OwnerDBO } from '../Common/OwnerDBO';

@Component({
  selector: 'app-edit-owner',
  templateUrl: './edit-owner.component.html',
  styleUrls: ['./edit-owner.component.css']
})
export class EditOwnerComponent implements OnInit {

  owner: OwnerDBO;

  loaded: boolean = false;
  questions: any[];
  dataStatus: boolean = false;
  formData: Object;

  submitted: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<EditOwnerComponent>,
    private rest: RestService,
    private questionGenerator: QuestionGeneratorService,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar) {
  }

  generateQuestions() {
    if (this.data.id)
      this.owner = this.data;
    this.questions = [
      new TextboxQuestion({
        key: 'name',
        label: 'Name',
        value: this.owner ? this.owner.name : undefined,
        validators: [Validators.required],
        asyncValidators: [
          new UniqueDBValidator(this.rest,
            this.owner ? [this.owner.name] : [],
            '/Owners/unique')],
        order: 1
      })
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
    this.dataStatus = form.status == 'VALID';
  }

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

  submit() {
    if (this.isValid()) {
      this.submitted = true;
      let data = this.formData;
      if (this.owner) {
        let obs = this.rest.put('/Owners/' + this.owner.id, data).subscribe(
          d => {
            if (!('error' in data))
              this.dialogRef.close()
            else
              this.showError("an error occurred");
            this.submitted = false;
          },
          error => {
            this.showError("an error occurred");
            this.submitted = false;
          }
        );
      } else {
        let obs = this.rest.post('/Owners', data).subscribe(
          d => {
            if (!('error' in data))
              this.dialogRef.close()
            else
              this.showError("an error occurred");
            this.submitted = false;
          },
          error => {
            this.showError("an error occurred");
            this.submitted = false;
          }
        );
      }
    }
  }

  isValid() {
    return this.dataStatus;
  }

}

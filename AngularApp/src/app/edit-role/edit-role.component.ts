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
import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TextboxQuestion } from '../Common/question-textbox';
import { UniqueDBValidator } from '../Common/customValidators';
import { Validators } from '@angular/forms';
import { RoleDBO } from '../Common/RoleDBO';

@Component({
  selector: 'app-edit-role',
  templateUrl: './edit-role.component.html',
  styleUrls: ['./edit-role.component.css']
})
export class EditRoleComponent implements OnInit {

  role: RoleDBO;

  loaded: boolean = false;
  questions: any[];
  dataStatus: boolean = false;
  formData: Object;

  submitted: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<EditRoleComponent>,
    private rest: RestService,
    private questionGenerator: QuestionGeneratorService,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar) {
  }

  generateQuestions() {
    if (this.data.id)
      this.role = this.data;
    this.questions = [
      new TextboxQuestion({
        key: 'name',
        label: 'Group',
        value: this.role ? this.role.name : undefined,
        validators: [Validators.required],
        asyncValidators: [
          new UniqueDBValidator(this.rest,
            this.role ? [this.role.name] : [],
            '/Roles/unique')],
        order: 1
      }),
      this.questionGenerator.getChipsQuestion(
        '/Permissions/all',
        d => d['id'],
        d => d['name'],
        {
          key: 'permission_ids',
          validation: [],
          label: 'Permissions',
          value: this.role ? this.role.permission_ids : undefined,
          acceptNewChips: false,
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
      if (this.role) {
        let obs = this.rest.put('/Roles/' + this.role.id, data).subscribe(
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
        let obs = this.rest.post('/Roles', data).subscribe(
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

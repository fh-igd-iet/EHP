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
import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserDBO } from '../Common/UserDBO';
import { TextboxQuestion } from '../Common/question-textbox';
import { Validators } from '@angular/forms';
import { StringMatchingValidator, UniqueDBValidator } from '../Common/customValidators';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {

  user: UserDBO;

  loaded: boolean = false;
  questions: any[];
  dataStatus: boolean = false;
  formData: Object;

  submitted: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<EditUserComponent>,
    private rest: RestService,
    private questionGenerator: QuestionGeneratorService,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar) {
  }

  generateQuestions() {
    if (this.data.id)
      this.user = this.data;
    this.questions = [
      new TextboxQuestion({
        key: 'login',
        label: 'Login',
        value: this.user ? this.user.login : undefined,
        validators: [Validators.required],
        asyncValidators: [
          new UniqueDBValidator(this.rest,
            this.user ? [this.user.login] : [],
            '/User/unique')],
        order: 1
      }),
      new TextboxQuestion({
        key: 'password',
        label: 'Password',
        type: 'password',
        autocomplete: 'new-password',
        validators: !this.user ? [
          Validators.required/*,
          Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}')*/
        ]
          :
          [/*Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}')*/],
        errorMessages: {
          'pattern': 'Your password needs to be at least 8 characters long,\n\
                      containing upper- and lowercase characters, numbers \n\
                      as well as special characters($@$!%*?&).'
        },
        order: 2
      }),
      new TextboxQuestion({
        key: 'repeatPassword',
        label: 'repeat Password',
        type: 'password',
        validators: [
          new StringMatchingValidator('password')
        ],
        errorMessage: {
          'matchingError:': 'The passwords do not match'
        }
      })

    ]
    if (this.rest.can("user_management_edit")) {
      this.questions.push(this.questionGenerator.getChipsQuestion(
        '/Roles',
        d => d['id'],
        d => d['name'],
        {
          key: 'role_id',
          validation: [],
          label: 'Group',
          value: this.user ? this.user.role_ids : undefined,
          acceptNewChips: false,
          order: 1
        }))
    }

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
      if (this.user) {
        let obs = this.rest.put('/User/' + this.user.id, data).subscribe(
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
        let obs = this.rest.post('/User', data).subscribe(
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

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






import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { TextboxQuestion } from '../Common/question-textbox';
import { Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css']
})
export class LoginFormComponent implements OnInit {

  questions: any;
  valid: boolean;
  data: any;
  passwordValid: boolean = true;

  constructor(private rest: RestService,
    private router: Router) {

    this.questions = [
      new TextboxQuestion({
        key: 'login',
        label: 'Login',
        validators: [Validators.required],
        order: 2
      }),
      new TextboxQuestion({
        key: 'password',
        label: 'Password',
        type: 'password',
        validators: [Validators.required],
        order: 3
      })]
  }

  ngOnInit() {
    if(this.rest.logedin){
      this.router.navigate(['/fsdoverview']);
    }
  }

  validate(form) {
    this.valid = form.valid;
    this.data = form.value;
  }

  submit() {
    if (this.valid) {
      this.rest.post("/Auth", this.data).subscribe(
        next => {
          this.passwordValid = true;
          //this.dialogRef.close();
          this.router.navigate(['/'])
        },
        error => {
          this.passwordValid = false;
        }
      );
    }
  }
}

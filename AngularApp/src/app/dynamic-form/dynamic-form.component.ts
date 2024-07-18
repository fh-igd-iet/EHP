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
import { Component, Input, Output, OnInit, EventEmitter, SimpleChange, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { QuestionBase } from '../Common/question-base';
import { QuestionControlService } from '../question-control.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css']
})
export class DynamicFormComponent implements OnInit {

  _submittable: boolean = true;
  _questions: QuestionBase<any>[] = [];
  _formValid: boolean = false;
  _form: UntypedFormGroup;
  //@Input() questions: QuestionBase<any>[] = [];
  @Output() onSubmit: EventEmitter<any> = new EventEmitter();
  @Output() onValidationChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() onFileChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() onFormGroupChanged: EventEmitter<UntypedFormGroup> = new EventEmitter<UntypedFormGroup>();
  @Output() onFormValueChanged: EventEmitter<UntypedFormGroup> = new EventEmitter<UntypedFormGroup>();
  //form: FormGroup;
  payLoad = '';
  validQuestions: boolean = true;

  subs:Subscription[] = []

  constructor(private ref: ChangeDetectorRef,
    private qcs: QuestionControlService) { }

  ngOnInit() {
  }

  @Input()
  set questions(questions: QuestionBase<any>[]) {
    if(this.subs.length > 0)
      this.subs.forEach(s=>{
        s.unsubscribe()
      })
    console.log("new questions")
    this.validQuestions = false;
    setTimeout(() => this.validQuestions = true, 1);
    this._questions = questions;
    this._formValid = false;
    this.ref.markForCheck();
    this.ref.detectChanges();
  }

  get questions() {
    return this._questions;
  }

  @Input()
  set submittable(submittable: boolean) {
    this._submittable = submittable;
  }

  get form() {
    if (!this._formValid) {
      this._form = this.qcs.toFormGroup(this._questions);
      this.subs.push(this._form.statusChanges.subscribe(status => {
        this.onValidationChanged.emit(this._form)
      }))
      this.subs.push(this._form.valueChanges.subscribe(v => {
          this.onFormValueChanged.emit(this._form);
      }));
      this.onValidationChanged.emit(this._form);
      this._formValid = true;
      this.onFormGroupChanged.emit(this._form);
    }
    return this._form
  }

  setValue(key: string, v: any) {
    this.form.controls[key].setValue(v, {
      onlySelf: false,
      emitEvent: true
    });
    this.ref.markForCheck();
    this.ref.detectChanges();
  }

  setDisabled(key: string, v: boolean) {
    if (v)
      this.form.controls[key].disable();
    else
      this.form.controls[key].enable();
  }

  submit() {
    this.onSubmit.emit(this.form.value);
  }

  emitFileChange(data) {
    this.onFileChanged.emit(data);
  }

  update() {
    this.ref.markForCheck();
  }
}
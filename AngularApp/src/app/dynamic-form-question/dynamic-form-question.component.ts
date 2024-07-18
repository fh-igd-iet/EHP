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
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

import { QuestionBase } from '../Common/question-base';

@Component({
  selector: 'app-question',
  templateUrl: './dynamic-form-question.component.html',
  styleUrls: ['./dynamic-form-question.component.css']
})
export class DynamicFormQuestionComponent implements OnInit {
  @Input() question: QuestionBase<any>;
  @Input() form: UntypedFormGroup;
  @Output() onFileChanged: EventEmitter<any> = new EventEmitter<any>()
  label: string = "";
  fileName: string = "";

  ngOnInit() {
    this.label = this.question.label;
  }
  handleFileInput(key: string, files: FileList) {
    if (this.question.controlType == 'file') {
      this.fileName = this.form.value[this.question.key].replace(/^.*[\\\/]/, '')
    }
    this.onFileChanged.emit({ key: key, files: files });
  }
  getErrors(key: string) {
    if (!(key in this.form.controls))
      return []
    if (!('errors' in this.form.controls[key]))
      return []
    let errorKeys = Object.keys(this.form.controls[key].errors);
    let errorMessages = []
    for (let ek of errorKeys) {
      if (ek in this.question.errorMessages) {
        errorMessages.push(this.question.errorMessages[ek]);
      } else {
        let msg = this.form.controls[key].errors[ek]
        errorMessages.push(msg)
      }
    }
    return errorMessages;
  }
  get isValid() { return this.form.controls[this.question.key].valid; }
}

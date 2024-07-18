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
import { FileQuestion } from '../Common/question-file';
import { Validators } from '@angular/forms';
import { RestService } from '../rest.service';

@Component({
  selector: 'app-ilcd-upload',
  templateUrl: './ilcd-upload.component.html',
  styleUrls: ['./ilcd-upload.component.css']
})
export class IlcdUploadComponent implements OnInit {

  questions: any[];
  uploading: boolean = false;
  validForm: boolean = false;
  validFile: boolean = false;
  data: any = [];
  files: FileList;

  constructor(private rest: RestService) { }

  ngOnInit() {
    this.questions = [
      new FileQuestion({
        key: 'file',
        label: 'ILCD-Zip-File',
        value: undefined,
        validators: [Validators.required],
        order: 1
      })]
  }

  validationChanged(event) {
    this.validForm = event.status == 'VALID';
    this.data = event.value;
  }

  fileChanged(event) {
    this.files = event.files;
    this.validFile = this.files.length == 1;

  }

  valid() {
    return this.validForm && this.validFile;
  }

  submit() {
    if (this.valid()) {
      this.uploading = true;
      this.rest.uploadILCDFile(this.files.item(0)).subscribe(
        (data: Object) => {
          this.uploading = false;
        },
        error => {
          this.uploading = false;
        }
      );
    }
  }

}

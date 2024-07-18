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
import { ChangeDetectorRef } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { EDASProcessOverviewComponent } from '../edas-process-overview/edas-process-overview.component';

@Component({
  selector: 'app-excel-upload',
  templateUrl: './excel-upload.component.html',
  styleUrls: ['./excel-upload.component.css']
})
export class ExcelUploadComponent implements OnInit {

  questions: any[];
  uploading: boolean = false;
  validForm: boolean = false;
  validFile: boolean = false;
  data: any = [];
  files: FileList;
  fileNames: string[] = []

  @ViewChild(EDASProcessOverviewComponent) processOverview: EDASProcessOverviewComponent;

  constructor(private rest: RestService,
    private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.questions = [
      new FileQuestion({
        key: 'file',
        label: 'Excel-File',
        value: undefined,
        multiple: true,
        validators: [Validators.required],
        order: 1
      })]
  }

  validationChanged(event) {
    this.validForm = event.status == 'VALID';
    this.data = event.value;
  }

  fileChanged(event) {
    console.warn('fileChanged')
    let files = event.files
    this.fileNames = []
    for (let i = 0; i < files.length; i++) {
      this.fileNames.push(files[i].name)
    }
    console.warn(this.fileNames)
    this.files = event.files;
    this.validFile = this.files.length >= 1;

    this.cd.detectChanges()

  }

  valid() {
    return this.validForm && this.validFile;
  }

  submit() {
    if (this.valid()) {
      this.fileNames = []
      this.uploading = true;
      window.setTimeout(() => {
        this.uploading = false;
        this.processOverview.refresh();
      }, 2000);
    }
  }

}

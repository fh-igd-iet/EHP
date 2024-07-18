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
import { Component, OnInit, Inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { OLCAProcessDBO } from '../Common/OLCADBO';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TextboxQuestion } from '../Common/question-textbox';
import { Validators } from '@angular/forms';
import { TechnologyValidator } from '../Common/customValidators';
import { FileQuestion } from '../Common/question-file';
import { DropdownQuestion } from '../Common/question-dropdown';
import { DomSanitizer } from '@angular/platform-browser';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { toBase64 } from '../Common/FileHandling';

@Component({
  selector: 'app-cs1-edit-dialog',
  templateUrl: './cs1-edit-dialog.component.html',
  styleUrls: ['./cs1-edit-dialog.component.css']
})
export class Cs1EditDialogComponent implements OnInit {

  process: OLCAProcessDBO;
  lastEdit: string;
  lastEditId: number;

  questions: any[];
  formData: FormData;
  dataStatus: boolean = false;

  loaded: boolean = false;
  submitted: boolean = false;
  files: FileList = null;
  fileQuestion: FileQuestion = null;
  nameQuestion: TextboxQuestion = null;

  technology_id: number = null;

  @ViewChild(DynamicFormComponent)
  form!: DynamicFormComponent;

  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<Cs1EditDialogComponent>,
    private rest: RestService,
    private questionGenerator: QuestionGeneratorService,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer) {

    this.process = data;
  }

  generateQuestions() {

    this.fileQuestion = new FileQuestion({
      key: 'file',
      label: 'ILCD-File',
      value: undefined,
      preview: null,
      accept: 'zip,application/zip',
      validators: [],
      order: 1
    });

    this.nameQuestion = new TextboxQuestion({
      key: 'name',
      label: 'Name',
      value: this.process ? this.process.name : undefined,
      validators: [Validators.required],
      order: 2
    })

    this.questions = [
      this.fileQuestion,
      this.nameQuestion,
      new DropdownQuestion({
        key: 'confidentiality',
        label: 'Confidentiality',
        value: this.process ? this.process.confidentiality : "COA, confidential",
        validators: [Validators.required],
        sort: false,
        options: [
          {
            key: "Private (no COA)",
            value: "Private (no COA)"
          },
          {
            key: "COA, confidential",
            value: "COA, confidential"
          },
          {
            key: "COA, non-confidential",
            value: "COA, non-confidential",
          }/*,
          {
            key: "Shared",
            value: "Shared",
          }*/
        ],
        order: 3
      }),
      this.questionGenerator.getDropdownQuestion(
        '/EditableOwners',
        d => d['owner_id'],
        d => d['name'],
        {
          key: 'owner_id',
          label: 'Owner',
          value: this.process ? this.process.owner_id : undefined,
          validators: [Validators.required],
          order: 4
        }
      ),
    ]

    if (this.process) {
      this.questions.push(
        this.questionGenerator.getDropdownQuestion(
          '/Process/ofowner',
          d => d['id'],
          d => d['name'],   //d['id'] + ' - ' +  d['olca_id']                      
          {
            key: 'technology_id',
            label: this.process && this.process.verified ? 'Technologies' : 'Technologies (must be verified first)',
            value: this.process ? this.process.technology_id : undefined,
            validators: this.process ? [
              new TechnologyValidator(this.rest, '/Process/', this.process.technology_id)
            ] : undefined,
            order: 5
          }
        )
      );
    }

    Promise.all(this.questions).then(questions => {
      this.questions = questions

      // set default owner of no owner was set
      for (let question of this.questions) {
        if (question.order == 4) {
          if (question.options.length > 0 && question.value == undefined) {
            question.value = question.options[0].key
          }
        }
      }

      this.loaded = true;
      this.cdRef.detectChanges();
      this.form.setDisabled('name', true);
      /*
      if (this.process.id) {
        this.form.setDisabled('file', true);
      }
      */
      if (this.process && !this.process.verified) {
        this.showError("Process not verified. Can't assign technology.");
        this.form.setDisabled('technology_id', true);
      }
      if (this.process) {
        this.form.setDisabled('owner_id', !this.process.owner_changeable)
      } 
    })
  }

  ngOnInit() {
    this.generateQuestions()
    if (this.process) {
      let options = {
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
        hour12: false
      } as const;

      if (this.process.edit_tstamp && this.process.edit_tstamp_tech) {
        let date = new Date(this.process.edit_tstamp.replace(' ', 'T'));
        let date_tech = new Date(this.process.edit_tstamp_tech.replace(' ', 'T'));
        if (date < date_tech) {
          this.lastEdit =new Intl.DateTimeFormat('de-DE', options).format(date_tech);
          this.lastEditId = this.process.editor_id_tech;
        } else {
          this.lastEdit = new Intl.DateTimeFormat('de-DE', options).format(date)
          this.lastEditId = this.process.editor_id
        }
      }
    }
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  validation(form) {
    this.formData = form.value;
    this.dataStatus = form.valid &&
      this.form.form.controls['name'].value != null &&
      this.form.form.controls['name'].value != "";

    // technology can only be set if process is verified by a QA member
    if (this.process) {
      let technology_only_if_verified =
        (this.form.form.controls['technology_id'].value != "" && this.process.verified) ||
        (this.form.form.controls['technology_id'].value == "" && !this.process.verified);
      this.dataStatus &&= technology_only_if_verified;
    } else {
      this.dataStatus &&= this.form.form.controls['technology_id'].value == "";
    }

    // if only warning and no other errors, set status to valid 
    let name_valid = this.form.form.controls['name'].value != null && this.form.form.controls['name'].value != "";
    let warning = this.process ? this.form.form.controls['technology_id'].errors : true;  // not sure about this else...
    if (warning && name_valid) {
      this.dataStatus = true;
    }
  }

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

  onFileChanged(event) {
    this.files = event.files
    this.fileQuestion.preview = "reading file...";
    this.rest.tryUploadILCDProcess(this.files.item(0)).subscribe(
      (data: { error: boolean, message: string, id: number, name: string }) => {
        if (data.error) {
          this.showError(data.message);
          this.submitted = false;
          this.fileQuestion.preview = data.message;
          this.form.form.controls['name'].setValue(this.process ? this.process.name : null);
          this.files = null;
        } else {
          this.fileQuestion.preview = "valid";
          this.form.form.controls['name'].setValue(data.name);
        }

      },
      error => {
        this.showError("An unknown error occured.");
        this.submitted = false;
        this.fileQuestion.preview = "An unknown error occured.";
        this.form.form.controls['name'].setValue(this.process ? this.process.name : null);
        this.cdRef.detectChanges();
        this.files = null;
      })
  }

  async submit() {
    if (this.isValid()) {
      this.submitted = true;
      this.dialogRef.disableClose = true;
      let data = this.formData;
      if (this.files && this.files.length == 1)
        data['file'] = (await toBase64(this.files.item(0)))
      if (this.process) {
        let obs = this.rest.put('/OLCAProcess/' + this.process.id, data).subscribe(
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
            this.dialogRef.disableClose = false;
          },
          error => {
            this.showError("an error occurred");
            this.submitted = false;
            this.dialogRef.disableClose = false;
          }
        );
      } else {
        let obs = this.rest.post('/OLCAProcess', data).subscribe(
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
            this.dialogRef.disableClose = false;
          },
          error => {
            this.showError("an error occurred");
            this.submitted = false;
            this.dialogRef.disableClose = false;
          });
      }
    }
  }

  isValid() {
    return this.dataStatus;
  }

}

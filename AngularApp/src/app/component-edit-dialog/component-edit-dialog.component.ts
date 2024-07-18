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
import { Component, OnInit, Inject, Sanitizer } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TextboxQuestion } from '../Common/question-textbox';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { Validators } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentDBO } from '../Common/ComponentDBO';
import { FileQuestion } from '../Common/question-file';
import { DomSanitizer } from '@angular/platform-browser';
import { DropdownQuestion } from '../Common/question-dropdown';

@Component({
  selector: 'app-component-edit-dialog',
  templateUrl: './component-edit-dialog.component.html',
  styleUrls: ['./component-edit-dialog.component.css']
})
export class ComponentEditDialogComponent implements OnInit {

  component: ComponentDBO = null;

  questions: any[];
  formData: Object;
  dataStatus: boolean = false;

  loaded: boolean = false;
  submitted: boolean = false;
  files: FileList = null;

  activity_set: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ComponentEditDialogComponent>,
    private rest: RestService,
    private questionGenerator: QuestionGeneratorService,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer) {
  }

  filePreview() {
    if (!this.component || !this.component.image_id)
      return null;
    return this.sanitizer.bypassSecurityTrustHtml(`
    <img style="max-width:300px;max-height:300px;"
      src="${this.rest.imageURL(this.component.image_id)}">
    `)
  }

  generateQuestions() {
    if (this.data.id) {
      this.component = this.data;
    }
    this.questions = [
      new TextboxQuestion({
        key: 'demo_nr',
        label: 'Demo. Nr',
        value: this.component ? this.component.demo_nr : undefined,
        validators: [Validators.required], //TODO add id-validator
        order: 2
      }),
      new TextboxQuestion({
        key: 'name',
        label: 'Name',
        value: this.component ? this.component.name : undefined,
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
          value: this.component ? this.component.spd_id : undefined,
          validators: [Validators.required],
          order: 1
        }
      ),
      this.questionGenerator.getChipsQuestion('/Activity',
        d => d['id'],
        d => d['title'],
        {
          key: 'activity_id_a',
          label: 'Activities (Multi Functional Fuselage & Cabin)',
          value: this.component ? this.component.activity_id_a : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }
      ),
      this.questionGenerator.getChipsQuestion('/Activity',
        d => d['id'],
        d => d['title'],
        {
          key: 'activity_id_b',
          label: 'Activities (Advanced Wing Design)',
          value: this.component ? this.component.activity_id_b : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }
      ),
      this.questionGenerator.getChipsQuestion('/Activity',
        d => d['id'],
        d => d['title'],
        {
          key: 'activity_id_c',
          label: 'Activities (Major Systems Treatments & Equip. Integr.)',
          value: this.component ? this.component.activity_id_c : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }
      ),
      this.questionGenerator.getChipsQuestion('/Activity',
        d => d['id'],
        d => d['title'],
        {
          key: 'activity_id_d',
          label: 'Activities (Engine)',
          value: this.component ? this.component.activity_id_d : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }
      ),
      this.questionGenerator.getChipsQuestion('/Activity',
        d => d['id'],
        d => d['title'],
        {
          key: 'activity_id_e',
          label: 'Activities (Future connected Factory)',
          value: this.component ? this.component.activity_id_e : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }
      ),
      new DropdownQuestion({
        key: 'is_demo',
        label: 'Demonstrator?',
        value: this.component ? (this.component.is_demo ? 1 : 2) : undefined,
        options: [{ key: 1, value: 'Yes' }, { key: 2, value: 'No' }],
        validators: [Validators.required]
      }),
      new FileQuestion({
        key: 'file',
        label: 'Image',
        value: undefined,
        preview: this.filePreview(),
        validators: [],
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

    this.dataStatus = form.valid;
  }

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

  fileChanged(event) {
    this.files = event.files;
  }

  submit() {
    if (this.isValid() && this.files && this.files.length == 1) {
      this.submitted = true;
      this.rest.uploadImageFile(this.files.item(0)).subscribe(
        (data: { image_id?: number, error?: string }) => {
          if ('error' in data) {
            this.showError("Failed to upload image.");
            this.submitted = false;
          } else {
            this.submitData(data.image_id);
          }
        },
        error => {
          this.showError("Failed to upload image.");
          this.submitted = false;
        }
      );
    } else {
      this.submitData();
    }
  }

  submitData(image_id: number = null) {

    if (this.isValid()) {
      this.submitted = true;
      let data = this.formData;
      if (image_id != null)
        data['image_id'] = image_id;
      else if (this.component)
        data['image_id'] = this.component.image_id;
      if (this.component) {
        let obs = this.rest.put('/Component/' + this.component.id, data).subscribe(
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
            this.showError("an error occurred");
            this.submitted = false;
          }
        );
      } else {
        let obs = this.rest.post('/Component', data).subscribe(
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

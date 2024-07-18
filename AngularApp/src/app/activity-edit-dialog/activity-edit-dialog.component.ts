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
import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TextboxQuestion } from '../Common/question-textbox';
import { RestService } from '../rest.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { isNumberValidator } from '../Common/validators';
import { Validators } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { ActivityDBO } from '../Common/ActivityDBO';
import { DropdownQuestion } from '../Common/question-dropdown';

@Component({
  selector: 'app-activity-edit-dialog',
  templateUrl: './activity-edit-dialog.component.html',
  styleUrls: ['./activity-edit-dialog.component.css']
})
export class ActivityEditDialogComponent implements OnInit {

  activity: ActivityDBO;

  questionsOverall: any[];
  questionsMajorActionItems: any[];
  questionsDemos: any[];
  overallDataStatus: boolean = false;
  majorActionItemsDataStatus: boolean = false;
  demoDataStatus: boolean = false;
  overallData: Object;
  majorActionItemsData: Object;
  demoData: Object;

  loaded: boolean = false;
  submitted: boolean = false;
  ownerOptions: Object[];

  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ActivityEditDialogComponent>,
    private rest: RestService,
    private questionGenerator: QuestionGeneratorService,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar) {
  }

  generateQuestions() {
    if (this.data.id)
      this.activity = this.data;
    this.questionsOverall = [
      new TextboxQuestion({
        key: 'extern_id',
        label: 'Identification',
        value: this.activity ? this.activity.extern_id : undefined,
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
          value: this.activity ? this.activity.spd_id : undefined,
          validators: [Validators.required],
          order: 1
        }
      ),
      this.questionGenerator.getDropdownQuestion(
        '/AircraftPart/flat',
        d => d['id'],
        d => d['part'],
        {
          key: 'aircraft_part_id',
          label: 'Aircraft Part',
          value: this.activity ? this.activity.aircraft_part_id : undefined,
          validators: [Validators.required],
          order: 1
        }
      ),
      new TextboxQuestion({
        key: 'title',
        label: 'Title',
        value: this.activity ? this.activity.title : undefined,
        validators: [Validators.required],
        order: 3
      }),
      this.questionGenerator.getDropdownQuestion(
        '/EditableOwners',
        d => d['owner_id'],
        d => d['name'],
        {
          key: 'owner_id',
          label: 'Owner',
          value: this.activity ? this.activity.owner_id : undefined,
          validators: [Validators.required],
          order: 1
        }
      ),
      new TextboxQuestion({
        key: 'validation_by',
        label: 'Technological validation by',
        value: this.activity ? this.activity.validation_by : undefined,
        validators: [],
        order: 4
      }),
      new TextboxQuestion({
        key: 'lci_analyst',
        label: 'LCI Modeller/LCI Analyst',
        value: this.activity ? this.activity.lci_analyst : undefined,
        validators: [],
        order: 4
      }),
      new TextboxQuestion({
        key: 'env_improvement',
        label: 'Environmeltal Improvement',
        value: this.activity ? this.activity.env_improvement : undefined,
        validators: [],
        order: 4
      }),
      new TextboxQuestion({
        key: 'ecolonomic_motivation',
        label: 'Ecolonomic Motivation',
        value: this.activity ? this.activity.ecolonomic_motivation : undefined,
        validators: [],
        order: 4
      })
    ]
    Promise.all(this.questionsOverall).then(questions => {
      this.questionsOverall = questions
      this.loaded = true;
    })

    let technology_parents = []
    if (this.activity) {
      technology_parents = this.activity.technology_ids.filter((d, i) => {
        if (!this.activity.technology_parents[i])
          return true;
        return false;
      })
    }
    console.log("TECH PARENTS")
    console.log(technology_parents)
    this.questionsDemos = [
      this.questionGenerator.getChipsQuestion('/Component',
        d => d['id'],
        d => d['name'],
        {
          key: 'components_a',
          label: 'Multi Functional Fuselage & Cabin',
          value: this.activity ? this.activity.comp_id_a : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }),
      this.questionGenerator.getChipsQuestion('/Component',
        d => d['id'],
        d => d['name'],
        {
          key: 'components_b',
          label: 'Advanced Wing Design',
          value: this.activity ? this.activity.comp_id_b : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }),
      this.questionGenerator.getChipsQuestion('/Component',
        d => d['id'],
        d => d['name'],
        {
          key: 'components_c',
          label: 'Major Systems Treatments & Equip. Integr.',
          value: this.activity ? this.activity.comp_id_c : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }),
      this.questionGenerator.getChipsQuestion('/Component',
        d => d['id'],
        d => d['name'],
        {
          key: 'components_d',
          label: 'Engine',
          value: this.activity ? this.activity.comp_id_d : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }),
      this.questionGenerator.getChipsQuestion('/Component',
        d => d['id'],
        d => d['name'],
        {
          key: 'components_e',
          label: 'Future connected Factory',
          value: this.activity ? this.activity.comp_id_e : undefined,
          acceptNewChips: false,
          validators: [],
          order: 8
        }),
      this.questionGenerator.getChipsQuestion('/Process',
        d => d['id'],
        d => d['name'],
        {
          key: 'technology_ids',
          label: 'Technologies',
          value: technology_parents,
          acceptNewChips: false,
          validators: [],
          order: 8
        })
    ]

    Promise.all(this.questionsDemos).then(questions => {
      this.questionsDemos = questions
      this.loaded = true;
    })

    let options = [
      { value: '', key: 0 },
      { value: 'x', key: 1 },
      { value: 'xx', key: 2 },
      { value: 'xxx', key: 3 }
    ]
    let majorActionItems = {
      'Composites': 'composites',
      'AdditiveManifacturing': 'additive_manufacturing',
      'Machining': 'machining',
      'Hazards & Regulated Substances (REACh)': 'hazards_reg_substances',
      'Recycling': 'recycling',
      'Digital Materials': 'digital_materials',
      'Water': 'water',
      'Structural Health Monitoring (SHM)': 'struct_health_monitoring',
      'Storage, Supply, Transmission Hybrid Electrical A/C': 'storage_supply_transmission_electrical',
      'Storage, Supply, Transmission Material Flow': 'storage_supply_transmission_material',
      'CIT & Socio-economic Processes': 'socio_economic'
    }
    this.questionsMajorActionItems = []
    for (let key in majorActionItems) {
      let val = 0
      if (this.activity)
        val = Math.round(this.activity[majorActionItems[key]] * 3)

      this.questionsMajorActionItems.push(
        new DropdownQuestion({
          key: majorActionItems[key],
          label: key,
          value: val,
          order: 1,
          validators: [isNumberValidator(), Validators.min(0)],
          options: options
        })
      )
    }

    this.questionsMajorActionItems.push(
      new TextboxQuestion({
        key: 'comment',
        label: 'Comment',
        value: this.activity ? this.activity.comment : undefined,
        validators: [],
        order: 4
      }))

    Promise.all(this.questionsMajorActionItems).then(questions => {
      this.questionsMajorActionItems = questions
      this.loaded = true;
    })
  }

  ngOnInit() {
    this.generateQuestions()
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  validationOverall(form) {
    this.overallData = form.value;
    this.overallDataStatus = form.valid;
  }

  validationMajorActionItems(form) {
    this.majorActionItemsData = form.value;
    this.majorActionItemsDataStatus = form.valid;
  }

  validationDemos(form) {
    this.demoData = form.value;
    this.demoDataStatus = form.valid;
  }

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

  submit() {

    if (this.isValid()) {
      this.submitted = true;
      let data = this.overallData;
      Object.assign(data, this.majorActionItemsData);
      Object.assign(data, this.demoData);
      if (this.activity) {
        let obs = this.rest.put('/Activity/' + this.activity.id, data).subscribe(
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
        let obs = this.rest.post('/Activity', data).subscribe(
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
    return this.overallDataStatus &&
      this.majorActionItemsDataStatus &&
      this.demoDataStatus;
  }

}

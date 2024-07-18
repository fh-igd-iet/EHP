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
import { Component, OnInit, ChangeDetectorRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { QuestionGeneratorService } from '../question-generator.service';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { MaterialListComponent } from '../material-list/material-list.component';
import { FormGroup } from '@angular/forms';
import { CompareImpactsBarchartComponent } from '../compare-impacts-barchart/compare-impacts-barchart.component';

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.css']
})
export class MaterialsComponent implements OnInit {

  chipsLoaded: boolean = false
  questionImpacts: any = []

  matChipsLoaded: boolean = false
  questionMaterials: any = []
  selectedMaterials: number[] = []
  selectedImpacts: string[] = []

  @ViewChild(MaterialListComponent, { static: true }) matList: MaterialListComponent;
  @ViewChildren(CompareImpactsBarchartComponent)
  matComp: QueryList<CompareImpactsBarchartComponent>;

  constructor(
    private questionGenerator: QuestionGeneratorService,
    private cd: ChangeDetectorRef
  ) {
    this.questionImpacts = [this.questionGenerator.getChipsQuestion('/impact/categories',
      d => d['name'],
      d => d['name'],
      {
        key: 'impact_ids',
        label: 'Impacts',
        value: '',
        validators: [],
        order: 1
      },
      d => d['results'],
      true)]
    Promise.all(this.questionImpacts).then(questions => {
      this.questionImpacts = questions
      this.chipsLoaded = true;
    })

    this.questionMaterials = [this.questionGenerator.getChipsQuestion('/impact/process',
      d => d['id'],
      d => d['name'],
      {
        key: 'material_ids',
        label: 'Materials',
        value: '',
        validators: [],
        order: 1
      },
      d => d['processList'],
      true)]
    Promise.all(this.questionMaterials).then(questions => {
      this.questionMaterials = questions
      this.matChipsLoaded = true;
    })
  }

  ngOnInit() {
  }

  impactsChanged(event) {
    if (typeof event.value.impact_ids == 'object') {
      this.selectedImpacts = event.value.impact_ids.map(d => d['key'])
      this.cd.detectChanges()
    }
  }

  materialsChanged(event) {
    this.selectedMaterials.length = 0
    this.selectedMaterials.push.apply(this.selectedMaterials, event)

    this.cd.detectChanges()
    this.cd.markForCheck()
    this.matComp.forEach(d => d.materialids = event)
  }

}

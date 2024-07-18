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
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ChipsQuestion } from '../Common/question-chips';
import { DropdownQuestion } from '../Common/question-dropdown';
import { QuestionGeneratorService } from '../question-generator.service';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { LCIAMethodDBO } from '../Common/LCIAMethodDBO';
import { RestService } from '../rest.service';
import { ColorcodingService } from '../colorcoding.service';
import { LocalStorageService } from '../local-storage.service';

@Component({
  selector: 'app-indicatorpicker',
  templateUrl: './indicatorpicker.component.html',
  styleUrls: ['./indicatorpicker.component.css']
})
export class IndicatorpickerComponent implements OnInit {
  loading: boolean = false;
  methods:LCIAMethodDBO[] = [];

  @ViewChild("methodForm", { static: true })
  methodForm: DynamicFormComponent;
  @ViewChild("indicatorForm", { static: true }) 
  indicatorForm: DynamicFormComponent;

  @Output() OnMethodsChanged = new EventEmitter<number[]>();
  @Output() OnIndicatorsChanged = new EventEmitter<string[]>();
  @Output() OnIndicatorIDsChanged = new EventEmitter<number[]>();

  // see [1]
  indicatorLookup:{[id:string]:number} = {}
  
  selectedMethods: number[] = []
  selectedIndicators: string[] = []

  questionIndicators: any;
  questionMethods: any;
  questionPresets: any;

  selectedGroup: string = '';
  indicatorGroups: any = {
    '1': {
      methods: [],
      indicators: []
    },
    '2': {
      methods: ['3'],
      indicators: [
        'EF 3.0 Acidification - 2017',                               
        'EF 3.0 Climate change - 2017' ,                             
        'EF 3.0 Climate change-Biogenic - 2017',                     
        'EF 3.0 Climate change-Fossil - 2017',                       
        'EF 3.0 Climate change-Land use and land use change - 2017', 
        'EF 3.0 Ecotoxicity, freshwater - 2017',                     
        'EF 3.0 Ecotoxicity, freshwater_inorganics - 2017',          
        'EF 3.0 Ecotoxicity, freshwater_metals - 2017',              
        'EF 3.0 Ecotoxicity, freshwater_organics - 2017',            
        'EF 3.0 EF-particulate Matter - 2017',                       
        'EF 3.0 Eutrophication marine - 2017',                       
        'EF 3.0 Eutrophication, freshwater - 2017',                  
        'EF 3.0 Eutrophication, terrestrial - 2107',                 
        'EF 3.0 Human toxicity, cancer - 2018',                      
        'EF 3.0 Human toxicity, cancer_inorganics - 2018',           
        'EF 3.0 Human toxicity, cancer_metals - 2018',               
        'EF 3.0 Human toxicity, cancer_organics - 2018',             
        'EF 3.0 Human toxicity, non-cancer - 2018',                  
        'EF 3.0 Human toxicity, non-cancer_inorganics - 2018',       
        'EF 3.0 Human toxicity, non-cancer_metals - 2018',           
        'EF 3.0 Human toxicity, non-cancer_organics - 2018',         
        'EF 3.0 Ionising radiation, human health - 2017',            
        'EF 3.0 Land use - 2017',                                    
        'EF 3.0 Ozone depletion - 2017',                             
        'EF 3.0 Photochemical ozone formation - human health - 2017',
        'EF 3.0 Resource use, fossils - 2017',                       
        'EF 3.0 Resource use, minerals and metals - 2017',           
        'EF 3.0 Water use - 2017'
      ]
    },
  }

  constructor(private questionGenerator: QuestionGeneratorService,
    private rest:RestService,
    private color:ColorcodingService,
    private lss:LocalStorageService) {

    this.questionIndicators = [new ChipsQuestion({
      key: 'result_indicators',
      label: 'LCIA Indicators',
      value: [],
      validators: [],
      order: 2,
      chips: []
    })]

    this.questionPresets = [
      new DropdownQuestion({
        key: 'preset',
        label: 'LCIA Indicator Group',
        value: '',
        validators: [],
        options: [
          { key: '2', value: 'EF 3.0' }
        ],
      }),
    ]

    this.questionMethods =[]
    this.rest.get("/process/lcia_methods").subscribe((methods:LCIAMethodDBO[])=>{
      /**
       * [1] sry for identifying indicators by name in the first place
       *      this needs to be refactored but i have no time.
       *      I hope that the indicator name is at least unique in the
       *      Datebase ;)
       */
      methods.forEach((m)=>
      {
        m.indicator_names.forEach((v,i)=>{
          this.indicatorLookup[v] = m.indicator_ids[i]
        })
      })
      this.loading = false
      this.methods = methods
      let chips = methods.map((method:LCIAMethodDBO)=>{
        return {
          key: method.id,
          value: method.name
        }
      })
      this.newMethods( this.lss.getSelectedMethods() )
      this.questionMethods = [new ChipsQuestion({
        key: 'lcia_method',
        label: 'LCIA Methods',
        value: this.lss.getSelectedMethods(),
        validators: [],
        order: 2,
        chips: chips
      })]
      this.methodForm.questions = this.questionMethods
      this.newIndicators( this.lss.getSelectedIndicators() )
      this.updateIndicatorChips()
    })
   }

  ngOnInit(): void {
  }

  newIndicators(indicators:string[])
  {
    let s1 = new Set<string>(indicators)
    let s2 = new Set<string>(this.selectedIndicators)
    let equal = s1.size == s2.size && [...s1].every((x) => s2.has(x))
    this.lss.saveIndicators(indicators)
    if(!equal)
    {
      this.selectedIndicators = indicators
      this.OnIndicatorsChanged.emit(this.selectedIndicators)
      // see [1]
      this.OnIndicatorIDsChanged.emit(this.selectedIndicators.map((n)=>this.indicatorLookup[n]))
    }
  }

  newMethods(methods:number[])
  {
    let s1 = new Set<number>(methods)
    let s2 = new Set<number>(this.selectedMethods)
    this.lss.saveMethods(methods)
    let equal = s1.size == s2.size && [...s1].every((x) => s2.has(x))
    if(!equal)
    {
      this.selectedMethods = methods
      this.OnMethodsChanged.emit(this.selectedMethods)
    }
  }

  indicatorsChanged(event) {
    if (typeof event.value.result_indicators == 'object') {
      this.newIndicators( event.value.result_indicators.map(r => r['key']) )
    } 
  }

  presetChanged(event) {
    let newPreset = '';
    let groupchanged = false;
    if (typeof event.value.preset == 'string') {
      newPreset = event.value.preset;
    }
    else
    {
      newPreset = '1'
    }
    if (this.selectedGroup != newPreset) {
      this.selectedGroup = newPreset;
      groupchanged = true;
    }

    if (groupchanged) {
      this.newMethods(
        this.indicatorGroups[this.selectedGroup]['methods'].map(e => parseInt(e))
      )
      this.questionMethods[0].value = this.questionMethods[0].chips.filter(c => this.selectedMethods.includes(c.key));
      this.methodForm.questions = this.questionMethods;
      this.updateIndicatorChips()
      this.questionIndicators[0].value = this.questionIndicators[0].chips.filter(c => this.indicatorGroups[this.selectedGroup]['indicators'].includes(c.value));
      this.newIndicators(this.questionIndicators[0].value.map(r => r['key']))
      this.indicatorForm.questions = this.questionIndicators
    }
  }

  methodChanged(event) {
    if (typeof event.value.lcia_method == 'object') {
      this.newMethods( event.value.lcia_method.map(r => r['key']).filter(v => v !== undefined) )
      this.updateIndicatorChips()
    }
  }

  updateIndicatorChips() {
    this.questionIndicators[0].chips = []
    for (let method of this.methods) {
      if (this.selectedMethods.includes(method.id)) {
        let chips = method.indicator_names.map(indicator => {
          return {
            'key': indicator,
            'value': indicator,
            'color': '#e0e0e0'
          }
        });
        this.questionIndicators[0].chips = this.questionIndicators[0].chips.concat(chips);
      }
    }
    let selected = new Set(this.selectedIndicators)
    this.questionIndicators[0].value = this.questionIndicators[0].chips.filter(val=>{
      return selected.has(val["key"])
    })
    this.newIndicators(this.questionIndicators[0].value.map(r => r['key']) )
    this.indicatorForm.questions = this.questionIndicators
  }

  updateChipColorsByPallet(palletname:string, defaultColor:string)
  {
    this.questionIndicators[0].chips.forEach(chip => {
      if (this.selectedIndicators.includes(chip.value)) {
        chip.color = this.color.sampleDistinctPallette(palletname, chip.value);
      } else {
        chip.color = defaultColor;
      }
    });
    this.indicatorForm.update();
  }
  
  setChipColors(color:string)
  {
    this.questionIndicators[0].chips.forEach(chip => {
      chip.color = color;
    });
    this.indicatorForm.update();
  }

}

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
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LocalStorageService } from '../local-storage.service';
import { DropdownQuestion } from '../Common/question-dropdown';
import { ACPartsAssembly } from '../Common/ACPartsAssembly';
import { TextboxQuestion } from '../Common/question-textbox';
import { RestService } from '../rest.service';
import { ChipsQuestion } from '../Common/question-chips';

@Component({
  selector: 'app-acparts-dialog',
  templateUrl: './acparts-dialog.component.html',
  styleUrls: ['./acparts-dialog.component.css']
})
export class AcpartsDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data,
  public dialogRef: MatDialogRef<AcpartsDialogComponent>,
  public lss:LocalStorageService,
  public rest:RestService) { }

  formData:FormData;
  submitted:boolean = false;
  questions:any[] = [];

  reference:number = 0;
  new_reference:number = 0;
  reference_unit:string = "";
  reference_loaded = false;

  ngOnInit(): void {
    this.rest.get("/process/"+this.data.tech_id).subscribe((res)=>{
      this.reference = parseFloat(res['reference']);
      this.new_reference = this.reference;
      this.reference_unit = res['reference_unit'];
      this.reference_loaded = true;
    })

    let chips = this.lss.getAssemblies().map(a => { 
      return {
        'key': a.name,
        'value': a.name,
        'color': "#C8FFB5"
      }
    })
    let values = this.lss.getAssembliesByTechId(this.data.tech_id).map(a => a.name)

    this.questions.push(new ChipsQuestion({
      key: 'assembly_chips',
      label: 'A/C-Parts Assembly Chips',
      value: values, // selected 
      chips: chips, // selection options 
      validators: [],
      order: 1,
      acceptNewChips: false
    }))

    this.questions.push(new TextboxQuestion({
      key: 'new_assembly',
      label: 'Create new Assembly',
      value: undefined,
      validators: [],
      order: 2
    }))
  }

  submit() {
    this.submitted = true;
    if(this.formData) {
      let id = this.data.tech_id
      let new_assembly = this.formData["new_assembly"]
      let assemblies_selected = this.lss.getAssembliesByTechId(id).map(a => a.name)
      let assemblies_updated = this.formData["assembly_chips"].map(a => a.value);

      if (!assemblies_updated.includes(undefined)) {
        assemblies_selected = assemblies_updated
      }
      
      if(new_assembly) {
        assemblies_selected.push(new_assembly);
        this.lss.setAssembly({
          name: new_assembly,
          results: {},
          amount_min: {},
          amount_max: {}
        })
      } 

      let scaling:number = this.new_reference/this.reference
      let assemblies:ACPartsAssembly[] = assemblies_selected.map(a => this.lss.getAssembly(a))
      this.lss.updateAssemblyResults(assemblies_selected, id)
      assemblies.forEach(asm => {
        if(asm && scaling) {
          asm.results[id] = scaling
          this.lss.setAssembly(asm)
        } else if (!scaling) {
          console.log("scaling factor could not be calculated.")
        }
      })
      this.dialogRef.close()
    }
  }

  isValid() {
    return true;
  }

  valueChanged(form:any) {
    this.formData = form.value
  }

}

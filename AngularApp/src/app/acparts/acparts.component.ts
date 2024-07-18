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
import { Component, OnInit, QueryList, ViewChild, ViewChildren, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ACPartsAssembly } from '../Common/ACPartsAssembly';
import { LocalStorageService } from '../local-storage.service';
import { Subscription } from 'rxjs';
import { RestService } from '../rest.service';
import { LcaResult } from '../Common/LcaResult';
import { IndicatorpickerComponent } from '../indicatorpicker/indicatorpicker.component';
import { ColorcodingService } from '../colorcoding.service';
import { BarchartComponent } from '../barchart/barchart.component';

interface Tablerow {
  process_name: string;
  process_reference: number;
  scaling: number;
}

@Component({
  selector: 'app-acparts',
  templateUrl: './acparts.component.html',
  styleUrls: ['./acparts.component.css']
})
export class AcpartsComponent implements OnInit {

  parseFloat = parseFloat;

  Object = Object;
  loaded:boolean = false;

  @ViewChildren('amountInputFields') amountInputFields!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('minInputFields') minInputFields!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('maxInputFields') maxInputFields!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('sliderInputFields') sliderInputFields!: QueryList<ElementRef<HTMLInputElement>>;
  
  @ViewChildren('barchart') barcharts:QueryList<BarchartComponent>;

  @ViewChild("indicatorSelection", { static: true })
  indicatorSelection: IndicatorpickerComponent;

  indicators:Set<string> = new Set<string>();
  methods:number[] = [];

  acparts:ACPartsAssembly[] = this.lss.getAssemblies()

  // this maps process ids to indicator results
  processResultsLookup:{[id:number]:{[id:string]:number}} = {}
  processAttributesLookup:{[id:number]:Object} = {}
  
  barchartdata:{[id:string]:number}[] = []
  barchartcolors:string[] = []
  tableDatas:any = []

  resultSubscription:Subscription = null;

  constructor(
    private color: ColorcodingService,
    private lss:LocalStorageService,
    private rest:RestService,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.updateTableData();
  }

  indicatorsChanged(i:string[]){
    this.indicators = new Set<string>(i)
    this.color.initializeDistinctPallette('impact-comparison', i.length)
    this.indicatorSelection.updateChipColorsByPallet("impact-comparison", "#ddd")
    this.updateLCIAResults()
    this.updateBarchartColor() 
  }

  methodsChanged(i:number[]){
    this.methods = i
    this.updateLCIAResults()
  }

  updateTableData()
  {
    this.tableDatas = this.acparts.map((acpart:ACPartsAssembly, index:number) => {
      let rtnArr = []
      for(let process in acpart.results) {
        let rtn = {}
        if (this.processAttributesLookup[process]) {
          rtn = {
            "process_id": process,
            "assembly_id": index,
            "name" : this.processAttributesLookup[process]["name"],
            "amount": this.processAttributesLookup[process]["reference"]*acpart.results[process],
            "reference" : this.processAttributesLookup[process]["reference"],
            "reference_unit" : this.processAttributesLookup[process]["reference_unit"],
            "amount_min" : acpart.amount_min[process] ? acpart.amount_min[process] : 0, 
            "amount_max" : acpart.amount_max[process] ? acpart.amount_max[process] : this.parseFloat((this.processAttributesLookup[process]["reference"]*5).toFixed(2))
          }
        this.acparts[index].amount_min[process] = rtn["amount_min"]
        this.acparts[index].amount_max[process] = rtn["amount_max"]
        rtnArr.push(rtn)
        } else {
           //console.log("Process is undefined. Process not added to table data.")
        }
      }
      return rtnArr;
    })
  }

  updateLCIAResults()
  {
    if(this.acparts.length <= 0)
      return
    let processes:Set<number> = new Set<number>()
    this.acparts.forEach((part:ACPartsAssembly)=>{
      Object.keys(part.results).forEach(k=>processes.add(parseInt(k)))
    })

    if(this.resultSubscription != null)
      this.resultSubscription.unsubscribe()
    
    let processArgs:number[] = []
    let methodsArgs:number[] = []

    processes.forEach((p)=>{
      processArgs = processArgs.concat(this.methods.map((m)=>p))
      methodsArgs = methodsArgs.concat(this.methods)
    })
    this.resultSubscription = this.rest.get(
      "/Process/result/"+processArgs.join()+"/"+methodsArgs.join())
      .subscribe((response:LcaResult[])=>{
        this.processResultsLookup = {}
        this.processAttributesLookup = {}
        response.forEach((r:LcaResult) => {
          this.processAttributesLookup[r.process_id] = {
            name: r.process_name,
            reference: r.reference,
            reference_unit: r.reference_unit
          }
          let results = Object.fromEntries(
            Object.entries(r.indicator_name_result).filter(n=>this.indicators.has(n[0]))
            )
          if(!(r.process_id in this.processResultsLookup))
            this.processResultsLookup[r.process_id] = results
          else
            Object.assign(this.processResultsLookup[r.process_id],results)
        })
        // console.log("process lookup after response")
        // console.log(this.processAttributesLookup)
        // console.log(this.processResultsLookup)
        this.updateScaledResults()
        this.updateTableData()
        this.loaded = true
        this.indicatorSelection.updateChipColorsByPallet("impact-comparison", "#ddd")
      })
  }

  updateScaledResults()
  {
    let indicatorMax:{[id:string]:number} = {}
    this.barchartdata = []
    this.barchartdata = this.acparts.map((acparts:ACPartsAssembly)=>{
      let scaledNomalized:{[id:string]:number} = {}
      for(let tech_id in this.processResultsLookup)
      {
        if(tech_id in acparts.results)
        for(let indicator in this.processResultsLookup[tech_id])
        {
          if(this.indicators.has(indicator))
          {
            if(!(indicator in scaledNomalized))
              scaledNomalized[indicator] = 0;
            scaledNomalized[indicator] += acparts.results[tech_id]*this.processResultsLookup[tech_id][indicator]
          }
        }
      }
      
      for(let indicator in scaledNomalized)
        if(!(indicator in indicatorMax))
          indicatorMax[indicator] = Math.abs(scaledNomalized[indicator])
        else
          indicatorMax[indicator] = Math.max(Math.abs(scaledNomalized[indicator]),indicatorMax[indicator])
      return scaledNomalized;
    })

    for(let i in this.barchartdata)
    {
      for(let indicator in this.barchartdata[i])
        this.barchartdata[i][indicator] *= 1/indicatorMax[indicator];
    }
    for(var i = 0; i<this.barchartdata.length; i++)
    {
      //console.log(Object.keys(this.barchartdata[i]))
    }
    this.updateBarchartColor()
    this.barcharts.forEach((chart,i)=>
    {
      chart.barLabels = Object.keys(this.barchartdata[i])
      chart.barValues = Object.values(this.barchartdata[i])
      chart.barColors = this.barchartcolors
      chart.update()
    }
    )
  }

  updateBarchartColor()
  {
    if(this.barchartdata.length>0) {
      this.barchartcolors = Object.keys(this.barchartdata[0]).map(indicator=> {
        return this.color.sampleDistinctPallette("impact-comparison",indicator)
      })
    }
  }

  updateAmountFields(idx:number, min:number, max:number, amount?:number)
  {
    this.minInputFields.get(idx).nativeElement.value = min.toString()
    this.maxInputFields.get(idx).nativeElement.value = max.toString()
    this.sliderInputFields.get(idx).nativeElement.min = min.toString()
    this.sliderInputFields.get(idx).nativeElement.max = max.toString()
    if(amount)
    {
      this.amountInputFields.get(idx).nativeElement.value = amount.toString();
      this.sliderInputFields.get(idx).nativeElement.value = amount.toString();
    }
  }

  amountChange(event:any, acparts_id:number, process_id:number, row_index:number) {
    if(!isNaN(parseFloat(event.target.value)) ) {
      console.log("row_index")
      console.log(row_index)
      let idx = this.getFieldIndex(acparts_id, row_index);
      let amount_min = this.acparts[acparts_id].amount_min[process_id];
      let amount_max = this.acparts[acparts_id].amount_max[process_id];
     
      let amount = this.parseFloat(event.target.value)
      if (amount > amount_max) {
        amount_max = amount 
      }
      if (amount < amount_min) {
        amount_min = amount
      }
      this.acparts[acparts_id].results[process_id] = event.target.value/this.processAttributesLookup[process_id]["reference"]
      this.acparts[acparts_id].amount_min[process_id] = amount_min
      this.acparts[acparts_id].amount_max[process_id] = amount_max

      this.updateAmountFields(idx, amount_min,amount_max,amount);
      this.lss.setAssembly(this.acparts[acparts_id]);
      this.updateScaledResults()
      this.cdr.detectChanges();
      this.cdr.markForCheck();
   } 
  }


  getFieldIndex(acparts_id:number, row_index:number) {
    let field_index = row_index;
    this.tableDatas.forEach((a, i) => {
      if (acparts_id > i) {
        field_index = field_index + this.tableDatas[i].length
      }
    })
    return field_index;
  }

  updateMin(event:any, acparts_id:number, process_id:number, row_index:number){
    let amount = this.parseFloat(event.target.value);
    if(!isNaN(amount) && process_id) {
      let idx = this.getFieldIndex(acparts_id, row_index);
      let amount_new = undefined;
      let amount_min = this.acparts[acparts_id].amount_min[process_id];
      let amount_max = this.acparts[acparts_id].amount_max[process_id];
      if(amount < amount_max)
      {
        amount_min = amount;
      }
      if(this.acparts[acparts_id].results[process_id] < amount_min/this.processAttributesLookup[process_id]["reference"])
      {
        amount_new = amount_min
        this.acparts[acparts_id].results[process_id] = amount_min/this.processAttributesLookup[process_id]["reference"]
      }

      if(amount_new)
        this.acparts[acparts_id].results[process_id] = amount_new/this.processAttributesLookup[process_id]["reference"]
      this.acparts[acparts_id].amount_min[process_id] = amount_min
      this.updateAmountFields(idx, amount_min, amount_max, amount_new);
      this.lss.setAssembly(this.acparts[acparts_id]);
      this.updateScaledResults()
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    }
  }

  updateMax(event:any, acparts_id:number, process_id:number, row_index:number){
    let amount = this.parseFloat(event.target.value);
    if(!isNaN(amount) && process_id) {
      let idx = this.getFieldIndex(acparts_id, row_index);
      let amount_new = undefined;
      let amount_min = this.acparts[acparts_id].amount_min[process_id];
      let amount_max = this.acparts[acparts_id].amount_max[process_id];
      if(amount > amount_min)
      {
        amount_max = amount;
      }
      if(this.acparts[acparts_id].results[process_id] > amount_max/this.processAttributesLookup[process_id]["reference"])
      {
        amount_new = amount_max
        this.acparts[acparts_id].results[process_id] = amount_max/this.processAttributesLookup[process_id]["reference"]
      }

      if(amount_new)
        this.acparts[acparts_id].results[process_id] = amount_new/this.processAttributesLookup[process_id]["reference"]
      this.acparts[acparts_id].amount_max[process_id] = amount_max
      this.updateAmountFields(idx, amount_min, amount_max, amount_new);
      this.lss.setAssembly(this.acparts[acparts_id]);
      this.updateScaledResults()
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    }
  }

  deleteProcess(assembly_id:number, process_id:number)
  {
    delete this.acparts[assembly_id].results[process_id]
    this.lss.setAssembly(this.acparts[assembly_id])
    this.updateTableData()
    this.updateScaledResults()
  }

  deleteAssembly(assembly_id:number)
  {
    this.lss.removeAssembly(this.acparts[assembly_id].name)
    this.acparts = this.acparts.filter((v:any,index:number)=>{return index != assembly_id})
    this.loaded = false
    this.updateLCIAResults()
  }
}

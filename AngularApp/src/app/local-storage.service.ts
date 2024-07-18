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
import { Injectable } from '@angular/core';
import { LcaResult } from './Common/LcaResult';
import { BehaviorSubject, Observable } from 'rxjs';
import { ACPartsAssembly } from './Common/ACPartsAssembly';


@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() {
    //this.clearLocalStorage();
  }

  readonly lcaResultKey = "lcaresult_";
  readonly methodKey = "methods";
  readonly indicatorKey = "indicators";

  readonly view = "default";
  readonly viewQa = "qa"

  private selectedLcaResults$ = new BehaviorSubject<Array<LcaResult>>([]);
  private selectedLcaResultsQa$ = new BehaviorSubject<Array<LcaResult>>([]); 
  private assignedAssemblies$ = new BehaviorSubject<Number>(0);

  private assembliesLoaded = false;
  private assemblies: Map<string, ACPartsAssembly> = new Map<string, ACPartsAssembly>();

  observeSelectedLcaResults(): Observable<Array<LcaResult>> {
    return this.selectedLcaResults$.asObservable();
  }

  observeSelectedLcaResultsQa(): Observable<Array<LcaResult>> {
    return this.selectedLcaResultsQa$.asObservable();
  }

  observeAssignedAssemblies(): Observable<Number> {
    return this.assignedAssemblies$.asObservable();
  }

  getSelectedMethods() {
    let methods = localStorage.getItem(this.methodKey)
    if (methods) {
      return JSON.parse(methods);
    }
    return [];
  }

  saveMethods(ids: number[]) {
    localStorage.setItem(this.methodKey, JSON.stringify(ids));
  }

  getSelectedIndicators() {
    let indicators = localStorage.getItem(this.indicatorKey);
    if (indicators) {
      return JSON.parse(indicators);
    }
    return [];
  }

  saveIndicators(indicators: string[]) {
    localStorage.setItem(this.indicatorKey, JSON.stringify(indicators))
  }

  getLcaResults(listname="default") {
    let key  = this.lcaResultKey

    if (listname == this.viewQa) {
      key = key + "qa_"
    }

    let results = [];
    const storage = { ...localStorage };
    for (let k in storage) {

      if (listname == this.view) { // == "default"
        if (k.includes(key) && !(k.includes("qa"))) {
          const res = JSON.parse(storage[k]);
          results.push(res);
        } 
      } else if (listname == this.viewQa) {
      if (k.includes(key)) {
        const res = JSON.parse(storage[k]);
        results.push(res);
      } 
    }
    }
    this.updateSelectedLcaResults(listname, results)
  }

  updateSelectedLcaResults(listname="default", results: any[]) {
    if (listname == this.viewQa) {
      this.selectedLcaResultsQa$.next(results);
    } else if (listname == this.view) {
      this.selectedLcaResults$.next(results);
    }
  }

  saveLcaResult(process_name: string, process_extern: string, process_id: number, listname="default") {
    let item = {
      process_id: process_id,
      process_name: process_name,
      extern_id: process_extern,
      lcia_method: "",
      lcia_method_id: -1,
      indicator_ids: [],
      indicator_name_result: {}
    }

    let data = []
    if (listname == this.viewQa) {
      data = this.selectedLcaResultsQa$.getValue();
    } else {
      data = this.selectedLcaResults$.getValue();
    }

    if (!this.includesLcaResult(item.process_name, listname)) {
      data.push(item);

      let key  = this.lcaResultKey
      if (listname == this.viewQa) {
        key = key + "qa_"
      }
      key = key.concat(item.process_id.toString());
      let data_str = JSON.stringify(item);
      localStorage.setItem(key, data_str);
    }

    this.updateSelectedLcaResults(listname, data)
  }

  removeLcaResult(process_name: string, process_extern: string, process_id: number, listname="default") {
    let item = {
      process_id: process_id,
      process_name: process_name,
      extern_id: process_extern,
      lcia_method: "",
      lcia_method_id: -1,
      indicator_ids: [],
      indicator_name_result: {}
    }

    let data = this.selectedLcaResults$.getValue();
    if (listname == this.viewQa) {
      data = this.selectedLcaResultsQa$.getValue();
    } 

    data.forEach((d, index) => {
      if (d.process_name == item.process_name) {
        data.splice(index, 1);

        let key  = this.lcaResultKey
        if (listname == this.viewQa) {
          key = key + "qa_"
        }
        key = key.concat(d.process_id.toString());
        localStorage.removeItem(key);
      }
    });
    
    this.updateSelectedLcaResults(listname, data)
  }

  includesLcaResult(name: string, listname="default"): boolean {
    let data = this.selectedLcaResults$.getValue();
    if (listname == this.viewQa) {
      data = this.selectedLcaResultsQa$.getValue();
    } 

    let includes = false;
    data.forEach(d => {
      if (d.process_name == name) {
        includes = true;
      }
    });
    return includes;
  }

  clearLocalStorage() {
    localStorage.clear();
  }

  updateAssembliesFromLS() {
    if (!localStorage.getItem("assemblies")) {
      this.saveAssemblies()
    }
    let assemblies: ACPartsAssembly[] = JSON.parse(localStorage.getItem("assemblies"))
    this.assemblies.clear()
    assemblies.forEach((asm) => this.assemblies.set(asm.name, asm))
  }

  saveAssemblies() {
    localStorage.setItem("assemblies", JSON.stringify(this.getAssemblies()));
  }

  getAssemblies() {
    if (!this.assembliesLoaded) {
      this.assembliesLoaded = true;
      this.updateAssembliesFromLS();
    }
    let assemblies: ACPartsAssembly[] = []
    this.assemblies.forEach((asm) => assemblies.push(asm))
    this.assignedAssemblies$.next(assemblies.length)
    return assemblies
  }

  getAssembly(name: string) {
    if (!this.assembliesLoaded) {
      this.assembliesLoaded = true;
      this.updateAssembliesFromLS();
    }
    return this.assemblies.get(name)
  }

  setAssembly(assembly: ACPartsAssembly) {
    this.assemblies.set(assembly.name, assembly)
    this.saveAssemblies()
  }

  removeAssembly(name: string) {
    this.assemblies.delete(name);
    this.saveAssemblies()
  }

  updateAssemblyResults(assembly_names: string[], tech_id:number) {
    // removes tech_id from assembly
    let assemblies = this.getAssemblies(); 
    assemblies.forEach(a => {
      if (!assembly_names.includes(a.name)) {
        if (tech_id in a.results) {
          delete a.results[tech_id]
          this.saveAssemblies()
        }  
      }
    })
  }

  getAssembliesByTechId(tech_id: number) {
    let assembliesByTechId: ACPartsAssembly[] = []
    let assemblies = this.getAssemblies();
    assemblies.forEach(a => {
      if (tech_id in a.results) {
        assembliesByTechId.push(a);
      }
    })
    return assembliesByTechId;
  }

  // getItem(key: string) {
  //   return localStorage.getItem(key);
  // }

  // removeItem(key: string) {
  //   localStorage.removeItem(key);
  // }

}

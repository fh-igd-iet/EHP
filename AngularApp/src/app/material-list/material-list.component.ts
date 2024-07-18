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
import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RestService } from '../rest.service';
import { FormGroup } from '@angular/forms';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { ColorcodingService } from '../colorcoding.service';

@Component({
  selector: 'app-material-list',
  templateUrl: './material-list.component.html',
  styleUrls: ['./material-list.component.css']
})



export class MaterialListComponent implements OnInit {

  loaded:boolean = false;

  @Input() restSrcPath: string = ""

  private paginator: MatPaginator;
  private sort: MatSort;
  private currentFilter : string;
  tableData:MatTableDataSource<Material> =
    new MatTableDataSource<Material>([]); 

  selectedMaterials:number[] = [];

  @Output()
  onSelectedMaterialsChanged: EventEmitter<number[]> =
    new EventEmitter<number[]>();

  @ViewChild(MatSort, { static: true }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }



  addMaterial(name:string, id:number)
  {
    this.selectedMaterials.push(id)
    this.onSelectedMaterialsChanged.emit(this.selectedMaterials);

  }

  removeMaterial(id:number)
  {
    let f = this.selectedMaterials.indexOf(id)
    if(f >= 0)
    {
      this.selectedMaterials.splice(f,1)
    }
    this.onSelectedMaterialsChanged.emit(this.selectedMaterials);
  }

  isSelected(id:number)
  {
    return this.selectedMaterials.indexOf(id) >= 0;
  }

  setDataSourceAttributes() {
    this.tableData.paginator = this.paginator;
    this.tableData.sort = this.sort;
    // console.log(this.paginator, this.sort);
    if (this.paginator && this.sort) {
      this.applyFilter(this.currentFilter);
    }
  }

  applyFilter(filterValue: string) {
    if(this.currentFilter != filterValue)
    {
      this.currentFilter = filterValue;
      this.tableData.filter = filterValue
    }
  }

  refresh()
  {
    this.loaded=false;
    this.rest.get(this.restSrcPath, true).subscribe((d:MaterialDBO)=>{
      //console.log(d);
      this.tableData = new MatTableDataSource<Material>(d.processList)
      this.tableData.filterPredicate = (data: Material, filter:string) =>  {
        if(filter.length<=2)
          return data.name.toLowerCase().startsWith(
            filter.toLowerCase());
        return data.name.toLowerCase().indexOf(filter.toLowerCase())>=0 
      };
      this.tableData.sortingDataAccessor = (item, prop)=>{
        switch(prop)
        {
          case 'selection': return this.isSelected(item['id']);
          default: return item[prop]
        }
      }
      this.tableData.paginator = this.paginator;
      this.loaded = true;
    });
  }

  constructor(
    private rest:RestService,
    private colorcoding:ColorcodingService
  ) { 

    

  }

  ngOnInit() {
    this.refresh()
  }

}

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
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RestService } from '../rest.service';
import { ColorcodingService } from '../colorcoding.service';
import { LcaResult } from '../Common/LcaResult';
import { LocalStorageService } from '../local-storage.service';
import { Subscription } from 'rxjs';

function eqSet(as, bs) {
  if (as.size !== bs.size) return false;
  for (var a of as) if (!bs.has(a)) return false;
  return true;
}

@Component({
  selector: 'app-show-cs1-result-list',
  templateUrl: './show-cs1-result-list.component.html',
  styleUrls: ['./show-cs1-result-list.component.css']
})
export class ShowCs1ResultListComponent implements OnInit, OnDestroy {

  loaded: boolean = false;

  @Input() restSrcPath: string = ""
  @Input() cs: number = 0
  @Input() listName: string = ""
  private paginator: MatPaginator;
  private sort: MatSort;
  private currentFilter: string;
  tableData: MatTableDataSource<LcaResult> =
    new MatTableDataSource<LcaResult>([]);

  selectedResults: number[] = [];
  colormode: string = "";

  selection_subscription: Subscription = null; 

  @Output()
  onSelectedResultsChanged: EventEmitter<number[]> =
    new EventEmitter<number[]>();

  @ViewChild(MatSort, { static: true }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }

  triggerSort() {
    this.tableData.sort = null;
    this.tableData.sort = this.sort;
  }

  addResult(r:LcaResult) {
    this.storageService.saveLcaResult(r.process_name, r.extern_id, r.process_id, this.listName)
    this.triggerSort();
  }

  setColorMode(mode) {
    if (mode == "grey")
      this.colormode = "grey"
    else
      this.colormode = ""
    this.cd.detectChanges()
  }

  colorGradient(name: string) {
    if (this.colormode != 'grey')
      return 'linear-gradient(to right, ' + this.colorcoding.sampleDistinctPallette('impact-comparison', name) + ', #FFF)'
    else
      return 'linear-gradient(to right, #AAA, #FFF)'
  }

  backgroundImage(r:LcaResult) {
    if (this.isSelected(r))
      return this.colorGradient(r.process_name)
    else
      return 'unset'
  }

  removeResult(r:LcaResult) {
    this.storageService.removeLcaResult(r.process_name, r.extern_id, r.process_id, this.listName)
    this.triggerSort();
  }

  isSelected(r:LcaResult) {
    return this.storageService.includesLcaResult(r.process_name, this.listName);
  }

  setDataSourceAttributes() {
    this.tableData.paginator = this.paginator;
    this.tableData.sort = this.sort;
    if (this.paginator && this.sort) {
      this.applyFilter(this.currentFilter);
    }
    this.tableData.filterPredicate = (data: LcaResult, filter: string) => {
      let filterstring = (data.process_name + data.extern_id).toLowerCase()
      return filterstring.indexOf(filter.toLowerCase()) >= 0
    };

    this.tableData.sortingDataAccessor = (item, prop) => {
      switch (prop) {
        case 'selection': {
          return '' + (!this.isSelected(item)) + '' + item['extern_id']; // item['process_name'];
        }
        default: return item[prop]
      }
    }
  }

  applyFilter(filterValue: string) {
    if (this.currentFilter != filterValue) {
      this.currentFilter = filterValue;
      this.tableData.filter = filterValue
    }
  }

  refresh() {
    this.loaded = false;
    this.rest.get(this.restSrcPath).subscribe((d: LcaResult[]) => {
      if (this.cs == 1 || this.cs == 2)
        d = d.filter(e => {
          if (this.cs == 1)
            return e.extern_id.toLowerCase().includes('cs1')
          return !e.extern_id.toLowerCase().includes('cs1')
        })
      let methods = new Set<number>()
      let pnameToMetods: { [id: number]: Set<number>; } = {}
      let processIncluded = new Set<number>()
      d.forEach(d => {
        if (!Object.keys(pnameToMetods).map(d => parseInt(d)).includes(d.process_id))
          pnameToMetods[d.process_id] = new Set<number>()
        pnameToMetods[d.process_id].add(d.lcia_method_id)
        methods.add(d.lcia_method_id)
      })
      let filteredD = d.filter(d => {
        let f = eqSet(pnameToMetods[d.process_id], methods) &&
          !processIncluded.has(d.process_id)
        processIncluded.add(d.process_id)
        return f;
      });

      this.tableData = new MatTableDataSource<LcaResult>(filteredD)
      this.setDataSourceAttributes()
      this.loaded = true;
    });
  }

  constructor(
    private rest: RestService,
    private cd: ChangeDetectorRef,
    private colorcoding: ColorcodingService,
    private storageService: LocalStorageService
  ) {

    // this.selection_subscription = this.storageService.observeSelectedLcaResults().subscribe((data) => {
    //   //this.refresh()
    //   //this.triggerSort()
    // });

  }

  ngOnInit() {
    this.refresh()
  }

  ngOnDestroy(): void {
    // if (this.selection_subscription != null) {
    //   this.selection_subscription.unsubscribe();
    // }
  }
}

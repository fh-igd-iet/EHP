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
import { Component, OnInit, ViewChild } from '@angular/core';
import { RestService } from '../rest.service';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { QuestionControlService } from '../question-control.service';
import { QuestionGeneratorService } from '../question-generator.service';
import { QuestionBase } from '../Common/question-base';
import { EDASProcessDBO } from '../Common/EDASProcessDBO';
import { NavigationService } from '../navigation.service';

class Technology {
  id: number;
  demo: string;
  pd: string;
  explanation: string;
  owner_id: number;
  owner_name: string;
  spd_id: string;
  spd_name: string;
  ecoThemes: string;

  addEcoTheme(name: string, value: number) {
    if (this.ecoThemes == undefined)
      this.ecoThemes = "";
    if (value <= 0)
      return;
    if (this.ecoThemes.length == 0)
      this.ecoThemes += name;
    else
      this.ecoThemes += ", " + name;
  }
}

@Component({
  selector: 'app-technology-list',
  templateUrl: './technology-list.component.html',
  styleUrls: ['./technology-list.component.css']
})
export class TechnologyListComponent implements OnInit {

  private paginator: MatPaginator;
  private sort: MatSort;
  private currentFilter: string;

  @ViewChild(MatSort, { static: true }) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }

  setDataSourceAttributes() {
    this.tableData.paginator = this.paginator;
    this.tableData.sort = this.sort;
    if (this.paginator && this.sort) {
      this.applyFilter(this.currentFilter);
    }
  }

  convertToTechnologyData(inputData: EDASProcessDBO[]) {
    let outputData = new Array<Technology>();
    for (let entry of inputData) {
      let tech = new Technology();
      tech.id = entry.id;
      tech.demo = entry.demo;
      tech.pd = entry.pd;
      tech.explanation = entry.explanation;
      tech.owner_id = entry.owner_id;
      tech.owner_name = entry.owner_name;
      tech.spd_id = entry.spd_id;
      tech.spd_name = entry.spd_name;

      tech.addEcoTheme("A", entry.a);
      tech.addEcoTheme("B", entry.b);
      tech.addEcoTheme("C", entry.c);
      tech.addEcoTheme("D", entry.d);
      tech.addEcoTheme("REUP", entry.reup);
      tech.addEcoTheme("EoL", entry.eol);
      tech.addEcoTheme("ADS", entry.ads);
      tech.addEcoTheme("ASA", entry.asa);

      outputData.push(tech);
    }
    return outputData;
  }

  tableData: MatTableDataSource<Technology> =
    new MatTableDataSource<Technology>([]);
  rawData: Technology[] = [];
  questionsOverall: Object[];
  questionsPromise: Promise<QuestionBase<any>[]>;
  loaded: boolean = false;
  deleteProgress: number = -1;

  constructor(
    private rest: RestService,
    private questionControl: QuestionControlService,
    private questionGenerator: QuestionGeneratorService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private navigationService: NavigationService
  ) {
    this.currentFilter = "";
  }

  refresh() {
    this.loaded = false;
    this.rest.get('/EDASProcess').subscribe((d: EDASProcessDBO[]) => {
      this.rawData = this.convertToTechnologyData(d);
      this.tableData = new MatTableDataSource<Technology>(this.rawData)
      this.tableData.paginator = this.paginator;
      this.loaded = true;
    });
  }

  ngOnInit() {
    this.questionsOverall = new Array(10);
    this.tableData.sort = this.sort;
    this.refresh()
  }

  ngAfterViewInit() {
    this.navigationService.pathChangeListener.add(path => {
      this.pathChanged(path)
    });
  }

  pathChanged(path) {
    if (path.length > 0)
      this.applyFilter(path[0]);
    else
      this.applyFilter("");
  }

  applyFilter(filterValue: string) {
    if (this.currentFilter != filterValue)
      this.currentFilter = filterValue;

    this.tableData.filterPredicate = (data: Technology, filter: string) => {
      var rowData = data.ecoThemes.split(",");
      for (let entry of rowData) {
        if (entry.trim().toLowerCase() == filter.toLowerCase())
          return true;
      }
      return false;
    };

    if (filterValue.length > 0)
      this.tableData.filter = filterValue.trim().toLowerCase();
    else
      this.tableData.filter = "";
  }

  clear(row) {
    this.tableData = new MatTableDataSource<Technology>(this.rawData)
    this.tableData.paginator = this.paginator;
  }

  showError(message) {
    this.snackBar.open(message, "close", {
      duration: 5000,
    })
  }

}

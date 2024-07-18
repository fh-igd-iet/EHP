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
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';


interface Node {
  name: string,
  search?: string,
  children: Node[]
};

interface FlatNode {
  name: string,
  expandable: boolean,
  level: number
};

@Component({
  selector: 'app-treeview-dialog',
  templateUrl: './treeview-dialog.component.html',
  styleUrls: ['./treeview-dialog.component.css']
})
export class TreeviewDialogComponent implements OnInit {

  name: string = null;
  searchRoot: string = null;
  /**
   * Takes data of the form
   * [{
   *  name:string,
   *  children:object[]
   * },...]
   * and visualises it as a material-style tree
   * @param data 
   * @param dialogRef 
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<TreeviewDialogComponent>) {

    if (data.searchRoot) {
      this.searchRoot = data.searchRoot;
    }

    if (data.name) {
      this.name = data.name
      this.dataSource.data = data.data
    }
    else
      this.dataSource.data = data
  }

  private _transformer = (node: Node, level: number) => {
    return {
      name: node.name,
      search: node.search ? node.search : undefined,
      expandable: !!node.children && node.children.length > 0,
      level: level,
    };
  }

  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level, node => node.expandable);

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children);

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: FlatNode) => node.expandable;

  ngOnInit() {
  }

}

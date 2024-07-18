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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { RestService } from '../rest.service';
import { AircraftpartDBO } from '../Common/AircraftpartDBO';
import { ColorcodingService } from '../colorcoding.service';
import { NavigationService } from '../navigation.service';
import { DestroyHelper } from '../Common/DestroyHelper';

interface AirpartFlatNode {
  expandable: boolean,
  name: string,
  id: string,
  level: number,
  color?: string
}

@Component({
  selector: 'app-aircraft-tree',
  templateUrl: './aircraft-tree.component.html',
  styleUrls: ['./aircraft-tree.component.css']
})
export class AircraftTreeComponent implements OnInit, OnDestroy {


  dh: DestroyHelper = new DestroyHelper();

  private _transformer = (node: AircraftpartDBO, level: number) => {
    let t: AirpartFlatNode = {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      id: node.id,
      level: level,
    };
    if (this.colorcoding.islabel('SAM_' + node.id))
      t.color = this.colorcoding.colorOfLabel('SAM_' + node.id)
    return t
  }

  selectedName: string = ''

  treeControl = new FlatTreeControl<AirpartFlatNode>(
    node => node.level, node => node.expandable);

  treeFlattener = new MatTreeFlattener(
    this._transformer, node => node.level, node => node.expandable, node => node.children);

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(private rest: RestService,
    private colorcoding: ColorcodingService,
    private navigation: NavigationService) { }

  ngOnDestroy(): void {
    this.dh.destroy();
  }

  ngOnInit() {
    this.dh.sub(this.rest.get('/AircraftPart/parts').subscribe(next => {
      let parts = <AircraftpartDBO[]>next['children'];
      this.dataSource.data = parts
    }))

    this.dh.listenerEvent(this.navigation.pathChangeListener,
      path => {

        if (path.length <= 0)
          this.selectedName = ''
        else
          this.selectedName = path[0]
      });
  }

  hasChild(n: number, node: AirpartFlatNode) {
    return node.expandable
  }
}

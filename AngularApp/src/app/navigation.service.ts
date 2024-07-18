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
import Listener from './Common/Listener';

@Injectable({
  providedIn: 'root'
})
/**
 * This service is responsible for communicating
 * the current navigation-path to all the components.
 * Also components can change the navigation path
 * through this service.
 */
export class NavigationService {

  possiblePaths:string[][];
  path:string[];
  pathChangeListener:Listener;

  constructor() {
    this.pathChangeListener = new Listener();
    this.possiblePaths = [
      [],
      ['ENG'],
      ['SYS'],
      ['REG'],
      ['AIR'],
      ['LPA'],
      ['FRC'],
      ['A'],
      ['B'],
      ['C'],
      ['D'],
      ['REUP'],
      ['EoL'],
      ['ADS'],
      ['ASA'],
      ['Fuselage'],
      ['Wing'],
      ['Gears'],
      ['Propulsion'],
      ['Utilities'],
      ['Production & Services'],
      ['Systems']
    ];
    this.path = [];
  }

  navigate(path:string[])
  {
    if(this.possiblePaths.map(p=>{return p.join('/')}).indexOf(path.join('/'))>=0)
    {
      this.path = path;
      this.pathChangeListener.call(this.path);
    }
  }


}

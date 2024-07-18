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
import { Widget } from './Common/Widgets/Widget';

@Injectable({
  providedIn: 'root'
})
export class GridService {

  cols: number;
  rows: number;

  width: number;
  height: number;

  constructor() { }

  setSize(width:number, height:number)
  {
    this.width = width;
    this.height = height;
  }

  setLayout(cols:number, rows:number)
  {
    this.cols = cols;
    this.rows = rows;
  }

  registerWidget(w:Widget)
  {
    
  }
}

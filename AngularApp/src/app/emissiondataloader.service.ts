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
import {CSVToJSON, loadFile} from './Common/FileHandling'
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmissiondataloaderService {

  dataPaths: any;
  parsedFiles: any;
  datasetsPriv: any;
  datasets: any;

  constructor(private http: HttpClient) {
    this.dataPaths = {
      'ENG': 'assets/emissionData/ENG.csv',
      'SYS': 'assets/emissionData/SYS.csv',
      'AIR': 'assets/emissionData/AIR.csv',
      'REG': 'assets/emissionData/REG.csv'
    }

    this.datasetsPriv = {}
    this.datasets = {}
  }

  /**
   * This method needs to be called at least once.
   * It starts the progress of asynchronously loading
   * the data
   */
  loadData()
  {
    for(let k of Object.keys(this.dataPaths))
    {
      let path = this.dataPaths[k]
      this.datasets[k] = new Promise((resolve, reject)=>{
        let plainFile = loadFile(this.http, this.dataPaths[k], 'text');
        plainFile.then((plainText)=>{
          this.datasetsPriv[k] = CSVToJSON(plainText);
          resolve(CSVToJSON(plainText));
        },
        (error)=>{
          reject(error);
        })
      });

    }
  }
}

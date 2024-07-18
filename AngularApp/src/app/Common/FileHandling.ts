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
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

/**
 * some generic file-loading functions
 */

function CSVToJSON(csv) {
  let lines = csv.split('\n');
  let plines = [];
  if (lines.length > 1) {
    let header = lines[0].split(',').map(cell => { return cell.replace(/\s/g, ''); });
    for (let i = 1; i < lines.length; i++) {
      let plineO = {};
      let pline = lines[i].split(',');
      if (pline.length == header.length) {
        for (let j = 0; j < pline.length; j++)
          if (j == 0)
            plineO[header[j]] = pline[j];
          else
            plineO[header[j]] = pline[j].replace(/\s/g, '');
        plines.push(plineO);
      }
    }
  }
  return plines;
}

function loadFile(http: HttpClient, path, responseType = null): Promise<any> {
  let options: any = {
    responseType: responseType
  };
  if (responseType == null)
    options = {};
  let promise = new Promise((resolve, reject) => {
    http.get(path, options).pipe(
      tap(_ => { }),
      catchError(error => {
        reject(error);
        return error;
      }
      )).subscribe(data => {
        resolve(data)
      });
  });
  return promise;
}

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export { CSVToJSON, loadFile, toBase64 }
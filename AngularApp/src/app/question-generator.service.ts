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
import { RestService } from './rest.service';
import { ChipsQuestion } from './Common/question-chips';
import { DropdownQuestion } from './Common/question-dropdown';

@Injectable({
  providedIn: 'root'
})
export class QuestionGeneratorService {

  constructor(private rest: RestService) { }

  getDropdownQuestion(restNode: string, keyFn, valueFn, options: {} = {}) {
    return new Promise<DropdownQuestion>((res, rej) => {
      let observer = {
        next: d => {
          let ownerOptions = []
          for (let row in d) {
            ownerOptions.push({
              value: valueFn(d[row]),
              key: keyFn(d[row])
            })
          }
          options['options'] = ownerOptions;
          let question = new DropdownQuestion(options)
          res(question);
        },
        error: e => {
          rej(e);
        }
      }
      this.rest.get(restNode).subscribe(observer);
    });
  }

  getChipsQuestion(restNode: string, keyFn, valueFn,
    options: {} = {}, dictFn = d => d, lca = false,
    colorFn = d => undefined) {
    return new Promise<ChipsQuestion>((res, rej) => {
      let observer = {
        next: d => {
          d = dictFn(d)
          let keywords = []
          for (let row in d) {
            keywords.push({
              value: valueFn(d[row]),
              key: keyFn(d[row]),
              color: colorFn(d[row])
            })
          }
          options['chips'] = keywords;
          let question = new ChipsQuestion(options);
          res(question);
        },
        error: e => {
          rej(e);
        }
      }
      this.rest.get(restNode, lca).subscribe(observer);
    });
  }
}

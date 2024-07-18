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
import { AsyncValidator, AbstractControl, ValidationErrors, Validator } from '@angular/forms';
import { RestService } from '../rest.service';
import { Observable, Subscription } from 'rxjs';
import { ProcessDBO } from '../Common/ProcessDBO';
import { throwDialogContentAlreadyAttachedError } from '@angular/cdk/dialog';

//@Injectable({ providedIn: 'root' })
export class UniqueDBValidator implements AsyncValidator {

  exclude: string[];
  restEndpoint: string;

  constructor(private rest: RestService, exclude: string[], restEndpoint: string) {
    this.exclude = exclude
    this.restEndpoint = restEndpoint
  }

  validate(
    ctrl: AbstractControl
  ): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    return this.rest.post(this.restEndpoint, { name: ctrl.value }).toPromise().then(
      next => {
        if (next["unique"] || this.exclude.indexOf(ctrl.value) >= 0) {
          return {}
        } else {
          return { "uniqueLogin": "The name " + ctrl.value + " already exists" }
        }
      },
      error => {
        if (this.exclude.indexOf(ctrl.value) >= 0)
          return {}
        return { "uniqueLogin": "Unable to verify uniqueness of name" }
      }
    )
  }
}


export class TechnologyValidator implements Validator {
  restEndpoint: string;
  errors: ValidationErrors = {}; 
  selected_id: number;

  constructor(private rest: RestService, restEndpoint: string, selected: number) {
    this.restEndpoint = restEndpoint
    this.selected_id = selected;
  }

  validate(ctrl: AbstractControl): ValidationErrors {
    let new_id = ctrl.value; 
    if (!new_id || this.selected_id == new_id) {
      this.errors = {}
    } else if (this.selected_id != new_id) {
      this.rest.get(this.restEndpoint + new_id).subscribe((d: ProcessDBO[]) => {
        let technology =  d[0];
        if (technology.olca_id) {
          this.errors = { 'warning': 'Technology already has assigned LCA-data. If you save these changes previous assignments will be overwritten.' }
        } else {
          this.errors = {}
        }  
        ctrl.updateValueAndValidity();
      });
    }
    return this.errors;
   }
}


export class StringMatchingValidator implements Validator {

  matchingControl: string = "";
  valueSubscription: Subscription = null;
  errors: ValidationErrors = {};

  constructor(matchingControl: string) {
    this.matchingControl = matchingControl
  }

  validate(ctrl: AbstractControl): ValidationErrors {

    let parent = ctrl.parent

    let validationFN = (val) => {
      console.log('value changes');
      console.log(val)
      ctrl.markAsTouched()
      if (val != ctrl.value) {
        this.errors = { 'matchingError': 'Not Matching. Please repeat the input from ' + this.matchingControl }
      } else {
        this.errors = {}
      }
    }

    if (parent != null)
      do {
        if (this.matchingControl in parent.controls) {
          if (this.valueSubscription == null)
            this.valueSubscription = parent.controls[this.matchingControl].valueChanges.subscribe(
              (val) => {
                validationFN(val)
                if (parent.controls[this.matchingControl].pristine !== true) {
                  ctrl.updateValueAndValidity();
                }
              })
          break;
        }
        parent = parent.parent
      } while (parent != null)

    if (this.valueSubscription == null) {
      console.warn("Matching Control not found");
    }

    if (parent != null)
      validationFN(parent.controls[this.matchingControl].value)

    return this.errors
  }
}
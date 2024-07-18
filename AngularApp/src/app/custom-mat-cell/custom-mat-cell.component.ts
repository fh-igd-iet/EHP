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
import { Component, OnInit, Input } from '@angular/core';
import { QuestionBase } from '../Common/question-base';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-custom-mat-cell',
  templateUrl: './custom-mat-cell.component.html',
  styleUrls: ['./custom-mat-cell.component.css']
})
export class CustomMatCellComponent implements OnInit {

  @Input() name: string;
  @Input() controlName: string;
  @Input() value: any;
  @Input() edit: boolean;
  @Input() question: QuestionBase<any>;
  @Input() formGroup: UntypedFormGroup;
  @Input() control: UntypedFormControl;

  constructor() {

  }

  ngOnInit() {
  }

}

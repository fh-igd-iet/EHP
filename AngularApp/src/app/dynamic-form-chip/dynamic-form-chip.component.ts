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
import { Component, OnInit, Input, ViewChild, ElementRef, ChangeDetectorRef, ɵReflectionCapabilities, OnChanges, SimpleChanges } from '@angular/core';
import { ChipsQuestion } from '../Common/question-chips';
import { UntypedFormGroup } from '@angular/forms';

import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocomplete } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HttpBackend } from '@angular/common/http';

// Source: https://kadimi.com/javascript-tween-function/
// Source: https://stackoverflow.com/questions/7464468/how-to-convert-background-color-to-rgb-format
function resolve_color(color) {
  // return an array containing R, G and B values
  if (color === 'transparent')// IE (6 and ?)
    color = '#FFF';
  var r, g, b;
  var hex_color_pcre = new RegExp("^#[0-9a-f]{3}([0-9a-f]{3})?$", 'gi');
  var rgb_color_pcre = new RegExp("rgb\\(\\s*((?:[0-2]?[0-9])?[0-9])\\s*,\\s*((?:[0-2]?[0-9])?[0-9])\\s*,\\s*((?:[0-2]?[0-9])?[0-9])\\s*\\)$", 'gi');
  var rgb_percent_color_pcre = new RegExp("rgb\\(\\s*((?:[0-1]?[0-9])?[0-9])%\\s*,\\s*((?:[0-1]?[0-9])?[0-9])%\\s*,\\s*((?:[0-1]?[0-9])?[0-9])%\\s*\\)$", 'gi');
  if (color.match(hex_color_pcre)) {
    if (color.length == 4) {
      r = color.charAt(1) + "" + color.charAt(1);
      g = color.charAt(2) + "" + color.charAt(2);
      b = color.charAt(3) + "" + color.charAt(3);
    }
    else {
      r = color.charAt(1) + "" + color.charAt(2);
      g = color.charAt(3) + "" + color.charAt(4);
      b = color.charAt(5) + "" + color.charAt(6);
    }
    r = parseInt(r, 16);
    g = parseInt(g, 16);
    b = parseInt(b, 16);
  }
  else if (color.match(rgb_color_pcre)) {
    let m = rgb_color_pcre.exec(color);
    r = m[1];
    g = m[2];
    b = m[3];
  }
  else if (color.match(rgb_percent_color_pcre)) {
    let m = rgb_percent_color_pcre.exec(color);
    r = parseInt(m[1]) * 2.55;
    g = parseInt(m[2]) * 2.55;
    b = parseInt(m[3]) * 2.55;
  }
  else
    return false;

  var returned = [];
  returned['r'] = r;
  returned['g'] = g;
  returned['b'] = b;
  return returned;
}

@Component({
  selector: 'app-dynamic-form-chip',
  templateUrl: './dynamic-form-chip.component.html',
  styleUrls: ['./dynamic-form-chip.component.css']
})
export class DynamicFormChipComponent implements OnInit {
  @Input() question: ChipsQuestion;
  @Input() form: UntypedFormGroup;

  nativeControl: UntypedFormControl;
  @ViewChild('chipInput', { static: true }) chipInput: ElementRef<HTMLInputElement>;

  selectable: boolean = false;
  removable: boolean = true;
  selectedChips: Object[] = [];
  filteredChips: Object[] = [];
  chipsDict: {} = {};
  chipsDictByName: {} = {};
  showSelectArrow: boolean = false;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(private ref: ChangeDetectorRef) {

    this.nativeControl = new UntypedFormControl();
    this.nativeControl.valueChanges.subscribe(d => {
      if (typeof d === 'string')
        this.filteredChips = this.question.chips.filter(chip =>
          (<string>chip['value']).toUpperCase().indexOf(d.toUpperCase()) >= 0
        );
      else
        this.filteredChips = this.question.chips
    })


  }


  ngOnInit() {
    if (this.question.chips.length >= 0) {
      this.showSelectArrow = true;
    }

    for (let e of this.question.chips) {
      this.chipsDict[e.key] = e
      this.chipsDictByName[e.value.toUpperCase()] = e
    }
    let val = this.form.controls[this.question.key].value;
    if (typeof val == "string")
      this.selectedChips = this.form.controls[this.question.key].value.split(',')
        .map(d => parseInt(d))
        .filter(d => !isNaN(d))
        .map(d => this.chipsDict[d])
    else if (val.length > 0 && typeof val[0] == 'number')
      this.selectedChips = this.form.controls[this.question.key].value
        .map(d => parseInt(d))
        .filter(d => !isNaN(d))
        .map(d => this.chipsDict[d])
    else if (val.length > 0 && typeof val[0] == 'string')
      this.selectedChips = this.form.controls[this.question.key].value
        .map(d => this.chipsDict[d])
    else
      this.selectedChips = val
    this.filteredChips = this.question.chips

  }

  addOnBlur() {
  }

  textColor(background) {
    if (!(typeof background === "string"))
      return "#000"
    let color = resolve_color(background);
    const brightness = Math.round(((parseInt(color['r']) * 299) +
      (parseInt(color['g']) * 587) +
      (parseInt(color['b']) * 114)) / 1000);
    return (brightness > 125) ? '#000' : '#FFF';
  }

  chipSelected(chip) {
    if (this.selectedChips.find(chip_ => {
      return (chip_['value'].toUpperCase() == chip['value'].toUpperCase());
    }))
      return true;
    return false;
  }

  addChip(chip) {
    if (!this.chipSelected(chip))
      this.selectedChips.push(chip);
  }

  update() {
    this.chipInput.nativeElement.value = ''
    this.nativeControl.setValue(null);
    this.form.controls[this.question.key].setValue(this.selectedChips);
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      if (value.toUpperCase() in this.chipsDictByName)
        this.addChip(this.chipsDictByName[value.toUpperCase()]);
      else
        if (this.question.acceptNewChips)
          this.addChip({ key: -1, value: value });
    }

    this.update()

  }

  remove(chip) {
    this.selectedChips = this.selectedChips.filter(chip_ => {
      return !(chip_['key'] == chip['key'] && chip_['value'] == chip['value']);
    });
    this.update();
  }

  selected(event: MatAutocompleteSelectedEvent) {
    this.addChip(this.chipsDict[event.option.value])
    this.update();
  }
}

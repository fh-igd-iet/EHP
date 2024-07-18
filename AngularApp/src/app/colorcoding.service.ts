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

import * as COLORMAP from 'colormap';
import * as COLORHASH from 'color-hash';
import * as d3 from 'd3';
import distinctColors from 'distinct-colors'

@Injectable({
  providedIn: 'root'
})
export class ColorcodingService {

  colorhash: COLORHASH = new COLORHASH();

  colors: { [id: string]: string } = {
    'SPD_LPA': '#A58EC3',
    'SPD_FRC': '#AFC97A',
    'SPD_REG': '#CD7371',
    'SPD_AIR': '#7AA5D8',
    'SPD_ENG': '#B65708',
    'SPD_SYS': '#276B7D',
    'SAM_F': '#1F497D',
    'SAM_W': '#4F81BD',
    'SAM_G': '#00B0F0',
    'SAM_P': '#F79646',
    'SAM_U': '#4BACC6',
    'SAM_S': '#C0504D',
    'SAM_P&S': '#77933C',
    'ECO_A': '#C0504D',
    'ECO_B': '#766da8',
    'ECO_C': '#F79647',
    'ECO_D': '#772C2A',
    'ECO_REUP': '#4E3C63',
    'ECO_EOL': '#B65809',
    'ECO_ADS': '#CD7371',
    'ECO_ASA': '#9983B5',
    'COHORT_A': '#757780',
    'COHORT_B': '#394F49',
    'COHORT_C': '#65743A',
    'COHORT_D': '#EFDD8D',
    'COHORT_E': '#488286',
  }

  distinctPalletes: Object =
    {
      /*
        name: string -> {
          pallette: ['#FF0000', '#AA00BB',...],
          freeColors: number, // number of colors without name-tag
          colors: {
            name:string->palletteIndex:number
          }
        }
      */
    }

  constructor() {}

  initializeDistinctPallette(palletteName: string, size: number) {
    this.distinctPalletes[palletteName] = {
      pallette: distinctColors({ 'count': size }).map(d => d.hex()),
      freeColors: size,
      colors: {} 
    }
  }

  sampleDistinctPallette(palletteName: string, name: string) {
    if (!(palletteName in this.distinctPalletes)) {
      return '#FF00FF';
    }
    let pallette = this.distinctPalletes[palletteName]
    if (name in pallette.colors) {
      return pallette.pallette[pallette.colors[name]]
    } else {
      if (pallette.freeColors > 0) {
        pallette.colors[name] = pallette.pallette.length - pallette.freeColors
        pallette.freeColors = pallette.freeColors - 1
        return pallette.pallette[pallette.colors[name]]
      } else {
        return '#807577';  //'#FF00FF'; 
      }
    }
  }

  hexToRgbA(hex, a = '1') {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + a + ')';
    }
    throw new Error('Bad Hex');
  }

  islabel(label: string) {
    return label.toUpperCase() in this.colors
  }

  colorOfLabel(label: string) {
    let LABEL = label.toUpperCase()
    if (LABEL in this.colors) {
      return this.colors[LABEL];
    }
    return '#FF00FF'
  }

  randomChlorophyll(size: number) {
    let cmapsize = Math.max(11, size) + Math.floor(Math.max(11, size) / 3)
    let map = COLORMAP({
      colormap: 'chlorophyll',
      nshades: cmapsize,
      format: 'hex',
      alpha: 1
    }).slice(Math.floor(Math.max(11, size) / 3), cmapsize);
    let colorFN = d3.scaleOrdinal(map)
    return colorFN
  }

  randomDeterministic(id: string) {
    return this.colorhash.hex(id.replace("#", ""));
  }

  randomDeterministicRGBA(id: string, a = '1') {
    return this.hexToRgbA(this.randomDeterministic(id.replace("#", "")), a);
  }
}

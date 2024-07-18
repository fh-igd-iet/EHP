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
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-show-cs1-compare-results-radar',
  templateUrl: './show-cs1-compare-results-radar.component.html',
  styleUrls: ['./show-cs1-compare-results-radar.component.css']
})
export class ShowCs1CompareResultsRadarComponent implements OnInit, AfterViewInit {

  @ViewChild("canvas", { static: true })
  canvas: ElementRef;

  data: any;
  chart: Chart = null;
  normalized: boolean = true;
  max: number = 0;
  min: number = 0;

  constructor() { }

  ngOnInit(): void {
    // console.log("RADAR INITIALIZED")
  }

  ngAfterViewInit() {
  }

  setData(data: any) {
    this.data = data;
    let options = {
      responsive: true,
      scales: {
        r: {
          ticks:
          {
            callback: v => (v * 100).toFixed(0) + "%",
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              return (ctx.raw * 100).toFixed(1) + "%"
            }
          }
        }
      },
      scale: {
        ticks: {
          min: -1,
          max: 1,
          beginAtZero: true,
        }
      }
    }
    if (this.chart != null) {
      this.chart.destroy();
      this.chart = null;
    }
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'radar',
      data: this.data,
      options: options
    })
    this.update();

  }

  update() {
    this.chart.data = this.data;
    //this.chart.data.datasets = this.normalize(this.data.datasets);
    //this.chart.options.scale.ticks.max = this.max
    //this.chart.options.scale.ticks.min = this.min
    this.chart.update();
  }

}

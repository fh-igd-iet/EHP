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
import { ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-barchart',
  templateUrl: './barchart.component.html',
  styleUrls: ['./barchart.component.css']
})
export class BarchartComponent implements OnInit {

  // new
  loading = true;
  label: string = null;
  barvalues_: number[] = [];
  barlabels_: string[] = []; 
  barcolors_: string[] = [];

  //@ViewChild('svgNode', { static: true }) svgNode: ElementRef;
  @ViewChild("canvas", { static: true })
  canvas: ElementRef;
  @ViewChild('container', { static: true }) divContainer: ElementRef;
  chart: Chart = null;
  barwidth: number = 20
  barSpacing: number = 5
  padding: number = 60

  constructor(
    private ngZone: NgZone,
    private cd: ChangeDetectorRef) {}

  @Input()
  set barValues(v: number[]) {
    this.barvalues_ = v;
  }

  @Input()
  set barLabels(v: string[]) {
    this.barlabels_ = v;
    //console.log("new labels: ")
    //console.log(this.barlabels_)
  }

  @Input()
  set barColors(v: string[]) {
    this.barcolors_ = v;
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    //console.log("onchanges triggered")
    //console.log(changes)
    
  }

  ngAfterViewInit() {
    this.redraw()
  }  
  
  width() {
      return this.barvalues_.length * (this.barwidth + this.barSpacing) + this.barSpacing + this.padding;
  }

  height() {
    return 400
  }

  redraw() {
    this.divContainer.nativeElement.style.width = this.width() + this.padding
    this.divContainer.nativeElement.style.height = this.height()
    let options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => (v * 100).toFixed(0) + "%",
          }
        },
        x: {
          ticks: {
            display: false
          }
        }
      },
      plugins:
      {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: (ctx) => {
              return ctx[0].label
            },
            label: (ctx) => {
              return (ctx.raw * 100).toFixed(1) + "%"
            }
          }
        }
      },
      legend: {
        display: false
      }
    }
    //options.scales.y["min"] = -1
    options.scales.y["max"] = 1

    if (this.chart != null) {
      this.chart.destroy();
      this.chart = null;
    }
    
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels: Array.from(this.barlabels_),
        datasets: [{
          label: "test",
          data: Array.from(this.barvalues_),
          backgroundColor: Array.from(this.barcolors_)
        }],
      },
      options: options
    }
    )
  }

  public update() {
    if (this.chart) {
      this.chart.data.datasets[0].backgroundColor = Array.from(this.barcolors_)
      this.chart.data.datasets[0].data = Array.from(this.barvalues_)
      this.chart.data.labels = Array.from(this.barlabels_)
      this.chart.update()
      //this.ngZone.runOutsideAngular(()=>{this.chart.update()})
    }
  }

}

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
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { RestService } from '../rest.service';
import { ColorcodingService } from '../colorcoding.service';
import { LcaResult } from '../Common/LcaResult';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-show-cs1-compare-results-barchart',
  templateUrl: './show-cs1-compare-results-barchart.component.html',
  styleUrls: ['./show-cs1-compare-results-barchart.component.css']
})
export class ShowCs1CompareResultsBarchartComponent implements OnInit {

  loading = true;
  label: string = null;
  lciaMethods_: number[] = [];
  results_: number[] = [];
  result_: number = null;
  row_: string = null;
  rows_: string[] = [];
  impactFormat: string = '';
  tab_: number = null; 

  //@ViewChild('svgNode', { static: true }) svgNode: ElementRef;
  @ViewChild("canvas", { static: true })
  canvas: ElementRef;
  @ViewChild('container', { static: true }) divContainer: ElementRef;
  @Input() listName: string = ""
  chart: Chart = null;
  data: any;
  response: any;
  calculationObservables: Observable<Object>[];
  subscription: Subscription = null;
  barwidth: number = 20
  barSpacing: number = 5
  padding: number = 60

  constructor(private rest: RestService,
    private cd: ChangeDetectorRef,
    private colorcoding: ColorcodingService) {}
  
  @Input()
  set tab(t: number) {
    this.tab_ = t;
  }

  @Input()
  set lciaMethodIds(ids: number[]) {
    this.lciaMethods_ = ids;
    this.refresh()
  }

  @Input()
  set results(results: number[]) {
    this.results_ = results
    this.refresh()
  }

  @Input()
  set row(row: string) {
    this.row_ = row
    this.refresh()
  }

  get row() {
    return this.row_
  }

  @Input()
  set rows(rows: string[]) {
    this.rows_ = rows
    this.refresh()
  }

  get rows() {
    return this.rows_
  }

  @Input()
  set result(r: number) {
    this.result_ = r;
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.redraw()
  }  width() {
    if (this.rows_.length <= 0)
      return this.results_.length * (this.barwidth + this.barSpacing) + this.barSpacing + this.padding;
    return this.rows_.length * (this.barwidth + this.barSpacing) + this.barSpacing + this.padding;
  }

  height() {
    return 400
  }

  refresh() {
    this.loading = true;
    if (this.subscription)
      this.subscription.unsubscribe()
    if (this.lciaMethods_.length > 0) {
      let m = []
      let p = []
      for (let pe of this.results_) {
        for (let me of this.lciaMethods_) {
          p.push(pe)
          m.push(me)
        }
      }

      let path = ""
      if (this.listName == "qa") {
        path = `/process/qa_result/${p.join(',')}/${m.join(',')}`
      } else {
        path = `/process/result/${p.join(',')}/${m.join(',')}`
      }

      if (p.length > 0 && m.length > 0) {
        this.subscription = this.rest.get(path).subscribe((d: LcaResult[]) => {
          if (this.rows_.length <= 0) {
            this.response = d.filter(d => Object.keys(d.indicator_name_result).includes(this.row_))
           
            // sort lcaResults by id to make bars have same order 
            this.response.sort((a, b) => (a.process_id < b.process_id) ? -1 : 1);

            this.label = this.row_;
            let res = this.response
            let numbers = res.map(d => d.indicator_name_result[this.row_]);
            this.data = numbers;
          } else {
            this.response = d.filter(d => d.process_id == this.result_)
            if (this.response.length > 0)
              this.label = this.response[0].process_name
            this.response.forEach(e => {
              e.indicator_name_result = Object.keys(e.indicator_name_result)
                .filter(key => this.rows_.includes(key))
                .reduce((obj, key) => {
                  obj[key] = e.indicator_name_result[key];
                  return obj;
                }, {});
            });
          }
          this.loading = false
          this.redraw()
        });
      }
    }
  }

  redraw() {
    this.divContainer.nativeElement.style.width = this.width() + this.padding
    this.divContainer.nativeElement.style.height = this.height()
    if (!this.loading) {
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
      if (this.rows_.length > 0) {
        //options.scales.y["min"] = -1
        options.scales.y["max"] = 1
      }
      if (this.chart != null) {
        this.chart.destroy();
        this.chart = null;
      }
      if (this.rows_.length <= 0) {
        this.chart = new Chart(this.canvas.nativeElement, {
          type: 'bar',
          data: {
            labels: this.response.map(e => e['process_name']),
            datasets: [{
              label: this.row_,
              data: this.data,
              backgroundColor: this.response.map(e => this.colorcoding.sampleDistinctPallette('impact-comparison', e['process_name']))
            }],
          },
          options: options
        }
        )
      } 
      else { 
        let combinedResults = {}
        for (let r of this.response) {
          Object.assign(combinedResults, r["indicator_name_result"]);
        }
        combinedResults = Object.keys(combinedResults).sort().reduce(
          (obj, key) => {
            obj[key] = combinedResults[key];
            return obj;
          },
          {}
        );
        let labels = <string[]>Object.keys(combinedResults)
        let values = <number[]>Object.values(combinedResults)
        this.chart = new Chart(this.canvas.nativeElement, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: "test",
              data: values,
              backgroundColor: labels.map(l => this.colorcoding.sampleDistinctPallette('impact-comparison', l))
            }],
          },
          options: options
        }
        )
      }
    }
    this.cd.markForCheck()
  }

  public updateColors(color) {
    if (this.chart) {
      if (color == null) {
        this.chart.data.datasets[0].backgroundColor = this.chart.data.labels.map(l => this.colorcoding.sampleDistinctPallette('impact-comparison', <string>l))
      } else {
        this.chart.data.datasets[0].backgroundColor = this.chart.data.labels.map(l => color)
      }
      this.chart.update()
    }
  }
}

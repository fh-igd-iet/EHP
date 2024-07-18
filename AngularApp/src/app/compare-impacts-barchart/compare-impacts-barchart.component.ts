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
import { Component, OnInit, Input, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as d3 from 'd3';
import * as d3Scale from "d3-scale";
import { RestService } from '../rest.service';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { ColorcodingService } from '../colorcoding.service';


@Component({
  selector: 'app-compare-impacts-barchart',
  templateUrl: './compare-impacts-barchart.component.html',
  styleUrls: ['./compare-impacts-barchart.component.css']
})
export class CompareImpactsBarchartComponent implements OnInit {

  loading = true;
  materialids_: number[] = [];
  impactCategory_: string = null;
  impactFormat: string = '';

  @ViewChild('svgNode', { static: true }) svgNode: ElementRef;
  @ViewChild('container', { static: true }) divContainer: ElementRef;
  data: any;
  calculationObservables: Observable<Object>[];
  subscription: Subscription = null;
  barwidth: number = 30
  barSpacing: number = 5
  padding: number = 50

  constructor(private rest: RestService,
    private cd: ChangeDetectorRef,
    private colorcoding: ColorcodingService) { }

  @Input()
  set materialids(materialids: number[]) {
    this.materialids_ = materialids
    this.refresh()
  }

  @Input()
  set impactCategory(category: string) {
    this.impactCategory_ = category
    this.refresh()
  }

  get impactCategory() {
    return this.impactCategory_
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.redraw()
  }

  width() {
    return this.materialids_.length * (this.barwidth + this.barSpacing) + this.barSpacing + this.padding;
  }

  height() {
    return 200
  }

  refresh() {
    this.loading = true;
    if (this.subscription)
      this.subscription.unsubscribe()
    this.calculationObservables = this.materialids_.map(d =>
      this.rest.get(`/impact/calculate?id=${d}`, true))
    this.subscription = forkJoin(this.calculationObservables).subscribe(d => {
      this.data = d.map(d => { return d["results"].filter(d => d['name'] == this.impactCategory_)[0] })
      this.impactFormat = this.data[0]['unit']
      this.loading = false;
      this.redraw()
      this.cd.markForCheck()
    })
  }



  redraw() {
    this.divContainer.nativeElement.style.width = this.width() + this.padding
    this.divContainer.nativeElement.style.height = this.height()
    if (!this.loading) {
      this.svgNode.nativeElement.innerHTML = '';
      let data = this.data;

      let format = d3.format(".2e");

      let width = this.width();
      let height = this.height();

      var x = d3.scaleLinear().range([0, width]);
      var y = d3.scaleLinear().range([height, 0]);

      var xAxis = d3.axisBottom()
        .scale(x)
        .ticks(0);

      var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(10)
        .tickFormat(format);

      var svg = d3.select(this.svgNode.nativeElement)
        .attr("width", width)
        .attr("height", height + 25)
        .append("g")
        .attr("transform",
          "translate(" + this.padding + "," + 17 + ")");

      x.domain([0, width]);
      y.domain([0, d3.max(data, function (d) { return d['value']; })]);

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)");

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Value ($)");

      svg.selectAll("bar")
        .data(data)
        .enter().append("rect")
        .style("fill", (d, i) => this.colorcoding.randomDeterministic(this.materialids_[i] + ''))
        .attr("x", (d, i) => {
          return this.barSpacing + i * (this.barwidth + this.barSpacing)
        })
        .attr("width", this.barwidth)
        .attr("y", function (d) { return y(d['value']); })
        .attr("height", function (d) {
          return height - y(d['value']);
        });
    }
  }

}

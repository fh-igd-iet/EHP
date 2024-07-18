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
import { Component, OnInit } from '@angular/core';
import { RestService } from '../rest.service';
import { NavigationService } from '../navigation.service';

import * as d3 from 'd3';

@Component({
  selector: 'app-activity-chart',
  templateUrl: './activity-chart.component.html',
  styleUrls: ['./activity-chart.component.css']
})

export class ActivityChartComponent implements OnInit {

  constructor(
    private navigationService: NavigationService,
    private rest: RestService) {
  }

  ngOnInit() {
    let svgElement = document.getElementById("activityBarChart")
    this.rest.get('/Activity/ecoThemesDetailed').subscribe(
      next => {
        this.drawBarChart(svgElement, <Array<any>>next);
      }
    )
  }

  highlightSelectedEcoTheme(svg: any, ecoTheme: string) {
    if (ecoTheme.length <= 0) {
      svg.selectAll(".tick")
        .selectAll("text")
        .attr("font-weight", null)
        .attr("font-size", null);
    }
    else {
      svg.selectAll(".tick")
        .selectAll("text")
        .each(function (d, i) {
          if (d == ecoTheme) {
            d3.select(this)
              .attr("font-weight", "bold")
              .attr("font-size", "14");
          }
          else {
            d3.select(this)
              .attr("font-weight", null)
              .attr("font-size", null);
          }
        })
    }
  }

  drawBarChart(domElement: HTMLElement, chartData: Array<any>) {
    let rect = domElement.getBoundingClientRect()

    domElement.innerHTML = ''

    let svg = d3.select(domElement)
    svg.on('click', s => {
      this.navigationService.navigate([]);
      this.highlightSelectedEcoTheme(svg, "");
    });


    let margin = 30
    let width = rect.width - 2 * margin
    let height = rect.height - 2 * margin


    let root_g = svg
      .append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('transform', `translate(${1.75 * margin}, ${0.5 * margin})`)

    svg.append('text')
      .attr('x', -(height / 2) - margin)
      .attr('y', margin / 2.4)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text('Number of Technologies');

    svg.append('text')
      .attr('x', width / 2 + margin)
      .attr('y', rect.height)
      .attr('text-anchor', 'middle')
      .text('Eco Themes');

    let keys = Object.keys(chartData[0]).slice(1);
    let colors = d3.scaleOrdinal().range(['gray', 'lightblue', 'steelblue']);
    let activitySums = [0, 0, 0];
    for (let entry of chartData)
      for (let key in keys)
        activitySums[key] += entry[keys[key]];

    let legendKeys = ["CS1 = " + activitySums[0].toString(), "CS2 (GAP/CfP) = " + activitySums[1].toString(), "CS2 (GAM, cont. Update) = " + activitySums[2].toString()];

    // Add a rectangle behind the legend with white background
    let legendSize = 20;
    let legendWidth = 250
    let legendPos = [width - legendWidth + 1.25 * margin, 0.5 * margin];
    svg.append('g').append('rect')
      .attr('width', legendWidth + 2 * legendSize)
      .attr('height', keys.length * (legendSize + 5) + legendSize)
      .attr('x', legendPos[0] - legendSize)
      .attr('y', legendPos[1] - 0.5 * (legendSize + 5))
      .attr('stroke', 'black')
      .attr('fill', 'white');
    // Add one dot in the legend for each name.
    svg.selectAll("mydots")
      .data(legendKeys)
      .enter()
      .append("rect")
      .attr("width", legendSize)
      .attr("height", legendSize)
      .attr("x", legendPos[0])
      .attr("y", function (d, i) { return legendPos[1] + i * (legendSize + 5) })
      .style("fill", function (d) { return colors(d) });

    // Add one dot in the legend for each name.
    svg.selectAll("mylabels")
      .data(legendKeys)
      .enter()
      .append("text")
      .attr("x", legendPos[0] + legendSize * 1.2)
      .attr("y", function (d, i) { return legendPos[1] + i * (legendSize + 6) + (0.75 * legendSize) })
      .text(function (d) { return d })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");

    let yScale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, 1.1 * d3.max(chartData, d => d3.max(keys, key => d[key]))]).nice();

    let xScale = d3.scaleBand()
      .range([0, width])
      .paddingInner(0.1)
      .domain(chartData.map((s) => s.ecoTheme));

    let makeYLines = () => d3.axisLeft()
      .scale(yScale)

    let xInnerScale = d3.scaleBand()
      .padding(0.1)
      .domain(keys).rangeRound([0, xScale.bandwidth()]);

    root_g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));

    root_g.append('g').call(d3.axisLeft(yScale));

    root_g.append('g')
      .call(makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat('')
      )

    let barGroups = root_g.selectAll()
      .data(chartData)
      .enter()
      .append('g')
      .attr("transform", (d) => "translate(" + xScale(d.ecoTheme) + ",0)")
      .selectAll("rect")
      .data(function (d) {
        //debugger;
        return keys.map(function (key) {
          return { key: key, value: { activities: d[key], ecoTheme: d['ecoTheme'] } };
        });
      });

    let labels = barGroups.enter()
      .append('text')
      .attr("x", (d) => xInnerScale(d.key) + 0.5 * xInnerScale.bandwidth())
      .attr("y", (d) => yScale(d.value.activities) - 5)
      .attr("text-anchor", "middle")
      .text((d) => `${d.value.activities}`);

    let bars = barGroups.enter()
      .append("rect")
      .attr("x", (d) => xInnerScale(d.key))
      .attr("y", (d) => yScale(d.value.activities))
      .attr("width", xInnerScale.bandwidth())
      .attr("height", (d) => height - yScale(d.value.activities))
      .attr("fill", (d) => colors(d.key));

    bars.on('mouseenter', function (actual, i) {
      let duration = 300;
      let widen = 3
      d3.select(this)
        .transition()
        .duration(duration)
        .attr("x", (d) => xInnerScale(d.key) - 0.5 * widen)
        .attr("width", xInnerScale.bandwidth() + widen);
    })
      .on('mouseleave', function (actual, i) {

        let duration = 300;

        d3.select(this)
          .transition()
          .duration(duration)
          .attr("x", (d) => xInnerScale(d.key))
          .attr("width", xInnerScale.bandwidth());

        /*
        root_g
          .selectAll('#valueLabel')
          .transition()
          .duration(duration)
          .attr('opacity', 0)
          .remove()
          */
      })
      .on('click', (actual, i) => {
        let ecoTheme = actual.value.ecoTheme;
        this.highlightSelectedEcoTheme(svg, ecoTheme);
        this.navigationService.navigate([ecoTheme]);
        d3.event.stopPropagation();
      });
  }
}

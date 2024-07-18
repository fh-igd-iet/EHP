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
import { CohortDemonstratorsDBO, DemonstratorDBO } from '../Common/CohortDemonstratorsDBO';

import * as d3 from 'd3';
import { ColorcodingService } from '../colorcoding.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DestroyHelper } from '../Common/DestroyHelper';
import { TreeviewDialogComponent } from '../treeview-dialog/treeview-dialog.component';
import { componentDBOToTreeview } from '../Common/ComponentDBO';

@Component({
  selector: 'app-demonstrator-cohort',
  templateUrl: './demonstrator-cohort.component.html',
  styleUrls: ['./demonstrator-cohort.component.css']
})

export class DemonstratorCohortComponent implements OnInit {
  loaded = false;
  legend = [];
  dh: DestroyHelper = new DestroyHelper();
  demonstratorSub: Subscription = null;

  constructor(public rest: RestService,
    private colorService: ColorcodingService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.loaded = false;
    this.rest.get('/CohortDemonstrators').subscribe((cohortDemos: CohortDemonstratorsDBO[]) => {

      let svgElement = document.getElementById("demonstratorCohortChart")
      this.drawDemonstratorChart(svgElement, cohortDemos)

      this.loaded = true;
    })

  }

  pack(data: Array<CohortDemonstratorsDBO>, width: number, height: number) {
    let dummyRoot = {
      name: "dummy root",
      custom_id: '_',
      children: data
    }
    return d3.pack()
      .size([width, height])
      .padding(d => d.depth == 0 ? 50 : 3)
      (d3.hierarchy(dummyRoot)
        .sum(d => Math.max(d.children ? d.children.length : 1, 1))
        .sort((a, b) => b.custom_id > a.custom_id)
      )
  }

  drawDemonstratorChart(domElement: HTMLElement, cohortDemos: Array<CohortDemonstratorsDBO>) {

    let rect = domElement.getBoundingClientRect()
    let margin = 5
    let width = rect.width - 2 * margin
    let height = rect.height - 2 * margin

    const root = this.pack(cohortDemos, width, height);
    let focus = root;
    let view;

    domElement.innerHTML = ''

    let svg = d3.select(domElement)
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .on("click", () => { zoom(root); });

    const data = root.descendants()
    data.filter(d => d.depth == 1).forEach(d => {
      d.r = d.r + 15;
      this.legend.push({
        name: d.data.name,
        color: this.colorService.colorOfLabel('COHORT_' + d.data.custom_id)
      });
    });

    const node = svg.append("g")
      .selectAll("circle")
      .data(data.slice(1))
      .join("circle")
      .attr("fill", d => d.depth > 1 ? "LightSkyBlue" : this.colorService.colorOfLabel('COHORT_' + d.data.custom_id))
      .on("mouseover", function (d) {
        const d3t = d3.select(this)
        const circle = document.getElementById('blend-circle-' + d.data.custom_id)
        const text = document.getElementById('text-label-' + d.data.custom_id)
        d3t.attr("stroke", "#000");
        if (circle) {
          d3.select(circle).attr("opacity", 0)
          d3.select(text).attr("opacity", 0)
        }
      })
      .on("mouseout", function (d) {
        const d3t = d3.select(this)
        const circle = document.getElementById('blend-circle-' + d.data.custom_id)
        const text = document.getElementById('text-label-' + d.data.custom_id)
        d3t.attr("stroke", null);
        if (circle) {
          d3.select(circle).attr("opacity", 0.5)
          d3.select(text).attr("opacity", 1)
        }
      })
      .on("click", d => {
        if (focus === d && !d.children) {
          openDialog(d);
          d3.event.stopPropagation();
          return true;
        } else {
          return focus !== d && (zoom(d), d3.event.stopPropagation())
        }
      });

    const imageClipPaths = svg.append("defs")
      .selectAll("clipPath")
      .data(data.slice(1))
      .join("clipPath")
      .attr("id", d => "clip-path-" + d.data.custom_id)
      .append("circle")

    const labelpaths = svg.append("g")
      .attr("id", "paths")
      .selectAll("path")
      .data(data.slice(1))
      .join("path")
      .filter(d => d.depth == 1)
      .attr("id", d => "text-path-" + d.data.custom_id)
      .attr("opacity", 0)
      .attr("stroke", "red")
      .attr("fill", "rgba(0,0,0,0)")

    //images zuerst, damit text noch lesbar ist
    const thumbnail = svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("image")
      .data(data
        .filter(d => 'image_id' in d.data && d.data.image_id != null))
      //.filter(function(d) { return d.data.image_id != null;})
      .join("image")
      .attr("xlink:href", d => this.rest.imageURL(d.data.image_id))
      .attr("clip-path", d => "url(#clip-path-" + d.data.custom_id + ")")
      .attr("preserveAspectRatio", "xMidYMid slice")
      .style("display", d => String(d.data.image_id) != null ? true : false);

    const blendCircles = svg.append("g")
      .attr("pointer-events", "none")
      .selectAll("circle")
      .data(data
        .filter(d => 'image_id' in d.data && d.data.image_id != null))
      .join("circle")
      .attr("fill", "#fff")
      .attr("opacity", 0.5)
      .attr("id", d => "blend-circle-" + d.data.custom_id)
      .on("mouseover", function () { d3.select(this).attr("opacity", 0); })
      .on("mouseout", function () { d3.select(this).attr("opacity", 0.7); });

    const label = svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("id", d => "text-label-" + d.data.custom_id)
      .style("font", d => d.parent === root ? "14px sans-serif" : "10px sans-serif")
      .style("fill-opacity", 1)
      .style("display", "inline")

    label.filter(d => d.depth == 1)
      .append("textPath")
      .attr("alignment-baseline", "hanging")
      .attr("xlink:href", d => "#text-path-" + d.data.custom_id)
      .attr("startOffset", "50%")
      .attr("dy", "200px")
      .text(d => getLabel(d))
      .attr('fill', "#000")
      .attr('stroke', '#fff')
      .attr('stroke-width', "0");

    const demoLabels = label.filter(d => d.depth > 1)
      .text(d => getLabel(d));

    function getLabel(d) {
      if (d === root)
        return "";

      if (d.parent === root || d === focus)
        return (d.data.code ? d.data.code : '') +
          ' ' +
          d.data.name
      return d.data.custom_id;
    }

    function getLabelVisible(d) {
      return true;
    }

    let openDialog = (d) => {
      if (this.demonstratorSub != null) {
        this.demonstratorSub.unsubscribe()
      }
      this.demonstratorSub = this.rest.get('/Component/' + d.data.demo_id).subscribe((demo: DemonstratorDBO) => {
        this.dialog.open(TreeviewDialogComponent, {
          data: {
            name: 'Activities',
            searchRoot: '/showActivity',
            data: componentDBOToTreeview(demo)
          }
        });
      })
      this.dh.sub(this.demonstratorSub)
    }

    function zoomTo(v) {
      const k = Math.min(width, height) / v[2];
      view = v;
      label.filter(d => d.depth > 1).attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      //labelpaths.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      labelpaths.attr("d", d => {
        let path = "M" + (d.x - v[0]) * k + " " + ((d.y - v[1]) * k + d.r * k) + " "
        path += "a " + d.r * k + " " + d.r * k + "  0 1 1 0.1 0"
        return path
      })
      thumbnail
        .attr("x", d => (d.x - d.r - v[0]) * k)
        .attr("y", d => (d.y - d.r - v[1]) * k)
        .attr("width", d => 2 * d.r * k)
        .attr("height", d => 2 * d.r * k)
      blendCircles.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      blendCircles.attr("r", d => d.r * k);
      node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("r", d => d.r * k);
      imageClipPaths.attr("cx", d => (d.x - v[0]) * k)
      imageClipPaths.attr("cy", d => (d.y - v[1]) * k)
      imageClipPaths.attr("r", d => d.r * k);
    }

    function zoom(d) {
      const prevElement = focus
      focus = d;
      const transition = svg.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });

      label
        .filter(function (d) { return getLabelVisible(d) || this.style.display === "inline"; })
        .transition(transition)
        .style("fill-opacity", d => getLabelVisible(d) ? 1 : 0)
        .on("start", function (d) {
          if (getLabelVisible(d)) this.style.display = "inline";
          if (focus.depth < prevElement.depth)
            demoLabels.text(d => getLabel(d));
        })
        .on("end", function (d) {
          if (!getLabelVisible(d)) this.style.display = "none";
          if (focus.depth > prevElement.depth)
            demoLabels.text(d => getLabel(d));
        });

      thumbnail
        .filter(function (d) { return getLabelVisible(d) || this.style.display === "inline"; })
        .transition(transition)
        //.style("fill-opacity", d => d === focus || d.parent === focus ? 1 : 0)
        .on("start", function (d) { if (getLabelVisible(d)) this.style.display = "inline"; })
        .on("end", function (d) { if (!getLabelVisible(d)) this.style.display = "none"; });

      node.style('cursor', d => {
        if (d === focus)
          return 'pointer'
        return 'default'
      })

    }

    zoomTo([root.x, root.y, root.r * 2]);

  }

}

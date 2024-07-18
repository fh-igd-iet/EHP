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
import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Widget } from '../Common/Widgets/Widget';
import { RestService } from '../rest.service';
import { NavigationService } from '../navigation.service';
import { ColorcodingService } from '../colorcoding.service';
import Listener from "../Common/Listener";

import * as COLORMAP from 'colormap';

import * as d3 from 'd3';
import { DestroyHelper } from '../Common/DestroyHelper';

@Component({
  selector: 'app-airpart-sunburst',
  templateUrl: './airpart-sunburst.component.html',
  styleUrls: ['./airpart-sunburst.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AirpartSunburstComponent implements OnInit, Widget, OnDestroy {


  currentPath: any;
  regionClickedListener: any;
  svgElement: any;
  data: any;
  slices: any;
  root_g: any;
  labels: any;
  textPaths: any;
  arc: any;
  r: any;
  dh: DestroyHelper = new DestroyHelper();
  initialWidth: number;
  initialHeigh: number;

  constructor(
    private colorcoding: ColorcodingService,
    private navigationService: NavigationService,
    private rest: RestService) {
    this.currentPath = [];
    this.data = [];
    this.regionClickedListener = new Listener();
  }

  ngOnDestroy(): void {
    this.dh.destroy();
  }

  ngOnInit() {
    this.svgElement = document.getElementById("sunburstDiagram")
    this.dh.sub(this.rest.get('/AircraftPart/technologieCount').subscribe(
      next => {
        this.drawSunburst(this.svgElement, next);
      }
    ));
  }

  ngAfterViewInit() {
    this.dh.listenerEvent(this.navigationService.pathChangeListener,
      path => {
        this.pathChanged(path)
      });
    this.dh.domEvent(window, 'resize', () => {
      this.resize();
    });
  }

  resize(): void {
    if (this.root_g) {
      let rect = this.svgElement.getBoundingClientRect()
      let width = rect.width
      let height = rect.height

      let widthR = width / this.initialWidth;
      let heightR = height / this.initialHeigh;
      let scale = heightR;
      if (width < height) {
        scale = widthR;
      }

      this.r = Math.min(width, height) / 2
      this.root_g
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + '), scale(' + scale + ')')
    }
  }

  drawSunburst(domElement: HTMLElement, data: Object) {
    let rect = domElement.getBoundingClientRect()
    let width = rect.width
    let height = rect.height
    this.initialWidth = width;
    this.initialHeigh = height;

    this.r = Math.min(width, height) / 2
    domElement.innerHTML = ''

    this.root_g = d3.select(domElement)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

    let partition = d3.partition()
      .size([2 * Math.PI, this.r]);

    let hierarchy = d3.hierarchy(data)
      .sum(d => d.value)
    hierarchy.height = 3;
    partition(hierarchy)

    this.data = hierarchy.descendants()

    this.arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1);

    //let colormap = COLORMAP({
    //  colormap: 'hsv',
    //  nshades: Math.max(11, hierarchy.descendants().length),
    //  format: 'hex',
    //  alpha: 1
    //});
    //let colorFN = d3.scaleOrdinal(colormap);
    let colorFN = d => this.colorcoding.colorOfLabel("SAM_" + d)
    let colorForNode = n => {
      if (n.parent == null)
        return '#FFFFFF'
      let level = 0
      let n_asc = n
      while (n_asc.parent.parent != null) {
        n_asc = n_asc.parent
        level = level + 1
      }
      let color = colorFN(n_asc.data.id)
      return color
    }
    this.data.forEach(d => {
      d.color = colorForNode(d);
    });
    //console.warn(hierarchy);
    this.slices = this.root_g.append('g')
      .selectAll('path')
      .data(this.data)
      .enter()
      .append('path')
      .attr("display", d => d.depth ? null : "none")
      .attr("d", this.arc)
      .style('stroke', '#fff')
      .style("fill", d => d.color)
      .style('fill-opacity', d => (d.y1 > 0 && d.x1 - d.x0 > 0) ? 1 : 0)
    this.slices.append('title').html(d => d.data.name + ' ' + d.data.value);

    this.textPaths = this.root_g.append('g')
      .selectAll('path')
      .data(this.data)
      .join('path')
      .attr("pointer-events", "none")
      .attr('fill-opacity', 0)
      .attr('d', d => this.arc(d).split('L')[0])
      .attr('id', d => window.btoa(d.data.name))

    this.labels = this.root_g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "left")
      .style("user-select", "none")
      .selectAll("text")
      .data(this.data)
      .join("text")
      .attr("dy", 20)
      .attr("dx", 5)
      .append('textPath')
      .attr("pointer-events", "none")
      .attr('method', 'stretch')
      .attr("d", d => this.arc(d))
      .attr('xlink:href', d => '#' + window.btoa(d.data.name))
      .attr("fill-opacity", d => +this.labelVisible(d))
      //.attr("transform", d => this.labelTransform(d, r))
      .text(d => d.data.name)
      .attr('letter-spacing', 2)
      .style('fill', '#fff');

    this.slices
      .filter(d => {
        return d.children
      })
      .style('cursor', 'pointer')
      .on('click', (s, i) => {
        // console.warn(path[0]);

        d3.event.stopPropagation()
        this.navigationService.navigate([s.data.name]);
        this.newSliceRoot(this.slices, s)
        this.startTransition(this.root_g, this.slices, this.labels, this.textPaths, this.arc, this.r);
      })


    d3.select(domElement)
      .on('click', s => {
        d3.event.stopPropagation()
        this.navigationService.navigate([]);
        this.newSliceRoot(this.slices)
        this.startTransition(this.root_g, this.slices, this.labels, this.textPaths, this.arc, this.r)
      })
  }

  labelVisible(d) {
    return d.y0 > 0 && (d.x1 - d.x0) > 0.4;
  }

  labelTransform(d, radius) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  startTransition(root_g, slices, labels, textPaths, arc, radius) {
    const t = root_g.transition().duration(750)
    slices.transition(t)
      .tween('data', d => {
        const i = d3.interpolate(d.current, d.target);
        return t => {
          d.current = i(t)
        };
      })
      .attrTween('d', d => () => arc(d.current))
      .duration(750)

    textPaths.transition(t)
      .attrTween('d', d => () => arc(d.current).split('L')[0])

    labels.transition(t)
      .attr('fill-opacity', d => +this.labelVisible(d.target))
    //.attrTween('transform', d => () => this.labelTransform(d.current, radius))

  }
  pathChanged(path) {
    for (let i = 0; i < this.data.length; i++) {
      let element = this.data[i];
      if (element.data.name == path) {
        this.newSliceRoot(this.slices, element)
        this.startTransition(this.root_g, this.slices, this.labels, this.textPaths, this.arc, this.r);
        return;
      }
    }
    this.newSliceRoot(this.slices)
    this.startTransition(this.root_g, this.slices, this.labels, this.textPaths, this.arc, this.r);
  }

  newSliceRoot(slices, root = null) {
    if (!root) {
      slices.each(d => {
        if (!d.current) {
          d.current = {
            x0: d.x0,
            x1: d.x1,
            y0: d.y0,
            y1: d.y1
          }
        }
        d.target = {
          x0: d.x0,
          x1: d.x1,
          y0: d.y0,
          y1: d.y1
        }
      })
    } else {

      let level = root.depth - 1;
      let levelHeight = root.y1 - root.y0
      let levelChange = level - Math.max(0, level - 1)

      let slicePart = root.x1 - root.x0
      slices.each(d => {
        if (!d.current) {
          d.current = {
            x0: d.x0,
            x1: d.x1,
            y0: d.y0,
            y1: d.y1
          }
        }
        d.target = {
          x0: Math.max(0, Math.min(1, (d.x0 - root.x0) / slicePart)) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - root.x0) / slicePart)) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - levelChange * levelHeight),
          y1: Math.max(0, d.y1 - levelChange * levelHeight)
        }
      })
    }
  }
}

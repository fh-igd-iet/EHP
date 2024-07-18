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
import * as d3Selection from "d3-selection";
import * as d3Format from "d3-format";
import * as d3Path from "d3-path";
import * as d3Transition from "d3-transition";
import * as d3Scale from "d3-scale";
import * as d3Chromatic from "d3-scale-chromatic";
import * as d3Shape from "d3-shape";
import Listener from "../Common/Listener";

var d3 = Object.assign({},
	d3Selection,
	d3Format,
	d3Path,
	d3Transition,
	d3Scale,
	d3Chromatic,
	d3Shape);

export default class OverviewPiechart {
	svgNode: any;
	data: any;
	size: any;
	outerRadius: any;
	innerRadius: any;
	innerRadiusHover: any;
	color: any;
	formatPercentage: any;
	arc: any;
	arcHover: any;
	pieModel: any;
	sliceGroups: any;
	regionClickedListener: any;
	colorMap: any;

	constructor(svgNode, size, data, color) {
		this.svgNode = svgNode;
		this.data = data;
		this.size = size;

		this.outerRadius = Math.min(size.width, size.height) / 2;
		this.innerRadius = this.outerRadius * .5;
		this.innerRadiusHover = this.outerRadius * .45;
		this.color = color;

		this.formatPercentage = d3.format(".0%")

		this.regionClickedListener = new Listener();

		this.initializeModel();
		this.draw();
	}

	computeAngle(d) {
		var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
		return a > 90 ? a - 180 : a;
	}

	sumUpBudgets(reg) {
		if (!(reg in this.data))
			return 0;
		let sum = 0;
		for (let eco in this.data[reg])
			sum += this.data[reg][eco]
		return sum;
	}

	percentage(region) {
		let all = 0.0;
		let reg = 0.0;
		for (let regKey in this.data) {
			if (regKey == region) {
				reg = this.sumUpBudgets(regKey);
			}
			all += this.sumUpBudgets(regKey);
		}
		return reg / all;
	}

	initializeModel() {
		this.arc = d3.arc()
			.outerRadius(this.outerRadius)
			.innerRadius(this.innerRadius);

		this.arcHover = d3.arc()
			.outerRadius(this.outerRadius)
			.innerRadius(this.innerRadiusHover);


		let pieFn = d3.pie()
			.value(d => { return this.sumUpBudgets(d); });
		this.pieModel = pieFn(Object.keys(this.data));
		// add the text-angle of the pie to the model
		this.pieModel.forEach((d, i) => {
			let textAngle = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
			textAngle = textAngle > 90 ? textAngle - 180 : textAngle;
			d['textAngle'] = textAngle;
			d['color'] = this.color(d.data);
		});
	}

	draw() {
		d3.select(this.svgNode).select('#pieChart').remove();
		let chartNode = d3.select(this.svgNode).append('g').attr('id', 'pieChart');
		chartNode
			.attr('transform', 'translate(' + this.outerRadius + ', ' + this.outerRadius + ')');

		chartNode.append('circle')
			.attr('r', this.innerRadius)
			.attr('fill', 'rgb(128, 128, 128)')
			.on('click', () => { this.regionClickedListener.call(null); });
		chartNode.append('text')
			.attr('text-anchor', 'middle')
			.attr('fill', 'white')
			.style('pointer-events', 'none')
			.text('Overall');
		this.sliceGroups = chartNode.selectAll('g.slice')
			.data(this.pieModel)
			.enter().append('g').attr('class', 'slice')
			.on('mouseover', this.hoverSlice.bind(this))
			.on('mouseout', this.leaveSlice.bind(this))
			.on('click', this.clickSlice.bind(this));
		this.sliceGroups.append('path')
			.attr('fill', d => { return d.color })
			.attr('d', this.arc)
			.append('title').text(d => {
				return d.data + ": " + this.formatPercentage(this.percentage(d.data));
			});
		this.sliceGroups.filter(d => { return d.endAngle - d.startAngle > .2; })
			.append('text')
			.attr('dy', '.35em')
			.attr('text-anchor', 'middle')
			.attr('transform', d => {
				let t = 'translate(' + this.arc.centroid(d) + ')';
				t = t + 'rotate(' + d.textAngle + ')';
				return t;
			})
			.text(d => { return d.data });
	}

	hoverSlice(data, i, group) {
		d3.select(group[i]).select('path')
			.transition()
			.attr('d', this.arcHover);
	}

	leaveSlice(data, i, group) {
		d3.select(group[i]).select('path')
			.transition()
			.attr('d', this.arc);
	}

	clickSlice(d) {
		this.regionClickedListener.call(d.data);
	}
}
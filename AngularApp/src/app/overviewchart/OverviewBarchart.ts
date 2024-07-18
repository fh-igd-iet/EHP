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
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";

var d3 = Object.assign({},
	d3Selection,
	d3Format,
	d3Path,
	d3Transition,
	d3Scale,
	d3Shape,
	d3Array);

export default class OverviewBarchart {
	svgNode: any;
	size: any;
	data: any;
	format: any;
	color: any;
	labels: any;
	yScale: any;
	overallSum: any;
	barsNode: any;
	description: any;

	constructor(svgNode, size, data, color) {
		this.svgNode = svgNode;
		this.size = size;
		this.data = data;
		this.color = color;
		this.format = d3.format(".0f")
		this.labels = ['A', 'B', 'C', 'D', 'REUP', 'EoL', 'ADS', 'ASA'];
		this.description = [

		];
		this.yScale = d3.scaleLinear()
			.domain([0, d3.max(data)])
			.range([0, size.height - 70]);

		this.initialize();
	}

	animatedDataChange(data, color) {
		this.data = data;
		this.overallSum = 0;
		this.data.forEach(e => { this.overallSum += e; });
		this.yScale = d3.scaleLinear()
			.domain([0, d3.max(data)])
			.range([0, this.size.height - 70]);

		this.barsNode.selectAll('rect').data(this.data)
			.transition()
			.attr('height', this.yScale)
			.attr('fill', color);

		let barWidth = this.size.width / this.labels.length;
		this.barsNode.selectAll('g.textGroup').data(this.data)
			.transition()
			.attr('transform', (d, i) => {
				let textPos = [
					(i * barWidth) + (barWidth / 2),
					this.yScale(d) + 10
				];
				return 'translate(' + textPos + ')scale(1,-1)';
			})
			.select('text')
			.text(d => this.format(d));
	}

	initialize() {
		//d3.select(this.svgNode).select('#overviewText').remove();
		d3.select(this.svgNode).select('#header').remove();
		d3.select(this.svgNode).select('#footer').remove();
		d3.select(this.svgNode).select('#bars').remove();
		let headNode = d3.select(this.svgNode).append('g').attr('id', 'header');
		let footNode = d3.select(this.svgNode).append('g').attr('id', 'footer');
		let barsNode = d3.select(this.svgNode).append('g').attr('id', 'bars');
		this.barsNode = barsNode;

		headNode.append('text')
			.attr('x', this.size.width / 2)
			.attr('y', 17)
			.attr('text-anchor', 'middle')
			.text('ECO-Design-Themes (k€)');

		let barWidth = this.size.width / this.labels.length;

		footNode
			.attr('transform', 'translate(0,' + this.size.height + ')');
		footNode.selectAll('text')
			.data(this.labels).enter()
			.append('text')
			.attr('x', (d, i) => {
				return (i * barWidth) + (barWidth / 2);
			})
			.attr('text-anchor', 'middle')
			.text(d => { return d });

		barsNode
			.attr('transform', 'translate(0,' + (this.size.height - 17) + ')scale(1,-1)');

		barsNode.selectAll('rect').data(this.data)
			.enter().append('rect')
			.attr('x', (d, i) => { return i * barWidth })
			.attr('y', 0)
			.attr('width', barWidth)
			.attr('height', this.yScale)
			.attr('fill', this.color);

		barsNode.selectAll('g.textGroup').data(this.data)
			.enter().append('g')
			.attr('class', 'textGroup')
			.attr('transform', (d, i) => {
				let textPos = [
					(i * barWidth) + (barWidth / 2),
					this.yScale(d) + 10
				];
				return 'translate(' + textPos + ')scale(1,-1)';
			})
			.append('text')
			.attr('text-anchor', 'middle')
			.text(d => this.format(d));

	}

}
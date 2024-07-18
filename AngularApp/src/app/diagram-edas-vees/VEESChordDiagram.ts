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
//import * as ent from "../Entities"
import Listener from "../Common/Listener"

import { event as currentEvent } from 'd3-selection';


import * as COLORMAP from 'colormap';

import * as d3Selection from "d3-selection";
import * as d3Chord from "d3-chord";
import * as d3Shape from "d3-shape";
import * as d3Format from "d3-format";
import * as d3Transition from "d3-transition";

var d3 = Object.assign({},
	d3Selection,
	d3Chord,
	d3Shape,
	d3Format,
	d3Transition);


export default class VEESChordDiagram {
	svgNode: any;
	position: any;
	rad: any;
	chordMatrix: any;
	hoverLocked: boolean;
	technologiesHightlightedListener: any;
	technologieClickedListener: any;
	ecoThemeClickedListener: any;
	arc: any;
	chordLayout: any;
	ribbon: any;
	textPath: any;
	leftColorFN: any;
	rightColorFN: any;

	constructor(svgNode, position, rad, chordMatrix, leftColorFN, rightColorFN) {
		this.svgNode = svgNode;
		this.position = position;
		this.rad = rad;
		this.chordMatrix = chordMatrix;
		this.hoverLocked = false;

		this.leftColorFN = leftColorFN
		this.rightColorFN = rightColorFN


		this.technologiesHightlightedListener = new Listener();
		this.technologieClickedListener = new Listener();
		this.ecoThemeClickedListener = new Listener();

		this.initializeChordModel();
	}

	initializeChordModel() {
		let outerRadius = this.rad;
		let innerRadius = this.rad - 30;

		this.arc = d3.arc()
			.startAngle(d => { return d.startAngle + Math.PI })
			.endAngle(d => { return d.endAngle + Math.PI })
			.innerRadius(innerRadius)
			.outerRadius(outerRadius);

		this.chordLayout = d3.chord()
			.padAngle(.03);

		this.ribbon = d3.ribbon()
			.startAngle(function (d) { return d.startAngle + Math.PI })
			.endAngle(function (d) { return d.endAngle + Math.PI })
			.radius(innerRadius);

		this.textPath = d3.line()
			.x(function (d) { return d[0] })
			.y(function (d) { return d[1] })
	}

	getNumCols() {
		return this.chordMatrix.colNames.length;
	}
	/*
	getPathStartAndThroughPoint(technologie)
	{
		let chordData = this.chordLayout(this.chordMatrix);
		let tid = this.getNumEcoThemes() + technologie.id;
		let groupData = chordData.groups[tid];
		let start = this.arc.centroid(groupData);

		let vec = [start[0],start[1]]
		let nvec = [vec[0],vec[1]];
		let l = Math.sqrt(Math.pow(nvec[0],2) + Math.pow(nvec[1],2))
		nvec[0] = nvec[0]/l;
		nvec[1] = nvec[1]/l;
		let toVec = [vec[0]+nvec[0]*100,vec[1]+nvec[1]*100]

		let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute('d',this.arc(groupData).split('L')[0])
		let lenflat = path.getTotalLength();

		if(lenflat < 100)
			start = {x:toVec[0],y:toVec[1]};
		else
			start = {x:start[0],y:start[1]};
		let len = Math.sqrt(Math.pow(start.x,2)+ Math.pow(start.y,2));
		let through = {
			x: start.x+((start.x/len)*200),
			y: start.y+((start.y/len)*200)
		};
		start = {
			x: start.x+this.position.x,
			y: start.y+this.position.y
		};
		through = {
			x: through.x + this.position.x,
			y: through.y + this.position.y
		};
		return {start:start, through:through};
	}
	*/

	draw() {
		d3.select(this.svgNode).select('#chordDiagram').remove();
		let chordNode = d3.select(this.svgNode).append('g').attr('id', 'chordDiagram');
		this.drawChordDiagram(chordNode);
	}

	isEcoTheme(chordElementNumber) {
		return chordElementNumber < this.getNumCols();
	}

	chordElementName(chordElementIndex) {
		if (this.isEcoTheme(chordElementIndex)) {
			return this.chordMatrix.colNames[chordElementIndex].toUpperCase();
		} else {
			return this.chordMatrix.rowNames[chordElementIndex - this.getNumCols()];
		}
	}

	chordElementColor(chordElementIndex) {
		if (this.isEcoTheme(chordElementIndex)) {
			let name = this.chordMatrix.colNames[chordElementIndex];
			return this.leftColorFN(name)
		} else {
			let name = this.chordMatrix.rowNames[chordElementIndex - this.getNumCols()];
			return this.rightColorFN(name)
		}
	}

	drawChordDiagram(chordNode) {
		let chordData = this.chordLayout(this.chordMatrix.matrix());
		chordNode.attr('transform', 'translate(' + this.position.x + ',' + this.position.y + ')');

		let groupsNode = chordNode.append('g').attr('id', 'chordDiagGroups');
		let ribbonNode = chordNode.append('g').attr('id', 'chordDiagRibbons');
		// draw the group-arcs
		let chordGroupElements = groupsNode.selectAll('g')
			.data(chordData.groups)
			.enter().append('g')
			.attr('class', (d, i) => {
				let classes = 'group ';
				if (!this.isEcoTheme(i))
					classes = classes + 'technologie';
				else
					classes = classes + 'ecoTheme';
				return classes;
			});
		chordGroupElements.append('title').text((d, i) => {
			let v = d.value.toFixed(2);
			return this.chordElementName(i) + ': ' + v + ' k€';
		});
		chordGroupElements.append('path')
			.attr('d', (d, i) => { return this.arc(d) })
			.style('fill', (d, i) => {
				return this.chordElementColor(i)
				//if(this.isEcoTheme(i))
				//	return this.ecoThemeColors(d.)
				//return 'rgba(200,200,200,255)'
			});
		// append hidden text-paths
		chordGroupElements.append('path')
			.attr('id', (d, i) => { return 'group' + i })
			.style('display', 'none')
			.attr('stroke', 'red')
			.attr('d', (d, i) => {
				return this.arc(d).split('L')[0];
			});
		chordGroupElements.append('path')
			.attr('id', (d, i) => { return 'textgroup' + i })
			.style('display', 'none')
			.attr('stroke', 'red')
			.attr('d', (d, i) => {
				let vec = this.arc.centroid(d)
				let nvec = [vec[0], vec[1]];
				let l = Math.sqrt(Math.pow(nvec[0], 2) + Math.pow(nvec[1], 2))
				nvec[0] = nvec[0] / l;
				nvec[1] = nvec[1] / l;
				let toVec = [vec[0] + nvec[0] * 100, vec[1] + nvec[1] * 100]
				return this.textPath([vec, toVec]);
			});
		let chordText = chordGroupElements.append('text')
			.attr("x", 6)
			.attr("dx", (d, i) => {
				if (!this.isEcoTheme(i) &&
					d3.select('#group' + i).node().getTotalLength() < 100)
					return -10;
				return 0;
			})
			.attr("dy", (d, i) => {
				if (!this.isEcoTheme(i) &&
					d3.select('#group' + i).node().getTotalLength() < 100)
					return 4;
				return 15;
			});
		chordText.append('textPath')
			.attr("xlink:href", (d, i) => {
				if (!this.isEcoTheme(i) &&
					d3.select('#group' + i).node().getTotalLength() < 100)
					return "#textgroup" + i;
				return "#group" + i;
			})
			.text((d, i) => {
				return this.chordElementName(i);
			});

		// draw the chords
		ribbonNode.selectAll('path').data(chordData)
			.enter().append('path')
			.attr("class", "chord")
			.style("fill", d => {
				let i = d.source.index;
				return this.chordElementColor(i)
				//if(this.isEcoTheme(i))
				//	return this.ecoThemeColors[i]
				//return 'rgba(200,200,200,255)'
			})
			.attr("d", this.ribbon);
		// apply events
		groupsNode.selectAll('.technologie')
			.on('mouseover', (d, i) => {
				this.onTechnologieHover(i);
			})
			.on('click', (d, i) => {
				currentEvent.stopPropagation();
				this.onTechnologieClicked(i);
			});
		groupsNode.selectAll('.ecoTheme')
			.on('mouseover', (d, i) => {
				this.onEcothemeHover(i);
			})
			.on('click', (d, i) => {
				currentEvent.stopPropagation();
				this.onEcothemeClicked(i);
			});
		groupsNode.selectAll('g')
			.on('mouseout', (d, i) => {
				if (this.hoverLocked)
					return;
				this.highlightRibbons('ALL');
			});
	}

	hoverLock(hl) {
		this.hoverLocked = hl;
		if (!hl) {
			this.highlightRibbons('ALL');
		}
	}

	onTechnologieHover(technologie) {
		if (this.hoverLocked)
			return;
		this.highlightRibbons(new Set([technologie + this.getNumCols()]), false);
	}

	onTechnologieClicked(technologie) {
		this.technologieClickedListener.call(technologie + this.getNumCols());
		this.highlightRibbons(new Set([technologie + this.getNumCols()]), false);
	}

	onEcothemeHover(id) {
		if (this.hoverLocked)
			return;
		this.highlightEcotheme(id);
	}



	onEcothemeClicked(id) {
		this.highlightEcotheme(id);
		this.ecoThemeClickedListener.call(id);
	}

	highlightEcotheme(id) {
		this.highlightRibbons(new Set([id]));
	}

	highlightRibbons(ids, source = true) {
		this.technologiesHightlightedListener.call(ids);
		let ribbonNode = d3.select('#chordDiagRibbons');
		if (ids == 'ALL') {
			ribbonNode.selectAll('path').transition()
				.attr('opacity', 1);
			return;
		}
		ribbonNode.selectAll('path').transition()
			.attr('opacity', d => {
				let id = d.source.index;
				if (!source)
					id = d.target.index;
				//let t = ent.Technologie.byId(id, this.dataset);
				if (ids.has(id))
					return 1;
				return 0;
			});
	}

	showAllChords() {
		let ribbonNode = d3.select('#chordDiagRibbons');
		ribbonNode.selectAll('path').transition()
			.attr('opacity', 1);
	}
}
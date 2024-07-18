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
import OverviewBarchart from './OverviewBarchart';
import OverviewPiechart from './OverviewPiechart';
import { Widget } from '../Common/Widgets/Widget';

import * as d3Selection from "d3-selection";
import * as d3Format from "d3-format";
import * as d3Path from "d3-path";
import * as d3Transition from "d3-transition";
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import { NavigationService } from '../navigation.service';

import { RestService } from '../rest.service';
import { VEESChordmatrix } from '../Common/Chordmatrix';
import { ColorcodingService } from '../colorcoding.service';

var d3 = Object.assign({},
	d3Selection,
	d3Format,
	d3Path,
	d3Transition,
	d3Scale,
	d3Shape,
	d3Array);

/**
 * This Component visualizes in a piechart how much
 * money is spent for the different planeparts.
 * It also gives an overview of how much money is
 * spent per eco-design-theme in a barchart.
 */
@Component({
	selector: 'app-overviewchart',
	templateUrl: './overviewchart.component.html',
	styleUrls: ['./overviewchart.component.css']
})
export class OverviewchartComponent implements OnInit, Widget {

	svgNode: any;
	piechartData: any;
	piechartSize: any;
	piechartPos: any;
	barchartPos: any;
	barchartSize: any;
	barchartData: any;
	barchartColor: any;
	overallSum: number;
	barchartNode: any;
	textNode: any;
	barchart: any;
	piechartNode: any;
	pieChart: any;
	currentPath: any;
	veesrequest: any;
	chordmatrix: VEESChordmatrix;
	color: any;
	region: any;
	infoOpen: boolean = false;
	ecoLegendVisible: boolean = true;

	constructor(private colorCoding: ColorcodingService,
		private databaseService: RestService,
		private navigationService: NavigationService) {
		this.currentPath = []
		this.color = d => this.colorCoding.colorOfLabel('SPD_' + d)
	}

	initDiagram() {

	}

	resize() {
		this.setupDiagrams();
		this.pathChanged(this.navigationService.path)
	}

	ngAfterViewInit() {
		this.svgNode = document.getElementById('overviewDiagram');

		this.veesrequest = this.databaseService.requestVEESMatrixBy('spd', false, (matrix) => {
			this.chordmatrix = matrix;
			window.addEventListener("resize", () => {
				this.resize()
			});
			this.setupData(null);
			this.setupDiagrams();
		}, (error) => { console.log(error) });

		/*
		this.edasveesloader.loadData();
		this.edasveesloader.overallData.then(data=>{
			this.data = data;
			window.addEventListener("resize", ()=>{
				this.setupDiagrams();
				this.pathChanged(this.navigationService.path)
			});
			this.setupBarchartData(null);
			this.setupDiagrams();
		},error=>{
			console.log(error);
		});
		*/

		this.navigationService.pathChangeListener.add(path => {
			this.pathChanged(path)
		});

	}

	ngOnInit() {
	}

	pathChanged(path) {
		if (this.currentPath.join('/') != path.join('/')) {
			this.currentPath = path;
			this.setupData(path[0]);
			this.barchart.animatedDataChange(this.barchartData, this.barchartColor);
			this.textNode.text(d3.format(".0f")(this.overallSum) + ' k€');
		}
	}

	setupData(region) {
		this.piechartData = {};
		for (let rowName of this.chordmatrix.rowNames) {
			for (let colId in this.chordmatrix.colNames) {
				let colName = this.chordmatrix.colNames[colId];
				if (!(rowName in this.piechartData))
					this.piechartData[rowName] = {};
				this.piechartData[rowName][colName] = this.chordmatrix.getRow(rowName)[colId];

			}
		}
		if (region == null || !this.chordmatrix.rowNames.includes(region)) {
			this.barchartData = new Array(8).fill(0);
			let i_ = 0;
			for (let name in this.chordmatrix.colNames) {
				// sum up spd-col
				let sum = 0;
				for (let row of this.chordmatrix.rowNames)
					sum += this.chordmatrix.getRow(row)[i_];
				this.barchartData[i_] = sum;
				i_++;
			}
			this.barchartColor = 'grey';
		} else {
			this.barchartData = new Array(8).fill(0);
			let i_ = 0;
			for (let name in this.chordmatrix.colNames) {
				// sum up spd-col
				this.barchartData[i_] = this.chordmatrix.getRow(region)[i_];;
				i_++;
			}
			this.barchartColor = this.color(region);
		}
		this.region = region;
		this.overallSum = 0;
		this.barchartData.forEach(e => { this.overallSum += e; });
	}

	setupDiagrams() {
		let totalWidth = this.svgNode.getBoundingClientRect().width;
		let totalHeight = this.svgNode.getBoundingClientRect().height;

		let piechartsizeflat = Math.min(totalHeight / 2, totalWidth / 2)
		this.piechartSize = { width: piechartsizeflat, height: piechartsizeflat }
		this.piechartPos = { x: totalWidth / 4 - piechartsizeflat / 2, y: 0 }
		this.barchartPos = { x: 0, y: piechartsizeflat }
		this.barchartSize = { width: totalWidth, height: (totalHeight / 2) - 20 }
		let textPos = {
			x: totalWidth / 2,
			y: piechartsizeflat / 2
		}
		let textAnchor = 'left'
		let textBaseline = 'middle'

		// responsiveness
		if (totalWidth > 2 * totalHeight) {
			let piechartsizeflat = Math.min(totalHeight, (1 / 3.0) * totalWidth);
			this.piechartSize = { width: piechartsizeflat, height: piechartsizeflat }
			this.piechartPos = { x: 0, y: (totalHeight / 2) - (piechartsizeflat / 2.0) }
			this.barchartPos = { x: piechartsizeflat + 10, y: 50 }
			this.barchartSize = { width: totalWidth - (piechartsizeflat + 10), height: totalHeight - 70 }
			textPos = {
				x: this.barchartPos.x + (this.barchartSize.width / 2),
				y: this.barchartPos.y - 10
			}
			textAnchor = 'middle'
			textBaseline = 'bottom'
		}

		this.svgNode.innerHTML = ''

		// setup piechart
		d3.select(this.svgNode).select('#piechartDiagram').remove();
		this.piechartNode = d3.select(this.svgNode).append('g')
			.attr('id', 'piechartDiagram')
			.attr('transform', 'translate(' + this.piechartPos.x + ',' + this.piechartPos.y + ')')
			._groups[0][0];


		this.pieChart = new OverviewPiechart(this.piechartNode, this.piechartSize,
			this.piechartData, this.color);

		this.pieChart.regionClickedListener.add(region => {
			if (region == null)
				this.navigationService.navigate([]);
			else
				this.navigationService.navigate([region]);
		});

		// setup barchart
		this.barchartNode = d3.select(this.svgNode).append('g')
			.attr('id', 'barchartDiagram')
			.attr('transform', 'translate(' + [this.barchartPos.x, this.barchartPos.y] + ')')
			._groups[0][0];


		this.textNode = d3.select(this.svgNode).append('g')
			.attr('id', 'overviewtext')
			.attr('transform', 'translate(' + textPos.x + ',' + textPos.y + ')')
			.append('text')
			.attr('text-anchor', textAnchor)
			.attr('alignment-baseline', textBaseline)
			.attr('x', 0)
			.attr('y', 0);
		this.textNode.text(d3.format(".0f")(this.overallSum) + ' k€');
		this.barchart = new OverviewBarchart(this.barchartNode,
			this.barchartSize,
			this.barchartData,
			this.barchartColor);


	}


	toggleInfo() {
		let diagramElement = document.getElementById('overviewLegend');
		let legendElement = this.svgNode;
		let legendHeight = 120;

		if (!this.infoOpen) {
			let bbRect = legendElement.getBoundingClientRect();
			let h = bbRect.height - legendHeight;
			legendElement.style.height = h + 'px';

			diagramElement.style.height = legendHeight + 'px';
			diagramElement.style.display = 'block';
			this.infoOpen = true;
		} else {
			diagramElement.style.display = 'none';
			legendElement.style.height = '100%';
			this.infoOpen = false;
		}
		this.resize()
	}

	swapLegend() {
		this.ecoLegendVisible = !this.ecoLegendVisible;
	}
}
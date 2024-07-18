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

import Listener from "../Common/Listener"
import VEESChordDiagram from "./VEESChordDiagram"

import * as d3Selection from "d3-selection";
import * as d3Format from "d3-format";
import * as d3Path from "d3-path";
import * as d3Transtion from "d3-transition";
import * as d3Zoom from "d3-zoom";

import {event as currentEvent} from 'd3-selection';
import { NavigationService } from '../navigation.service';
import { ColorcodingService } from '../colorcoding.service';
import { RestService } from '../rest.service';
import { Widget } from '../Common/Widgets/Widget';

var d3 = Object.assign({},
  d3Selection,
  d3Format,
  d3Path,
  d3Transtion,
  d3Zoom);

@Component({
  selector: 'app-diagram-edas-vees',
  templateUrl: './diagram-edas-vees.component.html',
  styleUrls: ['./diagram-edas-vees.component.css']
})
export class DiagramEdasVeesComponent implements OnInit,Widget {


  dataset:any;
  svgNode: any;
  diagName: any;
  chordTable:any;
  chordMatrix:any;
  edasMapping:any;
  formatPercent:any;
  chordDiagram:any;
  packDiagram:any;
  connectionPaths:any;
  demonstratorSelectedListener:any;
  technologies:any;
  entities:any;
  currentDataWaitId:any;
  visible:boolean;
  zoomstates: any;
	rad: any;
  veesrequest: any;
  currentPath:string;

  constructor(
	private colorcoding: ColorcodingService,
	private navigationService: NavigationService,
	private databaseService: RestService) { }

	resize(): void {

	}

  ngOnInit() {
  this.svgNode = document.getElementById('chordDiagramZoomGroup');


	this.zoomstates = {}
	this.veesrequest = null;

	this.veesrequest = this.databaseService.requestVEESMatrixBy('spd',false,(matrix)=>{
		this.chordMatrix = matrix;
		this.afterDataLoaded('spd');
	},(error)=>{console.log(error)});

	document.getElementById("mappingSelect").addEventListener("change",()=>{
		this.reset();
		if(this.veesrequest != null)
			this.veesrequest.unsubscribe();
		let val = (<HTMLSelectElement>document.getElementById('mappingSelect')).value;
		this.veesrequest = this.databaseService.requestVEESMatrixBy(val,false,(matrix)=>{
			this.chordMatrix = matrix;
			this.afterDataLoaded(val);
		},(error)=>{console.log(error)});
	});

	this.navigationService.pathChangeListener.add(path=>{
    let p = path[0];
	//TODO make this right! onTechnologieClicked recives an number for the i-th element to highlight.
	// maybe a get method to retrive the number for the path selected in tyhe navigation service can fix this.
    switch (p) {
      case "SYS": this.chordDiagram.onTechnologieClicked(0); break;
      case "REG": this.chordDiagram.onTechnologieClicked(1); break;
      case "LPA": this.chordDiagram.onTechnologieClicked(2); break;
      case "ENG": this.chordDiagram.onTechnologieClicked(3); break;
      case "AIR": this.chordDiagram.onTechnologieClicked(4); break;
      case "TE": this.chordDiagram.onTechnologieClicked(5); break;
      case "FRC": this.chordDiagram.onTechnologieClicked(6); break;
      case undefined : this.chordDiagram.showAllChords();
      default:
          this.chordDiagram.showAllChords();
        break;
    }
		/*
		if(p in this.edasveesloader.datasets)
		{
			let id = Math.random();
			this.currentDataWaitId = id;
			this.edasveesloader.datasets[p].then(dataset=>{
				if(this.currentDataWaitId==id)
				{
					this.reset();

					this.dataset = dataset;
					this.diagName = p;
					this.chordTable = this.edasveesloader.parsedFiles[p]['chordNames'];
					this.chordMatrix = this.edasveesloader.parsedFiles[p]['chordMatrix'];
					this.edasMapping = this.edasveesloader.parsedFiles[p]['edas'];
					this.technologies = Array.from(this.dataset.technologies.values());
					this.entities = Array.from(this.dataset.entities.values());
					this.afterDataLoaded();

				}
			});
		}else
		{
			this.reset();
		}
		*/
	});
  }

  reset()
  {
	  this.svgNode.textContent = '';
  }

  afterDataLoaded(datatype:string)
  {
		//console.warn(datatype)
		let leftColorFN = d=>this.colorcoding.colorOfLabel('ECO_'+d)
		let rightColorFN = d=>this.colorcoding.colorOfLabel('SPD_'+d)
		if(datatype=='cohort' || datatype=='wp' || datatype=='owner')
		{
			rightColorFN = this.colorcoding.randomChlorophyll(this.chordMatrix.rowNames.length)
		}
		if(datatype=='owner-spd')
		{
			leftColorFN = this.colorcoding.randomChlorophyll(this.chordMatrix.colNames.length)
		}
		this.formatPercent = d3.format(".1%");
		let rad = 200;
    this.rad = rad;

    let rect = document.getElementById('chordDiag').getBoundingClientRect();
    let x = rect.width/2;
    let y = rect.height/2;
    console.warn(x,y);
		this.chordDiagram = new VEESChordDiagram(this.svgNode,
									{x:x,y:y},
									rad,
									this.chordMatrix,
									leftColorFN,
									rightColorFN);
		/*
		let rad = 300;
		this.rad = rad;
		this.chordDiagram = new VEESChordDiagram(this.svgNode,
									{x:rad,y:rad},
									rad,
									this.chordTable,
									this.chordMatrix);
		*/
		/*
		let width = 2*rad;
		let height = 40;
		this.packDiagram = new EDASPackDiagram(this.dataset,this.svgNode,
											{x:4*rad+50,y:rad},
											{width:width, height: height},
											this.edasMapping);
		*/

		//this.connectionPaths = this.generateConnectionPathsData();
		/*
		this.packDiagram.entityHighlightedListener.add(entid=>{
			if(entid==null)
			{
				this.showAllTechnologiePaths();
				this.chordDiagram.highlightTechnologies('ALL');
				this.highlightTechnologiePaths(null);
			}else
			{
				let e = ent.Entity.byId(entid, this.dataset);
				this.hideOtherTechnologiePaths(e.technologies);
				this.chordDiagram.highlightTechnologies(e.technologies);
				this.highlightTechnologiePaths(e);
			}
		});
		*/
		this.demonstratorSelectedListener = new Listener();
		/*
		this.packDiagram.entityClickedListener.add(entityId=>{
			this.packDiagram.hoverLock(true);
			this.chordDiagram.hoverLock(true);
			let entity = ent.Entity.byId(entityId, this.dataset);
			if(entity instanceof ent.Demonstrator)
			{
				this.demonstratorSelectedListener.call(entity);
			}
		});
		*/
		this.chordDiagram.technologieClickedListener.add(()=>{
			this.chordDiagram.hoverLock(true);
			//this.packDiagram.hoverLock(true);
		});

		this.chordDiagram.ecoThemeClickedListener.add(()=>{
			this.chordDiagram.hoverLock(true);
			//this.packDiagram.hoverLock(true);
		});

		d3.select(this.svgNode)
			.on('click',()=>{
				if(currentEvent.eventPhase == 3)
				{
					//this.packDiagram.hoverLock(false);
					this.chordDiagram.hoverLock(false);
					//this.highlightTechnologiePaths(null);
				}
			});

		/*
		this.chordDiagram.technologiesHightlightedListener.add(techs=>{
			this.hideOtherTechnologiePaths(techs);
			// collect entities that needs to be shown
			if(techs == 'ALL')
				this.packDiagram.hideOtherEntities(null);
			else
			{
				let ents = new Set();
				techs.forEach(t=>{
					t.materials.concat(t.demonstrators).map(m=>{
						ents.add(m);
					})
				});
				this.packDiagram.hideOtherEntities(Array.from(ents));
			}
		});
		*/

		this.chordDiagram.draw();
		//this.packDiagram.draw();
		//this.drawPaths();

		this.initZoom()
  }

  initZoom()
  {
		if(!(this.diagName in this.zoomstates))
		{
			this.zoomstates[this.diagName] = {
				set: false,
				transform: d3.zoomIdentity
			};
		}
		this.updateZoom()
    var zoom = d3.zoom()
      .scaleExtent([0.1, 1])
      .on("zoom", ()=>{
        if(currentEvent.type=="zoom")
        {
          let trans = [currentEvent.transform.x,currentEvent.transform.y];
          let scale = currentEvent.transform.k;
		  let container = d3.select(document.getElementById('chordDiagramZoomGroup'));
		  // get current transform
		  let oldTrans = d3.zoomTransform(document.getElementById('chordDiag'))
		  if(scale == oldTrans.k)
          {
            container.attr("transform", "translate(" + trans + ")scale(" + scale + ")");
          } else
          {
            container.transition().attr("transform", "translate(" + trans + ")scale(" + scale + ")");
          }
		  this.zoomstates[this.diagName].transform =  d3.zoomTransform(document.getElementById('chordDiag'));
		  this.zoomstates[this.diagName].set = true;
        }
      })
      .filter(()=>{
        return currentEvent.altKey === true;
      });
    d3.select(document.getElementById('chordDiag'))
	  .call(zoom)
	  .call(zoom.transform, this.zoomstates[this.diagName].transform);
  }

  updateZoom()
  {
	  let state = this.zoomstates[this.diagName]
	  if(!state.set)
	  {
			let viewArea = document.getElementById('chordDiag');
			let totalWidth = viewArea.getBoundingClientRect().width;
			let totalHeight = viewArea.getBoundingClientRect().height;
			let maxSpace = Math.min(totalWidth, totalHeight)
			let scale = maxSpace/((this.rad*2)+200);
			this.zoomstates[this.diagName].transform.k = scale;
			this.zoomstates[this.diagName].transform.y = 100*scale;
	  }
  }

  generateConnectionPathsData()
	{
	// Generate connection-Paths
		this.connectionPaths =
			this.technologies.map( t => {
				let p = this.chordDiagram.getPathStartAndThroughPoint(t);
				let ents = t.demonstrators.map(ent=>{
					let end = this.packDiagram.getPosition(ent);
					return {technologie: t, entity:ent, start: p.start, through:p.through, end: end};
				});
				return ents;
			});
		return [].concat.apply([], this.connectionPaths);

	}

	drawPaths()
	{
		d3.select(this.svgNode).select('#paths').remove();
		let pathNode = d3.select(this.svgNode).append('g').attr('id','paths');
		pathNode.selectAll('path')
			.data(this.connectionPaths)
			.enter().append('path')
			.attr('stroke', 'rgba(0.9,0.9,0.9,0.1)')
			.attr('fill', 'none')
			.attr('stroke-width', '2')
			.attr('d', function(d) {
				let p = d3.path();
				p.moveTo(d.start.x,d.start.y);
				p.quadraticCurveTo(d.through.x,d.through.y,d.end.x,d.end.y);
				//p.closePath();
				return p.toString();
			})
			.style('pointer-events', 'none');
	}

	showAllTechnologiePaths()
	{
		let paths = d3.select(this.svgNode).select('#paths').selectAll('path');
		paths.transition().attr('opacity', 1);
	}

	hideOtherTechnologiePaths(technologies)
	{
		let paths = d3.select(this.svgNode).select('#paths').selectAll('path');
		if(technologies == 'ALL')
			paths.transition().attr('opacity', 1);
		else
		{
			paths.transition().attr('opacity', d=>{
					if( technologies.indexOf(d.technologie) >= 0)
						return 1;
					return 0;
				});
		}
	}

	highlightTechnologiePaths(entity)
	{
		let paths = d3.select(this.svgNode).select('#paths').selectAll('path');
		if(entity == null)
		{
			paths.attr('stroke', 'rgba(0.9,0.9,0.9,0.1)');
			return;
		}

		paths.attr('stroke', d=>{
				if( d.entity.id == entity.id )
				{
					return 'red';
				}
				return 'rgba(0.9,0.9,0.9,0.1)';
			})
	}

}

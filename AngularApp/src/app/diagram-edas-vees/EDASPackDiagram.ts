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

import {event as currentEvent} from 'd3-selection';

import * as d3Selection from "d3-selection";
import * as d3Hierarchy from "d3-hierarchy";
import * as d3Format from "d3-format";

var d3 = Object.assign({}, 
    d3Selection,
    d3Hierarchy,
    d3Format);

export default class EDASPackDiagram
{
    svgNode: any;
    edasMapping: any;
    entityHighlightedListener:any;
    entityClickedListener: any;
    hoverLocked: boolean;
    position: any;
    size: any;
    pack: any;
    packData: any;
	dataset: any;
	blockData: any;
	elementHeight: any;

	constructor(dataset,svgNode, position, size, edasMapping)
	{
        this.dataset = dataset;
		this.svgNode = svgNode;
		this.edasMapping = edasMapping;
		this.entityHighlightedListener = new Listener();
		this.entityClickedListener = new Listener();
		this.hoverLocked = false;
		
		this.position = position;
		this.size = size;
		this.pack = d3.pack()
			.size([size.width, size.height])
			.radius(function(){return 80;})
			.padding(30.5);
		this.packData = null;
		this.blockData = null;
		this.initializeData();
	}

	initializeData()
	{
		//find demonstrators
		let demonstrators = null;
		for(let i = 0; i < this.edasMapping.children.length; i++)
		{
			if(this.edasMapping.children[i].name == 'Demonstrators')
			{
				demonstrators = this.edasMapping.children[i];
				break;
			}
		}

		// compute dimensions
		let height = this.size.height
		let width = this.size.width

		// compute layout
		let blockLayout = []
		for(let i = 0; i < demonstrators.children.length; i++)
		{
			let layoutElement = {data:demonstrators.children[i]}
			let disY = i-(demonstrators.children.length/2.0)
			let y = (disY*height);
			let x = -width/2.0;
			layoutElement['x'] = x
			layoutElement['y'] = y
			layoutElement['w'] = width
			layoutElement['h'] = height
			blockLayout.push(layoutElement)
		}
		this.blockData = blockLayout;
	}
	
	getPosition(matOrDemonstrator)
	{
		let id = matOrDemonstrator.id;
		let data = null;
		if( this.blockData.some(d=>{
				// ;-)
				data = d;
				return 'id' in d.data && d.data.id == id} ) )
		{
			return {x:this.position.x+data.x, y:this.position.y+data.y+(this.size.height-4)/2};
		}
		return null;
	}
	
	hoverLock(hl)
	{
		this.hoverLocked = hl;
		if(!hl)
		{
			this.hideOtherEntities(null);
		}
	}
	
	draw()
	{
		this.initializeData();
		d3.select(this.svgNode).select('#packDiagram').remove();
		let packNode = d3.select(this.svgNode).append('g').attr('id','packDiagram');
		packNode.attr('transform', 'translate('+this.position.x+','+this.position.y+')');
		
		let descendantGroups = packNode.selectAll('g').data(this.blockData)
			.enter().append('g')
			.attr('transform',function(d){return 'translate('+d.x+','+d.y+')';});
		descendantGroups.append('title')
			.text(function(d){return d.data.name});
		descendantGroups.append('g')
			.attr('transform','translate(0, 4)')
			.append('rect')
			.attr('width',function(d){return d.w})
			.attr('height', function(d){return d.h-2})
			.attr('fill', function(d,i){
				if(d.parent == null)
					return '#5687d1';
				else if(!('children' in d.data))
				{
					return d.parent.data.color;
				}
				return 'rgba(0.9,0.9,0.9,0.1)';
			})
			.attr('rx','5')
			.attr('ry','5');
		descendantGroups.filter(d => { return !d.children; })
		  .append("g")
		  .attr("transform","translate(5,"+this.size.height/2+")")
		  .append("text")
		  .attr("dy", "0.3em")
		  .text(function(d) { return d.data.name.substring(0, d.w / 7); })
		  .style('pointer-events', 'none')
		  .attr('text-anchor', 'left');
		  
		descendantGroups.filter(function(d) { return !d.children; })
			.on('mouseover', d=>{
				this.entityHovered(d.data.id);
			})
			.on('click', d=>{
				currentEvent.stopPropagation();
				this.entityClicked(d.data.id);
			})
			.on('mouseout', d=>{
				this.entityLeft(d.data.id);
			});
	}
	
	highlightEntity(entityId)
	{
		this.entityHighlightedListener.call(entityId);
		// collect Entities that needs to be shown;
		let ents :any = new Set();
		ents.add(entityId);
		/*
		ent.Entity.byId(entityId, this.dataset).technologies
			.forEach(t=>{
				t.demonstrators.concat(t.materials)
					.forEach(m=>{
						ents.add(m.id);
					})
			});
		ents = Array.from(ents).map(id=>{return ent.Entity.byId(id, this.dataset)});
		*/
		// hide other entities
		this.hideOtherEntities(ents);
	}
	
	hideOtherEntities(entities)
	{ 
		let circleNodes = d3.select(this.svgNode).select('#packDiagram').selectAll('g');
		let childNodes = circleNodes.filter(d => { return !d.children; });
		if(entities==null)
		{
			childNodes.transition().attr('opacity', 1);
		} else
		{
			childNodes.transition().attr('opacity',d=>{
				/*
				if(entities.indexOf(ent.Entity.byId(d.data.id, this.dataset)) >= 0)
					return 1;
				else
					return 0;
				*/
				return 0;
			});
		}
	}
	
	entityHovered(entityId)
	{
		if(this.hoverLocked)
			return;
		this.highlightEntity(entityId);
	}
	
	entityClicked(entityId)
	{
		this.entityClickedListener.call(entityId);
		this.highlightEntity(entityId);
	}
	
	entityLeft(entityId)
	{
		if(this.hoverLocked)
			return;
		this.entityHighlightedListener.call(null);
		this.hideOtherEntities(null);
	}
}
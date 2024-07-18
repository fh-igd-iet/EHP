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
/**
 * This class draws a colormap(see npm-package colormap)
 * onto a html-canvas-element
 */
export class Colormap
{
    canvas:any;
    colormap: any;
    min: any;
    max: any;

    constructor( canvas, colormap, min, max )
    {
        this.canvas = canvas;
        this.colormap = colormap;
        this.min = min;
        this.max = max;
        this.redraw();
    }

    setColormap(colormap)
    {
        this.colormap = colormap
        this.redraw()
    }

    setMin(min)
    {
        this.min = min;
        this.redraw()
    }

    setMax(max)
    {
        this.max = max;
        this.redraw()
    }

    redraw()
    {
        let elementHeight = this.canvas.height/this.colormap.length;
        let elementWidth = 40;
        let ctx = this.canvas.getContext("2d");
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.heighth);
        let i = 0;
        for(let c of this.colormap)
        {
            ctx.fillStyle = c;
            ctx.fillRect(this.canvas.width-elementWidth, this.canvas.height-(i*elementHeight), elementWidth, elementHeight)
            i++;
        }

        ctx.fillStyle = "#000";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.canvas.width-elementWidth, this.canvas.height-1)
        ctx.lineTo(this.canvas.width-(elementWidth+10), this.canvas.height-1)
        ctx.stroke()
        ctx.closePath();

        ctx.fillStyle = "#000";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.canvas.width-elementWidth, elementHeight+1)
        ctx.lineTo(this.canvas.width-(elementWidth+10), elementHeight+1)
        ctx.stroke()
        ctx.closePath();

        ctx.font = "20px Arial"
        ctx.textAlign = "right"
        ctx.fillText(""+this.min+"kg", this.canvas.width-(elementWidth+10), this.canvas.height-2)
        ctx.fillText(""+this.max+"kg", this.canvas.width-(elementWidth+10), elementHeight+15)
    }
}
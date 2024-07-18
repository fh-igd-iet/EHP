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
import { TouchSequence } from "selenium-webdriver";

export class TextBox {
    dom: any;
    domHeading: any;
    domBody: any;
    position: any;
    size: any;
    heading: any;
    info: any;
    visible: any;
    highlightIndex: any;
    constructor(position, size, heading, info) {
        this.visible = false;
        this.dom = document.createElement('div');
        this.domHeading = document.createElement('div');
        this.domBody = document.createElement('div');
        this.position = position;
        this.size = size;
        this.heading = heading;
        this.info = info;
        this.highlightIndex = Object.keys(info)[0];

        this.dom.style.pointerEvents = 'none';
        this.domHeading.style.width = '100%';
        this.domHeading.style.border = '1px solid black';
        this.domHeading.style.background = 'rgba(100,100,100,0.8)';
        this.domHeading.style.padding = '3px';
        this.domHeading.style.boxSizing = 'border-box';
        this.domHeading.style.color = 'black'
        this.domBody.style.width = '100%';
        this.domBody.style.border = '1px solid black';
        this.domBody.style.padding = '3px';
        this.domBody.style.boxSizing = 'border-box';
        this.domBody.style.background = 'rgba(255,255,255,0.8)';
        this.domBody.style.color = 'black';
        this.dom.appendChild(this.domHeading);
        this.dom.appendChild(this.domBody);
        this.updateDom();
    }

    updateDom() {
        this.dom.style.position = 'fixed';
        this.dom.style.display = 'block';
        if (!this.visible) {
            this.dom.style.display = 'none'
        }
        this.dom.style.width = this.size[0] + 'px';
        this.dom.style.height = this.size[1] + 'px';
        this.dom.style.left = this.position[0] + 'px';
        this.dom.style.top = this.position[1] + 'px';

        this.domHeading.style.height = '25px'
        this.domBody.style.height = (this.size[1] - 50) + 'px';

        this.domHeading.innerHTML = this.heading;
        this.domBody.innerHTML = '';
        let innerHTML = '<table>';
        innerHTML += '<tr><td><b>' + this.highlightIndex + ':</b></td><td>' + this.info[this.highlightIndex] + 'kg</td></tr>';
        innerHTML += '<th><td colspan=2>&nbsp;</td></tr>'
        for (let iK in this.info) {
            if (iK != this.highlightIndex) {
                if (iK == "PrimaryEnergyDemand(PED)")
                    innerHTML += '<tr style="color:#555"><td><b>' + iK + ':</b></td><td>' + this.info[iK] + 'MJ</td></tr>';
                else
                    innerHTML += '<tr style="color:#555"><td><b>' + iK + ':</b></td><td>' + this.info[iK] + 'kg</td></tr>';
            }
        }
        innerHTML += '</table>'
        this.domBody.innerHTML = innerHTML;


    }
}


export class ThreejsTextOverlay {
    domContainer: any;
    threejsNode: any;
    textBox: any;
    mouseX: any;
    mouseY: any;
    labels: any;
    domLabels: any;
    labelPositions: any;
    labelsHidden: boolean;


    constructor(threejsNode) {
        this.labels = []
        this.domLabels = []
        this.labelPositions = []
        this.labelsHidden = true;

        this.threejsNode = threejsNode;
        this.domContainer = this.threejsNode.parentNode;
        this.threejsNode.addEventListener('mousemove', (e) => {
            this.mouseX = e.pageX - window.scrollX
            this.mouseY = e.pageY - window.scrollY
            return false;
        })


        this.textBox = new TextBox([0, 0], [350, 150], 'test', { 'i1': 'testtesttest', 'i2': 'tests test t estste 2' })
        this.threejsNode.parentNode.appendChild(this.textBox.dom)
        this.update();
    }

    showLabels() {
        this.labelsHidden = false;
        this.updateLabelVisibility()
    }

    hideLabels() {
        this.labelsHidden = true;
        this.updateLabelVisibility()
    }

    updateLabelVisibility() {
        for (let i = 0; i < this.domLabels.length; i++) {
            if (this.labelsHidden)
                this.domLabels[i].style.display = 'none';
            else
                this.domLabels[i].style.display = 'block';
        }
    }

    setLabels(labels, positions) {
        this.labels = labels;
        for (let i = 0; i < this.domLabels.length; i++) {
            this.domContainer.removeChild(this.domLabels[i]);
        }
        this.domLabels = []
        for (let i = 0; i < this.labels.length; i++) {
            let domLabel = document.createElement('div')
            domLabel.setAttribute('class', 'label');
            domLabel.innerHTML = this.labels[i]
            this.domLabels.push(domLabel)
            this.domContainer.appendChild(domLabel);
        }
        this.updateLabelVisibility()
        this.updateLabelPositions(positions)
    }

    updateLabelPositions(positions) {

        this.labelPositions = positions;
        if (!this.labelsHidden) {
            for (let i = 0; i < this.domLabels.length; i++) {
                this.domLabels[i].style.display = 'block'
                this.domLabels[i].style.left = Math.floor(positions[i][0]) + 'px'
                this.domLabels[i].style.top = Math.floor(positions[i][1]) + 'px'
            }
            this.hideOutOfBoundsLabels();
        }
    }

    hideOutOfBoundsLabels() {
        let r = this.domContainer.getBoundingClientRect()
        let width = r.width
        let height = r.height
        for (let i = 0; i < this.domLabels.length; i++) {
            if (this.labelPositions[i][0] < 0 || this.labelPositions[i][0] > width ||
                this.labelPositions[i][1] < 0 || this.labelPositions[i][1] > height) {
                this.domLabels[i].style.display = 'none';
            }
        }
    }

    showInfobox(heading, info, highlightIndex) {
        this.textBox.heading = heading;
        this.textBox.info = info;
        this.textBox.highlightIndex = highlightIndex;
        this.textBox.visible = true;
        this.textBox.updateDom();
    }

    hideInfobox() {
        this.textBox.visible = false;
        this.textBox.updateDom();
    }

    update() {
        let parentBox = this.threejsNode.getBoundingClientRect();
        this.textBox.position = [this.mouseX - this.textBox.size[0], this.mouseY];
        this.textBox.updateDom();

    }
}
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
import * as THREE from 'three';
import { ThreejsTextOverlay } from '../factory-vis/ThreejsTextOverlay';

export class EventSystem {
    domelement: HTMLElement;
    whatchedElements: Set<THREE.Mesh>;
    hoveredElement: THREE.Mesh = null;
    scene: THREE.Node = null;
    distance: number = 0;
    raycast: THREE.Raycaster;
    hovering_on: boolean = true;
    component: any;
    event_click: Object;
    event_mousein: Object;
    event_mouseout: Object;
    event_pathchange: Object;


    constructor(domelement, component) {
        this.raycast = new THREE.Raycaster();
        this.whatchedElements = new Set<THREE.Mesh>();
        this.component = component;
        this.domelement = domelement;

        this.event_click = {
            type: 'click',
            component: this.component
        }
        this.event_mousein = {
            type: 'mousein',
            component: this.component
        }
        this.event_mouseout = {
            type: 'mouseout',
            component: this.component
        }

        this.event_pathchange = {
            type: 'pathchange',
            link: '',
            component: this.component
        }

        this.domelement.addEventListener('click', e => {
            if (this.hoveredElement != null) {
                this.hoveredElement.dispatchEvent(this.event_click);
            }
        })
    }

    hovering(on: boolean) {
        this.hovering_on = on;
    }

    push(e: THREE.Mesh) {
        this.whatchedElements.add(e)
    }

    setRoot(s: Object) {
        this.scene = s
    }

    clear() {
        this.whatchedElements.clear()
    }

    triggerPathchange(link: string) {
        this.event_pathchange['path'] = link
        this.scene.pathchange(this.event_pathchange)
    }

    update(c: THREE.Camera, mouse: THREE.Vector2) {
        let oldHover = this.hoveredElement;
        if (this.hovering_on) {
            this.raycast.setFromCamera(mouse, c)
            let intersections = this.raycast.intersectObjects(Array.from(this.whatchedElements.values()))
            let intersecting: THREE.Mesh[] = []
            let intersectingSet: Set<THREE.Mesh> = new Set()
            for (let i of intersections) {
                if (!intersectingSet.has(i.object)) {
                    intersectingSet.add(i.object)
                    intersecting.push(i.object);
                }
            }



            if (intersecting.length > 0) {
                let nearest = intersecting[0]
                if (nearest != this.hoveredElement) {
                    if (this.hoveredElement != null)
                        this.hoveredElement.dispatchEvent(this.event_mouseout)
                    nearest.dispatchEvent(this.event_mousein)
                    this.hoveredElement = nearest
                }
            } else {
                if (this.hoveredElement != null) {
                    this.hoveredElement.dispatchEvent(this.event_mouseout)
                    this.hoveredElement = null
                }
            }
        }
    }
}
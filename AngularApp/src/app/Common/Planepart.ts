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

// The class holds and creates the threejs mesh-node
// its responsible for the appearence of the planeparts
export default class Planepart
{
    // the a threejs geometry
    mesh: any;
    file: string;

    constructor(file:string,geometry:any)
    {
        let material = new THREE.MeshLambertMaterial({
            'color':0x333333,
            'emissive':0x0,
            //'roughness':0.72,
            //'metalness':0.0,
            'reflectivity':0,
            //'clearCoat':0.14,
            'side':THREE.DoubleSide
        });
        //material.shading = THREE.SmoothShading;
        geometry.computeFaceNormals(true);
        
        this.mesh = new THREE.Mesh(geometry,material);
        this.file = file;
    }
}
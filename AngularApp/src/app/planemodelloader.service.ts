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
import { Injectable } from '@angular/core';
import Planepart from './Common/Planepart';
import { MTLLoader, OBJLoader } from 'three-obj-mtl-loader';
let objLoader = new OBJLoader();
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
/**
 * This service is reposible of loading
 * the 3d-plane-model asynchronously.
 */
export class PlanemodelloaderService {

  loadInited: boolean;
  planeFiles: string[];
  planeParts: Promise<Planepart[]>;

  constructor() {
    this.loadInited = false;
    this.planeFiles = [
      'assets/planepartModels/winglets.obj',
      'assets/planepartModels/engine1.obj',
      'assets/planepartModels/engine2.obj',
      'assets/planepartModels/engine3.obj',
      'assets/planepartModels/engine4.obj',
      'assets/planepartModels/engineFan1.obj',
      'assets/planepartModels/engineFan2.obj',
      'assets/planepartModels/engineFan3.obj',
      'assets/planepartModels/engineFan4.obj',
      'assets/planepartModels/fuselage.obj',
      'assets/planepartModels/gearFront.obj',
      'assets/planepartModels/gearRear1.obj',
      'assets/planepartModels/gearRear2.obj',
      'assets/planepartModels/gearWing1.obj',
      'assets/planepartModels/gearWing2.obj',
      'assets/planepartModels/stabilizerHorizontal1.obj',
      'assets/planepartModels/stabilizerHorizontal2.obj',
      'assets/planepartModels/stabilizerVertical.obj'
    ];
  }

  loadData(): void {
    if (!this.loadInited) {
      this.loadInited = true;
      this.planeParts = new Promise<Planepart[]>(function (resolve, reject) {
        let numParts = this.planeFiles.length;
        let promises = [];
        let planeparts = [];
        for (let file of this.planeFiles) {
          promises.push(new Promise<Planepart>(function (resolve, reject) {
            objLoader.load(file,
              function (group) {
                //geo.children[0].material = new THREE.MeshNormalMaterial()
                let geometry = group.children[0].geometry;
                let planepart = new Planepart(file, geometry);
                resolve(planepart);
              }.bind(this),
              // called while loading is progressing
              function (xhr) {
              },
              // called when loading has errors
              function (error) {
                reject(error);
              }
            );
          }.bind({ file: file })));
        }

        for (let promise of promises) {
          promise.then(function (planepart) {
            planeparts.push(planepart);
            if (planeparts.length == numParts) {
              let planeBox = new THREE.Box3()
              for (let planepart of planeparts) {
                let partBox = new THREE.Box3().setFromObject(planepart.mesh)
                planeBox = planeBox.union(partBox)
              }
              let center = new THREE.Vector3()
              planeBox.getCenter(center);
              for (let planepart of planeparts) {
                planepart.mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
              }
              resolve(planeparts);
            }
          }, function (error) {
            console.log(error);
            reject();
          });
        }
      }.bind(this));

    }
  }
}

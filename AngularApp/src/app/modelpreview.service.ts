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
import { Injectable, ɵɵtrustConstantResourceUrl } from '@angular/core';
import { ModelloaderService } from './modelloader.service';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class ModelpreviewService {

  renderer:THREE.Renderer = null;

  constructor(private modelloader: ModelloaderService) 
  {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false
    });
    this.renderer.physicallyCorrectLights = true;
  }

  getPreviewBlobOfDemonstrator(modelpath:string, link:string, width:number, height:number)
  {

    
    return new Promise((res, rej)=>{
      this.modelloader.gltfToScene(modelpath,(xhr) => console.log(xhr)).then(
        (scene) => {
          console.log(scene)
          let camera:THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
          this.renderer.setSize(width, height);
          let sceneWrapper = new THREE.Scene();
          sceneWrapper.add(scene["scene"])
          //let box = new THREE.Box3().setFromObject(sceneWrapper);
          let linkObject = null
          sceneWrapper.traverse((obj:THREE.Object3D)=>{
            if ('userData' in obj && 'Link' in obj.userData && obj.userData['Link'] == link) {
                linkObject = obj
            }
          })
          sceneWrapper.updateMatrix()
          if(linkObject !== null)
          {
            console.log("link object")
            console.log(linkObject)
            
            if("CAM_POS" in linkObject.userData)
            {
              let cam_pos_parse = JSON.parse(linkObject.userData["CAM_POS"])
              let globVec = scene["scene"].localToWorld(new THREE.Vector3(
                cam_pos_parse[0],
                cam_pos_parse[2],
                -cam_pos_parse[1]
              ));

              camera.updateProjectionMatrix()
              camera.position.copy(
                globVec
              )
              camera.updateProjectionMatrix()
              let worldPos = new THREE.Vector3()
              linkObject.getWorldPosition(worldPos)
              camera.lookAt(worldPos);
              camera.updateProjectionMatrix();
            } else
            {
              let box = new THREE.Box3().setFromObject(linkObject);
              var center = new THREE.Vector3();
              var size = new THREE.Vector3();
              
              
              box.getCenter(center);
              box.getSize(size);
              console.log(link)
              console.log(box)

              var maxDim = size.x;
              var targetHeight = width / Math.max(width, height);
    
              if (size.y > size.x) {
                maxDim = size.y;
                targetHeight = height / Math.max(height, width);
              }
    
              const camZ = maxDim / (targetHeight / 2);
              camera.position.set(
                center.x,
                center.y,
                center.z + size.z*2
              )
              camera.updateProjectionMatrix();
              const minZ = box.min.z;
              const cameraToFarEdge = (minZ < 0) ? -minZ + camZ : camZ - minZ;
              camera.far = cameraToFarEdge * 10;
              camera.up.set(0, 1, 0);
              camera.updateProjectionMatrix();
              camera.lookAt(center.x, center.y, center.z);
            }
            camera.updateProjectionMatrix();
            console.log(camera)
          }
          let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
          sceneWrapper.add(directionalLight);
          directionalLight.position.copy(camera.position)
          linkObject.updateMatrixWorld()
          directionalLight.target = linkObject
          

          var light = new THREE.AmbientLight(0xffffff, 1.5);
          sceneWrapper.add(light);
          this.renderer.render(sceneWrapper, camera);

          this.renderer.domElement.toBlob(res)
        },
        error => {
          rej(error)
        }
      )
      
    })
  }
}

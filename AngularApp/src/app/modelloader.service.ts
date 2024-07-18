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
import { Subject } from 'rxjs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { ThreejsTextOverlay } from './factory-vis/ThreejsTextOverlay';

@Injectable({
  providedIn: 'root'
})
export class ModelloaderService {

  loader: GLTFLoader;

  materialSolid: THREE.MeshPhysicalMaterial;
  materialSolidHovered: THREE.MeshPhysicalMaterial;
  materialTransparentFront: THREE.MeshPhysicalMaterial;
  materialTransparentBack: THREE.MeshPhysicalMaterial;

  public spdSelection: Subject<string> = new Subject<string>();
  public samSelection: Subject<string> = new Subject<string>();

  sceneCache: Map<string,THREE.Scene> = new Map<string, THREE.Scene>();
  sceneLinks: Map<string,Set<string>> = new Map<string, Set<string>>();

  constructor() {
    this.loader = new GLTFLoader()
    this.materialSolid = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0xDDDDDD,
      metalness: 0.5,
      roughness: 0.9,
      side: THREE.DoubleSide,
      envMapIntensity: 5,
      premultipliedAlpha: true,
      flatShading: false
    })
    this.materialSolidHovered = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0x888888,
      metalness: 0.5,
      roughness: 0.9,
      side: THREE.DoubleSide,
      envMapIntensity: 5,
      premultipliedAlpha: true,
      flatShading: false
    })
    this.materialTransparentBack = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0xAAAAAA,
      metalness: 0,
      roughness: 0,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
      envMapIntensity: 5,
      premultipliedAlpha: true,
      flatShading: false
    })
    this.materialTransparentFront = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0xAAAAAA,
      metalness: 0,
      roughness: 0,
      transparent: true,
      opacity: 0.2,
      side: THREE.FrontSide,
      envMapIntensity: 5,
      premultipliedAlpha: true,
      flatShading: false
    })
  }

  initTransparent(node: THREE.Mesh) {
    if (!('modelloader_is_transparent' in node)) {
      let g = new THREE.Group();
      g.modelloader_material = node.material;
      g.modelloader_is_transparent = false;
      node.parent.add(g)
      node.transparent_material = this.materialTransparentFront
      g.add(node)
      let clone = node.clone()
      clone.material = this.materialTransparentBack
      clone.visible = false;
      g.add(clone)
      return g;
    }
    return node;
  }

  setTransparent(node: THREE.Group, transparent: boolean) {
    if ('modelloader_material' in node) {
      node.children.forEach(c => {
        if (c.material == this.materialTransparentBack) {
          c.visible = !transparent
        } else {
          if (node.modelloader_is_transparent != transparent) {
            if (!node.modelloader_is_transparent)
              c.material = c.transparent_material
            else
              c.material = node.modelloader_material
          }
        }
      })
      node.modelloader_is_transparent = transparent;
    }
  }

  toggleTransparent(node: THREE.Group) {
    if ('modelloader_material' in node) {
      node.children.forEach(c => {
        if (c.material == this.materialTransparentBack) {
          c.visible = !node.modelloader_is_transparent
        } else {
          if (!node.modelloader_is_transparent)
            c.material = c.transparent_material
          else
            c.material = node.modelloader_material
        }
      })
      node.modelloader_is_transparent = !node.modelloader_is_transparent;
    }
  }

  modelLinks(modelpath:string)
  {
    return new Promise((res,rej)=>{
      this.gltfToScene(modelpath, (xhr)=>console.log(xhr)).then(
        (gltf)=>{
          if(this.sceneLinks.has(modelpath) && this.sceneLinks.get(modelpath) != null)
            res(this.sceneLinks.get(modelpath))
          else
            res(new Set<string>())
        },
        (error)=>{
          rej(error)
        }
      );
    })
  }

  gltfToScene(path, xhr) {
    if(this.sceneCache.has(path))
      return new Promise((res,rej)=>{res(this.sceneCache.get(path))})
    return new Promise((res, rej) => {
      this.loader.load(path,
        (gltf) => {
          console.log(gltf);
          let scene: THREE.Group = gltf.scene
          let transparentMeshes: THREE.Mesh[] = [];
          let nameAssociation = {}; // Associates Nodes with their names
          let linkAssociation = {}; // Associates Links with their nodes
          let hullMeshes: Set<string> = new Set<string>();
          let hoveredMeshes = new Set<THREE.Mesh>();
          let currentPath = "";
          let transparentHulls = new Set<THREE.Mesh>();
          let updateTransparency = () => {
            for (let hull of hullMeshes) {
              let node = nameAssociation[hull];
              this.setTransparent(node, false);
            }
            if (currentPath in linkAssociation &&
              'userData' in linkAssociation[currentPath] &&
              'Hull' in linkAssociation[currentPath].userData) {
              for (let hull of linkAssociation[currentPath].userData.Hull)
                this.setTransparent(nameAssociation[hull], true);
            }
            for (let node of hoveredMeshes) {
              if ('userData' in node &&
                'Hull' in node.userData) {
                for (let hull of node.userData.Hull)
                  this.setTransparent(nameAssociation[hull], true);
              }
            }
          }

          scene.traverse((node: THREE.Object3D) => {

            let mesh: THREE.Mesh = node;
            if ('userData' in mesh && 'Link' in mesh.userData) {
              linkAssociation[mesh.userData.Link] = mesh;

              if(!(this.sceneLinks.has(path)))
                this.sceneLinks.set(path, new Set<string>())
              this.sceneLinks.get(path).add(mesh.userData.Link)
            }

            if ('userData' in mesh && 'Name' in mesh.userData) {
              nameAssociation[mesh.userData.Name] = mesh;
            }
            if ('userData' in mesh && 'Hull' in mesh.userData) {
              for (let hull of mesh.userData.Hull)
                hullMeshes.add(hull);
            }
          })
          hullMeshes.forEach(s => {
            nameAssociation[s] = this.initTransparent(nameAssociation[s]);
          })
          scene.pathchange = (e) => {
            currentPath = e.path;
            updateTransparency()
          }

          scene.traverse((node: THREE.Object3D) => {
            if (node == undefined) return;
            if (node.type == "Mesh") {
              let mesh: THREE.Mesh = node;
              mesh.material.color.convertLinearToSRGB()
              mesh.material.flatShading = false;


              if ('userData' in mesh && 'Transparency' in mesh.userData) {
                transparentMeshes.push(node)
              } else {
                mesh.addEventListener("mousein", (event) => {
                  hoveredMeshes.add(mesh);
                  if ('userData' in mesh && 'Link' in mesh.userData) {
                    event.exclusive = true;
                    document.body.style.cursor = "pointer";
                  }
                  updateTransparency()
                });
                mesh.addEventListener("mouseout", (event) => {
                  hoveredMeshes.delete(mesh);
                  if ('userData' in mesh && 'Link' in mesh.userData)
                    document.body.style.cursor = "default";
                  updateTransparency()
                });
              }
            }
          })

          for (let mesh of transparentMeshes) {
            let g = new THREE.Group();
            mesh.parent.add(g)
            mesh.material = this.materialTransparentFront
            g.add(mesh)
            let clone = mesh.clone()
            clone.material = this.materialTransparentBack
            g.add(clone)
          }
          updateTransparency();
          this.sceneCache.set(path,gltf)
          res(gltf)
        }, xhr, rej
      )
    })
  }
}

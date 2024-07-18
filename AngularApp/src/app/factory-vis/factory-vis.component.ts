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
import * as THREE from 'three';
import * as ORBITCONTROLS from 'three-orbit-controls';
import { EffectComposer, RenderPass, OutlineEffect, EffectPass } from "postprocessing";
import * as COLORMAP from 'colormap';
import { ThreejsTextOverlay } from './ThreejsTextOverlay';
import { Colormap } from '../Common/Colormap';
import { NavigationService } from '../navigation.service';
import { EmissiondataloaderService } from '../emissiondataloader.service';
import { Widget } from '../Common/Widgets/Widget';
let OrbitControls = ORBITCONTROLS(THREE)

@Component({
  selector: 'app-factory-vis',
  templateUrl: './factory-vis.component.html',
  styleUrls: ['./factory-vis.component.css']
})
export class FactoryVisComponent implements OnInit, Widget {

  scene: any;
  objectsNode: any;
  cubeObjects: any;
  camera: any;
  raycaster: any;
  orbitControl: any;
  renderer: any;
  boxValues: any;
  cmap: any;
  labelNode: any;
  techNames: any;
  mousepos: any;
  composer: any;
  outlineEffect: any;
  clock: any;
  textOverlay: any;
  currentDatasetKey: any;
  currentDataset: any;
  currentInfo: any;
  colormapView: any;
  currentEmission: any;
  labelPositions: any;

  constructor(private emissiondataloader: EmissiondataloaderService,
    private navigationService: NavigationService) {
    this.clock = new THREE.Clock();
    this.boxValues = [0.1, 0.2, 0.4, 0.3, 0.5, 1.0]
    this.techNames = ['Technologie1', 'Test1', 'Test2', 'Technologie3', 'line\nbreak', 'another technologie']
    this.cmap = COLORMAP({
      colormap: 'bluered',
      nshades: 100,
      format: 'hex',
      alpha: 1
    })
    this.cubeObjects = []
    this.currentDataset = false;
    this.colormapView = null;
    this.currentEmission = null;
    this.labelPositions = []
  }

  ngOnInit() {
    let factoryviewarea = document.getElementById('factoryviewarea');
    let colormapCanvas = document.getElementById('colormap');
    this.textOverlay = new ThreejsTextOverlay(factoryviewarea);
    this.emissiondataloader.loadData();
    this.colormapView = new Colormap(colormapCanvas, this.cmap, 0, 20);
  }

  pathChanged(newPath) {
    this.textOverlay.hideInfobox();
    this.mousepos.x = -10
    this.mousepos.y = -10
    if (newPath.length > 0) {
      if (this.currentDataset != newPath[0]) {
        this.currentDatasetKey = newPath[0];
        this.currentEmission = null;
        this.updateData();

        let selectNode = document.getElementById('emissionSelect')
        selectNode.removeAttribute('disabled')
        selectNode.innerHTML = '';

        // remove all event-listeners from selectnode
        let clone = selectNode.cloneNode(true);
        selectNode.parentNode.replaceChild(clone, selectNode);

        clone.addEventListener('change', () => {
          let el = (<HTMLSelectElement>document.getElementById('emissionSelect'));
          let v = el.options[el.selectedIndex].value
          if (v != 'default') {
            this.currentEmission = v
            this.updateData();
            this.redraw3dScene();
          }
        });

        if (this.currentInfo.length > 0) {
          let emissionTypes = Object.keys(this.currentInfo[0])
          for (let type of emissionTypes) {
            let op = document.createElement('option');
            op.innerHTML = type;
            clone.appendChild(op);
          }
        }

        this.redraw3dScene();
      }
    } else {
      this.currentDatasetKey = null;
      document.getElementById('emissionSelect').setAttribute("disabled", "disabled");
      this.textOverlay.hideLabels()
      this.textOverlay.hideInfobox()
      this.clearScene();
    }
  }

  clearScene() {
    while (this.objectsNode.children.length > 0) {
      this.objectsNode.remove(this.objectsNode.children[0]);
    }
    while (this.labelNode.children.length > 0) {
      this.labelNode.remove(this.labelNode.children[0]);
    }
  }

  updateData() {
    if (!this.currentDatasetKey)
      this.currentDataset = null;
    this.currentDataset = this.emissiondataloader.datasetsPriv[this.currentDatasetKey]
    if (this.currentEmission == null && this.currentDataset != null)
      this.currentEmission = Object.keys(this.currentDataset[0])[1]
    this.techNames = []
    this.currentInfo = []
    this.boxValues = []
    for (let k in this.currentDataset) {
      this.currentInfo.push({})
      for (let csvK of Object.keys(this.currentDataset[k])) {
        if (csvK == 'technologie')
          this.techNames.push(this.currentDataset[k].technologie);
        else
          this.currentInfo[this.currentInfo.length - 1][csvK] = this.currentDataset[k][csvK]
        if (csvK == this.currentEmission)
          this.boxValues.push(this.currentDataset[k][csvK])

      }
    }
    if (this.currentEmission == null)
      this.currentEmission = Object.keys(this.currentInfo[0])[0];
  }

  interpolateColor(cv, min_, max_) {
    let min = Math.min(min_, max_)
    let max = Math.max(min_, max_)
    let w = max - min;
    let p = Math.min(Math.max(0, cv - min), w) / w;
    let i = Math.round((this.cmap.length - 1) * p);
    if (min != min_) {
      i = (this.cmap.length - 1) - i;
    }
    return this.cmap[i];
  }

  init3dScene() {
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.mousepos = new THREE.Vector2();

    let factoryviewarea = document.getElementById('factoryviewarea');
    factoryviewarea.addEventListener('mousemove', function onMouseMove(event) {
      let clientRect = this.dom.getBoundingClientRect();
      this.c.mousepos.x = ((event.clientX - clientRect.left) / this.dom.offsetWidth) * 2 - 1;
      this.c.mousepos.y = - ((event.clientY - clientRect.top) / this.dom.offsetHeight) * 2 + 1;
    }.bind({ 'c': this, 'dom': factoryviewarea }), false);


    this.camera = new THREE.PerspectiveCamera(45, factoryviewarea.offsetWidth / factoryviewarea.offsetHeight, 0.0001, 10);
    this.orbitControl = new OrbitControls(this.camera, factoryviewarea);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(factoryviewarea.offsetWidth, factoryviewarea.offsetHeight);
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMapType = THREE.PCFSoftShadowMap
    factoryviewarea.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    let renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.outlineEffect = new OutlineEffect(this.scene, this.camera, {
      'visibleEdgeColor': 0x179c7D,
      'resolution': 0.62,
      'blurriness': 0,
      'edgeStrength': 10,
      'pulseSpeed': 0.43
    });
    this.outlineEffect.xRay = true;

    let effectPass = new EffectPass(this.camera, this.outlineEffect);
    effectPass.renderToScreen = true;
    this.composer.addPass(effectPass);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true
    //directionalLight.shadowCameraVisible = true;
    directionalLight.shadow.mapSize.width = 1024;  // default
    directionalLight.shadow.mapSize.height = 1024; // default
    directionalLight.shadow.camera.near = 0.0001;    // default
    directionalLight.shadow.camera.far = 10;
    this.scene.add(directionalLight);

    var light = new THREE.AmbientLight(0xddddff);
    this.scene.add(light);

    this.camera.position.z = 1.5;
    this.orbitControl.update();

    this.objectsNode = new THREE.Group();
    this.scene.add(this.objectsNode);

    this.labelNode = new THREE.Group();
    this.scene.add(this.labelNode);

    this.animate();
    window.addEventListener("resize", () => {
      this.resize();
    });
  }

  projectLabelpositionsToScreen() {
    let factoryviewarea = document.getElementById('factoryviewarea');
    let width = factoryviewarea.getBoundingClientRect().width;
    let height = factoryviewarea.getBoundingClientRect().height;
    let positionsScreenspace = []
    for (let i = 0; i < this.labelPositions.length; i++) {
      let sc = this.labelPositions[i].clone().project(this.camera)
      sc.x = (sc.x * (width / 2)) + (width / 2);
      sc.y = - (sc.y * (height / 2)) + (height / 2);
      positionsScreenspace.push([Math.round(sc.x), Math.round(sc.y)])
    }
    return positionsScreenspace;
  }

  redraw3dScene() {
    let boxWidth = 1 / this.boxValues.length
    let boxPositions = []
    let padding = 0.05
    for (let i = 0; i < this.boxValues.length; i++) {
      boxPositions[i] = new THREE.Vector3(((i * boxWidth) + padding / 2) - 0.5, 0, 0);
    }
    this.clearScene();
    this.cubeObjects = []
    this.labelPositions = []
    let labels = []
    for (let i = 0; i < boxPositions.length; i++) {
      let geometry = new THREE.BoxGeometry(boxWidth - padding, boxWidth - padding, boxWidth - padding);
      let min = Math.min(...this.boxValues);
      let max = Math.max(...this.boxValues);
      let material = new THREE.MeshPhysicalMaterial({
        'color': this.interpolateColor(this.boxValues[i], min, max),
        'emissive': 0x0,
        'roughness': 0.5,
        'metalness': 0.5,
        'reflectivity': 0.5,
        'clearCoat': 0.0,
        'side': THREE.DoubleSide
      })
      let cube = new THREE.Mesh(geometry, material);
      let cubePosition = new THREE.Vector3(boxPositions[i].x + (boxWidth - padding) / 2, boxPositions[i].y, boxPositions[i].z)
      cube.position.set(cubePosition.x, cubePosition.y, cubePosition.z);
      cube.castShadow = true;
      this.objectsNode.add(cube);
      this.cubeObjects.push(cube);

      this.labelPositions.push(new THREE.Vector3(cubePosition.x, cubePosition.y + boxWidth, cubePosition.z))
      labels.push(this.techNames[i])
    }

    let positionsScreenspace = this.projectLabelpositionsToScreen()
    this.textOverlay.setLabels(labels, positionsScreenspace)
    this.textOverlay.showLabels()

    let geometry = new THREE.BoxGeometry(1.1, 0.01, boxWidth + 0.1);
    let material = new THREE.MeshPhysicalMaterial({
      'color': 0x777777,
      'emissive': 0x0,
      'roughness': 0.85,
      'metalness': 0.09,
      'reflectivity': 0.06,
      'clearCoat': 0.0,
      'side': THREE.DoubleSide
    })
    let cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, -(boxWidth - padding) / 2, 0);
    cube.receiveShadow = true;
    this.objectsNode.add(cube)
    this.colormapView.setMin(Math.min(...this.boxValues))
    this.colormapView.setMax(Math.max(...this.boxValues))
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.orbitControl.update();
    this.raycaster.setFromCamera(this.mousepos, this.camera);

    let intersects = this.raycaster.intersectObjects(this.objectsNode.children);
    this.outlineEffect.clearSelection()
    this.textOverlay.hideInfobox();
    for (let intersection of intersects) {
      let cubeID = this.cubeObjects.indexOf(intersection.object);
      if (cubeID >= 0) {
        this.outlineEffect.selectObject(intersection.object);
        this.textOverlay.showInfobox(this.techNames[cubeID], this.currentInfo[cubeID], this.currentEmission);
        break;
      }
    }

    this.textOverlay.updateLabelPositions(this.projectLabelpositionsToScreen());
    this.textOverlay.update();
    this.composer.render(this.clock.getDelta());
  }

  resize() {
    let factoryviewarea = document.getElementById('factoryviewarea');
    let totalWidth = factoryviewarea.getBoundingClientRect().width;
    let totalHeight = factoryviewarea.getBoundingClientRect().height;
    this.renderer.setViewport(0, 0, totalWidth, totalHeight);
    this.renderer.setSize(totalWidth, totalHeight, true);
    this.camera.aspect = totalWidth / totalHeight;
    this.camera.updateProjectionMatrix();
  }


  ngAfterViewInit() {
    this.init3dScene();
  }
}

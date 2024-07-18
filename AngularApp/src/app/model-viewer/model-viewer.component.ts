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
import { ElementRef, Input, OnDestroy } from '@angular/core';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import * as ORBITCONTROLS from 'three-orbit-controls';
import { DestroyHelper, PromiseToken } from '../Common/DestroyHelper';
import { ModelloaderService } from '../modelloader.service';
import { EventSystem } from './EventSystem';
import { LabelManager } from './LabelManager';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass.js';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThreejsTextOverlay } from '../factory-vis/ThreejsTextOverlay';

let OrbitControls = ORBITCONTROLS(THREE)

@Component({
  selector: 'app-model-viewer',
  templateUrl: './model-viewer.component.html',
  styleUrls: ['./model-viewer.component.css']
})
export class ModelViewerComponent implements OnInit, AfterViewInit, OnDestroy {

  scene: THREE.Scene;
  sceneLabels: THREE.Scene;
  gltfGroup: THREE.Group;
  camera: THREE.PerspectiveCamera;
  orbitControl: ORBITCONTROLS;
  raycast: THREE.Raycaster;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  renderPass: RenderPass;
  outlinePass: OutlinePass;
  sceneLabelPass: RenderPass;
  destroyHelper: DestroyHelper;
  eventSystem: EventSystem;
  currentAnimationFrameId: number;
  mousepos: THREE.Vector2;
  mousein: boolean = false;
  mousedown: boolean = false;
  showLabels: boolean = false;

  labelManager: LabelManager = new LabelManager();

  @ViewChild('modelRenderArea', { static: true })
  modelRenderAreaRef: ElementRef;
  modelRenderArea: HTMLDivElement;

  initialized: boolean = false;
  _redraw: boolean = true;
  _modelpath: string = "";
  requestToken: PromiseToken = null;

  componentLinkMap: Object = {};
  markLinkedObjectSub: Subscription = null;
  spdSelectionSubscription: Subscription = null;
  samSelectionSubscription: Subscription = null;

  constructor(public modelloader: ModelloaderService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    this.destroyHelper = new DestroyHelper();
  }

  @Input()
  get modelpath(): string { return this._modelpath }
  set modelpath(path: string) {
    this._modelpath = path
    if (this.initialized) {
      this.requestModel()
    }
  }

  ngAfterViewInit(): void {
    this.modelRenderArea = this.modelRenderAreaRef.nativeElement;
    this.eventSystem = new EventSystem(this.modelRenderArea, this);
    this.initEventHandling()
    this.init3dScene()
    this.redraw()
    this.animate()
    this.initialized = true;
    this.requestModel()
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.destroyHelper.destroy()
    if (this.markLinkedObjectSub != null)
      this.markLinkedObjectSub.unsubscribe()
  }

  requestModel() {
    if (this.requestToken != null) {
      this.requestToken.invalidate()
      this.requestToken = null
    }
    let promise = this.modelloader.gltfToScene(this._modelpath, (xhr) => console.log(xhr))
    this.requestToken = this.destroyHelper.invalidatableThen(promise, (gltf) => {
      // Adding models from Scene to Event-Manager
      this.componentLinkMap = {}
      this.eventSystem.clear()
      this.eventSystem.setRoot(gltf.scene)
      this.outlinePass.selectedObjects = [];
      gltf.scene.traverse((node: THREE.Object3D) => {
        if (node.type == "Mesh" && (node.userData.Link)) {
          this.eventSystem.push(node)
          if (node.userData.Link) {
            this.componentLinkMap[node.userData.Link] = node;
            node.addEventListener("click", (event) => {
              this.navigateToComponent(node.userData.Link)
            })
            let origin = new THREE.Vector3();  
            let relUp = new THREE.Vector3(0, 0.7, 0);
            origin = node.position    
            let labelpos = new THREE.Vector3().addVectors(origin, relUp); 
            let sprite = this.labelManager.makeTextSprite(node.userData.Name)
            sprite.position.copy(labelpos);
            this.sceneLabels.add(sprite);
           
            const material = new THREE.LineBasicMaterial({
              color: 0xffffff
            });
            const points = [];
            points.push(origin);
            points.push(labelpos);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.sceneLabels.add(line);
          }
        }
      });
      this.gltfGroup.clear()
      this.gltfGroup.add(gltf.scene)
      this.gltfGroup.traverse(node => {
        // Link Group-Userdata with Group-Meshes
        if (node.type != "Mesh" && node.userData && 'SPD' in node.userData) {
          node.traverse(n => {
            if (n.type == "Mesh" && 'userData' in n) {
              n.userData.SPD = node.userData.SPD;
            }
          })
        }
        if (node.type != "Mesh" && node.userData && 'SAM' in node.userData) {
          node.traverse(n => {
            if (n.type == "Mesh" && 'userData' in n) {
              n.userData.SAM = node.userData.SAM;
            }
          })
        }
      })
      this.fitCameraToObject(this.gltfGroup)
      this.redraw()

      if (this.markLinkedObjectSub != null)
        this.markLinkedObjectSub.unsubscribe()
      this.markLinkedObjectSub = this.activatedRoute.queryParams.subscribe(params => {
        if (params.link) {
          let n = this.componentLinkMap[params.link]
          this.outlinePass.selectedObjects = [n]
          if(params.center && 'CAM_POS' in n.userData)
          {
            let pos = JSON.parse(n.userData['CAM_POS'])
            let globVec = new THREE.Vector3(
              pos[0],
              pos[2],
              -pos[1]
            );
            this.orbitControl
            this.camera.position.copy(globVec)
            this.orbitControl.target.copy(n.position)
            this.orbitControl.update()
          }

        } else {
          this.outlinePass.selectedObjects = []
        }
        this.eventSystem.triggerPathchange(params.link)
        this.redraw()
      })

      if (this.spdSelectionSubscription != null)
        this.spdSelectionSubscription.unsubscribe()
      this.spdSelectionSubscription = this.modelloader.spdSelection.subscribe({
        next: s => {
          this.gltfGroup.traverse((n: THREE.Object3D) => {
            if (n.type == "Mesh") {
              if ('userData' in n && 'SPD' in n.userData) {
                if (n.userData.SPD == s) {
                  n.userData.modelloader_oldcolor = n.material.color.getHex()
                  //n.material = n.material.clone()
                  n.material.color.set(0x8888AA)
                } else {
                  if ('modelloader_oldcolor' in n.userData) {
                    n.material.color.set(n.userData.modelloader_oldcolor)
                  }
                }
              }
            }
          })
          this.redraw()
        }
      })
      if (this.samSelectionSubscription != null)
        this.samSelectionSubscription.unsubscribe()
      this.samSelectionSubscription = this.modelloader.samSelection.subscribe({
        next: s => {
          this.gltfGroup.traverse((n: THREE.Object3D) => {
            if (n.type == "Mesh") {
              if ('userData' in n && 'SAM' in n.userData) {
                if (n.userData.SAM == s) {
                  n.userData.modelloader_oldcolor_sam = n.material.color.getHex()
                  //n.material = n.material.clone()
                  n.material.color.set(0x8888AA)
                } else {
                  if ('modelloader_oldcolor_sam' in n.userData) {
                    n.material.color.set(n.userData.modelloader_oldcolor_sam)
                  }
                }
              }
            }
          })
          this.redraw()
        }
      })
    })
  }

  selectSPD(id: string) {

  }

  toggleLabels() {
    this.showLabels = !this.showLabels;
    this.redraw();
  }

  init3dScene() {
    this.camera = new THREE.PerspectiveCamera(45, this.modelRenderArea.offsetWidth / this.modelRenderArea.offsetHeight, 1, 1000000);
    this.orbitControl = new OrbitControls(this.camera, this.modelRenderArea);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false
    });
    this.renderer.setPixelRatio( window.devicePixelRatio * 1.5 );
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;

    this.renderer.setSize(this.modelRenderArea.offsetWidth, this.modelRenderArea.offsetHeight);
    this.renderer.autoClearColor = false;
    this.composer = new EffectComposer(this.renderer);

    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.sceneLabels = new THREE.Scene();
    this.sceneLabels.background = null;

    let clearPass = new ClearPass(0xFFFFFF, 1);
    this.composer.addPass(clearPass);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.outlinePass = new OutlinePass(new THREE.Vector2(this.modelRenderArea.offsetWidth, this.modelRenderArea.offsetHeight), this.scene, this.camera)
    this.outlinePass.visibleEdgeColor.set('#FF0000')
    this.outlinePass.hiddenEdgeColor.set('#FF0000')
    this.outlinePass.edgeStrength = 10
    this.composer.addPass(this.outlinePass);

    this.gltfGroup = new THREE.Group();
    this.scene.add(this.gltfGroup);

    this.modelRenderArea.appendChild(this.renderer.domElement);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    this.orbitControl.addEventListener('change', (e) => {
      directionalLight.position.copy(this.camera.position)
      directionalLight.target = this.gltfGroup
    })

    this.scene.add(directionalLight);

    var light = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(light);
    this.camera.position.z = 8000;
    this.orbitControl.update();

    this.animate();
    this.destroyHelper.domEvent(window, "resize", this.resize.bind(this));
  }

  resize() {
    let totalWidth = this.modelRenderArea.getBoundingClientRect().width;
    let totalHeight = this.modelRenderArea.getBoundingClientRect().height;
    this.renderer.setViewport(0, 0, totalWidth, totalHeight);
    this.renderer.setSize(totalWidth, totalHeight, true);
    this.camera.aspect = totalWidth / totalHeight;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(totalWidth, totalHeight)
    this.redraw();
  }

  animate() {
    this.currentAnimationFrameId = requestAnimationFrame(this.animate.bind(this));

    if (this.mousein || this._redraw) {
      this.orbitControl.update();
      this.eventSystem.hovering(!this.mousedown)
      this.eventSystem.update(this.camera, this.mousepos);
      this.renderer.setClearColor(0xffffff, 1);
      this.renderer.clear();
      this.composer.render();

      if (this.showLabels) {
        this.renderer.clearDepth()
        this.renderer.setClearColor(0xffffff, 0);
        this.renderer.render(this.sceneLabels, this.camera);
      }
      this._redraw = false;
    }
  }

  initEventHandling() {
    this.mousepos = new THREE.Vector2;
    this.destroyHelper.domEvent(this.modelRenderArea, 'mousemove', function onMouseMove(event) {
      let clientRect = this.dom.getBoundingClientRect();
      this.c.mousepos.x = ((event.clientX - clientRect.left) / this.dom.offsetWidth) * 2 - 1;
      this.c.mousepos.y = - ((event.clientY - clientRect.top) / this.dom.offsetHeight) * 2 + 1;
    }.bind({ 'c': this, 'dom': this.modelRenderArea }), false);

    this.destroyHelper.domEvent(this.modelRenderArea, 'mouseenter', function onMouseMove(event) {
      this.mousein = true;
    }.bind(this), false);

    this.destroyHelper.domEvent(this.modelRenderArea, 'mousedown', function onMouseMove(event) {
      this.mousedown = true
    }.bind(this), false);

    this.destroyHelper.domEvent(this.modelRenderArea, 'mouseup', function onMouseMove(event) {
      this.mousedown = false
    }.bind(this), false);

    this.destroyHelper.domEvent(this.modelRenderArea, 'mouseleave', function onMouseMove(event) {
      this.mousein = false;
      this.mousedown = false;
    }.bind(this), false);
  }

  redraw() {
    this._redraw = true;
  }

  navigateToComponent(link) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { link: link }
    })
  }

  private fitCameraToObject(group: THREE.Group) {
    let box = new THREE.Box3().setFromObject(group);
    var center = new THREE.Vector3();
    var size = new THREE.Vector3();

    box.getCenter(center);
    box.getSize(size);

    let canvas = this.renderer.domElement;
    let c = canvas;
    var maxDim = size.x;
    var targetHeight = c.width / Math.max(c.width, c.height);

    if (size.y > size.x) {
      maxDim = size.y;
      targetHeight = c.height / Math.max(c.width, c.height);
    }

    const camZ = maxDim / (targetHeight / 1); 
    this.orbitControl.object.position.set(
      center.x,
      center.y,
      center.z + camZ + size.z / 2.0
    )
    const minZ = box.min.z;
    const cameraToFarEdge = (minZ < 0) ? -minZ + camZ : camZ - minZ;
    this.camera.far = cameraToFarEdge * 10;
    this.camera.up.set(0, 1, 0); // y-axis is going vertically up in the screen and x and z axes align accordingly
    this.camera.updateProjectionMatrix();
    this.orbitControl.target.set(center.x, center.y, center.z);
  }
}

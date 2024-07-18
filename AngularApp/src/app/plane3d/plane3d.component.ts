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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlanemodelloaderService } from '../planemodelloader.service';
import * as THREE from 'three';
import { ThenableWebDriver } from 'selenium-webdriver';
import * as ORBITCONTROLS from 'three-orbit-controls';
import { NavigationService } from '../navigation.service';
import Planepart from '../Common/Planepart';
import { Widget } from '../Common/Widgets/Widget';
import { ChangeDetectorRef } from '@angular/core';
import { Vector4, Vector3 } from 'three';
import { ColorcodingService } from '../colorcoding.service';
import { DestroyHelper } from '../Common/DestroyHelper';
let OrbitControls = ORBITCONTROLS(THREE)

@Component({
  selector: 'app-plane3d',
  templateUrl: './plane3d.component.html',
  styleUrls: ['./plane3d.component.css']
})
export class Plane3dComponent implements OnInit, OnDestroy, Widget {


  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mousepos: THREE.Vector2;
  mousein: boolean;
  _redraw: boolean;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  orbitControl: any;
  hoveredColor: any;
  hoveredModel: any;
  clickedModel: any;
  lockedModel: any;
  planeparts: Planepart[];
  planecolor: any;
  hovercolor: any;
  selectioncolor: any;
  possibleClick: any;
  widgetPosition: number[] = [0, 0];
  destroyHelper: DestroyHelper = new DestroyHelper();
  currentAnimationFrameId: number = null;
  fileroutingtable: any;

  constructor(private planemodelloaderService: PlanemodelloaderService,
    private navigationService: NavigationService,
    private colorservice: ColorcodingService,
    private cdRef: ChangeDetectorRef) {
    this.mousein = false;
    this._redraw = true;
    // what planepart leads to what path
    this.fileroutingtable = {
      'assets/planepartModels/winglets.obj': 'Wing',
      'assets/planepartModels/engine1.obj': 'Propulsion',
      'assets/planepartModels/engine2.obj': 'Propulsion',
      'assets/planepartModels/engine3.obj': 'Propulsion',
      'assets/planepartModels/engine4.obj': 'Propulsion',
      'assets/planepartModels/engineFan1.obj': 'Propulsion',
      'assets/planepartModels/engineFan2.obj': 'Propulsion',
      'assets/planepartModels/engineFan3.obj': 'Propulsion',
      'assets/planepartModels/engineFan4.obj': 'Propulsion',
      'assets/planepartModels/fuselage.obj': 'Fuselage',
      'assets/planepartModels/gearFront.obj': 'Gears',
      'assets/planepartModels/gearRear1.obj': 'Gears',
      'assets/planepartModels/gearRear2.obj': 'Gears',
      'assets/planepartModels/gearWing1.obj': 'Gears',
      'assets/planepartModels/gearWing2.obj': 'Gears',
      'assets/planepartModels/stabilizerHorizontal1.obj': 'Wing',
      'assets/planepartModels/stabilizerHorizontal2.obj': 'Wing',
      'assets/planepartModels/stabilizerVertical.obj': 'Wing'
    };

    this.planeparts = [];
    this.planecolor = 0x7E9EA8;
    this.hovercolor = 0x4E68A3;
    this.selectioncolor = 0x179c7D;
    this.possibleClick = false;
  }

  ngOnDestroy(): void {
    this.destroyHelper.destroy();
    if (this.currentAnimationFrameId)
      cancelAnimationFrame(this.currentAnimationFrameId)
    this.orbitControl = null;
    this.scene = null;
    this.camera = null;
    this.raycaster = null;
    this.renderer = null;

  }

  redraw() {
    this._redraw = true;
  }

  /**
   * animate implements the animation-loop
   */
  animate() {
    this.currentAnimationFrameId = requestAnimationFrame(this.animate.bind(this));

    if (this.mousein || this._redraw) {
      this.orbitControl.update();
      this.raycaster.setFromCamera(this.mousepos, this.camera);

      // colorize the planeparts dependent of the
      // current locking and navigation-status
      for (let planepart of this.planeparts) {
        if (planepart.mesh != this.lockedModel) {
          planepart.mesh.material.color.set(this.planecolor);
          if (this.navigationService.path.length > 0) {
            if (this.fileroutingtable[planepart.file] == this.navigationService.path[0]) {
              planepart.mesh.material.color.set(this.selectioncolor);
            }
          }
        }
      }

      // colorize hovored models
      let intersects = this.raycaster.intersectObjects(this.scene.children);
      if (this.hoveredModel && (this.hoveredModel != this.lockedModel)) {
        this.hoveredModel.material.color.set(this.hoveredColor);
      }
      if (intersects.length > 0 && this.mousein) {
        if (intersects[0].object != this.lockedModel) {
          let obj = <THREE.Mesh>(intersects[0].object)
          let mat = <THREE.MeshLambertMaterial>obj.material;
          this.hoveredColor = mat.color
          mat.color.set(this.hovercolor);
          this.hoveredModel = intersects[0].object;
        }
      } else {
        this.hoveredModel = null;
      }
      this.updateLabelData(this.raycaster, this.camera)
      this.renderer.render(this.scene, this.camera);
      this._redraw = false;
    }
  }

  /**
   * Sets up the three.js-scene
   */
  init3dScene() {
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();

    let planeviewarea = document.getElementById('planeviewarea');
    this.camera = new THREE.PerspectiveCamera(45, planeviewarea.offsetWidth / planeviewarea.offsetHeight, 1, 1000000);
    this.orbitControl = new OrbitControls(this.camera, planeviewarea);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(planeviewarea.offsetWidth, planeviewarea.offsetHeight);
    this.renderer.setClearColor(0xffffff, 1);
    planeviewarea.appendChild(this.renderer.domElement);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    this.scene.add(directionalLight);

    var directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(0, -1, 0);
    this.scene.add(directionalLight2);

    var light = new THREE.AmbientLight(0xddddff);
    this.scene.add(light);

    this.camera.position.z = 8000;
    this.orbitControl.update();

    this.hoveredModel = null;
    this.animate();
    this.destroyHelper.domEvent(window, "resize", this.resize.bind(this));
  }

  onMouseDownEvent() {
    this.clickedModel = this.hoveredModel;
    this.possibleClick = true;
  }

  onMouseUpEvent() {
    if (!this.possibleClick)
      return;
    if (this.lockedModel) {
      this.lockedModel.material.color.set(0xffffff);
      this.lockedModel = null;
    }

    if (this.clickedModel) {
      this.hoveredModel = null;
      this.lockedModel = this.clickedModel;
      this.clickedModel = null;
      this.lockedModel.material.color.set(this.selectioncolor);
      this.routeLockedModel(this.lockedModel);
    } else {
      this.clickedModel = null;
    }

    if (!this.lockedModel) {
      this.navigationService.navigate([]);
    }
  }

  resize() {
    let planeviewarea = document.getElementById('planeviewarea');
    let totalWidth = planeviewarea.getBoundingClientRect().width;
    let totalHeight = planeviewarea.getBoundingClientRect().height;
    //this.widgetPosition[0] = planeviewarea.getBoundingClientRect().x
    //this.widgetPosition[1] = planeviewarea.getBoundingClientRect().y
    this.widgetPosition[0] = 0
    this.widgetPosition[1] = 0
    this.renderer.setViewport(0, 0, totalWidth, totalHeight);
    this.renderer.setSize(totalWidth, totalHeight, true);
    this.camera.aspect = totalWidth / totalHeight;
    this.camera.updateProjectionMatrix();
    this.updateLabelData(this.raycaster, this.camera);
    this.redraw();
  }

  /**
   * returns the region-string for a selected mesh
   */
  reagionForModel(model) {
    for (let planepart of this.planeparts) {
      if (planepart.mesh == model) {
        if (planepart.file in this.fileroutingtable) {
          return this.fileroutingtable[planepart.file];
        }
      }
    }
    return null;
  }

  /**
   * sets the current application-path
   * for a selected 3d-model
   */
  routeLockedModel(model) {
    let region = this.reagionForModel(model);
    if (region) {
      this.navigationService.navigate([region]);
    }
  }

  initEventHandling() {
    let planeviewarea = document.getElementById('planeviewarea');
    this.mousepos = new THREE.Vector2;
    this.destroyHelper.domEvent(planeviewarea, 'mousemove', function onMouseMove(event) {
      let clientRect = this.dom.getBoundingClientRect();
      this.c.possibleClick = false;
      this.c.mousepos.x = ((event.clientX - clientRect.left) / this.dom.offsetWidth) * 2 - 1;
      this.c.mousepos.y = - ((event.clientY - clientRect.top) / this.dom.offsetHeight) * 2 + 1;
    }.bind({ 'c': this, 'dom': planeviewarea }), false);

    this.destroyHelper.domEvent(planeviewarea, 'mouseenter', function onMouseMove(event) {
      this.mousein = true;
    }.bind(this), false);

    this.destroyHelper.domEvent(planeviewarea, 'mouseleave', function onMouseMove(event) {
      this.mousein = false;
    }.bind(this), false);

    this.destroyHelper.domEvent(planeviewarea, 'mousedown', event => {
      if (event.button == 0)
        this.onMouseDownEvent();
    });

    this.destroyHelper.domEvent(planeviewarea, 'mouseup', event => {
      if (event.button == 0)
        this.onMouseUpEvent();
    });
  }

  ngOnInit() {
    this.destroyHelper.listenerEvent(this.navigationService.pathChangeListener,
      path => {
        if (this.lockedModel) {
          if (path.length < 1 || this.reagionForModel(this.lockedModel) != path[0]) {
            this.lockedModel.material.color.set(0xcccccc);
            this.lockedModel = null;
          }
        }
        this.redraw();
      });
  }

  labelsvisible: boolean = false;
  toggleLabels() {
    this.labelsvisible = !this.labelsvisible;
  }

  anchorGrounps: any = [
    {
      label: 'Wing Main',
      color: this.colorservice.colorOfLabel('SAM_W'),
      positions: [
        new THREE.Vector3(-450, -290, 2000),
        new THREE.Vector3(-450, -290, -2000)],
      visible: false,
      screenPosition: [0, 0]
    },
    {
      label: 'Propulsion',
      color: this.colorservice.colorOfLabel('SAM_P'),
      positions: [
        //new THREE.Vector3(100,-500,1600),
        new THREE.Vector3(700, -600, 950),
        //new THREE.Vector3(100,-500,-1600),
        new THREE.Vector3(700, -600, -950)
      ],
      visible: false,
      screenPosition: [0, 0]
    },
    {
      label: 'Fuselage',
      color: this.colorservice.colorOfLabel('SAM_F'),
      positions: [new THREE.Vector3(0, -200, 0)],
      visible: false,
      screenPosition: [0, 0]
    },
    {
      label: 'Gears',
      color: this.colorservice.colorOfLabel('SAM_G'),
      positions: [new THREE.Vector3(1950, -700, 0)],
      visible: false,
      screenPosition: [0, 0]
    },
    {
      label: 'Wing Other',
      color: this.colorservice.colorOfLabel('SAM_W'),
      positions: [new THREE.Vector3(-2000, 500, 0)],
      visible: false,
      screenPosition: [0, 0]
    },
    {
      label: 'Utilities',
      color: this.colorservice.colorOfLabel('SAM_U'),
      static: true,
      screenPosition: [10, 380]
    },
    {
      label: 'Production & Services',
      color: this.colorservice.colorOfLabel('SAM_P&S'),
      static: true,
      screenPosition: [82, 380]
    },
    {
      label: 'Systems',
      color: this.colorservice.colorOfLabel('SAM_S'),
      static: true,
      screenPosition: [268, 380]
    }
  ]

  updateLabelData(raycaster: THREE.Raycaster, camera: THREE.Camera) {
    let size = new THREE.Vector2()
    let worldToView = camera.modelViewMatrix
    this.renderer.getSize(size)
    let width = size.x
    let height = size.y

    // do projections
    let projectedAnchorGroups = this.anchorGrounps.map(e => {
      let e_ = {
        'label': e.label,
        static: e.static,
        positions: [],
        positions_screen: [],
        positions_cam: []
      }
      if (!e.static) {
        e_.positions = e.positions.map(pos => {
          return pos.clone().project(camera);
        })
        e_.positions_cam = e.positions.map(pos => {
          return pos.clone().applyMatrix4(camera.matrixWorldInverse);
        })
        e_.positions_screen = e_.positions.map(pos => {
          let x = (pos.x * (width / 2)) + (width / 2);
          let y = - (pos.y * (height / 2)) + (height / 2);
          let rt = new THREE.Vector2(Math.round(x), Math.round(y))
          return rt
        })
      }
      return e_
    })

    // filter visible positions
    let filteredProjections = projectedAnchorGroups.map(e => {
      let e_ = {
        'label': e.label,
        static: e.static,
        visible: e.static,
        position: new THREE.Vector3,
        position_screen: new THREE.Vector2,
        positions_cam: new THREE.Vector3
      }
      if (!e.static) {
        let smallestDistI = -1
        let smallestDist = Infinity
        for (let i = 0; i < e.positions.length; i++) {
          if (e.positions_cam[i].length() < smallestDist &&
            e.positions_screen[i].x >= 0 && e.positions_screen[i].x < width &&
            e.positions_screen[i].y >= 0 && e.positions_screen[i].y < height) {
            smallestDistI = i
            smallestDist = e.positions_cam[i].length()
          }
        }
        if (smallestDistI >= 0) {
          e_.visible = true
          e_.position = e.positions[smallestDistI].clone()
          e_.position_screen = e.positions_screen[smallestDistI].clone()
          e_.positions_cam = e.positions_cam[smallestDistI].clone()
        }
      }
      return e_
    })

    for (let i = 0; i < filteredProjections.length; i++) {
      this.anchorGrounps[i].visible = filteredProjections[i].visible
      if (!this.anchorGrounps[i].static) {
        this.anchorGrounps[i].screenPosition[0] = this.widgetPosition[0] + filteredProjections[i].position_screen.x
        this.anchorGrounps[i].screenPosition[1] = this.widgetPosition[1] + filteredProjections[i].position_screen.y
      }
    }
    this.cdRef.detectChanges();
  }

  ngAfterViewInit() {
    this.initEventHandling();
    this.init3dScene();

    this.planemodelloaderService.loadData();
    this.destroyHelper.invalidatableThen(this.planemodelloaderService.planeParts,
      function (planeparts) {
        this.planeparts = planeparts;
        for (let planepart of planeparts) {
          this.scene.add(planepart.mesh);
        }
        this.redraw();
      }.bind(this));

  }

}

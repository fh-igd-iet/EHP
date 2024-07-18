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
import { ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { DestroyHelper, PromiseToken } from '../Common/DestroyHelper';
import { ModelloaderService } from '../modelloader.service';
import * as THREE from 'three';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { ActivatedRoute, Router } from '@angular/router';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ModelViewerDetailsViewComponent } from '../model-viewer-details-view/model-viewer-details-view.component';
import { Observable, Subscription } from 'rxjs';
import { RestService } from '../rest.service';
import { AircraftpartDBO } from '../Common/AircraftpartDBO';

interface Demonstrator {
  id: string,
  name: string,
  description: string,
  imageSrc: string,
  color?: string
}

interface DemonstratorTreeNode {
  children: DemonstratorTreeNode[],
  name: string,
  id: string,
  color?: string,
  demonstrator?: Demonstrator
}

interface DemonstratorTreeNodeFlat {
  expandable: boolean,
  name: string,
  id: string,
  demonstrator?: Demonstrator,
  color?: string,
  level: number
}

/*
interface SAMTreeNode extends AircraftpartDBO {
  isDemonstrator: boolean;
}

interface SAMTreeNodeFlat {
  isSAM: boolean,
  expandable: boolean,
  name: string,
  id: string,
  level: number,
  color?: string
}
*/

@Component({
  selector: 'app-model-viewer-navigation',
  templateUrl: './model-viewer-navigation.component.html',
  styleUrls: ['./model-viewer-navigation.component.css']
})
export class ModelViewerNavigationComponent implements OnInit, OnDestroy {

  initialized: boolean = false;
  _modelpath: string = null;
  _spdList: string[] = [];
  _spdListMode: string = null; // whitelist, blacklist, null
  _samList: string[] = [];
  _samListMode: string = null; // whitelist, blacklist, null
  currentLink: string = "";
  destroyHelper: DestroyHelper = new DestroyHelper();
  linkNodeDictSPD: Object = {};
  linkNodeDictSAM: Object = {};
  bottomSheet: MatBottomSheetRef = null;
  routeChangeSubscription: Subscription = null;
  spdRequest: Observable<Object> = null;
  spdRequestSubscription: Subscription = null;
  samRequest: Observable<Object> = null;
  samRequestSubscription: Subscription = null;
  actRequest: Observable<Object> = null; 
  actRequestSubscription: Subscription = null; 

  private _transformer = (node: DemonstratorTreeNode, level: number) => {
    let t: DemonstratorTreeNodeFlat = {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      id: node.id,
      demonstrator: node.demonstrator,
      color: node.color,
      level: level
    };
    return t
  }

  treeControlSPD = new FlatTreeControl<DemonstratorTreeNodeFlat>(
    node => node.level, node => node.expandable);

  treeControlSAM = new FlatTreeControl<DemonstratorTreeNodeFlat>(
    node => node.level, node => node.expandable);

  treeControlACT = new FlatTreeControl<DemonstratorTreeNodeFlat>( 
    node => node.level, node => node.expandable);

  treeFlattener = new MatTreeFlattener(
    this._transformer, node => node.level, node => node.expandable, node => node.children);

  dataSourceSPD = new MatTreeFlatDataSource(this.treeControlSPD, this.treeFlattener);
  dataSourceSAM = new MatTreeFlatDataSource(this.treeControlSAM, this.treeFlattener);
  dataSourceACT = new MatTreeFlatDataSource(this.treeControlACT, this.treeFlattener); 

  @Input()
  get modelpath(): string { return this._modelpath }
  set modelpath(path: string) {
    this._modelpath = path
    this.requestModel()
  }

  @Input()
  get spdList(): string[] { return this._spdList }
  set spdList(spds: string[]) {
    this._spdList = spds;
  }
  @Input()
  get spdListMode(): string { return this._spdListMode }
  set spdListMode(mode: string) {
    this._spdListMode = mode;
  }

  @Input()
  get samList(): string[] { return this._samList }
  set samList(sams: string[]) {
    this._samList = sams;
  }
  @Input()
  get samListMode(): string { return this._samListMode }
  set samListMode(mode: string) {
    this._samListMode = mode;
  }

  requestToken: PromiseToken = null;

  constructor(
    private rest: RestService,
    private bottomSheetFab: MatBottomSheet,
    private crd: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public modelloader: ModelloaderService) {

  }
  ngOnDestroy(): void {
    this.destroyHelper.destroy()
    if (this.bottomSheet != null)
      this.bottomSheet.dismiss()
    if (this.routeChangeSubscription != null)
      this.routeChangeSubscription.unsubscribe()
    if (this.spdRequestSubscription != null)
      this.spdRequestSubscription.unsubscribe()
    if (this.samRequestSubscription != null)
      this.samRequestSubscription.unsubscribe()
    if (this.actRequestSubscription != null) //NEW
      this.actRequestSubscription.unsubscribe() 
  }

  ngOnInit(): void {
    this.spdRequest = this.rest.get('/SPD')
    this.samRequest = this.rest.get('/AircraftPart/parts')
    this.actRequest = this.rest.get('/Activity/modelview') 
    this.requestModel()
  }


  requestModel() {
    if (this.requestToken != null) {
      this.requestToken.invalidate()
      this.requestToken = null
    }
    let promise = this.modelloader.gltfToScene(this._modelpath, (xhr) => console.log(xhr))
    this.requestToken = this.destroyHelper.invalidatableThen(promise, (gltf) => {

      let demonstratorDict: Map<string, Demonstrator> = new Map<string, Demonstrator>();
      let samDemonstratorDict: Map<string, Set<Demonstrator>> = new Map<string, Set<Demonstrator>>();
      let spdDemonstratorDict: Map<string, Set<Demonstrator>> = new Map<string, Set<Demonstrator>>();
      let compDemonstratorDict: Map<string, Set<Demonstrator>> = new Map<string, Set<Demonstrator>>(); // NEW
      /*
      let engineNode: DemonstratorTreeNode = {
        children: [],
        name: "Engine",
        id: "ENG"
      }
      */

      gltf.scene.traverse((node: THREE.Object3D) => {

        if ('userData' in node && 'Link' in node.userData) {
          let d: Demonstrator = {
            name: node.userData.Name,
            id: node.userData.Link,
            imageSrc: node.userData.Image,
            description: node.userData.Description,
            color: node.material.color.getHexString()
          }
          demonstratorDict.set(d.id, d);
          if ('SPD' in node.userData) {
            if (!(spdDemonstratorDict.has(node.userData.SPD)))
              spdDemonstratorDict.set(node.userData.SPD, new Set<Demonstrator>())
            spdDemonstratorDict.get(node.userData.SPD).add(d)
          }
          if ('SAM' in node.userData) {
            if (!(samDemonstratorDict.has(node.userData.SAM)))
              samDemonstratorDict.set(node.userData.SAM, new Set<Demonstrator>())
            samDemonstratorDict.get(node.userData.SAM).add(d)
          }
          if ('Link' in node.userData) { 
            if (!(compDemonstratorDict.has(node.userData.Link)))
              compDemonstratorDict.set(node.userData.Link, new Set<Demonstrator>())
            compDemonstratorDict.get(node.userData.Link).add(d)  
          }
        }
      });

      let fillNode = (id, name) => {
        return {
          children: [],
          name: name,
          id: id
        }
      }

      if (this.spdRequestSubscription != null)
        this.spdRequestSubscription.unsubscribe()
      this.spdRequestSubscription = this.spdRequest.subscribe({
        next: (d: Object[]) => {
          let dataSourceData = [];
          d.forEach(e => {
            if (!('id' in e && 'name' in e))
              return;
            if (this._spdListMode == "blacklist" &&
              (this._spdList.includes(e["name"]) ||
                this._spdList.includes(e["id"])))
              return;
            if (this._spdListMode == "whitelist" &&
              !(this._spdList.includes(e["name"]) ||
                this._spdList.includes(e["id"])))
              return;
            let newNode: DemonstratorTreeNode = {
              name: e["name"],
              id: e["id"],
              children: []
            }
            if (spdDemonstratorDict.has(e['id'])) {
              newNode.children = Array.from(spdDemonstratorDict.get(e['id']),
                (e: Demonstrator) => {
                  let node = <DemonstratorTreeNode>{
                    name: e.name,
                    id: e.id,
                    demonstrator: e,
                    color: e.color,
                    children: []
                  }
                  return node;
                })
            }
            dataSourceData.push(newNode)
          })
          this.dataSourceSPD.data = dataSourceData
          this.crd.markForCheck()
        },
        error: e => {

        }
      })

      if (this.samRequestSubscription != null)
        this.samRequestSubscription.unsubscribe()
      this.samRequestSubscription = this.samRequest.subscribe(next => {
        let parts = <AircraftpartDBO[]>next['children'];
        let flatParts: Map<AircraftpartDBO, DemonstratorTreeNode> =
          new Map<AircraftpartDBO, DemonstratorTreeNode>();

        let unsetUndefined = (a: Object[]) => {
          return a.filter(e => e != undefined);
        }
        let rec = (n: AircraftpartDBO) => {
          if (this._samListMode == "blacklist" &&
            (this._samList.includes(n.name) ||
              this._samList.includes(n.id)))
            return;
          if (this._samListMode == "whitelist" &&
            !(this._samList.includes(n.name) ||
              this._samList.includes(n.id)))
            return;
          n.children.forEach(c => {
            rec(c);
          })
          n.children = n.children;
          let dNode: DemonstratorTreeNode = {
            id: n.id,
            name: n.name,
            children: n.children ?
              <DemonstratorTreeNode[]>
              unsetUndefined(n.children.map(c => flatParts.get(c)))
              : []
          }

          if (samDemonstratorDict.has(n.id)) {
            let newChildren = Array.from(samDemonstratorDict.get(n.id),
              (e: Demonstrator) => {
                let node = <DemonstratorTreeNode>{
                  name: e.name,
                  id: e.id,
                  demonstrator: e,
                  color: e.color,
                  children: []
                }
                return node;
              })
            dNode.children.push(...newChildren)
          }

          flatParts.set(n, dNode)
          return dNode
        }

        let treeNodes: DemonstratorTreeNode[] = <DemonstratorTreeNode[]>unsetUndefined(parts.map(p => rec(p)))
        this.dataSourceSAM.data = treeNodes
      })

      if (this.actRequestSubscription != null)
        this.actRequestSubscription.unsubscribe()
      this.actRequestSubscription = this.actRequest.subscribe({
        next: (d: Object[]) => {
          //console.log("activities:", d)
          let dataSourceAct = [];

          d.forEach(act => {
            let newNode: DemonstratorTreeNode = {
               // expandable node (activity)
              name: act["activity_title"],
              id: act["activity_id"], 
              children: []
            }

            // child nodes
           for(var i in act["component_name"]) {
              if (demonstratorDict.has(act["component_code"][i])) {
                let children = Array.from(compDemonstratorDict.get(act["component_code"][i]),
                (e: Demonstrator) => {
                  let node = <DemonstratorTreeNode>{
                    name: e.name,
                    id: e.id,
                    demonstrator: e,
                    color: e.color,
                    children: []
                  }
                  return node;
                })
                newNode.children.push(children[0])
              }
            }

            if (newNode.children.length > 0) {
              dataSourceAct.push(newNode)
            }
            
          })

          this.dataSourceACT.data = dataSourceAct
          this.crd.markForCheck()
        },
        error: e => {}
      })

      //this.dataSource.data = [root]
      this.routeChangeSubscription = this.activatedRoute.queryParams.subscribe(params => {
        if (params.link) {
          this.currentLink = params.link
          let currentDemonstrator = demonstratorDict.get(this.currentLink)
          if (currentDemonstrator) {
            if (this.bottomSheet != null)
              this.bottomSheet.dismiss()
            this.bottomSheet = this.bottomSheetFab.open(ModelViewerDetailsViewComponent, {
              data: currentDemonstrator,
              disableClose: true,
              hasBackdrop: false
            })
          }

          this.crd.markForCheck()
        }
        else {
          this.currentLink = null;
        }
      });
    })
  }

  navigateTo(link) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { link: link }
    })
  }

  hasChild(n: number, node: DemonstratorTreeNodeFlat) {
    return node.expandable
  }

  isSAM(n: number, node: DemonstratorTreeNodeFlat) {
    return !node.demonstrator
  }

  isLevel0(n: number, node: DemonstratorTreeNodeFlat) {
    return node.level == 0;
  }

  hasChildSAM(n: number, node: DemonstratorTreeNodeFlat) {
    return node.expandable
  }

  selectSPD(id: string) {
    this.modelloader.spdSelection.next(id);
  }

  selectSAM(id: string) {
    this.modelloader.samSelection.next(id)
  }

}

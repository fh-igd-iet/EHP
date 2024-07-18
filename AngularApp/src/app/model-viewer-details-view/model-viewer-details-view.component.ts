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
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ComponentDBO } from '../Common/ComponentDBO';
import { RestService } from '../rest.service';
import { LocalStorageService } from '../local-storage.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AcpartsDialogComponent } from '../acparts-dialog/acparts-dialog.component';

@Component({
  selector: 'app-model-viewer-details-view',
  templateUrl: './model-viewer-details-view.component.html',
  styleUrls: ['./model-viewer-details-view.component.css']
})
export class ModelViewerDetailsViewComponent implements OnInit, OnDestroy {

  processes: any[] = [];
  lcaData: any[] = []

  imageSrc: string = "";
  name: string = "";
  description: string = "";
  id: string = "";

  demonstratorSubscription: Subscription = null;
  demonstrator: ComponentDBO = null;

  processSubscription: Subscription = null;
  lcaDataSubscription: Subscription = null;

  constructor(
    private storageService: LocalStorageService,
    private rest: RestService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private bottomSheetRef: MatBottomSheetRef<ModelViewerDetailsViewComponent>,
    public dialog: MatDialog,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { id: string, name: string, imageSrc: string, description: string }) {
    console.log("Data received:", data);
    this.imageSrc = data.imageSrc
    this.name = data.name
    this.description = data.description
    this.id = data.id

    this.demonstratorSubscription = this.rest.get(`/Component/code/${this.id}`).subscribe({
      next: (component: ComponentDBO) => {
        if (Object.keys(component).length == 0) {
          this.demonstrator = null;
        } else {
          this.demonstrator = component;
          if (this.demonstrator.image_id) {
            this.imageSrc = this.rest.imageURL( this.demonstrator.image_id );
          }
        }
      }
    })
   
    /*
    this.processSubscription = this.rest.get(`/Component/code/${this.id}/processes`).subscribe({
      next: (result: any) => {
        this.processes = result
        console.log(this.processes)
      }
    })
    */
    this.lcaDataSubscription = this.rest.get(`/OLCAProcess/bycomponent/${this.id}`).subscribe({
      next: (result: any) => {
        this.lcaData = result
      }
    })
  }
  ngOnDestroy(): void {
    if (this.demonstratorSubscription != null)
      this.demonstratorSubscription.unsubscribe()
    if (this.processSubscription != null)
      this.processSubscription.unsubscribe()
    if (this.lcaDataSubscription != null)
      this.lcaDataSubscription.unsubscribe()
  }

  ngOnInit(): void {}

  close() {
    this.bottomSheetRef.dismiss()
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {}
    })
    if (this.demonstratorSubscription != null)
      this.demonstratorSubscription.unsubscribe()
    if (this.processSubscription != null)
      this.processSubscription.unsubscribe()
    if (this.lcaDataSubscription != null)
      this.lcaDataSubscription.unsubscribe()
  }

  includesData(name) {
    return this.storageService.includesLcaResult(name);
  }


  selectData(name, extern, id) {
    this.storageService.saveLcaResult(name, extern, id);
  }

  deselectData(name, extern, id) {
    this.storageService.removeLcaResult(name, extern, id);
  }

  


  
  
  addToAssembly(tech_id:number) {
    // Open dialog with custom width and height
    let dialog = this.dialog.open(AcpartsDialogComponent, {
      data: { tech_id: tech_id }
    });
    dialog.afterClosed().subscribe(d => {
      console.log("dialog closed", d)
    })
  }
  

  getAssignedAssemblies(tech_id:number) {
    return this.storageService.getAssembliesByTechId(tech_id);
  }

  handleImageError() {
    console.log("Image loading error occurred");
    this.imageSrc = null;
  }

}




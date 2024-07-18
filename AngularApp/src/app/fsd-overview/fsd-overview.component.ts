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
import { ApplicationRef, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FlagshipComponentViewDBO } from '../Common/FlagshipComponentViewDBO';
import { ModelloaderService } from '../modelloader.service';
import { ModelpreviewService } from '../modelpreview.service';
import { LocalStorageService } from '../local-storage.service';
import { RestService } from '../rest.service';
import { MatDialog } from '@angular/material/dialog';
import { AcpartsDialogComponent } from '../acparts-dialog/acparts-dialog.component';

@Component({
  selector: 'app-fsd-overview',
  templateUrl: './fsd-overview.component.html',
  styleUrls: ['./fsd-overview.component.css']
})
export class FsdOverviewComponent implements OnInit {

  public demonstrators:FlagshipComponentViewDBO|null = null;

  private previewsLoaded= false;
  public modelpathsLoaded = false;
  private modelpaths:Map<string,Set<string>> = new Map<string,Set<string>>();
  private modelpathsArray:string[] = [];
  private modelpathLinks = {
    './assets/airplaneModel/airplane2.gltf' : '/showFlagshipDemonstrators',
    './assets/helicopterModel/helicopter.gltf' : '/showHelicopterDemonstrators',
    './assets/factoryModel/Factory.gltf' : '/showProductionDemonstrators'
  }
  


  constructor(
    private storageService: LocalStorageService,
    public rest:RestService, 
    private modelpreview:ModelpreviewService, 
    private modelloader:ModelloaderService, 
    private cd:ChangeDetectorRef,
    private ar:ApplicationRef,
    private router:Router,
    public dialog: MatDialog) {
    this.rest.get('/Component/fsd').subscribe((d: FlagshipComponentViewDBO) => {
      this.demonstrators = d
      console.log(d)
    });

    let modelpaths =
    [
      './assets/airplaneModel/airplane2.gltf',
      './assets/helicopterModel/helicopter.gltf',
      './assets/factoryModel/Factory.gltf',
    ];
    modelpaths.forEach(p=>{
      modelloader.gltfToScene(p,(xhr)=> console.log(xhr)).then(
        gltf=>{
          modelloader.modelLinks(p).then(
            (value:Set<string>)=>{
              this.modelpaths.set(p,value);
              this.modelpathsArray.push(p);
              // console.log("LOADED MODEL")
              // console.log(this.modelpaths.size)
              if(this.modelpaths.size == modelpaths.length)
              {
                console.log("FINISHED models")
                this.modelpathsLoaded = true;
                cd.detectChanges();
                setTimeout(this.initializePreview3DViews.bind(this),1000)
              }
              
            }
          )

        },
        error=> {
        }
      )
    })
  }

  initializePreview3DViews(): void {
    // console.log("afterview init");
    let elements = Array.from(document.getElementsByClassName("demonstrator_preview"));
    // console.log("elements")
    // console.log(elements)
    for(let element of elements)
    {
      //console.log(element)
      let model = element.getAttribute("data-model")
      let demo_code = element.getAttribute("data-demo_code")
      this.loadModelPreviewForDemonstrator(model,demo_code,<HTMLDivElement>element)
    }
  }

  ngOnInit(): void {
  }

  addToAssembly(tech_id:number)
  {
    let dialog = this.dialog.open(AcpartsDialogComponent, {
      data: { tech_id: tech_id },
    });
    dialog.afterClosed().subscribe(d => {
      console.log("dialog closed", d)
    })
  }

  loadModelPreviewForDemonstrator(modelpath:string, link:string, previewElement:HTMLDivElement)
  {
    let width = previewElement.scrollWidth
    let height = previewElement.scrollHeight
    this.modelpreview.getPreviewBlobOfDemonstrator(modelpath,link,width,height)
      .then(
        (blob:Blob)=>{
          previewElement.innerHTML = ""
          let bloburl = URL.createObjectURL(blob);
          let image = new Image()
          image.src = bloburl
          image.width = width
          image.height = height
          // console.log("LINK")
          // console.log(link)
          image.style.cursor = "pointer"
          image.onclick = () => {
            this.router.navigate([this.modelpathLinks[modelpath]],{queryParams:{'link':link, 'center':true}})
          }
          previewElement.appendChild(image)
        },
        (error)=>{

        })
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

  getAssignedAssemblies(tech_id:number) {
    return this.storageService.getAssembliesByTechId(tech_id);
  }
}

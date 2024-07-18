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
import { Component, OnInit, ChangeDetectorRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ShowCs1ResultListComponent } from '../show-cs1-result-list/show-cs1-result-list.component';
import { ShowCs1CompareResultsBarchartComponent } from '../show-cs1-compare-results-barchart/show-cs1-compare-results-barchart.component';
import { ShowCs1CompareResultsRadarComponent } from '../show-cs1-compare-results-radar/show-cs1-compare-results-radar.component';
import { ColorcodingService } from '../colorcoding.service';
import { LcaResult } from '../Common/LcaResult';
import { LocalStorageService } from '../local-storage.service';
import { RestService } from '../rest.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IndicatorpickerComponent } from '../indicatorpicker/indicatorpicker.component';

@Component({
  selector: 'app-show-cs1-impacts-qa',
  templateUrl: './show-cs1-impacts-qa.component.html',
  styleUrls: ['./show-cs1-impacts-qa.component.css']
})
export class ShowCs1ImpactsQaComponent implements OnInit {

  currentTab: number = 0;

  selectedMethods: number[] = []
  selectedResultsQa: number[] = []
  selectedIndicators: string[] = []

  radar_subscription: Subscription = null;
  selectedResultSubscriptionQa: Subscription = null;

  @ViewChild(ShowCs1ResultListComponent, { static: true }) resultListQa: ShowCs1ResultListComponent;  
  @ViewChildren(ShowCs1CompareResultsBarchartComponent)
  barchartComponents: QueryList<ShowCs1CompareResultsBarchartComponent>;
  @ViewChild("radarComp", { static: true })
  radarComp: ShowCs1CompareResultsRadarComponent;
  @ViewChild("indicatorSelection", { static: true })
  indicatorSelection: IndicatorpickerComponent;


  constructor(
    private cd: ChangeDetectorRef,
    private rest: RestService,
    private color: ColorcodingService,
    private router: Router,
    private storageService: LocalStorageService) {

      }

  ngOnInit() {
    if (this.router.url.toLowerCase().includes('cs1')) {
      this.resultListQa.cs = 1
    }
    if (this.router.url.toLowerCase().includes('cs2')) {
      this.resultListQa.cs = 2
    }
    // loading selected lcaResults, indicators and methods from local storage 
    this.selectedResultSubscriptionQa = this.storageService.observeSelectedLcaResultsQa().subscribe((results) => {
      this.resultsChanged(results);
    });
    this.selectedIndicators = this.storageService.getSelectedIndicators();
    this.selectedMethods = this.storageService.getSelectedMethods();
  }

  ngOnDestroy(): void { }

  ngAfterContentChecked() {
    this.cd.detectChanges();
  }

  updateRadarData() {
    if (this.radar_subscription)
      this.radar_subscription.unsubscribe()
    if (this.selectedResultsQa.length > 0 && this.selectedIndicators.length > 2 && this.currentTab == 0) {
      let m = []
      let p = []
      for (let pi of this.selectedResultsQa)
        for (let mi of this.selectedMethods) {
          m.push(mi)
          p.push(pi)
        }
      this.radar_subscription = this.rest.get(`/process/qa_result/${p.join(',')}/${m.join(',')}`).subscribe((d: LcaResult[]) => {
        let linkedRadarData: { [id: number]: Object } = {}
        for (let result of d) {
          if (!Object.keys(linkedRadarData).map(d => parseInt(d)).includes(result.process_id)) {
            linkedRadarData[result.process_id] = {
              label: result.process_name,
              backgroundColor: [this.color.sampleDistinctPallette('impact-comparison', result.process_name) + '44'],
              borderColor: [this.color.sampleDistinctPallette('impact-comparison', result.process_name)],
              dataLinked: {},
              fill: 'origin'
            };
          }
          for (let indicator of this.selectedIndicators) {
            if (Object.keys(result.indicator_name_result).includes(indicator)) {
              linkedRadarData[result.process_id]['dataLinked'][indicator] = result.indicator_name_result[indicator]
            }
          }
        }
        let radarData = []
        for (let k in linkedRadarData)
          radarData.push(linkedRadarData[k])
        radarData.forEach(d => {
          d['data'] = this.selectedIndicators.map(r => { return d['dataLinked'][r] })
        })
        let labels = this.selectedIndicators;
        let data = {
          labels: labels,
          datasets: radarData
        }
        this.radarComp.setData(data);
      });
    }
  }

  onTabChanged(event) {
    this.currentTab = event.index;
    this.updateColorPallette();
    this.cd.markForCheck()
  }

  indicatorsChanged(event) {
    this.selectedIndicators = event
    this.updateColorPallette();
    this.updateRadarData();
  } 

  methodsChanged(event) {
    this.selectedMethods = event
      this.resultListQa.refresh()
    }

  resultsChanged(data: LcaResult[]) {
    let ids = data.map(e => e.process_id)
    this.selectedResultsQa.length = 0
    this.selectedResultsQa.push.apply(this.selectedResultsQa, ids)
    this.updateColorPallette();
    this.cd.detectChanges()
    this.updateRadarData();
    if (this.barchartComponents !== undefined) {
      this.barchartComponents.forEach(d => d.results = ids)
    }    
  }

  updateColorPallette() {
    let numColors = 0;
    if (this.currentTab == 0)
      numColors = this.selectedResultsQa.length
    else
      numColors = this.selectedIndicators.length
    this.color.initializeDistinctPallette('impact-comparison', numColors)
    if (this.currentTab == 1) {
      //this.updateIndicatorSelectionColors('#aaa');
      this.indicatorSelection.updateChipColorsByPallet("impact-comparison", "#ddd")
      this.resultListQa.setColorMode('grey');

      if (this.barchartComponents !== undefined) {
        this.barchartComponents.forEach(c => {
          if (c.tab_ == 1) {
            c.updateColors(null)
          }
        });
      }
    } else {
      //this.updateIndicatorSelectionColors(null);
      this.indicatorSelection.setChipColors("#ddd")
      this.resultListQa.setColorMode('');
      if (this.barchartComponents !== undefined) {
        this.barchartComponents.forEach(c => {
          if (c.tab_ == 0) {
            c.updateColors(null)
          }
        });
      }
      this.updateRadarData()
    }
  }

  clearLocalStorage() {
    this.storageService.clearLocalStorage();
    window.location.reload();
  }

}

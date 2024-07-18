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
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { RouterModule, Routes } from '@angular/router';
import { EDASProcessEditDialogComponent } from './edas-process-edit-dialog/edas-process-edit-dialog.component';

import { HttpClientModule } from '@angular/common/http';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { DynamicFormQuestionComponent } from './dynamic-form-question/dynamic-form-question.component';
import { DynamicFormChipComponent } from './dynamic-form-chip/dynamic-form-chip.component';
import { EDASProcessOverviewComponent } from './edas-process-overview/edas-process-overview.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSortModule } from '@angular/material/sort';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CdkTableModule, DataSource } from '@angular/cdk/table';
import { CustomMatCellComponent } from './custom-mat-cell/custom-mat-cell.component';
import { MatAutocompleteSelectedEvent, MatAutocomplete } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { VisComponent } from './vis/vis.component';
import { DiagramEdasVeesComponent } from './diagram-edas-vees/diagram-edas-vees.component';
import { FactoryVisComponent } from './factory-vis/factory-vis.component';
import { OverviewchartComponent } from './overviewchart/overviewchart.component';
import { Plane3dComponent } from './plane3d/plane3d.component';
import { IlcdUploadComponent } from './ilcd-upload/ilcd-upload.component';
import { ExcelUploadComponent } from './excel-upload/excel-upload.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { ShowUserComponent } from './show-user/show-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { AirpartSunburstComponent } from './airpart-sunburst/airpart-sunburst.component';
import { ActivityChartComponent } from './activity-chart/activity-chart.component';
import { ShowRoleComponent } from './show-role/show-role.component';
import { EditRoleComponent } from './edit-role/edit-role.component';
import { AircraftTreeComponent } from './aircraft-tree/aircraft-tree.component';
import { MatTreeModule } from '@angular/material/tree';
import { EcoThemesOverviewComponent } from './eco-themes-overview/eco-themes-overview.component';
import { AircraftModelComponent } from './aircraft-model/aircraft-model.component';
import { BudgetDistributionComponent } from './budget-distribution/budget-distribution.component';
import { TechnologyListComponent } from './technology-list/technology-list.component';
import { MaterialsComponent } from './materials/materials.component';
import { MaterialListComponent } from './material-list/material-list.component';
import { CompareImpactsBarchartComponent } from './compare-impacts-barchart/compare-impacts-barchart.component';
import { ActivityOverviewComponent } from './activity-overview/activity-overview.component';
import { TreeviewDialogComponent } from './treeview-dialog/treeview-dialog.component';
import { ActivityEditDialogComponent } from './activity-edit-dialog/activity-edit-dialog.component';
import { ComponentOverviewComponent } from './component-overview/component-overview.component';
import { ProcessOverviewComponent } from './process-overview/process-overview.component';
import { ProcessEditDialogComponent } from './process-edit-dialog/process-edit-dialog.component';
import { ComponentEditDialogComponent } from './component-edit-dialog/component-edit-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ShowCs1Component } from './show-cs1/show-cs1.component';
import { ShowCs1ImpactsComponent } from './show-cs1-impacts/show-cs1-impacts.component';
import { DemonstratorCohortComponent } from './demonstrator-cohort/demonstrator-cohort.component';
import { ShowCs1DetailsComponent } from './show-cs1-details/show-cs1-details.component';
import { ShowCs1ResultListComponent } from './show-cs1-result-list/show-cs1-result-list.component';
import { ShowCs1CompareResultsBarchartComponent } from './show-cs1-compare-results-barchart/show-cs1-compare-results-barchart.component';
import { ShowCs1CompareResultsRadarComponent } from './show-cs1-compare-results-radar/show-cs1-compare-results-radar.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Cs1EditDialogComponent } from './cs1-edit-dialog/cs1-edit-dialog.component';
import { FlagshipDemonstratorComponent } from './flagship-demonstrator/flagship-demonstrator.component';
import { ModelViewerComponent } from './model-viewer/model-viewer.component';
import { ModelViewerNavigationComponent } from './model-viewer-navigation/model-viewer-navigation.component';
import { ModelViewerDetailsViewComponent } from './model-viewer-details-view/model-viewer-details-view.component';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { ProductionDemonstratorComponent } from './production-demonstrator/production-demonstrator.component';
import { HelicopterDemonstratorComponent } from './helicopter-demonstrator/helicopter-demonstrator.component';
import { FsdOverviewComponent } from './fsd-overview/fsd-overview.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { ShowOwnerComponent } from './show-owner/show-owner.component';
import { EditOwnerComponent } from './edit-owner/edit-owner.component';
import { AcpartsComponent } from './acparts/acparts.component';
import { AcpartsDialogComponent } from './acparts-dialog/acparts-dialog.component';
import { BarchartComponent } from './barchart/barchart.component';
import { IndicatorpickerComponent } from './indicatorpicker/indicatorpicker.component';
import { ShowCs1ImpactsQaComponent } from './show-cs1-impacts-qa/show-cs1-impacts-qa.component';
//import { AuthGuardService } from './auth-guard.service';


const appRoutes: Routes = [
  { path: 'showUser', component: ShowUserComponent },
  { path: 'showRole', component: ShowRoleComponent },
  { path: 'showOwner', component: ShowOwnerComponent },
  { path: 'showProcess', component: EDASProcessOverviewComponent },
  { path: 'showActivity', component: ActivityOverviewComponent },
  { path: 'showComponent', component: ComponentOverviewComponent },
  { path: 'showProcesses', component: ProcessOverviewComponent },
  { path: 'vis', component: VisComponent },
  { path: 'overview', component: EcoThemesOverviewComponent },
  { path: 'numtechs', component: AircraftModelComponent },
  { path: 'budget', component: BudgetDistributionComponent },
  { path: 'ilcdupload', component: IlcdUploadComponent },
  { path: 'excelupload', component: ExcelUploadComponent },
  { path: 'login', component: LoginFormComponent },
  { path: 'materials', component: MaterialsComponent },
  { path: 'showCS1Processes', component: ShowCs1Component },
  { path: 'showCS1Impacts', component: ShowCs1ImpactsComponent },
  { path: 'showCS2Processes', component: ShowCs1Component },
  { path: 'showCS2Impacts', component: ShowCs1ImpactsComponent },
   { path: 'showCS2ImpactsQa', component: ShowCs1ImpactsQaComponent },
  { path: 'showFlagshipDemonstrators', component: FlagshipDemonstratorComponent },
  { path: 'showHelicopterDemonstrators', component: HelicopterDemonstratorComponent },
  { path: 'showProductionDemonstrators', component: ProductionDemonstratorComponent },
  { path: 'showDemonstratorCohorts', component: DemonstratorCohortComponent },
  { path: 'fsdoverview', component: FsdOverviewComponent},
  { path: 'acparts', component: AcpartsComponent},
  //{ path: 'login', component: LoginFormComponent, canActivate: [AuthGuardService] },
  {
    path: '',
    redirectTo: '/fsdoverview',
    pathMatch: 'full'
  },
]

@NgModule({
    declarations: [
        AppComponent,
        EDASProcessEditDialogComponent,
        DynamicFormComponent,
        DynamicFormQuestionComponent,
        EDASProcessOverviewComponent,
        CustomMatCellComponent,
        DynamicFormChipComponent,
        VisComponent,
        DiagramEdasVeesComponent,
        FactoryVisComponent,
        OverviewchartComponent,
        Plane3dComponent,
        IlcdUploadComponent,
        ExcelUploadComponent,
        LoginFormComponent,
        ShowUserComponent,
        EditUserComponent,
        AirpartSunburstComponent,
        ActivityChartComponent,
        ShowRoleComponent,
        EditRoleComponent,
        AircraftTreeComponent,
        AircraftModelComponent,
        BudgetDistributionComponent,
        EcoThemesOverviewComponent,
        TechnologyListComponent,
        MaterialsComponent,
        MaterialListComponent,
        CompareImpactsBarchartComponent,
        ActivityOverviewComponent,
        TreeviewDialogComponent,
        ActivityEditDialogComponent,
        ComponentOverviewComponent,
        ProcessOverviewComponent,
        ProcessEditDialogComponent,
        ComponentEditDialogComponent,
        ConfirmDialogComponent,
        ShowCs1Component,
        ShowCs1ImpactsComponent,
        DemonstratorCohortComponent,
        ShowCs1DetailsComponent,
        ShowCs1ResultListComponent,
        ShowCs1CompareResultsBarchartComponent,
        ShowCs1CompareResultsRadarComponent,
        Cs1EditDialogComponent,
        FlagshipDemonstratorComponent,
        ModelViewerComponent,
        ModelViewerNavigationComponent,
        ModelViewerDetailsViewComponent,
        ProductionDemonstratorComponent,
        HelicopterDemonstratorComponent,
        FsdOverviewComponent,
        ShowOwnerComponent,
        EditOwnerComponent,
        AcpartsComponent,
        AcpartsDialogComponent,
        BarchartComponent,
        IndicatorpickerComponent,
        ShowCs1ImpactsQaComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        MatTableModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatCardModule,
        MatButtonModule,
        MatSelectModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatTabsModule,
        MatSortModule,
        MatChipsModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatTreeModule,
        MatListModule,
        MatBottomSheetModule,
        MatCheckboxModule,
        MatBadgeModule,
        CdkTableModule,
        MatExpansionModule,
        RouterModule.forRoot(appRoutes, { enableTracing: true, relativeLinkResolution: 'legacy' })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

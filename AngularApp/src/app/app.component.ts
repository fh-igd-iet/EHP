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
import { MatDialog } from '@angular/material/dialog';
import { RestService } from './rest.service';
import { Router, NavigationStart, NavigationEnd, NavigationError, Event } from '@angular/router';
import { EditUserComponent } from './edit-user/edit-user.component';
import { UserDBO } from './Common/UserDBO';
import { LocalStorageService } from './local-storage.service';
import { LcaResult } from './Common/LcaResult';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'nginputapp';
  currentDialog: any;
  selectedResults: LcaResult[];
  selectedResultsQa: LcaResult[];
  assignedAssemblies: Number;


  constructor(public dialog: MatDialog,
    private lss: LocalStorageService,
    public rest: RestService,
    private router: Router) {

    rest.tryLogin();
    router.events.subscribe((event: Event) => {

      if (event instanceof NavigationStart) {
        // Show loading indicator
      }

      if (event instanceof NavigationEnd) {
        // Hide loading indicator
        rest.tryLogin()
      }

      if (event instanceof NavigationError) {
        // Hide loading indicator

        // Present error to user
        console.log(event.error);
      }
    });

    this.lss.getLcaResults(); // loading LcaResults from local storage 
    this.lss.observeSelectedLcaResults().subscribe((data) => {
      this.selectedResults = data;
    });


    this.lss.getLcaResults("qa"); // loading LcaResults from local storage 
    this.lss.observeSelectedLcaResultsQa().subscribe((data) => {
      this.selectedResultsQa = data;
    });

    this.lss.getAssemblies();
    this.lss.observeAssignedAssemblies().subscribe((data) => {
      this.assignedAssemblies = data; 
    })
  }

  ngOnInit() {
    this.rest.tryLogin();
  }

  logout() {
    this.rest.get('/logout').subscribe();
    this.router.navigate(["/"])
  }

  userCan(permission) {
    return this.rest.can(permission)
  }

  editUser() {
    if (!this.rest.can('user_management_me'))
      return;
    this.rest.get('/User').subscribe((d: UserDBO[]) => {
      let row = d.find(x => x.login == this.rest.username);
      if (row) {
        let dialog = this.dialog.open(EditUserComponent, {
          data: row,
          disableClose: true
        });
      }
    });
  }

}


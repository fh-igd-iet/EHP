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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { VEESChordmatrix } from './Common/Chordmatrix'
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  url: string;
  openlcaUrl: string;
  httpOptions: Object = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true
  };

  username: string = null;
  permissions: string[] = []
  logedin: boolean = false;

  constructor(private http: HttpClient,
    private router: Router,
    private location: Location) {

    this.url = this.location.path().split('/')[0] + environment.api_endpoint;
    this.openlcaUrl = this.location.path().split('/')[0] + environment.olca_api_endpoint;

    this.tryLogin();
    window.setInterval(this.tryLogin.bind(this), 4000);
  }

  can(permission) {
    return this.permissions.findIndex(d => d == permission) >= 0;
  }

  tryLogin() {
    this.get("/checkAuth").subscribe(
      (res) => {
        this.logedin = true;
        this.username = res["login"];
        this.permissions = res['permissions'];
        
        // Check if the user is logged in and trying to access the login page
        if (this.router.url.includes('/login')) {
          // Redirect the user to the fsdoverview page
          this.router.navigate(['/fsdoverview']);
        }
      },
      error => {
        this.logedin = false;
        console.log(error);
        // Only navigate to the login page if the user is not already on the login page
        if (!this.router.url.includes('/login')) {
          this.router.navigate(['/login']);
        }
      }
    );
  }

  get(url: string, lca: boolean = false) {
    if (lca) {
      return this.http.get(this.openlcaUrl + url, { withCredentials: true })
    }
    return this.http.get(this.url + url, { withCredentials: true })
  }

  post(url: string, data: Object) {
    return this.http.post(this.url + url, data, this.httpOptions)
  }

  put(url: string, data: Object) {
    return this.http.put(this.url + url, data, this.httpOptions)
  }

  delete(url: string) {
    return this.http.delete(this.url + url, this.httpOptions)
  }

  requestVEESMatrixBy(mode, inverted = false, cb, err) {
    return this.http.get(this.url + "/budgetsums/" + mode, { withCredentials: true }).subscribe(
      (data: Array<Object>) => {
        let colNames = [];
        let first = true;
        let mainkey = 'spd';
        if (mode == 'cohort')
          mainkey = 'cohort'
        if (mode == 'wp')
          mainkey = 'wp'
        if (mode == 'owner')
          mainkey = 'owner';
        if (mode == 'owner-spd')
          mainkey = 'spd';
        for (let key in data[0]) {
          if (key != mainkey)
            colNames.push(key);
        }
        let chordMatrix = new VEESChordmatrix(colNames);
        for (let row of data) {
          let rowVals = [];
          for (let key in row)
            if (mainkey != key)
              rowVals.push(row[key])
          chordMatrix.addRow(row[mainkey], rowVals);
        }
        cb(chordMatrix);
      },
      error => err(error)
    );
  }

  uploadILCDFile(f: File) {
    let fd: FormData = new FormData();
    fd.append('file', f, f.name);
    return this.http.post(this.openlcaUrl + '/import', fd, { withCredentials: true })
  }

  tryUploadILCDProcess(f: File) {
    let fd: FormData = new FormData();
    fd.append('file', f, f.name);
    return this.http.post(this.openlcaUrl + '/import/singletry/', fd, { withCredentials: true })
  }


  uploadImageFile(f: File) {
    let fd: FormData = new FormData();
    fd.append('file', f, f.name);
    return this.http.post(this.url + '/image/upload', fd, { withCredentials: true })
  }

  chrome_iframe_check_interval: any = null;
  startIframeDownload(url, error, success) {
    // browser detection
    let isChrome = /Chrome/.test(navigator.userAgent)

    console.log("downloading Process");

    if (this.chrome_iframe_check_interval != null) {
      window.clearInterval(this.chrome_iframe_check_interval);
      this.chrome_iframe_check_interval = null;
    }

    let oldifrm = document.getElementById('download-iframe');
    if (oldifrm)
      document.body.removeChild(oldifrm)
    let ifrm = document.createElement("iframe");
    ifrm.setAttribute('id', 'download-iframe');
    ifrm.style.display = 'none';
    let downloadUrl = url;
    let onloadCapsul = () => {
      let data = ifrm.contentDocument.body.innerText;
      if (data.indexOf('HTTP ERROR 404') >= 0 ||
        data.indexOf('Cannot GET') >= 0) {
        error();
      } else {
        success();
      }
    }
    if (isChrome) {
      console.log("chrome")
      this.chrome_iframe_check_interval = window.setInterval(
        () => {
          let iframeDoc = ifrm.contentDocument || ifrm.contentWindow.document;
          if (iframeDoc.readyState == 'complete') {
            window.clearInterval(this.chrome_iframe_check_interval)
            this.chrome_iframe_check_interval = null;
            if (iframeDoc.body.innerText.indexOf('HTTP ERROR 404') >= 0 ||
              iframeDoc.body.innerText.indexOf('Cannot GET') >= 0) {
              error();
            } else {
              success();
            }
          }
        }, 500
      )
    } else {
      console.log("nochrome")
      ifrm.onload = onloadCapsul;
    }
    ifrm.setAttribute('src', downloadUrl);
    document.body.appendChild(ifrm);
  }

  downloadProcess(id: number, success, error) {
    this.startIframeDownload(this.openlcaUrl + '/impact/exportProcess?id=' + id, error, success);
  }

  downloadEveryProcess(success, error) {
    this.startIframeDownload(this.openlcaUrl + '/impact/exportEveryProcess', error, success)
  }

  downloadProcesses(ids: Set<number>, success, error) {
    this.startIframeDownload(this.openlcaUrl + '/impact/exportProcesses?ids=' + Array.from(ids).join(), error, success);
  }

  imageURL(id)
  {
    return this.url+"/image/"+String(id);
  }
}
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
export class VEESChordmatrix {
    values: any;
    colNames: any;
    rowNames: any;

    constructor(colNames) {
        this.colNames = colNames;
        this.rowNames = []
        this.values = []
    }

    addRow(name, values) {
        if (values.length = this.colNames.length) {
            this.rowNames.push(name);
            this.values.push(values);
        }
    }

    getRow(name) {
        if (this.rowNames.indexOf(name) < 0)
            return null;
        return this.values[this.rowNames.indexOf(name)];
    }

    matrix() {
        let mat = []
        for (let i = 0; i < this.colNames.length + this.rowNames.length; i++) {
            let row = []
            for (let j = 0; j < this.colNames.length + this.rowNames.length; j++) {
                if (i < this.colNames.length && j >= this.colNames.length) {
                    let col_i = i;
                    let row_i = j - this.colNames.length;
                    row.push(this.values[row_i][col_i]);
                } else if (j < this.colNames.length && i >= this.colNames.length) {
                    let col_i = j;
                    let row_i = i - this.colNames.length;
                    row.push(this.values[row_i][col_i]);
                }
                else {
                    row.push(0)
                }
            }
            mat.push(row);
        }
        return mat;
    }
}
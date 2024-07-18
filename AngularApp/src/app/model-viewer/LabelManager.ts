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
import * as THREE from 'three';

export class LabelManager {

    sprites: THREE.Sprite[] = [];

    makeTextSprite(message: string) {

        const borderSize = 2;
        const size = 30;
        const labelBaseScale = 0.0006;
        const ctx = document.createElement('canvas').getContext('2d');
        const font = `${size}px bold arial`;
        ctx.font = font;
        // measure how long the name will be
        const doubleBorderSize = borderSize * 2;
        const width = ctx.measureText(message).width + doubleBorderSize;
        const height = size + doubleBorderSize;
        ctx.canvas.width = width;
        ctx.canvas.height = height;

        // need to set font again after resizing canvas
        ctx.font = font;
        ctx.textBaseline = 'top';

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'white';
        ctx.fillText(message, borderSize, borderSize);
        const texture = new THREE.CanvasTexture(ctx.canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        const labelMaterial = new THREE.SpriteMaterial({
            map: texture,
            sizeAttenuation: false,
        });
        const labelGeometry = new THREE.PlaneGeometry(1, 1);
        const label = new THREE.Sprite(labelMaterial);
        label.scale.x = ctx.canvas.width * labelBaseScale;
        label.scale.y = ctx.canvas.height * labelBaseScale;

        return label;
    }
}
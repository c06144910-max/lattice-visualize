import * as THREE from 'three';

import { getNearestBondPairs } from '../band/nearestBonds';

export function renderNearestBonds(
    group,
    atoms
) {
    group.clear();

    const pairs =
        getNearestBondPairs(atoms);

    const material =
        new THREE.LineBasicMaterial({
            color: 0xffff00
        });

    for (const pair of pairs) {
        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints([
                    pair.a.position,
                    pair.b.position
                ]);

        const line =
            new THREE.Line(
                geometry,
                material
            );

        group.add(line);
    }
}
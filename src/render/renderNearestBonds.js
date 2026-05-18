import * as THREE from 'three';

export function renderNearestBonds(
    group,
    atoms
) {

    group.clear();

    if (atoms.length < 2) {
        return;
    }

    //
    // find nearest distance
    //

    let minDistance =
        Infinity;

    for (let i = 0; i < atoms.length; i++) {

        for (
            let j = i + 1;
            j < atoms.length;
            j++
        ) {

            const d =
                atoms[i]
                .position
                .distanceTo(
                    atoms[j].position
                );

            if (
                d > 0.001 &&
                d < minDistance
            ) {

                minDistance = d;
            }
        }
    }

    //
    // render bonds
    //

    const epsilon = 0.01;

    const material =
        new THREE.LineBasicMaterial({

            color: 0xffffff
        });

    for (let i = 0; i < atoms.length; i++) {

        for (
            let j = i + 1;
            j < atoms.length;
            j++
        ) {

            const d =
                atoms[i]
                .position
                .distanceTo(
                    atoms[j].position
                );

            if (
                Math.abs(
                    d - minDistance
                ) < epsilon
            ) {

                const geometry =
                    new THREE.BufferGeometry()
                    .setFromPoints([

                        atoms[i].position,

                        atoms[j].position
                    ]);

                const line =
                    new THREE.Line(
                        geometry,
                        material
                    );

                group.add(line);
            }
        }
    }
}
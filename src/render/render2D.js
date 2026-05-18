import * as THREE from 'three';

function v2(v) {
    return new THREE.Vector3(
        v[0],
        v[1],
        0
    );
}

function latticePoint(i, j, a1, a2) {
    return a1.clone()
        .multiplyScalar(i)
        .add(
            a2.clone()
            .multiplyScalar(j)
        );
}

function keyOf(p) {
    return `${p.x.toFixed(4)},${p.y.toFixed(4)}`;
}

export function generate2DAtoms(lattice, cells) {
    const atoms = [];
    const seen = new Set();

    const a1 = v2(lattice.cellVectors[0]);
    const a2 = v2(lattice.cellVectors[1]);

    for (let i = 0; i <= cells; i++) {
        for (let j = 0; j <= cells; j++) {
            const origin = latticePoint(i, j, a1, a2);

            for (const b of lattice.basis) {
                const p = origin.clone().add(v2(b.pos));
                const key = keyOf(p);

                if (seen.has(key)) continue;
                seen.add(key);

                atoms.push({
                    position: p,
                    color: b.color
                });
            }
        }
    }

    return atoms;
}

export function render2DCells(
    group,
    vectors,
    cells,
    color,
    offset = [0, 0]
) {
    group.clear();

    const a1 = v2(vectors[0]);
    const a2 = v2(vectors[1]);
    const offsetVec = v2(offset);

    const material = new THREE.LineBasicMaterial({
        color
    });

    for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
            const p0 =
                latticePoint(i, j, a1, a2)
                    .add(offsetVec);

            const p1 = p0.clone().add(a1);
            const p2 = p0.clone().add(a1).add(a2);
            const p3 = p0.clone().add(a2);

            const geometry =
                new THREE.BufferGeometry()
                    .setFromPoints([
                        p0, p1, p2, p3, p0
                    ]);

            group.add(
                new THREE.Line(
                    geometry,
                    material
                )
            );
        }
    }
}

export function render2DNearestBonds(
    group,
    atoms
) {
    group.clear();

    if (atoms.length < 2) return;

    let minDistance = Infinity;

    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const d =
                atoms[i].position.distanceTo(
                    atoms[j].position
                );

            if (d > 1e-4 && d < minDistance) {
                minDistance = d;
            }
        }
    }

    const material =
        new THREE.LineBasicMaterial({
            color: 0xffff00
        });

    const eps = 1e-3;

    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const d =
                atoms[i].position.distanceTo(
                    atoms[j].position
                );

            if (Math.abs(d - minDistance) < eps) {
                const geometry =
                    new THREE.BufferGeometry()
                        .setFromPoints([
                            atoms[i].position,
                            atoms[j].position
                        ]);

                group.add(
                    new THREE.Line(
                        geometry,
                        material
                    )
                );
            }
        }
    }
}
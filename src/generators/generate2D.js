import * as THREE from 'three';

export function generate2DAtoms(lattice, cells) {
    const atoms = [];
    const seen = new Set();

    const [a1, a2] = lattice.cellVectors;

    for (let i = 0; i <= cells; i++) {
        for (let j = 0; j <= cells; j++) {
            for (const atom of lattice.basis) {
                const [bx, by] = atom.pos;

                const x =
                    i * a1[0] + j * a2[0] + bx;

                const y =
                    i * a1[1] + j * a2[1] + by;

                const key =
                    `${x.toFixed(4)},${y.toFixed(4)}`;

                // if (seen.has(key)) continue;
                seen.add(key);

                atoms.push({
                    position: new THREE.Vector3(x, y, 0),
                    color: atom.color
                });
            }
        }
    }

    return atoms;
}
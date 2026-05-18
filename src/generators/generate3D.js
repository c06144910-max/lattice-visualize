import * as THREE from 'three';

function v3(v) {
    return new THREE.Vector3(
        v[0],
        v[1],
        v[2] ?? 0
    );
}

function latticePoint(i, j, k, a1, a2, a3) {
    return a1.clone().multiplyScalar(i)
        .add(a2.clone().multiplyScalar(j))
        .add(a3.clone().multiplyScalar(k));
}

function basisOffset(atom, a1, a2, a3) {
    const p = atom.frac ?? atom.pos;

    return a1.clone().multiplyScalar(p[0])
        .add(a2.clone().multiplyScalar(p[1]))
        .add(a3.clone().multiplyScalar(p[2] ?? 0));
}

function isCornerAtom(atom) {
    const p = atom.frac ?? atom.pos;

    return (
        p[0] === 0 &&
        p[1] === 0 &&
        (p[2] ?? 0) === 0
    );
}

export function generate3DAtoms(lattice, cells) {
    const atoms = [];
    const seen = new Set();

    const a1 = v3(lattice.cellVectors[0]);
    const a2 = v3(lattice.cellVectors[1]);
    const a3 = v3(lattice.cellVectors[2]);

    for (const atom of lattice.basis) {
        const corner = isCornerAtom(atom);

        const max = corner
            ? cells
            : cells - 1;

        for (let i = 0; i <= max; i++) {
            for (let j = 0; j <= max; j++) {
                for (let k = 0; k <= max; k++) {
                    const origin =
                        latticePoint(i, j, k, a1, a2, a3);

                    const p =
                        origin.add(
                            basisOffset(atom, a1, a2, a3)
                        );

                    const key =
                        `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`;

                    if (seen.has(key)) continue;
                    seen.add(key);

                    atoms.push({
                        position: p,
                        color: atom.color
                    });
                }
            }
        }
    }

    return atoms;
}
import { computeReciprocalVectors }
from '../reciprocal/reciprocal';

import { getNearestBondPairs }
from './nearestBonds';

//
// vector helpers
//

function dot(a, b) {
    return a[0] * b[0]
        + a[1] * b[1]
        + (a[2] ?? 0) * (b[2] ?? 0);
}

function addVec(a, b) {
    return [
        a[0] + b[0],
        a[1] + b[1],
        (a[2] ?? 0) + (b[2] ?? 0)
    ];
}

function scaleVec(v, s) {
    return [
        v[0] * s,
        v[1] * s,
        (v[2] ?? 0) * s
    ];
}

function zeroVec() {
    return [0, 0, 0];
}

function vecFromThree(v) {
    return [
        v.x,
        v.y,
        v.z ?? 0
    ];
}

//
// hopping
//

function normalizeT(t) {
    if (typeof t === 'number') {
        return { x:t, y:t, z:t };
    }

    return {
        x: t.x ?? 1,
        y: t.y ?? 1,
        z: t.z ?? 1
    };
}

function hoppingByDirection(delta, tInput) {
    const t = normalizeT(tInput);

    const ax = Math.abs(delta[0]);

    const ay = Math.abs(delta[1]);

    const az = Math.abs(delta[2] ?? 0);

    const norm = ax + ay + az;

    if (norm < 1e-12) {
        return 0;
    }

    return (
        t.x * ax +
        t.y * ay +
        t.z * az
    ) / norm;
}

//
// reciprocal / k-path
//

function reciprocalArray(lattice) {
    return computeReciprocalVectors(lattice).map(v => [v.x, v.y, v.z]);
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function lerpPoint(p1, p2, t) {
    return p1.map(
        (v, i) =>
            lerp(v, p2[i], t)
    );
}

export function generateKPath(points, pointsPerSegment = 40) {
    const result = [];
    let distance = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];

        const end = points[i + 1];

        for (let j = 0; j < pointsPerSegment; j++) {
            const t = j / pointsPerSegment;

            const k = lerpPoint( start.k, end.k, t );

            if (result.length > 0) {
                const prev = result[result.length - 1].k;

                const dk =
                    Math.sqrt(
                        k.reduce((sum, v, idx) => {
                            const d = v - prev[idx];
                            return sum + d * d;
                            },
                            0)
                    );

                distance += dk;
            }

            result.push({
                k,
                x: distance,
                label:
                    j === 0
                        ? start.label
                        : ''
            });
        }
    }

    const last = points[points.length - 1];

    result.push({
        k: last.k,
        x: distance,
        label: last.label
    });

    return result;
}

//
// high-symmetry paths
//

function path2DSquare(lattice) {
    const [b1, b2] = reciprocalArray(lattice);

    const gamma = zeroVec();

    const X = scaleVec(b1, 1 / 2);

    const M = scaleVec( addVec(b1, b2), 1 / 2 );

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'X', k: X },
        { label: 'M', k: M },
        { label: 'Γ', k: gamma }
    ]);
}

function path2DHexagonal(lattice) {
    const [b1, b2] =
        reciprocalArray(lattice);

    const gamma =
        zeroVec();

    const K =
        scaleVec(
            addVec(
                scaleVec(b1, 2),
                b2
            ),
            1 / 3
        );

    const M =
        scaleVec(b1, 1 / 2);

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'K', k: K },
        { label: 'M', k: M },
        { label: 'Γ', k: gamma }
    ]);
}

function path3DCubic(lattice) {
    const [b1, b2, b3] =
        reciprocalArray(lattice);

    const gamma =
        zeroVec();

    const X =
        scaleVec(b1, 1 / 2);

    const M =
        scaleVec(
            addVec(b1, b2),
            1 / 2
        );

    const R =
        scaleVec(
            addVec(
                addVec(b1, b2),
                b3
            ),
            1 / 2
        );

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'X', k: X },
        { label: 'M', k: M },
        { label: 'R', k: R },
        { label: 'Γ', k: gamma }
    ]);
}

function path3DBCC(lattice) {
    const [b1, b2, b3] =
        reciprocalArray({
            primitiveVectors: lattice.cellVectors
        });

    const gamma = zeroVec();

    const H = b1;

    const N =
        scaleVec(
            addVec(b1, b2),
            1 / 2
        );

    const P =
        scaleVec(
            addVec(
                addVec(b1, b2),
                b3
            ),
            1 / 2
        );

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'H', k: H },
        { label: 'N', k: N },
        { label: 'Γ', k: gamma },
        { label: 'P', k: P },
        { label: 'H', k: H }
    ]);
}

function path3DFCC(lattice) {
    const [b1, b2, b3] =
        reciprocalArray({
            primitiveVectors: lattice.cellVectors
        });

    const gamma =
        zeroVec();

    const X =
        scaleVec(
            addVec(b1, b2),
            1 / 2
        );

    const W =
        addVec(
            scaleVec(b1, 1),
            scaleVec(b2, 1 / 2)
        );

    const K =
        addVec(
            scaleVec(b1, 3 / 4),
            scaleVec(b2, 3 / 4)
        );

    const L =
        scaleVec(
            addVec(
                addVec(b1, b2),
                b3
            ),
            1 / 2
        );

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'X', k: X },
        { label: 'W', k: W },
        { label: 'K', k: K },
        { label: 'Γ', k: gamma },
        { label: 'L', k: L },
        { label: 'W', k: W }
    ]);
}

//
// rendered-bond based neighbor extraction
//

function findBestReferenceAtom(
    atoms,
    pairs,
    twoBand = false
) {
    let best = null;
    let bestDegree = -1;

    for (const atom of atoms) {
        if (
            twoBand &&
            atom.basisIndex !== 0
        ) {
            continue;
        }

        let degree = 0;

        for (const pair of pairs) {
            const touches =
                pair.a === atom ||
                pair.b === atom;

            if (!touches) {
                continue;
            }

            const other =
                pair.a === atom
                    ? pair.b
                    : pair.a;

            if (
                twoBand &&
                other.basisIndex ===
                    atom.basisIndex
            ) {
                continue;
            }

            degree++;
        }

        if (degree > bestDegree) {
            bestDegree = degree;
            best = atom;
        }
    }

    return best;
}

function getNearestDeltasFromRenderedBonds(
    atoms,
    twoBand = false
) {
    if (!atoms || atoms.length < 2) {
        return [];
    }

    const pairs =
        getNearestBondPairs(atoms);

    const ref =
        findBestReferenceAtom(
            atoms,
            pairs,
            twoBand
        );

    if (!ref) {
        return [];
    }

    const deltas = [];

    for (const pair of pairs) {
        const touches =
            pair.a === ref ||
            pair.b === ref;

        if (!touches) {
            continue;
        }

        const other =
            pair.a === ref
                ? pair.b
                : pair.a;

        if (
            twoBand &&
            other.basisIndex ===
                ref.basisIndex
        ) {
            continue;
        }

        let delta =
            vecFromThree(pair.delta);

        if (pair.b === ref) {
            delta =
                scaleVec(delta, -1);
        }

        deltas.push(delta);
    }

    return deltas;
}

//
// band formulas
//

function singleBandFromNeighbors(
    k,
    neighbors,
    t
) {
    let energy = 0;

    for (const delta of neighbors) {
        const td =
            hoppingByDirection(
                delta,
                t
            );

        energy +=
            - td *
            Math.cos(
                dot(k, delta)
            );
    }

    return energy;
}

function twoBandFromNeighbors(
    k,
    neighbors,
    t
) {
    let re = 0;
    let im = 0;

    for (const delta of neighbors) {
        const td =
            hoppingByDirection(
                delta,
                t
            );

        const phase =
            dot(k, delta);

        re +=
            td *
            Math.cos(phase);

        im +=
            td *
            Math.sin(phase);
    }

    const mag =
        Math.sqrt(
            re * re +
            im * im
        );

    return [
        -mag,
        mag
    ];
}

function makeSingleBandData(
    path,
    neighbors,
    t
) {
    return path.map(p => ({
        x: p.x,
        energy:
            singleBandFromNeighbors(
                p.k,
                neighbors,
                t
            ),
        label: p.label
    }));
}

function makeTwoBandData(
    path,
    neighbors,
    t
) {
    const lower = [];
    const upper = [];

    for (const p of path) {
        const [e1, e2] =
            twoBandFromNeighbors(
                p.k,
                neighbors,
                t
            );

        lower.push({
            x: p.x,
            energy: e1,
            label: p.label
        });

        upper.push({
            x: p.x,
            energy: e2,
            label: p.label
        });
    }

    return {
        lower,
        upper
    };
}

//
// public API
//

export function getSquareBandData(
    lattice,
    atoms,
    t = 1
) {
    const path =
        path2DSquare(lattice);

    const neighbors =
        getNearestDeltasFromRenderedBonds(
            atoms,
            false
        );

    return makeSingleBandData(
        path,
        neighbors,
        t
    );
}

export function getSCBandData(
    lattice,
    atoms,
    t = 1
) {
    const path =
        path3DCubic(lattice);

    const neighbors =
        getNearestDeltasFromRenderedBonds(
            atoms,
            false
        );

    return makeSingleBandData(
        path,
        neighbors,
        t
    );
}

export function getTriangularBandData(
    lattice,
    atoms,
    t = 1
) {
    const path =
        path2DHexagonal(lattice);

    const neighbors =
        getNearestDeltasFromRenderedBonds(
            atoms,
            false
        );

    return makeSingleBandData(
        path,
        neighbors,
        t
    );
}

export function getBCCBandData(
    lattice,
    atoms,
    t = 1
) {
    const path =
        path3DBCC(lattice);

    const neighbors =
        getNearestDeltasFromRenderedBonds(
            atoms,
            false
        );
    console.log('BCC neighbors:', neighbors);

    return makeSingleBandData(
        path,
        neighbors,
        t
    );
}

export function getFCCBandData(
    lattice,
    atoms,
    t = 1
) {
    const path =
        path3DFCC(lattice);

    const neighbors =
        getNearestDeltasFromRenderedBonds(
            atoms,
            false
        );

    return makeSingleBandData(
        path,
        neighbors,
        t
    );
}

export function getHexagonalBandData(
    lattice,
    atoms,
    t = 1
) {
    const path =
        path2DHexagonal(lattice);

    const neighbors =
        getNearestDeltasFromRenderedBonds(
            atoms,
            true
        );

    return makeTwoBandData(
        path,
        neighbors,
        t
    );
}

export function getDiamondBandData(
    lattice,
    atoms,
    t = 1
) {
    const path =
        path3DFCC(lattice);

    const neighbors =
        getNearestDeltasFromRenderedBonds(
            atoms,
            true
        );

    return makeTwoBandData(
        path,
        neighbors,
        t
    );
}
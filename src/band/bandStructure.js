import { computeReciprocalVectors }
from '../reciprocal/reciprocal';

//
// vector helpers
//

function dot(k, r) {
    return k[0] * r[0]
        + k[1] * r[1]
        + (k[2] ?? 0) * (r[2] ?? 0);
}

function addVec(a, b) {
    return a.map((v, i) => v + b[i]);
}

function subVec(a, b) {
    return a.map((v, i) => v - b[i]);
}

function scaleVec(v, s) {
    return v.map(x => x * s);
}

function zeroVec(dim = 3) {
    return Array(dim).fill(0);
}

function normalizeT(t) {
    if (typeof t === 'number') {
        return {
            x: t,
            y: t,
            z: t
        };
    }

    return {
        x: t.x ?? 1,
        y: t.y ?? 1,
        z: t.z ?? 1
    };
}

function hoppingByDirection(
    delta,
    tInput
) {
    const t = normalizeT(tInput);

    const ax = Math.abs(delta[0]);
    const ay = Math.abs(delta[1]);
    const az = Math.abs(delta[2] ?? 0);

    const norm =
        ax + ay + az;

    if (norm < 1e-12) {
        return 0;
    }

    return (
        t.x * ax +
        t.y * ay +
        t.z * az
    ) / norm;
}

function reciprocalArray(lattice) {
    return computeReciprocalVectors(lattice)
        .map(v => [v.x, v.y, v.z]);
}

function getCellVectors(lattice) {
    return lattice.cellVectors.map(v => [
        v[0],
        v[1],
        v[2] ?? 0
    ]);
}

function getBasisPosition(atom, lattice) {
    const cell =
        getCellVectors(lattice);

    const p =
        atom.frac ?? atom.pos;

    const result =
        zeroVec(3);

    for (let i = 0; i < cell.length; i++) {
        result[0] += cell[i][0] * p[i];
        result[1] += cell[i][1] * p[i];
        result[2] += cell[i][2] * (p[i] ?? 0);
    }

    return result;
}

function complexMagnitudeFromTerms(terms) {
    let re = 0;
    let im = 0;

    for (const term of terms) {
        re +=
            term.amp *
            Math.cos(term.phase);

        im +=
            term.amp *
            Math.sin(term.phase);
    }

    return Math.sqrt(
        re * re +
        im * im
    );
}

//
// k-path helpers
//

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function lerpPoint(p1, p2, t) {
    return p1.map(
        (v, i) => lerp(v, p2[i], t)
    );
}

export function generateKPath(
    points,
    pointsPerSegment = 40
) {
    const result = [];
    let distance = 0;

    for (
        let i = 0;
        i < points.length - 1;
        i++
    ) {
        const start = points[i];
        const end = points[i + 1];

        for (
            let j = 0;
            j < pointsPerSegment;
            j++
        ) {
            const t =
                j / pointsPerSegment;

            const k =
                lerpPoint(
                    start.k,
                    end.k,
                    t
                );

            if (result.length > 0) {
                const prev = result[result.length - 1].k;

                const dk =Math.sqrt(k.reduce((sum, v, idx) => {const d = v - prev[idx];            return sum + d * d;        },        0    ));

                distance += dk;
            }

            result.push({ k, x: distance, label:j === 0 ? start.label: ''});
        }
    }

    const last = points[points.length - 1];

    result.push({k: last.k, x: distance, label: last.label});

    return result;
}

//
// generic band helpers
//

function singleBandFromNeighbors(k, neighbors, t ) {
    let energy = 0;

    for (const delta of neighbors) {
        const td = hoppingByDirection(delta, t);
        energy += -2 * td * Math.cos(dot(k, delta));
    }

    return energy;
}

function twoBandFromNeighbors( k, neighbors, t) {
    const terms =
        neighbors.map(delta => ({amp:hoppingByDirection(delta, t),
            phase: dot(k, delta)
        }));

    const mag = complexMagnitudeFromTerms(terms);

    return [-mag, mag];
}

//
// high-symmetry paths
//

function path2DSquare(lattice) {
    const [b1, b2] =
        reciprocalArray(lattice);

    const gamma = zeroVec(3);

    const X = scaleVec(b1, 1 / 2);

    const M = scaleVec(addVec(b1, b2), 1 / 2 );

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'X', k: X },
        { label: 'M', k: M },
        { label: 'Γ', k: gamma }
    ]);
}

function path2DHexagonal(lattice) {
    const [b1, b2] = reciprocalArray(lattice);

    const gamma = zeroVec(3);

    const K = scaleVec(addVec(scaleVec(b1, 2),b2),1 / 3 );

    const M = scaleVec(b1, 1 / 2);

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'K', k: K },
        { label: 'M', k: M },
        { label: 'Γ', k: gamma }
    ]);
}

function path3DCubic(lattice) {
    const [b1, b2, b3] = reciprocalArray(lattice);

    const gamma = zeroVec(3);

    const X = scaleVec(b1, 1 / 2);

    const M = scaleVec(addVec(b1, b2), 1 / 2 );

    const R = scaleVec(addVec(addVec(b1, b2),b3), 1 / 2 );

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
        reciprocalArray(lattice);

    const gamma = zeroVec(3);

    const H = b1;

    const N = scaleVec(addVec(b1, b2),1 / 2 );

    const P = scaleVec(addVec(addVec(b1, b2),b3),1 / 2 );

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'H', k: H },
        { label: 'N', k: N },
        { label: 'Γ', k: gamma },
        { label: 'P', k: P }
    ]);
}

function path3DFCC(lattice) {
    const [b1, b2, b3] = reciprocalArray(lattice);

    const gamma = zeroVec(3);

    const X = scaleVec(b1, 1 / 2);

    const W = addVec(scaleVec(b1, 1 / 2),scaleVec(b2, 1 / 4) );

    const L = scaleVec(addVec(addVec(b1, b2),b3),1 / 2 );

    return generateKPath([
        { label: 'Γ', k: gamma },
        { label: 'X', k: X },
        { label: 'W', k: W },
        { label: 'L', k: L },
        { label: 'Γ', k: gamma }
    ]);
}

//
// neighbor vectors
//

function squareNeighbors(lattice) {
    const [a1, a2] = getCellVectors(lattice);

    return [a1,a2];
}

function scNeighbors(lattice) {
    const [a1, a2, a3] = getCellVectors(lattice);

    return [a1,a2,a3];
}

function triangularNeighbors(lattice) {
    const [a1, a2] = getCellVectors(lattice);

    return [a1, a2, subVec(a1, a2)];
}

function bccNeighbors(lattice) {
    const [A, B, C] = getCellVectors(lattice);

    return [
        scaleVec(addVec(addVec(A, B),C),1 / 2),

        scaleVec(addVec(addVec(A, B),scaleVec(C, -1)),1 / 2),

        scaleVec(addVec(addVec(A, scaleVec(B, -1)),C),1 / 2),

        scaleVec(addVec(addVec(scaleVec(A, -1), B),C),1 / 2)
    ];
}

function fccNeighbors(lattice) {
    const [A, B, C] = getCellVectors(lattice);

    return [
        scaleVec(addVec(A, B),1 / 2),
        scaleVec(subVec(A, B),1 / 2),

        scaleVec(addVec(B, C),1 / 2),
        scaleVec(subVec(B, C),1 / 2),

        scaleVec(addVec(C, A),1 / 2),
        scaleVec(subVec(C, A),1 / 2)
    ];
}

function honeycombNeighbors(lattice) {
    const [a1, a2] = getCellVectors(lattice);

    const basis = lattice.basis;

    const A = getBasisPosition(basis[0],lattice);

    const B = getBasisPosition(basis[1],lattice);

    const d1 = subVec(B, A);

    const d2 = subVec(d1, a1);

    const d3 = subVec(d1, a2);

    return [d1,d2,d3];
}

function diamondNeighbors(lattice) {
    const [A, B, C] = getCellVectors(lattice);

    return [
        scaleVec(addVec(addVec(A, B),C),1 / 4),

        scaleVec(addVec(addVec(A, scaleVec(B, -1)),scaleVec(C, -1)),1 / 4),

        scaleVec(addVec(addVec(scaleVec(A, -1), B),scaleVec(C, -1)),1 / 4),

        scaleVec(addVec(addVec(scaleVec(A, -1), scaleVec(B, -1)),C),1 / 4)
    ];
}

//
// public band functions
//

export function getSquareBandData(
    lattice,
    t = 1
) {
    const path = path2DSquare(lattice);

    const neighbors = squareNeighbors(lattice);

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

export function getSCBandData(
    lattice,
    t = 1
) {
    const path = path3DCubic(lattice);

    const neighbors = scNeighbors(lattice);

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

export function getTriangularBandData(
    lattice,
    t = 1
) {
    const path = path2DHexagonal(lattice);

    const neighbors = triangularNeighbors(lattice);

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

export function getBCCBandData(
    lattice,
    t = 1
) {
    const path = path3DBCC(lattice);

    const neighbors = bccNeighbors(lattice);

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

export function getFCCBandData(
    lattice,
    t = 1
) {
    const path = path3DFCC(lattice);

    const neighbors = fccNeighbors(lattice);

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

export function getHoneycombBandData(
    lattice,
    t = 1
) {
    const path = path2DHexagonal(lattice);

    const neighbors = honeycombNeighbors(lattice);

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

    return {lower, upper};
}

export function getDiamondBandData(
    lattice,
    t = 1
) {
    const path = path3DFCC(lattice);

    const neighbors = diamondNeighbors(lattice);

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
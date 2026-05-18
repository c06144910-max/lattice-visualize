import * as THREE from 'three';

import { ConvexGeometry } from
'three/examples/jsm/geometries/ConvexGeometry.js';

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

function makePlane(normal, c) {
    return { normal, c };
}

function insideAllPlanes(p, planes) {
    const eps = 1e-6;

    for (const plane of planes) {
        if (p.dot(plane.normal) > plane.c + eps) {
            return false;
        }
    }

    return true;
}

function createVoronoiGeometryFromNeighbors(neighbors) {
    const planes = neighbors.map(R =>
        makePlane(
            R,
            R.lengthSq() / 2
        )
    );

    const points = [];

    for (let i = 0; i < planes.length; i++) {
        for (let j = i + 1; j < planes.length; j++) {
            for (let k = j + 1; k < planes.length; k++) {
                const P1 = planes[i];
                const P2 = planes[j];
                const P3 = planes[k];

                const n1 = P1.normal;
                const n2 = P2.normal;
                const n3 = P3.normal;

                const matrix = new THREE.Matrix3();

                matrix.set(
                    n1.x, n1.y, n1.z,
                    n2.x, n2.y, n2.z,
                    n3.x, n3.y, n3.z
                );

                if (Math.abs(matrix.determinant()) < 1e-8) {
                    continue;
                }

                const rhs = new THREE.Vector3(
                    P1.c,
                    P2.c,
                    P3.c
                );

                const p =
                    rhs.clone()
                        .applyMatrix3(
                            matrix.clone().invert()
                        );

                if (insideAllPlanes(p, planes)) {
                    const exists =
                        points.some(q =>
                            q.distanceTo(p) < 1e-5
                        );

                    if (!exists) {
                        points.push(p);
                    }
                }
            }
        }
    }

    if (points.length < 4) {
        return null;
    }

    return new ConvexGeometry(points);
}

function createPrototypeVoronoiGeometry(
    lattice,
    basisAtom
) {
    const a1 = v3(lattice.cellVectors[0]);
    const a2 = v3(lattice.cellVectors[1]);
    const a3 = v3(lattice.cellVectors[2]);

    const center =
        basisOffset(
            basisAtom,
            a1,
            a2,
            a3
        );

    const neighbors = [];

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            for (let k = -1; k <= 1; k++) {
                const cellOrigin =
                    latticePoint(
                        i,
                        j,
                        k,
                        a1,
                        a2,
                        a3
                    );

                for (const other of lattice.basis) {
                    const otherPosition =
                        cellOrigin.clone().add(
                            basisOffset(
                                other,
                                a1,
                                a2,
                                a3
                            )
                        );

                    const R =
                        otherPosition
                            .clone()
                            .sub(center);

                    if (R.lengthSq() < 1e-8) {
                        continue;
                    }

                    neighbors.push(R);
                }
            }
        }
    }

    neighbors.sort(
        (A, B) =>
            A.lengthSq() - B.lengthSq()
    );

    const limitedNeighbors =
        neighbors.slice(0, 32);

    return createVoronoiGeometryFromNeighbors(
        limitedNeighbors
    );
}

function createGeometryMap(lattice) {
    const geometryMap = new Map();

    for (const basisAtom of lattice.basis) {
        const type =
            basisAtom.type ?? 'default';

        if (geometryMap.has(type)) {
            continue;
        }

        const geometry =
            createPrototypeVoronoiGeometry(
                lattice,
                basisAtom
            );

        if (geometry) {
            geometryMap.set(
                type,
                geometry
            );
        }
    }

    return geometryMap;
}

export function renderWignerSeitz(
    group,
    lattice,
    atoms
) {
    group.clear();

    const fillMaterial =
        new THREE.MeshPhongMaterial({
            color: 0xffeeee,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false
        });

    const edgeMaterial =
        new THREE.LineBasicMaterial({
            color: 0xffffff
        });

    const geometryMap =
        createGeometryMap(lattice);

    for (const atom of atoms) {
        const type =
            atom.type ?? 'default';

        const geometry =
            geometryMap.get(type);

        if (!geometry) {
            continue;
        }

        const mesh =
            new THREE.Mesh(
                geometry,
                fillMaterial
            );

        mesh.position.copy(
            atom.position
        );

        group.add(mesh);

        const edges =
            new THREE.LineSegments(
                new THREE.EdgesGeometry(geometry),
                edgeMaterial
            );

        edges.position.copy(
            atom.position
        );

        group.add(edges);
    }
}
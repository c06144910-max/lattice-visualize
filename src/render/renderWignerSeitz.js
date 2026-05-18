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

function latticePoint(indices, vectors) {
    const p = new THREE.Vector3();

    for (let i = 0; i < vectors.length; i++) {
        p.add(
            v3(vectors[i]).multiplyScalar(indices[i])
        );
    }

    return p;
}

function getNeighborVectors(vectors) {
    const dim = vectors.length;
    const neighbors = [];

    const range = [-1, 0, 1];

    for (const i of range) {
        for (const j of range) {
            for (const k of dim === 3 ? range : [0]) {
                const indices =
                    dim === 3
                        ? [i, j, k]
                        : [i, j];

                if (indices.every(n => n === 0)) {
                    continue;
                }

                neighbors.push(
                    latticePoint(indices, vectors)
                );
            }
        }
    }

    return neighbors;
}

function insideAllHalfspaces(p, neighbors) {
    const eps = 1e-6;

    for (const R of neighbors) {
        const c = R.lengthSq() / 2;

        if (p.dot(R) > c + eps) {
            return false;
        }
    }

    return true;
}

function createWignerSeitz3DGeometry(vectors) {
    const neighbors =
        getNeighborVectors(vectors);

    const points = [];

    for (let a = 0; a < neighbors.length; a++) {
        for (let b = a + 1; b < neighbors.length; b++) {
            for (let c = b + 1; c < neighbors.length; c++) {

                const R1 = neighbors[a];
                const R2 = neighbors[b];
                const R3 = neighbors[c];

                const matrix =
                    new THREE.Matrix3();

                matrix.set(
                    R1.x, R1.y, R1.z,
                    R2.x, R2.y, R2.z,
                    R3.x, R3.y, R3.z
                );

                const det = matrix.determinant();

                if (Math.abs(det) < 1e-8) {
                    continue;
                }

                const rhs = new THREE.Vector3(
                    R1.lengthSq() / 2,
                    R2.lengthSq() / 2,
                    R3.lengthSq() / 2
                );

                const inv =
                    matrix.clone().invert();

                const p =
                    rhs.clone().applyMatrix3(inv);

                if (
                    insideAllHalfspaces(
                        p,
                        neighbors
                    )
                ) {
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

    return new ConvexGeometry(points);
}

function clipPolygonByHalfPlane(polygon, n, c) {
    const result = [];

    for (let i = 0; i < polygon.length; i++) {
        const A = polygon[i];
        const B = polygon[(i + 1) % polygon.length];

        const da = A.dot(n) - c;
        const db = B.dot(n) - c;

        const insideA = da <= 1e-6;
        const insideB = db <= 1e-6;

        if (insideA && insideB) {
            result.push(B);
        }
        else if (insideA && !insideB) {
            const t = da / (da - db);
            result.push(A.clone().lerp(B, t));
        }
        else if (!insideA && insideB) {
            const t = da / (da - db);
            result.push(A.clone().lerp(B, t));
            result.push(B);
        }
    }

    return result;
}

function createWignerSeitz2DShape(vectors) {
    const neighbors =
        getNeighborVectors(vectors);

    let polygon = [
        new THREE.Vector3(-10, -10, 0),
        new THREE.Vector3( 10, -10, 0),
        new THREE.Vector3( 10,  10, 0),
        new THREE.Vector3(-10,  10, 0)
    ];

    for (const R of neighbors) {
        polygon =
            clipPolygonByHalfPlane(
                polygon,
                R,
                R.lengthSq() / 2
            );
    }

    return new THREE.Shape(
        polygon.map(
            p => new THREE.Vector2(p.x, p.y)
        )
    );
}
export function renderWignerSeitz(
    group,
    lattice,
    atoms
) {
    group.clear();

    const vectors =
        lattice.primitiveVectors;

    const dim =
        vectors.length;

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

    let baseGeometry;

    if (dim === 3) {
        baseGeometry =
            createWignerSeitz3DGeometry(
                vectors
            );
    }
    else {
        const shape =
            createWignerSeitz2DShape(
                vectors
            );

        baseGeometry =
            new THREE.ShapeGeometry(shape);
    }

    const edgeGeometry =
        new THREE.EdgesGeometry(
            baseGeometry
        );

    for (const atom of atoms) {

        const mesh =
            new THREE.Mesh(
                baseGeometry,
                fillMaterial
            );

        mesh.position.copy(
            atom.position
        );

        group.add(mesh);

        const edges =
            new THREE.LineSegments(
                edgeGeometry,
                edgeMaterial
            );

        edges.position.copy(
            atom.position
        );

        group.add(edges);
    }
}
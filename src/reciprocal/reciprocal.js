import * as THREE from 'three';

function toVector3(v) {
    return new THREE.Vector3(
        v[0],
        v[1],
        v[2] ?? 0
    );
}

export function computeReciprocalVectors(lattice) {
    const vectors = lattice.primitiveVectors;

    if (vectors.length === 2) {
        const a1 = toVector3(vectors[0]);
        const a2 = toVector3(vectors[1]);

        const area =
            a1.x * a2.y -
            a1.y * a2.x;

        const factor =
            2 * Math.PI / area;

        const b1 = new THREE.Vector3(
            a2.y * factor,
            -a2.x * factor,
            0
        );

        const b2 = new THREE.Vector3(
            -a1.y * factor,
            a1.x * factor,
            0
        );

        return [b1, b2];
    }

    const a1 = toVector3(vectors[0]);
    const a2 = toVector3(vectors[1]);
    const a3 = toVector3(vectors[2]);

    const volume =
        a1.dot(
            a2.clone().cross(a3)
        );

    const factor =
        2 * Math.PI / volume;

    const b1 =
        a2.clone()
            .cross(a3)
            .multiplyScalar(factor);

    const b2 =
        a3.clone()
            .cross(a1)
            .multiplyScalar(factor);

    const b3 =
        a1.clone()
            .cross(a2)
            .multiplyScalar(factor);

    return [b1, b2, b3];
}

export function generateReciprocalPoints(
    lattice,
    cells,
    scale = 0.18
) {
    const bVectors =
        computeReciprocalVectors(lattice);

    const points = [];
    const range = Math.floor(cells / 2);

    if (bVectors.length === 2) {
        const [b1, b2] = bVectors;

        for (let h = -range; h <= range; h++) {
            for (let k = -range; k <= range; k++) {
                const position =
                    b1.clone().multiplyScalar(h)
                        .add(
                            b2.clone().multiplyScalar(k)
                        )
                        .multiplyScalar(scale);

                points.push(position);
            }
        }

        return points;
    }

    const [b1, b2, b3] = bVectors;

    for (let h = -range; h <= range; h++) {
        for (let k = -range; k <= range; k++) {
            for (let l = -range; l <= range; l++) {
                const position =
                    b1.clone().multiplyScalar(h)
                        .add(
                            b2.clone().multiplyScalar(k)
                        )
                        .add(
                            b3.clone().multiplyScalar(l)
                        )
                        .multiplyScalar(scale);

                points.push(position);
            }
        }
    }

    return points;
}

export function renderReciprocalPoints(
    group,
    lattice,
    cells
) {
    group.clear();

    const points =
        generateReciprocalPoints(
            lattice,
            cells
        );

    const geometry =
        new THREE.SphereGeometry(
            0.06,
            24,
            24
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0xdd99ff
        });

    for (const p of points) {
        const mesh =
            new THREE.Mesh(
                geometry,
                material
            );

        mesh.position.copy(p);

        group.add(mesh);
    }

    renderReciprocalPrimitiveCell(
    group,
    lattice
);
}

function createCellGeometryFromVectors(vectors) {
    if (vectors.length === 2) {
        const [b1, b2] = vectors;

        return new THREE.BufferGeometry()
            .setFromPoints([
                new THREE.Vector3(0, 0, 0),
                b1.clone(),
                b1.clone().add(b2),
                b2.clone(),
                new THREE.Vector3(0, 0, 0)
            ]);
    }

    const [b1, b2, b3] = vectors;

    const points = [
        new THREE.Vector3(0,0,0),
        b1.clone(),
        b2.clone(),
        b3.clone(),
        b1.clone().add(b2),
        b2.clone().add(b3),
        b3.clone().add(b1),
        b1.clone().add(b2).add(b3)
    ];

    const edges = [
        [0,1], [0,2], [0,3],
        [1,4], [1,6],
        [2,4], [2,5],
        [3,5], [3,6],
        [4,7], [5,7], [6,7]
    ];

    const linePoints = [];

    for (const [a, b] of edges) {
        linePoints.push(points[a], points[b]);
    }

    return new THREE.BufferGeometry()
        .setFromPoints(linePoints);
}

function createParallelepipedSurfaceGeometry(vectors) {
    const [b1, b2, b3] = vectors;

    const v = [
        new THREE.Vector3(0, 0, 0),
        b1.clone(),
        b2.clone(),
        b3.clone(),
        b1.clone().add(b2),
        b2.clone().add(b3),
        b3.clone().add(b1),
        b1.clone().add(b2).add(b3)
    ];

    const faces = [
        0, 1, 4, 0, 4, 2,
        0, 2, 5, 0, 5, 3,
        0, 3, 6, 0, 6, 1,

        7, 4, 1, 7, 1, 6,
        7, 5, 2, 7, 2, 4,
        7, 6, 3, 7, 3, 5
    ];

    const positions = [];

    for (const i of faces) {
        positions.push(
            v[i].x,
            v[i].y,
            v[i].z
        );
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    geometry.computeVertexNormals();

    return geometry;
}

function createParallelogramSurfaceGeometry(vectors) {
    const [b1, b2] = vectors;

    const v0 = new THREE.Vector3(0, 0, 0);
    const v1 = b1.clone();
    const v2 = b1.clone().add(b2);
    const v3 = b2.clone();

    const positions = [
        v0.x, v0.y, v0.z,
        v1.x, v1.y, v1.z,
        v2.x, v2.y, v2.z,

        v0.x, v0.y, v0.z,
        v2.x, v2.y, v2.z,
        v3.x, v3.y, v3.z
    ];

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    geometry.computeVertexNormals();

    return geometry;
}

export function renderReciprocalPrimitiveCell(
    group,
    lattice,
    scale = 0.18
) {
    const bVectors =
        computeReciprocalVectors(lattice)
            .map(v => v.multiplyScalar(scale));

    const geometry =
        bVectors.length === 3
            ? createParallelepipedSurfaceGeometry(bVectors)
            : createParallelogramSurfaceGeometry(bVectors);

    const faceMaterial =
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false
        });

    const mesh =
        new THREE.Mesh(
            geometry,
            faceMaterial
        );

    group.add(mesh);

    const edgeGeometry =
        new THREE.EdgesGeometry(geometry);

    const edgeMaterial =
        new THREE.LineBasicMaterial({
            color: 0x00ff88
        });

    const edges =
        new THREE.LineSegments(
            edgeGeometry,
            edgeMaterial
        );

    group.add(edges);
}
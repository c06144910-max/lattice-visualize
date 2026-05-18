import * as THREE from 'three';

function v3(v) {
    return new THREE.Vector3(
        v[0],
        v[1],
        v[2] ?? 0
    );
}

function latticePoint3D(i, j, k, a1, a2, a3) {
    return a1.clone().multiplyScalar(i)
        .add(a2.clone().multiplyScalar(j))
        .add(a3.clone().multiplyScalar(k));
}

function createCellGeometry(a1, a2, a3) {
    const v = [
        new THREE.Vector3(0, 0, 0),
        a1.clone(),
        a2.clone(),
        a3.clone(),
        a1.clone().add(a2),
        a2.clone().add(a3),
        a3.clone().add(a1),
        a1.clone().add(a2).add(a3)
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

    for (const index of faces) {
        positions.push(
            v[index].x,
            v[index].y,
            v[index].z
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

export function renderUnitCells(
    group,
    lattice,
    cells
) {
    group.clear();

    const a1 = v3(lattice.cellVectors[0]);
    const a2 = v3(lattice.cellVectors[1]);
    const a3 = v3(lattice.cellVectors[2]);

    const geometry =
        createCellGeometry(a1, a2, a3);

    const material =
        new THREE.MeshPhongMaterial({
            color: 0x66ccff,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            side: THREE.DoubleSide
        });

    const edgeGeometry =
        new THREE.EdgesGeometry(geometry);

    const edgeMaterial =
        new THREE.LineBasicMaterial({
            color: 0xffffff
        });

    for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
            for (let k = 0; k < cells; k++) {
                const origin =
                    latticePoint3D(
                        i,
                        j,
                        k,
                        a1,
                        a2,
                        a3
                    );

                const cell =
                    new THREE.Group();

                const mesh =
                    new THREE.Mesh(
                        geometry,
                        material
                    );

                const edges =
                    new THREE.LineSegments(
                        edgeGeometry,
                        edgeMaterial
                    );

                cell.add(mesh);
                cell.add(edges);

                cell.position.copy(origin);

                group.add(cell);
            }
        }
    }
}
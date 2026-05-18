import * as THREE from 'three';

function createPrimitiveGeometry(
    a1,
    a2,
    a3
) {

    const v = [

        new THREE.Vector3(0,0,0),

        new THREE.Vector3(...a1),

        new THREE.Vector3(...a2),

        new THREE.Vector3(...a3),

        new THREE.Vector3(...a1)
            .add(new THREE.Vector3(...a2)),

        new THREE.Vector3(...a2)
            .add(new THREE.Vector3(...a3)),

        new THREE.Vector3(...a3)
            .add(new THREE.Vector3(...a1)),

        new THREE.Vector3(...a1)
            .add(new THREE.Vector3(...a2))
            .add(new THREE.Vector3(...a3))
    ];

    const indices = [

        0,1,4, 0,4,2,
        0,2,5, 0,5,3,
        0,3,6, 0,6,1,

        7,4,1, 7,1,6,
        7,5,2, 7,2,4,
        7,6,3, 7,3,5
    ];

    const positions = [];

    for (const i of indices) {

        positions.push(
            v[i].x,
            v[i].y,
            v[i].z
        );
    }

    const geometry =
        new THREE.BufferGeometry();

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

export function renderPrimitiveCells(
    group,
    lattice,
    cells
) {

    group.clear();

    const a1 = new THREE.Vector3(...lattice.primitiveVectors[0]);
    const a2 = new THREE.Vector3(...lattice.primitiveVectors[1]);
    const a3 = new THREE.Vector3(...lattice.primitiveVectors[2]);
    
    
    const geometry =
        createPrimitiveGeometry(
            a1,
            a2,
            a3
        );

    const material =
    new THREE.MeshPhongMaterial({

        color: 0x00ff88,

        transparent: true,

        opacity: 0.7,

        side: THREE.DoubleSide,

        depthWrite: false,

        polygonOffset: true,

        polygonOffsetFactor: 1,

        polygonOffsetUnits: 1
    });

    for (let x = 0; x < cells; x++) {
        for (let y = 0; y < cells; y++) {
            for (let z = 0; z < cells; z++) {

                const c1 = new THREE.Vector3(...lattice.cellVectors[0]);
                const c2 = new THREE.Vector3(...lattice.cellVectors[1]);
                const c3 = new THREE.Vector3(...lattice.cellVectors[2]);
                        
                const origin =
                c1.clone().multiplyScalar(x)
                    .add(
                        c2.clone().multiplyScalar(y)
                    )
                    .add(
                        c3.clone().multiplyScalar(z)
                    );
        

                const mesh =
                    new THREE.Mesh(
                        geometry,
                        material
                    );

                mesh.position.copy(origin);

                group.add(mesh);

                const edgeGeometry =
                    new THREE.EdgesGeometry(
                        geometry
                    );

                const edgeMaterial =
                    new THREE.LineBasicMaterial({
                        color: 0xffffff
                    });

                const edges =
                    new THREE.LineSegments(
                        edgeGeometry,
                        edgeMaterial
                    );

                edges.position.copy(origin);

                group.add(edges);
            }
        }
    }
}
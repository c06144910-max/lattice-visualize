import * as THREE from 'three';

const materialCache = new Map();

function getMaterial(color) {
    if (!materialCache.has(color)) {
        materialCache.set(
            color,
            new THREE.MeshStandardMaterial({ color })
        );
    }

    return materialCache.get(color);
}

export function renderAtoms(group, atoms, sphereGeometry) {
    group.clear();

    for (const atom of atoms) {
        const mesh = new THREE.Mesh(
            sphereGeometry,
            getMaterial(atom.color)
        );

        mesh.position.copy(atom.position);
        group.add(mesh);
    }
}
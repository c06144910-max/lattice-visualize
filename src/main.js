import * as THREE from 'three';

import { OrbitControls } from
'three/examples/jsm/controls/OrbitControls.js';

import { LATTICES_3D } from './data/lattices3D';
import { LATTICES_2D } from './data/lattices2D';

import { generate3DAtoms } from './generators/generate3D';

import { generate2DAtoms, render2DCells, render2DNearestBonds } from './render/render2D';
import { renderAtoms } from './render/renderAtoms';
import { renderUnitCells } from './render/renderCells';
import { renderPrimitiveCells } from './render/renderPrimitiveCells';
import { renderNearestBonds } from './render/renderNearestBonds';
import { renderWignerSeitz } from './render/renderWignerSeitz';

import {
    renderReciprocalPoints,
    computeReciprocalVectors
} from './reciprocal/reciprocal';

import { createUI } from './ui/ui';

//
// scenes
//

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const reciprocalScene = new THREE.Scene();
reciprocalScene.background = new THREE.Color(0x111111);

//
// camera
//

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(8, 8, 8);

//
// renderer
//

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.autoClear = false;

document.body.appendChild(
    renderer.domElement
);

//
// controls
//

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

//
// lights
//

scene.add(
    new THREE.AmbientLight(
        0xffffff,
        0.4
    )
);

const light = new THREE.PointLight(
    0xffffff,
    3
);

light.position.set(
    10,
    10,
    10
);

scene.add(light);

reciprocalScene.add(
    new THREE.AmbientLight(
        0xffffff,
        0.4
    )
);

const reciprocalLight = new THREE.PointLight(
    0xffffff,
    3
);

reciprocalLight.position.set(
    10,
    10,
    10
);

reciprocalScene.add(
    reciprocalLight
);

//
// axes
//

scene.add(
    new THREE.AxesHelper(5)
);

reciprocalScene.add(
    new THREE.AxesHelper(5)
);




//
//prieview
//


const previewScene = new THREE.Scene();
previewScene.background = new THREE.Color(0x111111);

const previewCamera = new THREE.PerspectiveCamera(
    45,
    1,
    0.1,
    100
);

previewCamera.position.set(3, 3, 3);
previewCamera.lookAt(0, 0, 0);

const previewGroup = new THREE.Group();
previewScene.add(previewGroup);

previewScene.add(
    new THREE.AmbientLight(
        0xffffff,
        0.8
    )
);


//
// real-space groups
//

const atomGroup = new THREE.Group();
scene.add(atomGroup);

const cellGroup = new THREE.Group();
scene.add(cellGroup);

const primitiveGroup = new THREE.Group();
scene.add(primitiveGroup);

const bondGroup = new THREE.Group();
scene.add(bondGroup);

const wignerSeitzGroup = new THREE.Group();
scene.add(wignerSeitzGroup);

//
// reciprocal-space groups
//

const reciprocalGroup = new THREE.Group();
reciprocalScene.add(reciprocalGroup);

const brillouinZoneGroup = new THREE.Group();
reciprocalScene.add(brillouinZoneGroup);

//
// geometry
//

const sphereGeometry =
    new THREE.SphereGeometry(
        0.12,
        24,
        24
    );

const latticeScale = {
    a: 1,
    b: 1,
    c: 1
    };
//
// state
//

let dimension = '3D';
let currentType = 'BCC';

let showCellMeshes = false;
let showPrimitiveMeshes = false;
let showNearestBonds = false;
let showWignerSeitz = false;

let reciprocalMode = false;
let showBrillouinZone = false;

//
// UI
//

const {
    slider,

    scButton,
    bccButton,
    fccButton,
    diamondButton,

    squareButton,
    triangularButton,
    honeycombButton,

    cellButton,
    primitiveButton,
    bondButton,
    WSButton,

    reciprocalButton,
    brillouinButton,

    label,

    aScale,
    bScale,
    cScale,

    aValue,
    bValue,
    cValue,
    resetLatticeButton,
} = createUI();

//
// helpers
//


function renderLatticePreview(lattice) {
    previewGroup.clear();

    const vectors =
        lattice.cellVectors;

    const colors = [
        0xff5555,
        0x55ff55,
        0x5555ff
    ];

    for (let i = 0; i < vectors.length; i++) {
        const v = new THREE.Vector3(
            vectors[i][0],
            vectors[i][1],
            vectors[i][2] ?? 0
        );

        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    v
                ]);

        const material =
            new THREE.LineBasicMaterial({
                color: colors[i]
            });

        previewGroup.add(
            new THREE.Line(
                geometry,
                material
            )
        );
    }
}


function scaledVector(v, scale) {
    return [
        v[0] * scale,
        v[1] * scale,
        (v[2] ?? 0) * scale
    ];
}

function scaleVectorComponents(v) {
    return [
        v[0] * latticeScale.a,
        v[1] * latticeScale.b,
        (v[2] ?? 0) * latticeScale.c
    ];
}

function getScaledLattice(lattice) {
    return {
        ...lattice,

        cellVectors:
            lattice.cellVectors.map(
                scaleVectorComponents
            ),

        primitiveVectors:
            lattice.primitiveVectors.map(
                scaleVectorComponents
            )
    };
}

function updateLatticeScale() {
    latticeScale.a = parseFloat(aScale.value);
    latticeScale.b = parseFloat(bScale.value);
    latticeScale.c = parseFloat(cScale.value);

    aValue.innerText = latticeScale.a.toFixed(2);
    bValue.innerText = latticeScale.b.toFixed(2);
    cValue.innerText = latticeScale.c.toFixed(2);

    rebuild();
}

aScale.addEventListener('input', updateLatticeScale);
bScale.addEventListener('input', updateLatticeScale);
cScale.addEventListener('input', updateLatticeScale);


function v3(v) {
    return new THREE.Vector3(
        v[0],
        v[1],
        v[2] ?? 0
    );
}


function centerGroup3D(
    group,
    lattice,
    cells
) {
    const a1 = v3(lattice.cellVectors[0]);
    const a2 = v3(lattice.cellVectors[1]);
    const a3 = v3(lattice.cellVectors[2]);

    const center =
        a1.clone()
            .add(a2)
            .add(a3)
            .multiplyScalar(cells / 2);

    group.position.copy(
        center.multiplyScalar(-1)
    );
}

function centerGroup2D(
    group,
    cells
) {
    const shift = cells / 2;

    group.position.set(
        -shift,
        -shift,
        0
    );
}

function resetGroupTransform(
    group
) {
    group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);
    group.scale.set(1, 1, 1);
}

function clearAllGroups() {
    atomGroup.clear();
    cellGroup.clear();
    primitiveGroup.clear();
    bondGroup.clear();
    wignerSeitzGroup.clear();

    reciprocalGroup.clear();
    brillouinZoneGroup.clear();

    resetGroupTransform(atomGroup);
    resetGroupTransform(cellGroup);
    resetGroupTransform(primitiveGroup);
    resetGroupTransform(bondGroup);
    resetGroupTransform(wignerSeitzGroup);

    resetGroupTransform(reciprocalGroup);
    resetGroupTransform(brillouinZoneGroup);
}

//
// Brillouin zone
// = Wigner-Seitz cell in reciprocal space
//
function clipPolygonByHalfPlane(
    polygon,
    n,
    c
) {
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

function render2DBrillouinZone(
    group,
    bVectors
) {
    let polygon = [
        new THREE.Vector3(-10, -10, 0),
        new THREE.Vector3( 10, -10, 0),
        new THREE.Vector3( 10,  10, 0),
        new THREE.Vector3(-10,  10, 0)
    ];

    const [b1, b2] = bVectors;

    for (let h = -1; h <= 1; h++) {
        for (let k = -1; k <= 1; k++) {
            if (h === 0 && k === 0) continue;

            const G =
                b1.clone().multiplyScalar(h)
                    .add(
                        b2.clone().multiplyScalar(k)
                    );

            polygon =
                clipPolygonByHalfPlane(
                    polygon,
                    G,
                    G.lengthSq() / 2
                );
        }
    }

    const shape =
        new THREE.Shape(
            polygon.map(
                p => new THREE.Vector2(p.x, p.y)
            )
        );

    const geometry =
        new THREE.ShapeGeometry(shape);

    const material =
        new THREE.MeshPhongMaterial({
            color: 0xffeeee,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false
        });

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    group.add(mesh);

    const edges =
        new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({
                color: 0xffeeee
            })
        );

    group.add(edges);
}

function renderBrillouinZoneFromWS(
    group,
    lattice
) {
    group.clear();

    const scale = 0.18;

    const bVectors =
        computeReciprocalVectors(lattice)
            .map(v =>
                v.clone().multiplyScalar(scale)
            );

    //
    // 2D Brillouin zone
    //

    if (bVectors.length === 2) {
        render2DBrillouinZone(
            group,
            bVectors
        );

        return;
    }

    //
    // 3D Brillouin zone
    // = Wigner-Seitz cell in reciprocal space
    //

    const reciprocalLattice = {
        cellVectors: bVectors.map(v => [v.x, v.y, v.z]),
        primitiveVectors: bVectors.map(v => [v.x, v.y, v.z]),

        basis: [
            {
                pos: [0, 0, 0],
                color: 0xffeeee,
                type: 'reciprocal'
            }
        ]
    };

    const originPoint = [
        {
            position: new THREE.Vector3(0, 0, 0),
            type: 'reciprocal'
        }
    ];

    renderWignerSeitz(
        group,
        reciprocalLattice,
        originPoint
    );
}
//
// rebuild
//

function rebuild() {
    const cells =
        parseInt(slider.value);

    clearAllGroups();

    let lattice;
    let atoms;

    if (dimension === '3D') {
        lattice =
            lattice = getScaledLattice(LATTICES_3D[currentType]);

        atoms =
            generate3DAtoms(
                lattice,
                cells
            );

        renderAtoms(
            atomGroup,
            atoms,
            sphereGeometry
        );

        centerGroup3D(
            atomGroup,
            lattice,
            cells
        );

        if (showCellMeshes) {
            renderUnitCells(
                cellGroup,
                lattice,
                cells
            );

            centerGroup3D(
                cellGroup,
                lattice,
                cells
            );
        }

        if (showPrimitiveMeshes) {
            renderPrimitiveCells(
                primitiveGroup,
                lattice,
                cells
            );

            centerGroup3D(
                primitiveGroup,
                lattice,
                cells
            );
        }

        if (showNearestBonds) {
            renderNearestBonds(
                bondGroup,
                atoms
            );

            centerGroup3D(
                bondGroup,
                lattice,
                cells
            );
        }

        if (showWignerSeitz) {
            renderWignerSeitz(
                wignerSeitzGroup,
                lattice,
                atoms
            );

            centerGroup3D(
                wignerSeitzGroup,
                lattice,
                cells
            );
        }
    }

    else {
        lattice = getScaledLattice(LATTICES_2D[currentType]);

        atoms =
            generate2DAtoms(
                lattice,
                cells
            );

        renderAtoms(
            atomGroup,
            atoms,
            sphereGeometry
        );

        centerGroup2D(
            atomGroup,
            cells
        );

        if (showCellMeshes) {
            render2DCells(
                cellGroup,
                lattice.cellVectors,
                cells,
                0xffffff
            );

            centerGroup2D(
                cellGroup,
                cells
            );
            if (currentType === 'HONEYCOMB') {
                const a1 =
                    new THREE.Vector3(
                        -lattice.cellVectors[0][0],
                        -lattice.cellVectors[0][1],
                        0
                    );
                
                const a2 =
                    new THREE.Vector3(
                        -lattice.cellVectors[1][0],
                        -lattice.cellVectors[1][1],
                        0
                    );
                
                const shift =
                    a1.clone()
                      .multiplyScalar(1 / 3)
                      .add(
                          a2.clone()
                            .multiplyScalar(1 / 3)
                      );
                  
                cellGroup.position.add(
                    shift
                );
            }       
            
        }

        if (showPrimitiveMeshes) {
            render2DCells(
                primitiveGroup,
                lattice.primitiveVectors,
                cells,
                0x00ff88
            );

            centerGroup2D(
                primitiveGroup,
                cells
            );
            if (currentType === 'HONEYCOMB') {
                const a1 =
                    new THREE.Vector3(
                        -lattice.primitiveVectors[0][0],
                        -lattice.primitiveVectors[0][1],
                        0
                    );
                
                const a2 =
                    new THREE.Vector3(
                        -lattice.primitiveVectors[1][0],
                        -lattice.primitiveVectors[1][1],
                        0
                    );
                
                const shift =
                    a1.clone()
                      .multiplyScalar(1 / 3)
                      .add(
                          a2.clone()
                            .multiplyScalar(1 / 3)
                      );
                  
                wignerSeitzGroup.position.add(
    shift
);
            }       
        }

        if (showNearestBonds) {
            render2DNearestBonds(
                bondGroup,
                atoms
            );

            centerGroup2D(
                bondGroup,
                cells
            );
        }

        if (showWignerSeitz) {
            renderWignerSeitz(
                wignerSeitzGroup,
                lattice,
                atoms
            );

            centerGroup2D(
                wignerSeitzGroup,
                cells
            );

            if (currentType === 'HONEYCOMB') {
                        wignerSeitzGroup.scale.multiplyScalar(4/3);
                    wignerSeitzGroup.rotation.z = Math.PI ;
                    const a1 =
                    new THREE.Vector3(
                        lattice.primitiveVectors[0][0],
                        lattice.primitiveVectors[0][1],
                        0
                    );
                
                    const a2 =
                        new THREE.Vector3(
                            lattice.primitiveVectors[1][0],
                            lattice.primitiveVectors[1][1],
                            0
                        );
                    
                    const shift =
                        a1.clone()
                          .multiplyScalar(1)
                          .add(
                              a2.clone()
                                .multiplyScalar(1)
                          );
                      
                    wignerSeitzGroup.position.add(
                        shift
                    );
            }       
        }
    }

    //
    // reciprocal side
    //

    if (reciprocalMode) {
        renderReciprocalPoints(
            reciprocalGroup,
            lattice,
            cells
        );

        if (showBrillouinZone) {
            renderBrillouinZoneFromWS(
                brillouinZoneGroup,
                lattice
            );
        }
    }

    label.innerText =
`${dimension} ${currentType}

atoms : ${atoms.length} `;


renderLatticePreview(lattice);

}

//
// UI events
//

scButton.addEventListener('click', () => {
    dimension = '3D';
    currentType = 'SC';
    primitiveButton.style.display = 'block';
    WSButton.style.display = 'block';

    bondButton.style.top = '300px';
    reciprocalButton.style.top = '400px'
    brillouinButton.style.top = '450px'

    rebuild();
});

bccButton.addEventListener('click', () => {
    dimension = '3D';
    currentType = 'BCC';
    primitiveButton.style.display = 'block';
    WSButton.style.display = 'block';

    bondButton.style.top = '300px';
    reciprocalButton.style.top = '400px'
    brillouinButton.style.top = '450px'

    rebuild();
});

fccButton.addEventListener('click', () => {
    dimension = '3D';
    currentType = 'FCC';
    primitiveButton.style.display = 'block';
    WSButton.style.display = 'block';

        bondButton.style.top = '300px';
    reciprocalButton.style.top = '400px'
    brillouinButton.style.top = '450px'

    rebuild();
});

diamondButton.addEventListener('click', () => {
    dimension = '3D';
    currentType = 'DIAMOND';
    primitiveButton.style.display = 'block';
    WSButton.style.display = 'block';

    bondButton.style.top = '300px';
    reciprocalButton.style.top = '400px'
    brillouinButton.style.top = '450px'
    
    rebuild();
});



squareButton.addEventListener('click', () => {
    dimension = '2D';
    currentType = 'SQUARE';

    WSButton.style.display = 'none';

    primitiveButton.style.display = 'none';

    bondButton.style.top = '250px';
    reciprocalButton.style.top = '300px'
    brillouinButton.style.top = '350px'

    showPrimitiveMeshes = false;
    primitiveButton.innerText =
        'Primitive Cells OFF';

    rebuild();
});

triangularButton.addEventListener('click', () => {
    dimension = '2D';
    currentType = 'TRIANGULAR';

    WSButton.style.display = 'none';

    primitiveButton.style.display = 'none';

    bondButton.style.top = '250px';
    reciprocalButton.style.top = '300px'
    brillouinButton.style.top = '350px'

    showPrimitiveMeshes = false;
    primitiveButton.innerText =
        'Primitive Cells OFF';

    rebuild();
});

honeycombButton.addEventListener('click', () => {
    dimension = '2D';
    currentType = 'HONEYCOMB';

    WSButton.style.display = 'none';

    primitiveButton.style.display = 'none';

    bondButton.style.top = '250px';
    reciprocalButton.style.top = '300px'
    brillouinButton.style.top = '350px'

    showPrimitiveMeshes = false;
    primitiveButton.innerText =
        'Primitive Cells OFF';

    rebuild();
});

cellButton.addEventListener('click', () => {
    showCellMeshes =
        !showCellMeshes;

    cellButton.innerText =
        showCellMeshes
            ? 'Unit Cells ON'
            : 'Unit Cells OFF';

    rebuild();
});

primitiveButton.addEventListener('click', () => {
    showPrimitiveMeshes =
        !showPrimitiveMeshes;

    primitiveButton.innerText =
        showPrimitiveMeshes
            ? 'Primitive Cells ON'
            : 'Primitive Cells OFF';

    rebuild();
});

bondButton.addEventListener('click', () => {
    showNearestBonds =
        !showNearestBonds;

    bondButton.innerText =
        showNearestBonds
            ? 'Nearest Bonds ON'
            : 'Nearest Bonds OFF';

    rebuild();
});

WSButton.addEventListener('click', () => {
    showWignerSeitz =
        !showWignerSeitz;

    WSButton.innerText =
        showWignerSeitz
            ? 'Wigner-Seitz ON'
            : 'Wigner-Seitz OFF';

    rebuild();
});

reciprocalButton.addEventListener('click', () => {
    reciprocalMode =
        !reciprocalMode;

    reciprocalButton.innerText =
        reciprocalMode
            ? 'Reciprocal Mode ON'
            : 'Reciprocal Mode OFF';

    brillouinButton.style.display =
        reciprocalMode
            ? 'block'
            : 'none';

    if (!reciprocalMode) {
        showBrillouinZone = false;

        brillouinButton.innerText =
            'Brillouin Zone OFF';

        brillouinZoneGroup.clear();
        reciprocalGroup.clear();
    }

    rebuild();
});

brillouinButton.addEventListener('click', () => {
    showBrillouinZone =
        !showBrillouinZone;

    brillouinButton.innerText =
        showBrillouinZone
            ? 'Brillouin Zone ON'
            : 'Brillouin Zone OFF';

    rebuild();
});

resetLatticeButton.addEventListener(
    'click',
    () => {

        aScale.value = 1;
        bScale.value = 1;
        cScale.value = 1;

        updateLatticeScale();
    }
);

slider.addEventListener(
    'input',
    rebuild
);

//
// initial
//

brillouinButton.style.display =
    reciprocalMode
        ? 'block'
        : 'none';

rebuild();

//
// animation
//

function animate() {
    requestAnimationFrame(
        animate
    );

    controls.update();

    renderer.clear();
    renderer.setScissorTest(false);

    //
    // normal mode
    //

    if (!reciprocalMode) {
        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setViewport(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        renderer.render(
            scene,
            camera
        );

        return;
    }

    //
    // reciprocal split mode
    //

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;

    const halfWidth =
        width / 2;

    const size =
        Math.min(
            halfWidth,
            height
        );

    const yOffset =
        (height - size) / 2;

    const leftX =
        (halfWidth - size) / 2;

    const rightX =
        halfWidth +
        (halfWidth - size) / 2;

    camera.aspect = 1;
    camera.updateProjectionMatrix();

    renderer.setScissorTest(true);

    //
    // left: real space
    //

    renderer.setViewport(
        leftX,
        yOffset,
        size,
        size
    );

    renderer.setScissor(
        leftX,
        yOffset,
        size,
        size
    );

    renderer.render(
        scene,
        camera
    );

    renderer.clearDepth();

    //
    // right: reciprocal space
    //

    renderer.setViewport(
        rightX,
        yOffset,
        size,
        size
    );

    renderer.setScissor(
        rightX,
        yOffset,
        size,
        size
    );

    renderer.render(
        reciprocalScene,
        camera
    );

    renderer.setScissorTest(false);


    const previewSize = 180;
    const previewX = window.innerWidth - previewSize - 20;
    const previewY = window.innerHeight - previewSize - 20;
    
    renderer.clearDepth();
    
    renderer.setScissorTest(true);
    
    renderer.setViewport(
        previewX,
        previewY,
        previewSize,
        previewSize
    );
    
    renderer.setScissor(
        previewX,
        previewY,
        previewSize,
        previewSize
    );
    
    renderer.render(
        previewScene,
        previewCamera
    );
    
    renderer.setScissorTest(false);
}

animate();

//
// resize
//

window.addEventListener('resize', () => {
    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});
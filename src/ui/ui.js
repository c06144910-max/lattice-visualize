function createButton(text, left, top = 60) {
    const button = document.createElement('button');

    button.innerText = text;

    button.style.position = 'absolute';
    button.style.top = `${top}px`;
    button.style.left = `${left}px`;

    button.style.padding = '6px 10px';
    button.style.background = '#222';
    button.style.color = 'white';
    button.style.border = '1px solid #555';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'monospace';

    document.body.appendChild(button);

    return button;
}

export function createUI() {
    const slider = document.createElement('input');

    slider.type = 'range';
    slider.min = 1;
    slider.max = 4;
    slider.value = 3;

    slider.style.position = 'absolute';
    slider.style.top = '20px';
    slider.style.left = '20px';
    slider.style.width = '220px';

    document.body.appendChild(slider);

    const scButton = createButton('SC', 20);
    const bccButton = createButton('BCC', 80);
    const fccButton = createButton('FCC', 150);
    const diamondButton = createButton( 'Diamond', 220);


    const squareButton = createButton('Square', 20, 100);
    const triangularButton = createButton('Triangular', 110, 100);
    const honeycombButton = createButton('Honeycomb', 240, 100);

    const cellButton = createButton('Unit Cells OFF', 20, 140);
    const primitiveButton = createButton('Primitive Cells OFF', 170, 140 );
    const bondButton = createButton('Nearest Bonds OFF',340,140 );
    const WSButton = createButton('Wigner-Seitz OFF',510,140 );

    const reciprocalButton =
    createButton(
        'Reciprocal Mode OFF',
        20,
        220
    );
    const brillouinButton =
        createButton(
            'Brillouin Zone OFF',
            20,
            260
        );
    brillouinButton.style.display = 'none';


    
    const label = document.createElement('div');


    label.style.position = 'absolute';
    label.style.top = '190px';
    label.style.left = '20px';
    label.style.color = 'white';
    label.style.fontFamily = 'monospace';
    label.style.whiteSpace = 'pre';

    document.body.appendChild(label);




    const latticeControl = document.createElement('div');

    latticeControl.style.position = 'absolute';
    latticeControl.style.right = '20px';
    latticeControl.style.top = '20px';
    latticeControl.style.color = 'white';
    latticeControl.style.fontFamily = 'monospace';
    latticeControl.style.background = 'rgba(0,0,0,0.5)';
    latticeControl.style.padding = '10px';

    latticeControl.innerHTML = `
    <div>lattice scale</div>

    <label>a</label>
    <input id="aScale" type="range" min="0.5" max="2" step="0.01" value="1">
    <span id="aValue">1.00</span>
    <br>

    <label>b</label>
    <input id="bScale" type="range" min="0.5" max="2" step="0.01" value="1">
    <span id="bValue">1.00</span>
    <br>

    <label>c</label>
    <input id="cScale" type="range" min="0.5" max="2" step="0.01" value="1">
    <span id="cValue">1.00</span>
    `;

    document.body.appendChild(latticeControl);

    const aScale = document.getElementById('aScale');
    const bScale = document.getElementById('bScale');
    const cScale = document.getElementById('cScale');

    const aValue = document.getElementById('aValue');
    const bValue = document.getElementById('bValue');
    const cValue = document.getElementById('cValue');


    const resetLatticeButton =
    document.createElement('button');

    resetLatticeButton.innerText =
        'Reset Lattice';

    resetLatticeButton.style.marginTop =
        '8px';

    resetLatticeButton.style.width =
        '100%';

    latticeControl.appendChild(
        document.createElement('br')
    );

    latticeControl.appendChild(
        resetLatticeButton
    );



    return {
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
    };
}
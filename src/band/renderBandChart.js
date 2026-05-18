export function createBandChart() {
    const canvas = document.createElement('canvas');

    canvas.width = 360;
    canvas.height = 240;

    canvas.style.position = 'absolute';
    canvas.style.right = '20px';
    canvas.style.bottom = '20px';
    canvas.style.background = 'rgba(0,0,0,0.65)';
    canvas.style.border = '1px solid white';
    canvas.style.display = 'none';

    document.body.appendChild(canvas);

    return canvas;
}

export function renderBandChart(canvas, data, title) {
    if (!data) return;

    const series =
        Array.isArray(data)
            ? [data]
            : Object.values(data);

    if (series.length === 0) return;

    const allData =
        series.flat();

    if (allData.length === 0) return;

    const ctx =
        canvas.getContext('2d');

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle =
        'rgba(0,0,0,0.65)';

    ctx.fillRect(0, 0, w, h);

    const margin = {
        left: 45,
        right: 20,
        top: 30,
        bottom: 35
    };

    const plotW =
        w - margin.left - margin.right;

    const plotH =
        h - margin.top - margin.bottom;

    const xMin =
        allData[0].x;

    const xMax =
        allData[allData.length - 1].x;

    const eMin =
        Math.min(
            ...allData.map(d => d.energy)
        );

    const eMax =
        Math.max(
            ...allData.map(d => d.energy)
        );

    function sx(x) {
        return margin.left +
            ((x - xMin) / (xMax - xMin)) * plotW;
    }

    function sy(e) {
        return margin.top +
            (1 - (e - eMin) / (eMax - eMin)) * plotH;
    }

    //
    // axes
    //

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        margin.left,
        margin.top
    );

    ctx.lineTo(
        margin.left,
        margin.top + plotH
    );

    ctx.lineTo(
        margin.left + plotW,
        margin.top + plotH
    );

    ctx.stroke();

    //
    // zero energy line
    //

    if (eMin < 0 && eMax > 0) {
        const y0 = sy(0);

        ctx.strokeStyle =
            'rgba(255,255,255,0.25)';

        ctx.beginPath();

        ctx.moveTo(
            margin.left,
            y0
        );

        ctx.lineTo(
            margin.left + plotW,
            y0
        );

        ctx.stroke();
    }

    //
    // bands
    //

    const colors = [
        '#00ffaa',
        '#ffcc44',
        '#66aaff',
        '#ff66aa'
    ];

    for (let s = 0; s < series.length; s++) {
        const band =
            series[s];

        ctx.strokeStyle =
            colors[s % colors.length];

        ctx.lineWidth = 2;

        ctx.beginPath();

        band.forEach((d, i) => {
            const x = sx(d.x);
            const y = sy(d.energy);

            if (i === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    //
    // title
    //

    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';

    ctx.fillText(
        title,
        margin.left,
        18
    );

    //
    // axis label
    //

    ctx.font = '12px monospace';

    ctx.fillText(
        'E(k)',
        8,
        margin.top+90
    );

    //
    // symmetry labels
    //

    const labelSource =
        series[0];

    for (const d of labelSource) {
        if (!d.label) continue;

        const x = sx(d.x);

        ctx.strokeStyle =
            'rgba(255,255,255,0.35)';

        ctx.beginPath();

        ctx.moveTo(
            x,
            margin.top
        );

        ctx.lineTo(
            x,
            margin.top + plotH
        );

        ctx.stroke();

        ctx.fillStyle = 'white';

        ctx.fillText(
            d.label,
            x - 5,
            h - 12
        );
    }

    //
    // energy values
    //

    ctx.fillStyle = 'white';

    ctx.fillText(
        eMax.toFixed(1),
        8,
        margin.top + 5
    );

    ctx.fillText(
        eMin.toFixed(1),
        8,
        margin.top + plotH
    );
}
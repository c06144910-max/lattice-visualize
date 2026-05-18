export const LATTICES_3D = {
    SC: {
        basis: [
            {
                pos: [0, 0, 0],
                color: 0x44aaff,
                type: 'corner'
            }
        ],
        cellVectors: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ],
        primitiveVectors: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ]
    },

    BCC: {
        basis: [
            {
                pos: [0, 0, 0],
                color: 0x44aaff,
                type: 'corner'
            },
            {
                pos: [0.5, 0.5, 0.5],
                color: 0xff4444,
                type: 'center'
            }
        ],
        cellVectors: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ],
        primitiveVectors: [
            [0.5, 0.5, -0.5],
            [-0.5, 0.5, 0.5],
            [0.5, -0.5, 0.5]
        ]
    },

    FCC: {
        basis: [
            {
                pos: [0, 0, 0],
                color: 0x44aaff,
                type: 'corner'
            },
            {
                pos: [0.5, 0.5, 0],
                color: 0xff4444,
                type: 'face'
            },
            {
                pos: [0.5, 0, 0.5],
                color: 0xff4444,
                type: 'face'
            },
            {
                pos: [0, 0.5, 0.5],
                color: 0xff4444,
                type: 'face'
            }
        ],
        cellVectors: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ],
        primitiveVectors: [
            [0, 0.5, 0.5],
            [0.5, 0, 0.5],
            [0.5, 0.5, 0]
        ]
    },

    DIAMOND: {
        basis: [
            {
                pos: [0, 0, 0],
                color: 0x44aaff,
                type: 'fcc'
            },
            {
                pos: [0.5, 0.5, 0],
                color: 0x44aaff,
                type: 'fcc'
            },
            {
                pos: [0.5, 0, 0.5],
                color: 0x44aaff,
                type: 'fcc'
            },
            {
                pos: [0, 0.5, 0.5],
                color: 0x44aaff,
                type: 'fcc'
            },

            {
                pos: [0.25, 0.25, 0.25],
                color: 0xff4444,
                type: 'diamond'
            },
            {
                pos: [0.75, 0.75, 0.25],
                color: 0xff4444,
                type: 'diamond'
            },
            {
                pos: [0.75, 0.25, 0.75],
                color: 0xff4444,
                type: 'diamond'
            },
            {
                pos: [0.25, 0.75, 0.75],
                color: 0xff4444,
                type: 'diamond'
            }
        ],

        cellVectors: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ],

        primitiveVectors: [
            [0, 0.5, 0.5],
            [0.5, 0, 0.5],
            [0.5, 0.5, 0]
        ]
    }
};
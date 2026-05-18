export const LATTICES_2D = {
    SQUARE: {
        basis: [
            { pos: [0, 0], color: 0x44aaff }
        ],
        cellVectors: [
            [1, 0],
            [0, 1]
        ],
        primitiveVectors: [
            [1, 0],
            [0, 1]
        ],
        nearestVectors: [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ]
    },

    TRIANGULAR: {
        basis: [
            { pos: [0, 0], color: 0x44aaff }
        ],
        cellVectors: [
            [1, 0],
            [0.5, Math.sqrt(3) / 2]
        ],
        primitiveVectors: [
            [1, 0],
            [0.5, Math.sqrt(3) / 2]
        ],
        nearestVectors: [
            [1, 0],
            [-1, 0],
            [0.5, Math.sqrt(3) / 2],
            [-0.5, -Math.sqrt(3) / 2],
            [0.5, -Math.sqrt(3) / 2],
            [-0.5, Math.sqrt(3) / 2]
        ]
    },

    HONEYCOMB: {
        basis: [
            { pos: [0, 0], color: 0x44aaff },
            { pos: [0.5, Math.sqrt(3) / 6], color: 0xff4444 }
        ],
        cellVectors: [
            [1, 0],
            [0.5, Math.sqrt(3) / 2]
        ],
        primitiveVectors: [
            [1, 0],
            [0.5, Math.sqrt(3) / 2]
        ],
        nearestVectors: [
            [0.5, Math.sqrt(3) / 6],
            [-0.5, Math.sqrt(3) / 6],
            [0, -Math.sqrt(3) / 3]
        ]
    }
};
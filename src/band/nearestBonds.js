export function getNearestBondPairs(
    atoms,
    eps = 1e-3
) {
    if (atoms.length < 2) {
        return [];
    }

    let minDistance = Infinity;

    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const d =
                atoms[i].position.distanceTo(
                    atoms[j].position
                );

            if (d > 1e-6 && d < minDistance) {
                minDistance = d;
            }
        }
    }

    const pairs = [];

    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const d =
                atoms[i].position.distanceTo(
                    atoms[j].position
                );

            if (
                Math.abs(d - minDistance) < eps
            ) {
                pairs.push({
                    a: atoms[i],
                    b: atoms[j],
                    delta:
                        atoms[j].position
                            .clone()
                            .sub(atoms[i].position)
                });
            }
        }
    }

    return pairs;
}
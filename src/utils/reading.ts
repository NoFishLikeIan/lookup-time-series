
export const first = <N>(it: Iterable<N>): N | undefined => {
    for (const element of it) {
        return element
    }
}
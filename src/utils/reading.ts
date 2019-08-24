export const first = <N extends any>(it: Iterable<N>): N | undefined => {
    for (const element of it) {
        return element
    }
}

export const isFilled = <V>(xs: IterableIterator<undefined | V>): xs is IterableIterator<V> => true // FIXME: this for now is true
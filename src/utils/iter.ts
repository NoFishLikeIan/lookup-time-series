export function* repeatFlat<T>(x: Iterable<T>, n = Infinity) {
    while (n-- > 0) {
        for (const elem of x) {
            yield elem
        }
    }
}
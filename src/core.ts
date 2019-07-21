export const identity = <T>(i: T): T => i;

export function reduce<T, A>(
  fn: (acc: A, value: T, index: number, series?: T[]) => A,
  init: A,
  iterator: IterableIterator<T> | T[]
): A {
  if (fn.length === 3 || Array.isArray(iterator)) {
    return [...iterator].reduce(fn, init);
  } else {
    let acc = init;
    let iteration = 0;
    let it = iterator.next();
    do {
      const value = it.value;
      acc = fn(acc, value, iteration);
      iteration++;
      it = iterator.next(value);
    } while (!it.done);

    return acc;
  }
}

export const isTruthy = (q: any) => !!q;

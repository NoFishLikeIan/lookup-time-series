import { cosineColor, rgbaCss, ReadonlyColor, cosineCoeffs, CosGradientSpec, GRADIENTS } from "@thi.ng/color"
import { fit } from "@thi.ng/math"
import { range, map, min, max, mapIndexed, repeat, flatten } from "@thi.ng/transducers";
import { repeatFlat } from "./iter";

type ColorScalingFn = (min: number, max: number) => (y: number) => string

export function fitToColor(spec: CosGradientSpec): ColorScalingFn
export function fitToColor(spec: ReadonlyColor, to: ReadonlyColor): ColorScalingFn
export function fitToColor(spec?: any, to?: any): ColorScalingFn {
    return (min: number, max: number) =>
        (y: number) =>
            spec
                ? to
                    ? rgbaCss(cosineColor(cosineCoeffs(spec, to), fit(y, min, max, 0, 1)))
                    : rgbaCss(cosineColor(spec, fit(y, min, max, 0, 1)))

                : fitToColor(GRADIENTS['cyan-magenta'])(min, max)(y)
}

export const genGradient = (corrValues: number[], grad: CosGradientSpec, overPeriod?: number) => {

    const recurringFactor = overPeriod || 1

    const [l, u] = [min(corrValues), max(corrValues)]
    const correlationsOverPeriod = [...repeatFlat(corrValues, recurringFactor)]
    const n = correlationsOverPeriod.length

    return [...mapIndexed((index, value): [number, string] => {
        const t = fit(value, l, u, 0, 1)
        return [index / n, rgbaCss(cosineColor(grad, t))]
    }, correlationsOverPeriod)]
}

export function mapBarHeightFactory(opt: 'abs' | 'minmax', chartH: number) {

    if (opt === 'abs') {
        return (y: number) => fit(y, -1, 1, chartH / 2, -chartH / 2)
    } else {
        return (y: number, min: number, max: number) => fit(y, min, max, 0, -chartH / 2)
    }
}
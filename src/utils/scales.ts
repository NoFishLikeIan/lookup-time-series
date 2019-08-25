import { cosineColor, rgbaCss, ReadonlyColor, cosineCoeffs, CosGradientSpec, GRADIENTS } from "@thi.ng/color"
import { fit } from "@thi.ng/math"

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
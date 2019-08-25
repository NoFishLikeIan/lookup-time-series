import { AIC_BAR_H, MARGIN_X } from "../constants/data-const"

import { mapIndexed } from "@thi.ng/transducers"

interface AutocorrGraphProps {
    iter: Iterable<[number, number]>
    label: (index: number) => number

    min: number,
    max: number,
    chartW: number,
    gradients: [number, string][],
    base: number,
    barWidth: number,

    mapColor: (y: number) => string,
    mapXBar: (y: number) => number,
    mapBarHeight: (y: number, min: number, max: number) => number,
}

export const autocorrelationGraph = ({
    min,
    max,
    gradients,
    base,
    barWidth,
    mapColor,
    mapXBar,
    mapBarHeight,
    label,
    iter,
    chartW
}: AutocorrGraphProps) => {
    const from: [number, number] = [MARGIN_X, base]
    const to: [number, number] = [chartW - MARGIN_X - barWidth, base]

    return [
        ["defs", {}, ['linearGradient', { id: 'aic', from, to }, gradients],],
        ["rect", { fill: '$aic' }, from, to[0] - from[0], AIC_BAR_H],
        ...mapIndexed(
            (index, [corr, order]) => {
                const fill = mapColor(order)
                const x = mapXBar(index)
                const barHeight = mapBarHeight(corr, min, max)
                const pos = Math.sign(-barHeight)
                const barOffset = pos < 0 ? 1 : 0

                return ([
                    // Autocorrelation graph
                    ['g', {},
                        ['rect', { fill }, [x, base + barOffset * AIC_BAR_H], barWidth, barHeight],
                        ["text", { fill: 'black', fontSize: 7 }, [x - barWidth / 2, base + (pos * (AIC_BAR_H + 20))], `-${label(index)}`]
                    ],
                ])
            },
            iter
        )]
}
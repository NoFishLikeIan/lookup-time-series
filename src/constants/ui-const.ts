import { DropDownOption } from '@thi.ng/hdom-components'
import { map, range } from '@thi.ng/transducers'
import { ema, hma, sma, wma } from '@thi.ng/transducers-stats';

type OPT = [string, DropDownOption[]]

export const AUTOCORR_SCALES_OPT: OPT = ['Scale AIC bars between',
    [
        ['abs', '0 and 1'],
        ['minmax', 'min and max']
    ]
]

export const LAGS: OPT = ['Lag periods',
    [...map((i: number): [string, string] => [String(i), String(i)], range(10, 51, 10))]
]

export const MA_PERIODS: OPT = ['Moving average periods',
    [...map((i: number): [string, string] => [String(i), String(i)], range(10, 101, 10))]
]

export const MA_MODES = {
    default: { fn: <T>(_: any, v: T): T => v, label: 'Pure' },
    ema: { fn: ema, label: 'Exponential' },
    hma: { fn: hma, label: 'Hull' },
    sma: { fn: sma, label: 'Simple' },
    wma: { fn: wma, label: 'Weighted' }
} as const

export type Modes = keyof typeof MA_MODES
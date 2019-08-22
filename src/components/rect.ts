import { rect as txrect } from '@thi.ng/hiccup-svg'

type TXRect = typeof txrect
type RectProps = Parameters<typeof txrect>
type Rect = (...a: RectProps) => ReturnType<TXRect>

/**
 * Forwards props to tx.rect but adjusts for negative height.
 * It requires correctly scaled values
 * 
 * @param rectProps 
 */
export const rect: Rect = (...args) => {
    const [initPosition, width, height, ...rest] = args
    if (height >= 0) return txrect(...args)

    const x = initPosition[0]
    const y = initPosition[1]

    const absHeight = Math.abs(height)
    const yPrime = y - absHeight

    return txrect([x, yPrime], width, absHeight, ...rest)
}
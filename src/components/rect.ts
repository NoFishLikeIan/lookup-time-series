import { rect as txrect } from "@thi.ng/hiccup-svg";

// rect([mapX(index), center], 20, mapHeight(corr)

type TXRect = typeof txrect;
type RectProps = Parameters<typeof txrect>;
type Rect = (...a: RectProps) => ReturnType<TXRect>;

export const rect: Rect = (...args) => {
  const [initPosition, width, height, ...rest] = args;
  if (height >= 0) return txrect(...args);

  const x = initPosition[0];
  const y = initPosition[1];

  const absHeight = Math.abs(height);
  const yPrime = y - absHeight;

  return txrect([x, yPrime], width, absHeight, ...rest);
};

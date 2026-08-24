// Формат points на бэкенде: "x1,y1 x2,y2 x3,y3 ..." в пикселях
// исходного (originalWidth×originalHeight) изображения плана.
export type Point = [number, number];

export function parsePoints(raw: string): Point[] {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return [x, y] as Point;
    });
}

export function formatPoints(points: Point[]): string {
  return points.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(" ");
}

export function toSvgPoints(raw: string): string {
  return parsePoints(raw)
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

export function centroid(points: Point[]): Point {
  const n = points.length || 1;
  const sum = points.reduce<Point>(
    (acc, [x, y]) => [acc[0] + x, acc[1] + y],
    [0, 0],
  );
  return [sum[0] / n, sum[1] / n];
}

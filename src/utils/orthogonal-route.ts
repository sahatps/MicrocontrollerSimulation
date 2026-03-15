export interface Point {
  x: number;
  y: number;
}

export interface OrthogonalRouteOptions {
  /** If true, the first segment is horizontal. If false, vertical. Default: true */
  startHorizontal?: boolean;
  /** Corner radius in px for rounded elbows. 0 = sharp. Default: 0 */
  cornerRadius?: number;
}

export interface OrthogonalRouteResult {
  /** Waypoints: start, bend(s), end */
  points: Point[];
  /** SVG path "d" attribute */
  svgPath: string;
}

/**
 * Computes an orthogonal (Manhattan-style) route between two points
 * using only horizontal and vertical segments.
 *
 * @example
 * const result = orthogonalRoute(50, 50, 350, 250, {
 *   startHorizontal: true,
 *   cornerRadius: 12
 * });
 * // result.svgPath → "M 50 50 L 338 50 Q 350 50 350 62 L 350 250"
 * // result.points  → [{x:50,y:50}, {x:350,y:50}, {x:350,y:250}]
 *
 * // Render in SVG:
 * // <svg><path d={result.svgPath} fill="none" stroke="#129CE4" stroke-width="2"/></svg>
 */
export function orthogonalRoute(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: OrthogonalRouteOptions = {}
): OrthogonalRouteResult {
  const { startHorizontal = true, cornerRadius = 0 } = options;

  // Same point
  if (x1 === x2 && y1 === y2) {
    return { points: [{ x: x1, y: y1 }], svgPath: `M ${x1} ${y1}` };
  }

  // Straight horizontal
  if (y1 === y2) {
    return {
      points: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
      svgPath: `M ${x1} ${y1} L ${x2} ${y2}`
    };
  }

  // Straight vertical
  if (x1 === x2) {
    return {
      points: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
      svgPath: `M ${x1} ${y1} L ${x2} ${y2}`
    };
  }

  // L-shaped route with one bend
  const bend: Point = startHorizontal
    ? { x: x2, y: y1 }
    : { x: x1, y: y2 };

  const points: Point[] = [{ x: x1, y: y1 }, bend, { x: x2, y: y2 }];

  const seg1Len = startHorizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
  const seg2Len = startHorizontal ? Math.abs(y2 - y1) : Math.abs(x2 - x1);
  const r = Math.min(cornerRadius, seg1Len / 2, seg2Len / 2);

  // Sharp corner
  if (r <= 0) {
    return {
      points,
      svgPath: `M ${x1} ${y1} L ${bend.x} ${bend.y} L ${x2} ${y2}`
    };
  }

  // Rounded corner via quadratic Bezier
  const sx = Math.sign(x2 - x1);
  const sy = Math.sign(y2 - y1);

  let arcStart: Point;
  let arcEnd: Point;

  if (startHorizontal) {
    arcStart = { x: bend.x - sx * r, y: bend.y };
    arcEnd = { x: bend.x, y: bend.y + sy * r };
  } else {
    arcStart = { x: bend.x, y: bend.y - sy * r };
    arcEnd = { x: bend.x + sx * r, y: bend.y };
  }

  const svgPath = [
    `M ${x1} ${y1}`,
    `L ${arcStart.x} ${arcStart.y}`,
    `Q ${bend.x} ${bend.y} ${arcEnd.x} ${arcEnd.y}`,
    `L ${x2} ${y2}`
  ].join(" ");

  return { points, svgPath };
}

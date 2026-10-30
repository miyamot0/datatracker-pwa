const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const PNG_SCALE = 2;
const EXPORT_BACKGROUND = '#ffffff';

/** Computed style properties copied from each live node onto its serialized clone */
const INLINED_STYLE_PROPERTIES = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'dominant-baseline',
];

export type ChartImageFormat = 'svg' | 'png';

export type ChartSvg = {
  svg: string;
  width: number;
  height: number;
};

/**
 * Copies computed styles from live elements onto their structural clones.
 * Tailwind classes and inherited CSS do not survive serialization, so each node gets explicit values.
 */
function inlineComputedStyles(live: Element, clone: Element) {
  const liveNodes = [live, ...Array.from(live.querySelectorAll('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))];

  liveNodes.forEach((node, index) => {
    const computed = getComputedStyle(node);
    const target = cloneNodes[index] as SVGElement;
    INLINED_STYLE_PROPERTIES.forEach((property) => {
      target.style.setProperty(property, computed.getPropertyValue(property));
    });
  });
}

/**
 * Removes the keyboard-focus hooks Recharts adds to its groups (`tabindex`, `role`) so they don't persist in the export.
 */
function stripFocusAttributes(svg: Element) {
  [svg, ...Array.from(svg.querySelectorAll('[tabindex], [role]'))].forEach((node) => {
    node.removeAttribute('tabindex');
    node.removeAttribute('role');
  });
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NAMESPACE, tag);
}

function offsetRect(element: Element, origin: DOMRect) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
}

/**
 * Builds a standalone SVG from a rendered chart container.
 *
 * The chart's `<svg>` and the HTML legend are both positioned using their live on-screen offsets, so the
 * exported layout matches the figure as displayed. Legend icons are cloned SVGs; legend labels become `<text>`.
 */
export function buildChartSvg(root: HTMLElement): ChartSvg | null {
  const chartSurface = root.querySelector<SVGSVGElement>('svg.recharts-surface');
  if (!chartSurface) return null;

  const rootRect = root.getBoundingClientRect();
  const width = Math.round(rootRect.width);
  const height = Math.round(rootRect.height);

  const output = createSvgElement('svg');
  output.setAttribute('xmlns', SVG_NAMESPACE);
  output.setAttribute('width', String(width));
  output.setAttribute('height', String(height));
  output.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const rootStyle = getComputedStyle(root);
  output.style.setProperty('font-family', rootStyle.fontFamily);
  output.style.setProperty('font-size', rootStyle.fontSize);
  output.style.setProperty('color', rootStyle.color);

  const background = createSvgElement('rect');
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', EXPORT_BACKGROUND);
  output.appendChild(background);

  const chartClone = chartSurface.cloneNode(true) as SVGSVGElement;
  inlineComputedStyles(chartSurface, chartClone);
  stripFocusAttributes(chartClone);
  const chartBox = offsetRect(chartSurface, rootRect);
  chartClone.setAttribute('x', String(chartBox.x));
  chartClone.setAttribute('y', String(chartBox.y));
  chartClone.setAttribute('width', String(chartBox.width));
  chartClone.setAttribute('height', String(chartBox.height));
  output.appendChild(chartClone);

  root.querySelectorAll<HTMLElement>('.recharts-legend-item').forEach((item) => {
    const icon = item.querySelector<SVGSVGElement>(':scope > svg');
    if (icon) {
      const iconClone = icon.cloneNode(true) as SVGSVGElement;
      inlineComputedStyles(icon, iconClone);
      const iconBox = offsetRect(icon, rootRect);
      iconClone.setAttribute('x', String(iconBox.x));
      iconClone.setAttribute('y', String(iconBox.y));
      iconClone.setAttribute('width', String(iconBox.width));
      iconClone.setAttribute('height', String(iconBox.height));
      output.appendChild(iconClone);
    }

    const label = item.querySelector<HTMLElement>('.recharts-legend-item-text');
    if (label) {
      const labelBox = offsetRect(label, rootRect);
      const labelStyle = getComputedStyle(label);
      const text = createSvgElement('text');
      text.setAttribute('x', String(labelBox.x));
      text.setAttribute('y', String(labelBox.y + labelBox.height / 2));
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', labelStyle.color);
      text.setAttribute('font-family', labelStyle.fontFamily);
      text.setAttribute('font-size', labelStyle.fontSize);
      text.setAttribute('font-weight', labelStyle.fontWeight);
      text.textContent = label.textContent;
      output.appendChild(text);
    }
  });

  return {
    svg: new XMLSerializer().serializeToString(output),
    width,
    height,
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to rasterize chart SVG'));
    image.src = url;
  });
}

/** Rasterizes a serialized chart SVG to a PNG data URL at a fixed scale */
export async function svgToPngDataUrl(chart: ChartSvg, scale = PNG_SCALE): Promise<string> {
  const blob = new Blob([chart.svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = chart.width * scale;
    canvas.height = chart.height * scale;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable');

    context.fillStyle = EXPORT_BACKGROUND;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

/**
 * Exports a rendered chart as SVG or PNG. SVG is built first; PNG is rasterized from that same SVG string.
 */
export async function saveChartImage(root: HTMLElement | null, format: ChartImageFormat, filename: string) {
  if (!root) return;

  const chart = buildChartSvg(root);
  if (!chart) return;

  if (format === 'svg') {
    const url = URL.createObjectURL(new Blob([chart.svg], { type: 'image/svg+xml;charset=utf-8' }));
    triggerDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }

  triggerDownload(await svgToPngDataUrl(chart), filename);
}

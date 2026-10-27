import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildChartSvg, saveChartImage, svgToPngDataUrl } from '../chart-export';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createChartRoot() {
  const root = document.createElement('div');
  root.style.width = '300px';
  root.style.height = '200px';
  root.style.position = 'relative';
  root.innerHTML = `
    <svg class="recharts-surface" width="300" height="160" viewBox="0 0 300 160">
      <circle cx="20" cy="20" r="5" fill="#ff0000" />
    </svg>
    <ul class="recharts-default-legend" style="position: absolute; top: 170px; left: 0; margin: 0; padding: 0; list-style: none;">
      <li class="recharts-legend-item" style="display: inline-block;">
        <svg width="14" height="14" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="#00ff00" /></svg>
        <span class="recharts-legend-item-text">A &amp; B</span>
      </li>
    </ul>`;
  document.body.appendChild(root);
  return root;
}

function parseSvg(svg: string) {
  return new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
}

describe('buildChartSvg', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = createChartRoot();
  });

  afterEach(() => {
    root.remove();
    vi.restoreAllMocks();
  });

  it('returns null when the container has no chart surface', () => {
    const empty = document.createElement('div');
    expect(buildChartSvg(empty)).toBeNull();
  });

  it('produces a standalone svg sized to the container with a white background', () => {
    const result = buildChartSvg(root);

    expect(result).not.toBeNull();
    expect(result!.width).toBe(300);
    expect(result!.height).toBe(200);

    const doc = parseSvg(result!.svg);
    expect(doc.namespaceURI).toBe(SVG_NS);
    expect(doc.getAttribute('width')).toBe('300');
    expect(doc.getAttribute('height')).toBe('200');
    expect(doc.getAttribute('viewBox')).toBe('0 0 300 200');

    const background = doc.querySelector('rect');
    expect(background?.getAttribute('fill')).toBe('#ffffff');
  });

  it('includes the chart markup with inlined styles', () => {
    const doc = parseSvg(buildChartSvg(root)!.svg);

    const circles = doc.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);
    expect(circles[0].getAttribute('style')).toContain('fill');
  });

  it('renders legend labels as escaped text nodes', () => {
    const doc = parseSvg(buildChartSvg(root)!.svg);

    const label = Array.from(doc.querySelectorAll('text')).find((node) => node.textContent === 'A & B');
    expect(label).toBeDefined();
    expect(label!.getAttribute('dominant-baseline')).toBe('central');
  });

  it('includes legend icons as nested svg elements', () => {
    const doc = parseSvg(buildChartSvg(root)!.svg);

    const nested = Array.from(doc.querySelectorAll('svg')).filter((node) => node !== doc);
    expect(nested.length).toBe(2);
  });
});

describe('svgToPngDataUrl', () => {
  it('rasterizes the svg to a png at the requested scale', async () => {
    const root = createChartRoot();
    const chart = buildChartSvg(root)!;
    root.remove();

    const dataUrl = await svgToPngDataUrl(chart, 2);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);

    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    expect(image.naturalWidth).toBe(600);
    expect(image.naturalHeight).toBe(400);
  });
});

describe('saveChartImage', () => {
  let root: HTMLElement;
  let downloads: { href: string; download: string }[];

  beforeEach(() => {
    root = createChartRoot();
    downloads = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push({ href: this.href, download: this.download });
    });
  });

  afterEach(() => {
    root.remove();
    vi.restoreAllMocks();
  });

  it('downloads an svg file built from the chart', async () => {
    await saveChartImage(root, 'svg', 'figure.svg');

    expect(downloads).toHaveLength(1);
    expect(downloads[0].download).toBe('figure.svg');
    expect(downloads[0].href.startsWith('blob:')).toBe(true);

    const text = await (await fetch(downloads[0].href)).text();
    expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('downloads a png file rasterized from the same chart', async () => {
    await saveChartImage(root, 'png', 'figure.png');

    expect(downloads).toHaveLength(1);
    expect(downloads[0].download).toBe('figure.png');
    expect(downloads[0].href.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('does nothing when the container is missing', async () => {
    await saveChartImage(null, 'svg', 'figure.svg');

    expect(downloads).toHaveLength(0);
  });
});

import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { environment } from '../../../../environments/environment';
import { HEATMAP_THEME, THEMES_EMERGED } from '../../../constants/urlConstants';
import { DEFAULT_THEME_COLORS, HEATMAP_TEXT } from '../../../constants/heatmapConstants';
import * as d3 from 'd3';
import { ActiveElement, Chart, ChartConfiguration, ChartEvent, registerables, ScriptableContext } from 'chart.js';
import { TreemapController, TreemapDataPoint, TreemapElement } from 'chartjs-chart-treemap';

Chart.register(...registerables, TreemapController, TreemapElement);

export interface HeatmapTheme {
  id: string;
  label: string;
  value: number;
  color: string;
  backgroundColor: string;
  activeBackgroundColor: string;
  icon?: string;
  list?: [];
}

export interface VoiceQuote {
  id: string;
  description: string;
  voice_by: string;
  themeId: string;
  color: string;
  backgroundColor?: string;
  activeBackgroundColor?: string;
  state: string;
}

@Component({
  selector: 'app-heat-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heat-map.component.html',
  styleUrl: './heat-map.component.scss',
  animations: [
    trigger('voicesAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('10ms', [
            animate('100ms ease-out', style({ opacity: 1 }))
          ])
        ], { optional: true }),
        query(':leave', [
          animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
        ], { optional: true })
      ])
    ])
  ]
})
export class HeatMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('treemapCanvas')
  set treemapCanvas(canvas: ElementRef<HTMLCanvasElement> | undefined) {
    this.treemapCanvasRef = canvas;
    this.renderTreemap();
  }

  themes: HeatmapTheme[] = [];
  heatmapThemes:any
  heatmapThemeConfig: Record<string, any> = {}
  heatmapData: Record<string, any> = {}
  private treemapCanvasRef?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart<'treemap', TreemapDataPoint[], unknown>;
  private isViewReady = false;
  private readonly treemapIconImages = new Map<string, HTMLImageElement>();
  private readonly themeContentPlugin = {
    id: 'heatmapThemeContent',
    afterDatasetsDraw: (chart: Chart<'treemap', TreemapDataPoint[], unknown>) => {
      this.drawTreemapContent(chart);
    },
  };

  readonly text = HEATMAP_TEXT;
  activeThemeId: string | null = null;
  displayedVoices: VoiceQuote[] = [];
  hoveredThemeTooltip: { label: string; voicesText: string; left: number; top: number } | null = null;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}


  ngOnInit(): void {
    this.getThemeData()
  }

  ngAfterViewInit(): void {
    this.isViewReady = true;
    this.renderTreemap();
  }

  getThemeData() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${HEATMAP_THEME}`)
      .then((heatmapData: any) => {
        this.heatmapData = heatmapData;
        return d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${THEMES_EMERGED}`);
      })
      .then((data: any) => {
        const sortedThemes = [...(data?.data ?? [])].sort(
          (a: any, b: any) => Number(b.value) - Number(a.value)
        );

        this.themes = sortedThemes.map((item: any, index: number) => {
          const id = String(item.id ?? '').split(' ')[0];
          const icon = this.heatmapData[id]?.icon ?? '';
          const heatmapById = this.heatmapData[id] ?? {};
          const colors = this.getThemeColors(heatmapById, index);
          const colorClass = heatmapById.color ?? `theme${(index % DEFAULT_THEME_COLORS.length) + 1}`;

          return {
            id,
            label: item.label,
            value: Number(item.value),
            list: (item.list ?? []).map((listItem: any) => ({
              ...listItem,
              color: colorClass,
              backgroundColor: colors.background,
              activeBackgroundColor: colors.active,
            })),
            color: colorClass,
            backgroundColor: colors.background,
            activeBackgroundColor: colors.active,
            icon
          };
        });

        this.heatmapThemeConfig = this.heatmapData;

        if (this.themes.length > 0) {
          this.setActiveTheme(this.themes[0].id, false);
        }

        this.renderTreemap();
      })
      .catch((error: any) => {
        console.error('Error loading page data:', error);
      });
  }

  setActiveTheme(themeId: string, refreshChart = true): void {
    this.activeThemeId = themeId;
    const activeTheme = this.themes.find(t => t.id === themeId);
    this.displayedVoices = (activeTheme?.list ?? []).slice(0, 4);

    if (refreshChart) {
      this.chart?.update('none');
    }
  }

  getThemeBackground(theme: HeatmapTheme | VoiceQuote): string {
    return this.activeThemeId === theme.id
      ? theme.activeBackgroundColor || theme.backgroundColor || '#bdbdbd'
      : theme.backgroundColor || '#bdbdbd';
  }

  private getThemeColors(config: any, index: number): { background: string; active: string } {
    const rankColors = DEFAULT_THEME_COLORS[index % DEFAULT_THEME_COLORS.length];

    const background = this.getColorValue(config?.backgroundColor)
      ?? this.getColorValue(config?.inactiveColor)
      ?? rankColors.background;

    const active = this.getColorValue(config?.activeColor)
      ?? rankColors.active;

    return { background, active };
  }

  private getColorValue(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const color = value.trim();
    if (/^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(color)) {
      return color;
    }

    return null;
  }

  private readonly handleTreemapPointerLeave = (): void => {
    if (!this.hoveredThemeTooltip) return;
    this.hoveredThemeTooltip = null;
    this.changeDetectorRef.detectChanges();
  };

  private renderTreemap(): void {
    if (!this.isViewReady || !this.treemapCanvasRef || !this.themes.length) return;

    this.chart?.destroy();
    this.treemapCanvasRef.nativeElement.removeEventListener('pointerleave', this.handleTreemapPointerLeave);

    const config: ChartConfiguration<'treemap', TreemapDataPoint[], unknown> = {
      type: 'treemap',
      data: {
        datasets: [{
          label: this.text.themesTitle,
          data: [],
          tree: this.themes.map(theme => ({
            id: theme.id,
            label: theme.label,
            value: Math.max(theme.value, 1),
            displayValue: theme.value,
            backgroundColor: theme.backgroundColor,
            activeBackgroundColor: theme.activeBackgroundColor,
            icon: theme.icon,
          })),
          key: 'value',
          spacing: 2,
          borderRadius: 6,
          borderWidth: 0,
          backgroundColor: context => this.getTreemapTileColor(context),
          hoverBackgroundColor: context => this.getTreemapActiveColor(context),
          labels: {
            display: false,
          },
        }],
      },
      plugins: [this.themeContentPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
          this.activateThemeFromElement(elements[0]);
        },
        onHover: (event: ChartEvent, elements: ActiveElement[]) => {
          const target = event.native?.target as HTMLElement | undefined;
          if (target) {
            target.style.cursor = elements.length ? 'pointer' : 'default';
          }
          this.handleTreemapHover(elements[0]);
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
      },
    };

    this.chart = new Chart(this.treemapCanvasRef.nativeElement, config);
    this.treemapCanvasRef.nativeElement.addEventListener('pointerleave', this.handleTreemapPointerLeave);
  }

  private activateThemeFromElement(element?: ActiveElement): void {
    const theme = this.getThemeFromChartElement(element);
    if (!theme || theme.id === this.activeThemeId) return;
    this.setActiveTheme(theme.id);
  }

  private handleTreemapHover(element?: ActiveElement): void {
    const theme = this.getThemeFromChartElement(element);
    if (!theme || !this.chart) {
      this.hoveredThemeTooltip = null;
      this.changeDetectorRef.detectChanges();
      return;
    }

    if (theme.id !== this.activeThemeId) {
      this.setActiveTheme(theme.id);
    }

    const chartElement = this.chart.getDatasetMeta(element!.datasetIndex).data[element!.index];
    const rect = chartElement.getProps(['x', 'y', 'width', 'height'], true) as Record<string, number>;
    const tooltipWidth = 220;
    const tooltipHeight = 48;

    this.hoveredThemeTooltip = {
      label: theme.label,
      voicesText: `${theme.value} ${this.text.voicesRaisedSuffix}`,
      left: Math.max(8, Math.min(rect['x'] + rect['width'] - tooltipWidth, this.chart.width - tooltipWidth - 8)),
      top: Math.max(8, Math.min(rect['y'] + rect['height'] - tooltipHeight, this.chart.height - tooltipHeight - 8)),
    };
    this.changeDetectorRef.detectChanges();
  }

  private getThemeFromChartElement(element?: ActiveElement): HeatmapTheme | undefined {
    if (!element || !this.chart) return undefined;

    const dataPoint = this.chart.data.datasets[element.datasetIndex]?.data?.[element.index];
    const raw = this.getTreemapRawData(dataPoint);
    return this.themes.find(theme => theme.id === raw['id']);
  }

  private getTreemapRawData(raw: TreemapDataPoint | unknown): Record<string, any> {
    const dataPoint = raw as TreemapDataPoint | undefined;
    return (dataPoint?._data as Record<string, any> | undefined) ?? (raw as Record<string, any>) ?? {};
  }

  private drawTreemapContent(chart: Chart<'treemap', TreemapDataPoint[], unknown>): void {
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];
    if (!dataset) return;

    const ctx = chart.ctx;
    meta.data.forEach((element, index) => {
      const data = this.getTreemapRawData(dataset.data[index]);
      const rect = element.getProps(['x', 'y', 'width', 'height'], true) as Record<string, number>;
      if (rect['width'] < 16 || rect['height'] < 16) return;

      const shouldDrawText = this.shouldDrawTreemapText(ctx, data, rect);
      if (shouldDrawText) {
        this.drawTreemapIcon(ctx, data, rect, false);
        this.drawTreemapText(ctx, data, rect);
        return;
      }

      const drewCompactLabel = this.drawTreemapCompactLabel(ctx, data, rect);
      this.drawTreemapIcon(ctx, data, rect, !drewCompactLabel);
    });
  }

  private drawTreemapCompactLabel(
    ctx: CanvasRenderingContext2D,
    data: Record<string, any>,
    rect: Record<string, number>
  ): boolean {
    const label = String(data['label'] ?? '').trim();
    if (!label || rect['width'] < 44 || rect['height'] < 28) return false;

    const fontSize = rect['width'] * rect['height'] > 12000 ? 12 : rect['width'] < 70 ? 9 : 10;
    const padding = 6;
    const lineHeight = fontSize + 3;
    const iconLayout = this.getTreemapIconLayout(data, rect);
    const iconBottom = iconLayout ? iconLayout.y + iconLayout.size + 4 : rect['y'] + padding;
    const stackRoom = rect['y'] + rect['height'] - padding - iconBottom;

    let textX: number;
    let textY: number;
    let maxWidth: number;

    if (stackRoom >= lineHeight) {
      textX = rect['x'] + padding;
      textY = iconBottom;
      maxWidth = rect['width'] - padding * 2;
    } else if (iconLayout) {
      textX = iconLayout.x + iconLayout.size + 6;
      textY = iconLayout.y + (iconLayout.size - fontSize) / 2;
      maxWidth = rect['x'] + rect['width'] - padding - textX;
    } else {
      textX = rect['x'] + padding;
      textY = rect['y'] + (rect['height'] - fontSize) / 2;
      maxWidth = rect['width'] - padding * 2;
    }

    if (maxWidth < 18) return false;

    ctx.save();
    ctx.font = `700 ${fontSize}px "Source Sans 3", Arial, sans-serif`;
    const text = this.ellipsizeCanvasText(ctx, label, maxWidth);
    if (text.replace(/\./g, '').trim().length < 2) {
      ctx.restore();
      return false;
    }

    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = data['id'] === this.activeThemeId ? 1 : 0.96;
    ctx.fillText(text, textX, textY);
    ctx.restore();
    return true;
  }

  private drawTreemapIcon(
    ctx: CanvasRenderingContext2D,
    data: Record<string, any>,
    rect: Record<string, number>,
    iconOnly = false
  ): void {
    const icon = data['icon'];
    const iconLayout = this.getTreemapIconLayout(data, rect, iconOnly);
    if (typeof icon !== 'string' || !icon || !iconLayout) return;

    const image = this.getTreemapIconImage(icon);
    if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) return;

    const scale = iconLayout.size / Math.max(image.naturalWidth, image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = iconLayout.x + (iconLayout.size - drawWidth) / 2;
    const drawY = iconLayout.y + (iconLayout.size - drawHeight) / 2;

    ctx.save();
    ctx.globalAlpha = data['id'] === this.activeThemeId ? 1 : 0.95;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  }

  private drawTreemapText(ctx: CanvasRenderingContext2D, data: Record<string, any>, rect: Record<string, number>): void {
    const label = String(data['label'] ?? '');
    const value = Number(data['displayValue'] ?? 0);
    if (!label) return;

    const sizes = this.getTreemapTextSizes(rect);
    const padding = sizes.padding;
    const iconLayout = this.getTreemapIconLayout(data, rect);
    const compactInlineIcon = Boolean(iconLayout && rect['height'] < 96 && rect['width'] >= 120);
    const textX = compactInlineIcon ? iconLayout!.x + iconLayout!.size + 8 : rect['x'] + padding;
    const maxWidth = rect['x'] + rect['width'] - padding - textX;
    if (maxWidth < 28) return;

    const titleFont = `${sizes.titleWeight} ${sizes.titleSize}px "Source Sans 3", Arial, sans-serif`;
    const titleLines = this.wrapCanvasText(ctx, label, maxWidth, 2, titleFont);
    const titleLineHeight = sizes.titleSize + 6;
    const voiceLineHeight = sizes.voiceSize + 5;
    const voiceText = value > 0 ? `${value} ${this.text.voicesRaisedSuffix}` : '';
    const iconBottom = iconLayout && !compactInlineIcon ? iconLayout.y + iconLayout.size + 8 : rect['y'] + padding;
    const minY = Math.max(rect['y'] + padding, iconBottom);
    const titleOnlyHeight = titleLines.length * titleLineHeight;
    const availableTextHeight = rect['y'] + rect['height'] - padding - minY;
    const shouldDrawVoice =
      Boolean(voiceText) &&
      rect['height'] >= 58 &&
      rect['width'] >= 74 &&
      titleOnlyHeight + voiceLineHeight <= availableTextHeight;
    const contentHeight = titleLines.length * titleLineHeight + (shouldDrawVoice ? voiceLineHeight : 0);
    const maxY = rect['y'] + rect['height'] - padding - contentHeight;
    let textY = rect['y'] + (rect['height'] - contentHeight) / 2;
    textY = Math.min(Math.max(textY, minY), Math.max(minY, maxY));

    ctx.save();
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.font = titleFont;

    titleLines.forEach(line => {
      ctx.fillText(line, textX, textY);
      textY += titleLineHeight;
    });

    if (shouldDrawVoice) {
      ctx.font = `600 ${sizes.voiceSize}px "Source Sans 3", Arial, sans-serif`;
      ctx.globalAlpha = 0.96;
      ctx.fillText(voiceText, textX, textY);
    }

    ctx.restore();
  }

  private shouldDrawTreemapText(
    ctx: CanvasRenderingContext2D,
    data: Record<string, any>,
    rect: Record<string, number>
  ): boolean {
    const label = String(data['label'] ?? '');
    if (!label || rect['width'] < 58 || rect['height'] < 56) return false;

    const sizes = this.getTreemapTextSizes(rect);
    const padding = sizes.padding;
    const iconLayout = this.getTreemapIconLayout(data, rect);
    const compactInlineIcon = Boolean(iconLayout && rect['height'] < 96 && rect['width'] >= 120);
    const textX = compactInlineIcon ? iconLayout!.x + iconLayout!.size + 8 : rect['x'] + padding;
    const maxWidth = rect['x'] + rect['width'] - padding - textX;

    if (maxWidth < 44) return false;

    const titleFont = `${sizes.titleWeight} ${sizes.titleSize}px "Source Sans 3", Arial, sans-serif`;
    const titleLines = this.wrapCanvasText(ctx, label, maxWidth, 2, titleFont);
    const hasReadableTitle = titleLines.some(line => line.replace(/\./g, '').trim().length >= 4);
    if (!hasReadableTitle) return false;

    const titleLineHeight = sizes.titleSize + 6;
    const voiceLineHeight = sizes.voiceSize + 5;
    const voiceText = Number(data['displayValue'] ?? 0) > 0 ? `${data['displayValue']} ${this.text.voicesRaisedSuffix}` : '';
    const shouldDrawVoice = Boolean(voiceText) && rect['height'] >= 58 && rect['width'] >= 74;
    const iconHeight = iconLayout && !compactInlineIcon ? iconLayout.size + 8 : 0;
    const titleOnlyHeight = padding * 2 + iconHeight + titleLines.length * titleLineHeight;
    const requiredHeight = titleOnlyHeight + (shouldDrawVoice ? voiceLineHeight : 0);

    return titleOnlyHeight <= rect['height'] || requiredHeight <= rect['height'];
  }

  private getTreemapTextSizes(rect: Record<string, number>): { titleSize: number; voiceSize: number; titleWeight: number; padding: number } {
    const area = rect['width'] * rect['height'];

    if (area > 50000) {
      return { titleSize: 22, voiceSize: 15, titleWeight: 700, padding: 12 };
    }

    if (area > 26000) {
      return { titleSize: 17, voiceSize: 12, titleWeight: 700, padding: 10 };
    }

    if (area > 12000) {
      return { titleSize: 13, voiceSize: 10, titleWeight: 700, padding: 9 };
    }

    return { titleSize: 11, voiceSize: 8, titleWeight: 700, padding: 7 };
  }

  private getTreemapIconLayout(
    data: Record<string, any>,
    rect: Record<string, number>,
    iconOnly = false
  ): { x: number; y: number; size: number } | null {
    const icon = data['icon'];
    if (typeof icon !== 'string' || !icon || rect['width'] < 16 || rect['height'] < 16) return null;

    const isTiny = rect['width'] < 44 || rect['height'] < 44;
    const padding = rect['width'] * rect['height'] > 26000 ? 10 : isTiny ? 4 : 7;

    // Icon always sits at the top-left of the card. Text-less cards get a
    // larger icon for visibility; cards with text keep it compact so it
    // doesn't crowd the label. The size is clamped to what fits inside the
    // padded box so the icon never spills out of the card.
    const available = Math.min(rect['width'], rect['height']) - padding * 2;
    const target = iconOnly
      ? Math.min(64, rect['width'] * 0.42, rect['height'] * 0.42)
      : Math.min(20, rect['width'] * 0.13, rect['height'] * 0.16);
    const size = Math.max(8, Math.min(target, available));

    return {
      x: rect['x'] + padding,
      y: rect['y'] + padding,
      size,
    };
  }

  private wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number, font: string): string[] {
    ctx.font = font;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';

    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        return;
      }

      if (line) {
        lines.push(line);
      }
      line = word;
    });

    if (line) {
      lines.push(line);
    }

    const visibleLines = lines.slice(0, maxLines).map(visibleLine =>
      ctx.measureText(visibleLine).width > maxWidth
        ? this.ellipsizeCanvasText(ctx, visibleLine, maxWidth)
        : visibleLine
    );
    if (lines.length > maxLines && visibleLines.length) {
      visibleLines[visibleLines.length - 1] = this.ellipsizeCanvasText(ctx, visibleLines[visibleLines.length - 1], maxWidth);
    }

    return visibleLines.length ? visibleLines : [this.ellipsizeCanvasText(ctx, text, maxWidth)];
  }

  private ellipsizeCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;

    const ellipsis = '...';
    let truncated = text;
    while (truncated.length > 0 && ctx.measureText(`${truncated}${ellipsis}`).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }

    return `${truncated.trim()}${ellipsis}`;
  }

  private getTreemapIconImage(icon: string): HTMLImageElement {
    const existingImage = this.treemapIconImages.get(icon);
    if (existingImage) return existingImage;

    const image = new Image();
    image.onload = () => this.chart?.draw();
    image.src = icon;
    this.treemapIconImages.set(icon, image);
    return image;
  }

  private getTreemapTileColor(context: ScriptableContext<'treemap'>): string {
    const data = this.getTreemapRawData(context.raw);
    return data['id'] === this.activeThemeId
      ? data['activeBackgroundColor'] ?? data['backgroundColor'] ?? '#bdbdbd'
      : data['backgroundColor'] ?? '#bdbdbd';
  }

  private getTreemapActiveColor(context: ScriptableContext<'treemap'>): string {
    const data = this.getTreemapRawData(context.raw);
    return data['activeBackgroundColor'] ?? data['backgroundColor'] ?? '#bdbdbd';
  }

  ngOnDestroy(): void {
    this.treemapCanvasRef?.nativeElement.removeEventListener('pointerleave', this.handleTreemapPointerLeave);
    this.chart?.destroy();
  }
}

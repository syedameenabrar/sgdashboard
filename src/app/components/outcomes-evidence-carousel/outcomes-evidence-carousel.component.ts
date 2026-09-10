import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import {
  getEvidenceDisplayName,
  getEvidenceFileBackground,
  getEvidenceFileIcon,
  ProgramEvidenceResource,
} from '../outcomes-model/outcomes-model.config';

// The paginated evidence carousel shown in program mode. The unpaginated flat evidence
// list (shown in the framework/narrative panel) stays on OutcomesModelComponent since
// it has no pagination state of its own.
@Component({
  selector: 'app-outcomes-evidence-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outcomes-evidence-carousel.component.html',
  styleUrls: ['./outcomes-evidence-carousel.component.scss'],
})
export class OutcomesEvidenceCarouselComponent {
  @Input() evidences: ProgramEvidenceResource[] = [];
  @Input() heading = '';
  @Input() prevLabel = '';
  @Input() nextLabel = '';
  @Input() viewLabel = '';
  @Input() evidenceNameFallbackSuffix?: string | null;

  private readonly MOBILE_BREAKPOINT = 768;

  private readonly TOOLTIP_MAX_HALF_WIDTH = 130;
  private readonly TOOLTIP_VIEWPORT_MARGIN = 8;

  pageIndex = 0;
  perPage = this.cardsPerPage;

  tooltipText: string | null = null;
  tooltipTop = 0;
  tooltipLeft = 0;
  tooltipVisible = false;

  @HostListener('window:resize')
  onWindowResize(): void {
    this.hideTooltip();

    const newPerPage = this.cardsPerPage;

    if (this.perPage !== newPerPage) {
      this.perPage = newPerPage;
      this.pageIndex = this.clampPageIndex(this.pageIndex, this.pageCount);
    }
  }

  // Called by the parent (via ViewChild) when the selected layer changes, so
  // pagination restarts for the newly-shown evidence set.
  reset(): void {
    this.pageIndex = 0;
  }

  get visibleEvidences(): ProgramEvidenceResource[] {
    const startIndex = this.pageIndex * this.perPage;
    return this.evidences.slice(startIndex, startIndex + this.perPage);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.evidences.length / this.perPage));
  }

  get canShowControls(): boolean {
    return this.evidences.length > this.perPage;
  }

  get canGoToPrevious(): boolean {
    return this.pageIndex > 0;
  }

  get canGoToNext(): boolean {
    return this.pageIndex < this.pageCount - 1;
  }

  showPrevious(): void {
    this.pageIndex = this.clampPageIndex(this.pageIndex - 1, this.pageCount);
  }

  showNext(): void {
    this.pageIndex = this.clampPageIndex(this.pageIndex + 1, this.pageCount);
  }

  get thumbWidthPercent(): number {
    const total = this.evidences.length;
    if (!total) return 0;

    return Math.min(100, (this.perPage / total) * 100);
  }

  get thumbLeftPercent(): number {
    if (this.pageCount <= 1) return 0;

    return (this.pageIndex / (this.pageCount - 1)) * (100 - this.thumbWidthPercent);
  }

  getEvidenceDisplayName(evidence: ProgramEvidenceResource): string {
    return getEvidenceDisplayName(evidence, this.evidenceNameFallbackSuffix);
  }

  getEvidenceFileIcon(evidence: ProgramEvidenceResource): string {
    return getEvidenceFileIcon(evidence.evidence_type);
  }

  getEvidenceFileBackground(evidence: ProgramEvidenceResource): string {
    return getEvidenceFileBackground(evidence.evidence_type);
  }

  getSafeEvidenceUrl(evidence: ProgramEvidenceResource): string | null {
    if (!evidence?.url) return null;

    try {
      const url = new URL(evidence.url, typeof window !== 'undefined' ? window.location.origin : undefined);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
      return null;
    }
  }

  openEvidence(evidence: ProgramEvidenceResource, event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('.evidence-view-link') || target.closest('.evidence-tag')) return;

    const url = this.getSafeEvidenceUrl(evidence);
    if (!url) return;

    event.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // A tag counts as truncated only when its text is actually clipped by the
  // ellipsis, i.e. the rendered content is wider than the visible box. This is
  // measured on the real element rather than guessed from the string length, so
  // the tooltip only appears for tags that show "…".
  private isTagClipped(el: HTMLElement): boolean {
    return el.scrollWidth - el.clientWidth > 1;
  }

  private tagText(el: HTMLElement): string {
    return (el.textContent ?? '').trim();
  }

  onTagPointerEnter(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const clipped = this.isTagClipped(el);
    el.classList.toggle('has-tooltip', clipped);

    if (clipped) {
      this.showTooltip(el);
    }
  }

  onTagClick(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const clipped = this.isTagClipped(el);
    el.classList.toggle('has-tooltip', clipped);

    if (!clipped) return;

    if (this.tooltipVisible && this.tooltipText === this.tagText(el)) {
      this.hideTooltip();
    } else {
      this.showTooltip(el);
    }
  }

  showTooltip(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    this.tooltipText = this.tagText(el);
    this.tooltipTop = rect.top - 8;
    this.tooltipLeft = this.clampTooltipLeft(rect.left + rect.width / 2);
    this.tooltipVisible = true;
  }

  private clampTooltipLeft(centerX: number): number {
    if (typeof window === 'undefined') return centerX;

    const min = this.TOOLTIP_VIEWPORT_MARGIN + this.TOOLTIP_MAX_HALF_WIDTH;
    const max = window.innerWidth - this.TOOLTIP_VIEWPORT_MARGIN - this.TOOLTIP_MAX_HALF_WIDTH;

    if (max <= min) return window.innerWidth / 2;

    return Math.min(Math.max(centerX, min), max);
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.evidence-tag')) {
      this.hideTooltip();
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.hideTooltip();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private get cardsPerPage(): number {
    return this.isMobileViewport() ? 1 : 2;
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= this.MOBILE_BREAKPOINT;
  }

  private clampPageIndex(index: number, pageCount: number): number {
    return Math.max(0, Math.min(pageCount - 1, index));
  }
}

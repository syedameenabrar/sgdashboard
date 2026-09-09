import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as d3 from 'd3';
import { environment } from '@environments/environment';
import { OUTCOMES_MODEL_CONFIG_PAGE } from '../../../constants/urlConstants';
import { OutcomesDiagramComponent } from '../outcomes-diagram/outcomes-diagram.component';
import { OutcomesEvidenceCarouselComponent } from '../outcomes-evidence-carousel/outcomes-evidence-carousel.component';
import { OutcomesInfoModalComponent } from '../outcomes-info-modal/outcomes-info-modal.component';
import { OutcomesProgramCardCarouselComponent } from '../outcomes-program-card-carousel/outcomes-program-card-carousel.component';
import { SentenceCasePipe } from './sentence-case.pipe';
import {
  buildProgramOutcomeDataFromFramework,
  EMPTY_LAYER,
  EMPTY_OUTCOMES_MODEL_CONFIG,
  getEvidenceDisplayName,
  getEvidenceFileBackground,
  getEvidenceFileIcon,
  isValidOutcomesModelConfig,
  OutcomesLayerConfig,
  OutcomesLayerKey,
  OutcomesListItem,
  OutcomesModelConfig,
  ProgramEvidenceResource,
  ProgramOutcomeCard,
  ProgramOutcomeData,
} from './outcomes-model.config';

@Component({
  selector: 'app-outcomes-model',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OutcomesDiagramComponent,
    OutcomesInfoModalComponent,
    OutcomesEvidenceCarouselComponent,
    OutcomesProgramCardCarouselComponent,
    SentenceCasePipe,
  ],
  templateUrl: './outcomes-model.component.html',
  styleUrls: [
    './outcomes-model.component.scss',
    './outcomes-model.component.responsive.scss',
  ],
})
export class OutcomesModelComponent implements OnDestroy, OnInit {
  private _config: OutcomesModelConfig = EMPTY_OUTCOMES_MODEL_CONFIG;
  private _programOutcomeData?: ProgramOutcomeData;
  private _framework?: any[];
  private _programPartners: ProgramOutcomeCard[] = [];
  private _activeLayer?: OutcomesLayerKey;

  @Input()
  set config(value: OutcomesModelConfig | undefined) {
    this._config = value || EMPTY_OUTCOMES_MODEL_CONFIG;
    this.syncState();
  }

  get config(): OutcomesModelConfig {
    return this._config;
  }

  @Input()
  set programOutcomeData(value: ProgramOutcomeData | undefined) {
    this._programOutcomeData = value;
    this.syncState();
  }

  get programOutcomeData(): ProgramOutcomeData | undefined {
    return this._programOutcomeData;
  }

  /** Raw `framework` array from the program-details API response; reshaped internally into `programOutcomeData`. */
  @Input()
  set framework(value: any[] | undefined) {
    this._framework = value;
    if (value) {
      this._programOutcomeData = buildProgramOutcomeDataFromFramework(value);
    }
    this.syncState();
  }

  get framework(): any[] | undefined {
    return this._framework;
  }

  @Input()
  set programPartners(value: ProgramOutcomeCard[] | undefined) {
    this._programPartners = value || [];
    this.syncState();
  }

  get programPartners(): ProgramOutcomeCard[] {
    return this._programPartners;
  }

  @Input()
  set activeLayer(value: OutcomesLayerKey | undefined) {
    this._activeLayer = value;
    this.syncState();
  }

  get activeLayer(): OutcomesLayerKey | undefined {
    return this._activeLayer;
  }

  @ViewChild(OutcomesEvidenceCarouselComponent) private evidenceCarousel?: OutcomesEvidenceCarouselComponent;
  @ViewChild(OutcomesProgramCardCarouselComponent) private programCardCarousel?: OutcomesProgramCardCarouselComponent;

  selectedLayerKey: OutcomesLayerKey = this.config.defaultLayer;
  selectedPanel: 'programs' | 'layer' = 'layer';
  isInfoModalOpen = false;
  private hasExplicitLayerSelection = false;
  private isDestroyed = false;
  private readonly emptyProgramLayerIconOverrides: Partial<Record<OutcomesLayerKey, string>> = {};
  private programLayerIconOverridesCacheKey = '';
  private programLayerIconOverridesCache: Partial<Record<OutcomesLayerKey, string>> = {};

  ngOnInit(): void {
    // Diagram styling/text always comes from OUTCOMES_MODEL_CONFIG_PAGE. Only fetch it if this
    // instance doesn't already have layer data (e.g. landing on program-details directly, with
    // no [config] passed in) — avoids re-fetching if a parent ever supplies [config] itself.
    if (!this.config?.layers?.length) {
      d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${OUTCOMES_MODEL_CONFIG_PAGE}`)
        .then((data: any) => {
          if (this.isDestroyed) return;

          if (isValidOutcomesModelConfig(data)) {
            this.config = data;
          } else {
            console.error('Invalid outcomes model config payload received.');
          }
        })
        .catch((error: any) => {
          console.error('Error loading outcomes model config:', error);
        });
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
  }

  private syncState(): void {
    if (this.activeLayer || this.programOutcomeData?.layerKey) {
      this.hasExplicitLayerSelection = true;
    }

    this.selectedLayerKey =
      this.activeLayer ||
      this.programOutcomeData?.layerKey ||
      (this.hasExplicitLayerSelection ? this.selectedLayerKey : this.config.defaultLayer);

    if (
      this.hasProgramOutcomeData &&
      !this.isProgramLayerAvailable(this.selectedLayerKey)
    ) {
      this.selectedLayerKey = this.firstAvailableProgramLayerKey;
    }

    this.selectedPanel = this.hasProgramOutcomeData ? 'programs' : this.selectedPanel;

    this.programCardCarousel?.reset();
    this.evidenceCarousel?.reset();
  }

  get layers(): OutcomesLayerConfig[] {
    return this.config.layers;
  }

  // The diagram (which draws its own outer ring) derives its own outerLayer; only
  // innerLayer is still needed here, for the info modal when there's no program data.
  get innerLayer(): OutcomesLayerConfig {
    const sortedByInnerRadius = [...this.layers].sort(
      (a, b) => a.diagram.innerRadius - b.diagram.innerRadius
    );
    return sortedByInnerRadius[0] || this.layers[0] || EMPTY_LAYER;
  }

  get selectedLayer(): OutcomesLayerConfig {
    return this.getLayerByKey(this.selectedLayerKey) || this.layers[0] || EMPTY_LAYER;
  }

  get displayProgramData(): ProgramOutcomeData | undefined {
    return this.programOutcomeData;
  }

  get selectedProgramData(): ProgramOutcomeData | undefined {
    const data = this.programOutcomeData;
    if (this.selectedLayerKey === 'network' && this.hasProgramPartners) {
      return this.programNetworkData;
    }

    if (!data) return undefined;

    const layerData = this.getProgramLayerData(this.selectedLayerKey);
    if (layerData) return layerData;

    return this.selectedLayerKey === this.programBaseLayerKey ? data : undefined;
  }

  get shouldShowProgramPanel(): boolean {
    return this.hasProgramOutcomeData && this.selectedPanel === 'programs';
  }

  get activePanelColor(): string {
    return this.shouldShowProgramPanel ? this.config.programColor : this.selectedLayer.color;
  }

  get activeTextColor(): string {
    return this.getReadableTextColor(this.activePanelColor);
  }

  get hasProgramOutcomeData(): boolean {
    return !!this.programOutcomeData || this.hasProgramPartners;
  }

  get hasProgramPartners(): boolean {
    return (this.programPartners || []).length > 0;
  }

  get programNetworkData(): ProgramOutcomeData {
    return {
      layerKey: 'network',
      title: this.getLayerByKey('network')?.heading || this.getLayerByKey('network')?.chipLabel || 'Network',
      cardVariant: 'partner',
      outcomes: this.programPartners || [],
    };
  }

  get programBaseLayerKey(): OutcomesLayerKey {
    return this.programOutcomeData?.layerKey || this.config.defaultLayer;
  }

  get firstAvailableProgramLayerKey(): OutcomesLayerKey {
    return this.layers.find((layer) => this.isProgramLayerAvailable(layer.key))?.key || this.config.defaultLayer;
  }

  get infoModalLayer(): OutcomesLayerConfig {
    return this.hasProgramOutcomeData ? this.selectedLayer : this.innerLayer;
  }

  private get staticTexts(): NonNullable<OutcomesModelConfig['staticTexts']> {
    return this.config.staticTexts || {};
  }

  get infoModalTitle(): string {
    const prefix = this.staticTexts.infoModalTitlePrefix || 'About';
    return this.infoModalLayer.heading || this.infoModalLayer.eyebrow || this.infoModalLayer.chipLabel || `${prefix} ${this.infoModalLayer.chipLabel}`;
  }

  get infoModalIcon(): string {
    return (
      this.getProgramLayerIcon(this.infoModalLayer.key) ||
      this.infoModalLayer.imgPath ||
      (this.infoModalLayer.diagram.icon.type === 'image' ? this.infoModalLayer.diagram.icon.value : '') ||
      this.infoModalLayer.icon
    );
  }

  get infoModalColor(): string {
    return this.infoModalLayer.color;
  }

  get infoModalListItems(): OutcomesListItem[] {
    if (!this.shouldShowLayerFrameworkList(this.infoModalLayer.key)) {
      return [];
    }

    return this.infoModalLayer.listItems || [];
  }

  get infoModalCloseLabel(): string {
    return this.config.ariaLabels.closeModal;
  }

  closeInfoModal(): void {
    this.isInfoModalOpen = false;
  }

  get narrativeBody(): string {
    if (this.selectedLayerDefinition) {
      return this.selectedLayerDefinition;
    }

    if (this.selectedLayer.body) {
      return this.selectedLayer.body;
    }

    if (this.selectedLayer.listItems?.length) {
      return this.selectedLayer.listItems.map((item) => `${item.title}: ${item.description}`).join(' ');
    }

    return this.config.defaultNarrativeBody;
  }

  get selectedLayerDefinition(): string {
    const layerTitle = this.normalizeLayerText(
      this.selectedLayer.heading || this.selectedLayer.chipLabel || this.selectedLayer.key
    );
    const definitionItem = this.selectedLayer.listItems?.find(
      (item) => this.normalizeLayerText(item.title) === layerTitle
    );

    return definitionItem?.description || this.selectedLayer.subheading || '';
  }

  get frameworkLead(): string {
    return this.config.frameworkLead;
  }

  get programPanelTitle(): string {
    return this.selectedLayer.heading || this.selectedLayer.eyebrow || this.selectedLayer.chipLabel;
  }

  get programPanelDescription(): string {
    return this.narrativeBody || this.staticTexts.programModeDescription || 'View program outcomes and evidence';
  }

  get programCards(): ProgramOutcomeCard[] {
    return (
      this.selectedProgramData?.outcomes ||
      this.programOutcomeData?.outcomesByLayer?.[this.selectedLayerKey] ||
      []
    );
  }

  get programPanelIcon(): string {
    return this.getProgramLayerIcon(this.selectedLayerKey) || this.selectedLayer.imgPath || this.selectedLayer.diagram.icon.value;
  }

  get programLayerIconOverrides(): Partial<Record<OutcomesLayerKey, string>> {
    if (!this.hasProgramOutcomeData) return this.emptyProgramLayerIconOverrides;

    const cacheKey = this.layers.map((layer) => `${layer.key}:${this.getProgramLayerIcon(layer.key)}`).join('|');
    if (cacheKey === this.programLayerIconOverridesCacheKey) {
      return this.programLayerIconOverridesCache;
    }

    this.programLayerIconOverridesCacheKey = cacheKey;
    this.programLayerIconOverridesCache = this.layers.reduce<Partial<Record<OutcomesLayerKey, string>>>((icons, layer) => {
      const icon = this.getProgramLayerIcon(layer.key);
      if (icon) {
        icons[layer.key] = icon;
      }
      return icons;
    }, {});
    return this.programLayerIconOverridesCache;
  }

  get programEvidenceResources(): ProgramEvidenceResource[] {
    return (
      this.selectedProgramData?.evidences ||
      this.programOutcomeData?.evidencesByLayer?.[this.selectedLayerKey] ||
      []
    );
  }

  get programCardVariant(): 'outcome' | 'partner' {
    return this.selectedProgramData?.cardVariant || 'outcome';
  }

  // Narrative pills render in two rows of up to 3; kept as named slices so the
  // split isn't a bare magic number repeated in the template.
  get primaryLayers(): OutcomesLayerConfig[] {
    return this.layers.slice(0, 3);
  }

  get secondaryLayers(): OutcomesLayerConfig[] {
    return this.layers.slice(3).sort((a, b) => {
      const order: Partial<Record<OutcomesLayerKey, number>> = {
        system: 0,
        society: 1,
        network: 2,
      };
      return (order[a.key] ?? 99) - (order[b.key] ?? 99);
    });
  }

  get frameworkLayers(): OutcomesLayerConfig[] {
    const order: Partial<Record<OutcomesLayerKey, number>> = {
      students: 0,
      schools: 1,
      community: 2,
      system: 3,
      society: 4,
      network: 5,
    };

    return [...this.layers].sort((a, b) => (order[a.key] ?? 99) - (order[b.key] ?? 99));
  }

  get shouldShowFrameworkList(): boolean {
    return this.shouldShowLayerFrameworkList(this.selectedLayerKey);
  }

  // Every layer's disabled state, precomputed once for the diagram child component
  // (it has no access to programOutcomeData, so it can't derive this itself).
  get disabledLayerKeys(): Set<OutcomesLayerKey> {
    return new Set(
      this.layers.filter((layer) => this.isDiagramLayerDisabled(layer.key)).map((layer) => layer.key)
    );
  }

  selectLayer(layerKey: OutcomesLayerKey): void {
    if (this.hasProgramOutcomeData && !this.isProgramLayerAvailable(layerKey)) {
      return;
    }

    this.selectedLayerKey = layerKey;
    this.hasExplicitLayerSelection = true;
    this.selectedPanel = 'layer';

    this.programCardCarousel?.reset();
    this.evidenceCarousel?.reset();
  }

  selectProgramPanel(): void {
    if (!this.hasProgramOutcomeData) return;

    this.selectedPanel = 'programs';
    this.programCardCarousel?.reset();
    this.evidenceCarousel?.reset();
  }

  // `index` is the card's absolute position in the (unpaginated) list — the caller
  // owns pagination, if any, and is responsible for passing the right index.
  getProgramCardLabel(card: ProgramOutcomeCard, index: number): string {
    return (
      card.label ||
      card.title ||
      card.name ||
      card.heading ||
      card.partner ||
      `${this.config.defaultCardLabelPrefix}${index + 1}`
    );
  }

  getProgramCardDescription(card: ProgramOutcomeCard): string {
    return card.description || card.body || card.text || card.value || card.about_the_program_objective || '';
  }

  isProgramLayerAvailable(layerKey: OutcomesLayerKey): boolean {
    if (layerKey === 'network' && this.hasProgramPartners) return true;
    if (!this.programOutcomeData) return false;

    const layerData = this.getProgramLayerData(layerKey);
    const hasLayerData = this.hasProgramContent(layerData);
    const hasGroupedData = !!(
      this.programOutcomeData.outcomesByLayer?.[layerKey]?.length ||
      this.programOutcomeData.evidencesByLayer?.[layerKey]?.length
    );
    const hasBaseData = layerKey === this.programBaseLayerKey && this.hasProgramContent(this.programOutcomeData);

    return hasLayerData || hasGroupedData || hasBaseData;
  }

  trackByLayerKey(_: number, layer: OutcomesLayerConfig): string {
    return layer.key;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private getProgramLayerData(layerKey: OutcomesLayerKey): ProgramOutcomeData | undefined {
    if (layerKey === 'network' && this.hasProgramPartners) {
      return this.programNetworkData;
    }

    const layers = this.programOutcomeData?.layers;
    if (!layers) return undefined;

    if (Array.isArray(layers)) {
      return layers.find((layer) => layer.layerKey === layerKey);
    }

    return layers[layerKey];
  }

  private getProgramLayerIcon(layerKey: OutcomesLayerKey): string {
    const layer = this.getLayerByKey(layerKey);
    return (
      layer?.diagram?.icon?.value ||
      layer?.imgPath ||
      ''
    );
  }

  private hasProgramContent(data?: ProgramOutcomeData): boolean {
    return !!(data?.title || data?.subtitle || data?.outcomes?.length || data?.evidences?.length);
  }

  // The program's own layer title (e.g. "Learners Outcomes" from `framework[].impact_layer`),
  // used to override the static config label when program data is loaded.
  private getProgramLayerTitle(layerKey: OutcomesLayerKey): string | undefined {
    if (!this.hasProgramOutcomeData) return undefined;

    return layerKey === this.programBaseLayerKey
      ? this.programOutcomeData?.title
      : this.getProgramLayerData(layerKey)?.title;
  }

  getLayerTileLabel(layer: OutcomesLayerConfig): string {
    return this.getProgramLayerTitle(layer.key) || layer.chipLabel;
  }

  isDiagramLayerDisabled(layerKey: OutcomesLayerKey): boolean {
    return this.hasProgramOutcomeData &&
      !this.isProgramLayerAvailable(layerKey);
  }

  getEvidenceDisplayName(evidence: ProgramEvidenceResource): string {
    return getEvidenceDisplayName(evidence, this.staticTexts.evidenceNameFallbackSuffix);
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

  getLayerByKey(key: OutcomesLayerKey | string): OutcomesLayerConfig | undefined {
    return this.layers.find((layer) => layer.key === key);
  }

  private normalizeLayerText(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private shouldShowLayerFrameworkList(layerKey: OutcomesLayerKey): boolean {
    return layerKey !== 'society' && layerKey !== 'network';
  }

  // Keeps text readable on dynamic layer-color backgrounds.
  private getReadableTextColor(color: string): string {
    const hex = color?.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
    if (!hex) return 'var(--oc-white)';

    const normalizedHex = hex.length === 3
      ? hex.split('').map((char) => char + char).join('')
      : hex;
    const red = parseInt(normalizedHex.slice(0, 2), 16);
    const green = parseInt(normalizedHex.slice(2, 4), 16);
    const blue = parseInt(normalizedHex.slice(4, 6), 16);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 150 ? 'var(--oc-black)' : 'var(--oc-white)';
  }
}

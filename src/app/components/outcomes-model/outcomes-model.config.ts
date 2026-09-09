export type OutcomesLayerKey =
  | 'students'
  | 'schools'
  | 'community'
  | 'society'
  | 'system'
  | 'network';

export function toSentenceCase(value: string | null | undefined): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export type OutcomesPanelType = 'programs' | 'list' | 'story';
export type OutcomesLayerShape = 'full' | 'top' | 'bottom';

export interface OutcomesDiagramIcon {
  type: 'material' | 'image';
  value: string;
  color?: string;
  width?: number;
  height?: number;
}

export interface OutcomesDiagramConfig {
  shape: OutcomesLayerShape;
  innerRadius: number;
  outerRadius: number;
  labelX: number;
  labelY: number;
  labelLayout?: 'inline' | 'stacked' | 'icon-only';
  labelAnchor?: 'start' | 'middle' | 'end';
  iconOffsetX?: number;
  iconOffsetY?: number;
  textOffsetX?: number;
  textOffsetY?: number;
  icon: OutcomesDiagramIcon;
  iconX: number;
  iconY: number;
  curvedLabelPath?: string;
  labelForAttr?: string;
  dataLayerAttr?: string;
  hitRadius?: number;
  isHitTarget?: boolean;
  text?: {
    x: number;
    y: number;
    fill?: string;
    fontSize?: number;
    fontWeight?: number;
  };
}

export interface OutcomesListItem {
  letter: string;
  icon: string;
  title: string;
  description: string;
}

export interface OutcomesCta {
  label: string;
  link: string;
}

export interface OutcomesLayerConfig {
  key: OutcomesLayerKey;
  chipLabel: string;
  diagramLabel: string;
  icon: string;
  color: string;
  fill: string;
  diagram: OutcomesDiagramConfig;
  panelType: OutcomesPanelType;
  imgPath: string;
  heading?: string;
  eyebrow?: string;
  subheading?: string;
  learner_subheading?: string;
  impact_subheading?: string;
  body?: string;
  frameworkNote?: string;
  cta?: OutcomesCta;
  frameworkCta?: OutcomesCta;
  listItems?: OutcomesListItem[];
}

export interface ProgramOutcomeCard {
  label?: string;
  title?: string;
  name?: string;
  heading?: string;
  partner?: string;
  src?: string;
  logo?: string;
  image?: string;
  alt?: string;
  website?: string;
  url?: string;
  ctaLabel?: string;
  description?: string;
  body?: string;
  text?: string;
  value?: string;
  about_the_program_objective?: string;
}

export interface ProgramEvidenceResource {
  evidence_name?: string;
  evidence_size_bytes?: number;
  evidence_size?: string;
  evidence_mime_type?: string;
  evidence_type?: string;
  tag: string;
  url?: string;
}

// Default when the fetched config doesn't supply staticTexts.evidenceNameFallbackSuffix.
export const EVIDENCE_NAME_FALLBACK_SUFFIX = 'document';

// Falls back to "<tag> <suffix>" (e.g. "Dental Revision document") when the API doesn't
// provide a file name for an evidence resource. `fallbackSuffix` should come from the
// fetched config's staticTexts.evidenceNameFallbackSuffix; defaults to the word "document" above.
// Uses `||` rather than a default parameter because Angular's template `?.` short-circuits
// to `null` (not `undefined`), which a default parameter wouldn't catch.
export function getEvidenceDisplayName(
  evidence: ProgramEvidenceResource,
  fallbackSuffix?: string | null
): string {
  return evidence.evidence_name || `${evidence.tag} ${fallbackSuffix || EVIDENCE_NAME_FALLBACK_SUFFIX}`;
}

export const EVIDENCE_MEDIA_TYPE = {
  PDF: 'PDF',
  DOCX: 'DOCX',
  DOC: 'DOC',
  XLSX: 'XLSX',
  CSV: 'CSV',
  PPTX: 'PPTX',
} as const;

// Icon files referenced here still need to be added under public/assets/icons/.
const EVIDENCE_FILE_TYPE_ICONS: Record<string, string> = {
  [EVIDENCE_MEDIA_TYPE.PDF]: 'assets/icons/pdf.svg',
  [EVIDENCE_MEDIA_TYPE.DOCX]: 'assets/icons/docx.svg',
  [EVIDENCE_MEDIA_TYPE.DOC]: 'assets/icons/docx.svg',
  [EVIDENCE_MEDIA_TYPE.XLSX]: 'assets/icons/xlsx.svg',
  [EVIDENCE_MEDIA_TYPE.CSV]: 'assets/icons/xlsx.svg',
  [EVIDENCE_MEDIA_TYPE.PPTX]: 'assets/icons/pptx.svg',
};

const DEFAULT_EVIDENCE_FILE_ICON = 'assets/icons/file-default.svg';

export function getEvidenceFileIcon(type?: string): string {
  return EVIDENCE_FILE_TYPE_ICONS[type?.toUpperCase() || ''] || DEFAULT_EVIDENCE_FILE_ICON;
}

// The icon SVGs are solid white, drawn to sit on a colored badge (not directly on
// the card's white background), so each file type needs its own backdrop color.
const EVIDENCE_FILE_TYPE_BACKGROUNDS: Record<string, string> = {
  [EVIDENCE_MEDIA_TYPE.PDF]: 'var(--oc-pdf-bg)',
  [EVIDENCE_MEDIA_TYPE.DOCX]: 'var(--oc-docx-bg)',
  [EVIDENCE_MEDIA_TYPE.DOC]: 'var(--oc-docx-bg)',
  [EVIDENCE_MEDIA_TYPE.XLSX]: 'var(--oc-xlsx-bg)',
  [EVIDENCE_MEDIA_TYPE.CSV]: 'var(--oc-xlsx-bg)',
  [EVIDENCE_MEDIA_TYPE.PPTX]: 'var(--oc-pptx-bg)',
};

const DEFAULT_EVIDENCE_FILE_BACKGROUND = 'var(--oc-default-file-bg)';

export function getEvidenceFileBackground(type?: string): string {
  return EVIDENCE_FILE_TYPE_BACKGROUNDS[type?.toUpperCase() || ''] || DEFAULT_EVIDENCE_FILE_BACKGROUND;
}

export interface ProgramOutcomeData {
  layerKey?: OutcomesLayerKey;
  title?: string;
  subtitle?: string;
  icon?: string;
  iconUrl?: string;
  imageUrl?: string;
  imgPath?: string;
  image?: string;
  diagramIcon?: string;
  diagramIconUrl?: string;
  infoLabel?: string;
  cardVariant?: 'outcome' | 'partner';
  outcomes?: ProgramOutcomeCard[];
  evidences?: ProgramEvidenceResource[];
  layers?: Partial<Record<OutcomesLayerKey, ProgramOutcomeData>> | ProgramOutcomeData[];
  outcomesByLayer?: Partial<Record<OutcomesLayerKey, ProgramOutcomeCard[]>>;
  evidencesByLayer?: Partial<Record<OutcomesLayerKey, ProgramEvidenceResource[]>>;
}

export interface OutcomesAriaLabels {
  diagram: string;
  learner: string;
  school: string;
  community: string;
  society: string;
  system: string;
  network: string;
  layerTiles: string;
  narrativeFilters: string;
  frameworkFilters: string;
  cardPages: string;
  prevCards: string;
  nextCards: string;
  prevEvidence: string;
  nextEvidence: string;
  viewEvidence: string;
  closeModal: string;
}

export interface OutcomesModelConfig {
  layerHeading: string;
  title: string;
  description: string;
  layerFootnote: string;
  chipFootnote: string;
  defaultLayer: OutcomesLayerKey;
  programChipLabel: string;
  programColor: string;
  layers: OutcomesLayerConfig[];
  frameworkHeading: string;
  frameworkTitle: string;
  frameworkLead: string;
  evidenceHeading: string;
  programChipFootnote: string;
  defaultNarrativeBody: string;
  defaultCtaLabel: string;
  defaultPartnerImage: string;
  defaultCardLabelPrefix: string;
  ctaIcon: string;
  ariaLabels: OutcomesAriaLabels;
  staticTexts?: {
    programModeHeading?: string;
    programModeDescription?: string;
    diagramNotePrefix?: string;
    chipNotePrefix?: string;
    evidenceCountLabel?: string;
    infoModalTitlePrefix?: string;
    evidenceNameFallbackSuffix?: string;
  };
}

export const EMPTY_ARIA_LABELS: OutcomesAriaLabels = {
  diagram: '',
  learner: '',
  school: '',
  community: '',
  society: '',
  system: '',
  network: '',
  layerTiles: '',
  narrativeFilters: '',
  frameworkFilters: '',
  cardPages: '',
  prevCards: '',
  nextCards: '',
  prevEvidence: '',
  nextEvidence: '',
  viewEvidence: '',
  closeModal: '',
};

// Placeholder shown only for the brief window before the API config resolves (or if it fails).
export const EMPTY_OUTCOMES_MODEL_CONFIG: OutcomesModelConfig = {
  layerHeading: '',
  title: '',
  description: '',
  layerFootnote: '',
  chipFootnote: '',
  defaultLayer: 'students',
  programChipLabel: '',
  programColor: '',
  layers: [],
  frameworkHeading: '',
  frameworkTitle: '',
  frameworkLead: '',
  evidenceHeading: '',
  programChipFootnote: '',
  defaultNarrativeBody: '',
  defaultCtaLabel: '',
  defaultPartnerImage: '',
  defaultCardLabelPrefix: '',
  ctaIcon: '',
  ariaLabels: EMPTY_ARIA_LABELS,
};

export const EMPTY_LAYER: OutcomesLayerConfig = {
  key: 'students',
  chipLabel: '',
  diagramLabel: '',
  icon: '',
  color: '',
  fill: '',
  diagram: {
    shape: 'full',
    innerRadius: 0,
    outerRadius: 0,
    labelX: 0,
    labelY: 0,
    iconX: 0,
    iconY: 0,
    icon: { type: 'image', value: '' },
  },
  panelType: 'list',
  imgPath: '',
};

export function isValidOutcomesModelConfig(data: any): data is OutcomesModelConfig {
  return (
    !!data &&
    Array.isArray(data.layers) &&
    data.layers.every(
      (layer: any) =>
        !!layer &&
        typeof layer.key === 'string' &&
        typeof layer.diagramLabel === 'string' &&
        typeof layer.color === 'string' &&
        typeof layer.fill === 'string' &&
        !!layer.diagram
    )
  );
}

// Maps the API's `framework[].impact_layer` label to the diagram's layer key.
// The API text is not fully stable, so normalize common spelling/plural variants
// before matching (e.g. Centre/Center, Anganwadi/Anganavadi, "&"/"and").
const IMPACT_LAYER_KEY_MAP: Record<string, OutcomesLayerKey> = {
  'learners outcomes': 'students',
  'learner outcomes': 'students',
  learners: 'students',
  students: 'students',
  'schools anganwadi centres': 'schools',
  'schools anganwadi centers': 'schools',
  'school anganwadi centre': 'schools',
  'school anganwadi center': 'schools',
  schools: 'schools',
  school: 'schools',
  community: 'community',
  communities: 'community',
  'system institutions': 'system',
  system: 'system',
};

function normalizeImpactLayerLabel(label?: string): string {
  return (label || '')
    .toLowerCase()
    .replace(/anganavadi/g, 'anganwadi')
    .replace(/centers/g, 'centres')
    .replace(/center/g, 'centre')
    .replace(/&/g, ' and ')
    .replace(/\band\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getImpactLayerKey(impactLayer: any): OutcomesLayerKey | undefined {
  const explicitLayerKey = impactLayer?.layerKey as OutcomesLayerKey | undefined;
  if (explicitLayerKey) return explicitLayerKey;

  const normalizedLabel = normalizeImpactLayerLabel(impactLayer?.impact_layer);
  if (IMPACT_LAYER_KEY_MAP[normalizedLabel]) return IMPACT_LAYER_KEY_MAP[normalizedLabel];

  if (normalizedLabel.includes('anganwadi') || normalizedLabel.includes('school')) return 'schools';
  if (normalizedLabel.includes('communit')) return 'community';
  if (normalizedLabel.includes('system')) return 'system';
  if (normalizedLabel.includes('learner') || normalizedLabel.includes('student')) return 'students';

  return undefined;
}

const PROGRAM_OUTCOME_BASE_LAYER_KEY: OutcomesLayerKey = 'students';

// Reshapes one impact_layer entry's outcome cards. The live API currently nests these
// under `frameworks[].details[]` (label = framework_name); a flat `cards[]` (label/description
// per card) is also supported in case the API moves to that shape.
function extractOutcomeCards(impactLayer: any): ProgramOutcomeCard[] {
  if (Array.isArray(impactLayer.cards)) {
    return impactLayer.cards.map((card: any) => ({
      label: card?.label,
      description: card?.description,
    }));
  }

  const outcomes: ProgramOutcomeCard[] = [];
  for (const fw of impactLayer.frameworks || []) {
    for (const detail of fw.details || []) {
      if (detail?.description) {
        outcomes.push({ label: fw.framework_name, description: detail.description });
      }
    }
  }
  return outcomes;
}

// Reshapes one impact_layer entry's evidence resources. The live API currently nests these
// under `frameworks[].details[].evidence_link` (no file metadata, just a Drive link); a flat
// `evidences[]` carrying evidence_name/evidence_size/evidence_type is also supported.
function extractEvidences(impactLayer: any): ProgramEvidenceResource[] {
  if (Array.isArray(impactLayer.evidences)) {
    return impactLayer.evidences.map((evidence: any) => ({
      evidence_name: evidence?.evidence_name,
      evidence_size_bytes: evidence?.evidence_size_bytes,
      evidence_size: evidence?.evidence_size,
      evidence_mime_type: evidence?.evidence_mime_type,
      evidence_type: evidence?.evidence_type,
      tag: evidence?.tag,
      url: evidence?.url,
    }));
  }

  const evidences: ProgramEvidenceResource[] = [];
  for (const fw of impactLayer.frameworks || []) {
    for (const detail of fw.details || []) {
      if (detail?.evidence_link) {
        evidences.push({
          evidence_name: fw.framework_name,
          tag: fw.framework_name,
          evidence_type: 'PDF',
          url: detail.evidence_link,
        });
      }
    }
  }
  return evidences;
}

function extractLayerIcon(impactLayer: any): string | undefined {
  return (
    impactLayer?.diagramIconUrl ||
    impactLayer?.diagram_icon_url ||
    impactLayer?.diagramIcon ||
    impactLayer?.diagram_icon ||
    impactLayer?.iconUrl ||
    impactLayer?.icon_url ||
    impactLayer?.imageUrl ||
    impactLayer?.image_url ||
    impactLayer?.imgPath ||
    impactLayer?.img_path ||
    impactLayer?.image ||
    impactLayer?.icon
  );
}

// Reshapes the raw API `framework` array into ProgramOutcomeData: each entry is one impact
// layer. Supports both the live API's nested `frameworks[].details[]` shape and a flatter
// `cards[]`/`evidences[]` shape, in case the API moves to that later.
export function buildProgramOutcomeDataFromFramework(framework: any[]): ProgramOutcomeData | undefined {
  if (!Array.isArray(framework) || !framework.length) return undefined;

  const layers: Partial<Record<OutcomesLayerKey, ProgramOutcomeData>> = {};
  let baseLayerData: ProgramOutcomeData | undefined;

  for (const impactLayer of framework) {
    // Prefer the API's own layerKey; fall back to mapping the impact_layer label for older payloads.
    const layerKey = getImpactLayerKey(impactLayer);
    if (!layerKey) continue;

    const outcomes = extractOutcomeCards(impactLayer);
    const evidences = extractEvidences(impactLayer);

    if (!outcomes.length && !evidences.length) continue;

    const icon = extractLayerIcon(impactLayer);
    const layerData: ProgramOutcomeData = {
      title: impactLayer.impact_layer,
      icon,
      iconUrl: icon,
      imgPath: icon,
      diagramIcon: icon,
      diagramIconUrl: icon,
      outcomes,
      evidences
    };

    if (layerKey === PROGRAM_OUTCOME_BASE_LAYER_KEY) {
      baseLayerData = layerData;
    } else {
      layers[layerKey] = layerData;
    }
  }

  if (!baseLayerData && !Object.keys(layers).length) return undefined;

  return {
    layerKey: PROGRAM_OUTCOME_BASE_LAYER_KEY,
    ...baseLayerData,
    layers,
  };
}

export interface OutcomesWebLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface OutcomesWebDot {
  cx: number;
  cy: number;
  r: number;
}

// Coordinates for the decorative "network web" backdrop behind the outer diagram ring.
// Pure static art data — kept here so the component template doesn't carry ~85 lines
// of hardcoded <line>/<circle> markup.
export const OUTCOMES_WEB_BACK_LINES: OutcomesWebLine[] = [
  { x1: 192.6, y1: 109.8, x2: 150.1, y2: 131.5 },
  { x1: 79.7, y1: 289.7, x2: 45.1, y2: 289.3 },
  { x1: 444.9, y1: 501.7, x2: 437.4, y2: 550 },
  { x1: 37.8, y1: 374, x2: 89.7, y2: 351.6 },
  { x1: 477.6, y1: 547.5, x2: 437.4, y2: 550 },
  { x1: 550.4, y1: 422.6, x2: 593.1, y2: 388.3 },
  { x1: 79.7, y1: 289.7, x2: 89.7, y2: 351.6 },
  { x1: 444.9, y1: 501.7, x2: 477.6, y2: 547.5 },
  { x1: 550.4, y1: 422.6, x2: 486.8, y2: 419.7 },
  { x1: 593.1, y1: 388.3, x2: 565.3, y2: 345.5 },
  { x1: 325.2, y1: 80.8, x2: 378.2, y2: 63.4 },
  { x1: 525.9, y1: 507, x2: 477.6, y2: 547.5 },
  { x1: 419.9, y1: 71.4, x2: 378.2, y2: 63.4 },
  { x1: 158.4, y1: 525.9, x2: 201.8, y2: 513.9 },
  { x1: 378.2, y1: 63.4, x2: 365.2, y2: 95.7 },
  { x1: 227, y1: 587.4, x2: 219.8, y2: 548.2 },
  { x1: 325.2, y1: 80.8, x2: 365.2, y2: 95.7 },
  { x1: 419.9, y1: 71.4, x2: 365.2, y2: 95.7 },
  { x1: 489.3, y1: 111, x2: 452.7, y2: 146 },
  { x1: 219.8, y1: 548.2, x2: 201.8, y2: 513.9 },
  { x1: 121.6, y1: 500.6, x2: 158.4, y2: 525.9 },
  { x1: 121.6, y1: 500.6, x2: 83.1, y2: 464.6 },
];

export const OUTCOMES_WEB_BACK_DOTS: OutcomesWebDot[] = [
  { cx: 444.9, cy: 501.7, r: 2.0 },
  { cx: 550.4, cy: 422.6, r: 2.0 },
  { cx: 121.6, cy: 500.6, r: 2.0 },
  { cx: 79.7, cy: 289.7, r: 2.0 },
  { cx: 486.8, cy: 419.7, r: 2.0 },
  { cx: 419.9, cy: 71.4, r: 2.0 },
  { cx: 83.1, cy: 464.6, r: 2.0 },
  { cx: 593.1, cy: 388.3, r: 2.0 },
  { cx: 227, cy: 587.4, r: 2.0 },
  { cx: 219.8, cy: 548.2, r: 2.0 },
  { cx: 208.3, cy: 23.7, r: 2.0 },
  { cx: 489.3, cy: 111, r: 2.0 },
  { cx: 525.9, cy: 507, r: 2.0 },
  { cx: 192.6, cy: 109.8, r: 2.0 },
  { cx: 37.8, cy: 374, r: 2.0 },
  { cx: 89.7, cy: 351.6, r: 2.0 },
  { cx: 325.2, cy: 80.8, r: 2.0 },
  { cx: 477.6, cy: 547.5, r: 2.0 },
  { cx: 150.1, cy: 131.5, r: 2.0 },
  { cx: 452.7, cy: 146, r: 2.0 },
  { cx: 565.3, cy: 345.5, r: 2.0 },
  { cx: 378.2, cy: 63.4, r: 2.0 },
  { cx: 437.4, cy: 550, r: 2.0 },
  { cx: 131.4, cy: 44.1, r: 2.0 },
  { cx: 60.7, cy: 224.5, r: 2.0 },
  { cx: 365.2, cy: 95.7, r: 2.0 },
  { cx: 158.4, cy: 525.9, r: 2.0 },
  { cx: 201.8, cy: 513.9, r: 2.0 },
  { cx: 319.4, cy: 567, r: 2.0 },
  { cx: 45.1, cy: 289.3, r: 2.0 },
];

export const OUTCOMES_WEB_FRONT_LINES: OutcomesWebLine[] = [
  { x1: 303.4, y1: 528.3, x2: 260.1, y2: 513.5 },
  { x1: 7.4, y1: 337.9, x2: 11, y2: 286 },
  { x1: 11, y1: 286, x2: 45.1, y2: 289.3 },
  { x1: 121.6, y1: 500.6, x2: 99.2, y2: 528.8 },
  { x1: 47.2, y1: 423.6, x2: 89.9, y2: 423.7 },
  { x1: 424.4, y1: 474.1, x2: 405.9, y2: 537 },
  { x1: 41.2, y1: 172.2, x2: 60.7, y2: 224.5 },
  { x1: 150.1, y1: 131.5, x2: 113.7, y2: 86.1 },
  { x1: 121.6, y1: 500.6, x2: 152.5, y2: 470.3 },
  { x1: 565.3, y1: 345.5, x2: 527.6, y2: 320.4 },
  { x1: 486.8, y1: 419.7, x2: 469.8, y2: 455.1 },
  { x1: 536.4, y1: 381.1, x2: 565.3, y2: 345.5 },
  { x1: 47.2, y1: 423.6, x2: 37.8, y2: 374 },
  { x1: 371.2, y1: 585.1, x2: 405.9, y2: 537 },
  { x1: 79.7, y1: 289.7, x2: 61.8, y2: 322.6 },
  { x1: 371.2, y1: 585.1, x2: 319.4, y2: 567 },
  { x1: 486.8, y1: 419.7, x2: 536.4, y2: 381.1 },
  { x1: 338.1, y1: 524.5, x2: 303.4, y2: 528.3 },
  { x1: 165, y1: 74.5, x2: 131.4, y2: 44.1 },
  { x1: 303.4, y1: 528.3, x2: 319.4, y2: 567 },
  { x1: 219.8, y1: 548.2, x2: 260.1, y2: 513.5 },
  { x1: 61.8, y1: 322.6, x2: 45.1, y2: 289.3 },
  { x1: 96.3, y1: 185.3, x2: 41.2, y2: 172.2 },
  { x1: 303.4, y1: 528.3, x2: 278.1, y2: 572.4 },
  { x1: 12.1, y1: 399.1, x2: 7.4, y2: 337.9 },
  { x1: 561.9, y1: 210.7, x2: 506.4, y2: 234.3 },
  { x1: 578.2, y1: 287.9, x2: 527.6, y2: 320.4 },
  { x1: 192.6, y1: 109.8, x2: 233.7, y2: 89.3 },
  { x1: 469.8, y1: 455.1, x2: 424.4, y2: 474.1 },
  { x1: 419.9, y1: 71.4, x2: 452.1, y2: 33.1 },
  { x1: 96.3, y1: 185.3, x2: 65.6, y2: 142 },
  { x1: 437.4, y1: 550, x2: 405.9, y2: 537 },
  { x1: 311.6, y1: 42.7, x2: 356.1, y2: 5.4 },
  { x1: 388.2, y1: 15.5, x2: 378.2, y2: 63.4 },
  { x1: 311.6, y1: 42.7, x2: 281.4, y2: 7.4 },
  { x1: 550.4, y1: 422.6, x2: 536.4, y2: 381.1 },
  { x1: 493, y1: 177.6, x2: 541.9, y2: 179.9 },
  { x1: 444.9, y1: 501.7, x2: 405.9, y2: 537 },
  { x1: 506.4, y1: 234.3, x2: 520.3, y2: 279.3 },
  { x1: 260.1, y1: 513.5, x2: 201.8, y2: 513.9 },
  { x1: 102.9, y1: 120.4, x2: 113.7, y2: 86.1 },
  { x1: 311.6, y1: 42.7, x2: 325.2, y2: 80.8 },
  { x1: 227, y1: 587.4, x2: 278.1, y2: 572.4 },
  { x1: 183.8, y1: 574.3, x2: 158.4, y2: 525.9 },
  { x1: 527.6, y1: 320.4, x2: 520.3, y2: 279.3 },
  { x1: 96.3, y1: 185.3, x2: 60.7, y2: 224.5 },
  { x1: 65.6, y1: 142, x2: 102.9, y2: 120.4 },
  { x1: 100.4, y1: 388.4, x2: 89.9, y2: 423.7 },
  { x1: 578.2, y1: 287.9, x2: 565.3, y2: 345.5 },
  { x1: 131.4, y1: 44.1, x2: 113.7, y2: 86.1 },
  { x1: 278.1, y1: 572.4, x2: 319.4, y2: 567 },
  { x1: 152.5, y1: 470.3, x2: 158.4, y2: 525.9 },
  { x1: 338.1, y1: 524.5, x2: 319.4, y2: 567 },
  { x1: 593.1, y1: 388.3, x2: 536.4, y2: 381.1 },
  { x1: 192.6, y1: 109.8, x2: 165, y2: 74.5 },
  { x1: 37.8, y1: 374, x2: 7.4, y2: 337.9 },
  { x1: 227, y1: 587.4, x2: 183.8, y2: 574.3 },
  { x1: 356.1, y1: 5.4, x2: 378.2, y2: 63.4 },
  { x1: 444.9, y1: 501.7, x2: 424.4, y2: 474.1 },
  { x1: 219.8, y1: 548.2, x2: 183.8, y2: 574.3 },
  { x1: 83.1, y1: 464.6, x2: 57.4, y2: 486.1 },
  { x1: 419.9, y1: 71.4, x2: 388.2, y2: 15.5 },
  { x1: 452.7, y1: 146, x2: 493, y2: 177.6 },
  { x1: 100.4, y1: 388.4, x2: 89.7, y2: 351.6 },
  { x1: 99.2, y1: 528.8, x2: 158.4, y2: 525.9 },
  { x1: 489.3, y1: 111, x2: 524, y2: 137.9 },
  { x1: 60.7, y1: 224.5, x2: 28.6, y2: 209.8 },
  { x1: 578.2, y1: 287.9, x2: 592.3, y2: 239.5 },
  { x1: 506.4, y1: 234.3, x2: 493, y2: 177.6 },
  { x1: 561.9, y1: 210.7, x2: 541.9, y2: 179.9 },
  { x1: 356.1, y1: 5.4, x2: 388.2, y2: 15.5 },
  { x1: 165, y1: 74.5, x2: 113.7, y2: 86.1 },
  { x1: 89.7, y1: 351.6, x2: 61.8, y2: 322.6 },
  { x1: 47.2, y1: 423.6, x2: 57.4, y2: 486.1 },
  { x1: 102.9, y1: 120.4, x2: 150.1, y2: 131.5 },
  { x1: 100.4, y1: 388.4, x2: 47.2, y2: 423.6 },
  { x1: 37.8, y1: 374, x2: 12.1, y2: 399.1 },
  { x1: 61.8, y1: 322.6, x2: 7.4, y2: 337.9 },
  { x1: 524, y1: 137.9, x2: 493, y2: 177.6 },
  { x1: 83.1, y1: 464.6, x2: 89.9, y2: 423.7 },
  { x1: 524, y1: 137.9, x2: 541.9, y2: 179.9 },
  { x1: 41.2, y1: 172.2, x2: 28.6, y2: 209.8 },
  { x1: 41.2, y1: 172.2, x2: 65.6, y2: 142 },
  { x1: 578.2, y1: 287.9, x2: 520.3, y2: 279.3 },
  { x1: 152.5, y1: 470.3, x2: 201.8, y2: 513.9 },
  { x1: 561.9, y1: 210.7, x2: 592.3, y2: 239.5 },
  { x1: 61.8, y1: 322.6, x2: 11, y2: 286 },
  { x1: 99.2, y1: 528.8, x2: 57.4, y2: 486.1 },
  { x1: 444.9, y1: 501.7, x2: 469.8, y2: 455.1 },
  { x1: 47.2, y1: 423.6, x2: 12.1, y2: 399.1 },
];

export const OUTCOMES_WEB_FRONT_DOTS: OutcomesWebDot[] = [
  { cx: 100.4, cy: 388.4, r: 1.3 },
  { cx: 338.1, cy: 524.5, r: 1.3 },
  { cx: 561.9, cy: 210.7, r: 1.3 },
  { cx: 469.8, cy: 455.1, r: 1.3 },
  { cx: 96.3, cy: 185.3, r: 1.3 },
  { cx: 47.2, cy: 423.6, r: 1.3 },
  { cx: 311.6, cy: 42.7, r: 1.3 },
  { cx: 41.2, cy: 172.2, r: 1.3 },
  { cx: 183.8, cy: 574.3, r: 1.3 },
  { cx: 65.6, cy: 142, r: 1.3 },
  { cx: 165, cy: 74.5, r: 1.3 },
  { cx: 233.7, cy: 89.3, r: 1.3 },
  { cx: 578.2, cy: 287.9, r: 1.3 },
  { cx: 303.4, cy: 528.3, r: 1.3 },
  { cx: 89.9, cy: 423.7, r: 1.3 },
  { cx: 61.8, cy: 322.6, r: 1.3 },
  { cx: 278.1, cy: 572.4, r: 1.3 },
  { cx: 102.9, cy: 120.4, r: 1.3 },
  { cx: 356.1, cy: 5.4, r: 1.3 },
  { cx: 388.2, cy: 15.5, r: 1.3 },
  { cx: 536.4, cy: 381.1, r: 1.3 },
  { cx: 424.4, cy: 474.1, r: 1.3 },
  { cx: 152.5, cy: 470.3, r: 1.3 },
  { cx: 506.4, cy: 234.3, r: 1.3 },
  { cx: 281.4, cy: 7.4, r: 1.3 },
  { cx: 260.1, cy: 513.5, r: 1.3 },
  { cx: 12.1, cy: 399.1, r: 1.3 },
  { cx: 99.2, cy: 528.8, r: 1.3 },
  { cx: 524, cy: 137.9, r: 1.3 },
  { cx: 7.4, cy: 337.9, r: 1.3 },
  { cx: 57.4, cy: 486.1, r: 1.3 },
  { cx: 527.6, cy: 320.4, r: 1.3 },
  { cx: 371.2, cy: 585.1, r: 1.3 },
  { cx: 493, cy: 177.6, r: 1.3 },
  { cx: 405.9, cy: 537, r: 1.3 },
  { cx: 11, cy: 286, r: 1.3 },
  { cx: 592.3, cy: 239.5, r: 1.3 },
  { cx: 452.1, cy: 33.1, r: 1.3 },
  { cx: 520.3, cy: 279.3, r: 1.3 },
  { cx: 541.9, cy: 179.9, r: 1.3 },
  { cx: 28.6, cy: 209.8, r: 1.3 },
  { cx: 113.7, cy: 86.1, r: 1.3 },
];

export interface OutcomesGlowStop {
  offset: string;
  opacity: number;
}

export interface OutcomesMaskStop {
  offset: string;
  colorVar: string;
}

// Same stop shape for the neutral "rest" glow and the accent "active" glow — only the
// color differs at render time (bound via cssVar in the template), so one interface covers both.
export const OUTCOMES_REST_GLOW_STOPS: OutcomesGlowStop[] = [
  { offset: '0%', opacity: 0.42 },
  { offset: '50%', opacity: 0.28 },
  { offset: '80%', opacity: 0.13 },
  { offset: '100%', opacity: 0 },
];

export const OUTCOMES_ACTIVE_GLOW_STOPS: OutcomesGlowStop[] = [
  { offset: '0%', opacity: 0.34 },
  { offset: '52%', opacity: 0.24 },
  { offset: '80%', opacity: 0.12 },
  { offset: '100%', opacity: 0 },
];

// The outer-ring edge-fade mask: black (fully masked) -> white (fully visible) -> grey ramp back to black.
export const OUTCOMES_MASK_GRADIENT_STOPS: OutcomesMaskStop[] = [
  { offset: '0%', colorVar: '--oc-black' },
  { offset: '55%', colorVar: '--oc-black' },
  { offset: '61%', colorVar: '--oc-white' },
  { offset: '70%', colorVar: '--oc-diagram-grey-light' },
  { offset: '78%', colorVar: '--oc-diagram-grey-mid' },
  { offset: '86%', colorVar: '--oc-diagram-grey-dark' },
  { offset: '94%', colorVar: '--oc-black' },
  { offset: '100%', colorVar: '--oc-black' },
];

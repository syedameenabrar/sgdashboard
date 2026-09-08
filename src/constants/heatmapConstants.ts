export interface HeatmapThemeColor {
  background: string;
  active: string;
}

export const HEATMAP_TEXT = {
  themesTitle: 'Themes beneath the voices',
  voicesTitle: 'What we are hearing',
  themeSelectorLabel: 'Select a theme',
  voicesRaisedSuffix: 'Voices raised',
  quoteIconSrc: '/assets/icons/quote.png',
  quoteIconAlt: 'Quotation mark icon',
};

export const DEFAULT_THEME_COLORS: HeatmapThemeColor[] = [
  { background: '#8CB5EB', active: '#1177FF' },
  { background: '#BFABDA', active: '#572E91' },
  { background: '#AA8BB9', active: '#773995' },
  { background: '#C19085', active: '#961C00' },
  { background: '#DF99BC', active: '#E03389' },
  { background: '#B9D3A4', active: '#278637' }, 
  { background: '#9569CE', active: '#572E91' },
  { background: '#61989F', active: '#0F97AA' }, 
  { background: '#BF81AE', active: '#AC328C' }, 
  { background: '#EBC28C', active: '#FF9911' },
  { background: '#BA776F', active: '#EE4533' },
  { background: '#DFD5AF', active: '#E0B004' },
  { background: '#D2677D', active: '#D11F44' },
  { background: '#AA8BB9', active: '#773995' },
];

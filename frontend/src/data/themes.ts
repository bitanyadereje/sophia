import { ThemeMode } from '../types';

export interface ThemeOption {
  id: ThemeMode;
  label: string;
  shortLabel: string;
  subtitle: string;
  category: 'Modern' | 'Illuminated' | 'Classical' | 'Evening';
  icon: string;
  previewColor: string;
  headerBg: string;
  description: string;
  historicalNote: string;
  palette: { color: string; name: string; hex: string }[];
}

export const THEMES_LIST: ThemeOption[] = [
  {
    id: 'cream',
    label: 'Monastic Cream & Espresso',
    shortLabel: 'Light',
    subtitle: 'Warm vellum canvas, roasted espresso & clean folios',
    category: 'Classical',
    icon: 'light_mode',
    previewColor: '#fbf7ee',
    headerBg: '#faf7f2',
    description: 'Warm monastic parchment cream canvas, roasted espresso typography & clean crystalline reading folios',
    historicalNote: 'Echoes classical Western scriptoria with warm calfskin vellum, hand-ground walnut ink, and tranquil reading desks.',
    palette: [
      { color: '#fbf7ee', name: 'Warm Vellum', hex: '#FBF7EE' },
      { color: '#3e2415', name: 'Roast Espresso', hex: '#3E2415' },
      { color: '#ffffff', name: 'Pure White', hex: '#FFFFFF' },
      { color: '#dfd5c6', name: 'Vellum Border', hex: '#DFD5C6' },
      { color: '#8a705c', name: 'Sepia Walnut', hex: '#8A705C' }
    ]
  },
  {
    id: 'light',
    label: 'Light Blue & Golden',
    shortLabel: 'Light Blue & Gold',
    subtitle: 'Airy azure canvas with imperial gold accents',
    category: 'Modern',
    icon: 'light_mode',
    previewColor: '#e0f2fe',
    headerBg: '#eef6ff',
    description: 'Luminous light azure canvas with radiant imperial gold accents & crisp reading cards',
    historicalNote: 'Reflects the airy Mediterranean light of early Christian basilicas and golden ceiling mosaics.',
    palette: [
      { color: '#e0f2fe', name: 'Light Azure', hex: '#E0F2FE' },
      { color: '#d4af37', name: 'Imperial Gold', hex: '#D4AF37' },
      { color: '#ffffff', name: 'Pure White', hex: '#FFFFFF' },
      { color: '#b8860b', name: 'Dark Goldenrod', hex: '#B8860B' },
      { color: '#0c1e38', name: 'Midnight Ink', hex: '#0C1E38' }
    ]
  },
  {
    id: 'navy',
    label: 'Deep Lapis & Golden',
    shortLabel: 'Lapis & Gold',
    subtitle: 'Stately navy header with royal gold illuminations',
    category: 'Illuminated',
    icon: 'brightness_7',
    previewColor: '#0a1f3d',
    headerBg: '#0a1f3d',
    description: 'Stately lapis lazuli navy header, gold illuminations & crystalline white cards',
    historicalNote: 'Derived from precious ultramarine pigments extracted from Afghan lapis lazuli in medieval scriptoria.',
    palette: [
      { color: '#0a1f3d', name: 'Lapis Navy', hex: '#0A1F3D' },
      { color: '#d4af37', name: 'Imperial Gold', hex: '#D4AF37' },
      { color: '#ffffff', name: 'Crystalline White', hex: '#FFFFFF' },
      { color: '#1e40af', name: 'Royal Sapphire', hex: '#1E40AF' },
      { color: '#16325c', name: 'Deep Cobalt', hex: '#16325C' }
    ]
  },
  {
    id: 'burgundy',
    label: 'Imperial Burgundy & Gold',
    shortLabel: 'Burgundy & Gold',
    subtitle: 'Liturgical crimson, warm rose vellum & gold leaf',
    category: 'Classical',
    icon: 'palette',
    previewColor: '#3b070c',
    headerBg: '#3b070c',
    description: 'Rich Ethiopian liturgical crimson, warm ivory rose vellum & gold illuminations',
    historicalNote: 'Inspired by the imperial purple and crimson codices of Byzantium and Lake Tana monastic treasuries.',
    palette: [
      { color: '#3b070c', name: 'Deep Burgundy', hex: '#3B070C' },
      { color: '#881337', name: 'Imperial Crimson', hex: '#881337' },
      { color: '#d4af37', name: 'Illuminated Gold', hex: '#D4AF37' },
      { color: '#faf5f5', name: 'Rose Ivory', hex: '#FAF5F5' },
      { color: '#ffffff', name: 'Pure White', hex: '#FFFFFF' }
    ]
  },
  {
    id: 'gray',
    label: 'Monastic Slate & Gray',
    shortLabel: 'Clean Gray',
    subtitle: 'Minimalist clean scholar gray with graphite typography',
    category: 'Modern',
    icon: 'filter_b_and_w',
    previewColor: '#e2e8f0',
    headerBg: '#ffffff',
    description: 'Minimalist clean scholar slate gray, cool silver dividers & graphite typography',
    historicalNote: 'Echoes the stone cloisters, quiet limestone writing desks, and unadorned scholarly contemplation.',
    palette: [
      { color: '#f8fafc', name: 'Clean Vellum', hex: '#F8FAFC' },
      { color: '#e2e8f0', name: 'Slate Silver', hex: '#E2E8F0' },
      { color: '#64748b', name: 'Monk Gray', hex: '#64748B' },
      { color: '#334155', name: 'Charcoal Ink', hex: '#334155' },
      { color: '#0f172a', name: 'Deep Graphite', hex: '#0F172A' }
    ]
  },
  {
    id: 'brown',
    label: 'Warm Brown & Cream (ቡና እና ክሬም)',
    shortLabel: 'Brown & Cream',
    subtitle: 'Rich roasted espresso, warm cream vellum & amber tooling',
    category: 'Classical',
    icon: 'coffee',
    previewColor: '#3e2415',
    headerBg: '#382112',
    description: 'Deep roasted Ethiopian coffee brown, warm cream vellum & amber gold leather tooling',
    historicalNote: 'Honors the rich tradition of Ethiopian monastic bookbinding with embossed calfskin leather and soothing warm cream folios.',
    palette: [
      { color: '#3e2415', name: 'Roast Coffee', hex: '#3E2415' },
      { color: '#fbf7ee', name: 'Warm Cream', hex: '#FBF7EE' },
      { color: '#f4ecdd', name: 'Cream Vellum', hex: '#F4ECDD' },
      { color: '#c99a6b', name: 'Toasted Amber', hex: '#C99A6B' },
      { color: '#24150e', name: 'Dark Roast Ink', hex: '#24150E' }
    ]
  },
  {
    id: 'vintage',
    label: 'Antique Parchment (የብራና)',
    shortLabel: 'Parchment (ብራና)',
    subtitle: 'Authentic Ethiopian vellum, sepia ink & rubrication',
    category: 'Classical',
    icon: 'auto_stories',
    previewColor: '#f2e9d7',
    headerBg: '#ebdcc4',
    description: 'Authentic warm honeyed parchment, iron-gall sepia ink & vermilion rubric headings',
    historicalNote: 'Faithfully honors traditional Ethiopian Brana manuscript making with organic goat skin vellum.',
    palette: [
      { color: '#27120a', name: 'Sepia Ink (ጥቁር)', hex: '#27120A' },
      { color: '#8e1c16', name: 'Vermilion Rubric (ቀይ)', hex: '#8E1C16' },
      { color: '#faf4e8', name: 'Cream Parchment', hex: '#FAF4E8' },
      { color: '#ad7820', name: 'Gold Leaf (ወርቅ)', hex: '#AD7820' },
      { color: '#cbb692', name: 'Aged Paper Border', hex: '#CBB692' }
    ]
  },
  {
    id: 'dark',
    label: 'Night Mode (Dark Slate)',
    shortLabel: 'Night Mode',
    subtitle: 'Deep obsidian night slate & candlelight amber',
    category: 'Evening',
    icon: 'dark_mode',
    previewColor: '#0f1013',
    headerBg: '#131519',
    description: 'Deep obsidian night slate, charcoal cards & warm candlelight amber',
    historicalNote: 'Formulated for nighttime study, vigil contemplation, and reduced ocular strain.',
    palette: [
      { color: '#0f1013', name: 'Obsidian Night', hex: '#0F1013' },
      { color: '#181a1f', name: 'Charcoal Folio', hex: '#181A1F' },
      { color: '#dfba4f', name: 'Candlelight Amber', hex: '#DFBA4F' },
      { color: '#353b49', name: 'Slate Border', hex: '#353B49' },
      { color: '#f7f6f2', name: 'Moonlit Script', hex: '#F7F6F2' }
    ]
  }
];

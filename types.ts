export * from './_types_original';

export type Theme = 'light' | 'dark' | 'sepia' | 'slate' | 'rosepine' | 'matrix' | 'orchid';
export type Language = 'en' | 'es';
export type Font = 'sans' | 'serif' | 'mono';

export interface Settings {
    theme: Theme;
    language: Language;
    font: Font;
}
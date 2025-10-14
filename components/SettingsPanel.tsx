import React from 'react';
import { Modal } from './Modal';
import { Settings, Theme } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between py-3 border-b border-[--color-border]">
        <span className="text-[--color-text-base]">{label}</span>
        <div>{children}</div>
    </div>
);

const THEMES: { id: Theme, name: string, colors: [string, string, string] }[] = [
    { id: 'light', name: 'Light', colors: ['#ffffff', '#f3f4f6', '#06b6d4'] },
    { id: 'dark', name: 'Dark', colors: ['#111827', '#1f2937', '#0891b2'] },
    { id: 'sepia', name: 'Sepia', colors: ['#f4ecd8', '#eadec8', '#8c6f5a'] },
    { id: 'slate', name: 'Slate', colors: ['#202b38', '#2a3647', '#38bdf8'] },
    { id: 'rosepine', name: 'Rosé Pine', colors: ['#191724', '#1f1d2e', '#eb6f92'] },
    { id: 'matrix', name: 'Matrix', colors: ['#000000', 'rgba(10, 25, 10, 0.2)', '#39ff14'] },
    { id: 'orchid', name: 'Orchid', colors: ['#fbfaff', '#f2f0f7', '#c738dd'] },
];

const ThemeSwatch: React.FC<{ theme: typeof THEMES[0], isActive: boolean, onClick: () => void }> = ({ theme, isActive, onClick }) => (
    <button
        title={theme.name}
        onClick={onClick}
        className={`w-16 h-10 rounded-lg border-2 p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-panel-bg] focus:ring-[--color-primary] transition-all ${isActive ? 'border-[--color-primary]' : 'border-transparent hover:border-[--color-text-muted]'}`}
        style={{ backgroundColor: theme.colors[0] }}
    >
        <div className="w-full h-full flex items-center justify-center gap-1">
            <span className="w-1/3 h-2/3 rounded" style={{ backgroundColor: theme.colors[1] }}></span>
            <span className="w-1/3 h-2/3 rounded" style={{ backgroundColor: theme.colors[2] }}></span>
        </div>
    </button>
);


export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
    const { t } = useTranslation(settings.language);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('settings.title')}>
            <div className="space-y-4">
                 <div className="py-3 border-b border-[--color-border]">
                    <span className="text-[--color-text-base] mb-3 block">{t('settings.theme')}</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                       {THEMES.map(theme => (
                           <ThemeSwatch
                             key={theme.id}
                             theme={theme}
                             isActive={settings.theme === theme.id}
                             onClick={() => onUpdateSettings({ theme: theme.id })}
                           />
                       ))}
                    </div>
                </div>

                <SettingRow label={t('settings.language')}>
                     <select
                        value={settings.language}
                        onChange={(e) => onUpdateSettings({ language: e.target.value as 'en' | 'es' })}
                        className="bg-[--color-panel-bg] border border-[--color-border] rounded-md p-2 text-[--color-text-base] focus:ring-2 focus:ring-[--color-primary] focus:outline-none"
                    >
                        <option value="en">{t('settings.english')}</option>
                        <option value="es">{t('settings.spanish')}</option>
                    </select>
                </SettingRow>

                <SettingRow label={t('settings.font')}>
                     <select
                        value={settings.font}
                        onChange={(e) => onUpdateSettings({ font: e.target.value as 'sans' | 'serif' | 'mono' })}
                        className="bg-[--color-panel-bg] border border-[--color-border] rounded-md p-2 text-[--color-text-base] focus:ring-2 focus:ring-[--color-primary] focus:outline-none"
                    >
                        <option value="sans">{t('settings.sans')}</option>
                        <option value="serif">{t('settings.serif')}</option>
                        <option value="mono">{t('settings.mono')}</option>
                    </select>
                </SettingRow>

                <SettingRow label={t('settings.dataLocation')}>
                    <span className="text-sm text-[--color-text-muted] bg-[--color-panel-bg] px-2 py-1 rounded">
                        {t('settings.dataLocationValue')}
                    </span>
                </SettingRow>
            </div>
        </Modal>
    );
};
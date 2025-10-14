import React from 'react';

interface DirectoryPickerProps {
  onDirectorySelect: () => Promise<void>;
  t: (key: string) => string;
}

export const DirectoryPicker: React.FC<DirectoryPickerProps> = ({ onDirectorySelect, t }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-[--color-bg] text-center p-4">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold text-[--color-primary] mb-4">
          {t('app.title')}
        </h1>
        <p className="text-xl text-[--color-text-muted] mb-8">
          {t('app.subtitle')}
        </p>
        <div className="bg-[--color-panel-bg] p-8 rounded-lg border border-[--color-border] shadow-lg">
          <h2 className="text-2xl font-semibold text-[--color-text-base] mb-3">
            {t('directoryPicker.title')}
          </h2>
          <p className="text-[--color-text-muted] mb-6">
            {t('directoryPicker.description')}
          </p>
          <button
            onClick={onDirectorySelect}
            className="w-full bg-[--color-primary] hover:bg-[--color-primary-hover] text-[--color-primary-text] font-bold py-3 px-6 rounded-md text-lg transition-transform transform hover:scale-105"
          >
            {t('directoryPicker.button')}
          </button>
           <p className="text-xs text-[--color-text-muted] mt-4">
            {t('directoryPicker.privacy')}
          </p>
        </div>
      </div>
    </div>
  );
};

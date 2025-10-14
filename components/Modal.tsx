import React, { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[--color-panel-bg] rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 border border-[--color-border] relative transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[--color-primary]">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-[--color-text-muted] hover:text-[--color-text-base] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-2 text-[--color-text-base]">
            {children}
        </div>
      </div>
    </div>
  );
};

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
  t: (key: string) => string;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, title, message, defaultValue = '', onSubmit, t }) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            setTimeout(() => {
                document.getElementById('prompt-input')?.focus();
            }, 100);
        }
    }, [isOpen, defaultValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(value);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="prompt-input" className="block text-sm font-medium text-[--color-text-muted]">
                    {message}
                </label>
                <input
                    id="prompt-input"
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-[--color-bg] text-lg text-[--color-text-base] focus:outline-none focus:ring-2 focus:ring-[--color-primary] rounded-md p-3"
                />
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="bg-[--color-panel-hover-bg] hover:bg-[--color-border] text-[--color-text-base] font-bold py-2 px-4 rounded-md transition-colors mr-2">
                        {t('modals.cancel')}
                    </button>
                    <button type="submit" className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-[--color-primary-text] font-bold py-2 px-4 rounded-md transition-colors">
                        {t('modals.submit')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface NewBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  t: (key: string) => string;
}

export const NewBlockModal: React.FC<NewBlockModalProps> = ({ isOpen, onClose, onCreate, t }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim());
      setTitle('');
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset title and focus the input when modal opens
      setTitle('');
      setTimeout(() => {
        const input = document.getElementById('new-block-title-input');
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modals.createBlockTitle')}>
      <form onSubmit={handleSubmit}>
        <input
          id="new-block-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('modals.blockTitlePlaceholder')}
          className="w-full bg-[--color-bg] text-lg text-[--color-text-base] focus:outline-none focus:ring-2 focus:ring-[--color-primary] rounded-md p-3"
        />
        <div className="flex justify-end mt-4">
          <button type="button" onClick={onClose} className="bg-[--color-panel-hover-bg] hover:bg-[--color-border] text-[--color-text-base] font-bold py-2 px-4 rounded-md transition-colors mr-2">
            {t('modals.cancel')}
          </button>
          <button type="submit" className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-[--color-primary-text] font-bold py-2 px-4 rounded-md transition-colors">
            {t('modals.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
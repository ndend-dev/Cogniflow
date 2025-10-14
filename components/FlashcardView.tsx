import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';

interface FlashcardViewProps {
  flashcards: Flashcard[];
  t: (key: string) => string;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ flashcards, t }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };
  
  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[--color-text-muted] text-center p-8">
        <h2 className="text-2xl font-bold mb-4">{t('flashcardView.noFlashcards')}</h2>
        <p>{t('flashcardView.noFlashcardsHint')}</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 bg-[--color-bg]">
      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div 
            className="relative w-full h-64 sm:h-80 transition-transform duration-700"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            {/* Front of card */}
            <div className="absolute w-full h-full p-6 bg-[--color-panel-bg] border border-[--color-primary] rounded-lg shadow-lg flex items-center justify-center text-center" style={{ backfaceVisibility: 'hidden' }}>
                <p className="text-xl sm:text-2xl text-[--color-text-base]">{currentCard.front}</p>
            </div>
            {/* Back of card */}
            <div className="absolute w-full h-full p-6 bg-[--color-primary] border border-[--color-primary-hover] rounded-lg shadow-lg flex items-center justify-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <p className="text-xl sm:text-2xl text-[--color-primary-text]">{currentCard.back}</p>
            </div>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-center flex-wrap gap-4">
        <button onClick={handlePrev} className="bg-[--color-panel-hover-bg] hover:bg-[--color-border] text-[--color-text-base] font-bold py-2 px-6 rounded-md transition-colors">
          {t('flashcardView.prev')}
        </button>
        <span className="text-lg text-[--color-text-muted]">{currentIndex + 1} / {flashcards.length}</span>
        <button onClick={handleNext} className="bg-[--color-panel-hover-bg] hover:bg-[--color-border] text-[--color-text-base] font-bold py-2 px-6 rounded-md transition-colors">
          {t('flashcardView.next')}
        </button>
      </div>
      <button 
        onClick={() => setIsFlipped(!isFlipped)}
        className="mt-4 bg-[--color-primary] hover:bg-[--color-primary-hover] text-[--color-primary-text] font-bold py-3 px-8 rounded-md transition-colors text-lg"
      >
        {isFlipped ? t('flashcardView.showQuestion') : t('flashcardView.showAnswer')}
      </button>
    </div>
  );
};
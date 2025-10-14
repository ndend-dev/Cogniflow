import React from 'react';
import { ContextMenuProps } from '../types';

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  return (
    <div
      style={{ top: y, left: x }}
      className="absolute z-50 bg-[--color-panel-bg] border border-[--color-border] rounded-md shadow-lg py-1"
    >
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full text-left px-4 py-2 text-sm text-[--color-text-base] hover:bg-[--color-primary]/20 transition-colors"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
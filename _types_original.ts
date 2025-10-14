import * as d3 from 'd3';

export interface Block {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Note {
  id: string;
  blockId: string;
  parentId: string | null; // Can be another note's ID
  title: string;
  content: string;
  tags: string[];
  links: string[];
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceNoteId: string;
}

// FIX: Changed GraphNode to a type alias with an intersection to correctly include d3.SimulationNodeDatum properties.
// This resolves errors where properties like 'x', 'y', 'fx', and 'fy' were not found on the GraphNode type in GraphView.tsx.
export type GraphNode = d3.SimulationNodeDatum & {
  id: string;
  title: string;
  level: number; // To determine color and size based on depth
  isBlockNode?: boolean; // To identify the central block node in the graph
};

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  GRAPH = 'GRAPH',
  FLASHCARDS = 'FLASHCARDS',
  BLOCK_OVERVIEW = 'BLOCK_OVERVIEW',
}

export interface AISummary {
    summary: string;
    keyPoints: string[];
    flashcards: { front: string; back: string }[];
}

export interface AIGeneratedNote {
    title: string;
    content: string;
}

export type TreeItem = Block | Note;

export interface ContextMenuProps {
  x: number;
  y: number;
  items: { label: string; action: () => void; }[];
  onClose: () => void;
}
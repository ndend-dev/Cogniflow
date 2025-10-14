import { useState, useEffect, useCallback, useRef } from 'react';
import { Note, Flashcard, Block } from '../types';
import { parseContent } from '../utils/parser';
import { 
    getDirectoryHandle, 
    getHandleFromIDB, 
    saveHandleToIDB, 
    verifyPermission, 
    loadFile, 
    saveFile 
} from '../services/fileSystemService';

// English Data
const initialBlocksEN: Block[] = [
    {
        id: 'block-welcome',
        title: 'Welcome to CogniFlow!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
    }
];

const initialNotesEN: Note[] = [
    {
        id: 'note-welcome',
        blockId: 'block-welcome',
        parentId: null,
        title: 'Getting Started Guide',
        content: `Welcome to **CogniFlow**, your personal AI-powered knowledge hub! This guide will walk you through all the features to help you organize your thoughts, visualize connections, and accelerate your learning.\n\n---\n\n### 1. Core Concepts\n\nCogniFlow is built on a simple yet powerful hierarchy:\n\n- **Blocks**: These are the main categories or projects in your sidebar, like "Work," "University," or "Personal Journal." They are the top-level containers for your notes.\n- **Notes**: The heart of the application. Each note is a document where you can write, format, and structure your ideas using Markdown.\n- **Sub-notes**: You can create notes inside other notes, forming a tree-like structure. This is perfect for breaking down complex topics into smaller, manageable parts.\n\n### 2. The Sidebar: Your Knowledge Tree\n\nThe sidebar on the left is where you'll navigate your knowledge base.\n\n- **Create a Block**: Right-click anywhere in the empty space of the sidebar and select "Add Block," or use the "+ New Block" button.\n- **Create a Note**: Right-click on a **Block** and select "Add Note" to create a top-level note within that block.\n- **Create a Sub-note**: Right-click on an existing **Note** and select "Add Sub-note."\n- **Reorganize with Ease**: Simply **drag and drop** any note or block to reorder it. You can also drop a note onto another note to nest it, or drop it into a different block entirely.\n\n### 3. The Note Editor\n\nThis is where your ideas come to life.\n\n- **Markdown Formatting**: Write using Markdown for headings, lists, bold, italics, and more. Use the **toolbar** above the text area for quick formatting.\n- **Task Lists**: Create checklists with \`- [ ]\` for pending tasks and \`- [x]\` for completed ones. The progress will be visible in the sidebar!\n- **Internal Links**: Create a link to another note by wrapping its title in double brackets, like this: [[Sub-note Example]]. This is the key to building your knowledge graph!\n- **Tags**: Use hashtags like #guide or #productivity to categorize and find notes easily.\n- **View Modes**:\n    - **Edit**: A focused writing mode.\n    - **Split**: See your Markdown code and the live preview side-by-side.\n    - **Preview**: View the fully rendered note.\n\n### 4. AI-Powered Features\n\nLeverage the power of AI to enhance your notes.\n\n- **AI Summary**: Click the **"AI Summary"** button when viewing a note. It will generate:\n    1.  A concise summary of the content.\n    2.  A list of key takeaways.\n    3.  A set of suggested [[Flashcards]] for active recall learning.\n- **AI Generate**: Click **"AI Generate"** to open a modal. You can provide a title and a prompt (e.g., "Explain quantum computing in simple terms") to have the AI write a note for you. You can choose to **replace** the current note's content or **insert** the new content at your cursor's position.\n\n### 5. Main Views\n\nSwitch between different views using the icons in the top toolbar.\n\n- **Editor View (Note Icon)**: The default view for writing and editing.\n- **Graph View (Graph Icon)**: Visualize the connections between your notes within the current block. Any note that you've linked using the \`[[Note Title]]\` syntax will appear as a connected node in the graph.\n- **Flashcards View (Cards Icon)**: Study all the flashcards you've created or generated with AI. Click on the card to flip it.\n- **Block Overview (Grid Icon in Sidebar)**: When you select a Block title, you enter this special view. It shows a dashboard with all the notes in that block and a local graph view. You can even resize the panels!\n\n### 6. Settings & Customization\n\nClick the **gear icon** in the top toolbar to open the settings panel. Here you can:\n\n- **Change the Theme**: Choose from several light and dark themes to suit your style.\n- **Switch Language**: Set your preferred language.\n- **Adjust Font**: Select a font that feels best for your reading and writing.\n\nWe hope you enjoy building your personal knowledge base with CogniFlow! #welcome`,
        tags: ['guide', 'welcome', 'productivity'],
        links: ['Sub-note Example', 'Flashcards'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
    },
    {
        id: 'note-subnote',
        blockId: 'block-welcome',
        parentId: 'note-welcome',
        title: 'Sub-note Example',
        content: 'This is a sub-note nested under the "Getting Started Guide". You can create deep hierarchies to structure your thoughts.',
        tags: [],
        links: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
    },
    {
        id: 'note-flashcards',
        blockId: 'block-welcome',
        parentId: null,
        title: 'Flashcards',
        content: 'This is another note in the "Welcome" block. You can create links between notes, like the one in the main guide that points here: [[Getting Started Guide]].\n\nFlashcards are generated using the **AI Summary** feature on a note.',
        tags: [],
        links: ['Getting Started Guide'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1,
    }
];

// Spanish Data
const initialBlocksES: Block[] = [
    {
        id: 'block-welcome',
        title: '¡Bienvenido a CogniFlow!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
    }
];

const initialNotesES: Note[] = [
    {
        id: 'note-welcome',
        blockId: 'block-welcome',
        parentId: null,
        title: 'Guía de Inicio',
        content: `¡Bienvenido a **CogniFlow**, tu centro de conocimiento personal impulsado por IA! Esta guía te mostrará todas las funciones para ayudarte a organizar tus pensamientos, visualizar conexiones y acelerar tu aprendizaje.\n\n---\n\n### 1. Conceptos Clave\n\nCogniFlow se basa en una jerarquía simple pero poderosa:\n\n- **Bloques**: Son las categorías o proyectos principales en tu barra lateral, como "Trabajo", "Universidad" o "Diario Personal". Son los contenedores de nivel superior para tus notas.\n- **Notas**: El corazón de la aplicación. Cada nota es un documento donde puedes escribir, formatear y estructurar tus ideas usando Markdown.\n- **Sub-notas**: Puedes crear notas dentro de otras notas, formando una estructura de árbol. Esto es perfecto para desglosar temas complejos en partes más pequeñas y manejables.\n\n### 2. La Barra Lateral: Tu Árbol de Conocimiento\n\nLa barra lateral a la izquierda es donde navegarás por tu base de conocimiento.\n\n- **Crear un Bloque**: Haz clic derecho en cualquier espacio vacío de la barra lateral y selecciona "Añadir Bloque", o usa el botón "+ Nuevo Bloque".\n- **Crear una Nota**: Haz clic derecho en un **Bloque** y selecciona "Añadir Nota" para crear una nota de primer nivel dentro de ese bloque.\n- **Crear una Sub-nota**: Haz clic derecho en una **Nota** existente y selecciona "Añadir Sub-nota".\n- **Reorganiza con Facilidad**: Simplemente **arrastra y suelta** cualquier nota o bloque para reordenarlo. También puedes soltar una nota sobre otra para anidarla, o soltarla en un bloque diferente.\n\n### 3. El Editor de Notas\n\nAquí es donde tus ideas cobran vida.\n\n- **Formato Markdown**: Escribe usando Markdown para encabezados, listas, negritas, cursivas y más. Usa la **barra de herramientas** sobre el área de texto para un formato rápido.\n- **Listas de Tareas**: Crea listas de verificación con \`- [ ]\` para tareas pendientes y \`- [x]\` para las completadas. ¡El progreso será visible en la barra lateral!\n- **Enlaces Internos**: Crea un enlace a otra nota envolviendo su título en dobles corchetes, así: [[Ejemplo de Sub-nota]]. ¡Esta es la clave para construir tu grafo de conocimiento!\n- **Etiquetas**: Usa hashtags como #guia o #productividad para categorizar y encontrar notas fácilmente.\n- **Modos de Vista**:\n    - **Editar**: Un modo de escritura enfocado.\n    - **Dividir**: Ve tu código Markdown y la vista previa en vivo uno al lado del otro.\n    - **Previsualizar**: Ve la nota completamente renderizada.\n\n### 4. Funciones con IA\n\nAprovecha el poder de la IA para mejorar tus notas.\n\n- **Resumen con IA**: Haz clic en el botón **"Resumen IA"** al ver una nota. Generará:\n    1.  Un resumen conciso del contenido.\n    2.  Una lista de puntos clave.\n    3.  Un conjunto de [[Tarjetas de Estudio]] sugeridas para el aprendizaje activo.\n- **Generar con IA**: Haz clic en **"Generar con IA"** para abrir un modal. Puedes proporcionar un título y un prompt (ej., "Explica la computación cuántica en términos simples") para que la IA escriba una nota para ti. Puedes elegir **reemplazar** el contenido de la nota actual o **insertar** el nuevo contenido en la posición de tu cursor.\n\n### 5. Vistas Principales\n\nCambia entre diferentes vistas usando los íconos en la barra de herramientas superior.\n\n- **Vista de Editor (Ícono de Nota)**: La vista predeterminada para escribir y editar.\n- **Vista de Grafo (Ícono de Grafo)**: Visualiza las conexiones entre tus notas dentro del bloque actual. Cualquier nota que hayas enlazado usando la sintaxis \`[[Título de la Nota]]\` aparecerá como un nodo conectado en el grafo.\n- **Vista de Tarjetas (Ícono de Tarjetas)**: Estudia todas las tarjetas que has creado o generado con IA. Haz clic en la tarjeta para voltearla.\n- **Resumen del Bloque (Ícono de Cuadrícula en la Barra Lateral)**: Cuando seleccionas el título de un Bloque, entras en esta vista especial. Muestra un panel con todas las notas de ese bloque y una vista de grafo local. ¡Incluso puedes cambiar el tamaño de los paneles!\n\n### 6. Configuración y Personalización\n\nHaz clic en el **ícono de engranaje** en la barra de herramientas superior para abrir el panel de configuración. Aquí puedes:\n\n- **Cambiar el Tema**: Elige entre varios temas claros y oscuros para adaptarlo a tu estilo.\n- **Cambiar Idioma**: Establece tu idioma preferido.\n- **Ajustar Fuente**: Selecciona una fuente que te resulte cómoda para leer y escribir.\n\n¡Esperamos que disfrutes construyendo tu base de conocimiento personal con CogniFlow! #bienvenida`,
        tags: ['guia', 'bienvenida', 'productividad'],
        links: ['Ejemplo de Sub-nota', 'Tarjetas de Estudio'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
    },
    {
        id: 'note-subnote',
        blockId: 'block-welcome',
        parentId: 'note-welcome',
        title: 'Ejemplo de Sub-nota',
        content: 'Esta es una sub-nota anidada bajo la "Guía de Inicio". Puedes crear jerarquías profundas para estructurar tus pensamientos.',
        tags: [],
        links: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
    },
    {
        id: 'note-flashcards',
        blockId: 'block-welcome',
        parentId: null,
        title: 'Tarjetas de Estudio',
        content: 'Esta es otra nota en el bloque "Bienvenido". Puedes crear enlaces entre notas, como el de la guía principal que apunta aquí: [[Guía de Inicio]].\n\nLas tarjetas de estudio se generan usando la función **Resumen con IA** en una nota.',
        tags: [],
        links: ['Guía de Inicio'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1,
    }
];

const getInitialData = () => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') {
        return { blocks: initialBlocksES, notes: initialNotesES, flashcards: [] };
    }
    return { blocks: initialBlocksEN, notes: initialNotesEN, flashcards: [] };
}

type StorageMode = 'loading' | 'localStorage' | 'fileSystem' | 'fileSystem-prompt';

export const useDataManager = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  
  const [storageMode, setStorageMode] = useState<StorageMode>('loading');
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);

  // Initialize storage mode and load data
  useEffect(() => {
    const init = async () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;

      if (isPWA) {
        try {
          const handle = await getHandleFromIDB();
          if (handle && await verifyPermission(handle)) {
            setDirectoryHandle(handle);
            setStorageMode('fileSystem');
            const [loadedBlocks, loadedNotes, loadedFlashcards] = await Promise.all([
              loadFile<Block[]>(handle, 'blocks.json'),
              loadFile<Note[]>(handle, 'notes.json'),
              loadFile<Flashcard[]>(handle, 'flashcards.json'),
            ]);
            
            if (loadedBlocks || loadedNotes || loadedFlashcards) {
                setBlocks(loadedBlocks || []);
                setNotes(loadedNotes || []);
                setFlashcards(loadedFlashcards || []);
            } else {
                const initialData = getInitialData();
                setBlocks(initialData.blocks);
                setNotes(initialData.notes);
                setFlashcards(initialData.flashcards);
            }
          } else {
            setStorageMode('fileSystem-prompt');
          }
        } catch (error) {
          console.error("Error initializing File System Access:", error);
          setStorageMode('fileSystem-prompt');
        }
      } else {
        setStorageMode('localStorage');
        try {
          const storedBlocks = localStorage.getItem('cogniflow-blocks');
          const storedNotes = localStorage.getItem('cogniflow-notes');
          const storedFlashcards = localStorage.getItem('cogniflow-flashcards');
          
          if (storedBlocks || storedNotes || storedFlashcards) {
            setBlocks(storedBlocks ? JSON.parse(storedBlocks) : []);
            setNotes(storedNotes ? JSON.parse(storedNotes) : []);
            setFlashcards(storedFlashcards ? JSON.parse(storedFlashcards) : []);
          } else {
             const initialData = getInitialData();
             setBlocks(initialData.blocks);
             setNotes(initialData.notes);
             setFlashcards(initialData.flashcards);
          }
        } catch (error) {
          console.error("Failed to load data from localStorage", error);
          const initialData = getInitialData();
          setBlocks(initialData.blocks);
          setNotes(initialData.notes);
          setFlashcards(initialData.flashcards);
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const initializeFileSystemStorage = useCallback(async () => {
      try {
          const handle = await getDirectoryHandle();
          await saveHandleToIDB(handle);
          setDirectoryHandle(handle);
          setStorageMode('fileSystem');
          // Reload the App component to re-trigger the init useEffect
          window.location.reload();
      } catch (error) {
          console.error("User cancelled directory picker or an error occurred.", error);
      }
  }, []);
  
  // --- Data Persistence Effects ---
  const useDebouncedSave = (data: any, fileName: string, localStorageKey: string) => {
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isLoading || isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const handler = setTimeout(() => {
            if (storageMode === 'fileSystem' && directoryHandle) {
                saveFile(directoryHandle, fileName, data);
            } else if (storageMode === 'localStorage') {
                localStorage.setItem(localStorageKey, JSON.stringify(data));
            }
        }, 1000); // Debounce saves by 1 second

        return () => {
            clearTimeout(handler);
        };
    }, [data, fileName, localStorageKey]);
  };

  useDebouncedSave(blocks, 'blocks.json', 'cogniflow-blocks');
  useDebouncedSave(notes, 'notes.json', 'cogniflow-notes');
  useDebouncedSave(flashcards, 'flashcards.json', 'cogniflow-flashcards');
  
  // --- Data Mutation Functions ---

  const addBlock = useCallback((title: string): Block => {
    const maxOrder = blocks.reduce((max, b) => Math.max(max, b.order), -1);
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: maxOrder + 1,
    };
    setBlocks(prev => [...prev, newBlock]);
    return newBlock;
  }, [blocks]);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    const notesInBlock = notes.filter(n => n.blockId === blockId);
    const noteIdsInBlock = new Set(notesInBlock.map(n => n.id));
    setNotes(prev => prev.filter(n => n.blockId !== blockId));
    setFlashcards(prev => prev.filter(fc => !noteIdsInBlock.has(fc.sourceNoteId)));
  }, [notes]);

  const addNote = useCallback((title: string, content: string, blockId: string, parentId: string | null): Note => {
    const siblingNotes = notes.filter(n => n.blockId === blockId && n.parentId === parentId);
    const maxOrder = siblingNotes.reduce((max, n) => Math.max(max, n.order), -1);

    const newNote: Note = {
      id: `note-${Date.now()}`,
      blockId,
      parentId,
      title,
      content,
      ...parseContent(content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: maxOrder + 1,
    };
    setNotes(prev => [...prev, newNote]);
    return newNote;
  }, [notes]);
  
  const updateNote = useCallback((id: string, title: string, content: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id
          ? { ...note, title, content, ...parseContent(content), updatedAt: new Date().toISOString() }
          : note
      )
    );
  }, []);

  const getNoteWithDescendants = useCallback((noteId: string, allNotes: Note[]): Note[] => {
    let descendants: Note[] = [];
    const children = allNotes.filter(n => n.parentId === noteId);
    for (const child of children) {
        descendants.push(child);
        descendants = descendants.concat(getNoteWithDescendants(child.id, allNotes));
    }
    return descendants;
  }, []);

  const deleteNote = useCallback((id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return;

    const descendants = getNoteWithDescendants(id, notes);
    const idsToDelete = new Set([id, ...descendants.map(n => n.id)]);

    setNotes(prev => prev.filter(note => !idsToDelete.has(note.id)));
    setFlashcards(prevFcs => prevFcs.filter(fc => !idsToDelete.has(fc.sourceNoteId)));
  }, [notes, getNoteWithDescendants]);

  const moveItem = useCallback((draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    const isBlock = draggedId.startsWith('block-');
    
    if (isBlock) {
      setBlocks(prevBlocks => {
          const draggedBlock = prevBlocks.find(b => b.id === draggedId);
          if (!draggedBlock) return prevBlocks;

          const reordered = prevBlocks.filter(b => b.id !== draggedId);
          const targetIndex = targetId ? reordered.findIndex(b => b.id === targetId) : -1;

          if (targetIndex !== -1) {
              if (position === 'before') {
                  reordered.splice(targetIndex, 0, draggedBlock);
              } else { // after
                  reordered.splice(targetIndex + 1, 0, draggedBlock);
              }
          } else {
             reordered.push(draggedBlock);
          }
          
          return reordered.map((b, index) => ({ ...b, order: index }));
      });
    } else {
        setNotes(prevNotes => {
            const draggedNote = prevNotes.find(n => n.id === draggedId);
            const targetNote = targetId ? prevNotes.find(n => n.id === targetId) : null;
            if (!draggedNote) return prevNotes;

            let newParentId: string | null;
            let newBlockId: string;

            if (position === 'inside') {
                if(targetId && targetId.startsWith('block-')){ 
                    newParentId = null;
                    newBlockId = targetId;
                } else if(targetNote) { 
                    newParentId = targetNote.id;
                    newBlockId = targetNote.blockId;
                } else {
                    return prevNotes;
                }
            } else {
                if(targetId && targetId.startsWith('block-')) { 
                    return prevNotes;
                }
                newParentId = targetNote ? targetNote.parentId : draggedNote.parentId;
                newBlockId = targetNote ? targetNote.blockId : draggedNote.blockId;
            }
            
            const updatedNote = { ...draggedNote, parentId: newParentId, blockId: newBlockId };
            let reordered = prevNotes.filter(n => n.id !== draggedId);
            
            const targetIndex = targetNote ? reordered.findIndex(n => n.id === targetNote.id) : -1;

            if (position === 'inside') {
                reordered.push(updatedNote);
            } else if (targetIndex !== -1) {
                if (position === 'before') {
                    reordered.splice(targetIndex, 0, updatedNote);
                } else {
                    reordered.splice(targetIndex + 1, 0, updatedNote);
                }
            } else {
                reordered.push(updatedNote);
            }
            
            const siblings = reordered.filter(n => n.parentId === newParentId && n.blockId === newBlockId);
            const nonSiblings = reordered.filter(n => !(n.parentId === newParentId && n.blockId === newBlockId));
            
            const orderedSiblings = siblings.map((s, index) => ({...s, order: index}));

            return [...nonSiblings, ...orderedSiblings];
        });
    }
  }, []);

  const addFlashcard = useCallback((front: string, back: string, sourceNoteId: string) => {
    const newFlashcard: Flashcard = {
      id: `fc-${Date.now()}`,
      front,
      back,
      sourceNoteId,
    };
    setFlashcards(prev => [...prev, newFlashcard]);
  }, []);

  return { 
      blocks, 
      notes, 
      flashcards, 
      addBlock, 
      deleteBlock, 
      addNote, 
      updateNote, 
      deleteNote, 
      addFlashcard, 
      moveItem,
      storageMode: storageMode === 'fileSystem-prompt' ? 'fileSystem' : 'localStorage',
      initializeFileSystemStorage,
      isLoading
  };
};
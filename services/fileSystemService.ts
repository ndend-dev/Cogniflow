// FIX: Add type definitions for the File System Access API. These types are not always
// included in the default TypeScript libraries and must be declared to prevent compiler errors.
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
  }

  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }
}

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'cogniflow-fs-handle-db';
const STORE_NAME = 'directory-handles';
const KEY = 'directory-handle';

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDb = (): Promise<IDBPDatabase> => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore(STORE_NAME);
            },
        });
    }
    return dbPromise;
};

export const saveHandleToIDB = async (handle: FileSystemDirectoryHandle): Promise<void> => {
    const db = await getDb();
    await db.put(STORE_NAME, handle, KEY);
};

export const getHandleFromIDB = async (): Promise<FileSystemDirectoryHandle | undefined> => {
    const db = await getDb();
    return await db.get(STORE_NAME, KEY);
};

export const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle> => {
    return await window.showDirectoryPicker();
};

export const verifyPermission = async (handle: FileSystemDirectoryHandle, readWrite = true): Promise<boolean> => {
    const options: FileSystemHandlePermissionDescriptor = {};
    if (readWrite) {
        options.mode = 'readwrite';
    }
    // Check if permission was already granted.
    if ((await handle.queryPermission(options)) === 'granted') {
        return true;
    }
    // Request permission. If the user grants it, return true.
    if ((await handle.requestPermission(options)) === 'granted') {
        return true;
    }
    // The user didn't grant permission, so return false.
    return false;
};

export const saveFile = async <T>(dirHandle: FileSystemDirectoryHandle, fileName: string, content: T): Promise<void> => {
    try {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(content, null, 2));
        await writable.close();
    } catch (error) {
        console.error(`Error saving file ${fileName}:`, error);
    }
};

export const loadFile = async <T>(dirHandle: FileSystemDirectoryHandle, fileName: string): Promise<T | null> => {
    try {
        const fileHandle = await dirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        return JSON.parse(content) as T;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
            // File doesn't exist, which is a normal case on first load.
            return null;
        }
        console.error(`Error loading file ${fileName}:`, error);
        return null;
    }
};

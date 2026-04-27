export interface Note {
  id: number;
  content: string;
  creationDate: string;
  readTick: boolean;
  readDate?: string | null;
}

export interface NoteReadStatusUpdate {
  readTick: boolean;
}

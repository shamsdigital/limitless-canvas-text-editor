export interface Note {
  id: string;
  x: number;
  y: number;
  content: string;
  width: number;
  height: number;
  color: string;
  createdAt: number;
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

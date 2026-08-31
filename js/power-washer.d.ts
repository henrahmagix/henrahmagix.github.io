interface Window {
  powerWasherDestroy?: () => void;
  powerWasherTrigger: HTMLElement;
  canvases: Map<HTMLElement, HTMLCanvasElement>;
}

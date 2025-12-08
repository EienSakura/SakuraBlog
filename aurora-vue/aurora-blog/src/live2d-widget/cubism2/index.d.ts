export default class Cubism2Model {
  constructor();
  initL2dCanvas(canvasId: string): void;
  init(canvasId: string, modelSettingPath: string, modelSetting: any): Promise<void>;
  destroy(): void;
  startDraw(): void;
  draw(): void;
  changeModel(modelSettingPath: string): Promise<void>;
  changeModelWithJSON(modelSettingPath: string, modelSetting: any): Promise<void>;
  modelScaling(scale: number): void;
  modelTurnHead(event: MouseEvent): void;
  followPointer(event: MouseEvent): void;
  lookFront(): void;
  mouseEvent(e: Event): void;
  touchEvent(e: Event): void;
  transformViewX(deviceX: number): number;
  transformViewY(deviceY: number): number;
  transformScreenX(deviceX: number): number;
  transformScreenY(deviceY: number): number;
  gl: WebGLRenderingContext | null;
  canvas: HTMLCanvasElement | null;
}
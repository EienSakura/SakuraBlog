export default class Cubism5Model {
  constructor();
  init(canvasId: string, modelSettingPath: string, modelSetting: any): Promise<void>;
  destroy(): void;
  initialize(): void;
  changeModel(modelSettingPath: string): Promise<void>;
  subdelegates: any[];
}

export class AppDelegate extends Cubism5Model {
  constructor();
}
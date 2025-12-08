// Live2D 全局变量声明
(window as any).Live2D = {
  init: function() {},
  setGL: function() {},
  getPlatformManager: function() { return null; }
};

(window as any).AMotion = class {
  expired: boolean;
  fadeOut: number;
  offsetTime: number;
  loop: boolean;
  
  constructor() {
    this.expired = false;
    this.fadeOut = 0;
    this.offsetTime = 0;
    this.loop = false;
  }
  
  updateParamExe(model: any, time: any, weight: any, motionQueueEnt: any) {
    return false;
  }
};

(window as any).MotionQueueManager = class {
  motions: any[];
  motionsToStart: any[];
  finishedMotions: any[];
  
  constructor() {
    this.motions = [];
    this.motionsToStart = [];
    this.finishedMotions = [];
  }
  
  startMotion(motion: any, priority: any, autoDelete: any) {
    return 0;
  }
  
  updateParam(model: any) {
    return false;
  }
  
  releaseMotions() {}
};

(window as any).UtSystem = {
  getUserTimeMSec: function() { return Date.now(); },
  getTimeMSec: function() { return Date.now(); }
};

(window as any).UtDebug = {
  print: function(msg: any) { console.log(msg); },
  trace: function(msg: any) { console.trace(msg); }
};

(window as any).PhysicsHair = class {
  setup: any;
  params: any;
  physicsHairs: any[];
  
  constructor() {
    this.setup = null;
    this.params = null;
    this.physicsHairs = [];
  }
  
  setupMethod(target: any, setup: any) {}
  update(target: any, deltaTime: any) {}
};

(window as any).PartsDataID = class {
  paramID: string;
  partID: string;
  
  constructor(id: string) {
    this.paramID = id;
    this.partID = id;
  }
};

(window as any).L2DTargetPoint = class {
  faceTargetX: number;
  faceTargetY: number;
  faceX: number;
  faceY: number;
  faceVX: number;
  faceVY: number;
  lastTimeSec: number;
  
  constructor() {
    this.faceTargetX = 0;
    this.faceTargetY = 0;
    this.faceX = 0;
    this.faceY = 0;
    this.faceVX = 0;
    this.faceVY = 0;
    this.lastTimeSec = 0;
  }
  
  set(x: any, y: any) {
    this.faceTargetX = x;
    this.faceTargetY = y;
  }
  
  get() {
    return { x: this.faceX, y: this.faceY };
  }
  
  update() {}
};

(window as any).L2DMatrix44 = class {
  tr: number[];
  
  constructor() {
    this.tr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.loadIdentity();
  }
  
  loadIdentity() {
    for (let i = 0; i < 16; i++) {
      this.tr[i] = 0;
    }
    this.tr[0] = this.tr[5] = this.tr[10] = this.tr[15] = 1;
  }
  
  multTranslate(tx: any, ty: any) {
    this.tr[12] = this.tr[0] * tx + this.tr[4] * ty + this.tr[12];
    this.tr[13] = this.tr[1] * tx + this.tr[5] * ty + this.tr[13];
  }
  
  multScale(sx: any, sy: any) {
    this.tr[0] *= sx;
    this.tr[1] *= sx;
    this.tr[4] *= sy;
    this.tr[5] *= sy;
  }
  
  transformX(x: any) {
    return this.tr[0] * x + this.tr[12];
  }
  
  transformY(y: any) {
    return this.tr[5] * y + this.tr[13];
  }
  
  invertTransformX(x: any) {
    return (x - this.tr[12]) / this.tr[0];
  }
  
  invertTransformY(y: any) {
    return (y - this.tr[13]) / this.tr[5];
  }
  
  multMatrix(mat: any) {
    const tmp = [];
    for (let i = 0; i < 16; i++) {
      tmp[i] = 0;
    }
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          tmp[i + j * 4] += this.tr[i + k * 4] * mat.tr[k + j * 4];
        }
      }
    }
    
    for (let i = 0; i < 16; i++) {
      this.tr[i] = tmp[i];
    }
  }
  
  getArray() {
    return this.tr;
  }
};

(window as any).L2DViewMatrix = class extends (window as any).L2DMatrix44 {
  maxScale: number;
  minScale: number;
  screenLeft: number;
  screenRight: number;
  screenTop: number;
  screenBottom: number;
  maxLeft: number;
  maxRight: number;
  maxTop: number;
  maxBottom: number;
  
  constructor() {
    super();
    this.maxScale = 2;
    this.minScale = 0.8;
    this.screenLeft = -1;
    this.screenRight = 1;
    this.screenTop = 1;
    this.screenBottom = -1;
    this.maxLeft = -2;
    this.maxRight = 2;
    this.maxTop = 2;
    this.maxBottom = -2;
  }
  
  setScreenRect(left: any, right: any, bottom: any, top: any) {
    this.screenLeft = left;
    this.screenRight = right;
    this.screenTop = top;
    this.screenBottom = bottom;
  }
  
  setMaxScreenRect(left: any, right: any, bottom: any, top: any) {
    this.maxLeft = left;
    this.maxRight = right;
    this.maxTop = top;
    this.maxBottom = bottom;
  }
  
  setMaxScale(scale: any) {
    this.maxScale = scale;
  }
  
  setMinScale(scale: any) {
    this.minScale = scale;
  }
  
  isMaxScale() {
    return this.getScaleX() >= this.maxScale;
  }
  
  isMinScale() {
    return this.getScaleX() <= this.minScale;
  }
  
  adjustScale(centerX: any, centerY: any, scale: any) {
    const scaleX = this.getScaleX();
    if (scaleX < this.minScale) {
      scale = this.minScale / scaleX;
    } else if (scaleX > this.maxScale) {
      scale = this.maxScale / scaleX;
    }
    this.multScale(scale, scale);
  }
  
  getScaleX() {
    return this.tr[0];
  }
  
  getScaleY() {
    return this.tr[5];
  }
  
  adjustTranslate(centerX: any, centerY: any, tx: any, ty: any) {
    this.tr[12] += tx;
    this.tr[13] += ty;
  }
};

(window as any).L2DEyeBlink = class {
  blinkIntervalMsec: number;
  eyeState: number;
  blinkStartTime: number;
  blinkFrameTime: number;
  eyeParamL: any;
  eyeParamR: any;
  nextBlinkTime: number;
  closedTimes: number;
  openingTimes: number;
  closeStartMsec: number;
  closeEndMsec: number;
  openStartMsec: number;
  openEndMsec: number;
  
  constructor() {
    this.blinkIntervalMsec = 2000;
    this.eyeState = 0;
    this.blinkStartTime = 0;
    this.blinkFrameTime = 1;
    this.eyeParamL = null;
    this.eyeParamR = null;
    this.nextBlinkTime = 0;
    this.closedTimes = 1;
    this.openingTimes = 1;
    this.closeStartMsec = 0;
    this.closeEndMsec = 100;
    this.openStartMsec = 150;
    this.openEndMsec = 200;
  }
  
  setParam(eyeL: any, eyeR: any) {
    this.eyeParamL = eyeL;
    this.eyeParamR = eyeR;
  }
  
  setInterval(blinkIntervalMsec: any, eyeState: any) {
    this.blinkIntervalMsec = blinkIntervalMsec;
    this.eyeState = eyeState;
  }
  
  setEyeParams(eyeL: any, eyeR: any) {
    this.eyeParamL = eyeL;
    this.eyeParamR = eyeR;
  }
  
  updateParam(model: any) {
    const time = Date.now();
    
    if (this.nextBlinkTime < time) {
      this.nextBlinkTime = time + Math.random() * (this.blinkIntervalMsec - 500) + 500;
      this.eyeState = 1;
      this.blinkStartTime = time;
    }
    
    let t = 0;
    switch (this.eyeState) {
      case 0:
        t = 0;
        break;
      case 1:
        t = (time - this.blinkStartTime) / this.closeEndMsec;
        if (t >= 1) {
          t = 1;
          this.eyeState = 2;
          this.blinkStartTime = time;
        }
        break;
      case 2:
        t = (time - this.blinkStartTime) / this.openStartMsec;
        if (t >= 1) {
          t = 1;
          this.eyeState = 0;
        }
        break;
    }
    
    if (this.eyeParamL && this.eyeParamR) {
      const v = 1.0 - t;
      this.eyeParamL.addTo(0, v);
      this.eyeParamR.addTo(0, v);
    }
  }
};

// 添加 Asteroids 游戏的全局变量
(window as any).Asteroids = null;
(window as any).ASTEROIDSPLAYERS = [];

// 立即初始化 Live2D 全局变量
console.log('Live2D globals initialized');

export default function initLive2DGlobals() {
  // 初始化 Live2D 全局变量
  console.log('Live2D globals initialized');
}
/**
 * @file Define the type of the global window object.
 * @module types/window
 */
/**
 * @file Define types for window object.
 * @module types/window
 */
declare global {
  interface Window {
    initWidget: (options: any) => void;
    Live2D: any;
    AMotion: any;
    MotionQueueManager: any;
    UtSystem: any;
    UtDebug: any;
    PhysicsHair: any;
    PartsDataID: any;
    L2DTargetPoint: any;
    L2DMatrix44: any;
    L2DViewMatrix: any;
    L2DEyeBlink: any;
    L2DBaseModel: any;
    Live2DMotion: any;
  }
}

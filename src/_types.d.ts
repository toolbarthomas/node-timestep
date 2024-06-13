export type TimestepRequestProperties = {
  onUpdate?: TimestepUpdateHandler;
  onRender?: TimestepRenderHandler;
  fps?: number;
  offset?: number;
};

export type NextHandler = () => void;

export type Timestep = {
  loop: () => void;
  resume: () => void;
  stop: () => void;
  interval: number;
  averageFPS: number;
  currentCycle: number;
  currentFrame: number;
  currentIndex: number;
  delta: number;
  isActive: boolean;
  lastTime: [number, number];
  lastUpdate: [number, number];
  next: undefined | NextHandler;
  targetFPS: number;
  throttle: undefined | ReturnType<typeof setTimeout>;
  willRender: boolean;
  willUpdate: boolean;
};

export type TimeStepRequest = {
  stop: Timestep["stop"];
  resume: Timestep["resume"];
  isActive: () => Timestep["isActive"];
  updateFPS: (fps?: number) => void;
};

export type TimestepRenderResponse = {
  currentFPS: number;
  averageFPS: number;
  timestamp: number;
  delta: number;
  duration: number;
  currentIndex: number;
  currentFrame: number;
  offset: number;
};

export type TimestepUpdateResponse = {
  currentFPS: number;
  timestamp: number;
  delta: number;
  duration: number;
  currentIndex: number;
  currentFrame: number;
  offset: number;
};

export type TimestepUpdateHandler = (response: TimestepUpdateResponse) => void;
export type TimestepRenderHandler = (response: TimestepRenderResponse) => void;

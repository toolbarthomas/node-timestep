import {
  Timestep,
  TimeStepRequest,
  TimestepRequestProperties,
  TimestepRenderResponse,
} from "./_types";

/**
 * Internal helper function to convert a high resolution timestamp to milliseconds.
 *
 * @param hrtime Optional high resolution timestamp to convert.
 * @returns Millisecond value of the given high resolution timestamp.
 */
export const hrtimeToMs = (hrtime?: number[]) => {
  const time = hrtime || process.hrtime();
  return time[0] * 1000 + time[1] / 1000000;
};

/**
 * Constructs a new timestep instance for managing game loop in Node.js.
 *
 * @param props Optional properties for handling callbacks and custom runtime behavior.
 * @returns An object with methods to control the timestep instance.
 */
export const requestTimestep = (
  props: TimestepRequestProperties
): TimeStepRequest => {
  // Initialize properties
  const MAX_NUMBER = Number.MAX_VALUE;
  const MAX_THREADS = 2;
  const MAX_TOLERANCE = 1;

  const fps = (typeof props.fps === "number" ? props.fps : 30) * MAX_TOLERANCE;
  const frameIntervals: number[] = [];
  const start = process.hrtime();

  // Timestep object with methods
  const timestep: Timestep = {
    lastTime: start,
    next: undefined,
    lastUpdate: start,
    willUpdate: false,
    willRender: false,
    isActive: false,
    averageFPS: 0,
    currentIndex: -1,
    currentCycle: 0,
    currentFrame: -1,
    targetFPS: fps,
    throttle: undefined,
    delta: 0,
    interval: 1000 / fps,

    // Main loop function
    loop: function () {
      // Check conditions to run loop
      if (!props || (!props.onRender && !props.onUpdate) || !this.isActive) {
        return;
      }

      // Update cycle and frame counters
      if (this.currentIndex >= MAX_NUMBER) {
        this.currentIndex = 0;
        this.currentCycle += 1;
      }

      if (this.currentFrame >= MAX_NUMBER) {
        this.currentFrame = 0;
      }

      this.currentIndex += 1;

      // Calculate time deltas
      const now = process.hrtime();
      const delta = hrtimeToMs(process.hrtime(this.lastTime));
      const updateDelta = hrtimeToMs(process.hrtime(this.lastUpdate));

      // Store current frame and cycle indices
      const currentFrame = this.currentFrame;
      const currentIndex = this.currentIndex;

      // Calculate duration and offset
      let duration = hrtimeToMs(now) - hrtimeToMs(start);
      let offset = 1;
      const multiplier = this.interval / delta;

      // Throttling logic for update
      if (!this.willRender && updateDelta <= this.interval / MAX_THREADS) {
        this.throttle && clearTimeout(this.throttle);
        this.throttle = setTimeout(() => timestep.next && timestep.next(), 1);
        return;
      }

      // Update callback logic
      if (!this.willUpdate && !this.willRender) {
        this.willUpdate = true;
        const callbackDelta = Math.abs(updateDelta - delta);

        if (props && props.onUpdate) {
          props.onUpdate({
            timestamp: hrtimeToMs(process.hrtime()),
            currentFPS: 1000 / updateDelta,
            currentFrame: currentFrame + 1,
            currentIndex,
            delta: updateDelta,
            duration,
            offset: parseFloat(
              (this.targetFPS / (1000 / updateDelta)).toFixed(8)
            ),
          });
        }

        this.willUpdate = false;
        this.lastUpdate = process.hrtime();

        // Render callback on separate callstack
        if (callbackDelta >= 1) {
          this.willRender = true;
          // setImmediate(() => this.loop());
          this.loop();
          return;
        }
      }

      // Continue loop or set immediate render
      if (delta <= this.interval) {
        setImmediate(() => this.loop());
        return;
      }

      // Calculate current FPS and offset
      let currentFPS = 1000 / delta;

      offset = parseFloat((currentFPS / this.targetFPS).toFixed(8));

      // Maintain frame intervals and call render callback
      if (frameIntervals.length >= 10) {
        frameIntervals.shift();
      }

      frameIntervals.push(currentFPS);

      if (props && props.onRender) {
        props.onRender({
          currentIndex,
          timestamp: hrtimeToMs(process.hrtime()),
          currentFPS,
          averageFPS:
            frameIntervals.reduce((a, b) => b + a, 0) / frameIntervals.length,
          delta,
          duration,
          currentFrame: currentFrame + 1,
          offset,
        });

        this.willRender = false;
      }

      // Update frame index and last time
      this.currentFrame += 1;
      this.lastTime = process.hrtime();

      this.loop();
      // // Continue loop with setImmediate
      // setImmediate(() => {
      //   // this.loop();
      // });
    },

    // Resume timestep execution
    resume: function () {
      if (this.isActive) {
        return;
      }

      this.isActive = true;
      this.lastTime = process.hrtime();
      this.lastUpdate = process.hrtime();
      this.loop();
    },

    // Stop timestep execution
    stop: function () {
      this.isActive = false;
    },
  };

  // Set next timestep loop iteration
  timestep.next = new Array(Math.floor(timestep.interval * MAX_THREADS))
    .fill(setImmediate)
    .reduce((acc, fn) => () => fn(acc), timestep.loop.bind(timestep));

  // Start timestep immediately
  setImmediate(() => {
    timestep.resume();
  });

  // Return timestep control methods
  return {
    isActive: () => timestep.isActive,
    updateFPS: (targetFPS?: number) => {
      if (targetFPS) {
        timestep.targetFPS = (Math.abs(targetFPS) || fps) * MAX_TOLERANCE;
        timestep.interval = 1000 / timestep.targetFPS;
        timestep.next = new Array(Math.floor(timestep.interval * MAX_THREADS))
          .fill(setImmediate)
          .reduce((acc, fn) => () => fn(acc), timestep.loop.bind(timestep));
      }
    },
    stop: timestep.stop.bind(timestep),
    resume: timestep.resume.bind(timestep),
  };
};

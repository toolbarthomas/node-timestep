import {
  Timestep,
  TimeStepRequest,
  TimestepRequestProperties,
  TimestepRenderResponse,
} from "./_types";

/**
 * Internal helper function to ensure the given high resolution timestamp
 * is converted to a millisecond value.
 *
 * @param hrtime Converts the given high resolution timestamp.
 */
export const hrtimeToMs = (hrtime?: number[]) => {
  const time = hrtime || process.hrtime();

  return time[0] * 1000 + time[1] / 1000000;
};

/**
 * Constructs a new timestep instance for the running Node process.
 *
 * @param props Use the optional request properties for additional callback
 * handling and/or custom runtime behaviour like FPS control.
 */
export const requestTimestep = (
  props: TimestepRequestProperties
): TimeStepRequest => {
  const fps = typeof props.fps === "number" ? props.fps : 30;
  const frameIntervals: number[] = [];
  const start = process.hrtime();
  const MAX_NUMBER = Number.MAX_VALUE;
  const MAX_THREADS = 2;

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
    loop: function () {
      if (!props || (!props.onRender && !props.onUpdate)) {
        return;
      }

      if (!this.isActive) {
        return;
      }

      if (this.currentIndex >= MAX_NUMBER) {
        this.currentIndex = 0;
        this.currentCycle += 1;
      }

      if (this.currentFrame >= MAX_NUMBER) {
        this.currentFrame = 0;
      }

      this.currentIndex += 1;

      const now = process.hrtime();
      const delta = hrtimeToMs(process.hrtime(this.lastTime));
      const updateDelta = hrtimeToMs(process.hrtime(this.lastUpdate));
      const currentFrame = this.currentFrame;
      const currentIndex = this.currentIndex;

      let duration = hrtimeToMs(now) - hrtimeToMs(start);
      let offset = 1;
      const multiplier = this.interval / delta;

      if (!this.willRender && updateDelta <= this.interval / MAX_THREADS) {
        this.throttle && clearTimeout(this.throttle);
        this.throttle = setTimeout(() => timestep.next && timestep.next(), 1);

        return;
      }

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
            offset: parseFloat((updateDelta / this.interval).toFixed(8)),
          });
        }

        this.willUpdate = false;
        this.lastUpdate = process.hrtime();

        // Ensure the onUpdate & onRender callbacks are used on a seperate
        // callstack.
        if (callbackDelta >= 1) {
          this.willRender = true;

          setImmediate(() => this.loop());

          return;
        }
      }

      let currentFPS = 1000 / delta;

      // let i = 0
      // console.log('BAR', delta)
      // while (hrtimeToMs(process.hrtime(this.lastTime)) <= interval) {
      //   console.log('SHOULD UPDATE', i)

      //   i += 1
      // }

      if (delta > this.interval) {
        offset = parseFloat((delta / this.interval).toFixed(8));
      }

      // console.log('LOOP', this, delta, interval, offset, multiplier)
      if (delta <= this.interval) {
        setImmediate(() => this.loop());

        return;
      }

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

      this.currentFrame += 1;
      this.lastTime = process.hrtime();

      setImmediate(() => {
        this.loop();
      });
    },
    resume: function () {
      if (this.isActive) {
        return;
      }

      this.isActive = true;

      this.lastTime = process.hrtime();
      this.lastUpdate = process.hrtime();

      this.loop();
    },
    stop: function () {
      if (!this.isActive) {
        return;
      }

      this.isActive = false;
    },
  };

  timestep.next = new Array(Math.floor(timestep.interval * MAX_THREADS))
    .fill(setImmediate)
    .reduce((acc, fn) => () => fn(acc), timestep.loop.bind(timestep));

  setImmediate(() => {
    timestep.resume();
  });

  return {
    isActive: () => timestep.isActive,
    updateFPS: (targetFPS?: number) => {
      if (targetFPS) {
        timestep.targetFPS = Math.abs(targetFPS) || fps;
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

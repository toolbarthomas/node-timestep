import assert from "assert";
import { describe, it } from "mocha";

import { requestTimestep } from "src/index";

describe("Can construct a new Timestep instance within the current process:", function () {
  const maxDuration = 9000;
  this.timeout(maxDuration * 2);

  it("requestTimestep @30 FPS", async () =>
    new Promise<void>((resolve) => {
      const targetFPS = 66;
      let updateFPS = 0;
      let renderFPS = 0;
      let averageFPS = 0;
      const updateTimestamps: number[] = [];
      const renderTimestamps: number[] = [];

      const timestep = requestTimestep({
        onUpdate: function (response) {
          updateTimestamps.push(response.timestamp);

          // Update FPS should be at least higher then expected targetFPS.
          assert.equal(response.currentFPS > targetFPS, true);
          assert.equal(
            response.offset >= 0.25 && response.offset <= 0.75,
            true
          );
          updateFPS = 1000 / response.delta;
        },
        onRender: function (response) {
          renderTimestamps.push(response.timestamp);
          renderFPS = 1000 / response.delta;
          averageFPS = response.averageFPS;

          // Accept a 50% framedrop tolerance;
          assert.equal(
            targetFPS - Math.floor(response.currentFPS) <= targetFPS * 0.5,
            true
          );
        },
        fps: targetFPS,
      });

      setTimeout(() => {
        assert.equal(timestep.isActive(), true);
        timestep.stop();
        assert.equal(timestep.isActive(), false);
        assert.equal(updateTimestamps.length > 0, true);
        assert.equal(
          updateTimestamps.join(""),
          updateTimestamps.sort().join("")
        );

        assert.equal(renderTimestamps.length > 0, true);
        assert.equal(
          renderTimestamps.join(""),
          renderTimestamps.sort().join("")
        );

        const treshhold = Math.ceil(Math.abs(averageFPS - renderFPS));
        assert.equal(renderFPS > 0, true);
        assert.equal(averageFPS > 0, true);
        assert.equal(averageFPS >= targetFPS - targetFPS * 0.1, true);

        console.log(averageFPS);

        resolve();
      }, maxDuration);
    }));
});

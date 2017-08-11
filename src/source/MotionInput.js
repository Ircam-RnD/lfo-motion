import motionInput from 'motion-input';
import { BaseLfo, SourceMixin } from 'waves-lfo/core';

const definitions = {};

/**
 * Module that wraps the [motion-input](https://github.com/collective-soundworks/motion-input)
 * library and creates a stream of vectors from the accelerometers and gyroscope.
 *
 * Output is defined in the same order, unit and directions as in the
 * [DeviceMotion specification](https://w3c.github.io/deviceorientation/spec-source-orientation.html):
 *
 * * 0 - accelerometer X
 * * 1 - accelerometer Y
 * * 2 - accelerometer Z
 * * 3 - gyro around Z (alpha - yaw)
 * * 4 - gyro around X (beta - pitch)
 * * 5 - gyro around Y (gamma - roll)
 *
 * @example
 * import * as lfo from 'waves-lfo';
 * import * as lfoMotion from 'lfo-motion';
 *
 * const motionInput = new lfoMotion.source.MotionInput();
 * const logger = new lfo.sink.Logger({ time: false, data: true });
 *
 * motionInput.connect(logger);
 *
 * motionInput.init()
 *   .then(() => motionInput.start())
 *   .catch(err => console.log(err.stack));
 */
class MotionInput extends SourceMixin(BaseLfo) {
  constructor(options = {}) {
    super(definitions, options);
  }

  initModule() {
    const nextPromises = super.initModule();
    // console.log(nextPromises);
    // return;

    const promise = new Promise((resolve, reject) => {
      motionInput
        .init(['accelerationIncludingGravity', 'rotationRate'])
        .then(([accelerationIncludingGravity, rotationRate]) => {
          this.accelerationIncludingGravity = accelerationIncludingGravity;
          this.rotationRate = rotationRate;
          resolve();
        })
        .catch(err => console.error(err.stack));
    });

    // nextPromises.push(promise);

    return Promise.all([nextPromises, promise]);
  }

  processStreamParams() {
    this.streamParams.frameType = 'vector';
    this.streamParams.frameSize = 6;
    this.streamParams.frameRate = 1 / this.accelerationIncludingGravity.period;
    this.streamParams.sourceSampleRate = this.streamParams.frameRate;
    this.streamParams.sourceSampleCount = 1;
    this.streamParams.description = [
      'accelerationIncludingGravity x',
      'accelerationIncludingGravity y',
      'accelerationIncludingGravity z',
      'rotationRate alpha',
      'rotationRate beta',
      'rotationRate gamma',
    ];

    this.propagateStreamParams();
  }


  start(startTime = null) {
    if (this.initialized === false) {
      if (this.initPromise === null) // init has not yet been called
        this.initPromise = this.init();

      return this.initPromise.then(() => this.start(startTime));
    }

    const frame = this.frame;
    const accelerationIncludingGravity = this.accelerationIncludingGravity;
    const rotationRate = this.rotationRate;

    this._startTime = performance.now();

    if (accelerationIncludingGravity.isValid && rotationRate.isValid) {
      accelerationIncludingGravity.addListener(([x, y, z]) => {
        frame.time = (performance.now() - this._startTime) / 1000;

        frame.data[0] = x;
        frame.data[1] = y;
        frame.data[2] = z;
      });

      rotationRate.addListener(([alpha, beta, gamma]) => {
        frame.data[3] = alpha;
        frame.data[4] = beta;
        frame.data[5] = gamma;

        this.propagateFrame();
      });
    } else if (accelerationIncludingGravity.isValid) {
      accelerationIncludingGravity.addListener(([x, y, z]) => {
        frame.time = (performance.now() - this._startTime) / 1000;

        frame.data[0] = x;
        frame.data[1] = y;
        frame.data[2] = z;
        frame.data[3] = 0;
        frame.data[4] = 0;
        frame.data[5] = 0;

        this.propagateFrame();
      });
    } else {
      throw new Error(`The device doesn't support the devicemotion API`)
    }

    this.started = true;
  }

  stop() {
    this.started = false;
    this._startTime = null;
  }

  // processFrame() {}
}

export default MotionInput;

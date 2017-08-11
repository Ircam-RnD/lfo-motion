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

    this._accListener = this._accListener.bind(this);
    this._gyroListener = this._gyroListener.bind(this);
    this._accOnlyListener = this._accOnlyListener.bind(this);
  }

  /** @private */
  initModule() {
    const nextPromises = super.initModule();

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

  /** @private */
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

  /**
   * Start the stream.
   */
  start() {
    this._startTime = performance.now();

    if (this.initialized === false) {
      if (this.initPromise === null) // init has not yet been called
        this.initPromise = this.init();

      return this.initPromise.then(() => this.start(this._startTime));
    }

    const frame = this.frame;
    const acc = this.accelerationIncludingGravity;
    const rot = this.rotationRate;

    if (acc.isValid && rot.isValid) {
      acc.addListener(this._accListener);
      rot.addListener(this._gyroListener);
    } else if (acc.isValid) {
      acc.addListener(this._accOnlyListener);
    } else {
      throw new Error(`The device doesn't support the devicemotion API`);
    }

    this.started = true;
  }

  /**
   * Stop the stream.
   */
  stop() {
    this.started = false;
    this._startTime = null;

    const acc = this.accelerationIncludingGravity;
    const rot = this.rotationRate;

    if (acc.isValid && rot.isValid) {
      acc.removeListener(this._accListener);
      rot.removeListener(this._gyroListener);
    } else if (acc.isValid) {
      acc.removeListener(this._accOnlyListener);
    }
  }

  /** @private */
  _accListener(data) {
    frame.time = (performance.now() - this._startTime) / 1000;

    frame.data[0] = data[0];
    frame.data[1] = data[1];
    frame.data[2] = data[2];
  }

  /** @private */
  _gyroListener(data) {
    frame.data[3] = data[0];
    frame.data[4] = data[1];
    frame.data[5] = data[2];

    this.propagateFrame();
  }

  /** @private */
  _accOnlyListener(data) {
    frame.time = (performance.now() - this._startTime) / 1000;

    frame.data[0] = data[0];
    frame.data[1] = data[1];
    frame.data[2] = data[2];
    frame.data[3] = 0;
    frame.data[4] = 0;
    frame.data[5] = 0;

    this.propagateFrame();
  }
}

export default MotionInput;

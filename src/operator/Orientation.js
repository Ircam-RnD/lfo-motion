import { BaseLfo } from 'waves-lfo/core';

// port of orientation.cpp Max object
const abs = Math.abs;
const atan2 = Math.atan2;
const cos = Math.cos;
const sin = Math.sin;
const sqrt = Math.sqrt;
const pow = Math.pow;
const tan = Math.tan;
const max = Math.max;

const toDeg = 180 / Math.PI;
const toRad = Math.PI / 180;

function normalize(v) {
  const mag = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

  if (mag > 0) {
    v[0] /= mag;
    v[1] /= mag;
    v[2] /= mag;
  }

  return v;
}

const parameters = {
  k: {
    type: 'float',
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.9,
  },
};

/**
 * Filter that integrate gyrosscope and acceleration in order to remove noise
 * from accelerometers data while keeping a good reactivity.
 * The filter ouputs a normalized projection vector.
 * Be aware that the out of the filter invert the x and z in regard of the
 * device motion specification (left-hand axis). This is done for compatibility
 * with the R-ioT sensor.
 *
 * @memberof operator
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.k=0.9] - Ratio between the accelerometers and gyroscope.
 *  1 means gyroscope only
 *  0 mean accelerometers only (this is equivalent to a lowpass filter)
 *
 * @example
 * import * as lfo from 'waves-lfo/client';
 * import * as lfoMotion from 'lfo-motion';
 *
 * const motionInput = new lfoMotion.source.MotionInput();
 * const sampler = new lfoMotion.operator.Sampler({ frameRate: 50 });
 * const orientation = new lfoMotion.operator.Orientation();
 * const logger = new lfo.sink.Logger({ data: true });
 *
 * motionInput.connect(sampler);
 * sampler.connect(orientation);
 * orientation.connect(logger);
 *
 * motionInput.init().then(() => motionInput.start())
 */
class Orientation extends BaseLfo {
  constructor(options) {
    super(parameters, options);
  }

  /** @private */
  processStreamParams(prevStreamParams) {
    this.prepareStreamParams(prevStreamParams);

    this.streamParams.frameSize = 3;

    this.init = false;
    this.lastTime = 0;
    this.interval = 0;
    // this.k = 0.9;

    // normalized acceleration vector
    // coordinates are flipped to match R-ioT coords system
    this.accVector = new Float32Array(3);
    // normalize gyro order and direction according to R-ioT
    this.gyroVector = new Float32Array(3); // third component (yaw) will never be used
    // same as before as a projection vector
    this.gyroEstimate = new Float32Array(3);
    // filtered vector
    this.accEstimate = new Float32Array(3);


    this.propagateStreamParams();
  }

  /** @private */
  processVector(frame) {
    const time = frame.time;
    const input = frame.data;
    const output = this.frame.data;
    const accEstimate = this.accEstimate;
    const gyroEstimate = this.gyroEstimate;

    const k = this.params.get('k');

    /**
     * Reorder accelerometer and gyro to conform to R-ioT
     * coordinate system and gyro directions
     */
    const accVector = this.accVector;
    const accOffset = 0;
    accVector[0] = -1 * input[0 + accOffset];
    accVector[1] =  1 * input[1 + accOffset];
    accVector[2] = -1 * input[2 + accOffset];

    const gyroVector = this.gyroVector;
    const gyroOffset = 3;
    gyroVector[0] = -1 * input[2 + gyroOffset];
    gyroVector[1] = -1 * input[1 + gyroOffset];
    gyroVector[2] = -1 * input[0 + gyroOffset];

    normalize(accVector);

    if (!this.lastTime) {
      this.lastTime = time;
      // initialize corrected orientation with normalized accelerometer data
      for (let i = 0; i < 3; i++) {
        accEstimate[i] = accVector[i];
      }

      return;
    } else {
      // define if we use that or use the logical `MotionEvent.interval`
      const dt = time - this.lastTime;

      this.lastTime = time;

      // integrate angle from gyro current values and last result
      // get angles between projection of R on ZX/ZY plane and Z axis, based on last accEstimate

      // gyroVector in deg/s, delta and angle in rad
      const rollDelta = gyroVector[0] * dt * toRad;
      const rollAngle = atan2(accEstimate[0], accEstimate[2]) + rollDelta;

      const pitchDelta = gyroVector[1] * dt * toRad;
      const pitchAngle = atan2(accEstimate[1], accEstimate[2]) + pitchDelta;

      // calculate projection vector from angle Estimates
      gyroEstimate[0] = sin(rollAngle);
      gyroEstimate[0] /= sqrt(1 + pow(cos(rollAngle), 2) * pow(tan(pitchAngle), 2));

      gyroEstimate[1] = sin(pitchAngle);
      gyroEstimate[1] /= sqrt(1 + pow(cos(pitchAngle), 2) * pow(tan(rollAngle), 2));

      // estimate sign of RzGyro by looking in what qudrant the angle Axz is,
      // RzGyro is positive if  Axz in range -90 ..90 => cos(Awz) >= 0
      const signYaw = cos(rollAngle) >= 0 ? 1 : -1;

      // estimate yaw since vector is normalized
      const gyroEstimateSquared = pow(gyroEstimate[0], 2) + pow(gyroEstimate[1], 2);

      gyroEstimate[2] = signYaw * sqrt(max(0, 1 - gyroEstimateSquared));

      // interpolate between estimated values and raw values
      for (let i = 0; i < 3; i++) {
        accEstimate[i] = gyroEstimate[i] * k + accVector[i] * (1 - k);
      }

      normalize(accEstimate);

      // Rz is too small and because it is used as reference for computing Axz, Ayz
      // it's error fluctuations will amplify leading to bad results. In this case
      // skip the gyro data and just use previous estimate
      if (abs(accEstimate[2]) < 0.1) {
        // use input instead of estimation
        // accVector is already normalized
        for (let i = 0; i< 3; i++) {
          accEstimate[i] = accVector[i];
        }
      }
    }

    output[0] = accEstimate[0];
    output[1] = accEstimate[1];
    output[2] = accEstimate[2];
  }
}

export default Orientation;

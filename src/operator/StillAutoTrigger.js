import { BaseLfo } from 'waves-lfo/core';

const parameters = {
  onThreshold: {
    type: 'float',
    min: 0,
    max: +Infinity,
    default: 0.5,
  },
  offThreshold: {
    type: 'float',
    min: 0,
    max: +Infinity,
    default: 0.01,
  },
  offDelay: {
    type: 'float',
    min: 0,
    max: +Infinity,
    default: 0.2,
  },
}

/**
 * Simple switch control using intensity input to output sparse frames
 * of length 1 (scalars), alternating between 1 (start moving) or 0 (stop moving).
 * The detection is based on a schmitt trigger system, and also features
 * a timeout parameter allowing to stay below the low threshold up to a maximum
 * duration without sending the 0 value.
 *
 * note: this module has no defined output frameRate.
 *
 * @memberof operator
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.onThreshold=0.5] - The threshold above which
 * moving starts.
 * @param {Number} [options.offThreshold=0.01] - The threshold below which
 * moving stops.
 * @param {Number} [options.offDelay=0.2] - The maximum duration (timeout)
 * allowed in seconds to stay below the low threshold without propagating a 0.
 */
class StillAutoTrigger extends BaseLfo {
  constructor(options = {}) {
    super(parameters, options);

    this.isMoving = false;
    this.timeoutId = null;

    this._stop = this._stop.bind(this);
  }

  /** @private */
  processStreamParams(prevStreamParams) {
    this.prepareStreamParams(prevStreamParams);

    this.streamParams.frameRate = 0; //
    this.streamParams.frameSize = 1;

    this.propagateStreamParams();
  }

  /** @private */
  processFrame(frame) {
    this.prepareFrame();
    this.processFunction(frame);
  }

  /** @private */
  processVector(frame) {
    const value = frame.data[0];

    if (value > this.params.get('onThreshold') && !this.isMoving) {
      this.isMoving = true;
      this._start(frame);
    } else if (value < this.params.get('offThreshold') && this.isMoving) {
      this.isMoving = false; // keep this out of the timeout

      if (this.timeoutId === null) {
        this.timeoutId = setTimeout(this._stop, this.params.get('offDelay') * 1000, frame.time);
      }
    }
  }

  /** @private */
  _start(frame) {
    if (this.timeoutId !== null) {
      this.frame.time = frame.time;
      this.frame.data[0] = 1;
      this.propagateFrame();
    }

    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }

  /** @private */
  _stop(timeoutDate) {
    this.frame.time = timeoutDate + this.params.get('offDelay') * 0.001;
    this.frame.data[0] = 0;
    this.propagateFrame();
  }
}

export default StillAutoTrigger;

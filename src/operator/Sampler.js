import * as lfo from 'waves-lfo/core';
import Ticker from '@ircam/ticker';

if (!Float32Array.prototype.fill) {
  Float32Array.prototype.fill = function(val) {
    for (let i = 0; i < this.length; i++) {
      this[i] = val;
    }
  }
}

const parameters = {
  frameRate: {
    type: 'float',
    min: 0.001,
    max: +Infinity,
    default: 20,
    constant: true,
    metas: {
      unit: 'Hz',
    },
  },
};

/**
 * Module that resample an incomming vector frame at a given framerate.
 * If 0 frame has been received since last tick, output last values.
 * If more than 1 frame since last tick, output the mean of all the frames.
 *
 * @todo - add option for output type (i.e. mean, max, min, last, median, etc.)
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.frameRate=20] - output sampling rate (in Hz)
 */
class Sampler extends lfo.BaseLfo {
  constructor(options = {}) {
    super(parameters, options);

    this.ticker = null;
    this.buffer = null;
    this.bufferIndex = 0;

    this.propagateFrame = this.propagateFrame.bind(this);
  }

  /** @private */
  processStreamParams(prevStreamParams) {
    this.prepareStreamParams(prevStreamParams);

    const frameRate = this.params.get('frameRate'); // period is in ms

    this.streamParams.frameRate = frameRate;

    // build buffer
    const frameSize = this.streamParams.frameSize;
    let sourceFrameRate = prevStreamParams.frameRate;

    if (sourceFrameRate <= 0 || !isFinite(sourceFrameRate))
      sourceFrameRate = 10; // arbitrary value hoping that we won't loose data

    // max number of source frames to store
    const bufferSize = Math.ceil(sourceFrameRate / frameRate);

    this.maxBufferIndex = bufferSize;
    this.buffer = new Float32Array(bufferSize * frameSize);
    this.sums = new Float32Array(frameSize);

    this.propagateStreamParams();
  }

  /** @private */
  finalizeStream(endTime) {
    // @todo - output current data, compute proper endTime
    super.finalizeStream(endTime);
    this.ticker.stop();
    this.ticker = null;
  }

  /** @private */
  processVector(frame) {
    if (this.bufferIndex < this.maxBufferIndex) {
      const data = frame.data;
      const frameSize = this.streamParams.frameSize;

      for (let i = 0; i < frameSize; i++)
        this.buffer[this.bufferIndex * frameSize + i] = data[i];

      this.bufferIndex += 1;
    }
  }

  /** @private */
  processScalar(value) {
    if (this.bufferIndex < this.maxBufferIndex) {
      const data = frame.data;
      const frameSize = this.streamParams.frameSize;

      this.buffer[this.bufferIndex * frameSize] = data[0];
      this.bufferIndex += 1;
    }
  }

  /** @private */
  processFrame(frame) {
    this.prepareFrame();

    this.frame.metadata = frame.metadata;

    this.processFunction(frame);

    if (this.ticker === null) {
      const period = 1000 / this.params.get('frameRate'); // in ms
      this.ticker = new Ticker(period, this.propagateFrame);
      this.ticker.start();
    }
  }

  /** @private */
  propagateFrame(logicalTime) {
    this.frame.time = logicalTime / 1000;

    if (this.bufferIndex > 0)
      this._computeFrameData();

    super.propagateFrame();
  }

  /** @private */
  _computeFrameData() {
    const numFrames = this.bufferIndex;
    const frameSize = this.streamParams.frameSize;
    const buffer = this.buffer;
    const data = this.frame.data;

    // get means for each vector index
    const sums = this.sums;
    sums.fill(0);

    for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
      for (let i = 0; i < frameSize; i++)
        sums[i] += buffer[frameSize * frameIndex + i];
    }

    for (let i = 0; i < frameSize; i++)
      data[i] = sums[i] / numFrames;

    this.bufferIndex = 0;
  }
}

export default Sampler;

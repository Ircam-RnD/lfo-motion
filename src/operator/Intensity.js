import * as lfo from 'waves-lfo/common';

const BaseLfo = lfo.core.BaseLfo;
const Delta = lfo.operator.Delta;

const definitions = {
  feedback: {
    type: 'float',
    default: 0.7,
    min: 0,
    max: 1,
  },
  gain: {
    type: 'float',
    default: 0.07,
    min: 0,
  },
};

const inverseGravity = 1 / 9.81;
const abs = Math.abs;
const min = Math.min;
const max = Math.max;
const pow = Math.pow;

/**
 * Compute the intensity of the accelerometers.
 *
 * input: an array of numbers of size 1 to 3 (`[x]`, `[x, y]` or `[x, y, z]`).
 * output: `[normIntensity, xIntensity, yIntensity, zIntensity]`
 *
 * @memberof operator
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.feedback=0.7] - Feedback coefficient.
 * @param {Number} [options.gain=0.07] - Post gain coefficient.
 */
class Intensity extends BaseLfo {
  constructor(options = {}) {
    super(definitions, options);

    this.memory = null;
    this.normAcc = null;
    this.delta = new Delta({ size: 3, useFrameRate: 1 });
  }

  /** @private */
  processStreamParams(prevStreamParams = {}) {
    this.prepareStreamParams(prevStreamParams);

    this.streamParams.frameSize = 4;
    this.streamParams.description = [
      'norm',
      'x',
      'y',
      'z',
    ];

    this.delta.processStreamParams({
      frameSize: 3,
      frameRate: this.streamParams.frameRate,
    });

    this.memory = new Float32Array(3);
    this.normAcc = new Float32Array(3);

    this.propagateStreamParams();
  }

  resetStream() {
    super.resetStream();

    this.delta.resetStream();

    for (let i = 0; i < 3; i++)
      this.memory[i] = 0;
  }

  inputVector(data) {
    const outData = this.frame.data;
    const buffer = this.buffer;
    const memory = this.memory;
    const normAcc = this.normAcc;
    const feedback = this.params.get('feedback');
    const gain = this.params.get('gain');
    let norm = 0;

    // normalize accelerometers
    for (let i = 0; i < this.streamParams.frameSize; i++)
      normAcc[i] = (data[i] || 0) * inverseGravity;

    const deltas = this.delta.inputVector(normAcc);

    for (let i = 0; i < 3; i++) {
      let value = abs(deltas[i]);
      value = value + feedback * memory[i];

      // store value for next pass
      memory[i] = value;

      value = value * gain;
      value = value * value;

      norm += value;
      outData[i + 1] = value;
    }

    outData[0] = norm;

    return outData;
  }

  processVector(frame) {
    this.frame.data = this.inputVector(frame.data);
  }
}

export default Intensity;

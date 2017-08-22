import { BaseLfo } from 'waves-lfo/core';
import _MeanCrossingRate from './_MeanCrossingRate';

const parameters = {
  noiseThreshold: {
    type: 'float',
    default: 0.1,
  },
  frameSize: {
    type: 'integer',
    default: 512,
    metas: { kind: 'static' },
  },
  hopSize: { // should be nullable
    type: 'integer',
    default: null,
    nullable: true,
    metas: { kind: 'static' },
  },
  // centeredTimeTags: {
  //   type: 'boolean',
  //   default: false,
  // }
}

/**
 * Mean Crossing Rate operator : estimates energy, frequency and periodicity of
 * a (n-dimension) signal, either on an input stream of signal frames, or by
 * using its own sliding window on an input stream of vectors.
 * The mean is estimated on each new analyzed window using the following equation :
 * `mean = min + (max - min) * 0.5;`
 *
 * @param {Object} options - Override default options
 * @param {Number} [options.noiseThreshold=0.1] - Threshold added to the mean to
 *  avoid confusion between noise and real signal.
 * @param {Number} [options.frameSize=512] - Size of the internal sliding window.
 * @param {Number} [options.hopSize=null] - Number of samples between
 *  two computations on the internal sliding window.
 */

// We don't use centered time tags for signal input, as we don't know if it's
// already been done by a previous slicer.
// So we don't implement it for now.
// would be :
// @param {Boolean} [options.centeredTimeTags=false] - Move the time tag to the
// middle of the frame.

class MeanCrossingRate extends BaseLfo {
  constructor(options = {}) {
    super(parameters, options);

    this._mcrs = [];
  }

  /** @private */
  onParamUpdate(name, value, metas) {
    if (!this.params.hopSize) {
      this.params.set('hopSize', frameSize);
    }
  }

  /** @private */
  processStreamParams(prevStreamParams = {}) {
    this.prepareStreamParams(prevStreamParams);

    // TODO : set output samplerate according to input samplerate + hopSize (?)
    this._mcrs = [];

    for (let i = 0; i < prevStreamParams.frameSize; i++) {
      this._mcrs.push(new _MeanCrossingRate({
        noiseThreshold: this.params.get('noiseThreshold'),
        frameSize: this.params.get('frameSize'),
        hopSize: this.params.get('hopSize'),
        sampleRate: prevStreamParams.sourceSampleRate,
      }));
    }

    // if input frames are of type "signal", input dimension is 1
    this.streamParams.frameSize = 3;
    this.streamParams.description = [ 'energy', 'frequency', 'periodicity' ];
    this._mcrs.push(new _MeanCrossingRate({
      noiseThreshold: this.params.get('noiseThreshold'),
      frameSize: this.params.get('frameSize'),
      hopSize: this.params.get('hopSize'),
      sampleRate: prevStreamParams.sourceSampleRate,
    }));

    // otherwise we have to parallelize :
    if (this.streamParams.frameType === 'vector') {
      this.streamParams.frameSize *= prevStreamParams.frameSize;

      for (let i = 1; i < prevStreamParams.frameSize; i++) {
        this.streamParams.description.concat(this.streamParams.description);
        this._mcrs.push(new _MeanCrossingRate({
          noiseThreshold: this.params.get('noiseThreshold'),
          frameSize: this.params.get('frameSize'),
          hopSize: this.params.get('hopSize'),
          sampleRate: prevStreamParams.sourceSampleRate,
        }));
      }
    }

    // not divided by hopSize, we just duplicate frames between.
    // this means we can comment the following line :
    // this.streamParams.frameRate = prevStreamParams.sourceSampleRate;

    this.propagateStreamParams();
  }

  /** @private */
  processVector(frame) {
    const inData = frame.data;
    const outData = this.frame.data;

    for (let i = 0; i < this._mcrs.length; i++) {
      const r = this._mcrs[i].process(inData[i]);
      outData[i * 3]      = r.amplitude;
      outData[i * 3 + 1]  = r.frequency;
      outData[i * 3 + 2]  = r.periodicity;
    }
  }

  /** @private */
  processSignal(frame) {
    this.frame.data = this._mcrs[0].processFrame(frame.data);
  }
};

export default MeanCrossingRate;

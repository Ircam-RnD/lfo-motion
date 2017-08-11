import { BaseLfo } from 'waves-lfo/core';
import { _MeanCrossingRate } from '_MeanCrossingRate';

// motion-input indices :
// 0,1,2 -> accelerationIncludingGravity
// 3,4,5 -> acceleration
// 6,7,8 -> rotationRate

// but, as they are preprocessed by parent class,
// indices for acc + gyro are 0, 1, 2, 3, 4, 5 (see below)

const definitions = {
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
  centeredTimeTags: {
    type: 'boolean',
    default: false,
  }
}

export default class MeanCrossingRate extends BaseLfo {
  constructor(options = {}) {
    super(definitions, options);

    this._mcrs = [];
  }

  /** @private */
  onParamUpdate(name, value, metas) {

  }

  /** @private */
  processStreamParams(prevStreamParams = {}) {
    this.prepareStreamParams(prevStreamParams);

    // TODO : set output samplerate according to input samplerate + hopSize

    this._mcrs = [];

    for (let i = 0; i < prevStreamParams.frameSize; i++) {
      this._mcrs.push(new _MeanCrossingRate({
        noiseThreshold: this.params.get('noiseThreshold'),
        frameSize: this.params.get('frameSize'),
        hopSize: this.params.get('hopSize'),
        sampleRate: prevStreamParams.sourceSampleRate,
      }));
    }

    // for energy, frequency, and periodicity
    this.streamParams.frameSize = prevStreamParams.frameSize * 3;
    this.streamParams.frameRate = prevStreamParams.sourceSampleRate;

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
  // processFrame(frame) {
  //   this.prepareFrame(frame);
  //   this.processFunction(frame);
  // }
};
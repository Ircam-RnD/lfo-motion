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

    // this._mcr = new _MeanCrossingRate({
    //   noiseThreshold: this.params.get('noiseThreshold'),
    //   frameSize: this.params.get('frameSize'),
    //   hopSize: this.params.get('hopSize'),
    // });

    this._mcrs = [];
  }

  /** @private */
  onParamUpdate(name, value, metas) {
    // do something ? should not happen as everybody is constant
    // except the callback which is managed in the processVector method
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
      }));
    }

    // const descriptors = this.params.get('descriptors');

    // let len = 0;
    // for (let d of descriptors) {
    //   len += this._descriptorsInfo[d].length;
    // }

    // this.streamParams.frameSize = len;

    this.propagateStreamParams();
  }

  /** @private */
  processVector(frame) {
    // TODO !!!!!!!!!!!!!!!!!!!!!!!!!!

    /*
    const descriptors = this.params.get('descriptors');
    const callback = this.params.get('callback');
    const inData = frame.data;
    const outData = this.frame.data;
    const accIndices = this.params.get('accIndices');
    const gyrIndices = this.params.get('gyrIndices');
    
    this._features.setAccelerometer(
      inData[accIndices[0]],
      inData[accIndices[1]],
      inData[accIndices[2]]
    );

    this._features.setGyroscope(
      inData[gyrIndices[0]],
      inData[gyrIndices[1]],
      inData[gyrIndices[2]]
    );

    const values = this._features.update();

    let i = 0;
    for (let d of descriptors) {
      const subDesc = this._descriptorsInfo[d]; // the array of the current descriptor's dimensions names
      const subValues = values[d];

      for (let subd of subDesc) {
        if (subd === 'duration' || subd === 'slide') {
          subValues[subd] = 0;
        }
        outData[i] = subValues[subd]; // here we fill the output frame (data)
        i++;
      }
    }

    if (callback) {
      const desc = new Array(this.streamParams.frameSize);
      for (let j = 0; j < desc.length; j++) {
        desc[j] = outData[j];
      }
      callback(desc);
    }
    */
  }

  /** @private */
  // processFrame(frame) {
  //   this.prepareFrame(frame);
  //   this.processFunction(frame);
  // }
};
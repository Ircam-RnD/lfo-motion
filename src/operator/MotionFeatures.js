import { BaseLfo } from 'waves-lfo/core';
import { _MotionFeatures } from './_MotionFeatures';

// motion-input indices :
// 0,1,2 -> accelerationIncludingGravity
// 3,4,5 -> acceleration
// 6,7,8 -> rotationRate

// but, as they are preprocessed by parent class,
// indices for acc + gyro are 0, 1, 2, 3, 4, 5 (see below)

const definitions = {
  descriptors: {
    type: 'any',
    default: [
      'accRaw',
      'gyrRaw',
      'accIntensity',
      'gyrIntensity',
      'freefall',
      'kick',
      'shake',
      'spin',
      'still',
    ],
    constant: true,
  },
  accIndices: {
    type: 'any',
    default: [0, 1, 2],
    constant: true,
  },
  gyrIndices: {
    type: 'any',
    default: [3, 4, 5],
    constant: true,
  },
  callback: {
    type: 'any',
    default: null,
    constant: false,
    metas: { kind: 'dynamic' },
  }
}

export default class MotionFeatures extends BaseLfo {
  constructor(options = {}) {
    super(definitions, options);

    this._features = new _MotionFeatures({
      descriptors: this.params.get('descriptors'),
      spinThresh: 0.5, // original : 200
      stillThresh: 2, // original : 5000
      accIntensityParam1: 0.8,
      accIntensityParam2: 0.1,
    });
    // this._callback = this.params.get('callback');

    this._descriptorsInfo = {
      accRaw: [ 'x', 'y', 'z' ],
      gyrRaw: [ 'x', 'y', 'z' ],
      accIntensity: [ 'norm', 'x', 'y', 'z' ],
      gyrIntensity: [ 'norm', 'x', 'y', 'z' ],
      freefall: [ 'accNorm', 'falling', 'duration' ],
      kick: [ 'intensity', 'kicking' ],
      shake: [ 'shaking' ],
      spin: [ 'spinning', 'duration', 'gyrNorm' ],
      still: [ 'still', 'slide' ],
      gyrZcr: [ 'amplitude', 'frequency', 'periodicity' ],
      accZcr: [ 'amplitude', 'frequency', 'periodicity' ],
    };
  }

  /** @private */
  onParamUpdate(name, value, metas) {
    // do something ? should not happen as everybody is constant
    // except the callback which is managed in the processVector method
  }

  /** @private */
  processStreamParams(prevStreamParams = {}) {
    this.prepareStreamParams(prevStreamParams);

    const descriptors = this.params.get('descriptors');

    let len = 0;
    for (let d of descriptors) {
      len += this._descriptorsInfo[d].length;
    }

    this.streamParams.frameSize = len;

    this.propagateStreamParams();
  }

  /** @private */
  processVector(frame) {
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
  }

  /** @private */
  // processFrame(frame) {
  //   this.prepareFrame(frame);
  //   this.processFunction(frame);
  // }
};
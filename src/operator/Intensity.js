import { BaseLfo } from 'waves-lfo/core';

const definitions = {
  param1: {
    type: 'float',
    default: 0.9,
  },
  param2: {
    type: 'float',
    default: 0.1,
  }
}

class Intensity extends BaseLfo {
  constructor(options = {}) {
    super(definitions, options);    
  }

  /** @private */
  onParamUpdate(name, value, metas) {
    // do something ? should not happen as everybody is constant
    // except the callback which is managed in the processVector method
  }

  /** @private */
  processStreamParams(prevStreamParams = {}) {
    this.prepareStreamParams(prevStreamParams);

    const features = this.params.get('features');

    let len = 0;
    for (let d of features) {
      len += this._featuresInfo[d].length;
    }

    this.streamParams.frameSize = len;

    this.propagateStreamParams();
  }

  processVector(frame) {
    //this._norm = this._magnitude3D(this.acc);
    this._norm = 0;
    for (let i in frame) {
      this._norm += frame[i] * frame[i];
    }
    this._norm = Math.sqrt(this._norm);

    this._intensityNorm = 0;

    for (let i = 0; i < 3; i++) {
      this._accLast[i][this._loopIndex % 3] = this.acc[i];

      this._accIntensity[i] = this._intensity1D(
        this.acc[i],
        this._accLast[i][(this._loopIndex + 1) % 3],
        this._accIntensityLast[i][(this._loopIndex + 1) % 2],
        this._params.accIntensityParam1,
        this._params.accIntensityParam2,
        1
      );

      this._accIntensityLast[i][this._loopIndex % 2] = this._accIntensity[i];

      this._accIntensityNorm += this._accIntensity[i];
    }

    res.accIntensity = {
      norm: this._accIntensityNorm,
      x: this._accIntensity[0],
      y: this._accIntensity[1],
      z: this._accIntensity[2]
    };
  }  

  //==========================================================================//
  //================================ UTILITIES ===============================//
  //==========================================================================//
  /** @private */
  _delta(prev, next, dt) {
    return (next - prev) / (2 * dt);
  }

  /** @private */
  _intensity1D(nextX, prevX, prevIntensity, param1, param2, dt) {
    const dx = this._delta(nextX, prevX, dt);//(nextX - prevX) / (2 * dt);
    return param2 * dx * dx + param1 * prevIntensity;
  }

  /** @private */
  _magnitude3D(xyzArray) {
    return Math.sqrt(xyzArray[0] * xyzArray[0] + 
                     xyzArray[1] * xyzArray[1] +
                     xyzArray[2] * xyzArray[2]);
  }

  /** @private */
  _lcm(a, b) {
    let a1 = a, b1 = b;

    while (a1 != b1) {
      if (a1 < b1) {
        a1 += a;
      } else {
        b1 += b;
      }
    }

    return a1;
  }

  /** @private */
  _slide(prevSlide, currentVal, slideFactor) {
    return prevSlide + (currentVal - prevSlide) / slideFactor;
  }

  /** @private */
  _stillCrossProduct(xyzArray) {
    return (xyzArray[1] - xyzArray[2]) * (xyzArray[1] - xyzArray[2]) +
           (xyzArray[0] - xyzArray[1]) * (xyzArray[0] - xyzArray[1]) +
           (xyzArray[2] - xyzArray[0]) * (xyzArray[2] - xyzArray[0]);
  }
};

export default Intensity;
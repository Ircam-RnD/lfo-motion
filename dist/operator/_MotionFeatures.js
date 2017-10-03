'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _MeanCrossingRate = require('./MeanCrossingRate');

var _MeanCrossingRate2 = _interopRequireDefault(_MeanCrossingRate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a function that returns time in seconds according to the current
 * environnement (node or browser).
 * If running in node the time rely on `process.hrtime`, while if in the browser
 * it is provided by the `Date` object.
 *
 * @return {Function}
 * @private
 */
function getTimeFunction() {
  if (typeof window === 'undefined') {
    // assume node
    return function () {
      var t = process.hrtime();
      return t[0] + t[1] * 1e-9;
    };
  } else {
    // browser
    if (window.performance === 'undefined') {
      if (Date.now === 'undefined') {
        return function () {
          return new Date.getTime();
        };
      } else {
        return function () {
          return Date.now();
        };
      }
    } else {
      return function () {
        return window.performance.now();
      };
    }
  }
}

var perfNow = getTimeFunction();

/**
 * @todo typedef constructor argument
 */

/*
 * // es5 with browserify :
 * var motionFeatures = require('motion-features');
 * var mf = new motionFeatures.MotionFeatures({ features: ['accIntensity', 'kick'] });
 *
 * // loading from a "script" tag :
 * var mf = new motionFeatures.MotionFeatures({ features: ['accIntensity', 'kick'] });
 */

/**
 * Class computing the features from accelerometer and gyroscope data.
 * <br />
 * es6 + browserify example :
 * ```JavaScript
 * import { MotionFeatures } from 'motion-features';
 * const mf = new MotionFeatures({ features: ['accIntensity', 'kick'] });
 *
 * // then, on each motion event :
 * mf.setAccelerometer(x, y, z);
 * mf.setGyroscope(alpha, beta, gamma);
 * mf.update(function(err, res) {
 *   if (err === null) {
 *     // do something with res
 *   }
 * });
 * ```
 * @class
 */

var MotionFeatures = function () {

  /**
   * @param {Object} initObject - object containing an array of the
   * required features and some variables used to compute the features
   * that you might want to change (for example if the browser is chrome you
   * might want to set `gyrIsInDegrees` to false because it's the case on some
   * versions, or you might want to change some thresholds).
   * See the code for more details.
   *
   * @todo use typedef to describe the configuration parameters
   */
  function MotionFeatures() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MotionFeatures);

    var defaults = {
      features: ['accRaw', 'gyrRaw', 'accIntensity', 'gyrIntensity', 'freefall', 'kick', 'shake', 'spin', 'still', 'gyrZcr', 'accZcr'],

      gyrIsInDegrees: true,

      accIntensityParam1: 0.8,
      accIntensityParam2: 0.1,

      gyrIntensityParam1: 0.9,
      gyrIntensityParam2: 1,

      freefallAccThresh: 0.15,
      freefallGyrThresh: 750,
      freefallGyrDeltaThresh: 40,

      kickThresh: 0.01,
      kickSpeedGate: 200,
      kickMedianFiltersize: 9,
      kickCallback: null,

      shakeThresh: 0.1,
      shakeWindowSize: 200,
      shakeSlideFactor: 10,

      spinThresh: 200,

      stillThresh: 5000,
      stillSlideFactor: 5,

      gyrZcrNoiseThresh: 0.01,
      gyrZcrFrameSize: 100,
      gyrZcrHopSize: 10,

      accZcrNoiseThresh: 0.01,
      accZcrFrameSize: 100,
      accZcrHopSize: 10
    };

    this._params = (0, _assign2.default)({}, defaults, options);
    //console.log(this._params.features);

    this._methods = {
      accRaw: this._updateAccRaw.bind(this),
      gyrRaw: this._updateGyrRaw.bind(this),
      accIntensity: this._updateAccIntensity.bind(this),
      gyrIntensity: this._updateGyrIntensity.bind(this),
      freefall: this._updateFreefall.bind(this),
      kick: this._updateKick.bind(this),
      shake: this._updateShake.bind(this),
      spin: this._updateSpin.bind(this),
      still: this._updateStill.bind(this),
      gyrZcr: this._updateGyrZcr.bind(this),
      accZcr: this._updateAccZcr.bind(this)
    };

    this._kickCallback = this._params.kickCallback;

    this.acc = [0, 0, 0];
    this.gyr = [0, 0, 0];

    //============================================================ acc intensity
    this._accLast = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    this._accIntensityLast = [[0, 0], [0, 0], [0, 0]];
    this._accIntensity = [0, 0, 0];
    this._accIntensityNorm = 0;

    //================================================================= freefall
    this._accNorm = 0;
    this._gyrDelta = [0, 0, 0];
    this._gyrNorm = 0;
    this._gyrDeltaNorm = 0;
    this._fallBegin = perfNow();
    this._fallEnd = perfNow();
    this._fallDuration = 0;
    this._isFalling = false;

    //============================================================ gyr intensity
    this._gyrLast = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    this._gyrIntensityLast = [[0, 0], [0, 0], [0, 0]];
    this._gyrIntensity = [0, 0, 0];
    this._gyrIntensityNorm = 0;

    //===================================================================== kick
    this._kickIntensity = 0;
    this._lastKick = 0;
    this._isKicking = false;
    this._medianValues = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._medianLinking = [3, 4, 1, 5, 7, 8, 0, 2, 6];
    this._medianFifo = [6, 2, 7, 0, 1, 3, 8, 4, 5];
    this._i1 = 0;
    this._i2 = 0;
    this._i3 = 0;
    this._accIntensityNormMedian = 0;

    //==================================================================== shake
    this._accDelta = [0, 0, 0];
    this._shakeWindow = [new Array(this._params.shakeWindowSize), new Array(this._params.shakeWindowSize), new Array(this._params.shakeWindowSize)];
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < this._params.shakeWindowSize; j++) {
        this._shakeWindow[i][j] = 0;
      }
    }
    this._shakeNb = [0, 0, 0];
    this._shakingRaw = 0;
    this._shakeSlidePrev = 0;
    this._shaking = 0;

    //===================================================================== spin
    this._spinBegin = perfNow();
    this._spinEnd = perfNow();
    this._spinDuration = 0;
    this._isSpinning = false;

    //==================================================================== still
    this._stillCrossProd = 0;
    this._stillSlide = 0;
    this._stillSlidePrev = 0;
    this._isStill = false;

    this._loopIndexPeriod = this._lcm(this._lcm(this._lcm(2, 3), this._params.kickMedianFiltersize), this._params.shakeWindowSize);
    //console.log(this._loopIndexPeriod);
    this._loopIndex = 0;

    var hasGyrZcr = this._params.features.indexOf('gyrZcr') > -1;
    var hasAccZcr = this._params.features.indexOf('accZcr') > -1;

    if (hasGyrZcr) {
      this._gyrZcr = new MeanCrossingRate({
        noiseThreshold: this._params.gyrZcrNoiseThresh,
        frameSize: this._params.gyrZcrFrameSize,
        hopSize: this._params.gyrZcrHopSize
      });
    }

    if (hasAccZcr) {
      this._accZcr = new MeanCrossingRate({
        noiseThreshold: this._params.accZcrNoiseThresh,
        frameSize: this._params.accZcrFrameSize,
        hopSize: this._params.accZcrHopSize
      });
    }
  }

  //========== interface =========//

  /**
   * Update configuration parameters (except features list)
   * @param {Object} params - a subset of the constructor's parameters
   */


  (0, _createClass3.default)(MotionFeatures, [{
    key: 'updateParams',
    value: function updateParams() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      for (var key in params) {
        if (key !== 'features') {
          this._params[key] = params[key];
        }
      }
    }

    /**
     * Sets the current accelerometer values.
     * @param {Number} x - the accelerometer's x value
     * @param {Number} y - the accelerometer's y value
     * @param {Number} z - the accelerometer's z value
     */

  }, {
    key: 'setAccelerometer',
    value: function setAccelerometer(x) {
      var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var z = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      this.acc[0] = x;
      this.acc[1] = y;
      this.acc[2] = z;
    }

    /**
     * Sets the current gyroscope values.
     * @param {Number} x - the gyroscope's x value
     * @param {Number} y - the gyroscope's y value
     * @param {Number} z - the gyroscope's z value
     */

  }, {
    key: 'setGyroscope',
    value: function setGyroscope(x) {
      var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var z = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      this.gyr[0] = x;
      this.gyr[1] = y;
      this.gyr[2] = z;
      if (this._params.gyrIsInDegrees) {
        for (var i = 0; i < 3; i++) {
          this.gyr[i] *= 2 * Math.PI / 360.;
        }
      }
    }

    /**
     * Intensity of the movement sensed by an accelerometer.
     * @typedef accIntensity
     * @type {Object}
     * @property {Number} norm - the global energy computed on all dimensions.
     * @property {Number} x - the energy in the x (first) dimension.
     * @property {Number} y - the energy in the y (second) dimension.
     * @property {Number} z - the energy in the z (third) dimension.
     */

    /**
     * Intensity of the movement sensed by a gyroscope.
     * @typedef gyrIntensity
     * @type {Object}
     * @property {Number} norm - the global energy computed on all dimensions.
     * @property {Number} x - the energy in the x (first) dimension.
     * @property {Number} y - the energy in the y (second) dimension.
     * @property {Number} z - the energy in the z (third) dimension.
     */

    /**
     * Information about the free falling state of the sensor.
     * @typedef freefall
     * @type {Object}
     * @property {Number} accNorm - the norm of the acceleration.
     * @property {Boolean} falling - true if the sensor is free falling, false otherwise.
     * @property {Number} duration - the duration of the free falling since its beginning.
     */

    /**
     * Impulse / hit movement detection information.
     * @typedef kick
     * @type {Object}
     * @property {Number} intensity - the current intensity of the "kick" gesture.
     * @property {Boolean} kicking - true if a "kick" gesture is being detected, false otherwise.
     */

    /**
     * Shake movement detection information.
     * @typedef shake
     * @type {Object}
     * @property {Number} shaking - the current amount of "shakiness".
     */

    /**
     * Information about the spinning state of the sensor.
     * @typedef spin
     * @type {Object}
     * @property {Boolean} spinning - true if the sensor is spinning, false otherwise.
     * @property {Number} duration - the duration of the spinning since its beginning.
     * @property {Number} gyrNorm - the norm of the rotation speed.
     */

    /**
     * Information about the stillness of the sensor.
     * @typedef still
     * @type {Object}
     * @property {Boolean} still - true if the sensor is still, false otherwise.
     * @property {Number} slide - the original value thresholded to determine stillness.
     */

    /**
     * Computed features.
     * @typedef features
     * @type {Object}
     * @property {accIntensity} accIntensity - Intensity of the movement sensed by an accelerometer.
     * @property {gyrIntensity} gyrIntensity - Intensity of the movement sensed by a gyroscope.
     * @property {freefall} freefall - Information about the free falling state of the sensor.
     * @property {kick} kick - Impulse / hit movement detection information.
     * @property {shake} shake - Shake movement detection information.
     * @property {spin} spin - Information about the spinning state of the sensor.
     * @property {still} still - Information about the stillness of the sensor.
     */

    /**
     * Callback handling the features.
     * @callback featuresCallback
     * @param {String} err - Description of a potential error.
     * @param {features} res - Object holding the feature values.
     */

    /**
     * Triggers computation of the features from the current sensor values and
     * pass the results to a callback
     * @param {featuresCallback} callback - The callback handling the last computed features
     * @returns {features} features - Return these computed features anyway
     */

  }, {
    key: 'update',
    value: function update() {
      var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      // DEAL WITH this._elapsedTime
      this._elapsedTime = perfNow();
      // is this one used by several features ?
      this._accNorm = this._magnitude3D(this.acc);
      // this one needs be here because used by freefall AND spin
      this._gyrNorm = this._magnitude3D(this.gyr);
      // console.log(this.gyr);

      var err = null;
      var res = null;
      try {
        res = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _getIterator3.default)(this._params.features), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            if (this._methods[key]) {
              this._methods[key](res);
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } catch (e) {
        err = e;
      }

      this._loopIndex = (this._loopIndex + 1) % this._loopIndexPeriod;

      if (callback) {
        callback(err, res);
      }
      return res;
    }

    //==========================================================================//
    //======================== specific features computing =====================//
    //==========================================================================//

    /** @private */

  }, {
    key: '_updateAccRaw',
    value: function _updateAccRaw(res) {
      res.accRaw = {
        x: this.acc[0],
        y: this.acc[1],
        z: this.acc[2]
      };
    }

    /** @private */

  }, {
    key: '_updateGyrRaw',
    value: function _updateGyrRaw(res) {
      res.gyrRaw = {
        x: this.gyr[0],
        y: this.gyr[1],
        z: this.gyr[2]
      };
    }

    //============================================================== acc intensity
    /** @private */

  }, {
    key: '_updateAccIntensity',
    value: function _updateAccIntensity(res) {
      this._accIntensityNorm = 0;

      for (var i = 0; i < 3; i++) {
        this._accLast[i][this._loopIndex % 3] = this.acc[i];

        this._accIntensity[i] = this._intensity1D(this.acc[i], this._accLast[i][(this._loopIndex + 1) % 3], this._accIntensityLast[i][(this._loopIndex + 1) % 2], this._params.accIntensityParam1, this._params.accIntensityParam2, 1);

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

    //============================================================== gyr intensity
    /** @private */

  }, {
    key: '_updateGyrIntensity',
    value: function _updateGyrIntensity(res) {
      this._gyrIntensityNorm = 0;

      for (var i = 0; i < 3; i++) {
        this._gyrLast[i][this._loopIndex % 3] = this.gyr[i];

        this._gyrIntensity[i] = this._intensity1D(this.gyr[i], this._gyrLast[i][(this._loopIndex + 1) % 3], this._gyrIntensityLast[i][(this._loopIndex + 1) % 2], this._params.gyrIntensityParam1, this._params.gyrIntensityParam2, 1);

        this._gyrIntensityLast[i][this._loopIndex % 2] = this._gyrIntensity[i];

        this._gyrIntensityNorm += this._gyrIntensity[i];
      }

      res.gyrIntensity = {
        norm: this._gyrIntensityNorm,
        x: this._gyrIntensity[0],
        y: this._gyrIntensity[1],
        z: this._gyrIntensity[2]
      };
    }

    //=================================================================== freefall
    /** @private */

  }, {
    key: '_updateFreefall',
    value: function _updateFreefall(res) {
      for (var i = 0; i < 3; i++) {
        this._gyrDelta[i] = this._delta(this._gyrLast[i][(this._loopIndex + 1) % 3], this.gyr[i], 1);
      }

      this._gyrDeltaNorm = this._magnitude3D(this._gyrDelta);

      if (this._accNorm < this._params.freefallAccThresh || this._gyrNorm > this._params.freefallGyrThresh && this._gyrDeltaNorm < this._params.freefallGyrDeltaThresh) {
        if (!this._isFalling) {
          this._isFalling = true;
          this._fallBegin = perfNow();
        }
        this._fallEnd = perfNow();
      } else {
        if (this._isFalling) {
          this._isFalling = false;
        }
      }
      this._fallDuration = this._fallEnd - this._fallBegin;

      res.freefall = {
        accNorm: this._accNorm,
        falling: this._isFalling,
        duration: this._fallDuration
      };
    }

    //======================================================================= kick
    /** @private */

  }, {
    key: '_updateKick',
    value: function _updateKick(res) {
      this._i3 = this._loopIndex % this._params.kickMedianFiltersize;
      this._i1 = this._medianFifo[this._i3];
      this._i2 = 1;

      if (this._i1 < this._params.kickMedianFiltersize - 1 && this._accIntensityNorm > this._medianValues[this._i1 + this._i2]) {
        // check right
        while (this._i1 + this._i2 < this.kickMedianFiltersize && this._accIntensityNorm > this._medianValues[this._i1 + this._i2]) {
          this._medianFifo[this._medianLinking[this._i1 + this._i2]] = this._medianFifo[this._medianLinking[this._i1 + this._i2]] - 1;
          this._medianValues[this._i1 + this._i2 - 1] = this._medianValues[this._i1 + this._i2];
          this._medianLinking[this._i1 + this._i2 - 1] = this._medianLinking[this._i1 + this._i2];
          this._i2++;
        }
        this._medianValues[this._i1 + this._i2 - 1] = this._accIntensityNorm;
        this._medianLinking[this._i1 + this._i2 - 1] = this._i3;
        this._medianFifo[this._i3] = this._i1 + this._i2 - 1;
      } else {
        // check left
        while (this._i2 < this._i1 + 1 && this._accIntensityNorm < this._medianValues[this._i1 - this._i2]) {
          this._medianFifo[this._medianLinking[this._i1 - this._i2]] = this._medianFifo[this._medianLinking[this._i1 - this._i2]] + 1;
          this._medianValues[this._i1 - this._i2 + 1] = this._medianValues[this._i1 - this._i2];
          this._medianLinking[this._i1 - this._i2 + 1] = this._medianLinking[this._i1 - this._i2];
          this._i2++;
        }
        this._medianValues[this._i1 - this._i2 + 1] = this._accIntensityNorm;
        this._medianLinking[this._i1 - this._i2 + 1] = this._i3;
        this._medianFifo[this._i3] = this._i1 - this._i2 + 1;
      }

      // compare current intensity norm with previous median value
      if (this._accIntensityNorm - this._accIntensityNormMedian > this._params.kickThresh) {
        if (this._isKicking) {
          if (this._kickIntensity < this._accIntensityNorm) {
            this._kickIntensity = this._accIntensityNorm;
          }
          if (this._kickCallback) {
            this._kickCallback({ state: 'middle', intensity: this._kickIntensity });
          }
        } else {
          this._isKicking = true;
          this._kickIntensity = this._accIntensityNorm;
          this._lastKick = this._elapsedTime;
          if (this._kickCallback) {
            this._kickCallback({ state: 'start', intensity: this._kickIntensity });
          }
        }
      } else {
        if (this._elapsedTime - this._lastKick > this._params.kickSpeedGate) {
          if (this._isKicking && this._kickCallback) {
            this._kickCallback({ state: 'stop', intensity: this._kickIntensity });
          }
          this._isKicking = false;
        }
      }

      this._accIntensityNormMedian = this._medianValues[Math.ceil(this._params.kickMedianFiltersize * 0.5)];

      res.kick = {
        intensity: this._kickIntensity,
        kicking: this._isKicking
      };
    }

    //====================================================================== shake
    /** @private */

  }, {
    key: '_updateShake',
    value: function _updateShake(res) {
      for (var i = 0; i < 3; i++) {
        this._accDelta[i] = this._delta(this._accLast[i][(this._loopIndex + 1) % 3], this.acc[i], 1);
      }

      for (var _i = 0; _i < 3; _i++) {
        if (this._shakeWindow[_i][this._loopIndex % this._params.shakeWindowSize]) {
          this._shakeNb[_i]--;
        }
        if (this._accDelta[_i] > this._params.shakeThresh) {
          this._shakeWindow[_i][this._loopIndex % this._params.shakeWindowSize] = 1;
          this._shakeNb[_i]++;
        } else {
          this._shakeWindow[_i][this._loopIndex % this._params.shakeWindowSize] = 0;
        }
      }

      this._shakingRaw = this._magnitude3D(this._shakeNb) / this._params.shakeWindowSize;
      this._shakeSlidePrev = this._shaking;
      this._shaking = this._slide(this._shakeSlidePrev, this._shakingRaw, this._params.shakeSlideFactor);

      res.shake = {
        shaking: this._shaking
      };
    }

    //======================================================================= spin
    /** @private */

  }, {
    key: '_updateSpin',
    value: function _updateSpin(res) {
      if (this._gyrNorm > this._params.spinThresh) {
        if (!this._isSpinning) {
          this._isSpinning = true;
          this._spinBegin = perfNow();
        }
        this._spinEnd = perfNow();
      } else if (this._isSpinning) {
        this._isSpinning = false;
      }
      this._spinDuration = this._spinEnd - this._spinBegin;

      res.spin = {
        spinning: this._isSpinning,
        duration: this._spinDuration,
        gyrNorm: this._gyrNorm
      };
    }

    //====================================================================== still
    /** @private */

  }, {
    key: '_updateStill',
    value: function _updateStill(res) {
      this._stillCrossProd = this._stillCrossProduct(this.gyr);
      this._stillSlidePrev = this._stillSlide;
      this._stillSlide = this._slide(this._stillSlidePrev, this._stillCrossProd, this._params.stillSlideFactor);

      if (this._stillSlide > this._params.stillThresh) {
        this._isStill = false;
      } else {
        this._isStill = true;
      }

      res.still = {
        still: this._isStill,
        slide: this._stillSlide
      };
    }

    //===================================================================== gyrZcr
    /** @private */

  }, {
    key: '_updateGyrZcr',
    value: function _updateGyrZcr(res) {
      var zcrRes = this._gyrZcr.process(this._gyrNorm);
      res.gyrZcr = {
        amplitude: zcrRes.amplitude,
        frequency: zcrRes.frequency,
        periodicity: zcrRes.periodicity
      };
    }

    //===================================================================== accZcr
    /** @private */

  }, {
    key: '_updateAccZcr',
    value: function _updateAccZcr(res) {
      var accRes = this._accZcr.process(this._accNorm);
      res.accZcr = {
        amplitude: accZcr.amplitude,
        frequency: accZcr.frequency,
        periodicity: accZcr.periodicity
      };
    }

    //==========================================================================//
    //================================ UTILITIES ===============================//
    //==========================================================================//
    /** @private */

  }, {
    key: '_delta',
    value: function _delta(prev, next, dt) {
      return (next - prev) / (2 * dt);
    }

    /** @private */

  }, {
    key: '_intensity1D',
    value: function _intensity1D(nextX, prevX, prevIntensity, param1, param2, dt) {
      var dx = this._delta(nextX, prevX, dt); //(nextX - prevX) / (2 * dt);
      return param2 * dx * dx + param1 * prevIntensity;
    }

    /** @private */

  }, {
    key: '_magnitude3D',
    value: function _magnitude3D(xyzArray) {
      return Math.sqrt(xyzArray[0] * xyzArray[0] + xyzArray[1] * xyzArray[1] + xyzArray[2] * xyzArray[2]);
    }

    /** @private */

  }, {
    key: '_lcm',
    value: function _lcm(a, b) {
      var a1 = a,
          b1 = b;

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

  }, {
    key: '_slide',
    value: function _slide(prevSlide, currentVal, slideFactor) {
      return prevSlide + (currentVal - prevSlide) / slideFactor;
    }

    /** @private */

  }, {
    key: '_stillCrossProduct',
    value: function _stillCrossProduct(xyzArray) {
      return (xyzArray[1] - xyzArray[2]) * (xyzArray[1] - xyzArray[2]) + (xyzArray[0] - xyzArray[1]) * (xyzArray[0] - xyzArray[1]) + (xyzArray[2] - xyzArray[0]) * (xyzArray[2] - xyzArray[0]);
    }
  }]);
  return MotionFeatures;
}();

exports.default = MotionFeatures;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZ2V0VGltZUZ1bmN0aW9uIiwid2luZG93IiwidCIsInByb2Nlc3MiLCJocnRpbWUiLCJwZXJmb3JtYW5jZSIsIkRhdGUiLCJub3ciLCJnZXRUaW1lIiwicGVyZk5vdyIsIk1vdGlvbkZlYXR1cmVzIiwib3B0aW9ucyIsImRlZmF1bHRzIiwiZmVhdHVyZXMiLCJneXJJc0luRGVncmVlcyIsImFjY0ludGVuc2l0eVBhcmFtMSIsImFjY0ludGVuc2l0eVBhcmFtMiIsImd5ckludGVuc2l0eVBhcmFtMSIsImd5ckludGVuc2l0eVBhcmFtMiIsImZyZWVmYWxsQWNjVGhyZXNoIiwiZnJlZWZhbGxHeXJUaHJlc2giLCJmcmVlZmFsbEd5ckRlbHRhVGhyZXNoIiwia2lja1RocmVzaCIsImtpY2tTcGVlZEdhdGUiLCJraWNrTWVkaWFuRmlsdGVyc2l6ZSIsImtpY2tDYWxsYmFjayIsInNoYWtlVGhyZXNoIiwic2hha2VXaW5kb3dTaXplIiwic2hha2VTbGlkZUZhY3RvciIsInNwaW5UaHJlc2giLCJzdGlsbFRocmVzaCIsInN0aWxsU2xpZGVGYWN0b3IiLCJneXJaY3JOb2lzZVRocmVzaCIsImd5clpjckZyYW1lU2l6ZSIsImd5clpjckhvcFNpemUiLCJhY2NaY3JOb2lzZVRocmVzaCIsImFjY1pjckZyYW1lU2l6ZSIsImFjY1pjckhvcFNpemUiLCJfcGFyYW1zIiwiX21ldGhvZHMiLCJhY2NSYXciLCJfdXBkYXRlQWNjUmF3IiwiYmluZCIsImd5clJhdyIsIl91cGRhdGVHeXJSYXciLCJhY2NJbnRlbnNpdHkiLCJfdXBkYXRlQWNjSW50ZW5zaXR5IiwiZ3lySW50ZW5zaXR5IiwiX3VwZGF0ZUd5ckludGVuc2l0eSIsImZyZWVmYWxsIiwiX3VwZGF0ZUZyZWVmYWxsIiwia2ljayIsIl91cGRhdGVLaWNrIiwic2hha2UiLCJfdXBkYXRlU2hha2UiLCJzcGluIiwiX3VwZGF0ZVNwaW4iLCJzdGlsbCIsIl91cGRhdGVTdGlsbCIsImd5clpjciIsIl91cGRhdGVHeXJaY3IiLCJhY2NaY3IiLCJfdXBkYXRlQWNjWmNyIiwiX2tpY2tDYWxsYmFjayIsImFjYyIsImd5ciIsIl9hY2NMYXN0IiwiX2FjY0ludGVuc2l0eUxhc3QiLCJfYWNjSW50ZW5zaXR5IiwiX2FjY0ludGVuc2l0eU5vcm0iLCJfYWNjTm9ybSIsIl9neXJEZWx0YSIsIl9neXJOb3JtIiwiX2d5ckRlbHRhTm9ybSIsIl9mYWxsQmVnaW4iLCJfZmFsbEVuZCIsIl9mYWxsRHVyYXRpb24iLCJfaXNGYWxsaW5nIiwiX2d5ckxhc3QiLCJfZ3lySW50ZW5zaXR5TGFzdCIsIl9neXJJbnRlbnNpdHkiLCJfZ3lySW50ZW5zaXR5Tm9ybSIsIl9raWNrSW50ZW5zaXR5IiwiX2xhc3RLaWNrIiwiX2lzS2lja2luZyIsIl9tZWRpYW5WYWx1ZXMiLCJfbWVkaWFuTGlua2luZyIsIl9tZWRpYW5GaWZvIiwiX2kxIiwiX2kyIiwiX2kzIiwiX2FjY0ludGVuc2l0eU5vcm1NZWRpYW4iLCJfYWNjRGVsdGEiLCJfc2hha2VXaW5kb3ciLCJBcnJheSIsImkiLCJqIiwiX3NoYWtlTmIiLCJfc2hha2luZ1JhdyIsIl9zaGFrZVNsaWRlUHJldiIsIl9zaGFraW5nIiwiX3NwaW5CZWdpbiIsIl9zcGluRW5kIiwiX3NwaW5EdXJhdGlvbiIsIl9pc1NwaW5uaW5nIiwiX3N0aWxsQ3Jvc3NQcm9kIiwiX3N0aWxsU2xpZGUiLCJfc3RpbGxTbGlkZVByZXYiLCJfaXNTdGlsbCIsIl9sb29wSW5kZXhQZXJpb2QiLCJfbGNtIiwiX2xvb3BJbmRleCIsImhhc0d5clpjciIsImluZGV4T2YiLCJoYXNBY2NaY3IiLCJfZ3lyWmNyIiwiTWVhbkNyb3NzaW5nUmF0ZSIsIm5vaXNlVGhyZXNob2xkIiwiZnJhbWVTaXplIiwiaG9wU2l6ZSIsIl9hY2NaY3IiLCJwYXJhbXMiLCJrZXkiLCJ4IiwieSIsInoiLCJNYXRoIiwiUEkiLCJjYWxsYmFjayIsIl9lbGFwc2VkVGltZSIsIl9tYWduaXR1ZGUzRCIsImVyciIsInJlcyIsImUiLCJfaW50ZW5zaXR5MUQiLCJub3JtIiwiX2RlbHRhIiwiYWNjTm9ybSIsImZhbGxpbmciLCJkdXJhdGlvbiIsInN0YXRlIiwiaW50ZW5zaXR5IiwiY2VpbCIsImtpY2tpbmciLCJfc2xpZGUiLCJzaGFraW5nIiwic3Bpbm5pbmciLCJneXJOb3JtIiwiX3N0aWxsQ3Jvc3NQcm9kdWN0Iiwic2xpZGUiLCJ6Y3JSZXMiLCJhbXBsaXR1ZGUiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsImFjY1JlcyIsInByZXYiLCJuZXh0IiwiZHQiLCJuZXh0WCIsInByZXZYIiwicHJldkludGVuc2l0eSIsInBhcmFtMSIsInBhcmFtMiIsImR4IiwieHl6QXJyYXkiLCJzcXJ0IiwiYSIsImIiLCJhMSIsImIxIiwicHJldlNsaWRlIiwiY3VycmVudFZhbCIsInNsaWRlRmFjdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7OztBQUVBOzs7Ozs7Ozs7QUFTQSxTQUFTQSxlQUFULEdBQTJCO0FBQ3pCLE1BQUksT0FBT0MsTUFBUCxLQUFrQixXQUF0QixFQUFtQztBQUFFO0FBQ25DLFdBQU8sWUFBTTtBQUNYLFVBQU1DLElBQUlDLFFBQVFDLE1BQVIsRUFBVjtBQUNBLGFBQU9GLEVBQUUsQ0FBRixJQUFPQSxFQUFFLENBQUYsSUFBTyxJQUFyQjtBQUNELEtBSEQ7QUFJRCxHQUxELE1BS087QUFBRTtBQUNQLFFBQUlELE9BQU9JLFdBQVAsS0FBdUIsV0FBM0IsRUFBd0M7QUFDdEMsVUFBSUMsS0FBS0MsR0FBTCxLQUFhLFdBQWpCLEVBQThCO0FBQzVCLGVBQU8sWUFBTTtBQUFFLGlCQUFPLElBQUlELEtBQUtFLE9BQVQsRUFBUDtBQUEyQixTQUExQztBQUNELE9BRkQsTUFFTztBQUNMLGVBQU8sWUFBTTtBQUFFLGlCQUFPRixLQUFLQyxHQUFMLEVBQVA7QUFBbUIsU0FBbEM7QUFDRDtBQUNGLEtBTkQsTUFNTztBQUNMLGFBQU8sWUFBTTtBQUFFLGVBQU9OLE9BQU9JLFdB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QUdEOztBQUVEOzs7O3lCQUNLRSxDLEVBQUdDLEMsRUFBRztBQUNULFVBQUlDLEtBQUtGLENBQVQ7QUFBQSxVQUFZRyxLQUFLRixDQUFqQjs7QUFFQSxhQUFPQyxNQUFNQyxFQUFiLEVBQWlCO0FBQ2YsWUFBSUQsS0FBS0MsRUFBVCxFQUFhO0FBQ1hELGdCQUFNRixDQUFOO0FBQ0QsU0FGRCxNQUVPO0FBQ0xHLGdCQUFNRixDQUFOO0FBQ0Q7QUFDRjs7QUFFRCxhQUFPQyxFQUFQO0FBQ0Q7O0FBRUQ7Ozs7MkJBQ09FLFMsRUFBV0MsVSxFQUFZQyxXLEVBQWE7QUFDekMsYUFBT0YsWUFBWSxDQUFDQyxhQUFhRCxTQUFkLElBQTJCRSxXQUE5QztBQUNEOztBQUVEOzs7O3VDQUNtQlIsUSxFQUFVO0FBQzNCLGFBQU8sQ0FBQ0EsU0FBUyxDQUFULElBQWNBLFNBQVMsQ0FBVCxDQUFmLEtBQStCQSxTQUFTLENBQVQsSUFBY0EsU0FBUyxDQUFULENBQTdDLElBQ0EsQ0FBQ0EsU0FBUyxDQUFULElBQWNBLFNBQVMsQ0FBVCxDQUFmLEtBQStCQSxTQUFTLENBQVQsSUFBY0EsU0FBUyxDQUFULENBQTdDLENBREEsR0FFQSxDQUFDQSxTQUFTLENBQVQsSUFBY0EsU0FBUyxDQUFULENBQWYsS0FBK0JBLFNBQVMsQ0FBVCxJQUFjQSxTQUFTLENBQVQsQ0FBN0MsQ0FGUDtBQUdEOzs7OztrQkFHWTFKLGMiLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBNZWFuQ3Jvc3NpbmdSYXRlQmFzZSBmcm9tICcuL01lYW5Dcm9zc2luZ1JhdGUnO1xuXG4vKipcbiAqIENyZWF0ZSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aW1lIGluIHNlY29uZHMgYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50XG4gKiBlbnZpcm9ubmVtZW50IChub2RlIG9yIGJyb3dzZXIpLlxuICogSWYgcnVubmluZyBpbiBub2RlIHRoZSB0aW1lIHJlbHkgb24gYHByb2Nlc3MuaHJ0aW1lYCwgd2hpbGUgaWYgaW4gdGhlIGJyb3dzZXJcbiAqIGl0IGlzIHByb3ZpZGVkIGJ5IHRoZSBgRGF0ZWAgb2JqZWN0LlxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZ2V0VGltZUZ1bmN0aW9uKCkge1xuICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gYXNzdW1lIG5vZGVcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY29uc3QgdCA9IHByb2Nlc3MuaHJ0aW1lKCk7XG4gICAgICByZXR1cm4gdFswXSArIHRbMV0gKiAxZS05O1xuICAgIH1cbiAgfSBlbHNlIHsgLy8gYnJvd3NlclxuICAgIGlmICh3aW5kb3cucGVyZm9ybWFuY2UgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBpZiAoRGF0ZS5ub3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7IHJldHVybiBuZXcgRGF0ZS5nZXRUaW1lKCkgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7IHJldHVybiBEYXRlLm5vdygpIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAoKSA9PiB7IHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgfTtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgcGVyZk5vdyA9IGdldFRpbWVGdW5jdGlvbigpO1xuXG4vKipcbiAqIEB0b2RvIHR5cGVkZWYgY29uc3RydWN0b3IgYXJndW1lbnRcbiAqL1xuXG4vKlxuICogLy8gZXM1IHdpdGggYnJvd3NlcmlmeSA6XG4gKiB2YXIgbW90aW9uRmVhdHVyZXMgPSByZXF1aXJlKCdtb3Rpb24tZmVhdHVyZXMnKTtcbiAqIHZhciBtZiA9IG5ldyBtb3Rpb25GZWF0dXJlcy5Nb3Rpb25GZWF0dXJlcyh7IGZlYXR1cmVzOiBbJ2FjY0ludGVuc2l0eScsICdraWNrJ10gfSk7XG4gKlxuICogLy8gbG9hZGluZyBmcm9tIGEgXCJzY3JpcHRcIiB0YWcgOlxuICogdmFyIG1mID0gbmV3IG1vdGlvbkZlYXR1cmVzLk1vdGlvbkZlYXR1cmVzKHsgZmVhdHVyZXM6IFsnYWNjSW50ZW5zaXR5JywgJ2tpY2snXSB9KTtcbiAqL1xuXG5cbi8qKlxuICogQ2xhc3MgY29tcHV0aW5nIHRoZSBmZWF0dXJlcyBmcm9tIGFjY2VsZXJvbWV0ZXIgYW5kIGd5cm9zY29wZSBkYXRhLlxuICogPGJyIC8+XG4gKiBlczYgKyBicm93c2VyaWZ5IGV4YW1wbGUgOlxuICogYGBgSmF2YVNjcmlwdFxuICogaW1wb3J0IHsgTW90aW9uRmVhdHVyZXMgfSBmcm9tICdtb3Rpb24tZmVhdHVyZXMnO1xuICogY29uc3QgbWYgPSBuZXcgTW90aW9uRmVhdHVyZXMoeyBmZWF0dXJlczogWydhY2NJbnRlbnNpdHknLCAna2ljayddIH0pO1xuICpcbiAqIC8vIHRoZW4sIG9uIGVhY2ggbW90aW9uIGV2ZW50IDpcbiAqIG1mLnNldEFjY2VsZXJvbWV0ZXIoeCwgeSwgeik7XG4gKiBtZi5zZXRHeXJvc2NvcGUoYWxwaGEsIGJldGEsIGdhbW1hKTtcbiAqIG1mLnVwZGF0ZShmdW5jdGlvbihlcnIsIHJlcykge1xuICogICBpZiAoZXJyID09PSBudWxsKSB7XG4gKiAgICAgLy8gZG8gc29tZXRoaW5nIHdpdGggcmVzXG4gKiAgIH1cbiAqIH0pO1xuICogYGBgXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgTW90aW9uRmVhdHVyZXMge1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gaW5pdE9iamVjdCAtIG9iamVjdCBjb250YWluaW5nIGFuIGFycmF5IG9mIHRoZVxuICAgKiByZXF1aXJlZCBmZWF0dXJlcyBhbmQgc29tZSB2YXJpYWJsZXMgdXNlZCB0byBjb21wdXRlIHRoZSBmZWF0dXJlc1xuICAgKiB0aGF0IHlvdSBtaWdodCB3YW50IHRvIGNoYW5nZSAoZm9yIGV4YW1wbGUgaWYgdGhlIGJyb3dzZXIgaXMgY2hyb21lIHlvdVxuICAgKiBtaWdodCB3YW50IHRvIHNldCBgZ3lySXNJbkRlZ3JlZXNgIHRvIGZhbHNlIGJlY2F1c2UgaXQncyB0aGUgY2FzZSBvbiBzb21lXG4gICAqIHZlcnNpb25zLCBvciB5b3UgbWlnaHQgd2FudCB0byBjaGFuZ2Ugc29tZSB0aHJlc2hvbGRzKS5cbiAgICogU2VlIHRoZSBjb2RlIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEB0b2RvIHVzZSB0eXBlZGVmIHRvIGRlc2NyaWJlIHRoZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnNcbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgZmVhdHVyZXM6IFtcbiAgICAgICAgJ2FjY1JhdycsXG4gICAgICAgICdneXJSYXcnLFxuICAgICAgICAnYWNjSW50ZW5zaXR5JyxcbiAgICAgICAgJ2d5ckludGVuc2l0eScsXG4gICAgICAgICdmcmVlZmFsbCcsXG4gICAgICAgICdraWNrJyxcbiAgICAgICAgJ3NoYWtlJyxcbiAgICAgICAgJ3NwaW4nLFxuICAgICAgICAnc3RpbGwnLFxuICAgICAgICAnZ3lyWmNyJyxcbiAgICAgICAgJ2FjY1pjcidcbiAgICAgIF0sXG5cbiAgICAgIGd5cklzSW5EZWdyZWVzOiB0cnVlLFxuXG4gICAgICBhY2NJbnRlbnNpdHlQYXJhbTE6IDAuOCxcbiAgICAgIGFjY0ludGVuc2l0eVBhcmFtMjogMC4xLFxuXG4gICAgICBneXJJbnRlbnNpdHlQYXJhbTE6IDAuOSxcbiAgICAgIGd5ckludGVuc2l0eVBhcmFtMjogMSxcblxuICAgICAgZnJlZWZhbGxBY2NUaHJlc2g6IDAuMTUsXG4gICAgICBmcmVlZmFsbEd5clRocmVzaDogNzUwLFxuICAgICAgZnJlZWZhbGxHeXJEZWx0YVRocmVzaDogNDAsXG5cbiAgICAgIGtpY2tUaHJlc2g6IDAuMDEsXG4gICAgICBraWNrU3BlZWRHYXRlOiAyMDAsXG4gICAgICBraWNrTWVkaWFuRmlsdGVyc2l6ZTogOSxcbiAgICAgIGtpY2tDYWxsYmFjazogbnVsbCxcblxuICAgICAgc2hha2VUaHJlc2g6IDAuMSxcbiAgICAgIHNoYWtlV2luZG93U2l6ZTogMjAwLFxuICAgICAgc2hha2VTbGlkZUZhY3RvcjogMTAsXG5cbiAgICAgIHNwaW5UaHJlc2g6IDIwMCxcblxuICAgICAgc3RpbGxUaHJlc2g6IDUwMDAsXG4gICAgICBzdGlsbFNsaWRlRmFjdG9yOiA1LFxuXG4gICAgICBneXJaY3JOb2lzZVRocmVzaDogMC4wMSxcbiAgICAgIGd5clpjckZyYW1lU2l6ZTogMTAwLFxuICAgICAgZ3lyWmNySG9wU2l6ZTogMTAsXG5cbiAgICAgIGFjY1pjck5vaXNlVGhyZXNoOiAwLjAxLFxuICAgICAgYWNjWmNyRnJhbWVTaXplOiAxMDAsXG4gICAgICBhY2NaY3JIb3BTaXplOiAxMCxcbiAgICB9O1xuXG4gICAgdGhpcy5fcGFyYW1zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIC8vY29uc29sZS5sb2codGhpcy5fcGFyYW1zLmZlYXR1cmVzKTtcblxuICAgIHRoaXMuX21ldGhvZHMgPSB7XG4gICAgICBhY2NSYXc6IHRoaXMuX3VwZGF0ZUFjY1Jhdy5iaW5kKHRoaXMpLFxuICAgICAgZ3lyUmF3OiB0aGlzLl91cGRhdGVHeXJSYXcuYmluZCh0aGlzKSxcbiAgICAgIGFjY0ludGVuc2l0eTogdGhpcy5fdXBkYXRlQWNjSW50ZW5zaXR5LmJpbmQodGhpcyksXG4gICAgICBneXJJbnRlbnNpdHk6IHRoaXMuX3VwZGF0ZUd5ckludGVuc2l0eS5iaW5kKHRoaXMpLFxuICAgICAgZnJlZWZhbGw6IHRoaXMuX3VwZGF0ZUZyZWVmYWxsLmJpbmQodGhpcyksXG4gICAgICBraWNrOiB0aGlzLl91cGRhdGVLaWNrLmJpbmQodGhpcyksXG4gICAgICBzaGFrZTogdGhpcy5fdXBkYXRlU2hha2UuYmluZCh0aGlzKSxcbiAgICAgIHNwaW46IHRoaXMuX3VwZGF0ZVNwaW4uYmluZCh0aGlzKSxcbiAgICAgIHN0aWxsOiB0aGlzLl91cGRhdGVTdGlsbC5iaW5kKHRoaXMpLFxuICAgICAgZ3lyWmNyOiB0aGlzLl91cGRhdGVHeXJaY3IuYmluZCh0aGlzKSxcbiAgICAgIGFjY1pjcjogdGhpcy5fdXBkYXRlQWNjWmNyLmJpbmQodGhpcylcbiAgICB9O1xuXG4gICAgdGhpcy5fa2lja0NhbGxiYWNrID0gdGhpcy5fcGFyYW1zLmtpY2tDYWxsYmFjaztcblxuICAgIHRoaXMuYWNjID0gWzAsIDAsIDBdO1xuICAgIHRoaXMuZ3lyID0gWzAsIDAsIDBdO1xuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gYWNjIGludGVuc2l0eVxuICAgIHRoaXMuX2FjY0xhc3QgPSBbXG4gICAgICBbMCwgMCwgMF0sXG4gICAgICBbMCwgMCwgMF0sXG4gICAgICBbMCwgMCwgMF1cbiAgICBdO1xuICAgIHRoaXMuX2FjY0ludGVuc2l0eUxhc3QgPSBbXG4gICAgICBbMCwgMF0sXG4gICAgICBbMCwgMF0sXG4gICAgICBbMCwgMF1cbiAgICBdO1xuICAgIHRoaXMuX2FjY0ludGVuc2l0eSA9IFswLCAwLCAwXTtcbiAgICB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtID0gMDtcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gZnJlZWZhbGxcbiAgICB0aGlzLl9hY2NOb3JtID0gMDtcbiAgICB0aGlzLl9neXJEZWx0YSA9IFswLCAwLCAwXTtcbiAgICB0aGlzLl9neXJOb3JtID0gMDtcbiAgICB0aGlzLl9neXJEZWx0YU5vcm0gPSAwO1xuICAgIHRoaXMuX2ZhbGxCZWdpbiA9IHBlcmZOb3coKTtcbiAgICB0aGlzLl9mYWxsRW5kID0gcGVyZk5vdygpO1xuICAgIHRoaXMuX2ZhbGxEdXJhdGlvbiA9IDA7XG4gICAgdGhpcy5faXNGYWxsaW5nID0gZmFsc2U7XG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBneXIgaW50ZW5zaXR5XG4gICAgdGhpcy5fZ3lyTGFzdCA9IFtcbiAgICAgIFswLCAwLCAwXSxcbiAgICAgIFswLCAwLCAwXSxcbiAgICAgIFswLCAwLCAwXVxuICAgIF07XG4gICAgdGhpcy5fZ3lySW50ZW5zaXR5TGFzdCA9IFtcbiAgICAgIFswLCAwXSxcbiAgICAgIFswLCAwXSxcbiAgICAgIFswLCAwXVxuICAgIF07XG4gICAgdGhpcy5fZ3lySW50ZW5zaXR5ID0gWzAsIDAsIDBdO1xuICAgIHRoaXMuX2d5ckludGVuc2l0eU5vcm0gPSAwO1xuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0ga2lja1xuICAgIHRoaXMuX2tpY2tJbnRlbnNpdHkgPSAwO1xuICAgIHRoaXMuX2xhc3RLaWNrID0gMDtcbiAgICB0aGlzLl9pc0tpY2tpbmcgPSBmYWxzZTtcbiAgICB0aGlzLl9tZWRpYW5WYWx1ZXMgPSBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF07XG4gICAgdGhpcy5fbWVkaWFuTGlua2luZyA9IFszLCA0LCAxLCA1LCA3LCA4LCAwLCAyLCA2XTtcbiAgICB0aGlzLl9tZWRpYW5GaWZvID0gWzYsIDIsIDcsIDAsIDEsIDMsIDgsIDQsIDVdO1xuICAgIHRoaXMuX2kxID0gMDtcbiAgICB0aGlzLl9pMiA9IDA7XG4gICAgdGhpcy5faTMgPSAwO1xuICAgIHRoaXMuX2FjY0ludGVuc2l0eU5vcm1NZWRpYW4gPSAwO1xuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBzaGFrZVxuICAgIHRoaXMuX2FjY0RlbHRhID0gWzAsIDAsIDBdO1xuICAgIHRoaXMuX3NoYWtlV2luZG93ID0gW1xuICAgICAgbmV3IEFycmF5KHRoaXMuX3BhcmFtcy5zaGFrZVdpbmRvd1NpemUpLFxuICAgICAgbmV3IEFycmF5KHRoaXMuX3BhcmFtcy5zaGFrZVdpbmRvd1NpemUpLFxuICAgICAgbmV3IEFycmF5KHRoaXMuX3BhcmFtcy5zaGFrZVdpbmRvd1NpemUpXG4gICAgXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLl9wYXJhbXMuc2hha2VXaW5kb3dTaXplOyBqKyspIHtcbiAgICAgICAgdGhpcy5fc2hha2VXaW5kb3dbaV1bal0gPSAwO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zaGFrZU5iID0gWzAsIDAsIDBdO1xuICAgIHRoaXMuX3NoYWtpbmdSYXcgPSAwO1xuICAgIHRoaXMuX3NoYWtlU2xpZGVQcmV2ID0gMDtcbiAgICB0aGlzLl9zaGFraW5nID0gMDtcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IHNwaW5cbiAgICB0aGlzLl9zcGluQmVnaW4gPSBwZXJmTm93KCk7XG4gICAgdGhpcy5fc3BpbkVuZCA9IHBlcmZOb3coKTtcbiAgICB0aGlzLl9zcGluRHVyYXRpb24gPSAwO1xuICAgIHRoaXMuX2lzU3Bpbm5pbmcgPSBmYWxzZTtcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gc3RpbGxcbiAgICB0aGlzLl9zdGlsbENyb3NzUHJvZCA9IDA7XG4gICAgdGhpcy5fc3RpbGxTbGlkZSA9IDA7XG4gICAgdGhpcy5fc3RpbGxTbGlkZVByZXYgPSAwO1xuICAgIHRoaXMuX2lzU3RpbGwgPSBmYWxzZTtcblxuICAgIHRoaXMuX2xvb3BJbmRleFBlcmlvZCA9IHRoaXMuX2xjbShcbiAgICAgIHRoaXMuX2xjbShcbiAgICAgICAgdGhpcy5fbGNtKDIsIDMpLCB0aGlzLl9wYXJhbXMua2lja01lZGlhbkZpbHRlcnNpemVcbiAgICAgICksXG4gICAgICB0aGlzLl9wYXJhbXMuc2hha2VXaW5kb3dTaXplXG4gICAgKTtcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuX2xvb3BJbmRleFBlcmlvZCk7XG4gICAgdGhpcy5fbG9vcEluZGV4ID0gMDtcblxuICAgIGNvbnN0IGhhc0d5clpjciA9IHRoaXMuX3BhcmFtcy5mZWF0dXJlcy5pbmRleE9mKCdneXJaY3InKSA+IC0xO1xuICAgIGNvbnN0IGhhc0FjY1pjciA9IHRoaXMuX3BhcmFtcy5mZWF0dXJlcy5pbmRleE9mKCdhY2NaY3InKSA+IC0xO1xuXG4gICAgaWYgKGhhc0d5clpjcikge1xuICAgICAgdGhpcy5fZ3lyWmNyID0gbmV3IE1lYW5Dcm9zc2luZ1JhdGUoe1xuICAgICAgICBub2lzZVRocmVzaG9sZDogdGhpcy5fcGFyYW1zLmd5clpjck5vaXNlVGhyZXNoLFxuICAgICAgICBmcmFtZVNpemU6IHRoaXMuX3BhcmFtcy5neXJaY3JGcmFtZVNpemUsXG4gICAgICAgIGhvcFNpemU6IHRoaXMuX3BhcmFtcy5neXJaY3JIb3BTaXplXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoaGFzQWNjWmNyKSB7XG4gICAgICB0aGlzLl9hY2NaY3IgPSBuZXcgTWVhbkNyb3NzaW5nUmF0ZSh7XG4gICAgICAgIG5vaXNlVGhyZXNob2xkOiB0aGlzLl9wYXJhbXMuYWNjWmNyTm9pc2VUaHJlc2gsXG4gICAgICAgIGZyYW1lU2l6ZTogdGhpcy5fcGFyYW1zLmFjY1pjckZyYW1lU2l6ZSxcbiAgICAgICAgaG9wU2l6ZTogdGhpcy5fcGFyYW1zLmFjY1pjckhvcFNpemVcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vPT09PT09PT09PSBpbnRlcmZhY2UgPT09PT09PT09Ly9cblxuICAvKipcbiAgICogVXBkYXRlIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyAoZXhjZXB0IGZlYXR1cmVzIGxpc3QpXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBhIHN1YnNldCBvZiB0aGUgY29uc3RydWN0b3IncyBwYXJhbWV0ZXJzXG4gICAqL1xuICB1cGRhdGVQYXJhbXMocGFyYW1zID0ge30pIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gcGFyYW1zKSB7XG4gICAgICBpZiAoa2V5ICE9PSAnZmVhdHVyZXMnKSB7XG4gICAgICAgIHRoaXMuX3BhcmFtc1trZXldID0gcGFyYW1zW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGN1cnJlbnQgYWNjZWxlcm9tZXRlciB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB4IC0gdGhlIGFjY2VsZXJvbWV0ZXIncyB4IHZhbHVlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB5IC0gdGhlIGFjY2VsZXJvbWV0ZXIncyB5IHZhbHVlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB6IC0gdGhlIGFjY2VsZXJvbWV0ZXIncyB6IHZhbHVlXG4gICAqL1xuICBzZXRBY2NlbGVyb21ldGVyKHgsIHkgPSAwLCB6ID0gMCkge1xuICAgIHRoaXMuYWNjWzBdID0geDtcbiAgICB0aGlzLmFjY1sxXSA9IHk7XG4gICAgdGhpcy5hY2NbMl0gPSB6O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGN1cnJlbnQgZ3lyb3Njb3BlIHZhbHVlcy5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHggLSB0aGUgZ3lyb3Njb3BlJ3MgeCB2YWx1ZVxuICAgKiBAcGFyYW0ge051bWJlcn0geSAtIHRoZSBneXJvc2NvcGUncyB5IHZhbHVlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB6IC0gdGhlIGd5cm9zY29wZSdzIHogdmFsdWVcbiAgICovXG4gIHNldEd5cm9zY29wZSh4LCB5ID0gMCwgeiA9IDApIHtcbiAgICB0aGlzLmd5clswXSA9IHg7XG4gICAgdGhpcy5neXJbMV0gPSB5O1xuICAgIHRoaXMuZ3lyWzJdID0gejtcbiAgICBpZiAodGhpcy5fcGFyYW1zLmd5cklzSW5EZWdyZWVzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICB0aGlzLmd5cltpXSAqPSAoMiAqIE1hdGguUEkgLyAzNjAuKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW50ZW5zaXR5IG9mIHRoZSBtb3ZlbWVudCBzZW5zZWQgYnkgYW4gYWNjZWxlcm9tZXRlci5cbiAgICogQHR5cGVkZWYgYWNjSW50ZW5zaXR5XG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBub3JtIC0gdGhlIGdsb2JhbCBlbmVyZ3kgY29tcHV0ZWQgb24gYWxsIGRpbWVuc2lvbnMuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSB4IC0gdGhlIGVuZXJneSBpbiB0aGUgeCAoZmlyc3QpIGRpbWVuc2lvbi5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IHkgLSB0aGUgZW5lcmd5IGluIHRoZSB5IChzZWNvbmQpIGRpbWVuc2lvbi5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IHogLSB0aGUgZW5lcmd5IGluIHRoZSB6ICh0aGlyZCkgZGltZW5zaW9uLlxuICAgKi9cblxuICAvKipcbiAgICogSW50ZW5zaXR5IG9mIHRoZSBtb3ZlbWVudCBzZW5zZWQgYnkgYSBneXJvc2NvcGUuXG4gICAqIEB0eXBlZGVmIGd5ckludGVuc2l0eVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge051bWJlcn0gbm9ybSAtIHRoZSBnbG9iYWwgZW5lcmd5IGNvbXB1dGVkIG9uIGFsbCBkaW1lbnNpb25zLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0geCAtIHRoZSBlbmVyZ3kgaW4gdGhlIHggKGZpcnN0KSBkaW1lbnNpb24uXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSB5IC0gdGhlIGVuZXJneSBpbiB0aGUgeSAoc2Vjb25kKSBkaW1lbnNpb24uXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSB6IC0gdGhlIGVuZXJneSBpbiB0aGUgeiAodGhpcmQpIGRpbWVuc2lvbi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBmcmVlIGZhbGxpbmcgc3RhdGUgb2YgdGhlIHNlbnNvci5cbiAgICogQHR5cGVkZWYgZnJlZWZhbGxcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGFjY05vcm0gLSB0aGUgbm9ybSBvZiB0aGUgYWNjZWxlcmF0aW9uLlxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGZhbGxpbmcgLSB0cnVlIGlmIHRoZSBzZW5zb3IgaXMgZnJlZSBmYWxsaW5nLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBkdXJhdGlvbiAtIHRoZSBkdXJhdGlvbiBvZiB0aGUgZnJlZSBmYWxsaW5nIHNpbmNlIGl0cyBiZWdpbm5pbmcuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBJbXB1bHNlIC8gaGl0IG1vdmVtZW50IGRldGVjdGlvbiBpbmZvcm1hdGlvbi5cbiAgICogQHR5cGVkZWYga2lja1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge051bWJlcn0gaW50ZW5zaXR5IC0gdGhlIGN1cnJlbnQgaW50ZW5zaXR5IG9mIHRoZSBcImtpY2tcIiBnZXN0dXJlLlxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGtpY2tpbmcgLSB0cnVlIGlmIGEgXCJraWNrXCIgZ2VzdHVyZSBpcyBiZWluZyBkZXRlY3RlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cblxuICAvKipcbiAgICogU2hha2UgbW92ZW1lbnQgZGV0ZWN0aW9uIGluZm9ybWF0aW9uLlxuICAgKiBAdHlwZWRlZiBzaGFrZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge051bWJlcn0gc2hha2luZyAtIHRoZSBjdXJyZW50IGFtb3VudCBvZiBcInNoYWtpbmVzc1wiLlxuICAgKi9cblxuICAvKipcbiAgICogSW5mb3JtYXRpb24gYWJvdXQgdGhlIHNwaW5uaW5nIHN0YXRlIG9mIHRoZSBzZW5zb3IuXG4gICAqIEB0eXBlZGVmIHNwaW5cbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBzcGlubmluZyAtIHRydWUgaWYgdGhlIHNlbnNvciBpcyBzcGlubmluZywgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZHVyYXRpb24gLSB0aGUgZHVyYXRpb24gb2YgdGhlIHNwaW5uaW5nIHNpbmNlIGl0cyBiZWdpbm5pbmcuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBneXJOb3JtIC0gdGhlIG5vcm0gb2YgdGhlIHJvdGF0aW9uIHNwZWVkLlxuICAgKi9cblxuICAvKipcbiAgICogSW5mb3JtYXRpb24gYWJvdXQgdGhlIHN0aWxsbmVzcyBvZiB0aGUgc2Vuc29yLlxuICAgKiBAdHlwZWRlZiBzdGlsbFxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IHN0aWxsIC0gdHJ1ZSBpZiB0aGUgc2Vuc29yIGlzIHN0aWxsLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBzbGlkZSAtIHRoZSBvcmlnaW5hbCB2YWx1ZSB0aHJlc2hvbGRlZCB0byBkZXRlcm1pbmUgc3RpbGxuZXNzLlxuICAgKi9cblxuICAvKipcbiAgICogQ29tcHV0ZWQgZmVhdHVyZXMuXG4gICAqIEB0eXBlZGVmIGZlYXR1cmVzXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7YWNjSW50ZW5zaXR5fSBhY2NJbnRlbnNpdHkgLSBJbnRlbnNpdHkgb2YgdGhlIG1vdmVtZW50IHNlbnNlZCBieSBhbiBhY2NlbGVyb21ldGVyLlxuICAgKiBAcHJvcGVydHkge2d5ckludGVuc2l0eX0gZ3lySW50ZW5zaXR5IC0gSW50ZW5zaXR5IG9mIHRoZSBtb3ZlbWVudCBzZW5zZWQgYnkgYSBneXJvc2NvcGUuXG4gICAqIEBwcm9wZXJ0eSB7ZnJlZWZhbGx9IGZyZWVmYWxsIC0gSW5mb3JtYXRpb24gYWJvdXQgdGhlIGZyZWUgZmFsbGluZyBzdGF0ZSBvZiB0aGUgc2Vuc29yLlxuICAgKiBAcHJvcGVydHkge2tpY2t9IGtpY2sgLSBJbXB1bHNlIC8gaGl0IG1vdmVtZW50IGRldGVjdGlvbiBpbmZvcm1hdGlvbi5cbiAgICogQHByb3BlcnR5IHtzaGFrZX0gc2hha2UgLSBTaGFrZSBtb3ZlbWVudCBkZXRlY3Rpb24gaW5mb3JtYXRpb24uXG4gICAqIEBwcm9wZXJ0eSB7c3Bpbn0gc3BpbiAtIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzcGlubmluZyBzdGF0ZSBvZiB0aGUgc2Vuc29yLlxuICAgKiBAcHJvcGVydHkge3N0aWxsfSBzdGlsbCAtIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzdGlsbG5lc3Mgb2YgdGhlIHNlbnNvci5cbiAgICovXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIGhhbmRsaW5nIHRoZSBmZWF0dXJlcy5cbiAgICogQGNhbGxiYWNrIGZlYXR1cmVzQ2FsbGJhY2tcbiAgICogQHBhcmFtIHtTdHJpbmd9IGVyciAtIERlc2NyaXB0aW9uIG9mIGEgcG90ZW50aWFsIGVycm9yLlxuICAgKiBAcGFyYW0ge2ZlYXR1cmVzfSByZXMgLSBPYmplY3QgaG9sZGluZyB0aGUgZmVhdHVyZSB2YWx1ZXMuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyBjb21wdXRhdGlvbiBvZiB0aGUgZmVhdHVyZXMgZnJvbSB0aGUgY3VycmVudCBzZW5zb3IgdmFsdWVzIGFuZFxuICAgKiBwYXNzIHRoZSByZXN1bHRzIHRvIGEgY2FsbGJhY2tcbiAgICogQHBhcmFtIHtmZWF0dXJlc0NhbGxiYWNrfSBjYWxsYmFjayAtIFRoZSBjYWxsYmFjayBoYW5kbGluZyB0aGUgbGFzdCBjb21wdXRlZCBmZWF0dXJlc1xuICAgKiBAcmV0dXJucyB7ZmVhdHVyZXN9IGZlYXR1cmVzIC0gUmV0dXJuIHRoZXNlIGNvbXB1dGVkIGZlYXR1cmVzIGFueXdheVxuICAgKi9cbiAgdXBkYXRlKGNhbGxiYWNrID0gbnVsbCkge1xuICAgIC8vIERFQUwgV0lUSCB0aGlzLl9lbGFwc2VkVGltZVxuICAgIHRoaXMuX2VsYXBzZWRUaW1lID0gcGVyZk5vdygpO1xuICAgIC8vIGlzIHRoaXMgb25lIHVzZWQgYnkgc2V2ZXJhbCBmZWF0dXJlcyA/XG4gICAgdGhpcy5fYWNjTm9ybSA9IHRoaXMuX21hZ25pdHVkZTNEKHRoaXMuYWNjKTtcbiAgICAvLyB0aGlzIG9uZSBuZWVkcyBiZSBoZXJlIGJlY2F1c2UgdXNlZCBieSBmcmVlZmFsbCBBTkQgc3BpblxuICAgIHRoaXMuX2d5ck5vcm0gPSB0aGlzLl9tYWduaXR1ZGUzRCh0aGlzLmd5cik7XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5neXIpO1xuXG4gICAgbGV0IGVyciA9IG51bGw7XG4gICAgbGV0IHJlcyA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIHJlcyA9IHt9O1xuICAgICAgZm9yIChsZXQga2V5IG9mIHRoaXMuX3BhcmFtcy5mZWF0dXJlcykge1xuICAgICAgICBpZiAodGhpcy5fbWV0aG9kc1trZXldKSB7XG4gICAgICAgICAgdGhpcy5fbWV0aG9kc1trZXldKHJlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cblxuICAgIHRoaXMuX2xvb3BJbmRleCA9ICh0aGlzLl9sb29wSW5kZXggKyAxKSAlIHRoaXMuX2xvb3BJbmRleFBlcmlvZDtcblxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soZXJyLCByZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09IHNwZWNpZmljIGZlYXR1cmVzIGNvbXB1dGluZyA9PT09PT09PT09PT09PT09PT09PT0vL1xuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3VwZGF0ZUFjY1JhdyhyZXMpIHtcbiAgICByZXMuYWNjUmF3ID0ge1xuICAgICAgeDogdGhpcy5hY2NbMF0sXG4gICAgICB5OiB0aGlzLmFjY1sxXSxcbiAgICAgIHo6IHRoaXMuYWNjWzJdXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfdXBkYXRlR3lyUmF3KHJlcykge1xuICAgIHJlcy5neXJSYXcgPSB7XG4gICAgICB4OiB0aGlzLmd5clswXSxcbiAgICAgIHk6IHRoaXMuZ3lyWzFdLFxuICAgICAgejogdGhpcy5neXJbMl1cbiAgICB9O1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBhY2MgaW50ZW5zaXR5XG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfdXBkYXRlQWNjSW50ZW5zaXR5KHJlcykge1xuICAgIHRoaXMuX2FjY0ludGVuc2l0eU5vcm0gPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIHRoaXMuX2FjY0xhc3RbaV1bdGhpcy5fbG9vcEluZGV4ICUgM10gPSB0aGlzLmFjY1tpXTtcblxuICAgICAgdGhpcy5fYWNjSW50ZW5zaXR5W2ldID0gdGhpcy5faW50ZW5zaXR5MUQoXG4gICAgICAgIHRoaXMuYWNjW2ldLFxuICAgICAgICB0aGlzLl9hY2NMYXN0W2ldWyh0aGlzLl9sb29wSW5kZXggKyAxKSAlIDNdLFxuICAgICAgICB0aGlzLl9hY2NJbnRlbnNpdHlMYXN0W2ldWyh0aGlzLl9sb29wSW5kZXggKyAxKSAlIDJdLFxuICAgICAgICB0aGlzLl9wYXJhbXMuYWNjSW50ZW5zaXR5UGFyYW0xLFxuICAgICAgICB0aGlzLl9wYXJhbXMuYWNjSW50ZW5zaXR5UGFyYW0yLFxuICAgICAgICAxXG4gICAgICApO1xuXG4gICAgICB0aGlzLl9hY2NJbnRlbnNpdHlMYXN0W2ldW3RoaXMuX2xvb3BJbmRleCAlIDJdID0gdGhpcy5fYWNjSW50ZW5zaXR5W2ldO1xuXG4gICAgICB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtICs9IHRoaXMuX2FjY0ludGVuc2l0eVtpXTtcbiAgICB9XG5cbiAgICByZXMuYWNjSW50ZW5zaXR5ID0ge1xuICAgICAgbm9ybTogdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybSxcbiAgICAgIHg6IHRoaXMuX2FjY0ludGVuc2l0eVswXSxcbiAgICAgIHk6IHRoaXMuX2FjY0ludGVuc2l0eVsxXSxcbiAgICAgIHo6IHRoaXMuX2FjY0ludGVuc2l0eVsyXVxuICAgIH07XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGd5ciBpbnRlbnNpdHlcbiAgLyoqIEBwcml2YXRlICovXG4gIF91cGRhdGVHeXJJbnRlbnNpdHkocmVzKSB7XG4gICAgdGhpcy5fZ3lySW50ZW5zaXR5Tm9ybSA9IDA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgdGhpcy5fZ3lyTGFzdFtpXVt0aGlzLl9sb29wSW5kZXggJSAzXSA9IHRoaXMuZ3lyW2ldO1xuXG4gICAgICB0aGlzLl9neXJJbnRlbnNpdHlbaV0gPSB0aGlzLl9pbnRlbnNpdHkxRChcbiAgICAgICAgdGhpcy5neXJbaV0sXG4gICAgICAgIHRoaXMuX2d5ckxhc3RbaV1bKHRoaXMuX2xvb3BJbmRleCArIDEpICUgM10sXG4gICAgICAgIHRoaXMuX2d5ckludGVuc2l0eUxhc3RbaV1bKHRoaXMuX2xvb3BJbmRleCArIDEpICUgMl0sXG4gICAgICAgIHRoaXMuX3BhcmFtcy5neXJJbnRlbnNpdHlQYXJhbTEsXG4gICAgICAgIHRoaXMuX3BhcmFtcy5neXJJbnRlbnNpdHlQYXJhbTIsXG4gICAgICAgIDFcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuX2d5ckludGVuc2l0eUxhc3RbaV1bdGhpcy5fbG9vcEluZGV4ICUgMl0gPSB0aGlzLl9neXJJbnRlbnNpdHlbaV07XG5cbiAgICAgIHRoaXMuX2d5ckludGVuc2l0eU5vcm0gKz0gdGhpcy5fZ3lySW50ZW5zaXR5W2ldO1xuICAgIH1cblxuICAgIHJlcy5neXJJbnRlbnNpdHkgPSB7XG4gICAgICBub3JtOiB0aGlzLl9neXJJbnRlbnNpdHlOb3JtLFxuICAgICAgeDogdGhpcy5fZ3lySW50ZW5zaXR5WzBdLFxuICAgICAgeTogdGhpcy5fZ3lySW50ZW5zaXR5WzFdLFxuICAgICAgejogdGhpcy5fZ3lySW50ZW5zaXR5WzJdXG4gICAgfTtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBmcmVlZmFsbFxuICAvKiogQHByaXZhdGUgKi9cbiAgX3VwZGF0ZUZyZWVmYWxsKHJlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICB0aGlzLl9neXJEZWx0YVtpXSA9XG4gICAgICAgIHRoaXMuX2RlbHRhKHRoaXMuX2d5ckxhc3RbaV1bKHRoaXMuX2xvb3BJbmRleCArIDEpICUgM10sIHRoaXMuZ3lyW2ldLCAxKTtcbiAgICB9XG5cbiAgICB0aGlzLl9neXJEZWx0YU5vcm0gPSB0aGlzLl9tYWduaXR1ZGUzRCh0aGlzLl9neXJEZWx0YSk7XG5cbiAgICBpZiAodGhpcy5fYWNjTm9ybSA8IHRoaXMuX3BhcmFtcy5mcmVlZmFsbEFjY1RocmVzaCB8fFxuICAgICAgICAodGhpcy5fZ3lyTm9ybSA+IHRoaXMuX3BhcmFtcy5mcmVlZmFsbEd5clRocmVzaFxuICAgICAgICAgICYmIHRoaXMuX2d5ckRlbHRhTm9ybSA8IHRoaXMuX3BhcmFtcy5mcmVlZmFsbEd5ckRlbHRhVGhyZXNoKSkge1xuICAgICAgaWYgKCF0aGlzLl9pc0ZhbGxpbmcpIHtcbiAgICAgICAgdGhpcy5faXNGYWxsaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fZmFsbEJlZ2luID0gcGVyZk5vdygpO1xuICAgICAgfVxuICAgICAgdGhpcy5fZmFsbEVuZCA9IHBlcmZOb3coKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuX2lzRmFsbGluZykge1xuICAgICAgICB0aGlzLl9pc0ZhbGxpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fZmFsbER1cmF0aW9uID0gKHRoaXMuX2ZhbGxFbmQgLSB0aGlzLl9mYWxsQmVnaW4pO1xuXG4gICAgcmVzLmZyZWVmYWxsID0ge1xuICAgICAgYWNjTm9ybTogdGhpcy5fYWNjTm9ybSxcbiAgICAgIGZhbGxpbmc6IHRoaXMuX2lzRmFsbGluZyxcbiAgICAgIGR1cmF0aW9uOiB0aGlzLl9mYWxsRHVyYXRpb25cbiAgICB9O1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBraWNrXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfdXBkYXRlS2ljayhyZXMpIHtcbiAgICB0aGlzLl9pMyA9IHRoaXMuX2xvb3BJbmRleCAlIHRoaXMuX3BhcmFtcy5raWNrTWVkaWFuRmlsdGVyc2l6ZTtcbiAgICB0aGlzLl9pMSA9IHRoaXMuX21lZGlhbkZpZm9bdGhpcy5faTNdO1xuICAgIHRoaXMuX2kyID0gMTtcblxuICAgIGlmICh0aGlzLl9pMSA8IHRoaXMuX3BhcmFtcy5raWNrTWVkaWFuRmlsdGVyc2l6ZSAtIDEgJiZcbiAgICAgICAgdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybSA+IHRoaXMuX21lZGlhblZhbHVlc1t0aGlzLl9pMSArIHRoaXMuX2kyXSkge1xuICAgICAgLy8gY2hlY2sgcmlnaHRcbiAgICAgIHdoaWxlICh0aGlzLl9pMSArIHRoaXMuX2kyIDwgdGhpcy5raWNrTWVkaWFuRmlsdGVyc2l6ZSAmJlxuICAgICAgICAgICAgICB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtID4gdGhpcy5fbWVkaWFuVmFsdWVzW3RoaXMuX2kxICsgdGhpcy5faTJdKSB7XG4gICAgICAgIHRoaXMuX21lZGlhbkZpZm9bdGhpcy5fbWVkaWFuTGlua2luZ1t0aGlzLl9pMSArIHRoaXMuX2kyXV0gPVxuICAgICAgICB0aGlzLl9tZWRpYW5GaWZvW3RoaXMuX21lZGlhbkxpbmtpbmdbdGhpcy5faTEgKyB0aGlzLl9pMl1dIC0gMTtcbiAgICAgICAgdGhpcy5fbWVkaWFuVmFsdWVzW3RoaXMuX2kxICsgdGhpcy5faTIgLSAxXSA9XG4gICAgICAgIHRoaXMuX21lZGlhblZhbHVlc1t0aGlzLl9pMSArIHRoaXMuX2kyXTtcbiAgICAgICAgdGhpcy5fbWVkaWFuTGlua2luZ1t0aGlzLl9pMSArIHRoaXMuX2kyIC0gMV0gPVxuICAgICAgICB0aGlzLl9tZWRpYW5MaW5raW5nW3RoaXMuX2kxICsgdGhpcy5faTJdO1xuICAgICAgICB0aGlzLl9pMisrO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWVkaWFuVmFsdWVzW3RoaXMuX2kxICsgdGhpcy5faTIgLSAxXSA9IHRoaXMuX2FjY0ludGVuc2l0eU5vcm07XG4gICAgICB0aGlzLl9tZWRpYW5MaW5raW5nW3RoaXMuX2kxICsgdGhpcy5faTIgLSAxXSA9IHRoaXMuX2kzO1xuICAgICAgdGhpcy5fbWVkaWFuRmlmb1t0aGlzLl9pM10gPSB0aGlzLl9pMSArIHRoaXMuX2kyIC0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY2hlY2sgbGVmdFxuICAgICAgd2hpbGUgKHRoaXMuX2kyIDwgdGhpcy5faTEgKyAxICYmXG4gICAgICAgICAgICAgdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybSA8IHRoaXMuX21lZGlhblZhbHVlc1t0aGlzLl9pMSAtIHRoaXMuX2kyXSkge1xuICAgICAgICB0aGlzLl9tZWRpYW5GaWZvW3RoaXMuX21lZGlhbkxpbmtpbmdbdGhpcy5faTEgLSB0aGlzLl9pMl1dID1cbiAgICAgICAgdGhpcy5fbWVkaWFuRmlmb1t0aGlzLl9tZWRpYW5MaW5raW5nW3RoaXMuX2kxIC0gdGhpcy5faTJdXSArIDE7XG4gICAgICAgIHRoaXMuX21lZGlhblZhbHVlc1t0aGlzLl9pMSAtIHRoaXMuX2kyICsgMV0gPVxuICAgICAgICB0aGlzLl9tZWRpYW5WYWx1ZXNbdGhpcy5faTEgLSB0aGlzLl9pMl07XG4gICAgICAgIHRoaXMuX21lZGlhbkxpbmtpbmdbdGhpcy5faTEgLSB0aGlzLl9pMiArIDFdID1cbiAgICAgICAgdGhpcy5fbWVkaWFuTGlua2luZ1t0aGlzLl9pMSAtIHRoaXMuX2kyXTtcbiAgICAgICAgdGhpcy5faTIrKztcbiAgICAgIH1cbiAgICAgIHRoaXMuX21lZGlhblZhbHVlc1t0aGlzLl9pMSAtIHRoaXMuX2kyICsgMV0gPSB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtO1xuICAgICAgdGhpcy5fbWVkaWFuTGlua2luZ1t0aGlzLl9pMSAtIHRoaXMuX2kyICsgMV0gPSB0aGlzLl9pMztcbiAgICAgIHRoaXMuX21lZGlhbkZpZm9bdGhpcy5faTNdID0gdGhpcy5faTEgLSB0aGlzLl9pMiArIDE7XG4gICAgfVxuXG4gICAgLy8gY29tcGFyZSBjdXJyZW50IGludGVuc2l0eSBub3JtIHdpdGggcHJldmlvdXMgbWVkaWFuIHZhbHVlXG4gICAgaWYgKHRoaXMuX2FjY0ludGVuc2l0eU5vcm0gLSB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtTWVkaWFuID4gdGhpcy5fcGFyYW1zLmtpY2tUaHJlc2gpIHtcbiAgICAgIGlmICh0aGlzLl9pc0tpY2tpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuX2tpY2tJbnRlbnNpdHkgPCB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtKSB7XG4gICAgICAgICAgdGhpcy5fa2lja0ludGVuc2l0eSA9IHRoaXMuX2FjY0ludGVuc2l0eU5vcm07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2tpY2tDYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuX2tpY2tDYWxsYmFjayh7IHN0YXRlOiAnbWlkZGxlJywgaW50ZW5zaXR5OiB0aGlzLl9raWNrSW50ZW5zaXR5IH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9pc0tpY2tpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLl9raWNrSW50ZW5zaXR5ID0gdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybTtcbiAgICAgICAgdGhpcy5fbGFzdEtpY2sgPSB0aGlzLl9lbGFwc2VkVGltZTtcbiAgICAgICAgaWYgKHRoaXMuX2tpY2tDYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuX2tpY2tDYWxsYmFjayh7IHN0YXRlOiAnc3RhcnQnLCBpbnRlbnNpdHk6IHRoaXMuX2tpY2tJbnRlbnNpdHkgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuX2VsYXBzZWRUaW1lIC0gdGhpcy5fbGFzdEtpY2sgPiB0aGlzLl9wYXJhbXMua2lja1NwZWVkR2F0ZSkge1xuICAgICAgICBpZiAodGhpcy5faXNLaWNraW5nICYmIHRoaXMuX2tpY2tDYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuX2tpY2tDYWxsYmFjayh7IHN0YXRlOiAnc3RvcCcsIGludGVuc2l0eTogdGhpcy5fa2lja0ludGVuc2l0eSB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pc0tpY2tpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtTWVkaWFuID0gdGhpcy5fbWVkaWFuVmFsdWVzW01hdGguY2VpbCh0aGlzLl9wYXJhbXMua2lja01lZGlhbkZpbHRlcnNpemUgKiAwLjUpXTtcblxuICAgIHJlcy5raWNrID0ge1xuICAgICAgaW50ZW5zaXR5OiB0aGlzLl9raWNrSW50ZW5zaXR5LFxuICAgICAga2lja2luZzogdGhpcy5faXNLaWNraW5nXG4gICAgfTtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBzaGFrZVxuICAvKiogQHByaXZhdGUgKi9cbiAgX3VwZGF0ZVNoYWtlKHJlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICB0aGlzLl9hY2NEZWx0YVtpXSA9IHRoaXMuX2RlbHRhKFxuICAgICAgICB0aGlzLl9hY2NMYXN0W2ldWyh0aGlzLl9sb29wSW5kZXggKyAxKSAlIDNdLFxuICAgICAgICB0aGlzLmFjY1tpXSxcbiAgICAgICAgMVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX3NoYWtlV2luZG93W2ldW3RoaXMuX2xvb3BJbmRleCAlIHRoaXMuX3BhcmFtcy5zaGFrZVdpbmRvd1NpemVdKSB7XG4gICAgICAgIHRoaXMuX3NoYWtlTmJbaV0tLTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9hY2NEZWx0YVtpXSA+IHRoaXMuX3BhcmFtcy5zaGFrZVRocmVzaCkge1xuICAgICAgICB0aGlzLl9zaGFrZVdpbmRvd1tpXVt0aGlzLl9sb29wSW5kZXggJSB0aGlzLl9wYXJhbXMuc2hha2VXaW5kb3dTaXplXSA9IDE7XG4gICAgICAgIHRoaXMuX3NoYWtlTmJbaV0rKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NoYWtlV2luZG93W2ldW3RoaXMuX2xvb3BJbmRleCAlIHRoaXMuX3BhcmFtcy5zaGFrZVdpbmRvd1NpemVdID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9zaGFraW5nUmF3ID1cbiAgICB0aGlzLl9tYWduaXR1ZGUzRCh0aGlzLl9zaGFrZU5iKSAvXG4gICAgdGhpcy5fcGFyYW1zLnNoYWtlV2luZG93U2l6ZTtcbiAgICB0aGlzLl9zaGFrZVNsaWRlUHJldiA9IHRoaXMuX3NoYWtpbmc7XG4gICAgdGhpcy5fc2hha2luZyA9XG4gICAgdGhpcy5fc2xpZGUodGhpcy5fc2hha2VTbGlkZVByZXYsIHRoaXMuX3NoYWtpbmdSYXcsIHRoaXMuX3BhcmFtcy5zaGFrZVNsaWRlRmFjdG9yKTtcblxuICAgIHJlcy5zaGFrZSA9IHtcbiAgICAgIHNoYWtpbmc6IHRoaXMuX3NoYWtpbmdcbiAgICB9O1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBzcGluXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfdXBkYXRlU3BpbihyZXMpIHtcbiAgICBpZiAodGhpcy5fZ3lyTm9ybSA+IHRoaXMuX3BhcmFtcy5zcGluVGhyZXNoKSB7XG4gICAgICBpZiAoIXRoaXMuX2lzU3Bpbm5pbmcpIHtcbiAgICAgICAgdGhpcy5faXNTcGlubmluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuX3NwaW5CZWdpbiA9IHBlcmZOb3coKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NwaW5FbmQgPSBwZXJmTm93KCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9pc1NwaW5uaW5nKSB7XG4gICAgICB0aGlzLl9pc1NwaW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX3NwaW5EdXJhdGlvbiA9IHRoaXMuX3NwaW5FbmQgLSB0aGlzLl9zcGluQmVnaW47XG5cbiAgICByZXMuc3BpbiA9IHtcbiAgICAgIHNwaW5uaW5nOiB0aGlzLl9pc1NwaW5uaW5nLFxuICAgICAgZHVyYXRpb246IHRoaXMuX3NwaW5EdXJhdGlvbixcbiAgICAgIGd5ck5vcm06IHRoaXMuX2d5ck5vcm1cbiAgICB9O1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IHN0aWxsXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfdXBkYXRlU3RpbGwocmVzKSB7XG4gICAgdGhpcy5fc3RpbGxDcm9zc1Byb2QgPSB0aGlzLl9zdGlsbENyb3NzUHJvZHVjdCh0aGlzLmd5cik7XG4gICAgdGhpcy5fc3RpbGxTbGlkZVByZXYgPSB0aGlzLl9zdGlsbFNsaWRlO1xuICAgIHRoaXMuX3N0aWxsU2xpZGUgPSB0aGlzLl9zbGlkZShcbiAgICAgIHRoaXMuX3N0aWxsU2xpZGVQcmV2LFxuICAgICAgdGhpcy5fc3RpbGxDcm9zc1Byb2QsXG4gICAgICB0aGlzLl9wYXJhbXMuc3RpbGxTbGlkZUZhY3RvclxuICAgICk7XG5cbiAgICBpZiAodGhpcy5fc3RpbGxTbGlkZSA+IHRoaXMuX3BhcmFtcy5zdGlsbFRocmVzaCkge1xuICAgICAgdGhpcy5faXNTdGlsbCA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9pc1N0aWxsID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXMuc3RpbGwgPSB7XG4gICAgICBzdGlsbDogdGhpcy5faXNTdGlsbCxcbiAgICAgIHNsaWRlOiB0aGlzLl9zdGlsbFNsaWRlXG4gICAgfVxuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gZ3lyWmNyXG4gIC8qKiBAcHJpdmF0ZSAqL1xuXG4gIF91cGRhdGVHeXJaY3IocmVzKSB7XG4gICAgY29uc3QgemNyUmVzID0gdGhpcy5fZ3lyWmNyLnByb2Nlc3ModGhpcy5fZ3lyTm9ybSk7XG4gICAgcmVzLmd5clpjciA9IHtcbiAgICAgIGFtcGxpdHVkZTogemNyUmVzLmFtcGxpdHVkZSxcbiAgICAgIGZyZXF1ZW5jeTogemNyUmVzLmZyZXF1ZW5jeSxcbiAgICAgIHBlcmlvZGljaXR5OiB6Y3JSZXMucGVyaW9kaWNpdHksXG4gICAgfTtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGFjY1pjclxuICAvKiogQHByaXZhdGUgKi9cblxuICBfdXBkYXRlQWNjWmNyKHJlcykge1xuICAgIGNvbnN0IGFjY1JlcyA9IHRoaXMuX2FjY1pjci5wcm9jZXNzKHRoaXMuX2FjY05vcm0pO1xuICAgIHJlcy5hY2NaY3IgPSB7XG4gICAgICBhbXBsaXR1ZGU6IGFjY1pjci5hbXBsaXR1ZGUsXG4gICAgICBmcmVxdWVuY3k6IGFjY1pjci5mcmVxdWVuY3ksXG4gICAgICBwZXJpb2RpY2l0eTogYWNjWmNyLnBlcmlvZGljaXR5LFxuICAgIH07XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBVVElMSVRJRVMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuICAvKiogQHByaXZhdGUgKi9cbiAgX2RlbHRhKHByZXYsIG5leHQsIGR0KSB7XG4gICAgcmV0dXJuIChuZXh0IC0gcHJldikgLyAoMiAqIGR0KTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfaW50ZW5zaXR5MUQobmV4dFgsIHByZXZYLCBwcmV2SW50ZW5zaXR5LCBwYXJhbTEsIHBhcmFtMiwgZHQpIHtcbiAgICBjb25zdCBkeCA9IHRoaXMuX2RlbHRhKG5leHRYLCBwcmV2WCwgZHQpOy8vKG5leHRYIC0gcHJldlgpIC8gKDIgKiBkdCk7XG4gICAgcmV0dXJuIHBhcmFtMiAqIGR4ICogZHggKyBwYXJhbTEgKiBwcmV2SW50ZW5zaXR5O1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9tYWduaXR1ZGUzRCh4eXpBcnJheSkge1xuICAgIHJldHVybiBNYXRoLnNxcnQoeHl6QXJyYXlbMF0gKiB4eXpBcnJheVswXSArXG4gICAgICAgICAgICAgICAgICAgICB4eXpBcnJheVsxXSAqIHh5ekFycmF5WzFdICtcbiAgICAgICAgICAgICAgICAgICAgIHh5ekFycmF5WzJdICogeHl6QXJyYXlbMl0pO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9sY20oYSwgYikge1xuICAgIGxldCBhMSA9IGEsIGIxID0gYjtcblxuICAgIHdoaWxlIChhMSAhPSBiMSkge1xuICAgICAgaWYgKGExIDwgYjEpIHtcbiAgICAgICAgYTEgKz0gYTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGIxICs9IGI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGExO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zbGlkZShwcmV2U2xpZGUsIGN1cnJlbnRWYWwsIHNsaWRlRmFjdG9yKSB7XG4gICAgcmV0dXJuIHByZXZTbGlkZSArIChjdXJyZW50VmFsIC0gcHJldlNsaWRlKSAvIHNsaWRlRmFjdG9yO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zdGlsbENyb3NzUHJvZHVjdCh4eXpBcnJheSkge1xuICAgIHJldHVybiAoeHl6QXJyYXlbMV0gLSB4eXpBcnJheVsyXSkgKiAoeHl6QXJyYXlbMV0gLSB4eXpBcnJheVsyXSkgK1xuICAgICAgICAgICAoeHl6QXJyYXlbMF0gLSB4eXpBcnJheVsxXSkgKiAoeHl6QXJyYXlbMF0gLSB4eXpBcnJheVsxXSkgK1xuICAgICAgICAgICAoeHl6QXJyYXlbMl0gLSB4eXpBcnJheVswXSkgKiAoeHl6QXJyYXlbMl0gLSB4eXpBcnJheVswXSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW90aW9uRmVhdHVyZXM7XG4iXX0=
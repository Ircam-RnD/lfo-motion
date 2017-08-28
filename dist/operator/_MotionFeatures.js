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
      this._gyrZcr = new _MeanCrossingRate2.default({
        noiseThreshold: this._params.gyrZcrNoiseThresh,
        frameSize: this._params.gyrZcrFrameSize,
        hopSize: this._params.gyrZcrHopSize
      });
    }

    if (hasAccZcr) {
      this._accZcr = new _MeanCrossingRate2.default({
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZ2V0VGltZUZ1bmN0aW9uIiwid2luZG93IiwidCIsInByb2Nlc3MiLCJocnRpbWUiLCJwZXJmb3JtYW5jZSIsIkRhdGUiLCJub3ciLCJnZXRUaW1lIiwicGVyZk5vdyIsIk1vdGlvbkZlYXR1cmVzIiwib3B0aW9ucyIsImRlZmF1bHRzIiwiZmVhdHVyZXMiLCJneXJJc0luRGVncmVlcyIsImFjY0ludGVuc2l0eVBhcmFtMSIsImFjY0ludGVuc2l0eVBhcmFtMiIsImd5ckludGVuc2l0eVBhcmFtMSIsImd5ckludGVuc2l0eVBhcmFtMiIsImZyZWVmYWxsQWNjVGhyZXNoIiwiZnJlZWZhbGxHeXJUaHJlc2giLCJmcmVlZmFsbEd5ckRlbHRhVGhyZXNoIiwia2lja1RocmVzaCIsImtpY2tTcGVlZEdhdGUiLCJraWNrTWVkaWFuRmlsdGVyc2l6ZSIsImtpY2tDYWxsYmFjayIsInNoYWtlVGhyZXNoIiwic2hha2VXaW5kb3dTaXplIiwic2hha2VTbGlkZUZhY3RvciIsInNwaW5UaHJlc2giLCJzdGlsbFRocmVzaCIsInN0aWxsU2xpZGVGYWN0b3IiLCJneXJaY3JOb2lzZVRocmVzaCIsImd5clpjckZyYW1lU2l6ZSIsImd5clpjckhvcFNpemUiLCJhY2NaY3JOb2lzZVRocmVzaCIsImFjY1pjckZyYW1lU2l6ZSIsImFjY1pjckhvcFNpemUiLCJfcGFyYW1zIiwiX21ldGhvZHMiLCJhY2NSYXciLCJfdXBkYXRlQWNjUmF3IiwiYmluZCIsImd5clJhdyIsIl91cGRhdGVHeXJSYXciLCJhY2NJbnRlbnNpdHkiLCJfdXBkYXRlQWNjSW50ZW5zaXR5IiwiZ3lySW50ZW5zaXR5IiwiX3VwZGF0ZUd5ckludGVuc2l0eSIsImZyZWVmYWxsIiwiX3VwZGF0ZUZyZWVmYWxsIiwia2ljayIsIl91cGRhdGVLaWNrIiwic2hha2UiLCJfdXBkYXRlU2hha2UiLCJzcGluIiwiX3VwZGF0ZVNwaW4iLCJzdGlsbCIsIl91cGRhdGVTdGlsbCIsImd5clpjciIsIl91cGRhdGVHeXJaY3IiLCJhY2NaY3IiLCJfdXBkYXRlQWNjWmNyIiwiX2tpY2tDYWxsYmFjayIsImFjYyIsImd5ciIsIl9hY2NMYXN0IiwiX2FjY0ludGVuc2l0eUxhc3QiLCJfYWNjSW50ZW5zaXR5IiwiX2FjY0ludGVuc2l0eU5vcm0iLCJfYWNjTm9ybSIsIl9neXJEZWx0YSIsIl9neXJOb3JtIiwiX2d5ckRlbHRhTm9ybSIsIl9mYWxsQmVnaW4iLCJfZmFsbEVuZCIsIl9mYWxsRHVyYXRpb24iLCJfaXNGYWxsaW5nIiwiX2d5ckxhc3QiLCJfZ3lySW50ZW5zaXR5TGFzdCIsIl9neXJJbnRlbnNpdHkiLCJfZ3lySW50ZW5zaXR5Tm9ybSIsIl9raWNrSW50ZW5zaXR5IiwiX2xhc3RLaWNrIiwiX2lzS2lja2luZyIsIl9tZWRpYW5WYWx1ZXMiLCJfbWVkaWFuTGlua2luZyIsIl9tZWRpYW5GaWZvIiwiX2kxIiwiX2kyIiwiX2kzIiwiX2FjY0ludGVuc2l0eU5vcm1NZWRpYW4iLCJfYWNjRGVsdGEiLCJfc2hha2VXaW5kb3ciLCJBcnJheSIsImkiLCJqIiwiX3NoYWtlTmIiLCJfc2hha2luZ1JhdyIsIl9zaGFrZVNsaWRlUHJldiIsIl9zaGFraW5nIiwiX3NwaW5CZWdpbiIsIl9zcGluRW5kIiwiX3NwaW5EdXJhdGlvbiIsIl9pc1NwaW5uaW5nIiwiX3N0aWxsQ3Jvc3NQcm9kIiwiX3N0aWxsU2xpZGUiLCJfc3RpbGxTbGlkZVByZXYiLCJfaXNTdGlsbCIsIl9sb29wSW5kZXhQZXJpb2QiLCJfbGNtIiwiX2xvb3BJbmRleCIsImhhc0d5clpjciIsImluZGV4T2YiLCJoYXNBY2NaY3IiLCJfZ3lyWmNyIiwibm9pc2VUaHJlc2hvbGQiLCJmcmFtZVNpemUiLCJob3BTaXplIiwiX2FjY1pjciIsInBhcmFtcyIsImtleSIsIngiLCJ5IiwieiIsIk1hdGgiLCJQSSIsImNhbGxiYWNrIiwiX2VsYXBzZWRUaW1lIiwiX21hZ25pdHVkZTNEIiwiZXJyIiwicmVzIiwiZSIsIl9pbnRlbnNpdHkxRCIsIm5vcm0iLCJfZGVsdGEiLCJhY2NOb3JtIiwiZmFsbGluZyIsImR1cmF0aW9uIiwic3RhdGUiLCJpbnRlbnNpdHkiLCJjZWlsIiwia2lja2luZyIsIl9zbGlkZSIsInNoYWtpbmciLCJzcGlubmluZyIsImd5ck5vcm0iLCJfc3RpbGxDcm9zc1Byb2R1Y3QiLCJzbGlkZSIsInpjclJlcyIsImFtcGxpdHVkZSIsImZyZXF1ZW5jeSIsInBlcmlvZGljaXR5IiwiYWNjUmVzIiwicHJldiIsIm5leHQiLCJkdCIsIm5leHRYIiwicHJldlgiLCJwcmV2SW50ZW5zaXR5IiwicGFyYW0xIiwicGFyYW0yIiwiZHgiLCJ4eXpBcnJheSIsInNxcnQiLCJhIiwiYiIsImExIiwiYjEiLCJwcmV2U2xpZGUiLCJjdXJyZW50VmFsIiwic2xpZGVGYWN0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7O0FBRUE7Ozs7Ozs7OztBQVNBLFNBQVNBLGVBQVQsR0FBMkI7QUFDekIsTUFBSSxPQUFPQyxNQUFQLEtBQWtCLFdBQXRCLEVBQW1DO0FBQUU7QUFDbkMsV0FBTyxZQUFNO0FBQ1gsVUFBTUMsSUFBSUMsUUFBUUMsTUFBUixFQUFWO0FBQ0EsYUFBT0YsRUFBRSxDQUFGLElBQU9BLEVBQUUsQ0FBRixJQUFPLElBQXJCO0FBQ0QsS0FIRDtBQUlELEdBTEQsTUFLTztBQUFFO0FBQ1AsUUFBSUQsT0FBT0ksV0FBUCxLQUF1QixXQUEzQixFQUF3QztBQUN0QyxVQUFJQyxLQUFLQyxHQUFMLEtBQWEsV0FBakIsRUFBOEI7QUFDNUIsZUFBTyxZQUFNO0FBQUUsaUJBQU8sSUFBSUQsS0FBS0UsT0FBVCxFQUFQO0FBQTJCLFNBQTFDO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxZQUFNO0FBQUUsaUJBQU9GLEtBQUtDLEdBQUwsRUFBUDtBQUFtQixTQUFsQztBQUNEO0FBQ0YsS0FORCxNQU1PO0FBQ0wsYUFBTyxZQUFNO0FBQUUsZUFBT04sT0FBT0ksV0FBUCxDQUFtQkUsR0FBbkIsRUFB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QUFJQyxLQUFLRixDQUFUO0FBQUEsVUFBWUcsS0FBS0YsQ0FBakI7O0FBRUEsYUFBT0MsTUFBTUMsRUFBYixFQUFpQjtBQUNmLFlBQUlELEtBQUtDLEVBQVQsRUFBYTtBQUNYRCxnQkFBTUYsQ0FBTjtBQUNELFNBRkQsTUFFTztBQUNMRyxnQkFBTUYsQ0FBTjtBQUNEO0FBQ0Y7O0FBRUQsYUFBT0MsRUFBUDtBQUNEOztBQUVEOzs7OzJCQUNPRSxTLEVBQVdDLFUsRUFBWUMsVyxFQUFhO0FBQ3pDLGFBQU9GLFlBQVksQ0FBQ0MsYUFBYUQsU0FBZCxJQUEyQkUsV0FBOUM7QUFDRDs7QUFFRDs7Ozt1Q0FDbUJSLFEsRUFBVTtBQUMzQixhQUFPLENBQUNBLFNBQVMsQ0FBVCxJQUFjQSxTQUFTLENBQVQsQ0FBZixLQUErQkEsU0FBUyxDQUFULElBQWNBLFNBQVMsQ0FBVCxDQUE3QyxJQUNBLENBQUNBLFNBQVMsQ0FBVCxJQUFjQSxTQUFTLENBQVQsQ0FBZixLQUErQkEsU0FBUyxDQUFULElBQWNBLFNBQVMsQ0FBVCxDQUE3QyxDQURBLEdBRUEsQ0FBQ0EsU0FBUyxDQUFULElBQWNBLFNBQVMsQ0FBVCxDQUFmLEtBQStCQSxTQUFTLENBQVQsSUFBY0EsU0FBUyxDQUFULENBQTdDLENBRlA7QUFHRDs7Ozs7a0JBR1l6SixjIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTWVhbkNyb3NzaW5nUmF0ZSBmcm9tICcuL01lYW5Dcm9zc2luZ1JhdGUnO1xuXG4vKipcbiAqIENyZWF0ZSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aW1lIGluIHNlY29uZHMgYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50XG4gKiBlbnZpcm9ubmVtZW50IChub2RlIG9yIGJyb3dzZXIpLlxuICogSWYgcnVubmluZyBpbiBub2RlIHRoZSB0aW1lIHJlbHkgb24gYHByb2Nlc3MuaHJ0aW1lYCwgd2hpbGUgaWYgaW4gdGhlIGJyb3dzZXJcbiAqIGl0IGlzIHByb3ZpZGVkIGJ5IHRoZSBgRGF0ZWAgb2JqZWN0LlxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZ2V0VGltZUZ1bmN0aW9uKCkge1xuICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gYXNzdW1lIG5vZGVcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY29uc3QgdCA9IHByb2Nlc3MuaHJ0aW1lKCk7XG4gICAgICByZXR1cm4gdFswXSArIHRbMV0gKiAxZS05O1xuICAgIH1cbiAgfSBlbHNlIHsgLy8gYnJvd3NlclxuICAgIGlmICh3aW5kb3cucGVyZm9ybWFuY2UgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBpZiAoRGF0ZS5ub3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7IHJldHVybiBuZXcgRGF0ZS5nZXRUaW1lKCkgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7IHJldHVybiBEYXRlLm5vdygpIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAoKSA9PiB7IHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgfTtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgcGVyZk5vdyA9IGdldFRpbWVGdW5jdGlvbigpO1xuXG4vKipcbiAqIEB0b2RvIHR5cGVkZWYgY29uc3RydWN0b3IgYXJndW1lbnRcbiAqL1xuXG4vKlxuICogLy8gZXM1IHdpdGggYnJvd3NlcmlmeSA6XG4gKiB2YXIgbW90aW9uRmVhdHVyZXMgPSByZXF1aXJlKCdtb3Rpb24tZmVhdHVyZXMnKTtcbiAqIHZhciBtZiA9IG5ldyBtb3Rpb25GZWF0dXJlcy5Nb3Rpb25GZWF0dXJlcyh7IGZlYXR1cmVzOiBbJ2FjY0ludGVuc2l0eScsICdraWNrJ10gfSk7XG4gKlxuICogLy8gbG9hZGluZyBmcm9tIGEgXCJzY3JpcHRcIiB0YWcgOlxuICogdmFyIG1mID0gbmV3IG1vdGlvbkZlYXR1cmVzLk1vdGlvbkZlYXR1cmVzKHsgZmVhdHVyZXM6IFsnYWNjSW50ZW5zaXR5JywgJ2tpY2snXSB9KTtcbiAqL1xuXG5cbi8qKlxuICogQ2xhc3MgY29tcHV0aW5nIHRoZSBmZWF0dXJlcyBmcm9tIGFjY2VsZXJvbWV0ZXIgYW5kIGd5cm9zY29wZSBkYXRhLlxuICogPGJyIC8+XG4gKiBlczYgKyBicm93c2VyaWZ5IGV4YW1wbGUgOlxuICogYGBgSmF2YVNjcmlwdFxuICogaW1wb3J0IHsgTW90aW9uRmVhdHVyZXMgfSBmcm9tICdtb3Rpb24tZmVhdHVyZXMnOyBcbiAqIGNvbnN0IG1mID0gbmV3IE1vdGlvbkZlYXR1cmVzKHsgZmVhdHVyZXM6IFsnYWNjSW50ZW5zaXR5JywgJ2tpY2snXSB9KTtcbiAqXG4gKiAvLyB0aGVuLCBvbiBlYWNoIG1vdGlvbiBldmVudCA6XG4gKiBtZi5zZXRBY2NlbGVyb21ldGVyKHgsIHksIHopO1xuICogbWYuc2V0R3lyb3Njb3BlKGFscGhhLCBiZXRhLCBnYW1tYSk7XG4gKiBtZi51cGRhdGUoZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAqICAgaWYgKGVyciA9PT0gbnVsbCkge1xuICogICAgIC8vIGRvIHNvbWV0aGluZyB3aXRoIHJlc1xuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICogQGNsYXNzXG4gKi9cbmNsYXNzIE1vdGlvbkZlYXR1cmVzIHtcblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IGluaXRPYmplY3QgLSBvYmplY3QgY29udGFpbmluZyBhbiBhcnJheSBvZiB0aGVcbiAgICogcmVxdWlyZWQgZmVhdHVyZXMgYW5kIHNvbWUgdmFyaWFibGVzIHVzZWQgdG8gY29tcHV0ZSB0aGUgZmVhdHVyZXNcbiAgICogdGhhdCB5b3UgbWlnaHQgd2FudCB0byBjaGFuZ2UgKGZvciBleGFtcGxlIGlmIHRoZSBicm93c2VyIGlzIGNocm9tZSB5b3VcbiAgICogbWlnaHQgd2FudCB0byBzZXQgYGd5cklzSW5EZWdyZWVzYCB0byBmYWxzZSBiZWNhdXNlIGl0J3MgdGhlIGNhc2Ugb24gc29tZVxuICAgKiB2ZXJzaW9ucywgb3IgeW91IG1pZ2h0IHdhbnQgdG8gY2hhbmdlIHNvbWUgdGhyZXNob2xkcykuXG4gICAqIFNlZSB0aGUgY29kZSBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAdG9kbyB1c2UgdHlwZWRlZiB0byBkZXNjcmliZSB0aGUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBkZWZhdWx0cyA9IHtcbiAgICAgIGZlYXR1cmVzOiBbXG4gICAgICAgICdhY2NSYXcnLFxuICAgICAgICAnZ3lyUmF3JyxcbiAgICAgICAgJ2FjY0ludGVuc2l0eScsXG4gICAgICAgICdneXJJbnRlbnNpdHknLFxuICAgICAgICAnZnJlZWZhbGwnLFxuICAgICAgICAna2ljaycsXG4gICAgICAgICdzaGFrZScsXG4gICAgICAgICdzcGluJyxcbiAgICAgICAgJ3N0aWxsJyxcbiAgICAgICAgJ2d5clpjcicsXG4gICAgICAgICdhY2NaY3InXG4gICAgICBdLFxuXG4gICAgICBneXJJc0luRGVncmVlczogdHJ1ZSxcblxuICAgICAgYWNjSW50ZW5zaXR5UGFyYW0xOiAwLjgsXG4gICAgICBhY2NJbnRlbnNpdHlQYXJhbTI6IDAuMSxcblxuICAgICAgZ3lySW50ZW5zaXR5UGFyYW0xOiAwLjksXG4gICAgICBneXJJbnRlbnNpdHlQYXJhbTI6IDEsXG5cbiAgICAgIGZyZWVmYWxsQWNjVGhyZXNoOiAwLjE1LFxuICAgICAgZnJlZWZhbGxHeXJUaHJlc2g6IDc1MCxcbiAgICAgIGZyZWVmYWxsR3lyRGVsdGFUaHJlc2g6IDQwLFxuXG4gICAgICBraWNrVGhyZXNoOiAwLjAxLFxuICAgICAga2lja1NwZWVkR2F0ZTogMjAwLFxuICAgICAga2lja01lZGlhbkZpbHRlcnNpemU6IDksXG4gICAgICBraWNrQ2FsbGJhY2s6IG51bGwsXG5cbiAgICAgIHNoYWtlVGhyZXNoOiAwLjEsXG4gICAgICBzaGFrZVdpbmRvd1NpemU6IDIwMCxcbiAgICAgIHNoYWtlU2xpZGVGYWN0b3I6IDEwLFxuXG4gICAgICBzcGluVGhyZXNoOiAyMDAsXG5cbiAgICAgIHN0aWxsVGhyZXNoOiA1MDAwLFxuICAgICAgc3RpbGxTbGlkZUZhY3RvcjogNSxcblxuICAgICAgZ3lyWmNyTm9pc2VUaHJlc2g6IDAuMDEsXG4gICAgICBneXJaY3JGcmFtZVNpemU6IDEwMCxcbiAgICAgIGd5clpjckhvcFNpemU6IDEwLFxuXG4gICAgICBhY2NaY3JOb2lzZVRocmVzaDogMC4wMSxcbiAgICAgIGFjY1pjckZyYW1lU2l6ZTogMTAwLFxuICAgICAgYWNjWmNySG9wU2l6ZTogMTAsXG4gICAgfTtcblxuICAgIHRoaXMuX3BhcmFtcyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuX3BhcmFtcy5mZWF0dXJlcyk7XG5cbiAgICB0aGlzLl9tZXRob2RzID0ge1xuICAgICAgYWNjUmF3OiB0aGlzLl91cGRhdGVBY2NSYXcuYmluZCh0aGlzKSxcbiAgICAgIGd5clJhdzogdGhpcy5fdXBkYXRlR3lyUmF3LmJpbmQodGhpcyksXG4gICAgICBhY2NJbnRlbnNpdHk6IHRoaXMuX3VwZGF0ZUFjY0ludGVuc2l0eS5iaW5kKHRoaXMpLFxuICAgICAgZ3lySW50ZW5zaXR5OiB0aGlzLl91cGRhdGVHeXJJbnRlbnNpdHkuYmluZCh0aGlzKSxcbiAgICAgIGZyZWVmYWxsOiB0aGlzLl91cGRhdGVGcmVlZmFsbC5iaW5kKHRoaXMpLFxuICAgICAga2ljazogdGhpcy5fdXBkYXRlS2ljay5iaW5kKHRoaXMpLFxuICAgICAgc2hha2U6IHRoaXMuX3VwZGF0ZVNoYWtlLmJpbmQodGhpcyksXG4gICAgICBzcGluOiB0aGlzLl91cGRhdGVTcGluLmJpbmQodGhpcyksXG4gICAgICBzdGlsbDogdGhpcy5fdXBkYXRlU3RpbGwuYmluZCh0aGlzKSxcbiAgICAgIGd5clpjcjogdGhpcy5fdXBkYXRlR3lyWmNyLmJpbmQodGhpcyksXG4gICAgICBhY2NaY3I6IHRoaXMuX3VwZGF0ZUFjY1pjci5iaW5kKHRoaXMpXG4gICAgfTtcblxuICAgIHRoaXMuX2tpY2tDYWxsYmFjayA9IHRoaXMuX3BhcmFtcy5raWNrQ2FsbGJhY2s7XG5cbiAgICB0aGlzLmFjYyA9IFswLCAwLCAwXTtcbiAgICB0aGlzLmd5ciA9IFswLCAwLCAwXTtcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGFjYyBpbnRlbnNpdHlcbiAgICB0aGlzLl9hY2NMYXN0ID0gW1xuICAgICAgWzAsIDAsIDBdLFxuICAgICAgWzAsIDAsIDBdLFxuICAgICAgWzAsIDAsIDBdXG4gICAgXTtcbiAgICB0aGlzLl9hY2NJbnRlbnNpdHlMYXN0ID0gW1xuICAgICAgWzAsIDBdLFxuICAgICAgWzAsIDBdLFxuICAgICAgWzAsIDBdXG4gICAgXTtcbiAgICB0aGlzLl9hY2NJbnRlbnNpdHkgPSBbMCwgMCwgMF07XG4gICAgdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybSA9IDA7XG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGZyZWVmYWxsXG4gICAgdGhpcy5fYWNjTm9ybSA9IDA7XG4gICAgdGhpcy5fZ3lyRGVsdGEgPSBbMCwgMCwgMF07XG4gICAgdGhpcy5fZ3lyTm9ybSA9IDA7XG4gICAgdGhpcy5fZ3lyRGVsdGFOb3JtID0gMDtcbiAgICB0aGlzLl9mYWxsQmVnaW4gPSBwZXJmTm93KCk7XG4gICAgdGhpcy5fZmFsbEVuZCA9IHBlcmZOb3coKTtcbiAgICB0aGlzLl9mYWxsRHVyYXRpb24gPSAwO1xuICAgIHRoaXMuX2lzRmFsbGluZyA9IGZhbHNlO1xuXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gZ3lyIGludGVuc2l0eVxuICAgIHRoaXMuX2d5ckxhc3QgPSBbXG4gICAgICBbMCwgMCwgMF0sXG4gICAgICBbMCwgMCwgMF0sXG4gICAgICBbMCwgMCwgMF1cbiAgICBdO1xuICAgIHRoaXMuX2d5ckludGVuc2l0eUxhc3QgPSBbXG4gICAgICBbMCwgMF0sXG4gICAgICBbMCwgMF0sXG4gICAgICBbMCwgMF1cbiAgICBdO1xuICAgIHRoaXMuX2d5ckludGVuc2l0eSA9IFswLCAwLCAwXTtcbiAgICB0aGlzLl9neXJJbnRlbnNpdHlOb3JtID0gMDtcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGtpY2tcbiAgICB0aGlzLl9raWNrSW50ZW5zaXR5ID0gMDtcbiAgICB0aGlzLl9sYXN0S2ljayA9IDA7XG4gICAgdGhpcy5faXNLaWNraW5nID0gZmFsc2U7XG4gICAgdGhpcy5fbWVkaWFuVmFsdWVzID0gWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdO1xuICAgIHRoaXMuX21lZGlhbkxpbmtpbmcgPSBbMywgNCwgMSwgNSwgNywgOCwgMCwgMiwgNl07XG4gICAgdGhpcy5fbWVkaWFuRmlmbyA9IFs2LCAyLCA3LCAwLCAxLCAzLCA4LCA0LCA1XTtcbiAgICB0aGlzLl9pMSA9IDA7XG4gICAgdGhpcy5faTIgPSAwO1xuICAgIHRoaXMuX2kzID0gMDtcbiAgICB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtTWVkaWFuID0gMDtcblxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gc2hha2VcbiAgICB0aGlzLl9hY2NEZWx0YSA9IFswLCAwLCAwXTtcbiAgICB0aGlzLl9zaGFrZVdpbmRvdyA9IFtcbiAgICAgIG5ldyBBcnJheSh0aGlzLl9wYXJhbXMuc2hha2VXaW5kb3dTaXplKSxcbiAgICAgIG5ldyBBcnJheSh0aGlzLl9wYXJhbXMuc2hha2VXaW5kb3dTaXplKSxcbiAgICAgIG5ldyBBcnJheSh0aGlzLl9wYXJhbXMuc2hha2VXaW5kb3dTaXplKVxuICAgIF07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5fcGFyYW1zLnNoYWtlV2luZG93U2l6ZTsgaisrKSB7XG4gICAgICAgIHRoaXMuX3NoYWtlV2luZG93W2ldW2pdID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fc2hha2VOYiA9IFswLCAwLCAwXTtcbiAgICB0aGlzLl9zaGFraW5nUmF3ID0gMDtcbiAgICB0aGlzLl9zaGFrZVNsaWRlUHJldiA9IDA7XG4gICAgdGhpcy5fc2hha2luZyA9IDA7XG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBzcGluXG4gICAgdGhpcy5fc3BpbkJlZ2luID0gcGVyZk5vdygpO1xuICAgIHRoaXMuX3NwaW5FbmQgPSBwZXJmTm93KCk7XG4gICAgdGhpcy5fc3BpbkR1cmF0aW9uID0gMDtcbiAgICB0aGlzLl9pc1NwaW5uaW5nID0gZmFsc2U7XG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IHN0aWxsXG4gICAgdGhpcy5fc3RpbGxDcm9zc1Byb2QgPSAwO1xuICAgIHRoaXMuX3N0aWxsU2xpZGUgPSAwO1xuICAgIHRoaXMuX3N0aWxsU2xpZGVQcmV2ID0gMDtcbiAgICB0aGlzLl9pc1N0aWxsID0gZmFsc2U7XG5cbiAgICB0aGlzLl9sb29wSW5kZXhQZXJpb2QgPSB0aGlzLl9sY20oXG4gICAgICB0aGlzLl9sY20oXG4gICAgICAgIHRoaXMuX2xjbSgyLCAzKSwgdGhpcy5fcGFyYW1zLmtpY2tNZWRpYW5GaWx0ZXJzaXplXG4gICAgICApLFxuICAgICAgdGhpcy5fcGFyYW1zLnNoYWtlV2luZG93U2l6ZVxuICAgICk7XG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLl9sb29wSW5kZXhQZXJpb2QpO1xuICAgIHRoaXMuX2xvb3BJbmRleCA9IDA7XG5cbiAgICBjb25zdCBoYXNHeXJaY3IgPSB0aGlzLl9wYXJhbXMuZmVhdHVyZXMuaW5kZXhPZignZ3lyWmNyJykgPiAtMTtcbiAgICBjb25zdCBoYXNBY2NaY3IgPSB0aGlzLl9wYXJhbXMuZmVhdHVyZXMuaW5kZXhPZignYWNjWmNyJykgPiAtMTtcblxuICAgIGlmIChoYXNHeXJaY3IpIHtcbiAgICAgIHRoaXMuX2d5clpjciA9IG5ldyBNZWFuQ3Jvc3NpbmdSYXRlKHtcbiAgICAgICAgbm9pc2VUaHJlc2hvbGQ6IHRoaXMuX3BhcmFtcy5neXJaY3JOb2lzZVRocmVzaCxcbiAgICAgICAgZnJhbWVTaXplOiB0aGlzLl9wYXJhbXMuZ3lyWmNyRnJhbWVTaXplLFxuICAgICAgICBob3BTaXplOiB0aGlzLl9wYXJhbXMuZ3lyWmNySG9wU2l6ZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGhhc0FjY1pjcikge1xuICAgICAgdGhpcy5fYWNjWmNyID0gbmV3IE1lYW5Dcm9zc2luZ1JhdGUoe1xuICAgICAgICBub2lzZVRocmVzaG9sZDogdGhpcy5fcGFyYW1zLmFjY1pjck5vaXNlVGhyZXNoLFxuICAgICAgICBmcmFtZVNpemU6IHRoaXMuX3BhcmFtcy5hY2NaY3JGcmFtZVNpemUsXG4gICAgICAgIGhvcFNpemU6IHRoaXMuX3BhcmFtcy5hY2NaY3JIb3BTaXplXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLz09PT09PT09PT0gaW50ZXJmYWNlID09PT09PT09PS8vXG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgKGV4Y2VwdCBmZWF0dXJlcyBsaXN0KVxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gYSBzdWJzZXQgb2YgdGhlIGNvbnN0cnVjdG9yJ3MgcGFyYW1ldGVyc1xuICAgKi9cbiAgdXBkYXRlUGFyYW1zKHBhcmFtcyA9IHt9KSB7XG4gICAgZm9yIChsZXQga2V5IGluIHBhcmFtcykge1xuICAgICAgaWYgKGtleSAhPT0gJ2ZlYXR1cmVzJykge1xuICAgICAgICB0aGlzLl9wYXJhbXNba2V5XSA9IHBhcmFtc1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjdXJyZW50IGFjY2VsZXJvbWV0ZXIgdmFsdWVzLlxuICAgKiBAcGFyYW0ge051bWJlcn0geCAtIHRoZSBhY2NlbGVyb21ldGVyJ3MgeCB2YWx1ZVxuICAgKiBAcGFyYW0ge051bWJlcn0geSAtIHRoZSBhY2NlbGVyb21ldGVyJ3MgeSB2YWx1ZVxuICAgKiBAcGFyYW0ge051bWJlcn0geiAtIHRoZSBhY2NlbGVyb21ldGVyJ3MgeiB2YWx1ZVxuICAgKi9cbiAgc2V0QWNjZWxlcm9tZXRlcih4LCB5ID0gMCwgeiA9IDApIHtcbiAgICB0aGlzLmFjY1swXSA9IHg7XG4gICAgdGhpcy5hY2NbMV0gPSB5O1xuICAgIHRoaXMuYWNjWzJdID0gejtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjdXJyZW50IGd5cm9zY29wZSB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB4IC0gdGhlIGd5cm9zY29wZSdzIHggdmFsdWVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHkgLSB0aGUgZ3lyb3Njb3BlJ3MgeSB2YWx1ZVxuICAgKiBAcGFyYW0ge051bWJlcn0geiAtIHRoZSBneXJvc2NvcGUncyB6IHZhbHVlXG4gICAqL1xuICBzZXRHeXJvc2NvcGUoeCwgeSA9IDAsIHogPSAwKSB7XG4gICAgdGhpcy5neXJbMF0gPSB4O1xuICAgIHRoaXMuZ3lyWzFdID0geTtcbiAgICB0aGlzLmd5clsyXSA9IHo7XG4gICAgaWYgKHRoaXMuX3BhcmFtcy5neXJJc0luRGVncmVlcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgdGhpcy5neXJbaV0gKj0gKDIgKiBNYXRoLlBJIC8gMzYwLik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEludGVuc2l0eSBvZiB0aGUgbW92ZW1lbnQgc2Vuc2VkIGJ5IGFuIGFjY2VsZXJvbWV0ZXIuXG4gICAqIEB0eXBlZGVmIGFjY0ludGVuc2l0eVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge051bWJlcn0gbm9ybSAtIHRoZSBnbG9iYWwgZW5lcmd5IGNvbXB1dGVkIG9uIGFsbCBkaW1lbnNpb25zLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0geCAtIHRoZSBlbmVyZ3kgaW4gdGhlIHggKGZpcnN0KSBkaW1lbnNpb24uXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSB5IC0gdGhlIGVuZXJneSBpbiB0aGUgeSAoc2Vjb25kKSBkaW1lbnNpb24uXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSB6IC0gdGhlIGVuZXJneSBpbiB0aGUgeiAodGhpcmQpIGRpbWVuc2lvbi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEludGVuc2l0eSBvZiB0aGUgbW92ZW1lbnQgc2Vuc2VkIGJ5IGEgZ3lyb3Njb3BlLlxuICAgKiBAdHlwZWRlZiBneXJJbnRlbnNpdHlcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IG5vcm0gLSB0aGUgZ2xvYmFsIGVuZXJneSBjb21wdXRlZCBvbiBhbGwgZGltZW5zaW9ucy5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IHggLSB0aGUgZW5lcmd5IGluIHRoZSB4IChmaXJzdCkgZGltZW5zaW9uLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0geSAtIHRoZSBlbmVyZ3kgaW4gdGhlIHkgKHNlY29uZCkgZGltZW5zaW9uLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0geiAtIHRoZSBlbmVyZ3kgaW4gdGhlIHogKHRoaXJkKSBkaW1lbnNpb24uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgZnJlZSBmYWxsaW5nIHN0YXRlIG9mIHRoZSBzZW5zb3IuXG4gICAqIEB0eXBlZGVmIGZyZWVmYWxsXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBhY2NOb3JtIC0gdGhlIG5vcm0gb2YgdGhlIGFjY2VsZXJhdGlvbi5cbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBmYWxsaW5nIC0gdHJ1ZSBpZiB0aGUgc2Vuc29yIGlzIGZyZWUgZmFsbGluZywgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZHVyYXRpb24gLSB0aGUgZHVyYXRpb24gb2YgdGhlIGZyZWUgZmFsbGluZyBzaW5jZSBpdHMgYmVnaW5uaW5nLlxuICAgKi9cblxuICAvKipcbiAgICogSW1wdWxzZSAvIGhpdCBtb3ZlbWVudCBkZXRlY3Rpb24gaW5mb3JtYXRpb24uXG4gICAqIEB0eXBlZGVmIGtpY2tcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGludGVuc2l0eSAtIHRoZSBjdXJyZW50IGludGVuc2l0eSBvZiB0aGUgXCJraWNrXCIgZ2VzdHVyZS5cbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBraWNraW5nIC0gdHJ1ZSBpZiBhIFwia2lja1wiIGdlc3R1cmUgaXMgYmVpbmcgZGV0ZWN0ZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIFNoYWtlIG1vdmVtZW50IGRldGVjdGlvbiBpbmZvcm1hdGlvbi5cbiAgICogQHR5cGVkZWYgc2hha2VcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IHNoYWtpbmcgLSB0aGUgY3VycmVudCBhbW91bnQgb2YgXCJzaGFraW5lc3NcIi5cbiAgICovXG5cbiAgLyoqXG4gICAqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzcGlubmluZyBzdGF0ZSBvZiB0aGUgc2Vuc29yLlxuICAgKiBAdHlwZWRlZiBzcGluXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gc3Bpbm5pbmcgLSB0cnVlIGlmIHRoZSBzZW5zb3IgaXMgc3Bpbm5pbmcsIGZhbHNlIG90aGVyd2lzZS5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGR1cmF0aW9uIC0gdGhlIGR1cmF0aW9uIG9mIHRoZSBzcGlubmluZyBzaW5jZSBpdHMgYmVnaW5uaW5nLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gZ3lyTm9ybSAtIHRoZSBub3JtIG9mIHRoZSByb3RhdGlvbiBzcGVlZC5cbiAgICovXG5cbiAgLyoqXG4gICAqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzdGlsbG5lc3Mgb2YgdGhlIHNlbnNvci5cbiAgICogQHR5cGVkZWYgc3RpbGxcbiAgICogQHR5cGUge09iamVjdH1cbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBzdGlsbCAtIHRydWUgaWYgdGhlIHNlbnNvciBpcyBzdGlsbCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKiBAcHJvcGVydHkge051bWJlcn0gc2xpZGUgLSB0aGUgb3JpZ2luYWwgdmFsdWUgdGhyZXNob2xkZWQgdG8gZGV0ZXJtaW5lIHN0aWxsbmVzcy5cbiAgICovXG5cbiAgLyoqXG4gICAqIENvbXB1dGVkIGZlYXR1cmVzLlxuICAgKiBAdHlwZWRlZiBmZWF0dXJlc1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKiBAcHJvcGVydHkge2FjY0ludGVuc2l0eX0gYWNjSW50ZW5zaXR5IC0gSW50ZW5zaXR5IG9mIHRoZSBtb3ZlbWVudCBzZW5zZWQgYnkgYW4gYWNjZWxlcm9tZXRlci5cbiAgICogQHByb3BlcnR5IHtneXJJbnRlbnNpdHl9IGd5ckludGVuc2l0eSAtIEludGVuc2l0eSBvZiB0aGUgbW92ZW1lbnQgc2Vuc2VkIGJ5IGEgZ3lyb3Njb3BlLlxuICAgKiBAcHJvcGVydHkge2ZyZWVmYWxsfSBmcmVlZmFsbCAtIEluZm9ybWF0aW9uIGFib3V0IHRoZSBmcmVlIGZhbGxpbmcgc3RhdGUgb2YgdGhlIHNlbnNvci5cbiAgICogQHByb3BlcnR5IHtraWNrfSBraWNrIC0gSW1wdWxzZSAvIGhpdCBtb3ZlbWVudCBkZXRlY3Rpb24gaW5mb3JtYXRpb24uXG4gICAqIEBwcm9wZXJ0eSB7c2hha2V9IHNoYWtlIC0gU2hha2UgbW92ZW1lbnQgZGV0ZWN0aW9uIGluZm9ybWF0aW9uLlxuICAgKiBAcHJvcGVydHkge3NwaW59IHNwaW4gLSBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc3Bpbm5pbmcgc3RhdGUgb2YgdGhlIHNlbnNvci5cbiAgICogQHByb3BlcnR5IHtzdGlsbH0gc3RpbGwgLSBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc3RpbGxuZXNzIG9mIHRoZSBzZW5zb3IuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBDYWxsYmFjayBoYW5kbGluZyB0aGUgZmVhdHVyZXMuXG4gICAqIEBjYWxsYmFjayBmZWF0dXJlc0NhbGxiYWNrXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBlcnIgLSBEZXNjcmlwdGlvbiBvZiBhIHBvdGVudGlhbCBlcnJvci5cbiAgICogQHBhcmFtIHtmZWF0dXJlc30gcmVzIC0gT2JqZWN0IGhvbGRpbmcgdGhlIGZlYXR1cmUgdmFsdWVzLlxuICAgKi9cblxuICAvKipcbiAgICogVHJpZ2dlcnMgY29tcHV0YXRpb24gb2YgdGhlIGZlYXR1cmVzIGZyb20gdGhlIGN1cnJlbnQgc2Vuc29yIHZhbHVlcyBhbmRcbiAgICogcGFzcyB0aGUgcmVzdWx0cyB0byBhIGNhbGxiYWNrXG4gICAqIEBwYXJhbSB7ZmVhdHVyZXNDYWxsYmFja30gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgaGFuZGxpbmcgdGhlIGxhc3QgY29tcHV0ZWQgZmVhdHVyZXNcbiAgICogQHJldHVybnMge2ZlYXR1cmVzfSBmZWF0dXJlcyAtIFJldHVybiB0aGVzZSBjb21wdXRlZCBmZWF0dXJlcyBhbnl3YXlcbiAgICovXG4gIHVwZGF0ZShjYWxsYmFjayA9IG51bGwpIHtcbiAgICAvLyBERUFMIFdJVEggdGhpcy5fZWxhcHNlZFRpbWVcbiAgICB0aGlzLl9lbGFwc2VkVGltZSA9IHBlcmZOb3coKTtcbiAgICAvLyBpcyB0aGlzIG9uZSB1c2VkIGJ5IHNldmVyYWwgZmVhdHVyZXMgP1xuICAgIHRoaXMuX2FjY05vcm0gPSB0aGlzLl9tYWduaXR1ZGUzRCh0aGlzLmFjYyk7XG4gICAgLy8gdGhpcyBvbmUgbmVlZHMgYmUgaGVyZSBiZWNhdXNlIHVzZWQgYnkgZnJlZWZhbGwgQU5EIHNwaW5cbiAgICB0aGlzLl9neXJOb3JtID0gdGhpcy5fbWFnbml0dWRlM0QodGhpcy5neXIpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZ3lyKTtcblxuICAgIGxldCBlcnIgPSBudWxsO1xuICAgIGxldCByZXMgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICByZXMgPSB7fTtcbiAgICAgIGZvciAobGV0IGtleSBvZiB0aGlzLl9wYXJhbXMuZmVhdHVyZXMpIHtcbiAgICAgICAgaWYgKHRoaXMuX21ldGhvZHNba2V5XSkge1xuICAgICAgICAgIHRoaXMuX21ldGhvZHNba2V5XShyZXMpO1xuICAgICAgICB9XG4gICAgICB9IFxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVyciA9IGU7XG4gICAgfVxuXG4gICAgdGhpcy5fbG9vcEluZGV4ID0gKHRoaXMuX2xvb3BJbmRleCArIDEpICUgdGhpcy5fbG9vcEluZGV4UGVyaW9kO1xuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayhlcnIsIHJlcyk7ICBcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuICAvLz09PT09PT09PT09PT09PT09PT09PT09PSBzcGVjaWZpYyBmZWF0dXJlcyBjb21wdXRpbmcgPT09PT09PT09PT09PT09PT09PT09Ly9cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF91cGRhdGVBY2NSYXcocmVzKSB7XG4gICAgcmVzLmFjY1JhdyA9IHtcbiAgICAgIHg6IHRoaXMuYWNjWzBdLFxuICAgICAgeTogdGhpcy5hY2NbMV0sXG4gICAgICB6OiB0aGlzLmFjY1syXVxuICAgIH07XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3VwZGF0ZUd5clJhdyhyZXMpIHtcbiAgICByZXMuZ3lyUmF3ID0ge1xuICAgICAgeDogdGhpcy5neXJbMF0sXG4gICAgICB5OiB0aGlzLmd5clsxXSxcbiAgICAgIHo6IHRoaXMuZ3lyWzJdXG4gICAgfTtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gYWNjIGludGVuc2l0eVxuICAvKiogQHByaXZhdGUgKi9cbiAgX3VwZGF0ZUFjY0ludGVuc2l0eShyZXMpIHtcbiAgICB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtID0gMDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICB0aGlzLl9hY2NMYXN0W2ldW3RoaXMuX2xvb3BJbmRleCAlIDNdID0gdGhpcy5hY2NbaV07XG5cbiAgICAgIHRoaXMuX2FjY0ludGVuc2l0eVtpXSA9IHRoaXMuX2ludGVuc2l0eTFEKFxuICAgICAgICB0aGlzLmFjY1tpXSxcbiAgICAgICAgdGhpcy5fYWNjTGFzdFtpXVsodGhpcy5fbG9vcEluZGV4ICsgMSkgJSAzXSxcbiAgICAgICAgdGhpcy5fYWNjSW50ZW5zaXR5TGFzdFtpXVsodGhpcy5fbG9vcEluZGV4ICsgMSkgJSAyXSxcbiAgICAgICAgdGhpcy5fcGFyYW1zLmFjY0ludGVuc2l0eVBhcmFtMSxcbiAgICAgICAgdGhpcy5fcGFyYW1zLmFjY0ludGVuc2l0eVBhcmFtMixcbiAgICAgICAgMVxuICAgICAgKTtcblxuICAgICAgdGhpcy5fYWNjSW50ZW5zaXR5TGFzdFtpXVt0aGlzLl9sb29wSW5kZXggJSAyXSA9IHRoaXMuX2FjY0ludGVuc2l0eVtpXTtcblxuICAgICAgdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybSArPSB0aGlzLl9hY2NJbnRlbnNpdHlbaV07XG4gICAgfVxuXG4gICAgcmVzLmFjY0ludGVuc2l0eSA9IHtcbiAgICAgIG5vcm06IHRoaXMuX2FjY0ludGVuc2l0eU5vcm0sXG4gICAgICB4OiB0aGlzLl9hY2NJbnRlbnNpdHlbMF0sXG4gICAgICB5OiB0aGlzLl9hY2NJbnRlbnNpdHlbMV0sXG4gICAgICB6OiB0aGlzLl9hY2NJbnRlbnNpdHlbMl1cbiAgICB9O1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBneXIgaW50ZW5zaXR5XG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfdXBkYXRlR3lySW50ZW5zaXR5KHJlcykge1xuICAgIHRoaXMuX2d5ckludGVuc2l0eU5vcm0gPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIHRoaXMuX2d5ckxhc3RbaV1bdGhpcy5fbG9vcEluZGV4ICUgM10gPSB0aGlzLmd5cltpXTtcblxuICAgICAgdGhpcy5fZ3lySW50ZW5zaXR5W2ldID0gdGhpcy5faW50ZW5zaXR5MUQoXG4gICAgICAgIHRoaXMuZ3lyW2ldLFxuICAgICAgICB0aGlzLl9neXJMYXN0W2ldWyh0aGlzLl9sb29wSW5kZXggKyAxKSAlIDNdLFxuICAgICAgICB0aGlzLl9neXJJbnRlbnNpdHlMYXN0W2ldWyh0aGlzLl9sb29wSW5kZXggKyAxKSAlIDJdLFxuICAgICAgICB0aGlzLl9wYXJhbXMuZ3lySW50ZW5zaXR5UGFyYW0xLFxuICAgICAgICB0aGlzLl9wYXJhbXMuZ3lySW50ZW5zaXR5UGFyYW0yLFxuICAgICAgICAxXG4gICAgICApO1xuXG4gICAgICB0aGlzLl9neXJJbnRlbnNpdHlMYXN0W2ldW3RoaXMuX2xvb3BJbmRleCAlIDJdID0gdGhpcy5fZ3lySW50ZW5zaXR5W2ldO1xuXG4gICAgICB0aGlzLl9neXJJbnRlbnNpdHlOb3JtICs9IHRoaXMuX2d5ckludGVuc2l0eVtpXTtcbiAgICB9XG5cbiAgICByZXMuZ3lySW50ZW5zaXR5ID0ge1xuICAgICAgbm9ybTogdGhpcy5fZ3lySW50ZW5zaXR5Tm9ybSxcbiAgICAgIHg6IHRoaXMuX2d5ckludGVuc2l0eVswXSxcbiAgICAgIHk6IHRoaXMuX2d5ckludGVuc2l0eVsxXSxcbiAgICAgIHo6IHRoaXMuX2d5ckludGVuc2l0eVsyXVxuICAgIH07XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gZnJlZWZhbGxcbiAgLyoqIEBwcml2YXRlICovXG4gIF91cGRhdGVGcmVlZmFsbChyZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgdGhpcy5fZ3lyRGVsdGFbaV0gPVxuICAgICAgICB0aGlzLl9kZWx0YSh0aGlzLl9neXJMYXN0W2ldWyh0aGlzLl9sb29wSW5kZXggKyAxKSAlIDNdLCB0aGlzLmd5cltpXSwgMSk7XG4gICAgfVxuXG4gICAgdGhpcy5fZ3lyRGVsdGFOb3JtID0gdGhpcy5fbWFnbml0dWRlM0QodGhpcy5fZ3lyRGVsdGEpO1xuXG4gICAgaWYgKHRoaXMuX2FjY05vcm0gPCB0aGlzLl9wYXJhbXMuZnJlZWZhbGxBY2NUaHJlc2ggfHxcbiAgICAgICAgKHRoaXMuX2d5ck5vcm0gPiB0aGlzLl9wYXJhbXMuZnJlZWZhbGxHeXJUaHJlc2hcbiAgICAgICAgICAmJiB0aGlzLl9neXJEZWx0YU5vcm0gPCB0aGlzLl9wYXJhbXMuZnJlZWZhbGxHeXJEZWx0YVRocmVzaCkpIHtcbiAgICAgIGlmICghdGhpcy5faXNGYWxsaW5nKSB7XG4gICAgICAgIHRoaXMuX2lzRmFsbGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuX2ZhbGxCZWdpbiA9IHBlcmZOb3coKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2ZhbGxFbmQgPSBwZXJmTm93KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLl9pc0ZhbGxpbmcpIHtcbiAgICAgICAgdGhpcy5faXNGYWxsaW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2ZhbGxEdXJhdGlvbiA9ICh0aGlzLl9mYWxsRW5kIC0gdGhpcy5fZmFsbEJlZ2luKTtcblxuICAgIHJlcy5mcmVlZmFsbCA9IHtcbiAgICAgIGFjY05vcm06IHRoaXMuX2FjY05vcm0sXG4gICAgICBmYWxsaW5nOiB0aGlzLl9pc0ZhbGxpbmcsXG4gICAgICBkdXJhdGlvbjogdGhpcy5fZmFsbER1cmF0aW9uXG4gICAgfTtcbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0ga2lja1xuICAvKiogQHByaXZhdGUgKi9cbiAgX3VwZGF0ZUtpY2socmVzKSB7XG4gICAgdGhpcy5faTMgPSB0aGlzLl9sb29wSW5kZXggJSB0aGlzLl9wYXJhbXMua2lja01lZGlhbkZpbHRlcnNpemU7XG4gICAgdGhpcy5faTEgPSB0aGlzLl9tZWRpYW5GaWZvW3RoaXMuX2kzXTtcbiAgICB0aGlzLl9pMiA9IDE7XG5cbiAgICBpZiAodGhpcy5faTEgPCB0aGlzLl9wYXJhbXMua2lja01lZGlhbkZpbHRlcnNpemUgLSAxICYmXG4gICAgICAgIHRoaXMuX2FjY0ludGVuc2l0eU5vcm0gPiB0aGlzLl9tZWRpYW5WYWx1ZXNbdGhpcy5faTEgKyB0aGlzLl9pMl0pIHtcbiAgICAgIC8vIGNoZWNrIHJpZ2h0XG4gICAgICB3aGlsZSAodGhpcy5faTEgKyB0aGlzLl9pMiA8IHRoaXMua2lja01lZGlhbkZpbHRlcnNpemUgJiZcbiAgICAgICAgICAgICAgdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybSA+IHRoaXMuX21lZGlhblZhbHVlc1t0aGlzLl9pMSArIHRoaXMuX2kyXSkge1xuICAgICAgICB0aGlzLl9tZWRpYW5GaWZvW3RoaXMuX21lZGlhbkxpbmtpbmdbdGhpcy5faTEgKyB0aGlzLl9pMl1dID0gXG4gICAgICAgIHRoaXMuX21lZGlhbkZpZm9bdGhpcy5fbWVkaWFuTGlua2luZ1t0aGlzLl9pMSArIHRoaXMuX2kyXV0gLSAxO1xuICAgICAgICB0aGlzLl9tZWRpYW5WYWx1ZXNbdGhpcy5faTEgKyB0aGlzLl9pMiAtIDFdID1cbiAgICAgICAgdGhpcy5fbWVkaWFuVmFsdWVzW3RoaXMuX2kxICsgdGhpcy5faTJdO1xuICAgICAgICB0aGlzLl9tZWRpYW5MaW5raW5nW3RoaXMuX2kxICsgdGhpcy5faTIgLSAxXSA9XG4gICAgICAgIHRoaXMuX21lZGlhbkxpbmtpbmdbdGhpcy5faTEgKyB0aGlzLl9pMl07XG4gICAgICAgIHRoaXMuX2kyKys7XG4gICAgICB9XG4gICAgICB0aGlzLl9tZWRpYW5WYWx1ZXNbdGhpcy5faTEgKyB0aGlzLl9pMiAtIDFdID0gdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybTtcbiAgICAgIHRoaXMuX21lZGlhbkxpbmtpbmdbdGhpcy5faTEgKyB0aGlzLl9pMiAtIDFdID0gdGhpcy5faTM7XG4gICAgICB0aGlzLl9tZWRpYW5GaWZvW3RoaXMuX2kzXSA9IHRoaXMuX2kxICsgdGhpcy5faTIgLSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjaGVjayBsZWZ0XG4gICAgICB3aGlsZSAodGhpcy5faTIgPCB0aGlzLl9pMSArIDEgJiZcbiAgICAgICAgICAgICB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtIDwgdGhpcy5fbWVkaWFuVmFsdWVzW3RoaXMuX2kxIC0gdGhpcy5faTJdKSB7XG4gICAgICAgIHRoaXMuX21lZGlhbkZpZm9bdGhpcy5fbWVkaWFuTGlua2luZ1t0aGlzLl9pMSAtIHRoaXMuX2kyXV0gPVxuICAgICAgICB0aGlzLl9tZWRpYW5GaWZvW3RoaXMuX21lZGlhbkxpbmtpbmdbdGhpcy5faTEgLSB0aGlzLl9pMl1dICsgMTtcbiAgICAgICAgdGhpcy5fbWVkaWFuVmFsdWVzW3RoaXMuX2kxIC0gdGhpcy5faTIgKyAxXSA9XG4gICAgICAgIHRoaXMuX21lZGlhblZhbHVlc1t0aGlzLl9pMSAtIHRoaXMuX2kyXTtcbiAgICAgICAgdGhpcy5fbWVkaWFuTGlua2luZ1t0aGlzLl9pMSAtIHRoaXMuX2kyICsgMV0gPVxuICAgICAgICB0aGlzLl9tZWRpYW5MaW5raW5nW3RoaXMuX2kxIC0gdGhpcy5faTJdO1xuICAgICAgICB0aGlzLl9pMisrO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWVkaWFuVmFsdWVzW3RoaXMuX2kxIC0gdGhpcy5faTIgKyAxXSA9IHRoaXMuX2FjY0ludGVuc2l0eU5vcm07XG4gICAgICB0aGlzLl9tZWRpYW5MaW5raW5nW3RoaXMuX2kxIC0gdGhpcy5faTIgKyAxXSA9IHRoaXMuX2kzO1xuICAgICAgdGhpcy5fbWVkaWFuRmlmb1t0aGlzLl9pM10gPSB0aGlzLl9pMSAtIHRoaXMuX2kyICsgMTtcbiAgICB9XG5cbiAgICAvLyBjb21wYXJlIGN1cnJlbnQgaW50ZW5zaXR5IG5vcm0gd2l0aCBwcmV2aW91cyBtZWRpYW4gdmFsdWVcbiAgICBpZiAodGhpcy5fYWNjSW50ZW5zaXR5Tm9ybSAtIHRoaXMuX2FjY0ludGVuc2l0eU5vcm1NZWRpYW4gPiB0aGlzLl9wYXJhbXMua2lja1RocmVzaCkge1xuICAgICAgaWYgKHRoaXMuX2lzS2lja2luZykge1xuICAgICAgICBpZiAodGhpcy5fa2lja0ludGVuc2l0eSA8IHRoaXMuX2FjY0ludGVuc2l0eU5vcm0pIHtcbiAgICAgICAgICB0aGlzLl9raWNrSW50ZW5zaXR5ID0gdGhpcy5fYWNjSW50ZW5zaXR5Tm9ybTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fa2lja0NhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpcy5fa2lja0NhbGxiYWNrKHsgc3RhdGU6ICdtaWRkbGUnLCBpbnRlbnNpdHk6IHRoaXMuX2tpY2tJbnRlbnNpdHkgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2lzS2lja2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMuX2tpY2tJbnRlbnNpdHkgPSB0aGlzLl9hY2NJbnRlbnNpdHlOb3JtO1xuICAgICAgICB0aGlzLl9sYXN0S2ljayA9IHRoaXMuX2VsYXBzZWRUaW1lO1xuICAgICAgICBpZiAodGhpcy5fa2lja0NhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpcy5fa2lja0NhbGxiYWNrKHsgc3RhdGU6ICdzdGFydCcsIGludGVuc2l0eTogdGhpcy5fa2lja0ludGVuc2l0eSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5fZWxhcHNlZFRpbWUgLSB0aGlzLl9sYXN0S2ljayA+IHRoaXMuX3BhcmFtcy5raWNrU3BlZWRHYXRlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0tpY2tpbmcgJiYgdGhpcy5fa2lja0NhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpcy5fa2lja0NhbGxiYWNrKHsgc3RhdGU6ICdzdG9wJywgaW50ZW5zaXR5OiB0aGlzLl9raWNrSW50ZW5zaXR5IH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lzS2lja2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2FjY0ludGVuc2l0eU5vcm1NZWRpYW4gPSB0aGlzLl9tZWRpYW5WYWx1ZXNbTWF0aC5jZWlsKHRoaXMuX3BhcmFtcy5raWNrTWVkaWFuRmlsdGVyc2l6ZSAqIDAuNSldO1xuXG4gICAgcmVzLmtpY2sgPSB7XG4gICAgICBpbnRlbnNpdHk6IHRoaXMuX2tpY2tJbnRlbnNpdHksXG4gICAgICBraWNraW5nOiB0aGlzLl9pc0tpY2tpbmdcbiAgICB9O1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IHNoYWtlXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfdXBkYXRlU2hha2UocmVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIHRoaXMuX2FjY0RlbHRhW2ldID0gdGhpcy5fZGVsdGEoXG4gICAgICAgIHRoaXMuX2FjY0xhc3RbaV1bKHRoaXMuX2xvb3BJbmRleCArIDEpICUgM10sXG4gICAgICAgIHRoaXMuYWNjW2ldLFxuICAgICAgICAxXG4gICAgICApO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5fc2hha2VXaW5kb3dbaV1bdGhpcy5fbG9vcEluZGV4ICUgdGhpcy5fcGFyYW1zLnNoYWtlV2luZG93U2l6ZV0pIHtcbiAgICAgICAgdGhpcy5fc2hha2VOYltpXS0tO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2FjY0RlbHRhW2ldID4gdGhpcy5fcGFyYW1zLnNoYWtlVGhyZXNoKSB7XG4gICAgICAgIHRoaXMuX3NoYWtlV2luZG93W2ldW3RoaXMuX2xvb3BJbmRleCAlIHRoaXMuX3BhcmFtcy5zaGFrZVdpbmRvd1NpemVdID0gMTtcbiAgICAgICAgdGhpcy5fc2hha2VOYltpXSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc2hha2VXaW5kb3dbaV1bdGhpcy5fbG9vcEluZGV4ICUgdGhpcy5fcGFyYW1zLnNoYWtlV2luZG93U2l6ZV0gPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3NoYWtpbmdSYXcgPVxuICAgIHRoaXMuX21hZ25pdHVkZTNEKHRoaXMuX3NoYWtlTmIpIC9cbiAgICB0aGlzLl9wYXJhbXMuc2hha2VXaW5kb3dTaXplO1xuICAgIHRoaXMuX3NoYWtlU2xpZGVQcmV2ID0gdGhpcy5fc2hha2luZztcbiAgICB0aGlzLl9zaGFraW5nID1cbiAgICB0aGlzLl9zbGlkZSh0aGlzLl9zaGFrZVNsaWRlUHJldiwgdGhpcy5fc2hha2luZ1JhdywgdGhpcy5fcGFyYW1zLnNoYWtlU2xpZGVGYWN0b3IpO1xuXG4gICAgcmVzLnNoYWtlID0ge1xuICAgICAgc2hha2luZzogdGhpcy5fc2hha2luZ1xuICAgIH07XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IHNwaW5cbiAgLyoqIEBwcml2YXRlICovXG4gIF91cGRhdGVTcGluKHJlcykge1xuICAgIGlmICh0aGlzLl9neXJOb3JtID4gdGhpcy5fcGFyYW1zLnNwaW5UaHJlc2gpIHtcbiAgICAgIGlmICghdGhpcy5faXNTcGlubmluZykge1xuICAgICAgICB0aGlzLl9pc1NwaW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc3BpbkJlZ2luID0gcGVyZk5vdygpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc3BpbkVuZCA9IHBlcmZOb3coKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2lzU3Bpbm5pbmcpIHtcbiAgICAgIHRoaXMuX2lzU3Bpbm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5fc3BpbkR1cmF0aW9uID0gdGhpcy5fc3BpbkVuZCAtIHRoaXMuX3NwaW5CZWdpbjtcblxuICAgIHJlcy5zcGluID0ge1xuICAgICAgc3Bpbm5pbmc6IHRoaXMuX2lzU3Bpbm5pbmcsXG4gICAgICBkdXJhdGlvbjogdGhpcy5fc3BpbkR1cmF0aW9uLFxuICAgICAgZ3lyTm9ybTogdGhpcy5fZ3lyTm9ybVxuICAgIH07XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gc3RpbGxcbiAgLyoqIEBwcml2YXRlICovXG4gIF91cGRhdGVTdGlsbChyZXMpIHtcbiAgICB0aGlzLl9zdGlsbENyb3NzUHJvZCA9IHRoaXMuX3N0aWxsQ3Jvc3NQcm9kdWN0KHRoaXMuZ3lyKTtcbiAgICB0aGlzLl9zdGlsbFNsaWRlUHJldiA9IHRoaXMuX3N0aWxsU2xpZGU7XG4gICAgdGhpcy5fc3RpbGxTbGlkZSA9IHRoaXMuX3NsaWRlKFxuICAgICAgdGhpcy5fc3RpbGxTbGlkZVByZXYsXG4gICAgICB0aGlzLl9zdGlsbENyb3NzUHJvZCxcbiAgICAgIHRoaXMuX3BhcmFtcy5zdGlsbFNsaWRlRmFjdG9yXG4gICAgKTtcblxuICAgIGlmICh0aGlzLl9zdGlsbFNsaWRlID4gdGhpcy5fcGFyYW1zLnN0aWxsVGhyZXNoKSB7XG4gICAgICB0aGlzLl9pc1N0aWxsID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2lzU3RpbGwgPSB0cnVlO1xuICAgIH1cbiAgXG4gICAgcmVzLnN0aWxsID0ge1xuICAgICAgc3RpbGw6IHRoaXMuX2lzU3RpbGwsXG4gICAgICBzbGlkZTogdGhpcy5fc3RpbGxTbGlkZVxuICAgIH1cbiAgfVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IGd5clpjclxuICAvKiogQHByaXZhdGUgKi9cblxuICBfdXBkYXRlR3lyWmNyKHJlcykge1xuICAgIGNvbnN0IHpjclJlcyA9IHRoaXMuX2d5clpjci5wcm9jZXNzKHRoaXMuX2d5ck5vcm0pO1xuICAgIHJlcy5neXJaY3IgPSB7XG4gICAgICBhbXBsaXR1ZGU6IHpjclJlcy5hbXBsaXR1ZGUsXG4gICAgICBmcmVxdWVuY3k6IHpjclJlcy5mcmVxdWVuY3ksXG4gICAgICBwZXJpb2RpY2l0eTogemNyUmVzLnBlcmlvZGljaXR5LFxuICAgIH07XG4gIH1cblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBhY2NaY3JcbiAgLyoqIEBwcml2YXRlICovXG5cbiAgX3VwZGF0ZUFjY1pjcihyZXMpIHtcbiAgICBjb25zdCBhY2NSZXMgPSB0aGlzLl9hY2NaY3IucHJvY2Vzcyh0aGlzLl9hY2NOb3JtKTtcbiAgICByZXMuYWNjWmNyID0ge1xuICAgICAgYW1wbGl0dWRlOiBhY2NaY3IuYW1wbGl0dWRlLFxuICAgICAgZnJlcXVlbmN5OiBhY2NaY3IuZnJlcXVlbmN5LFxuICAgICAgcGVyaW9kaWNpdHk6IGFjY1pjci5wZXJpb2RpY2l0eSxcbiAgICB9O1xuICB9XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PS8vXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gVVRJTElUSUVTID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0vL1xuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ly9cbiAgLyoqIEBwcml2YXRlICovXG4gIF9kZWx0YShwcmV2LCBuZXh0LCBkdCkge1xuICAgIHJldHVybiAobmV4dCAtIHByZXYpIC8gKDIgKiBkdCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2ludGVuc2l0eTFEKG5leHRYLCBwcmV2WCwgcHJldkludGVuc2l0eSwgcGFyYW0xLCBwYXJhbTIsIGR0KSB7XG4gICAgY29uc3QgZHggPSB0aGlzLl9kZWx0YShuZXh0WCwgcHJldlgsIGR0KTsvLyhuZXh0WCAtIHByZXZYKSAvICgyICogZHQpO1xuICAgIHJldHVybiBwYXJhbTIgKiBkeCAqIGR4ICsgcGFyYW0xICogcHJldkludGVuc2l0eTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfbWFnbml0dWRlM0QoeHl6QXJyYXkpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHh5ekFycmF5WzBdICogeHl6QXJyYXlbMF0gKyBcbiAgICAgICAgICAgICAgICAgICAgIHh5ekFycmF5WzFdICogeHl6QXJyYXlbMV0gK1xuICAgICAgICAgICAgICAgICAgICAgeHl6QXJyYXlbMl0gKiB4eXpBcnJheVsyXSk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2xjbShhLCBiKSB7XG4gICAgbGV0IGExID0gYSwgYjEgPSBiO1xuXG4gICAgd2hpbGUgKGExICE9IGIxKSB7XG4gICAgICBpZiAoYTEgPCBiMSkge1xuICAgICAgICBhMSArPSBhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYjEgKz0gYjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYTE7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3NsaWRlKHByZXZTbGlkZSwgY3VycmVudFZhbCwgc2xpZGVGYWN0b3IpIHtcbiAgICByZXR1cm4gcHJldlNsaWRlICsgKGN1cnJlbnRWYWwgLSBwcmV2U2xpZGUpIC8gc2xpZGVGYWN0b3I7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3N0aWxsQ3Jvc3NQcm9kdWN0KHh5ekFycmF5KSB7XG4gICAgcmV0dXJuICh4eXpBcnJheVsxXSAtIHh5ekFycmF5WzJdKSAqICh4eXpBcnJheVsxXSAtIHh5ekFycmF5WzJdKSArXG4gICAgICAgICAgICh4eXpBcnJheVswXSAtIHh5ekFycmF5WzFdKSAqICh4eXpBcnJheVswXSAtIHh5ekFycmF5WzFdKSArXG4gICAgICAgICAgICh4eXpBcnJheVsyXSAtIHh5ekFycmF5WzBdKSAqICh4eXpBcnJheVsyXSAtIHh5ekFycmF5WzBdKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb3Rpb25GZWF0dXJlcztcbiJdfQ==
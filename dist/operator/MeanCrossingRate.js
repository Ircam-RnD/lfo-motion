'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _core = require('waves-lfo/core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parameters = {
  noiseThreshold: {
    type: 'float',
    default: 0.1
  },
  frameSize: {
    type: 'integer',
    default: 512,
    metas: { kind: 'static' }
  },
  hopSize: { // should be nullable
    type: 'integer',
    default: null,
    nullable: true,
    metas: { kind: 'static' }
  }
  // centeredTimeTags: {
  //   type: 'boolean',
  //   default: false,
  // }


  /**
   * Mean Crossing Rate operator : estimates the frequency and periodicity of
   * a (n-dimension) signal, either on an input stream of signal frames, or by
   * using its own sliding window on an input stream of vectors.
   *
   * The mean is estimated on each new analyzed window using the following equation :
   * `mean = min + (max - min) * 0.5;`
   *
   * output: an array of size `2 * inputDimension`
   * (`[ frequency1, periodicity1, ... frequencyN, periodicityN ]`)
   *
   * @param {Object} [options] - Override default options.
   * @param {Number} [options.noiseThreshold=0.1] - Threshold added to the mean to
   *  avoid confusion between noise and real signal.
   * @param {Number} [options.frameSize=512] - Size of the internal sliding window.
   * Will be ignored if input is signal.
   * @param {Number} [options.hopSize=null] - Number of samples between
   * two computations on the internal sliding window. Will be ignored is input is
   * signal.
   */

  // We don't use centered time tags for signal input, as we don't know if it's
  // already been done by a previous slicer.
  // So we don't implement it for now.
  // would be :
  // @param {Boolean} [options.centeredTimeTags=false] - Move the time tag to the
  // middle of the frame.

};
var MeanCrossingRate = function (_BaseLfo) {
  (0, _inherits3.default)(MeanCrossingRate, _BaseLfo);

  function MeanCrossingRate() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MeanCrossingRate);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MeanCrossingRate.__proto__ || (0, _getPrototypeOf2.default)(MeanCrossingRate)).call(this, parameters, options));

    _this._mcrs = [];
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(MeanCrossingRate, [{
    key: 'onParamUpdate',
    value: function onParamUpdate(name, value, metas) {
      if (!this.params.hopSize) this.params.set('hopSize', frameSize);

      if (this.streamParams.frameType === 'signal') this.params.set('frameSize', this.prevStreamParams.frameSize);
    }

    /** @private */

  }, {
    key: 'processStreamParams',
    value: function processStreamParams() {
      var prevStreamParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.prepareStreamParams(prevStreamParams);

      // TODO : set output samplerate according to input samplerate + hopSize (?)
      this._mcrs = [];

      var noiseThreshold = this.params.get('noiseThreshold');
      var frameSize = this.streamParams.frameType === 'vector' ? this.params.get('frameSize') : prevStreamParams.frameSize;
      var hopSize = this.params.get('hopSize'); // if input is signal we don't care anyway
      var sampleRate = prevStreamParams.sourceSampleRate;

      var paramsDescription = ['frequency', 'periodicity'];

      var inputDimension = 1;

      if (this.streamParams.frameType === 'vector') {
        inputDimension = prevStreamParams.frameSize;
      } else if (this.streamParams.frameType === 'signal') {
        // if input frames are of type "signal", input dimension is 1
        inputDimension = 1;
      }

      this.streamParams.frameSize = 2 * inputDimension;
      this.streamParams.description = [];

      for (var i = 0; i < inputDimension; i++) {
        this.streamParams.description.concat(paramsDescription);

        this._mcrs.push(new MeanCrossingRateBase({
          noiseThreshold: noiseThreshold,
          frameSize: frameSize,
          hopSize: hopSize,
          sampleRate: sampleRate
        }));
      }

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      var inData = frame.data;
      var outData = this.frame.data;

      for (var i = 0; i < this._mcrs.length; i++) {
        var r = this._mcrs[i].process(inData[i]);
        outData[i * 2] = r.frequency;
        outData[i * 2 + 1] = r.periodicity;
      }
    }

    /** @private */

  }, {
    key: 'processSignal',
    value: function processSignal(frame) {
      var inData = frame.data;
      var outData = this.frame.data;

      var r = this._mcrs[0].processFrame(inData);
      outData[0] = r.frequency;
      outData[1] = r.periodicity;
    }
  }]);
  return MeanCrossingRate;
}(_core.BaseLfo);

exports.default = MeanCrossingRate;

//----------------------------------------------------------------------------//
//=============== Base class for mean crossing rate computation ==============//
//----------------------------------------------------------------------------//

var mcrBaseDefaults = {
  noiseThreshold: 0.1,
  // only used with internal circular buffer (fed sample(s) by sample(s)),
  // when input type is vector :
  frameSize: 50,
  hopSize: 5,
  sampleRate: null
};

var MeanCrossingRateBase = function () {
  function MeanCrossingRateBase() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MeanCrossingRateBase);

    (0, _assign2.default)({}, options, mcrBaseDefaults);

    this.mean = 0;
    this.magnitude = 0;
    this.stdDev = 0;
    this.crossings = [];
    this.periodMean = 0;
    this.periodStdDev = 0;
    this.inputFrame = [];

    this.setConfig(options);

    //this.maxFreq = this.inputRate / 0.5;
  }

  (0, _createClass3.default)(MeanCrossingRateBase, [{
    key: 'setConfig',
    value: function setConfig(cfg) {
      if (cfg.noiseThreshold) {
        this.noiseThreshold = cfg.noiseThreshold;
      }

      if (cfg.frameSize) {
        this.frameSize = cfg.frameSize;
      }

      if (cfg.hopSize) {
        this.hopSize = cfg.hopSize;
      }

      if (cfg.sampleRate) {
        this.sampleRate = cfg.sampleRate;
        // this.maxFreq = this.sampleRate / 2;
      }

      this.inputBuffer = new Array(this.frameSize);
      for (var i = 0; i < this.frameSize; i++) {
        this.inputBuffer[i] = 0;
      }

      this.hopCounter = 0;
      this.bufferIndex = 0;

      this.results = { amplitude: 0, frequency: 0, periodicity: 0 };
    }
  }, {
    key: 'process',
    value: function process(value) {
      // update internal circular buffer
      // then call processFrame(this.inputBuffer) if needed
      this.inputBuffer[this.bufferIndex] = value;
      this.bufferIndex = (this.bufferIndex + 1) % this.frameSize;

      if (this.hopCounter === this.hopSize - 1) {
        this.hopCounter = 0;
        this.processFrame(this.inputBuffer, this.bufferIndex);
      } else {
        this.hopCounter++;
      }

      return this.results;
    }

    // compute magnitude, zero crossing rate, and periodicity

  }, {
    key: 'processFrame',
    value: function processFrame(frame) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      if (frame.length < 2) {
        return { amplitude: 0, frequency: 0, periodicity: 0 };
      }

      this.inputFrame = frame;

      this._mainAlgorithm();

      // TODO: improve this (2.0 is empirical factor because we don't know a priori sensor range)
      this.amplitude = this.stdDev * 2.0;

      /* * * * * * * * * * * * * * * */

      // this one is working with one direction crossings detection version
      this.frequency = this.crossings.length / Math.floor(this.inputFrame.length * 0.5); // normalized by "nyquist ratio"

      // this one is working with two direction crossings detection version
      // this.frequency = this.crossings.length / (this.inputFrame.length - 1); // beware of division by zero

      // if sampleRate is specified, translate normalized frequency to Hertz :
      if (this.sampleRate) {
        this.frequency *= Math.floor(this.sampleRate / 2);
      }

      /* * * * * * * * * * * * * * * */

      if (this.crossings.length > 2) {
        // periodicity is normalized based on input frame size.
        this.periodicity = 1.0 - Math.sqrt(this.periodStdDev / this.inputFrame.length);
      } else {
        this.periodicity = 0;
      }

      this.results.amplitude = this.amplitude;
      this.results.frequency = this.frequency;
      this.results.periodicity = this.periodicity;

      return this.results;
    }
  }, {
    key: '_mainAlgorithm',
    value: function _mainAlgorithm() {

      // compute min, max, mean and magnitude
      // this.mean = 0;
      // this.magnitude = 0;

      var min = void 0,
          max = void 0;
      min = max = this.inputFrame[0];

      for (var i = 0; i < this.inputFrame.length; i++) {
        var val = this.inputFrame[i];

        // this.mean += val;
        // this.magnitude += val * val;

        if (val > max) max = val;else if (val < min) min = val;
      }

      // TODO : more tests to determine which mean (true mean or (max-min)/2) is the best
      //this.mean /= this.inputFrame.length;
      this.mean = min + (max - min) * 0.5;

      // this.magnitude /= this.inputFrame.length;
      // this.magnitude = Math.sqrt(this.magnitude);

      // compute signal stdDev and number of mean-crossings
      // using ascending AND / OR descending mean crossing (see comments)
      this.crossings = [];
      this.upCrossings = [];
      this.downCrossings = [];
      this.stdDev = 0;

      var prevDelta = this.inputFrame[0] - this.mean;

      //for (let i in this.inputFrame) {
      for (var _i = 1; _i < this.inputFrame.length; _i++) {
        var delta = this.inputFrame[_i] - this.mean;
        this.stdDev += delta * delta;

        if (prevDelta > this.noiseThreshold && delta < this.noiseThreshold) {
          // falling
          // this.crossings.push(i);
          this.downCrossings.push(_i);
        } else if (prevDelta < this.noiseThreshold && delta > this.noiseThreshold) {
          // rising
          // this.crossings.push(i);
          this.upCrossings.push(_i);
        }

        this.crossings = this.upCrossings.length > this.downCrossings.length ? this.upCrossings : this.downCrossings;

        prevDelta = delta;
      }

      this.stdDev = Math.sqrt(this.stdDev);

      // compute mean of delta-T between crossings
      this.periodMean = 0;
      for (var _i2 = 1; _i2 < this.crossings.length; _i2++) {
        this.periodMean += this.crossings[_i2] - this.crossings[_i2 - 1];
      }

      // if we have a NaN here we don't care as we won't use this.periodMean below
      this.periodMean /= this.crossings.length - 1;

      // compute stdDev of delta-T between crossings
      this.periodStdDev = 0;

      for (var _i3 = 1; _i3 < this.crossings.length; _i3++) {
        var deltaP = this.crossings[_i3] - this.crossings[_i3 - 1] - this.periodMean;
        this.periodStdDev += deltaP * deltaP;
      }

      if (this.crossings.length > 2) {
        this.periodStdDev = Math.sqrt(this.periodStdDev / (this.crossings.length - 2));
      }
    }
  }]);
  return MeanCrossingRateBase;
}();

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm5vaXNlVGhyZXNob2xkIiwidHlwZSIsImRlZmF1bHQiLCJmcmFtZVNpemUiLCJtZXRhcyIsImtpbmQiLCJob3BTaXplIiwibnVsbGFibGUiLCJNZWFuQ3Jvc3NpbmdSYXRlIiwib3B0aW9ucyIsIl9tY3JzIiwibmFtZSIsInZhbHVlIiwicGFyYW1zIiwic2V0Iiwic3RyZWFtUGFyYW1zIiwiZnJhbWVUeXBlIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJnZXQiLCJzYW1wbGVSYXRlIiwic291cmNlU2FtcGxlUmF0ZSIsInBhcmFtc0Rlc2NyaXB0aW9uIiwiaW5wdXREaW1lbnNpb24iLCJkZXNjcmlwdGlvbiIsImkiLCJjb25jYXQiLCJwdXNoIiwiTWVhbkNyb3NzaW5nUmF0ZUJhc2UiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwibGVuZ3RoIiwiciIsInByb2Nlc3MiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsInByb2Nlc3NGcmFtZSIsIm1jckJhc2VEZWZhdWx0cyIsIm1lYW4iLCJtYWduaXR1ZGUiLCJzdGREZXYiLCJjcm9zc2luZ3MiLCJwZXJpb2RNZWFuIiwicGVyaW9kU3RkRGV2IiwiaW5wdXRGcmFtZSIsInNldENvbmZpZyIsImNmZyIsImlucHV0QnVmZmVyIiwiQXJyYXkiLCJob3BDb3VudGVyIiwiYnVmZmVySW5kZXgiLCJyZXN1bHRzIiwiYW1wbGl0dWRlIiwib2Zmc2V0IiwiX21haW5BbGdvcml0aG0iLCJNYXRoIiwiZmxvb3IiLCJzcXJ0IiwibWluIiwibWF4IiwidmFsIiwidXBDcm9zc2luZ3MiLCJkb3duQ3Jvc3NpbmdzIiwicHJldkRlbHRhIiwiZGVsdGEiLCJkZWx0YVAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBRUEsSUFBTUEsYUFBYTtBQUNqQkMsa0JBQWdCO0FBQ2RDLFVBQU0sT0FEUTtBQUVkQyxhQUFTO0FBRkssR0FEQztBQUtqQkMsYUFBVztBQUNURixVQUFNLFNBREc7QUFFVEMsYUFBUyxHQUZBO0FBR1RFLFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSEUsR0FMTTtBQVVqQkMsV0FBUyxFQUFFO0FBQ1RMLFVBQU0sU0FEQztBQUVQQyxhQUFTLElBRkY7QUFHUEssY0FBVSxJQUhIO0FBSVBILFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSkE7QUFNVDtBQUNBO0FBQ0E7QUFDQTs7O0FBR0Y7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBaERtQixDQUFuQjtJQWtETUcsZ0I7OztBQUNKLDhCQUEwQjtBQUFBLFFBQWRDLE9BQWMsdUVBQUosRUFBSTtBQUFBOztBQUFBLDBKQUNsQlYsVUFEa0IsRUFDTlUsT0FETTs7QUFHeEIsVUFBS0MsS0FBTCxHQUFhLEVBQWI7QUFId0I7QUFJekI7O0FBRUQ7Ozs7O2tDQUNjQyxJLEVBQU1DLEssRUFBT1IsSyxFQUFPO0FBQ2hDLFVBQUksQ0FBQyxLQUFLUyxNQUFMLENBQVlQLE9BQWpCLEVBQ0UsS0FBS08sTUFBTCxDQUFZQyxHQUFaLENBQWdCLFNBQWhCLEVBQTJCWCxTQUEzQjs7QUFFRixVQUFJLEtBQUtZLFlBQUwsQ0FBa0JDLFNBQWxCLEtBQWdDLFFBQXBDLEVBQ0UsS0FBS0gsTUFBTCxDQUFZQyxHQUFaLENBQWdCLFdBQWhCLEVBQTZCLEtBQUtHLGdCQUFMLENBQXNCZCxTQUFuRDtBQUNIOztBQUVEOzs7OzBDQUMyQztBQUFBLFVBQXZCYyxnQkFBdUIsdUVBQUosRUFBSTs7QUFDekMsV0FBS0MsbUJBQUwsQ0FBeUJELGdCQUF6Qjs7QUFFQTtBQUNBLFdBQUtQLEtBQUwsR0FBYSxFQUFiOztBQUVBLFVBQU1WLGlCQUFpQixLQUFLYSxNQUFMLENBQVlNLEdBQVosQ0FBZ0IsZ0JBQWhCLENBQXZCO0FBQ0EsVUFBTWhCLFlBQWEsS0FBS1ksWUFBTCxDQUFrQkMsU0FBbEIsS0FBZ0MsUUFBakMsR0FDQSxLQUFLSCxNQUFMLENBQVlNLEdBQVosQ0FBZ0IsV0FBaEIsQ0FEQSxHQUVBRixpQkFBaUJkLFNBRm5DO0FBR0EsVUFBTUcsVUFBVSxLQUFLTyxNQUFMLENBQVlNLEdBQVosQ0FBZ0IsU0FBaEIsQ0FBaEIsQ0FWeUMsQ0FVRztBQUM1QyxVQUFNQyxhQUFhSCxpQkFBaUJJLGdCQUFwQzs7QUFFQSxVQUFNQyxvQkFBb0IsQ0FBRSxXQUFGLEVBQWUsYUFBZixDQUExQjs7QUFFQSxVQUFJQyxpQkFBaUIsQ0FBckI7O0FBRUEsVUFBSSxLQUFLUixZQUFMLENBQWtCQyxTQUFsQixLQUFnQyxRQUFwQyxFQUE4QztBQUM1Q08seUJBQWlCTixpQkFBaUJkLFNBQWxDO0FBQ0QsT0FGRCxNQUVPLElBQUksS0FBS1ksWUFBTCxDQUFrQkMsU0FBbEIsS0FBZ0MsUUFBcEMsRUFBOEM7QUFDbkQ7QUFDQU8seUJBQWlCLENBQWpCO0FBQ0Q7O0FBRUQsV0FBS1IsWUFBTCxDQUFrQlosU0FBbEIsR0FBOEIsSUFBSW9CLGNBQWxDO0FBQ0EsV0FBS1IsWUFBTCxDQUFrQlMsV0FBbEIsR0FBZ0MsRUFBaEM7O0FBRUEsV0FBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUlGLGNBQXBCLEVBQW9DRSxHQUFwQyxFQUF5QztBQUN2QyxhQUFLVixZQUFMLENBQWtCUyxXQUFsQixDQUE4QkUsTUFBOUIsQ0FBcUNKLGlCQUFyQzs7QUFFQSxhQUFLWixLQUFMLENBQVdpQixJQUFYLENBQWdCLElBQUlDLG9CQUFKLENBQXlCO0FBQ3ZDNUIsMEJBQWdCQSxjQUR1QjtBQUV2Q0cscUJBQVdBLFNBRjRCO0FBR3ZDRyxtQkFBU0EsT0FIOEI7QUFJdkNjLHNCQUFZQTtBQUoyQixTQUF6QixDQUFoQjtBQU1EOztBQUVELFdBQUtTLHFCQUFMO0FBQ0Q7O0FBRUQ7Ozs7a0NBQ2NDLEssRUFBTztBQUNuQixVQUFNQyxTQUFTRCxNQUFNRSxJQUFyQjtBQUNBLFVBQU1DLFVBQVUsS0FBS0gsS0FBTCxDQUFXRSxJQUEzQjs7QUFFQSxXQUFLLElBQUlQLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLZixLQUFMLENBQVd3QixNQUEvQixFQUF1Q1QsR0FBdkMsRUFBNEM7QUFDMUMsWUFBTVUsSUFBSSxLQUFLekIsS0FBTCxDQUFXZSxDQUFYLEVBQWNXLE9BQWQsQ0FBc0JMLE9BQU9OLENBQVAsQ0FBdEIsQ0FBVjtBQUNBUSxnQkFBUVIsSUFBSSxDQUFaLElBQWlCVSxFQUFFRSxTQUFuQjtBQUNBSixnQkFBUVIsSUFBSSxDQUFKLEdBQVEsQ0FBaEIsSUFBcUJVLEVBQUVHLFdBQXZCO0FBQ0Q7QUFDRjs7QUFFRDs7OztrQ0FDY1IsSyxFQUFPO0FBQ25CLFVBQU1DLFNBQVNELE1BQU1FLElBQXJCO0FBQ0EsVUFBTUMsVUFBVSxLQUFLSCxLQUFMLENBQVdFLElBQTNCOztBQUVBLFVBQU1HLElBQUksS0FBS3pCLEtBQUwsQ0FBVyxDQUFYLEVBQWM2QixZQUFkLENBQTJCUixNQUEzQixDQUFWO0FBQ0FFLGNBQVEsQ0FBUixJQUFhRSxFQUFFRSxTQUFmO0FBQ0FKLGNBQVEsQ0FBUixJQUFhRSxFQUFFRyxXQUFmO0FBQ0Q7Ozs7O2tCQUdZOUIsZ0I7O0FBRWY7QUFDQTtBQUNBOztBQUVBLElBQU1nQyxrQkFBa0I7QUFDdEJ4QyxrQkFBZ0IsR0FETTtBQUV0QjtBQUNBO0FBQ0FHLGFBQVcsRUFKVztBQUt0QkcsV0FBUyxDQUxhO0FBTXRCYyxjQUFZO0FBTlUsQ0FBeEI7O0lBU01RLG9CO0FBRUosa0NBQTBCO0FBQUEsUUFBZG5CLE9BQWMsdUVBQUosRUFBSTtBQUFBOztBQUN4QiwwQkFBYyxFQUFkLEVBQWtCQSxPQUFsQixFQUEyQitCLGVBQTNCOztBQUVBLFNBQUtDLElBQUwsR0FBWSxDQUFaO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixDQUFqQjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxDQUFkO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFNBQUtDLFVBQUwsR0FBa0IsQ0FBbEI7QUFDQSxTQUFLQyxZQUFMLEdBQW9CLENBQXBCO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQixFQUFsQjs7QUFFQSxTQUFLQyxTQUFMLENBQWV2QyxPQUFmOztBQUVBO0FBQ0Q7Ozs7OEJBRVN3QyxHLEVBQUs7QUFDYixVQUFJQSxJQUFJakQsY0FBUixFQUF3QjtBQUN0QixhQUFLQSxjQUFMLEdBQXNCaUQsSUFBSWpELGNBQTFCO0FBQ0Q7O0FBRUQsVUFBSWlELElBQUk5QyxTQUFSLEVBQW1CO0FBQ2pCLGFBQUtBLFNBQUwsR0FBaUI4QyxJQUFJOUMsU0FBckI7QUFDRDs7QUFFRCxVQUFJOEMsSUFBSTNDLE9BQVIsRUFBaUI7QUFDZixhQUFLQSxPQUFMLEdBQWUyQyxJQUFJM0MsT0FBbkI7QUFDRDs7QUFFRCxVQUFJMkMsSUFBSTdCLFVBQVIsRUFBb0I7QUFDbEIsYUFBS0EsVUFBTCxHQUFrQjZCLElBQUk3QixVQUF0QjtBQUNBO0FBQ0Q7O0FBRUQsV0FBSzhCLFdBQUwsR0FBbUIsSUFBSUMsS0FBSixDQUFVLEtBQUtoRCxTQUFmLENBQW5CO0FBQ0EsV0FBSyxJQUFJc0IsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUt0QixTQUF6QixFQUFvQ3NCLEdBQXBDLEVBQXlDO0FBQ3ZDLGFBQUt5QixXQUFMLENBQWlCekIsQ0FBakIsSUFBc0IsQ0FBdEI7QUFDRDs7QUFFRCxXQUFLMkIsVUFBTCxHQUFrQixDQUFsQjtBQUNBLFdBQUtDLFdBQUwsR0FBbUIsQ0FBbkI7O0FBRUEsV0FBS0MsT0FBTCxHQUFlLEVBQUVDLFdBQVcsQ0FBYixFQUFnQmxCLFdBQVcsQ0FBM0IsRUFBOEJDLGFBQWEsQ0FBM0MsRUFBZjtBQUNEOzs7NEJBRU8xQixLLEVBQU87QUFDYjtBQUNBO0FBQ0EsV0FBS3NDLFdBQUwsQ0FBaUIsS0FBS0csV0FBdEIsSUFBcUN6QyxLQUFyQztBQUNBLFdBQUt5QyxXQUFMLEdBQW1CLENBQUMsS0FBS0EsV0FBTCxHQUFtQixDQUFwQixJQUF5QixLQUFLbEQsU0FBakQ7O0FBRUEsVUFBSSxLQUFLaUQsVUFBTCxLQUFvQixLQUFLOUMsT0FBTCxHQUFlLENBQXZDLEVBQTBDO0FBQ3hDLGFBQUs4QyxVQUFMLEdBQWtCLENBQWxCO0FBQ0EsYUFBS2IsWUFBTCxDQUFrQixLQUFLVyxXQUF2QixFQUFvQyxLQUFLRyxXQUF6QztBQUNELE9BSEQsTUFHTztBQUNMLGFBQUtELFVBQUw7QUFDRDs7QUFFRCxhQUFPLEtBQUtFLE9BQVo7QUFDRDs7QUFFRDs7OztpQ0FDYXhCLEssRUFBbUI7QUFBQSxVQUFaMEIsTUFBWSx1RUFBSCxDQUFHOztBQUM5QixVQUFJMUIsTUFBTUksTUFBTixHQUFlLENBQW5CLEVBQXNCO0FBQ3BCLGVBQU8sRUFBRXFCLFdBQVcsQ0FBYixFQUFnQmxCLFdBQVcsQ0FBM0IsRUFBOEJDLGFBQWEsQ0FBM0MsRUFBUDtBQUNEOztBQUVELFdBQUtTLFVBQUwsR0FBa0JqQixLQUFsQjs7QUFFQSxXQUFLMkIsY0FBTDs7QUFFQTtBQUNBLFdBQUtGLFNBQUwsR0FBaUIsS0FBS1osTUFBTCxHQUFjLEdBQS9COztBQUVBOztBQUVBO0FBQ0EsV0FBS04sU0FBTCxHQUFpQixLQUFLTyxTQUFMLENBQWVWLE1BQWYsR0FBd0J3QixLQUFLQyxLQUFMLENBQVcsS0FBS1osVUFBTCxDQUFnQmIsTUFBaEIsR0FBeUIsR0FBcEMsQ0FBekMsQ0FmOEIsQ0FlcUQ7O0FBRW5GO0FBQ0E7O0FBRUE7QUFDQSxVQUFJLEtBQUtkLFVBQVQsRUFBcUI7QUFDbkIsYUFBS2lCLFNBQUwsSUFBa0JxQixLQUFLQyxLQUFMLENBQVcsS0FBS3ZDLFVBQUwsR0FBa0IsQ0FBN0IsQ0FBbEI7QUFDRDs7QUFFRDs7QUFFQSxVQUFJLEtBQUt3QixTQUFMLENBQWVWLE1BQWYsR0FBd0IsQ0FBNUIsRUFBK0I7QUFDN0I7QUFDQSxhQUFLSSxXQUFMLEdBQW1CLE1BQU1vQixLQUFLRSxJQUFMLENBQVUsS0FBS2QsWUFBTCxHQUFvQixLQUFLQyxVQUFMLENBQWdCYixNQUE5QyxDQUF6QjtBQUNELE9BSEQsTUFHTztBQUNMLGFBQUtJLFdBQUwsR0FBbUIsQ0FBbkI7QUFDRDs7QUFFRCxXQUFLZ0IsT0FBTCxDQUFhQyxTQUFiLEdBQXlCLEtBQUtBLFNBQTlCO0FBQ0EsV0FBS0QsT0FBTCxDQUFhakIsU0FBYixHQUF5QixLQUFLQSxTQUE5QjtBQUNBLFdBQUtpQixPQUFMLENBQWFoQixXQUFiLEdBQTJCLEtBQUtBLFdBQWhDOztBQUVBLGFBQU8sS0FBS2dCLE9BQVo7QUFDRDs7O3FDQUVnQjs7QUFFZjtBQUNBO0FBQ0E7O0FBRUEsVUFBSU8sWUFBSjtBQUFBLFVBQVNDLFlBQVQ7QUFDQUQsWUFBTUMsTUFBTSxLQUFLZixVQUFMLENBQWdCLENBQWhCLENBQVo7O0FBRUEsV0FBSyxJQUFJdEIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtzQixVQUFMLENBQWdCYixNQUFwQyxFQUE0Q1QsR0FBNUMsRUFBaUQ7QUFDL0MsWUFBSXNDLE1BQU0sS0FBS2hCLFVBQUwsQ0FBZ0J0QixDQUFoQixDQUFWOztBQUVBO0FBQ0E7O0FBRUEsWUFBSXNDLE1BQU1ELEdBQVYsRUFDRUEsTUFBTUMsR0FBTixDQURGLEtBRUssSUFBSUEsTUFBTUYsR0FBVixFQUNIQSxNQUFNRSxHQUFOO0FBQ0g7O0FBRUQ7QUFDQTtBQUNBLFdBQUt0QixJQUFMLEdBQVlvQixNQUFNLENBQUNDLE1BQU1ELEdBQVAsSUFBYyxHQUFoQzs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxXQUFLakIsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFdBQUtvQixXQUFMLEdBQW1CLEVBQW5CO0FBQ0EsV0FBS0MsYUFBTCxHQUFxQixFQUFyQjtBQUNBLFdBQUt0QixNQUFMLEdBQWMsQ0FBZDs7QUFFQSxVQUFJdUIsWUFBWSxLQUFLbkIsVUFBTCxDQUFnQixDQUFoQixJQUFxQixLQUFLTixJQUExQzs7QUFFQTtBQUNBLFdBQUssSUFBSWhCLEtBQUksQ0FBYixFQUFnQkEsS0FBSSxLQUFLc0IsVUFBTCxDQUFnQmIsTUFBcEMsRUFBNENULElBQTVDLEVBQWlEO0FBQy9DLFlBQUkwQyxRQUFRLEtBQUtwQixVQUFMLENBQWdCdEIsRUFBaEIsSUFBcUIsS0FBS2dCLElBQXRDO0FBQ0EsYUFBS0UsTUFBTCxJQUFld0IsUUFBUUEsS0FBdkI7O0FBRUEsWUFBSUQsWUFBWSxLQUFLbEUsY0FBakIsSUFBbUNtRSxRQUFRLEtBQUtuRSxjQUFwRCxFQUFvRTtBQUFFO0FBQ3BFO0FBQ0EsZUFBS2lFLGFBQUwsQ0FBbUJ0QyxJQUFuQixDQUF3QkYsRUFBeEI7QUFDRCxTQUhELE1BR08sSUFBSXlDLFlBQVksS0FBS2xFLGNBQWpCLElBQW1DbUUsUUFBUSxLQUFLbkUsY0FBcEQsRUFBb0U7QUFBRTtBQUMzRTtBQUNBLGVBQUtnRSxXQUFMLENBQWlCckMsSUFBakIsQ0FBc0JGLEVBQXRCO0FBQ0Q7O0FBRUQsYUFBS21CLFNBQUwsR0FBa0IsS0FBS29CLFdBQUwsQ0FBaUI5QixNQUFqQixHQUEwQixLQUFLK0IsYUFBTCxDQUFtQi9CLE1BQTlDLEdBQ0EsS0FBSzhCLFdBREwsR0FFQSxLQUFLQyxhQUZ0Qjs7QUFJQUMsb0JBQVlDLEtBQVo7QUFDRDs7QUFFRCxXQUFLeEIsTUFBTCxHQUFjZSxLQUFLRSxJQUFMLENBQVUsS0FBS2pCLE1BQWYsQ0FBZDs7QUFFQTtBQUNBLFdBQUtFLFVBQUwsR0FBa0IsQ0FBbEI7QUFDQSxXQUFLLElBQUlwQixNQUFJLENBQWIsRUFBZ0JBLE1BQUksS0FBS21CLFNBQUwsQ0FBZVYsTUFBbkMsRUFBMkNULEtBQTNDLEVBQWdEO0FBQzlDLGFBQUtvQixVQUFMLElBQW1CLEtBQUtELFNBQUwsQ0FBZW5CLEdBQWYsSUFBb0IsS0FBS21CLFNBQUwsQ0FBZW5CLE1BQUksQ0FBbkIsQ0FBdkM7QUFDRDs7QUFFRDtBQUNBLFdBQUtvQixVQUFMLElBQW9CLEtBQUtELFNBQUwsQ0FBZVYsTUFBZixHQUF3QixDQUE1Qzs7QUFFQTtBQUNBLFdBQUtZLFlBQUwsR0FBb0IsQ0FBcEI7O0FBRUEsV0FBSyxJQUFJckIsTUFBSSxDQUFiLEVBQWdCQSxNQUFJLEtBQUttQixTQUFMLENBQWVWLE1BQW5DLEVBQTJDVCxLQUEzQyxFQUFnRDtBQUM5QyxZQUFJMkMsU0FBVSxLQUFLeEIsU0FBTCxDQUFlbkIsR0FBZixJQUFvQixLQUFLbUIsU0FBTCxDQUFlbkIsTUFBSSxDQUFuQixDQUFwQixHQUE0QyxLQUFLb0IsVUFBL0Q7QUFDQSxhQUFLQyxZQUFMLElBQXFCc0IsU0FBU0EsTUFBOUI7QUFDRDs7QUFFRCxVQUFJLEtBQUt4QixTQUFMLENBQWVWLE1BQWYsR0FBd0IsQ0FBNUIsRUFBK0I7QUFDN0IsYUFBS1ksWUFBTCxHQUFvQlksS0FBS0UsSUFBTCxDQUFVLEtBQUtkLFlBQUwsSUFBcUIsS0FBS0YsU0FBTCxDQUFlVixNQUFmLEdBQXdCLENBQTdDLENBQVYsQ0FBcEI7QUFDRDtBQUNGOzs7OztBQUNGIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBub2lzZVRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4xLFxuICB9LFxuICBmcmFtZVNpemU6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogNTEyLFxuICAgIG1ldGFzOiB7IGtpbmQ6ICdzdGF0aWMnIH0sXG4gIH0sXG4gIGhvcFNpemU6IHsgLy8gc2hvdWxkIGJlIG51bGxhYmxlXG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgbnVsbGFibGU6IHRydWUsXG4gICAgbWV0YXM6IHsga2luZDogJ3N0YXRpYycgfSxcbiAgfSxcbiAgLy8gY2VudGVyZWRUaW1lVGFnczoge1xuICAvLyAgIHR5cGU6ICdib29sZWFuJyxcbiAgLy8gICBkZWZhdWx0OiBmYWxzZSxcbiAgLy8gfVxufVxuXG4vKipcbiAqIE1lYW4gQ3Jvc3NpbmcgUmF0ZSBvcGVyYXRvciA6IGVzdGltYXRlcyB0aGUgZnJlcXVlbmN5IGFuZCBwZXJpb2RpY2l0eSBvZlxuICogYSAobi1kaW1lbnNpb24pIHNpZ25hbCwgZWl0aGVyIG9uIGFuIGlucHV0IHN0cmVhbSBvZiBzaWduYWwgZnJhbWVzLCBvciBieVxuICogdXNpbmcgaXRzIG93biBzbGlkaW5nIHdpbmRvdyBvbiBhbiBpbnB1dCBzdHJlYW0gb2YgdmVjdG9ycy5cbiAqXG4gKiBUaGUgbWVhbiBpcyBlc3RpbWF0ZWQgb24gZWFjaCBuZXcgYW5hbHl6ZWQgd2luZG93IHVzaW5nIHRoZSBmb2xsb3dpbmcgZXF1YXRpb24gOlxuICogYG1lYW4gPSBtaW4gKyAobWF4IC0gbWluKSAqIDAuNTtgXG4gKlxuICogb3V0cHV0OiBhbiBhcnJheSBvZiBzaXplIGAyICogaW5wdXREaW1lbnNpb25gXG4gKiAoYFsgZnJlcXVlbmN5MSwgcGVyaW9kaWNpdHkxLCAuLi4gZnJlcXVlbmN5TiwgcGVyaW9kaWNpdHlOIF1gKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMubm9pc2VUaHJlc2hvbGQ9MC4xXSAtIFRocmVzaG9sZCBhZGRlZCB0byB0aGUgbWVhbiB0b1xuICogIGF2b2lkIGNvbmZ1c2lvbiBiZXR3ZWVuIG5vaXNlIGFuZCByZWFsIHNpZ25hbC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5mcmFtZVNpemU9NTEyXSAtIFNpemUgb2YgdGhlIGludGVybmFsIHNsaWRpbmcgd2luZG93LlxuICogV2lsbCBiZSBpZ25vcmVkIGlmIGlucHV0IGlzIHNpZ25hbC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5ob3BTaXplPW51bGxdIC0gTnVtYmVyIG9mIHNhbXBsZXMgYmV0d2VlblxuICogdHdvIGNvbXB1dGF0aW9ucyBvbiB0aGUgaW50ZXJuYWwgc2xpZGluZyB3aW5kb3cuIFdpbGwgYmUgaWdub3JlZCBpcyBpbnB1dCBpc1xuICogc2lnbmFsLlxuICovXG5cbi8vIFdlIGRvbid0IHVzZSBjZW50ZXJlZCB0aW1lIHRhZ3MgZm9yIHNpZ25hbCBpbnB1dCwgYXMgd2UgZG9uJ3Qga25vdyBpZiBpdCdzXG4vLyBhbHJlYWR5IGJlZW4gZG9uZSBieSBhIHByZXZpb3VzIHNsaWNlci5cbi8vIFNvIHdlIGRvbid0IGltcGxlbWVudCBpdCBmb3Igbm93LlxuLy8gd291bGQgYmUgOlxuLy8gQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5jZW50ZXJlZFRpbWVUYWdzPWZhbHNlXSAtIE1vdmUgdGhlIHRpbWUgdGFnIHRvIHRoZVxuLy8gbWlkZGxlIG9mIHRoZSBmcmFtZS5cblxuY2xhc3MgTWVhbkNyb3NzaW5nUmF0ZSBleHRlbmRzIEJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX21jcnMgPSBbXTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBvblBhcmFtVXBkYXRlKG5hbWUsIHZhbHVlLCBtZXRhcykge1xuICAgIGlmICghdGhpcy5wYXJhbXMuaG9wU2l6ZSlcbiAgICAgIHRoaXMucGFyYW1zLnNldCgnaG9wU2l6ZScsIGZyYW1lU2l6ZSk7XG5cbiAgICBpZiAodGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVUeXBlID09PSAnc2lnbmFsJylcbiAgICAgIHRoaXMucGFyYW1zLnNldCgnZnJhbWVTaXplJywgdGhpcy5wcmV2U3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICAvLyBUT0RPIDogc2V0IG91dHB1dCBzYW1wbGVyYXRlIGFjY29yZGluZyB0byBpbnB1dCBzYW1wbGVyYXRlICsgaG9wU2l6ZSAoPylcbiAgICB0aGlzLl9tY3JzID0gW107XG5cbiAgICBjb25zdCBub2lzZVRocmVzaG9sZCA9IHRoaXMucGFyYW1zLmdldCgnbm9pc2VUaHJlc2hvbGQnKTtcbiAgICBjb25zdCBmcmFtZVNpemUgPSAodGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVUeXBlID09PSAndmVjdG9yJylcbiAgICAgICAgICAgICAgICAgICAgPyB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lU2l6ZScpXG4gICAgICAgICAgICAgICAgICAgIDogcHJldlN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG4gICAgY29uc3QgaG9wU2l6ZSA9IHRoaXMucGFyYW1zLmdldCgnaG9wU2l6ZScpOyAvLyBpZiBpbnB1dCBpcyBzaWduYWwgd2UgZG9uJ3QgY2FyZSBhbnl3YXlcbiAgICBjb25zdCBzYW1wbGVSYXRlID0gcHJldlN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlO1xuXG4gICAgY29uc3QgcGFyYW1zRGVzY3JpcHRpb24gPSBbICdmcmVxdWVuY3knLCAncGVyaW9kaWNpdHknIF07XG5cbiAgICBsZXQgaW5wdXREaW1lbnNpb24gPSAxO1xuXG4gICAgaWYgKHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lVHlwZSA9PT0gJ3ZlY3RvcicpIHtcbiAgICAgIGlucHV0RGltZW5zaW9uID0gcHJldlN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG4gICAgfSBlbHNlIGlmICh0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVR5cGUgPT09ICdzaWduYWwnKSB7XG4gICAgICAvLyBpZiBpbnB1dCBmcmFtZXMgYXJlIG9mIHR5cGUgXCJzaWduYWxcIiwgaW5wdXQgZGltZW5zaW9uIGlzIDFcbiAgICAgIGlucHV0RGltZW5zaW9uID0gMTtcbiAgICB9XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAyICogaW5wdXREaW1lbnNpb247XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZGVzY3JpcHRpb24gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXREaW1lbnNpb247IGkrKykge1xuICAgICAgdGhpcy5zdHJlYW1QYXJhbXMuZGVzY3JpcHRpb24uY29uY2F0KHBhcmFtc0Rlc2NyaXB0aW9uKTtcblxuICAgICAgdGhpcy5fbWNycy5wdXNoKG5ldyBNZWFuQ3Jvc3NpbmdSYXRlQmFzZSh7XG4gICAgICAgIG5vaXNlVGhyZXNob2xkOiBub2lzZVRocmVzaG9sZCxcbiAgICAgICAgZnJhbWVTaXplOiBmcmFtZVNpemUsXG4gICAgICAgIGhvcFNpemU6IGhvcFNpemUsXG4gICAgICAgIHNhbXBsZVJhdGU6IHNhbXBsZVJhdGUsXG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgaW5EYXRhID0gZnJhbWUuZGF0YTtcbiAgICBjb25zdCBvdXREYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9tY3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByID0gdGhpcy5fbWNyc1tpXS5wcm9jZXNzKGluRGF0YVtpXSk7XG4gICAgICBvdXREYXRhW2kgKiAyXSA9IHIuZnJlcXVlbmN5O1xuICAgICAgb3V0RGF0YVtpICogMiArIDFdID0gci5wZXJpb2RpY2l0eTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1NpZ25hbChmcmFtZSkge1xuICAgIGNvbnN0IGluRGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcblxuICAgIGNvbnN0IHIgPSB0aGlzLl9tY3JzWzBdLnByb2Nlc3NGcmFtZShpbkRhdGEpO1xuICAgIG91dERhdGFbMF0gPSByLmZyZXF1ZW5jeTtcbiAgICBvdXREYXRhWzFdID0gci5wZXJpb2RpY2l0eTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNZWFuQ3Jvc3NpbmdSYXRlO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuLy89PT09PT09PT09PT09PT0gQmFzZSBjbGFzcyBmb3IgbWVhbiBjcm9zc2luZyByYXRlIGNvbXB1dGF0aW9uID09PT09PT09PT09PT09Ly9cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cbmNvbnN0IG1jckJhc2VEZWZhdWx0cyA9IHtcbiAgbm9pc2VUaHJlc2hvbGQ6IDAuMSxcbiAgLy8gb25seSB1c2VkIHdpdGggaW50ZXJuYWwgY2lyY3VsYXIgYnVmZmVyIChmZWQgc2FtcGxlKHMpIGJ5IHNhbXBsZShzKSksXG4gIC8vIHdoZW4gaW5wdXQgdHlwZSBpcyB2ZWN0b3IgOlxuICBmcmFtZVNpemU6IDUwLFxuICBob3BTaXplOiA1LFxuICBzYW1wbGVSYXRlOiBudWxsLFxufTtcblxuY2xhc3MgTWVhbkNyb3NzaW5nUmF0ZUJhc2Uge1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIG1jckJhc2VEZWZhdWx0cyk7XG5cbiAgICB0aGlzLm1lYW4gPSAwO1xuICAgIHRoaXMubWFnbml0dWRlID0gMDtcbiAgICB0aGlzLnN0ZERldiA9IDA7XG4gICAgdGhpcy5jcm9zc2luZ3MgPSBbXTtcbiAgICB0aGlzLnBlcmlvZE1lYW4gPSAwO1xuICAgIHRoaXMucGVyaW9kU3RkRGV2ID0gMDtcbiAgICB0aGlzLmlucHV0RnJhbWUgPSBbXTtcblxuICAgIHRoaXMuc2V0Q29uZmlnKG9wdGlvbnMpO1xuXG4gICAgLy90aGlzLm1heEZyZXEgPSB0aGlzLmlucHV0UmF0ZSAvIDAuNTtcbiAgfVxuXG4gIHNldENvbmZpZyhjZmcpIHtcbiAgICBpZiAoY2ZnLm5vaXNlVGhyZXNob2xkKSB7XG4gICAgICB0aGlzLm5vaXNlVGhyZXNob2xkID0gY2ZnLm5vaXNlVGhyZXNob2xkO1xuICAgIH1cblxuICAgIGlmIChjZmcuZnJhbWVTaXplKSB7XG4gICAgICB0aGlzLmZyYW1lU2l6ZSA9IGNmZy5mcmFtZVNpemU7XG4gICAgfVxuXG4gICAgaWYgKGNmZy5ob3BTaXplKSB7XG4gICAgICB0aGlzLmhvcFNpemUgPSBjZmcuaG9wU2l6ZTtcbiAgICB9XG5cbiAgICBpZiAoY2ZnLnNhbXBsZVJhdGUpIHtcbiAgICAgIHRoaXMuc2FtcGxlUmF0ZSA9IGNmZy5zYW1wbGVSYXRlO1xuICAgICAgLy8gdGhpcy5tYXhGcmVxID0gdGhpcy5zYW1wbGVSYXRlIC8gMjtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0QnVmZmVyID0gbmV3IEFycmF5KHRoaXMuZnJhbWVTaXplKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZnJhbWVTaXplOyBpKyspIHtcbiAgICAgIHRoaXMuaW5wdXRCdWZmZXJbaV0gPSAwO1xuICAgIH1cblxuICAgIHRoaXMuaG9wQ291bnRlciA9IDA7XG4gICAgdGhpcy5idWZmZXJJbmRleCA9IDA7XG5cbiAgICB0aGlzLnJlc3VsdHMgPSB7IGFtcGxpdHVkZTogMCwgZnJlcXVlbmN5OiAwLCBwZXJpb2RpY2l0eTogMCB9O1xuICB9XG5cbiAgcHJvY2Vzcyh2YWx1ZSkge1xuICAgIC8vIHVwZGF0ZSBpbnRlcm5hbCBjaXJjdWxhciBidWZmZXJcbiAgICAvLyB0aGVuIGNhbGwgcHJvY2Vzc0ZyYW1lKHRoaXMuaW5wdXRCdWZmZXIpIGlmIG5lZWRlZFxuICAgIHRoaXMuaW5wdXRCdWZmZXJbdGhpcy5idWZmZXJJbmRleF0gPSB2YWx1ZTtcbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gKHRoaXMuYnVmZmVySW5kZXggKyAxKSAlIHRoaXMuZnJhbWVTaXplO1xuXG4gICAgaWYgKHRoaXMuaG9wQ291bnRlciA9PT0gdGhpcy5ob3BTaXplIC0gMSkge1xuICAgICAgdGhpcy5ob3BDb3VudGVyID0gMDtcbiAgICAgIHRoaXMucHJvY2Vzc0ZyYW1lKHRoaXMuaW5wdXRCdWZmZXIsIHRoaXMuYnVmZmVySW5kZXgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaG9wQ291bnRlcisrO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJlc3VsdHM7XG4gIH1cblxuICAvLyBjb21wdXRlIG1hZ25pdHVkZSwgemVybyBjcm9zc2luZyByYXRlLCBhbmQgcGVyaW9kaWNpdHlcbiAgcHJvY2Vzc0ZyYW1lKGZyYW1lLCBvZmZzZXQgPSAwKSB7XG4gICAgaWYgKGZyYW1lLmxlbmd0aCA8IDIpIHtcbiAgICAgIHJldHVybiB7IGFtcGxpdHVkZTogMCwgZnJlcXVlbmN5OiAwLCBwZXJpb2RpY2l0eTogMCB9O1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXRGcmFtZSA9IGZyYW1lO1xuXG4gICAgdGhpcy5fbWFpbkFsZ29yaXRobSgpO1xuXG4gICAgLy8gVE9ETzogaW1wcm92ZSB0aGlzICgyLjAgaXMgZW1waXJpY2FsIGZhY3RvciBiZWNhdXNlIHdlIGRvbid0IGtub3cgYSBwcmlvcmkgc2Vuc29yIHJhbmdlKVxuICAgIHRoaXMuYW1wbGl0dWRlID0gdGhpcy5zdGREZXYgKiAyLjA7XG5cbiAgICAvKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxuICAgIC8vIHRoaXMgb25lIGlzIHdvcmtpbmcgd2l0aCBvbmUgZGlyZWN0aW9uIGNyb3NzaW5ncyBkZXRlY3Rpb24gdmVyc2lvblxuICAgIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5jcm9zc2luZ3MubGVuZ3RoIC8gTWF0aC5mbG9vcih0aGlzLmlucHV0RnJhbWUubGVuZ3RoICogMC41KTsgLy8gbm9ybWFsaXplZCBieSBcIm55cXVpc3QgcmF0aW9cIlxuXG4gICAgLy8gdGhpcyBvbmUgaXMgd29ya2luZyB3aXRoIHR3byBkaXJlY3Rpb24gY3Jvc3NpbmdzIGRldGVjdGlvbiB2ZXJzaW9uXG4gICAgLy8gdGhpcy5mcmVxdWVuY3kgPSB0aGlzLmNyb3NzaW5ncy5sZW5ndGggLyAodGhpcy5pbnB1dEZyYW1lLmxlbmd0aCAtIDEpOyAvLyBiZXdhcmUgb2YgZGl2aXNpb24gYnkgemVyb1xuXG4gICAgLy8gaWYgc2FtcGxlUmF0ZSBpcyBzcGVjaWZpZWQsIHRyYW5zbGF0ZSBub3JtYWxpemVkIGZyZXF1ZW5jeSB0byBIZXJ0eiA6XG4gICAgaWYgKHRoaXMuc2FtcGxlUmF0ZSkge1xuICAgICAgdGhpcy5mcmVxdWVuY3kgKj0gTWF0aC5mbG9vcih0aGlzLnNhbXBsZVJhdGUgLyAyKTtcbiAgICB9XG5cbiAgICAvKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxuICAgIGlmICh0aGlzLmNyb3NzaW5ncy5sZW5ndGggPiAyKSB7XG4gICAgICAvLyBwZXJpb2RpY2l0eSBpcyBub3JtYWxpemVkIGJhc2VkIG9uIGlucHV0IGZyYW1lIHNpemUuXG4gICAgICB0aGlzLnBlcmlvZGljaXR5ID0gMS4wIC0gTWF0aC5zcXJ0KHRoaXMucGVyaW9kU3RkRGV2IC8gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGVyaW9kaWNpdHkgPSAwO1xuICAgIH1cblxuICAgIHRoaXMucmVzdWx0cy5hbXBsaXR1ZGUgPSB0aGlzLmFtcGxpdHVkZTtcbiAgICB0aGlzLnJlc3VsdHMuZnJlcXVlbmN5ID0gdGhpcy5mcmVxdWVuY3k7XG4gICAgdGhpcy5yZXN1bHRzLnBlcmlvZGljaXR5ID0gdGhpcy5wZXJpb2RpY2l0eTtcblxuICAgIHJldHVybiB0aGlzLnJlc3VsdHM7XG4gIH1cblxuICBfbWFpbkFsZ29yaXRobSgpIHtcblxuICAgIC8vIGNvbXB1dGUgbWluLCBtYXgsIG1lYW4gYW5kIG1hZ25pdHVkZVxuICAgIC8vIHRoaXMubWVhbiA9IDA7XG4gICAgLy8gdGhpcy5tYWduaXR1ZGUgPSAwO1xuXG4gICAgbGV0IG1pbiwgbWF4O1xuICAgIG1pbiA9IG1heCA9IHRoaXMuaW5wdXRGcmFtZVswXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdmFsID0gdGhpcy5pbnB1dEZyYW1lW2ldO1xuXG4gICAgICAvLyB0aGlzLm1lYW4gKz0gdmFsO1xuICAgICAgLy8gdGhpcy5tYWduaXR1ZGUgKz0gdmFsICogdmFsO1xuXG4gICAgICBpZiAodmFsID4gbWF4KVxuICAgICAgICBtYXggPSB2YWw7XG4gICAgICBlbHNlIGlmICh2YWwgPCBtaW4pXG4gICAgICAgIG1pbiA9IHZhbDtcbiAgICB9XG5cbiAgICAvLyBUT0RPIDogbW9yZSB0ZXN0cyB0byBkZXRlcm1pbmUgd2hpY2ggbWVhbiAodHJ1ZSBtZWFuIG9yIChtYXgtbWluKS8yKSBpcyB0aGUgYmVzdFxuICAgIC8vdGhpcy5tZWFuIC89IHRoaXMuaW5wdXRGcmFtZS5sZW5ndGg7XG4gICAgdGhpcy5tZWFuID0gbWluICsgKG1heCAtIG1pbikgKiAwLjU7XG5cbiAgICAvLyB0aGlzLm1hZ25pdHVkZSAvPSB0aGlzLmlucHV0RnJhbWUubGVuZ3RoO1xuICAgIC8vIHRoaXMubWFnbml0dWRlID0gTWF0aC5zcXJ0KHRoaXMubWFnbml0dWRlKTtcblxuICAgIC8vIGNvbXB1dGUgc2lnbmFsIHN0ZERldiBhbmQgbnVtYmVyIG9mIG1lYW4tY3Jvc3NpbmdzXG4gICAgLy8gdXNpbmcgYXNjZW5kaW5nIEFORCAvIE9SIGRlc2NlbmRpbmcgbWVhbiBjcm9zc2luZyAoc2VlIGNvbW1lbnRzKVxuICAgIHRoaXMuY3Jvc3NpbmdzID0gW107XG4gICAgdGhpcy51cENyb3NzaW5ncyA9IFtdO1xuICAgIHRoaXMuZG93bkNyb3NzaW5ncyA9IFtdO1xuICAgIHRoaXMuc3RkRGV2ID0gMDtcblxuICAgIGxldCBwcmV2RGVsdGEgPSB0aGlzLmlucHV0RnJhbWVbMF0gLSB0aGlzLm1lYW47XG5cbiAgICAvL2ZvciAobGV0IGkgaW4gdGhpcy5pbnB1dEZyYW1lKSB7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLmlucHV0RnJhbWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBkZWx0YSA9IHRoaXMuaW5wdXRGcmFtZVtpXSAtIHRoaXMubWVhbjtcbiAgICAgIHRoaXMuc3RkRGV2ICs9IGRlbHRhICogZGVsdGE7XG5cbiAgICAgIGlmIChwcmV2RGVsdGEgPiB0aGlzLm5vaXNlVGhyZXNob2xkICYmIGRlbHRhIDwgdGhpcy5ub2lzZVRocmVzaG9sZCkgeyAvLyBmYWxsaW5nXG4gICAgICAgIC8vIHRoaXMuY3Jvc3NpbmdzLnB1c2goaSk7XG4gICAgICAgIHRoaXMuZG93bkNyb3NzaW5ncy5wdXNoKGkpO1xuICAgICAgfSBlbHNlIGlmIChwcmV2RGVsdGEgPCB0aGlzLm5vaXNlVGhyZXNob2xkICYmIGRlbHRhID4gdGhpcy5ub2lzZVRocmVzaG9sZCkgeyAvLyByaXNpbmdcbiAgICAgICAgLy8gdGhpcy5jcm9zc2luZ3MucHVzaChpKTtcbiAgICAgICAgdGhpcy51cENyb3NzaW5ncy5wdXNoKGkpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmNyb3NzaW5ncyA9ICh0aGlzLnVwQ3Jvc3NpbmdzLmxlbmd0aCA+IHRoaXMuZG93bkNyb3NzaW5ncy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICA/IHRoaXMudXBDcm9zc2luZ3NcbiAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5kb3duQ3Jvc3NpbmdzO1xuXG4gICAgICBwcmV2RGVsdGEgPSBkZWx0YTtcbiAgICB9XG5cbiAgICB0aGlzLnN0ZERldiA9IE1hdGguc3FydCh0aGlzLnN0ZERldik7XG5cbiAgICAvLyBjb21wdXRlIG1lYW4gb2YgZGVsdGEtVCBiZXR3ZWVuIGNyb3NzaW5nc1xuICAgIHRoaXMucGVyaW9kTWVhbiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLmNyb3NzaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5wZXJpb2RNZWFuICs9IHRoaXMuY3Jvc3NpbmdzW2ldIC0gdGhpcy5jcm9zc2luZ3NbaSAtIDFdO1xuICAgIH1cblxuICAgIC8vIGlmIHdlIGhhdmUgYSBOYU4gaGVyZSB3ZSBkb24ndCBjYXJlIGFzIHdlIHdvbid0IHVzZSB0aGlzLnBlcmlvZE1lYW4gYmVsb3dcbiAgICB0aGlzLnBlcmlvZE1lYW4gLz0gKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAtIDEpO1xuXG4gICAgLy8gY29tcHV0ZSBzdGREZXYgb2YgZGVsdGEtVCBiZXR3ZWVuIGNyb3NzaW5nc1xuICAgIHRoaXMucGVyaW9kU3RkRGV2ID0gMDtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5jcm9zc2luZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBkZWx0YVAgPSAodGhpcy5jcm9zc2luZ3NbaV0gLSB0aGlzLmNyb3NzaW5nc1tpIC0gMV0gLSB0aGlzLnBlcmlvZE1lYW4pXG4gICAgICB0aGlzLnBlcmlvZFN0ZERldiArPSBkZWx0YVAgKiBkZWx0YVA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCA+IDIpIHtcbiAgICAgIHRoaXMucGVyaW9kU3RkRGV2ID0gTWF0aC5zcXJ0KHRoaXMucGVyaW9kU3RkRGV2IC8gKHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAtIDIpKTtcbiAgICB9XG4gIH1cbn07XG4iXX0=
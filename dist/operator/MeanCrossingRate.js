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
   * @memberof operator
   * @deprecated
   *
   * @warning: This operator is considered as unstable and will be modified.
   *  particularly the module will probably be modified to handle only `signal`
   *  inputs. Leveraging the handling of vector frames to the end-user by making
   *  use of `lfo.operator.Select` and `lfo.operator.Slicer`
   *
   *
   * @param {Object} [options] - Override default options.
   * @param {Number} [options.noiseThreshold=0.1] - Threshold added to the mean to
   *  avoid confusion between noise and real signal.
   * @param {Number} [options.frameSize=512] - Size of the internal sliding window.
   *  Will be ignored if input is signal.
   * @param {Number} [options.hopSize=null] - Number of samples between two
   *  computations on the internal sliding window. Will be ignored is input
   *  is signal.
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm5vaXNlVGhyZXNob2xkIiwidHlwZSIsImRlZmF1bHQiLCJmcmFtZVNpemUiLCJtZXRhcyIsImtpbmQiLCJob3BTaXplIiwibnVsbGFibGUiLCJNZWFuQ3Jvc3NpbmdSYXRlIiwib3B0aW9ucyIsIl9tY3JzIiwibmFtZSIsInZhbHVlIiwicGFyYW1zIiwic2V0Iiwic3RyZWFtUGFyYW1zIiwiZnJhbWVUeXBlIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJnZXQiLCJzYW1wbGVSYXRlIiwic291cmNlU2FtcGxlUmF0ZSIsInBhcmFtc0Rlc2NyaXB0aW9uIiwiaW5wdXREaW1lbnNpb24iLCJkZXNjcmlwdGlvbiIsImkiLCJjb25jYXQiLCJwdXNoIiwiTWVhbkNyb3NzaW5nUmF0ZUJhc2UiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwibGVuZ3RoIiwiciIsInByb2Nlc3MiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsInByb2Nlc3NGcmFtZSIsIm1jckJhc2VEZWZhdWx0cyIsIm1lYW4iLCJtYWduaXR1ZGUiLCJzdGREZXYiLCJjcm9zc2luZ3MiLCJwZXJpb2RNZWFuIiwicGVyaW9kU3RkRGV2IiwiaW5wdXRGcmFtZSIsInNldENvbmZpZyIsImNmZyIsImlucHV0QnVmZmVyIiwiQXJyYXkiLCJob3BDb3VudGVyIiwiYnVmZmVySW5kZXgiLCJyZXN1bHRzIiwiYW1wbGl0dWRlIiwib2Zmc2V0IiwiX21haW5BbGdvcml0aG0iLCJNYXRoIiwiZmxvb3IiLCJzcXJ0IiwibWluIiwibWF4IiwidmFsIiwidXBDcm9zc2luZ3MiLCJkb3duQ3Jvc3NpbmdzIiwicHJldkRlbHRhIiwiZGVsdGEiLCJkZWx0YVAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FB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QUEzQyxFQUFnRDtBQUM5QyxZQUFJMkMsU0FBVSxLQUFLeEIsU0FBTCxDQUFlbkIsR0FBZixJQUFvQixLQUFLbUIsU0FBTCxDQUFlbkIsTUFBSSxDQUFuQixDQUFwQixHQUE0QyxLQUFLb0IsVUFBL0Q7QUFDQSxhQUFLQyxZQUFMLElBQXFCc0IsU0FBU0EsTUFBOUI7QUFDRDs7QUFFRCxVQUFJLEtBQUt4QixTQUFMLENBQWVWLE1BQWYsR0FBd0IsQ0FBNUIsRUFBK0I7QUFDN0IsYUFBS1ksWUFBTCxHQUFvQlksS0FBS0UsSUFBTCxDQUFVLEtBQUtkLFlBQUwsSUFBcUIsS0FBS0YsU0FBTCxDQUFlVixNQUFmLEdBQXdCLENBQTdDLENBQVYsQ0FBcEI7QUFDRDtBQUNGOzs7OztBQUNGIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBub2lzZVRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4xLFxuICB9LFxuICBmcmFtZVNpemU6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogNTEyLFxuICAgIG1ldGFzOiB7IGtpbmQ6ICdzdGF0aWMnIH0sXG4gIH0sXG4gIGhvcFNpemU6IHsgLy8gc2hvdWxkIGJlIG51bGxhYmxlXG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgbnVsbGFibGU6IHRydWUsXG4gICAgbWV0YXM6IHsga2luZDogJ3N0YXRpYycgfSxcbiAgfSxcbiAgLy8gY2VudGVyZWRUaW1lVGFnczoge1xuICAvLyAgIHR5cGU6ICdib29sZWFuJyxcbiAgLy8gICBkZWZhdWx0OiBmYWxzZSxcbiAgLy8gfVxufVxuXG4vKipcbiAqIE1lYW4gQ3Jvc3NpbmcgUmF0ZSBvcGVyYXRvciA6IGVzdGltYXRlcyB0aGUgZnJlcXVlbmN5IGFuZCBwZXJpb2RpY2l0eSBvZlxuICogYSAobi1kaW1lbnNpb24pIHNpZ25hbCwgZWl0aGVyIG9uIGFuIGlucHV0IHN0cmVhbSBvZiBzaWduYWwgZnJhbWVzLCBvciBieVxuICogdXNpbmcgaXRzIG93biBzbGlkaW5nIHdpbmRvdyBvbiBhbiBpbnB1dCBzdHJlYW0gb2YgdmVjdG9ycy5cbiAqXG4gKiBUaGUgbWVhbiBpcyBlc3RpbWF0ZWQgb24gZWFjaCBuZXcgYW5hbHl6ZWQgd2luZG93IHVzaW5nIHRoZSBmb2xsb3dpbmcgZXF1YXRpb24gOlxuICogYG1lYW4gPSBtaW4gKyAobWF4IC0gbWluKSAqIDAuNTtgXG4gKlxuICogb3V0cHV0OiBhbiBhcnJheSBvZiBzaXplIGAyICogaW5wdXREaW1lbnNpb25gXG4gKiAoYFsgZnJlcXVlbmN5MSwgcGVyaW9kaWNpdHkxLCAuLi4gZnJlcXVlbmN5TiwgcGVyaW9kaWNpdHlOIF1gKVxuICpcbiAqIEBtZW1iZXJvZiBvcGVyYXRvclxuICogQGRlcHJlY2F0ZWRcbiAqXG4gKiBAd2FybmluZzogVGhpcyBvcGVyYXRvciBpcyBjb25zaWRlcmVkIGFzIHVuc3RhYmxlIGFuZCB3aWxsIGJlIG1vZGlmaWVkLlxuICogIHBhcnRpY3VsYXJseSB0aGUgbW9kdWxlIHdpbGwgcHJvYmFibHkgYmUgbW9kaWZpZWQgdG8gaGFuZGxlIG9ubHkgYHNpZ25hbGBcbiAqICBpbnB1dHMuIExldmVyYWdpbmcgdGhlIGhhbmRsaW5nIG9mIHZlY3RvciBmcmFtZXMgdG8gdGhlIGVuZC11c2VyIGJ5IG1ha2luZ1xuICogIHVzZSBvZiBgbGZvLm9wZXJhdG9yLlNlbGVjdGAgYW5kIGBsZm8ub3BlcmF0b3IuU2xpY2VyYFxuICpcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLm5vaXNlVGhyZXNob2xkPTAuMV0gLSBUaHJlc2hvbGQgYWRkZWQgdG8gdGhlIG1lYW4gdG9cbiAqICBhdm9pZCBjb25mdXNpb24gYmV0d2VlbiBub2lzZSBhbmQgcmVhbCBzaWduYWwuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZnJhbWVTaXplPTUxMl0gLSBTaXplIG9mIHRoZSBpbnRlcm5hbCBzbGlkaW5nIHdpbmRvdy5cbiAqICBXaWxsIGJlIGlnbm9yZWQgaWYgaW5wdXQgaXMgc2lnbmFsLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmhvcFNpemU9bnVsbF0gLSBOdW1iZXIgb2Ygc2FtcGxlcyBiZXR3ZWVuIHR3b1xuICogIGNvbXB1dGF0aW9ucyBvbiB0aGUgaW50ZXJuYWwgc2xpZGluZyB3aW5kb3cuIFdpbGwgYmUgaWdub3JlZCBpcyBpbnB1dFxuICogIGlzIHNpZ25hbC5cbiAqL1xuXG4vLyBXZSBkb24ndCB1c2UgY2VudGVyZWQgdGltZSB0YWdzIGZvciBzaWduYWwgaW5wdXQsIGFzIHdlIGRvbid0IGtub3cgaWYgaXQnc1xuLy8gYWxyZWFkeSBiZWVuIGRvbmUgYnkgYSBwcmV2aW91cyBzbGljZXIuXG4vLyBTbyB3ZSBkb24ndCBpbXBsZW1lbnQgaXQgZm9yIG5vdy5cbi8vIHdvdWxkIGJlIDpcbi8vIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuY2VudGVyZWRUaW1lVGFncz1mYWxzZV0gLSBNb3ZlIHRoZSB0aW1lIHRhZyB0byB0aGVcbi8vIG1pZGRsZSBvZiB0aGUgZnJhbWUuXG5cbmNsYXNzIE1lYW5Dcm9zc2luZ1JhdGUgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9tY3JzID0gW107XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgb25QYXJhbVVwZGF0ZShuYW1lLCB2YWx1ZSwgbWV0YXMpIHtcbiAgICBpZiAoIXRoaXMucGFyYW1zLmhvcFNpemUpXG4gICAgICB0aGlzLnBhcmFtcy5zZXQoJ2hvcFNpemUnLCBmcmFtZVNpemUpO1xuXG4gICAgaWYgKHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lVHlwZSA9PT0gJ3NpZ25hbCcpXG4gICAgICB0aGlzLnBhcmFtcy5zZXQoJ2ZyYW1lU2l6ZScsIHRoaXMucHJldlN0cmVhbVBhcmFtcy5mcmFtZVNpemUpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgLy8gVE9ETyA6IHNldCBvdXRwdXQgc2FtcGxlcmF0ZSBhY2NvcmRpbmcgdG8gaW5wdXQgc2FtcGxlcmF0ZSArIGhvcFNpemUgKD8pXG4gICAgdGhpcy5fbWNycyA9IFtdO1xuXG4gICAgY29uc3Qgbm9pc2VUaHJlc2hvbGQgPSB0aGlzLnBhcmFtcy5nZXQoJ25vaXNlVGhyZXNob2xkJyk7XG4gICAgY29uc3QgZnJhbWVTaXplID0gKHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lVHlwZSA9PT0gJ3ZlY3RvcicpXG4gICAgICAgICAgICAgICAgICAgID8gdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVNpemUnKVxuICAgICAgICAgICAgICAgICAgICA6IHByZXZTdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuICAgIGNvbnN0IGhvcFNpemUgPSB0aGlzLnBhcmFtcy5nZXQoJ2hvcFNpemUnKTsgLy8gaWYgaW5wdXQgaXMgc2lnbmFsIHdlIGRvbid0IGNhcmUgYW55d2F5XG4gICAgY29uc3Qgc2FtcGxlUmF0ZSA9IHByZXZTdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlUmF0ZTtcblxuICAgIGNvbnN0IHBhcmFtc0Rlc2NyaXB0aW9uID0gWyAnZnJlcXVlbmN5JywgJ3BlcmlvZGljaXR5JyBdO1xuXG4gICAgbGV0IGlucHV0RGltZW5zaW9uID0gMTtcblxuICAgIGlmICh0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVR5cGUgPT09ICd2ZWN0b3InKSB7XG4gICAgICBpbnB1dERpbWVuc2lvbiA9IHByZXZTdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVUeXBlID09PSAnc2lnbmFsJykge1xuICAgICAgLy8gaWYgaW5wdXQgZnJhbWVzIGFyZSBvZiB0eXBlIFwic2lnbmFsXCIsIGlucHV0IGRpbWVuc2lvbiBpcyAxXG4gICAgICBpbnB1dERpbWVuc2lvbiA9IDE7XG4gICAgfVxuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gMiAqIGlucHV0RGltZW5zaW9uO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0RGltZW5zaW9uOyBpKyspIHtcbiAgICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uLmNvbmNhdChwYXJhbXNEZXNjcmlwdGlvbik7XG5cbiAgICAgIHRoaXMuX21jcnMucHVzaChuZXcgTWVhbkNyb3NzaW5nUmF0ZUJhc2Uoe1xuICAgICAgICBub2lzZVRocmVzaG9sZDogbm9pc2VUaHJlc2hvbGQsXG4gICAgICAgIGZyYW1lU2l6ZTogZnJhbWVTaXplLFxuICAgICAgICBob3BTaXplOiBob3BTaXplLFxuICAgICAgICBzYW1wbGVSYXRlOiBzYW1wbGVSYXRlLFxuICAgICAgfSkpO1xuICAgIH1cblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IGluRGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fbWNycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgciA9IHRoaXMuX21jcnNbaV0ucHJvY2VzcyhpbkRhdGFbaV0pO1xuICAgICAgb3V0RGF0YVtpICogMl0gPSByLmZyZXF1ZW5jeTtcbiAgICAgIG91dERhdGFbaSAqIDIgKyAxXSA9IHIucGVyaW9kaWNpdHk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTaWduYWwoZnJhbWUpIHtcbiAgICBjb25zdCBpbkRhdGEgPSBmcmFtZS5kYXRhO1xuICAgIGNvbnN0IG91dERhdGEgPSB0aGlzLmZyYW1lLmRhdGE7XG5cbiAgICBjb25zdCByID0gdGhpcy5fbWNyc1swXS5wcm9jZXNzRnJhbWUoaW5EYXRhKTtcbiAgICBvdXREYXRhWzBdID0gci5mcmVxdWVuY3k7XG4gICAgb3V0RGF0YVsxXSA9IHIucGVyaW9kaWNpdHk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTWVhbkNyb3NzaW5nUmF0ZTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cbi8vPT09PT09PT09PT09PT09IEJhc2UgY2xhc3MgZm9yIG1lYW4gY3Jvc3NpbmcgcmF0ZSBjb21wdXRhdGlvbiA9PT09PT09PT09PT09PS8vXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5jb25zdCBtY3JCYXNlRGVmYXVsdHMgPSB7XG4gIG5vaXNlVGhyZXNob2xkOiAwLjEsXG4gIC8vIG9ubHkgdXNlZCB3aXRoIGludGVybmFsIGNpcmN1bGFyIGJ1ZmZlciAoZmVkIHNhbXBsZShzKSBieSBzYW1wbGUocykpLFxuICAvLyB3aGVuIGlucHV0IHR5cGUgaXMgdmVjdG9yIDpcbiAgZnJhbWVTaXplOiA1MCxcbiAgaG9wU2l6ZTogNSxcbiAgc2FtcGxlUmF0ZTogbnVsbCxcbn07XG5cbmNsYXNzIE1lYW5Dcm9zc2luZ1JhdGVCYXNlIHtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCBtY3JCYXNlRGVmYXVsdHMpO1xuXG4gICAgdGhpcy5tZWFuID0gMDtcbiAgICB0aGlzLm1hZ25pdHVkZSA9IDA7XG4gICAgdGhpcy5zdGREZXYgPSAwO1xuICAgIHRoaXMuY3Jvc3NpbmdzID0gW107XG4gICAgdGhpcy5wZXJpb2RNZWFuID0gMDtcbiAgICB0aGlzLnBlcmlvZFN0ZERldiA9IDA7XG4gICAgdGhpcy5pbnB1dEZyYW1lID0gW107XG5cbiAgICB0aGlzLnNldENvbmZpZyhvcHRpb25zKTtcblxuICAgIC8vdGhpcy5tYXhGcmVxID0gdGhpcy5pbnB1dFJhdGUgLyAwLjU7XG4gIH1cblxuICBzZXRDb25maWcoY2ZnKSB7XG4gICAgaWYgKGNmZy5ub2lzZVRocmVzaG9sZCkge1xuICAgICAgdGhpcy5ub2lzZVRocmVzaG9sZCA9IGNmZy5ub2lzZVRocmVzaG9sZDtcbiAgICB9XG5cbiAgICBpZiAoY2ZnLmZyYW1lU2l6ZSkge1xuICAgICAgdGhpcy5mcmFtZVNpemUgPSBjZmcuZnJhbWVTaXplO1xuICAgIH1cblxuICAgIGlmIChjZmcuaG9wU2l6ZSkge1xuICAgICAgdGhpcy5ob3BTaXplID0gY2ZnLmhvcFNpemU7XG4gICAgfVxuXG4gICAgaWYgKGNmZy5zYW1wbGVSYXRlKSB7XG4gICAgICB0aGlzLnNhbXBsZVJhdGUgPSBjZmcuc2FtcGxlUmF0ZTtcbiAgICAgIC8vIHRoaXMubWF4RnJlcSA9IHRoaXMuc2FtcGxlUmF0ZSAvIDI7XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEJ1ZmZlciA9IG5ldyBBcnJheSh0aGlzLmZyYW1lU2l6ZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZyYW1lU2l6ZTsgaSsrKSB7XG4gICAgICB0aGlzLmlucHV0QnVmZmVyW2ldID0gMDtcbiAgICB9XG5cbiAgICB0aGlzLmhvcENvdW50ZXIgPSAwO1xuICAgIHRoaXMuYnVmZmVySW5kZXggPSAwO1xuXG4gICAgdGhpcy5yZXN1bHRzID0geyBhbXBsaXR1ZGU6IDAsIGZyZXF1ZW5jeTogMCwgcGVyaW9kaWNpdHk6IDAgfTtcbiAgfVxuXG4gIHByb2Nlc3ModmFsdWUpIHtcbiAgICAvLyB1cGRhdGUgaW50ZXJuYWwgY2lyY3VsYXIgYnVmZmVyXG4gICAgLy8gdGhlbiBjYWxsIHByb2Nlc3NGcmFtZSh0aGlzLmlucHV0QnVmZmVyKSBpZiBuZWVkZWRcbiAgICB0aGlzLmlucHV0QnVmZmVyW3RoaXMuYnVmZmVySW5kZXhdID0gdmFsdWU7XG4gICAgdGhpcy5idWZmZXJJbmRleCA9ICh0aGlzLmJ1ZmZlckluZGV4ICsgMSkgJSB0aGlzLmZyYW1lU2l6ZTtcblxuICAgIGlmICh0aGlzLmhvcENvdW50ZXIgPT09IHRoaXMuaG9wU2l6ZSAtIDEpIHtcbiAgICAgIHRoaXMuaG9wQ291bnRlciA9IDA7XG4gICAgICB0aGlzLnByb2Nlc3NGcmFtZSh0aGlzLmlucHV0QnVmZmVyLCB0aGlzLmJ1ZmZlckluZGV4KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhvcENvdW50ZXIrKztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZXN1bHRzO1xuICB9XG5cbiAgLy8gY29tcHV0ZSBtYWduaXR1ZGUsIHplcm8gY3Jvc3NpbmcgcmF0ZSwgYW5kIHBlcmlvZGljaXR5XG4gIHByb2Nlc3NGcmFtZShmcmFtZSwgb2Zmc2V0ID0gMCkge1xuICAgIGlmIChmcmFtZS5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm4geyBhbXBsaXR1ZGU6IDAsIGZyZXF1ZW5jeTogMCwgcGVyaW9kaWNpdHk6IDAgfTtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0RnJhbWUgPSBmcmFtZTtcblxuICAgIHRoaXMuX21haW5BbGdvcml0aG0oKTtcblxuICAgIC8vIFRPRE86IGltcHJvdmUgdGhpcyAoMi4wIGlzIGVtcGlyaWNhbCBmYWN0b3IgYmVjYXVzZSB3ZSBkb24ndCBrbm93IGEgcHJpb3JpIHNlbnNvciByYW5nZSlcbiAgICB0aGlzLmFtcGxpdHVkZSA9IHRoaXMuc3RkRGV2ICogMi4wO1xuXG4gICAgLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5cbiAgICAvLyB0aGlzIG9uZSBpcyB3b3JraW5nIHdpdGggb25lIGRpcmVjdGlvbiBjcm9zc2luZ3MgZGV0ZWN0aW9uIHZlcnNpb25cbiAgICB0aGlzLmZyZXF1ZW5jeSA9IHRoaXMuY3Jvc3NpbmdzLmxlbmd0aCAvIE1hdGguZmxvb3IodGhpcy5pbnB1dEZyYW1lLmxlbmd0aCAqIDAuNSk7IC8vIG5vcm1hbGl6ZWQgYnkgXCJueXF1aXN0IHJhdGlvXCJcblxuICAgIC8vIHRoaXMgb25lIGlzIHdvcmtpbmcgd2l0aCB0d28gZGlyZWN0aW9uIGNyb3NzaW5ncyBkZXRlY3Rpb24gdmVyc2lvblxuICAgIC8vIHRoaXMuZnJlcXVlbmN5ID0gdGhpcy5jcm9zc2luZ3MubGVuZ3RoIC8gKHRoaXMuaW5wdXRGcmFtZS5sZW5ndGggLSAxKTsgLy8gYmV3YXJlIG9mIGRpdmlzaW9uIGJ5IHplcm9cblxuICAgIC8vIGlmIHNhbXBsZVJhdGUgaXMgc3BlY2lmaWVkLCB0cmFuc2xhdGUgbm9ybWFsaXplZCBmcmVxdWVuY3kgdG8gSGVydHogOlxuICAgIGlmICh0aGlzLnNhbXBsZVJhdGUpIHtcbiAgICAgIHRoaXMuZnJlcXVlbmN5ICo9IE1hdGguZmxvb3IodGhpcy5zYW1wbGVSYXRlIC8gMik7XG4gICAgfVxuXG4gICAgLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5cbiAgICBpZiAodGhpcy5jcm9zc2luZ3MubGVuZ3RoID4gMikge1xuICAgICAgLy8gcGVyaW9kaWNpdHkgaXMgbm9ybWFsaXplZCBiYXNlZCBvbiBpbnB1dCBmcmFtZSBzaXplLlxuICAgICAgdGhpcy5wZXJpb2RpY2l0eSA9IDEuMCAtIE1hdGguc3FydCh0aGlzLnBlcmlvZFN0ZERldiAvIHRoaXMuaW5wdXRGcmFtZS5sZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBlcmlvZGljaXR5ID0gMDtcbiAgICB9XG5cbiAgICB0aGlzLnJlc3VsdHMuYW1wbGl0dWRlID0gdGhpcy5hbXBsaXR1ZGU7XG4gICAgdGhpcy5yZXN1bHRzLmZyZXF1ZW5jeSA9IHRoaXMuZnJlcXVlbmN5O1xuICAgIHRoaXMucmVzdWx0cy5wZXJpb2RpY2l0eSA9IHRoaXMucGVyaW9kaWNpdHk7XG5cbiAgICByZXR1cm4gdGhpcy5yZXN1bHRzO1xuICB9XG5cbiAgX21haW5BbGdvcml0aG0oKSB7XG5cbiAgICAvLyBjb21wdXRlIG1pbiwgbWF4LCBtZWFuIGFuZCBtYWduaXR1ZGVcbiAgICAvLyB0aGlzLm1lYW4gPSAwO1xuICAgIC8vIHRoaXMubWFnbml0dWRlID0gMDtcblxuICAgIGxldCBtaW4sIG1heDtcbiAgICBtaW4gPSBtYXggPSB0aGlzLmlucHV0RnJhbWVbMF07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaW5wdXRGcmFtZS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHZhbCA9IHRoaXMuaW5wdXRGcmFtZVtpXTtcblxuICAgICAgLy8gdGhpcy5tZWFuICs9IHZhbDtcbiAgICAgIC8vIHRoaXMubWFnbml0dWRlICs9IHZhbCAqIHZhbDtcblxuICAgICAgaWYgKHZhbCA+IG1heClcbiAgICAgICAgbWF4ID0gdmFsO1xuICAgICAgZWxzZSBpZiAodmFsIDwgbWluKVxuICAgICAgICBtaW4gPSB2YWw7XG4gICAgfVxuXG4gICAgLy8gVE9ETyA6IG1vcmUgdGVzdHMgdG8gZGV0ZXJtaW5lIHdoaWNoIG1lYW4gKHRydWUgbWVhbiBvciAobWF4LW1pbikvMikgaXMgdGhlIGJlc3RcbiAgICAvL3RoaXMubWVhbiAvPSB0aGlzLmlucHV0RnJhbWUubGVuZ3RoO1xuICAgIHRoaXMubWVhbiA9IG1pbiArIChtYXggLSBtaW4pICogMC41O1xuXG4gICAgLy8gdGhpcy5tYWduaXR1ZGUgLz0gdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDtcbiAgICAvLyB0aGlzLm1hZ25pdHVkZSA9IE1hdGguc3FydCh0aGlzLm1hZ25pdHVkZSk7XG5cbiAgICAvLyBjb21wdXRlIHNpZ25hbCBzdGREZXYgYW5kIG51bWJlciBvZiBtZWFuLWNyb3NzaW5nc1xuICAgIC8vIHVzaW5nIGFzY2VuZGluZyBBTkQgLyBPUiBkZXNjZW5kaW5nIG1lYW4gY3Jvc3NpbmcgKHNlZSBjb21tZW50cylcbiAgICB0aGlzLmNyb3NzaW5ncyA9IFtdO1xuICAgIHRoaXMudXBDcm9zc2luZ3MgPSBbXTtcbiAgICB0aGlzLmRvd25Dcm9zc2luZ3MgPSBbXTtcbiAgICB0aGlzLnN0ZERldiA9IDA7XG5cbiAgICBsZXQgcHJldkRlbHRhID0gdGhpcy5pbnB1dEZyYW1lWzBdIC0gdGhpcy5tZWFuO1xuXG4gICAgLy9mb3IgKGxldCBpIGluIHRoaXMuaW5wdXRGcmFtZSkge1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5pbnB1dEZyYW1lLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGVsdGEgPSB0aGlzLmlucHV0RnJhbWVbaV0gLSB0aGlzLm1lYW47XG4gICAgICB0aGlzLnN0ZERldiArPSBkZWx0YSAqIGRlbHRhO1xuXG4gICAgICBpZiAocHJldkRlbHRhID4gdGhpcy5ub2lzZVRocmVzaG9sZCAmJiBkZWx0YSA8IHRoaXMubm9pc2VUaHJlc2hvbGQpIHsgLy8gZmFsbGluZ1xuICAgICAgICAvLyB0aGlzLmNyb3NzaW5ncy5wdXNoKGkpO1xuICAgICAgICB0aGlzLmRvd25Dcm9zc2luZ3MucHVzaChpKTtcbiAgICAgIH0gZWxzZSBpZiAocHJldkRlbHRhIDwgdGhpcy5ub2lzZVRocmVzaG9sZCAmJiBkZWx0YSA+IHRoaXMubm9pc2VUaHJlc2hvbGQpIHsgLy8gcmlzaW5nXG4gICAgICAgIC8vIHRoaXMuY3Jvc3NpbmdzLnB1c2goaSk7XG4gICAgICAgIHRoaXMudXBDcm9zc2luZ3MucHVzaChpKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jcm9zc2luZ3MgPSAodGhpcy51cENyb3NzaW5ncy5sZW5ndGggPiB0aGlzLmRvd25Dcm9zc2luZ3MubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLnVwQ3Jvc3NpbmdzXG4gICAgICAgICAgICAgICAgICAgICA6IHRoaXMuZG93bkNyb3NzaW5ncztcblxuICAgICAgcHJldkRlbHRhID0gZGVsdGE7XG4gICAgfVxuXG4gICAgdGhpcy5zdGREZXYgPSBNYXRoLnNxcnQodGhpcy5zdGREZXYpO1xuXG4gICAgLy8gY29tcHV0ZSBtZWFuIG9mIGRlbHRhLVQgYmV0d2VlbiBjcm9zc2luZ3NcbiAgICB0aGlzLnBlcmlvZE1lYW4gPSAwO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5jcm9zc2luZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucGVyaW9kTWVhbiArPSB0aGlzLmNyb3NzaW5nc1tpXSAtIHRoaXMuY3Jvc3NpbmdzW2kgLSAxXTtcbiAgICB9XG5cbiAgICAvLyBpZiB3ZSBoYXZlIGEgTmFOIGhlcmUgd2UgZG9uJ3QgY2FyZSBhcyB3ZSB3b24ndCB1c2UgdGhpcy5wZXJpb2RNZWFuIGJlbG93XG4gICAgdGhpcy5wZXJpb2RNZWFuIC89ICh0aGlzLmNyb3NzaW5ncy5sZW5ndGggLSAxKTtcblxuICAgIC8vIGNvbXB1dGUgc3RkRGV2IG9mIGRlbHRhLVQgYmV0d2VlbiBjcm9zc2luZ3NcbiAgICB0aGlzLnBlcmlvZFN0ZERldiA9IDA7XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuY3Jvc3NpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGVsdGFQID0gKHRoaXMuY3Jvc3NpbmdzW2ldIC0gdGhpcy5jcm9zc2luZ3NbaSAtIDFdIC0gdGhpcy5wZXJpb2RNZWFuKVxuICAgICAgdGhpcy5wZXJpb2RTdGREZXYgKz0gZGVsdGFQICogZGVsdGFQO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNyb3NzaW5ncy5sZW5ndGggPiAyKSB7XG4gICAgICB0aGlzLnBlcmlvZFN0ZERldiA9IE1hdGguc3FydCh0aGlzLnBlcmlvZFN0ZERldiAvICh0aGlzLmNyb3NzaW5ncy5sZW5ndGggLSAyKSk7XG4gICAgfVxuICB9XG59O1xuIl19
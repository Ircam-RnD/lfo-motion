'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _common = require('waves-lfo/common');

var lfo = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BaseLfo = lfo.core.BaseLfo;
var Delta = lfo.operator.Delta;

var definitions = {
  feedback: {
    type: 'float',
    default: 0.7,
    min: 0,
    max: 1
  },
  gain: {
    type: 'float',
    default: 0.07,
    min: 0
  }
};

var inverseGravity = 1 / 9.81;
var abs = Math.abs;
var min = Math.min;
var max = Math.max;
var pow = Math.pow;

/**
 * Compute the intensity of the accelerometers.
 *
 * output: [normIntensity, xIntensity, yIntensity, zIntensity]
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.feedback=0.7] - Feedback coefficient.
 * @param {Number} [options.gain=0.07] - Post gain coefficient.
 */

var Intensity = function (_BaseLfo) {
  (0, _inherits3.default)(Intensity, _BaseLfo);

  function Intensity() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Intensity);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Intensity.__proto__ || (0, _getPrototypeOf2.default)(Intensity)).call(this, definitions, options));

    _this.memory = null;
    _this.normAcc = null;
    _this.delta = new Delta({ size: 3, useFrameRate: 1 });
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(Intensity, [{
    key: 'processStreamParams',
    value: function processStreamParams() {
      var prevStreamParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.prepareStreamParams(prevStreamParams);

      this.streamParams.frameSize = 4;
      this.streamParams.description = ['norm', 'x', 'y', 'z'];

      this.delta.processStreamParams({
        frameSize: 3,
        frameRate: this.streamParams.frameRate
      });

      this.memory = new Float32Array(3);
      this.normAcc = new Float32Array(3);

      this.propagateStreamParams();
    }
  }, {
    key: 'resetStream',
    value: function resetStream() {
      (0, _get3.default)(Intensity.prototype.__proto__ || (0, _getPrototypeOf2.default)(Intensity.prototype), 'resetStream', this).call(this);

      this.delta.resetStream();

      for (var i = 0; i < 3; i++) {
        this.memory[i] = 0;
      }
    }
  }, {
    key: 'inputVector',
    value: function inputVector(data) {
      var outData = this.frame.data;
      var buffer = this.buffer;
      var memory = this.memory;
      var normAcc = this.normAcc;
      var feedback = this.params.get('feedback');
      var gain = this.params.get('gain');
      var norm = 0;

      // normalize accelerometers
      for (var i = 0; i < this.streamParams.frameSize; i++) {
        normAcc[i] = (data[i] || 0) * inverseGravity;
      }var deltas = this.delta.inputVector(normAcc);

      for (var _i = 0; _i < 3; _i++) {
        var value = abs(deltas[_i]);
        value = value + feedback * memory[_i];

        // store value for next pass
        memory[_i] = value;

        value = value * gain;
        value = value * value;

        norm += value;
        outData[_i + 1] = value;
      }

      outData[0] = norm;

      return outData;
    }
  }, {
    key: 'processVector',
    value: function processVector(frame) {
      this.frame.data = this.inputVector(frame.data);
    }
  }]);
  return Intensity;
}(BaseLfo);

exports.default = Intensity;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQmFzZUxmbyIsImNvcmUiLCJEZWx0YSIsIm9wZXJhdG9yIiwiZGVmaW5pdGlvbnMiLCJmZWVkYmFjayIsInR5cGUiLCJkZWZhdWx0IiwibWluIiwibWF4IiwiZ2FpbiIsImludmVyc2VHcmF2aXR5IiwiYWJzIiwiTWF0aCIsInBvdyIsIkludGVuc2l0eSIsIm9wdGlvbnMiLCJtZW1vcnkiLCJub3JtQWNjIiwiZGVsdGEiLCJzaXplIiwidXNlRnJhbWVSYXRlIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVNpemUiLCJkZXNjcmlwdGlvbiIsInByb2Nlc3NTdHJlYW1QYXJhbXMiLCJmcmFtZVJhdGUiLCJGbG9hdDMyQXJyYXkiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJyZXNldFN0cmVhbSIsImkiLCJkYXRhIiwib3V0RGF0YSIsImZyYW1lIiwiYnVmZmVyIiwicGFyYW1zIiwiZ2V0Iiwibm9ybSIsImRlbHRhcyIsImlucHV0VmVjdG9yIiwidmFsdWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOzs7Ozs7QUFFWixJQUFNQyxVQUFVRCxJQUFJRSxJQUFKLENBQVNELE9BQXpCO0FBQ0EsSUFBTUUsUUFBUUgsSUFBSUksUUFBSixDQUFhRCxLQUEzQjs7QUFFQSxJQUFNRSxjQUFjO0FBQ2xCQyxZQUFVO0FBQ1JDLFVBQU0sT0FERTtBQUVSQyxhQUFTLEdBRkQ7QUFHUkMsU0FBSyxDQUhHO0FBSVJDLFNBQUs7QUFKRyxHQURRO0FBT2xCQyxRQUFNO0FBQ0pKLFVBQU0sT0FERjtBQUVKQyxhQUFTLElBRkw7QUFHSkMsU0FBSztBQUhEO0FBUFksQ0FBcEI7O0FBY0EsSUFBTUcsaUJBQWlCLElBQUksSUFBM0I7QUFDQSxJQUFNQyxNQUFNQyxLQUFLRCxHQUFqQjtBQUNBLElBQU1K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Q0FBaUJOLE1BQU1GLElBQXZCLENBQWxCO0FBQ0Q7OztFQTdFcUJqQyxPOztrQkFnRlRlLFMiLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8vY29tbW9uJztcblxuY29uc3QgQmFzZUxmbyA9IGxmby5jb3JlLkJhc2VMZm87XG5jb25zdCBEZWx0YSA9IGxmby5vcGVyYXRvci5EZWx0YTtcblxuY29uc3QgZGVmaW5pdGlvbnMgPSB7XG4gIGZlZWRiYWNrOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBkZWZhdWx0OiAwLjcsXG4gICAgbWluOiAwLFxuICAgIG1heDogMSxcbiAgfSxcbiAgZ2Fpbjoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4wNyxcbiAgICBtaW46IDAsXG4gIH0sXG59O1xuXG5jb25zdCBpbnZlcnNlR3Jhdml0eSA9IDEgLyA5LjgxO1xuY29uc3QgYWJzID0gTWF0aC5hYnM7XG5jb25zdCBtaW4gPSBNYXRoLm1pbjtcbmNvbnN0IG1heCA9IE1hdGgubWF4O1xuY29uc3QgcG93ID0gTWF0aC5wb3c7XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgaW50ZW5zaXR5IG9mIHRoZSBhY2NlbGVyb21ldGVycy5cbiAqXG4gKiBvdXRwdXQ6IFtub3JtSW50ZW5zaXR5LCB4SW50ZW5zaXR5LCB5SW50ZW5zaXR5LCB6SW50ZW5zaXR5XVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZmVlZGJhY2s9MC43XSAtIEZlZWRiYWNrIGNvZWZmaWNpZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmdhaW49MC4wN10gLSBQb3N0IGdhaW4gY29lZmZpY2llbnQuXG4gKi9cbmNsYXNzIEludGVuc2l0eSBleHRlbmRzIEJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihkZWZpbml0aW9ucywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLm1lbW9yeSA9IG51bGw7XG4gICAgdGhpcy5ub3JtQWNjID0gbnVsbDtcbiAgICB0aGlzLmRlbHRhID0gbmV3IERlbHRhKHsgc2l6ZTogMywgdXNlRnJhbWVSYXRlOiAxIH0pO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gNDtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5kZXNjcmlwdGlvbiA9IFtcbiAgICAgICdub3JtJyxcbiAgICAgICd4JyxcbiAgICAgICd5JyxcbiAgICAgICd6JyxcbiAgICBdO1xuXG4gICAgdGhpcy5kZWx0YS5wcm9jZXNzU3RyZWFtUGFyYW1zKHtcbiAgICAgIGZyYW1lU2l6ZTogMyxcbiAgICAgIGZyYW1lUmF0ZTogdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5tZW1vcnkgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgIHRoaXMubm9ybUFjYyA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgcmVzZXRTdHJlYW0oKSB7XG4gICAgc3VwZXIucmVzZXRTdHJlYW0oKTtcblxuICAgIHRoaXMuZGVsdGEucmVzZXRTdHJlYW0oKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKVxuICAgICAgdGhpcy5tZW1vcnlbaV0gPSAwO1xuICB9XG5cbiAgaW5wdXRWZWN0b3IoZGF0YSkge1xuICAgIGNvbnN0IG91dERhdGEgPSB0aGlzLmZyYW1lLmRhdGE7XG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgY29uc3QgbWVtb3J5ID0gdGhpcy5tZW1vcnk7XG4gICAgY29uc3Qgbm9ybUFjYyA9IHRoaXMubm9ybUFjYztcbiAgICBjb25zdCBmZWVkYmFjayA9IHRoaXMucGFyYW1zLmdldCgnZmVlZGJhY2snKTtcbiAgICBjb25zdCBnYWluID0gdGhpcy5wYXJhbXMuZ2V0KCdnYWluJyk7XG4gICAgbGV0IG5vcm0gPSAwO1xuXG4gICAgLy8gbm9ybWFsaXplIGFjY2VsZXJvbWV0ZXJzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7IGkrKylcbiAgICAgIG5vcm1BY2NbaV0gPSAoZGF0YVtpXSB8fCAwKSAqIGludmVyc2VHcmF2aXR5O1xuXG4gICAgY29uc3QgZGVsdGFzID0gdGhpcy5kZWx0YS5pbnB1dFZlY3Rvcihub3JtQWNjKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBsZXQgdmFsdWUgPSBhYnMoZGVsdGFzW2ldKTtcbiAgICAgIHZhbHVlID0gdmFsdWUgKyBmZWVkYmFjayAqIG1lbW9yeVtpXTtcblxuICAgICAgLy8gc3RvcmUgdmFsdWUgZm9yIG5leHQgcGFzc1xuICAgICAgbWVtb3J5W2ldID0gdmFsdWU7XG5cbiAgICAgIHZhbHVlID0gdmFsdWUgKiBnYWluO1xuICAgICAgdmFsdWUgPSB2YWx1ZSAqIHZhbHVlO1xuXG4gICAgICBub3JtICs9IHZhbHVlO1xuICAgICAgb3V0RGF0YVtpICsgMV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBvdXREYXRhWzBdID0gbm9ybTtcblxuICAgIHJldHVybiBvdXREYXRhO1xuICB9XG5cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIHRoaXMuZnJhbWUuZGF0YSA9IHRoaXMuaW5wdXRWZWN0b3IoZnJhbWUuZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSW50ZW5zaXR5O1xuIl19
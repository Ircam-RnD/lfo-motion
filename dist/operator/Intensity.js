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
 * input: an array of numbers of size 1 to 3 (`[x]`, `[x, y]` or `[x, y, z]`).
 *
 * output: `[normIntensity, xIntensity, yIntensity, zIntensity]`
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQmFzZUxmbyIsImNvcmUiLCJEZWx0YSIsIm9wZXJhdG9yIiwiZGVmaW5pdGlvbnMiLCJmZWVkYmFjayIsInR5cGUiLCJkZWZhdWx0IiwibWluIiwibWF4IiwiZ2FpbiIsImludmVyc2VHcmF2aXR5IiwiYWJzIiwiTWF0aCIsInBvdyIsIkludGVuc2l0eSIsIm9wdGlvbnMiLCJtZW1vcnkiLCJub3JtQWNjIiwiZGVsdGEiLCJzaXplIiwidXNlRnJhbWVSYXRlIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVNpemUiLCJkZXNjcmlwdGlvbiIsInByb2Nlc3NTdHJlYW1QYXJhbXMiLCJmcmFtZVJhdGUiLCJGbG9hdDMyQXJyYXkiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJyZXNldFN0cmVhbSIsImkiLCJkYXRhIiwib3V0RGF0YSIsImZyYW1lIiwiYnVmZmVyIiwicGFyYW1zIiwiZ2V0Iiwibm9ybSIsImRlbHRhcyIsImlucHV0VmVjdG9yIiwidmFsdWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOzs7Ozs7QUFFWixJQUFNQyxVQUFVRCxJQUFJRSxJQUFKLENBQVNELE9BQXpCO0FBQ0EsSUFBTUUsUUFBUUgsSUFBSUksUUFBSixDQUFhRCxLQUEzQjs7QUFFQSxJQUFNRSxjQUFjO0FBQ2xCQyxZQUFVO0FBQ1JDLFVBQU0sT0FERTtBQUVSQyxhQUFTLEdBRkQ7QUFHUkMsU0FBSyxDQUhHO0FBSVJDLFNBQUs7QUFKRyxHQURRO0FBT2xCQyxRQUFNO0FBQ0pKLFVBQU0sT0FERjtBQUVKQyxhQUFTLElBRkw7QUFHSkMsU0FBSztBQUhEO0FBUFksQ0FBcEI7O0FBY0EsSUFBTUcsaUJBQWlCLElBQUksSUFBM0I7QUFDQSxJQUFNQyxNQUFNQyxLQUFLRCxHQUFqQjtBQUNBLElBQU1K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TCxDQUFpQk4sTUFBTUYsSUFBdkIsQ0FBbEI7QUFDRDs7O0VBN0VxQmpDLE87O2tCQWdGVGUsUyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmby9jb21tb24nO1xuXG5jb25zdCBCYXNlTGZvID0gbGZvLmNvcmUuQmFzZUxmbztcbmNvbnN0IERlbHRhID0gbGZvLm9wZXJhdG9yLkRlbHRhO1xuXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgZmVlZGJhY2s6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIGRlZmF1bHQ6IDAuNyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICB9LFxuICBnYWluOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBkZWZhdWx0OiAwLjA3LFxuICAgIG1pbjogMCxcbiAgfSxcbn07XG5cbmNvbnN0IGludmVyc2VHcmF2aXR5ID0gMSAvIDkuODE7XG5jb25zdCBhYnMgPSBNYXRoLmFicztcbmNvbnN0IG1pbiA9IE1hdGgubWluO1xuY29uc3QgbWF4ID0gTWF0aC5tYXg7XG5jb25zdCBwb3cgPSBNYXRoLnBvdztcblxuLyoqXG4gKiBDb21wdXRlIHRoZSBpbnRlbnNpdHkgb2YgdGhlIGFjY2VsZXJvbWV0ZXJzLlxuICpcbiAqIGlucHV0OiBhbiBhcnJheSBvZiBudW1iZXJzIG9mIHNpemUgMSB0byAzIChgW3hdYCwgYFt4LCB5XWAgb3IgYFt4LCB5LCB6XWApLlxuICpcbiAqIG91dHB1dDogYFtub3JtSW50ZW5zaXR5LCB4SW50ZW5zaXR5LCB5SW50ZW5zaXR5LCB6SW50ZW5zaXR5XWBcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmZlZWRiYWNrPTAuN10gLSBGZWVkYmFjayBjb2VmZmljaWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5nYWluPTAuMDddIC0gUG9zdCBnYWluIGNvZWZmaWNpZW50LlxuICovXG5jbGFzcyBJbnRlbnNpdHkgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoZGVmaW5pdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5tZW1vcnkgPSBudWxsO1xuICAgIHRoaXMubm9ybUFjYyA9IG51bGw7XG4gICAgdGhpcy5kZWx0YSA9IG5ldyBEZWx0YSh7IHNpemU6IDMsIHVzZUZyYW1lUmF0ZTogMSB9KTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMgPSB7fSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDQ7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZGVzY3JpcHRpb24gPSBbXG4gICAgICAnbm9ybScsXG4gICAgICAneCcsXG4gICAgICAneScsXG4gICAgICAneicsXG4gICAgXTtcblxuICAgIHRoaXMuZGVsdGEucHJvY2Vzc1N0cmVhbVBhcmFtcyh7XG4gICAgICBmcmFtZVNpemU6IDMsXG4gICAgICBmcmFtZVJhdGU6IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSxcbiAgICB9KTtcblxuICAgIHRoaXMubWVtb3J5ID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICB0aGlzLm5vcm1BY2MgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIHJlc2V0U3RyZWFtKCkge1xuICAgIHN1cGVyLnJlc2V0U3RyZWFtKCk7XG5cbiAgICB0aGlzLmRlbHRhLnJlc2V0U3RyZWFtKCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgIHRoaXMubWVtb3J5W2ldID0gMDtcbiAgfVxuXG4gIGlucHV0VmVjdG9yKGRhdGEpIHtcbiAgICBjb25zdCBvdXREYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgIGNvbnN0IG1lbW9yeSA9IHRoaXMubWVtb3J5O1xuICAgIGNvbnN0IG5vcm1BY2MgPSB0aGlzLm5vcm1BY2M7XG4gICAgY29uc3QgZmVlZGJhY2sgPSB0aGlzLnBhcmFtcy5nZXQoJ2ZlZWRiYWNrJyk7XG4gICAgY29uc3QgZ2FpbiA9IHRoaXMucGFyYW1zLmdldCgnZ2FpbicpO1xuICAgIGxldCBub3JtID0gMDtcblxuICAgIC8vIG5vcm1hbGl6ZSBhY2NlbGVyb21ldGVyc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplOyBpKyspXG4gICAgICBub3JtQWNjW2ldID0gKGRhdGFbaV0gfHwgMCkgKiBpbnZlcnNlR3Jhdml0eTtcblxuICAgIGNvbnN0IGRlbHRhcyA9IHRoaXMuZGVsdGEuaW5wdXRWZWN0b3Iobm9ybUFjYyk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgbGV0IHZhbHVlID0gYWJzKGRlbHRhc1tpXSk7XG4gICAgICB2YWx1ZSA9IHZhbHVlICsgZmVlZGJhY2sgKiBtZW1vcnlbaV07XG5cbiAgICAgIC8vIHN0b3JlIHZhbHVlIGZvciBuZXh0IHBhc3NcbiAgICAgIG1lbW9yeVtpXSA9IHZhbHVlO1xuXG4gICAgICB2YWx1ZSA9IHZhbHVlICogZ2FpbjtcbiAgICAgIHZhbHVlID0gdmFsdWUgKiB2YWx1ZTtcblxuICAgICAgbm9ybSArPSB2YWx1ZTtcbiAgICAgIG91dERhdGFbaSArIDFdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgb3V0RGF0YVswXSA9IG5vcm07XG5cbiAgICByZXR1cm4gb3V0RGF0YTtcbiAgfVxuXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICB0aGlzLmZyYW1lLmRhdGEgPSB0aGlzLmlucHV0VmVjdG9yKGZyYW1lLmRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVuc2l0eTtcbiJdfQ==
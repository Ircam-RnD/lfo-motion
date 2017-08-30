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
    default: 0.9,
    min: 0,
    max: 1
  },
  gain: {
    type: 'float',
    default: 0.1,
    min: 0,
    max: +infinity
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
 * @param {Number} [feedback=0.9] - feedback coefficient
 * @param {Number} [gain=0.1] - post gain coefficient
 * @param {Boolean} [boost=false] - compute a noramlized
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
      for (var i = 0; i < 3; i++) {
        normAcc[i] = data[i] * inverseGravity;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQmFzZUxmbyIsImNvcmUiLCJEZWx0YSIsIm9wZXJhdG9yIiwiZGVmaW5pdGlvbnMiLCJmZWVkYmFjayIsInR5cGUiLCJkZWZhdWx0IiwibWluIiwibWF4IiwiZ2FpbiIsImluZmluaXR5IiwiaW52ZXJzZUdyYXZpdHkiLCJhYnMiLCJNYXRoIiwicG93IiwiSW50ZW5zaXR5Iiwib3B0aW9ucyIsIm1lbW9yeSIsIm5vcm1BY2MiLCJkZWx0YSIsInNpemUiLCJ1c2VGcmFtZVJhdGUiLCJwcmV2U3RyZWFtUGFyYW1zIiwicHJlcGFyZVN0cmVhbVBhcmFtcyIsInN0cmVhbVBhcmFtcyIsImZyYW1lU2l6ZSIsImRlc2NyaXB0aW9uIiwicHJvY2Vzc1N0cmVhbVBhcmFtcyIsImZyYW1lUmF0ZSIsIkZsb2F0MzJBcnJheSIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsInJlc2V0U3RyZWFtIiwiaSIsImRhdGEiLCJvdXREYXRhIiwiZnJhbWUiLCJidWZmZXIiLCJwYXJhbXMiLCJnZXQiLCJub3JtIiwiZGVsdGFzIiwiaW5wdXRWZWN0b3IiLCJ2YWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0lBQVlBLEc7Ozs7OztBQUVaLElBQU1DLFVBQVVELElBQUlFLElBQUosQ0FBU0QsT0FBekI7QUFDQSxJQUFNRSxRQUFRSCxJQUFJSSxRQUFKLENBQWFELEtBQTNCOztBQUVBLElBQU1FLGNBQWM7QUFDbEJDLFlBQVU7QUFDUkMsVUFBTSxPQURFO0FBRVJDLGFBQVMsR0FGRDtBQUdSQyxTQUFLLENBSEc7QUFJUkMsU0FBSztBQUpHLEdBRFE7QUFPbEJDLFFBQU07QUFDSkosVUFBTSxPQURGO0FBRUpDLGFBQVMsR0FGTDtBQUdKQyxTQUFLLENBSEQ7QUFJSkMsU0FBSyxDQUFDRTtBQUpGO0FBUFksQ0FBcEI7O0FBZUEsSUFBTUMsaUJBQWlCLElBQUksSUFBM0I7QUFDQSxJ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QUFpQk4sTUFBTUYsSUFBdkIsQ0FBbEI7QUFDRDs7O0VBN0VxQmxDLE87O2tCQWdGVGdCLFMiLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8vY29tbW9uJztcblxuY29uc3QgQmFzZUxmbyA9IGxmby5jb3JlLkJhc2VMZm87XG5jb25zdCBEZWx0YSA9IGxmby5vcGVyYXRvci5EZWx0YTtcblxuY29uc3QgZGVmaW5pdGlvbnMgPSB7XG4gIGZlZWRiYWNrOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBkZWZhdWx0OiAwLjksXG4gICAgbWluOiAwLFxuICAgIG1heDogMSxcbiAgfSxcbiAgZ2Fpbjoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4xLFxuICAgIG1pbjogMCxcbiAgICBtYXg6ICtpbmZpbml0eSxcbiAgfSxcbn07XG5cbmNvbnN0IGludmVyc2VHcmF2aXR5ID0gMSAvIDkuODE7XG5jb25zdCBhYnMgPSBNYXRoLmFicztcbmNvbnN0IG1pbiA9IE1hdGgubWluO1xuY29uc3QgbWF4ID0gTWF0aC5tYXg7XG5jb25zdCBwb3cgPSBNYXRoLnBvdztcblxuLyoqXG4gKiBDb21wdXRlIHRoZSBpbnRlbnNpdHkgb2YgdGhlIGFjY2VsZXJvbWV0ZXJzLlxuICpcbiAqIG91dHB1dDogW25vcm1JbnRlbnNpdHksIHhJbnRlbnNpdHksIHlJbnRlbnNpdHksIHpJbnRlbnNpdHldXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IFtmZWVkYmFjaz0wLjldIC0gZmVlZGJhY2sgY29lZmZpY2llbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSBbZ2Fpbj0wLjFdIC0gcG9zdCBnYWluIGNvZWZmaWNpZW50XG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtib29zdD1mYWxzZV0gLSBjb21wdXRlIGEgbm9yYW1saXplZFxuICovXG5jbGFzcyBJbnRlbnNpdHkgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoZGVmaW5pdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5tZW1vcnkgPSBudWxsO1xuICAgIHRoaXMubm9ybUFjYyA9IG51bGw7XG4gICAgdGhpcy5kZWx0YSA9IG5ldyBEZWx0YSh7IHNpemU6IDMsIHVzZUZyYW1lUmF0ZTogMSB9KTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMgPSB7fSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDQ7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZGVzY3JpcHRpb24gPSBbXG4gICAgICAnbm9ybScsXG4gICAgICAneCcsXG4gICAgICAneScsXG4gICAgICAneicsXG4gICAgXTtcblxuICAgIHRoaXMuZGVsdGEucHJvY2Vzc1N0cmVhbVBhcmFtcyh7XG4gICAgICBmcmFtZVNpemU6IDMsXG4gICAgICBmcmFtZVJhdGU6IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSxcbiAgICB9KTtcblxuICAgIHRoaXMubWVtb3J5ID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICB0aGlzLm5vcm1BY2MgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIHJlc2V0U3RyZWFtKCkge1xuICAgIHN1cGVyLnJlc2V0U3RyZWFtKCk7XG5cbiAgICB0aGlzLmRlbHRhLnJlc2V0U3RyZWFtKCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgIHRoaXMubWVtb3J5W2ldID0gMDtcbiAgfVxuXG4gIGlucHV0VmVjdG9yKGRhdGEpIHtcbiAgICBjb25zdCBvdXREYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgIGNvbnN0IG1lbW9yeSA9IHRoaXMubWVtb3J5O1xuICAgIGNvbnN0IG5vcm1BY2MgPSB0aGlzLm5vcm1BY2M7XG4gICAgY29uc3QgZmVlZGJhY2sgPSB0aGlzLnBhcmFtcy5nZXQoJ2ZlZWRiYWNrJyk7XG4gICAgY29uc3QgZ2FpbiA9IHRoaXMucGFyYW1zLmdldCgnZ2FpbicpO1xuICAgIGxldCBub3JtID0gMDtcblxuICAgIC8vIG5vcm1hbGl6ZSBhY2NlbGVyb21ldGVyc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKVxuICAgICAgbm9ybUFjY1tpXSA9IGRhdGFbaV0gKiBpbnZlcnNlR3Jhdml0eTtcblxuICAgIGNvbnN0IGRlbHRhcyA9IHRoaXMuZGVsdGEuaW5wdXRWZWN0b3Iobm9ybUFjYyk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgbGV0IHZhbHVlID0gYWJzKGRlbHRhc1tpXSk7XG4gICAgICB2YWx1ZSA9IHZhbHVlICsgZmVlZGJhY2sgKiBtZW1vcnlbaV07XG5cbiAgICAgIC8vIHN0b3JlIHZhbHVlIGZvciBuZXh0IHBhc3NcbiAgICAgIG1lbW9yeVtpXSA9IHZhbHVlO1xuXG4gICAgICB2YWx1ZSA9IHZhbHVlICogZ2FpbjtcbiAgICAgIHZhbHVlID0gdmFsdWUgKiB2YWx1ZTtcblxuICAgICAgbm9ybSArPSB2YWx1ZTtcbiAgICAgIG91dERhdGFbaSArIDFdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgb3V0RGF0YVswXSA9IG5vcm07XG5cbiAgICByZXR1cm4gb3V0RGF0YTtcbiAgfVxuXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICB0aGlzLmZyYW1lLmRhdGEgPSB0aGlzLmlucHV0VmVjdG9yKGZyYW1lLmRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVuc2l0eTtcbiJdfQ==
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
 * @param {Number} [feedback=0.7] - feedback coefficient
 * @param {Number} [gain=0.07] - post gain coefficient
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQmFzZUxmbyIsImNvcmUiLCJEZWx0YSIsIm9wZXJhdG9yIiwiZGVmaW5pdGlvbnMiLCJmZWVkYmFjayIsInR5cGUiLCJkZWZhdWx0IiwibWluIiwibWF4IiwiZ2FpbiIsImludmVyc2VHcmF2aXR5IiwiYWJzIiwiTWF0aCIsInBvdyIsIkludGVuc2l0eSIsIm9wdGlvbnMiLCJtZW1vcnkiLCJub3JtQWNjIiwiZGVsdGEiLCJzaXplIiwidXNlRnJhbWVSYXRlIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVNpemUiLCJkZXNjcmlwdGlvbiIsInByb2Nlc3NTdHJlYW1QYXJhbXMiLCJmcmFtZVJhdGUiLCJGbG9hdDMyQXJyYXkiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJyZXNldFN0cmVhbSIsImkiLCJkYXRhIiwib3V0RGF0YSIsImZyYW1lIiwiYnVmZmVyIiwicGFyYW1zIiwiZ2V0Iiwibm9ybSIsImRlbHRhcyIsImlucHV0VmVjdG9yIiwidmFsdWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOzs7Ozs7QUFFWixJQUFNQyxVQUFVRCxJQUFJRSxJQUFKLENBQVNELE9BQXpCO0FBQ0EsSUFBTUUsUUFBUUgsSUFBSUksUUFBSixDQUFhRCxLQUEzQjs7QUFFQSxJQUFNRSxjQUFjO0FBQ2xCQyxZQUFVO0FBQ1JDLFVBQU0sT0FERTtBQUVSQyxhQUFTLEdBRkQ7QUFHUkMsU0FBSyxDQUhHO0FBSVJDLFNBQUs7QUFKRyxHQURRO0FBT2xCQyxRQUFNO0FBQ0pKLFVBQU0sT0FERjtBQUVKQyxhQUFTLElBRkw7QUFHSkMsU0FBSztBQUhEO0FBUFksQ0FBcEI7O0FBY0EsSUFBTUcsaUJBQWlCLElBQUksSUFBM0I7QUFDQSxJQUFNQyxNQUFNQyxLQUFLRCxHQUFqQjtBQUNBLElBQU1K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N0VxQmpDLE87O2tCQWdGVGUsUyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmby9jb21tb24nO1xuXG5jb25zdCBCYXNlTGZvID0gbGZvLmNvcmUuQmFzZUxmbztcbmNvbnN0IERlbHRhID0gbGZvLm9wZXJhdG9yLkRlbHRhO1xuXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgZmVlZGJhY2s6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIGRlZmF1bHQ6IDAuNyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICB9LFxuICBnYWluOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBkZWZhdWx0OiAwLjA3LFxuICAgIG1pbjogMCxcbiAgfSxcbn07XG5cbmNvbnN0IGludmVyc2VHcmF2aXR5ID0gMSAvIDkuODE7XG5jb25zdCBhYnMgPSBNYXRoLmFicztcbmNvbnN0IG1pbiA9IE1hdGgubWluO1xuY29uc3QgbWF4ID0gTWF0aC5tYXg7XG5jb25zdCBwb3cgPSBNYXRoLnBvdztcblxuLyoqXG4gKiBDb21wdXRlIHRoZSBpbnRlbnNpdHkgb2YgdGhlIGFjY2VsZXJvbWV0ZXJzLlxuICpcbiAqIG91dHB1dDogW25vcm1JbnRlbnNpdHksIHhJbnRlbnNpdHksIHlJbnRlbnNpdHksIHpJbnRlbnNpdHldXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IFtmZWVkYmFjaz0wLjddIC0gZmVlZGJhY2sgY29lZmZpY2llbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSBbZ2Fpbj0wLjA3XSAtIHBvc3QgZ2FpbiBjb2VmZmljaWVudFxuICogQHBhcmFtIHtCb29sZWFufSBbYm9vc3Q9ZmFsc2VdIC0gY29tcHV0ZSBhIG5vcmFtbGl6ZWRcbiAqL1xuY2xhc3MgSW50ZW5zaXR5IGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMubWVtb3J5ID0gbnVsbDtcbiAgICB0aGlzLm5vcm1BY2MgPSBudWxsO1xuICAgIHRoaXMuZGVsdGEgPSBuZXcgRGVsdGEoeyBzaXplOiAzLCB1c2VGcmFtZVJhdGU6IDEgfSk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSA0O1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gW1xuICAgICAgJ25vcm0nLFxuICAgICAgJ3gnLFxuICAgICAgJ3knLFxuICAgICAgJ3onLFxuICAgIF07XG5cbiAgICB0aGlzLmRlbHRhLnByb2Nlc3NTdHJlYW1QYXJhbXMoe1xuICAgICAgZnJhbWVTaXplOiAzLFxuICAgICAgZnJhbWVSYXRlOiB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUsXG4gICAgfSk7XG5cbiAgICB0aGlzLm1lbW9yeSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgdGhpcy5ub3JtQWNjID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICByZXNldFN0cmVhbSgpIHtcbiAgICBzdXBlci5yZXNldFN0cmVhbSgpO1xuXG4gICAgdGhpcy5kZWx0YS5yZXNldFN0cmVhbSgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICB0aGlzLm1lbW9yeVtpXSA9IDA7XG4gIH1cblxuICBpbnB1dFZlY3RvcihkYXRhKSB7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICBjb25zdCBtZW1vcnkgPSB0aGlzLm1lbW9yeTtcbiAgICBjb25zdCBub3JtQWNjID0gdGhpcy5ub3JtQWNjO1xuICAgIGNvbnN0IGZlZWRiYWNrID0gdGhpcy5wYXJhbXMuZ2V0KCdmZWVkYmFjaycpO1xuICAgIGNvbnN0IGdhaW4gPSB0aGlzLnBhcmFtcy5nZXQoJ2dhaW4nKTtcbiAgICBsZXQgbm9ybSA9IDA7XG5cbiAgICAvLyBub3JtYWxpemUgYWNjZWxlcm9tZXRlcnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgIG5vcm1BY2NbaV0gPSBkYXRhW2ldICogaW52ZXJzZUdyYXZpdHk7XG5cbiAgICBjb25zdCBkZWx0YXMgPSB0aGlzLmRlbHRhLmlucHV0VmVjdG9yKG5vcm1BY2MpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGxldCB2YWx1ZSA9IGFicyhkZWx0YXNbaV0pO1xuICAgICAgdmFsdWUgPSB2YWx1ZSArIGZlZWRiYWNrICogbWVtb3J5W2ldO1xuXG4gICAgICAvLyBzdG9yZSB2YWx1ZSBmb3IgbmV4dCBwYXNzXG4gICAgICBtZW1vcnlbaV0gPSB2YWx1ZTtcblxuICAgICAgdmFsdWUgPSB2YWx1ZSAqIGdhaW47XG4gICAgICB2YWx1ZSA9IHZhbHVlICogdmFsdWU7XG5cbiAgICAgIG5vcm0gKz0gdmFsdWU7XG4gICAgICBvdXREYXRhW2kgKyAxXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIG91dERhdGFbMF0gPSBub3JtO1xuXG4gICAgcmV0dXJuIG91dERhdGE7XG4gIH1cblxuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgdGhpcy5mcmFtZS5kYXRhID0gdGhpcy5pbnB1dFZlY3RvcihmcmFtZS5kYXRhKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlbnNpdHk7XG4iXX0=
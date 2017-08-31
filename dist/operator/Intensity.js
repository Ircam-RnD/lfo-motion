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
    max: +Infinity
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkludGVuc2l0eS5qcyJdLCJuYW1lcyI6WyJsZm8iLCJCYXNlTGZvIiwiY29yZSIsIkRlbHRhIiwib3BlcmF0b3IiLCJkZWZpbml0aW9ucyIsImZlZWRiYWNrIiwidHlwZSIsImRlZmF1bHQiLCJtaW4iLCJtYXgiLCJnYWluIiwiSW5maW5pdHkiLCJpbnZlcnNlR3Jhdml0eSIsImFicyIsIk1hdGgiLCJwb3ciLCJJbnRlbnNpdHkiLCJvcHRpb25zIiwibWVtb3J5Iiwibm9ybUFjYyIsImRlbHRhIiwic2l6ZSIsInVzZUZyYW1lUmF0ZSIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwiZGVzY3JpcHRpb24iLCJwcm9jZXNzU3RyZWFtUGFyYW1zIiwiZnJhbWVSYXRlIiwiRmxvYXQzMkFycmF5IiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwicmVzZXRTdHJlYW0iLCJpIiwiZGF0YSIsIm91dERhdGEiLCJmcmFtZSIsImJ1ZmZlciIsInBhcmFtcyIsImdldCIsIm5vcm0iLCJkZWx0YXMiLCJpbnB1dFZlY3RvciIsInZhbHVlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7SUFBWUEsRzs7Ozs7O0FBRVosSUFBTUMsVUFBVUQsSUFBSUUsSUFBSixDQUFTRCxPQUF6QjtBQUNBLElBQU1FLFFBQVFILElBQUlJLFFBQUosQ0FBYUQsS0FBM0I7O0FBRUEsSUFBTUUsY0FBYztBQUNsQkMsWUFBVTtBQUNSQyxVQUFNLE9BREU7QUFFUkMsYUFBUyxHQUZEO0FBR1JDLFNBQUssQ0FIRztBQUlSQyxTQUFLO0FBSkcsR0FEUTtBQU9sQkMsUUFBTTtBQUNKSixVQUFNLE9BREY7QUFFSkMsYUFBUyxHQUZMO0FBR0pDLFNBQUssQ0FIRDtBQUlKQyxTQUFLLENBQUNFO0FBSkY7QUFQWSxDQUFwQjs7QUFlQSxJQUFNQyxpQkFBaUIsSUFBSSxJQUEzQjtBQUNBLElB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QWlCTixNQUFNRixJQUF2QixDQUFsQjtBQUNEOzs7RUE3RXFCbEMsTzs7a0JBZ0ZUZ0IsUyIsImZpbGUiOiJJbnRlbnNpdHkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBsZm8gZnJvbSAnd2F2ZXMtbGZvL2NvbW1vbic7XG5cbmNvbnN0IEJhc2VMZm8gPSBsZm8uY29yZS5CYXNlTGZvO1xuY29uc3QgRGVsdGEgPSBsZm8ub3BlcmF0b3IuRGVsdGE7XG5cbmNvbnN0IGRlZmluaXRpb25zID0ge1xuICBmZWVkYmFjazoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC45LFxuICAgIG1pbjogMCxcbiAgICBtYXg6IDEsXG4gIH0sXG4gIGdhaW46IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIGRlZmF1bHQ6IDAuMSxcbiAgICBtaW46IDAsXG4gICAgbWF4OiArSW5maW5pdHksXG4gIH0sXG59O1xuXG5jb25zdCBpbnZlcnNlR3Jhdml0eSA9IDEgLyA5LjgxO1xuY29uc3QgYWJzID0gTWF0aC5hYnM7XG5jb25zdCBtaW4gPSBNYXRoLm1pbjtcbmNvbnN0IG1heCA9IE1hdGgubWF4O1xuY29uc3QgcG93ID0gTWF0aC5wb3c7XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgaW50ZW5zaXR5IG9mIHRoZSBhY2NlbGVyb21ldGVycy5cbiAqXG4gKiBvdXRwdXQ6IFtub3JtSW50ZW5zaXR5LCB4SW50ZW5zaXR5LCB5SW50ZW5zaXR5LCB6SW50ZW5zaXR5XVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBbZmVlZGJhY2s9MC45XSAtIGZlZWRiYWNrIGNvZWZmaWNpZW50XG4gKiBAcGFyYW0ge051bWJlcn0gW2dhaW49MC4xXSAtIHBvc3QgZ2FpbiBjb2VmZmljaWVudFxuICogQHBhcmFtIHtCb29sZWFufSBbYm9vc3Q9ZmFsc2VdIC0gY29tcHV0ZSBhIG5vcmFtbGl6ZWRcbiAqL1xuY2xhc3MgSW50ZW5zaXR5IGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMubWVtb3J5ID0gbnVsbDtcbiAgICB0aGlzLm5vcm1BY2MgPSBudWxsO1xuICAgIHRoaXMuZGVsdGEgPSBuZXcgRGVsdGEoeyBzaXplOiAzLCB1c2VGcmFtZVJhdGU6IDEgfSk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSA0O1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gW1xuICAgICAgJ25vcm0nLFxuICAgICAgJ3gnLFxuICAgICAgJ3knLFxuICAgICAgJ3onLFxuICAgIF07XG5cbiAgICB0aGlzLmRlbHRhLnByb2Nlc3NTdHJlYW1QYXJhbXMoe1xuICAgICAgZnJhbWVTaXplOiAzLFxuICAgICAgZnJhbWVSYXRlOiB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUsXG4gICAgfSk7XG5cbiAgICB0aGlzLm1lbW9yeSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgdGhpcy5ub3JtQWNjID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICByZXNldFN0cmVhbSgpIHtcbiAgICBzdXBlci5yZXNldFN0cmVhbSgpO1xuXG4gICAgdGhpcy5kZWx0YS5yZXNldFN0cmVhbSgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICB0aGlzLm1lbW9yeVtpXSA9IDA7XG4gIH1cblxuICBpbnB1dFZlY3RvcihkYXRhKSB7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICBjb25zdCBtZW1vcnkgPSB0aGlzLm1lbW9yeTtcbiAgICBjb25zdCBub3JtQWNjID0gdGhpcy5ub3JtQWNjO1xuICAgIGNvbnN0IGZlZWRiYWNrID0gdGhpcy5wYXJhbXMuZ2V0KCdmZWVkYmFjaycpO1xuICAgIGNvbnN0IGdhaW4gPSB0aGlzLnBhcmFtcy5nZXQoJ2dhaW4nKTtcbiAgICBsZXQgbm9ybSA9IDA7XG5cbiAgICAvLyBub3JtYWxpemUgYWNjZWxlcm9tZXRlcnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgIG5vcm1BY2NbaV0gPSBkYXRhW2ldICogaW52ZXJzZUdyYXZpdHk7XG5cbiAgICBjb25zdCBkZWx0YXMgPSB0aGlzLmRlbHRhLmlucHV0VmVjdG9yKG5vcm1BY2MpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGxldCB2YWx1ZSA9IGFicyhkZWx0YXNbaV0pO1xuICAgICAgdmFsdWUgPSB2YWx1ZSArIGZlZWRiYWNrICogbWVtb3J5W2ldO1xuXG4gICAgICAvLyBzdG9yZSB2YWx1ZSBmb3IgbmV4dCBwYXNzXG4gICAgICBtZW1vcnlbaV0gPSB2YWx1ZTtcblxuICAgICAgdmFsdWUgPSB2YWx1ZSAqIGdhaW47XG4gICAgICB2YWx1ZSA9IHZhbHVlICogdmFsdWU7XG5cbiAgICAgIG5vcm0gKz0gdmFsdWU7XG4gICAgICBvdXREYXRhW2kgKyAxXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIG91dERhdGFbMF0gPSBub3JtO1xuXG4gICAgcmV0dXJuIG91dERhdGE7XG4gIH1cblxuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgdGhpcy5mcmFtZS5kYXRhID0gdGhpcy5pbnB1dFZlY3RvcihmcmFtZS5kYXRhKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlbnNpdHk7XG4iXX0=
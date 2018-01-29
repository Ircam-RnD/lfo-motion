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

var _core = require('waves-lfo/core');

var lfo = _interopRequireWildcard(_core);

var _ticker = require('@ircam/ticker');

var _ticker2 = _interopRequireDefault(_ticker);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (!Float32Array.prototype.fill) {
  Float32Array.prototype.fill = function (val) {
    for (var i = 0; i < this.length; i++) {
      this[i] = val;
    }
  };
}

var parameters = {
  frameRate: {
    type: 'integer',
    min: 1,
    max: +Infinity,
    default: 20,
    constant: true,
    metas: {
      unit: 'Hz'
    }
  }
};

/**
 * Module that naïvely resample an incomming vector frame at a given framerate.
 * If 0 frame has been received since last tick, output last values.
 * If more than 1 frame since last tick, output the mean of all the frames.
 *
 * @memberof operator
 *
 * @todo - add option for output type (i.e. mean, max, min, last, median, etc.)
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.frameRate=20] - output sampling rate (in Hz)
 */

var Sampler = function (_lfo$BaseLfo) {
  (0, _inherits3.default)(Sampler, _lfo$BaseLfo);

  function Sampler() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Sampler);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Sampler.__proto__ || (0, _getPrototypeOf2.default)(Sampler)).call(this, parameters, options));

    _this.ticker = null;
    _this.buffer = null;
    _this.bufferIndex = 0;

    _this.propagateFrame = _this.propagateFrame.bind(_this);
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(Sampler, [{
    key: 'processStreamParams',
    value: function processStreamParams(prevStreamParams) {
      this.prepareStreamParams(prevStreamParams);

      var frameRate = this.params.get('frameRate'); // period is in Hz

      this.streamParams.frameRate = frameRate;

      // build buffer
      var frameSize = this.streamParams.frameSize;
      var sourceFrameRate = prevStreamParams.frameRate;

      if (sourceFrameRate <= 0 || !isFinite(sourceFrameRate)) sourceFrameRate = 100; // arbitrary value hoping that we won't loose data

      // max number of source frames to store
      var bufferSize = Math.ceil(sourceFrameRate / frameRate);

      this.maxBufferIndex = bufferSize;
      this.buffer = new Float32Array(bufferSize * frameSize);
      this.sums = new Float32Array(frameSize);

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'finalizeStream',
    value: function finalizeStream(endTime) {
      // @todo - output current data, compute proper endTime
      (0, _get3.default)(Sampler.prototype.__proto__ || (0, _getPrototypeOf2.default)(Sampler.prototype), 'finalizeStream', this).call(this, endTime);
      this.ticker.stop();
      this.ticker = null;
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      if (this.bufferIndex < this.maxBufferIndex) {
        var data = frame.data;
        var frameSize = this.streamParams.frameSize;

        for (var i = 0; i < frameSize; i++) {
          this.buffer[this.bufferIndex * frameSize + i] = data[i];
        }this.bufferIndex += 1;
      }
    }

    /** @private */

  }, {
    key: 'processScalar',
    value: function processScalar(value) {
      if (this.bufferIndex < this.maxBufferIndex) {
        var data = frame.data;
        var frameSize = this.streamParams.frameSize;

        this.buffer[this.bufferIndex * frameSize] = data[0];
        this.bufferIndex += 1;
      }
    }

    /** @private */

  }, {
    key: 'processFrame',
    value: function processFrame(frame) {
      this.prepareFrame();

      this.frame.metadata = frame.metadata;

      this.processFunction(frame);

      if (this.ticker === null) {
        var period = 1000 / this.params.get('frameRate'); // in ms
        this.ticker = new _ticker2.default(period, this.propagateFrame);
        this.ticker.start();
      }
    }

    /** @private */

  }, {
    key: 'propagateFrame',
    value: function propagateFrame(logicalTime) {
      this.frame.time = logicalTime / 1000;

      if (this.bufferIndex > 0) this._computeFrameData();

      (0, _get3.default)(Sampler.prototype.__proto__ || (0, _getPrototypeOf2.default)(Sampler.prototype), 'propagateFrame', this).call(this);
    }

    /** @private */

  }, {
    key: '_computeFrameData',
    value: function _computeFrameData() {
      var numFrames = this.bufferIndex;
      var frameSize = this.streamParams.frameSize;
      var buffer = this.buffer;
      var data = this.frame.data;

      // get means for each vector index
      var sums = this.sums;
      sums.fill(0);

      for (var frameIndex = 0; frameIndex < numFrames; frameIndex++) {
        for (var i = 0; i < frameSize; i++) {
          sums[i] += buffer[frameSize * frameIndex + i];
        }
      }

      for (var _i = 0; _i < frameSize; _i++) {
        data[_i] = sums[_i] / numFrames;
      }this.bufferIndex = 0;
    }
  }]);
  return Sampler;
}(lfo.BaseLfo);

exports.default = Sampler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiRmxvYXQzMkFycmF5IiwicHJvdG90eXBlIiwiZmlsbCIsInZhbCIsImkiLCJsZW5ndGgiLCJwYXJhbWV0ZXJzIiwiZnJhbWVSYXRlIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsImNvbnN0YW50IiwibWV0YXMiLCJ1bml0IiwiU2FtcGxlciIsIm9wdGlvbnMiLCJ0aWNrZXIiLCJidWZmZXIiLCJidWZmZXJJbmRleCIsInByb3BhZ2F0ZUZyYW1lIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwicGFyYW1zIiwiZ2V0Iiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwic291cmNlRnJhbWVSYXRlIiwiaXNGaW5pdGUiLCJidWZmZXJTaXplIiwiTWF0aCIsImNlaWwiLCJtYXhCdWZmZXJJbmRleCIsInN1bXMiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJlbmRUaW1lIiwic3RvcCIsImZyYW1lIiwiZGF0YSIsInZhbHVlIiwicHJlcGFyZUZyYW1lIiwibWV0YWRhdGEiLCJwcm9jZXNzRnVuY3Rpb24iLCJwZXJpb2QiLCJzdGFydCIsImxvZ2ljYWxUaW1lIiwidGltZSIsIl9jb21wdXRlRnJhbWVEYXRhIiwibnVtRnJhbWVzIiwiZnJhbWVJbmRleCIsIkJhc2VMZm8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOztBQUNaOzs7Ozs7OztBQUVBLElBQUksQ0FBQ0MsYUFBYUMsU0FBYixDQUF1QkMsSUFBNUIsRUFBa0M7QUFDaENGLGVBQWFDLFNBQWIsQ0FBdUJDLElBQXZCLEdBQThCLFVBQVNDLEdBQVQsRUFBYztBQUMxQyxTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLQyxNQUF6QixFQUFpQ0QsR0FBakMsRUFBc0M7QUFDcEMsV0FBS0EsQ0FBTCxJQUFV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QixXQUFMLEdBQW1CLENBQW5CO0FBQ0Q7OztFQWpIbUJyQixJQUFJcUQsTzs7a0JBb0hYcEMsTyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmby9jb3JlJztcbmltcG9ydCBUaWNrZXIgZnJvbSAnQGlyY2FtL3RpY2tlcic7XG5cbmlmICghRmxvYXQzMkFycmF5LnByb3RvdHlwZS5maWxsKSB7XG4gIEZsb2F0MzJBcnJheS5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbDtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgZnJhbWVSYXRlOiB7XG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIG1pbjogMSxcbiAgICBtYXg6ICtJbmZpbml0eSxcbiAgICBkZWZhdWx0OiAyMCxcbiAgICBjb25zdGFudDogdHJ1ZSxcbiAgICBtZXRhczoge1xuICAgICAgdW5pdDogJ0h6JyxcbiAgICB9LFxuICB9LFxufTtcblxuLyoqXG4gKiBNb2R1bGUgdGhhdCBuYcOvdmVseSByZXNhbXBsZSBhbiBpbmNvbW1pbmcgdmVjdG9yIGZyYW1lIGF0IGEgZ2l2ZW4gZnJhbWVyYXRlLlxuICogSWYgMCBmcmFtZSBoYXMgYmVlbiByZWNlaXZlZCBzaW5jZSBsYXN0IHRpY2ssIG91dHB1dCBsYXN0IHZhbHVlcy5cbiAqIElmIG1vcmUgdGhhbiAxIGZyYW1lIHNpbmNlIGxhc3QgdGljaywgb3V0cHV0IHRoZSBtZWFuIG9mIGFsbCB0aGUgZnJhbWVzLlxuICpcbiAqIEBtZW1iZXJvZiBvcGVyYXRvclxuICpcbiAqIEB0b2RvIC0gYWRkIG9wdGlvbiBmb3Igb3V0cHV0IHR5cGUgKGkuZS4gbWVhbiwgbWF4LCBtaW4sIGxhc3QsIG1lZGlhbiwgZXRjLilcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmZyYW1lUmF0ZT0yMF0gLSBvdXRwdXQgc2FtcGxpbmcgcmF0ZSAoaW4gSHopXG4gKi9cbmNsYXNzIFNhbXBsZXIgZXh0ZW5kcyBsZm8uQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy50aWNrZXIgPSBudWxsO1xuICAgIHRoaXMuYnVmZmVyID0gbnVsbDtcbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gMDtcblxuICAgIHRoaXMucHJvcGFnYXRlRnJhbWUgPSB0aGlzLnByb3BhZ2F0ZUZyYW1lLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgY29uc3QgZnJhbWVSYXRlID0gdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVJhdGUnKTsgLy8gcGVyaW9kIGlzIGluIEh6XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSBmcmFtZVJhdGU7XG5cbiAgICAvLyBidWlsZCBidWZmZXJcbiAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG4gICAgbGV0IHNvdXJjZUZyYW1lUmF0ZSA9IHByZXZTdHJlYW1QYXJhbXMuZnJhbWVSYXRlO1xuXG4gICAgaWYgKHNvdXJjZUZyYW1lUmF0ZSA8PSAwIHx8ICFpc0Zpbml0ZShzb3VyY2VGcmFtZVJhdGUpKVxuICAgICAgc291cmNlRnJhbWVSYXRlID0gMTAwOyAvLyBhcmJpdHJhcnkgdmFsdWUgaG9waW5nIHRoYXQgd2Ugd29uJ3QgbG9vc2UgZGF0YVxuXG4gICAgLy8gbWF4IG51bWJlciBvZiBzb3VyY2UgZnJhbWVzIHRvIHN0b3JlXG4gICAgY29uc3QgYnVmZmVyU2l6ZSA9IE1hdGguY2VpbChzb3VyY2VGcmFtZVJhdGUgLyBmcmFtZVJhdGUpO1xuXG4gICAgdGhpcy5tYXhCdWZmZXJJbmRleCA9IGJ1ZmZlclNpemU7XG4gICAgdGhpcy5idWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlclNpemUgKiBmcmFtZVNpemUpO1xuICAgIHRoaXMuc3VtcyA9IG5ldyBGbG9hdDMyQXJyYXkoZnJhbWVTaXplKTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgZmluYWxpemVTdHJlYW0oZW5kVGltZSkge1xuICAgIC8vIEB0b2RvIC0gb3V0cHV0IGN1cnJlbnQgZGF0YSwgY29tcHV0ZSBwcm9wZXIgZW5kVGltZVxuICAgIHN1cGVyLmZpbmFsaXplU3RyZWFtKGVuZFRpbWUpO1xuICAgIHRoaXMudGlja2VyLnN0b3AoKTtcbiAgICB0aGlzLnRpY2tlciA9IG51bGw7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGlmICh0aGlzLmJ1ZmZlckluZGV4IDwgdGhpcy5tYXhCdWZmZXJJbmRleCkge1xuICAgICAgY29uc3QgZGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWVTaXplOyBpKyspXG4gICAgICAgIHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVySW5kZXggKiBmcmFtZVNpemUgKyBpXSA9IGRhdGFbaV07XG5cbiAgICAgIHRoaXMuYnVmZmVySW5kZXggKz0gMTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1NjYWxhcih2YWx1ZSkge1xuICAgIGlmICh0aGlzLmJ1ZmZlckluZGV4IDwgdGhpcy5tYXhCdWZmZXJJbmRleCkge1xuICAgICAgY29uc3QgZGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG5cbiAgICAgIHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVySW5kZXggKiBmcmFtZVNpemVdID0gZGF0YVswXTtcbiAgICAgIHRoaXMuYnVmZmVySW5kZXggKz0gMTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc0ZyYW1lKGZyYW1lKSB7XG4gICAgdGhpcy5wcmVwYXJlRnJhbWUoKTtcblxuICAgIHRoaXMuZnJhbWUubWV0YWRhdGEgPSBmcmFtZS5tZXRhZGF0YTtcblxuICAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcblxuICAgIGlmICh0aGlzLnRpY2tlciA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgcGVyaW9kID0gMTAwMCAvIHRoaXMucGFyYW1zLmdldCgnZnJhbWVSYXRlJyk7IC8vIGluIG1zXG4gICAgICB0aGlzLnRpY2tlciA9IG5ldyBUaWNrZXIocGVyaW9kLCB0aGlzLnByb3BhZ2F0ZUZyYW1lKTtcbiAgICAgIHRoaXMudGlja2VyLnN0YXJ0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb3BhZ2F0ZUZyYW1lKGxvZ2ljYWxUaW1lKSB7XG4gICAgdGhpcy5mcmFtZS50aW1lID0gbG9naWNhbFRpbWUgLyAxMDAwO1xuXG4gICAgaWYgKHRoaXMuYnVmZmVySW5kZXggPiAwKVxuICAgICAgdGhpcy5fY29tcHV0ZUZyYW1lRGF0YSgpO1xuXG4gICAgc3VwZXIucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfY29tcHV0ZUZyYW1lRGF0YSgpIHtcbiAgICBjb25zdCBudW1GcmFtZXMgPSB0aGlzLmJ1ZmZlckluZGV4O1xuICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuXG4gICAgLy8gZ2V0IG1lYW5zIGZvciBlYWNoIHZlY3RvciBpbmRleFxuICAgIGNvbnN0IHN1bXMgPSB0aGlzLnN1bXM7XG4gICAgc3Vtcy5maWxsKDApO1xuXG4gICAgZm9yIChsZXQgZnJhbWVJbmRleCA9IDA7IGZyYW1lSW5kZXggPCBudW1GcmFtZXM7IGZyYW1lSW5kZXgrKykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZVNpemU7IGkrKylcbiAgICAgICAgc3Vtc1tpXSArPSBidWZmZXJbZnJhbWVTaXplICogZnJhbWVJbmRleCArIGldO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWVTaXplOyBpKyspXG4gICAgICBkYXRhW2ldID0gc3Vtc1tpXSAvIG51bUZyYW1lcztcblxuICAgIHRoaXMuYnVmZmVySW5kZXggPSAwO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNhbXBsZXI7XG4iXX0=
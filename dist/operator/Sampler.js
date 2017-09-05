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

if (!Array.prototype.fill) {
  Array.prototype.fill = function (val) {
    for (var i = 0; i < this.length; i++) {
      this[i] = val;
    }
  };
}

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
    min: 0.015,
    max: +Infinity,
    default: 0.05,
    constant: true,
    metas: {
      unit: 's'
    }
  }
};

/**
 * Module that resample an incomming vector frame at a given framerate.
 * If 0 frame has been received since last tick, output last values.
 * If more than 1 frame since last tick, output the mean of all the frames.
 *
 * @todo - add option for output type (i.e. mean, max, min, last, median, etc.)
 *
 * @param {Object} options - override default parameters
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

      var frameRate = this.params.get('frameRate'); // period is in ms

      this.streamParams.frameRate = frameRate;

      // build buffer
      var frameSize = this.streamParams.frameSize;
      var sourceFrameRate = prevStreamParams.frameRate;

      if (sourceFrameRate <= 0) sourceFrameRate = 10; // arbitrary value hoping that we won't loose data

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJmaWxsIiwidmFsIiwiaSIsImxlbmd0aCIsIkZsb2F0MzJBcnJheSIsInBhcmFtZXRlcnMiLCJmcmFtZVJhdGUiLCJ0eXBlIiwibWluIiwibWF4IiwiSW5maW5pdHkiLCJkZWZhdWx0IiwiY29uc3RhbnQiLCJtZXRhcyIsInVuaXQiLCJTYW1wbGVyIiwib3B0aW9ucyIsInRpY2tlciIsImJ1ZmZlciIsImJ1ZmZlckluZGV4IiwicHJvcGFnYXRlRnJhbWUiLCJiaW5kIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJwYXJhbXMiLCJnZXQiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVNpemUiLCJzb3VyY2VGcmFtZVJhdGUiLCJidWZmZXJTaXplIiwiTWF0aCIsImNlaWwiLCJtYXhCdWZmZXJJbmRleCIsInN1bXMiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJlbmRUaW1lIiwic3RvcCIsImZyYW1lIiwiZGF0YSIsInZhbHVlIiwicHJlcGFyZUZyYW1lIiwibWV0YWRhdGEiLCJwcm9jZXNzRnVuY3Rpb24iLCJwZXJpb2QiLCJzdGFydCIsImxvZ2ljYWxUaW1lIiwidGltZSIsIl9jb21wdXRlRnJhbWVEYXRhIiwibnVtRnJhbWVzIiwiZnJhbWVJbmRleCIsIkJhc2VMZm8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOztBQUNaOzs7Ozs7OztBQUVBLElBQUksQ0FBQ0MsTUFBTUMsU0FBTixDQUFnQkMsSUFBckIsRUFBMkI7QUFDekJGLFFBQU1DLFNBQU4sQ0FBZ0JDLElBQWhCLEdBQXVCLFVBQVNDLEdBQVQsRUFBYztBQUNuQyxTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLQyxNQUF6QixFQUFpQ0QsR0FBakMsRUFBc0M7QUFDcEMsV0FBS0EsQ0FBTCxJQUFVRCxH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QUFMLEtBQVdnQixPQUFPUyxZQUFZc0IsVUFBWixHQUF5Qi9DLENBQWhDLENBQVg7QUFERjtBQUVEOztBQUVELFdBQUssSUFBSUEsS0FBSSxDQUFiLEVBQWdCQSxLQUFJeUIsU0FBcEIsRUFBK0J6QixJQUEvQjtBQUNFb0MsYUFBS3BDLEVBQUwsSUFBVStCLEtBQUsvQixFQUFMLElBQVU4QyxTQUFwQjtBQURGLE9BR0EsS0FBSzdCLFdBQUwsR0FBbUIsQ0FBbkI7QUFDRDs7O0VBakhtQnRCLElBQUlxRCxPOztrQkFvSFhuQyxPIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBsZm8gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuaW1wb3J0IFRpY2tlciBmcm9tICdAaXJjYW0vdGlja2VyJztcblxuaWYgKCFBcnJheS5wcm90b3R5cGUuZmlsbCkge1xuICBBcnJheS5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbDtcbiAgICB9XG4gIH1cbn1cblxuaWYgKCFGbG9hdDMyQXJyYXkucHJvdG90eXBlLmZpbGwpIHtcbiAgRmxvYXQzMkFycmF5LnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24odmFsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBmcmFtZVJhdGU6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgbWluOiAwLjAxNSxcbiAgICBtYXg6ICtJbmZpbml0eSxcbiAgICBkZWZhdWx0OiAwLjA1LFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICAgIG1ldGFzOiB7XG4gICAgICB1bml0OiAncycsXG4gICAgfSxcbiAgfSxcbn07XG5cbi8qKlxuICogTW9kdWxlIHRoYXQgcmVzYW1wbGUgYW4gaW5jb21taW5nIHZlY3RvciBmcmFtZSBhdCBhIGdpdmVuIGZyYW1lcmF0ZS5cbiAqIElmIDAgZnJhbWUgaGFzIGJlZW4gcmVjZWl2ZWQgc2luY2UgbGFzdCB0aWNrLCBvdXRwdXQgbGFzdCB2YWx1ZXMuXG4gKiBJZiBtb3JlIHRoYW4gMSBmcmFtZSBzaW5jZSBsYXN0IHRpY2ssIG91dHB1dCB0aGUgbWVhbiBvZiBhbGwgdGhlIGZyYW1lcy5cbiAqXG4gKiBAdG9kbyAtIGFkZCBvcHRpb24gZm9yIG91dHB1dCB0eXBlIChpLmUuIG1lYW4sIG1heCwgbWluLCBsYXN0LCBtZWRpYW4sIGV0Yy4pXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvdmVycmlkZSBkZWZhdWx0IHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5mcmFtZVJhdGU9MjBdIC0gb3V0cHV0IHNhbXBsaW5nIHJhdGUgKGluIEh6KVxuICovXG5jbGFzcyBTYW1wbGVyIGV4dGVuZHMgbGZvLkJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcblxuICAgIHRoaXMudGlja2VyID0gbnVsbDtcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgdGhpcy5idWZmZXJJbmRleCA9IDA7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lID0gdGhpcy5wcm9wYWdhdGVGcmFtZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcykge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIGNvbnN0IGZyYW1lUmF0ZSA9IHRoaXMucGFyYW1zLmdldCgnZnJhbWVSYXRlJyk7IC8vIHBlcmlvZCBpcyBpbiBtc1xuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlID0gZnJhbWVSYXRlO1xuXG4gICAgLy8gYnVpbGQgYnVmZmVyXG4gICAgY29uc3QgZnJhbWVTaXplID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuICAgIGxldCBzb3VyY2VGcmFtZVJhdGUgPSBwcmV2U3RyZWFtUGFyYW1zLmZyYW1lUmF0ZTtcblxuICAgIGlmIChzb3VyY2VGcmFtZVJhdGUgPD0gMClcbiAgICAgIHNvdXJjZUZyYW1lUmF0ZSA9IDEwOyAvLyBhcmJpdHJhcnkgdmFsdWUgaG9waW5nIHRoYXQgd2Ugd29uJ3QgbG9vc2UgZGF0YVxuXG4gICAgLy8gbWF4IG51bWJlciBvZiBzb3VyY2UgZnJhbWVzIHRvIHN0b3JlXG4gICAgY29uc3QgYnVmZmVyU2l6ZSA9IE1hdGguY2VpbChzb3VyY2VGcmFtZVJhdGUgLyBmcmFtZVJhdGUpO1xuXG4gICAgdGhpcy5tYXhCdWZmZXJJbmRleCA9IGJ1ZmZlclNpemU7XG4gICAgdGhpcy5idWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlclNpemUgKiBmcmFtZVNpemUpO1xuICAgIHRoaXMuc3VtcyA9IG5ldyBGbG9hdDMyQXJyYXkoZnJhbWVTaXplKTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgZmluYWxpemVTdHJlYW0oZW5kVGltZSkge1xuICAgIC8vIEB0b2RvIC0gb3V0cHV0IGN1cnJlbnQgZGF0YSwgY29tcHV0ZSBwcm9wZXIgZW5kVGltZVxuICAgIHN1cGVyLmZpbmFsaXplU3RyZWFtKGVuZFRpbWUpO1xuICAgIHRoaXMudGlja2VyLnN0b3AoKTtcbiAgICB0aGlzLnRpY2tlciA9IG51bGw7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGlmICh0aGlzLmJ1ZmZlckluZGV4IDwgdGhpcy5tYXhCdWZmZXJJbmRleCkge1xuICAgICAgY29uc3QgZGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWVTaXplOyBpKyspXG4gICAgICAgIHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVySW5kZXggKiBmcmFtZVNpemUgKyBpXSA9IGRhdGFbaV07XG5cbiAgICAgIHRoaXMuYnVmZmVySW5kZXggKz0gMTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1NjYWxhcih2YWx1ZSkge1xuICAgIGlmICh0aGlzLmJ1ZmZlckluZGV4IDwgdGhpcy5tYXhCdWZmZXJJbmRleCkge1xuICAgICAgY29uc3QgZGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG5cbiAgICAgIHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVySW5kZXggKiBmcmFtZVNpemVdID0gZGF0YVswXTtcbiAgICAgIHRoaXMuYnVmZmVySW5kZXggKz0gMTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc0ZyYW1lKGZyYW1lKSB7XG4gICAgdGhpcy5wcmVwYXJlRnJhbWUoKTtcblxuICAgIHRoaXMuZnJhbWUubWV0YWRhdGEgPSBmcmFtZS5tZXRhZGF0YTtcblxuICAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcblxuICAgIGlmICh0aGlzLnRpY2tlciA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgcGVyaW9kID0gMTAwMCAvIHRoaXMucGFyYW1zLmdldCgnZnJhbWVSYXRlJyk7IC8vIGluIG1zXG4gICAgICB0aGlzLnRpY2tlciA9IG5ldyBUaWNrZXIocGVyaW9kLCB0aGlzLnByb3BhZ2F0ZUZyYW1lKTtcbiAgICAgIHRoaXMudGlja2VyLnN0YXJ0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb3BhZ2F0ZUZyYW1lKGxvZ2ljYWxUaW1lKSB7XG4gICAgdGhpcy5mcmFtZS50aW1lID0gbG9naWNhbFRpbWUgLyAxMDAwO1xuXG4gICAgaWYgKHRoaXMuYnVmZmVySW5kZXggPiAwKVxuICAgICAgdGhpcy5fY29tcHV0ZUZyYW1lRGF0YSgpO1xuXG4gICAgc3VwZXIucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfY29tcHV0ZUZyYW1lRGF0YSgpIHtcbiAgICBjb25zdCBudW1GcmFtZXMgPSB0aGlzLmJ1ZmZlckluZGV4O1xuICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuXG4gICAgLy8gZ2V0IG1lYW5zIGZvciBlYWNoIHZlY3RvciBpbmRleFxuICAgIGNvbnN0IHN1bXMgPSB0aGlzLnN1bXM7XG4gICAgc3Vtcy5maWxsKDApO1xuXG4gICAgZm9yIChsZXQgZnJhbWVJbmRleCA9IDA7IGZyYW1lSW5kZXggPCBudW1GcmFtZXM7IGZyYW1lSW5kZXgrKykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZVNpemU7IGkrKylcbiAgICAgICAgc3Vtc1tpXSArPSBidWZmZXJbZnJhbWVTaXplICogZnJhbWVJbmRleCArIGldO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWVTaXplOyBpKyspXG4gICAgICBkYXRhW2ldID0gc3Vtc1tpXSAvIG51bUZyYW1lcztcblxuICAgIHRoaXMuYnVmZmVySW5kZXggPSAwO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNhbXBsZXI7XG4iXX0=
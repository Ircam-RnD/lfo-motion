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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJmaWxsIiwidmFsIiwiaSIsImxlbmd0aCIsInBhcmFtZXRlcnMiLCJmcmFtZVJhdGUiLCJ0eXBlIiwibWluIiwibWF4IiwiSW5maW5pdHkiLCJkZWZhdWx0IiwiY29uc3RhbnQiLCJtZXRhcyIsInVuaXQiLCJTYW1wbGVyIiwib3B0aW9ucyIsInRpY2tlciIsImJ1ZmZlciIsImJ1ZmZlckluZGV4IiwicHJvcGFnYXRlRnJhbWUiLCJiaW5kIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJwYXJhbXMiLCJnZXQiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVNpemUiLCJzb3VyY2VGcmFtZVJhdGUiLCJidWZmZXJTaXplIiwiTWF0aCIsImNlaWwiLCJtYXhCdWZmZXJJbmRleCIsIkZsb2F0MzJBcnJheSIsInN1bXMiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJlbmRUaW1lIiwic3RvcCIsImZyYW1lIiwiZGF0YSIsInZhbHVlIiwicHJlcGFyZUZyYW1lIiwibWV0YWRhdGEiLCJwcm9jZXNzRnVuY3Rpb24iLCJwZXJpb2QiLCJzdGFydCIsImxvZ2ljYWxUaW1lIiwidGltZSIsIl9jb21wdXRlRnJhbWVEYXRhIiwibnVtRnJhbWVzIiwiZnJhbWVJbmRleCIsIkJhc2VMZm8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOztBQUNaOzs7Ozs7OztBQUVBLElBQUksQ0FBQ0MsTUFBTUMsU0FBTixDQUFnQkMsSUFBckIsRUFBMkI7QUFDekJGLFFBQU1DLFNBQU4sQ0FBZ0JDLElBQWhCLEdBQXVCLFVBQVNDLEdBQVQsRUFBYztBQUNuQyxTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLQyxNQUF6QixFQUFpQ0QsR0FBakMsRUFBc0M7QUFDcEMsV0FBS0EsQ0FBTCxJQUFVRCxH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SXFELE87O2tCQW9IWHBDLE8iLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5pbXBvcnQgVGlja2VyIGZyb20gJ0BpcmNhbS90aWNrZXInO1xuXG5pZiAoIUFycmF5LnByb3RvdHlwZS5maWxsKSB7XG4gIEFycmF5LnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24odmFsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBmcmFtZVJhdGU6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgbWluOiAwLjAxNSxcbiAgICBtYXg6ICtJbmZpbml0eSxcbiAgICBkZWZhdWx0OiAwLjA1LFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICAgIG1ldGFzOiB7XG4gICAgICB1bml0OiAncycsXG4gICAgfSxcbiAgfSxcbn07XG5cbi8qKlxuICogTW9kdWxlIHRoYXQgcmVzYW1wbGUgYW4gaW5jb21taW5nIHZlY3RvciBmcmFtZSBhdCBhIGdpdmVuIGZyYW1lcmF0ZS5cbiAqIElmIDAgZnJhbWUgaGFzIGJlZW4gcmVjZWl2ZWQgc2luY2UgbGFzdCB0aWNrLCBvdXRwdXQgbGFzdCB2YWx1ZXMuXG4gKiBJZiBtb3JlIHRoYW4gMSBmcmFtZSBzaW5jZSBsYXN0IHRpY2ssIG91dHB1dCB0aGUgbWVhbiBvZiBhbGwgdGhlIGZyYW1lcy5cbiAqXG4gKiBAdG9kbyAtIGFkZCBvcHRpb24gZm9yIG91dHB1dCB0eXBlIChpLmUuIG1lYW4sIG1heCwgbWluLCBsYXN0LCBtZWRpYW4sIGV0Yy4pXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvdmVycmlkZSBkZWZhdWx0IHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5mcmFtZVJhdGU9MjBdIC0gb3V0cHV0IHNhbXBsaW5nIHJhdGUgKGluIEh6KVxuICovXG5jbGFzcyBTYW1wbGVyIGV4dGVuZHMgbGZvLkJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcblxuICAgIHRoaXMudGlja2VyID0gbnVsbDtcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgdGhpcy5idWZmZXJJbmRleCA9IDA7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lID0gdGhpcy5wcm9wYWdhdGVGcmFtZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcykge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIGNvbnN0IGZyYW1lUmF0ZSA9IHRoaXMucGFyYW1zLmdldCgnZnJhbWVSYXRlJyk7IC8vIHBlcmlvZCBpcyBpbiBtc1xuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlID0gZnJhbWVSYXRlO1xuXG4gICAgLy8gYnVpbGQgYnVmZmVyXG4gICAgY29uc3QgZnJhbWVTaXplID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuICAgIGxldCBzb3VyY2VGcmFtZVJhdGUgPSBwcmV2U3RyZWFtUGFyYW1zLmZyYW1lUmF0ZTtcblxuICAgIGlmIChzb3VyY2VGcmFtZVJhdGUgPD0gMClcbiAgICAgIHNvdXJjZUZyYW1lUmF0ZSA9IDEwOyAvLyBhcmJpdHJhcnkgdmFsdWUgaG9waW5nIHRoYXQgd2Ugd29uJ3QgbG9vc2UgZGF0YVxuXG4gICAgLy8gbWF4IG51bWJlciBvZiBzb3VyY2UgZnJhbWVzIHRvIHN0b3JlXG4gICAgY29uc3QgYnVmZmVyU2l6ZSA9IE1hdGguY2VpbChzb3VyY2VGcmFtZVJhdGUgLyBmcmFtZVJhdGUpO1xuXG4gICAgdGhpcy5tYXhCdWZmZXJJbmRleCA9IGJ1ZmZlclNpemU7XG4gICAgdGhpcy5idWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlclNpemUgKiBmcmFtZVNpemUpO1xuICAgIHRoaXMuc3VtcyA9IG5ldyBGbG9hdDMyQXJyYXkoZnJhbWVTaXplKTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgZmluYWxpemVTdHJlYW0oZW5kVGltZSkge1xuICAgIC8vIEB0b2RvIC0gb3V0cHV0IGN1cnJlbnQgZGF0YSwgY29tcHV0ZSBwcm9wZXIgZW5kVGltZVxuICAgIHN1cGVyLmZpbmFsaXplU3RyZWFtKGVuZFRpbWUpO1xuICAgIHRoaXMudGlja2VyLnN0b3AoKTtcbiAgICB0aGlzLnRpY2tlciA9IG51bGw7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGlmICh0aGlzLmJ1ZmZlckluZGV4IDwgdGhpcy5tYXhCdWZmZXJJbmRleCkge1xuICAgICAgY29uc3QgZGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWVTaXplOyBpKyspXG4gICAgICAgIHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVySW5kZXggKiBmcmFtZVNpemUgKyBpXSA9IGRhdGFbaV07XG5cbiAgICAgIHRoaXMuYnVmZmVySW5kZXggKz0gMTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1NjYWxhcih2YWx1ZSkge1xuICAgIGlmICh0aGlzLmJ1ZmZlckluZGV4IDwgdGhpcy5tYXhCdWZmZXJJbmRleCkge1xuICAgICAgY29uc3QgZGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG5cbiAgICAgIHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVySW5kZXggKiBmcmFtZVNpemVdID0gZGF0YVswXTtcbiAgICAgIHRoaXMuYnVmZmVySW5kZXggKz0gMTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc0ZyYW1lKGZyYW1lKSB7XG4gICAgdGhpcy5wcmVwYXJlRnJhbWUoKTtcblxuICAgIHRoaXMuZnJhbWUubWV0YWRhdGEgPSBmcmFtZS5tZXRhZGF0YTtcblxuICAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcblxuICAgIGlmICh0aGlzLnRpY2tlciA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgcGVyaW9kID0gMTAwMCAvIHRoaXMucGFyYW1zLmdldCgnZnJhbWVSYXRlJyk7IC8vIGluIG1zXG4gICAgICB0aGlzLnRpY2tlciA9IG5ldyBUaWNrZXIocGVyaW9kLCB0aGlzLnByb3BhZ2F0ZUZyYW1lKTtcbiAgICAgIHRoaXMudGlja2VyLnN0YXJ0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb3BhZ2F0ZUZyYW1lKGxvZ2ljYWxUaW1lKSB7XG4gICAgdGhpcy5mcmFtZS50aW1lID0gbG9naWNhbFRpbWUgLyAxMDAwO1xuXG4gICAgaWYgKHRoaXMuYnVmZmVySW5kZXggPiAwKVxuICAgICAgdGhpcy5fY29tcHV0ZUZyYW1lRGF0YSgpO1xuXG4gICAgc3VwZXIucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfY29tcHV0ZUZyYW1lRGF0YSgpIHtcbiAgICBjb25zdCBudW1GcmFtZXMgPSB0aGlzLmJ1ZmZlckluZGV4O1xuICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuXG4gICAgLy8gZ2V0IG1lYW5zIGZvciBlYWNoIHZlY3RvciBpbmRleFxuICAgIGNvbnN0IHN1bXMgPSB0aGlzLnN1bXM7XG4gICAgc3Vtcy5maWxsKDApO1xuXG4gICAgZm9yIChsZXQgZnJhbWVJbmRleCA9IDA7IGZyYW1lSW5kZXggPCBudW1GcmFtZXM7IGZyYW1lSW5kZXgrKykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZVNpemU7IGkrKylcbiAgICAgICAgc3Vtc1tpXSArPSBidWZmZXJbZnJhbWVTaXplICogZnJhbWVJbmRleCArIGldO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWVTaXplOyBpKyspXG4gICAgICBkYXRhW2ldID0gc3Vtc1tpXSAvIG51bUZyYW1lcztcblxuICAgIHRoaXMuYnVmZmVySW5kZXggPSAwO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNhbXBsZXI7XG4iXX0=
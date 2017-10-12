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

      var frameRate = this.params.get('frameRate'); // period is in ms

      this.streamParams.frameRate = frameRate;

      // build buffer
      var frameSize = this.streamParams.frameSize;
      var sourceFrameRate = prevStreamParams.frameRate;

      console.log('framesize : ' + frameSize);
      console.log('sourceframerate : ' + sourceFrameRate);

      if (sourceFrameRate <= 0 || !isFinite(sourceFrameRate)) sourceFrameRate = 10; // arbitrary value hoping that we won't loose data

      // max number of source frames to store
      var bufferSize = Math.ceil(sourceFrameRate / frameRate);

      console.log('buffersize : ' + bufferSize);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiRmxvYXQzMkFycmF5IiwicHJvdG90eXBlIiwiZmlsbCIsInZhbCIsImkiLCJsZW5ndGgiLCJwYXJhbWV0ZXJzIiwiZnJhbWVSYXRlIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsImNvbnN0YW50IiwibWV0YXMiLCJ1bml0IiwiU2FtcGxlciIsIm9wdGlvbnMiLCJ0aWNrZXIiLCJidWZmZXIiLCJidWZmZXJJbmRleCIsInByb3BhZ2F0ZUZyYW1lIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwicGFyYW1zIiwiZ2V0Iiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwic291cmNlRnJhbWVSYXRlIiwiY29uc29sZSIsImxvZyIsImlzRmluaXRlIiwiYnVmZmVyU2l6ZSIsIk1hdGgiLCJjZWlsIiwibWF4QnVmZmVySW5kZXgiLCJzdW1zIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZW5kVGltZSIsInN0b3AiLCJmcmFtZSIsImRhdGEiLCJ2YWx1ZSIsInByZXBhcmVGcmFtZSIsIm1ldGFkYXRhIiwicHJvY2Vzc0Z1bmN0aW9uIiwicGVyaW9kIiwic3RhcnQiLCJsb2dpY2FsVGltZSIsInRpbWUiLCJfY29tcHV0ZUZyYW1lRGF0YSIsIm51bUZyYW1lcyIsImZyYW1lSW5kZXgiLCJCYXNlTGZvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7SUFBWUEsRzs7QUFDWjs7Ozs7Ozs7QUFFQSxJQUFJLENBQUNDLGFBQWFDLFNBQWIsQ0FBdUJDLElBQTVCLEVBQWtDO0FBQ2hDRixlQUFhQyxTQUFiLENBQXVCQyxJQUF2QixHQUE4QixVQUFTQyxHQUFULEVBQWM7QUFDMUMsU0FBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS0MsTUFBekIsRUFBaUNELEdBQWpDLEVBQXNDO0FBQ3BD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QUFFRCxXQUFLLElBQUlBLEtBQUksQ0FBYixFQUFnQkEsS0FBSXdCLFNBQXBCLEVBQStCeEIsSUFBL0I7QUFDRXNDLGFBQUt0QyxFQUFMLElBQVVpQyxLQUFLakMsRUFBTCxJQUFVZ0QsU0FBcEI7QUFERixPQUdBLEtBQUtoQyxXQUFMLEdBQW1CLENBQW5CO0FBQ0Q7OztFQXRIbUJyQixJQUFJdUQsTzs7a0JBeUhYdEMsTyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmby9jb3JlJztcbmltcG9ydCBUaWNrZXIgZnJvbSAnQGlyY2FtL3RpY2tlcic7XG5cbmlmICghRmxvYXQzMkFycmF5LnByb3RvdHlwZS5maWxsKSB7XG4gIEZsb2F0MzJBcnJheS5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbDtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgZnJhbWVSYXRlOiB7XG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIG1pbjogMC4wMTUsXG4gICAgbWF4OiArSW5maW5pdHksXG4gICAgZGVmYXVsdDogMC4wNSxcbiAgICBjb25zdGFudDogdHJ1ZSxcbiAgICBtZXRhczoge1xuICAgICAgdW5pdDogJ3MnLFxuICAgIH0sXG4gIH0sXG59O1xuXG4vKipcbiAqIE1vZHVsZSB0aGF0IHJlc2FtcGxlIGFuIGluY29tbWluZyB2ZWN0b3IgZnJhbWUgYXQgYSBnaXZlbiBmcmFtZXJhdGUuXG4gKiBJZiAwIGZyYW1lIGhhcyBiZWVuIHJlY2VpdmVkIHNpbmNlIGxhc3QgdGljaywgb3V0cHV0IGxhc3QgdmFsdWVzLlxuICogSWYgbW9yZSB0aGFuIDEgZnJhbWUgc2luY2UgbGFzdCB0aWNrLCBvdXRwdXQgdGhlIG1lYW4gb2YgYWxsIHRoZSBmcmFtZXMuXG4gKlxuICogQHRvZG8gLSBhZGQgb3B0aW9uIGZvciBvdXRwdXQgdHlwZSAoaS5lLiBtZWFuLCBtYXgsIG1pbiwgbGFzdCwgbWVkaWFuLCBldGMuKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZnJhbWVSYXRlPTIwXSAtIG91dHB1dCBzYW1wbGluZyByYXRlIChpbiBIeilcbiAqL1xuY2xhc3MgU2FtcGxlciBleHRlbmRzIGxmby5CYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLnRpY2tlciA9IG51bGw7XG4gICAgdGhpcy5idWZmZXIgPSBudWxsO1xuICAgIHRoaXMuYnVmZmVySW5kZXggPSAwO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVGcmFtZSA9IHRoaXMucHJvcGFnYXRlRnJhbWUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICBjb25zdCBmcmFtZVJhdGUgPSB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lUmF0ZScpOyAvLyBwZXJpb2QgaXMgaW4gbXNcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IGZyYW1lUmF0ZTtcblxuICAgIC8vIGJ1aWxkIGJ1ZmZlclxuICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcbiAgICBsZXQgc291cmNlRnJhbWVSYXRlID0gcHJldlN0cmVhbVBhcmFtcy5mcmFtZVJhdGU7XG5cbiAgICBjb25zb2xlLmxvZygnZnJhbWVzaXplIDogJyArIGZyYW1lU2l6ZSk7XG4gICAgY29uc29sZS5sb2coJ3NvdXJjZWZyYW1lcmF0ZSA6ICcgKyBzb3VyY2VGcmFtZVJhdGUpO1xuXG4gICAgaWYgKHNvdXJjZUZyYW1lUmF0ZSA8PSAwIHx8ICFpc0Zpbml0ZShzb3VyY2VGcmFtZVJhdGUpKVxuICAgICAgc291cmNlRnJhbWVSYXRlID0gMTA7IC8vIGFyYml0cmFyeSB2YWx1ZSBob3BpbmcgdGhhdCB3ZSB3b24ndCBsb29zZSBkYXRhXG5cbiAgICAvLyBtYXggbnVtYmVyIG9mIHNvdXJjZSBmcmFtZXMgdG8gc3RvcmVcbiAgICBjb25zdCBidWZmZXJTaXplID0gTWF0aC5jZWlsKHNvdXJjZUZyYW1lUmF0ZSAvIGZyYW1lUmF0ZSk7XG5cbiAgICBjb25zb2xlLmxvZygnYnVmZmVyc2l6ZSA6ICcgKyBidWZmZXJTaXplKTtcblxuICAgIHRoaXMubWF4QnVmZmVySW5kZXggPSBidWZmZXJTaXplO1xuICAgIHRoaXMuYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheShidWZmZXJTaXplICogZnJhbWVTaXplKTtcbiAgICB0aGlzLnN1bXMgPSBuZXcgRmxvYXQzMkFycmF5KGZyYW1lU2l6ZSk7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIGZpbmFsaXplU3RyZWFtKGVuZFRpbWUpIHtcbiAgICAvLyBAdG9kbyAtIG91dHB1dCBjdXJyZW50IGRhdGEsIGNvbXB1dGUgcHJvcGVyIGVuZFRpbWVcbiAgICBzdXBlci5maW5hbGl6ZVN0cmVhbShlbmRUaW1lKTtcbiAgICB0aGlzLnRpY2tlci5zdG9wKCk7XG4gICAgdGhpcy50aWNrZXIgPSBudWxsO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBpZiAodGhpcy5idWZmZXJJbmRleCA8IHRoaXMubWF4QnVmZmVySW5kZXgpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBmcmFtZS5kYXRhO1xuICAgICAgY29uc3QgZnJhbWVTaXplID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lU2l6ZTsgaSsrKVxuICAgICAgICB0aGlzLmJ1ZmZlclt0aGlzLmJ1ZmZlckluZGV4ICogZnJhbWVTaXplICsgaV0gPSBkYXRhW2ldO1xuXG4gICAgICB0aGlzLmJ1ZmZlckluZGV4ICs9IDE7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTY2FsYXIodmFsdWUpIHtcbiAgICBpZiAodGhpcy5idWZmZXJJbmRleCA8IHRoaXMubWF4QnVmZmVySW5kZXgpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBmcmFtZS5kYXRhO1xuICAgICAgY29uc3QgZnJhbWVTaXplID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuXG4gICAgICB0aGlzLmJ1ZmZlclt0aGlzLmJ1ZmZlckluZGV4ICogZnJhbWVTaXplXSA9IGRhdGFbMF07XG4gICAgICB0aGlzLmJ1ZmZlckluZGV4ICs9IDE7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NGcmFtZShmcmFtZSkge1xuICAgIHRoaXMucHJlcGFyZUZyYW1lKCk7XG5cbiAgICB0aGlzLmZyYW1lLm1ldGFkYXRhID0gZnJhbWUubWV0YWRhdGE7XG5cbiAgICB0aGlzLnByb2Nlc3NGdW5jdGlvbihmcmFtZSk7XG5cbiAgICBpZiAodGhpcy50aWNrZXIgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHBlcmlvZCA9IDEwMDAgLyB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lUmF0ZScpOyAvLyBpbiBtc1xuICAgICAgdGhpcy50aWNrZXIgPSBuZXcgVGlja2VyKHBlcmlvZCwgdGhpcy5wcm9wYWdhdGVGcmFtZSk7XG4gICAgICB0aGlzLnRpY2tlci5zdGFydCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9wYWdhdGVGcmFtZShsb2dpY2FsVGltZSkge1xuICAgIHRoaXMuZnJhbWUudGltZSA9IGxvZ2ljYWxUaW1lIC8gMTAwMDtcblxuICAgIGlmICh0aGlzLmJ1ZmZlckluZGV4ID4gMClcbiAgICAgIHRoaXMuX2NvbXB1dGVGcmFtZURhdGEoKTtcblxuICAgIHN1cGVyLnByb3BhZ2F0ZUZyYW1lKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2NvbXB1dGVGcmFtZURhdGEoKSB7XG4gICAgY29uc3QgbnVtRnJhbWVzID0gdGhpcy5idWZmZXJJbmRleDtcbiAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcblxuICAgIC8vIGdldCBtZWFucyBmb3IgZWFjaCB2ZWN0b3IgaW5kZXhcbiAgICBjb25zdCBzdW1zID0gdGhpcy5zdW1zO1xuICAgIHN1bXMuZmlsbCgwKTtcblxuICAgIGZvciAobGV0IGZyYW1lSW5kZXggPSAwOyBmcmFtZUluZGV4IDwgbnVtRnJhbWVzOyBmcmFtZUluZGV4KyspIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWVTaXplOyBpKyspXG4gICAgICAgIHN1bXNbaV0gKz0gYnVmZmVyW2ZyYW1lU2l6ZSAqIGZyYW1lSW5kZXggKyBpXTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lU2l6ZTsgaSsrKVxuICAgICAgZGF0YVtpXSA9IHN1bXNbaV0gLyBudW1GcmFtZXM7XG5cbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gMDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTYW1wbGVyO1xuIl19
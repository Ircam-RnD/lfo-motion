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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiRmxvYXQzMkFycmF5IiwicHJvdG90eXBlIiwiZmlsbCIsInZhbCIsImkiLCJsZW5ndGgiLCJwYXJhbWV0ZXJzIiwiZnJhbWVSYXRlIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsImNvbnN0YW50IiwibWV0YXMiLCJ1bml0IiwiU2FtcGxlciIsIm9wdGlvbnMiLCJ0aWNrZXIiLCJidWZmZXIiLCJidWZmZXJJbmRleCIsInByb3BhZ2F0ZUZyYW1lIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwicGFyYW1zIiwiZ2V0Iiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwic291cmNlRnJhbWVSYXRlIiwiaXNGaW5pdGUiLCJidWZmZXJTaXplIiwiTWF0aCIsImNlaWwiLCJtYXhCdWZmZXJJbmRleCIsInN1bXMiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJlbmRUaW1lIiwic3RvcCIsImZyYW1lIiwiZGF0YSIsInZhbHVlIiwicHJlcGFyZUZyYW1lIiwibWV0YWRhdGEiLCJwcm9jZXNzRnVuY3Rpb24iLCJwZXJpb2QiLCJUaWNrZXIiLCJzdGFydCIsImxvZ2ljYWxUaW1lIiwidGltZSIsIl9jb21wdXRlRnJhbWVEYXRhIiwibnVtRnJhbWVzIiwiZnJhbWVJbmRleCIsIkJhc2VMZm8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOztBQUNaOzs7Ozs7OztBQUVBLElBQUksQ0FBQ0MsYUFBYUMsU0FBYixDQUF1QkMsSUFBNUIsRUFBa0M7QUFDaENGLGVBQWFDLFNBQWIsQ0FBdUJDLElBQXZCLEdBQThCLFVBQVNDLEdBQVQsRUFBYztBQUMxQyxTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLQyxNQUF6QixFQUFpQ0QsR0FBakMsRUFBc0M7QUFDcEMsV0FBS0Es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QUFwQjtBQURGLE9BR0EsS0FBSy9CLFdBQUwsR0FBbUIsQ0FBbkI7QUFDRDs7O0VBakhtQnJCLElBQUlzRCxPOztrQkFvSFhyQyxPIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBsZm8gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuaW1wb3J0IFRpY2tlciBmcm9tICdAaXJjYW0vdGlja2VyJztcblxuaWYgKCFGbG9hdDMyQXJyYXkucHJvdG90eXBlLmZpbGwpIHtcbiAgRmxvYXQzMkFycmF5LnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24odmFsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBmcmFtZVJhdGU6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgbWluOiAxLFxuICAgIG1heDogK0luZmluaXR5LFxuICAgIGRlZmF1bHQ6IDIwLFxuICAgIGNvbnN0YW50OiB0cnVlLFxuICAgIG1ldGFzOiB7XG4gICAgICB1bml0OiAnSHonLFxuICAgIH0sXG4gIH0sXG59O1xuXG4vKipcbiAqIE1vZHVsZSB0aGF0IG5hw692ZWx5IHJlc2FtcGxlIGFuIGluY29tbWluZyB2ZWN0b3IgZnJhbWUgYXQgYSBnaXZlbiBmcmFtZXJhdGUuXG4gKiBJZiAwIGZyYW1lIGhhcyBiZWVuIHJlY2VpdmVkIHNpbmNlIGxhc3QgdGljaywgb3V0cHV0IGxhc3QgdmFsdWVzLlxuICogSWYgbW9yZSB0aGFuIDEgZnJhbWUgc2luY2UgbGFzdCB0aWNrLCBvdXRwdXQgdGhlIG1lYW4gb2YgYWxsIHRoZSBmcmFtZXMuXG4gKlxuICogQG1lbWJlcm9mIG9wZXJhdG9yXG4gKlxuICogQHRvZG8gLSBhZGQgb3B0aW9uIGZvciBvdXRwdXQgdHlwZSAoaS5lLiBtZWFuLCBtYXgsIG1pbiwgbGFzdCwgbWVkaWFuLCBldGMuKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZnJhbWVSYXRlPTIwXSAtIG91dHB1dCBzYW1wbGluZyByYXRlIChpbiBIeilcbiAqL1xuY2xhc3MgU2FtcGxlciBleHRlbmRzIGxmby5CYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLnRpY2tlciA9IG51bGw7XG4gICAgdGhpcy5idWZmZXIgPSBudWxsO1xuICAgIHRoaXMuYnVmZmVySW5kZXggPSAwO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVGcmFtZSA9IHRoaXMucHJvcGFnYXRlRnJhbWUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICBjb25zdCBmcmFtZVJhdGUgPSB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lUmF0ZScpOyAvLyBwZXJpb2QgaXMgaW4gSHpcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IGZyYW1lUmF0ZTtcblxuICAgIC8vIGJ1aWxkIGJ1ZmZlclxuICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcbiAgICBsZXQgc291cmNlRnJhbWVSYXRlID0gcHJldlN0cmVhbVBhcmFtcy5mcmFtZVJhdGU7XG5cbiAgICBpZiAoc291cmNlRnJhbWVSYXRlIDw9IDAgfHwgIWlzRmluaXRlKHNvdXJjZUZyYW1lUmF0ZSkpXG4gICAgICBzb3VyY2VGcmFtZVJhdGUgPSAxMDA7IC8vIGFyYml0cmFyeSB2YWx1ZSBob3BpbmcgdGhhdCB3ZSB3b24ndCBsb29zZSBkYXRhXG5cbiAgICAvLyBtYXggbnVtYmVyIG9mIHNvdXJjZSBmcmFtZXMgdG8gc3RvcmVcbiAgICBjb25zdCBidWZmZXJTaXplID0gTWF0aC5jZWlsKHNvdXJjZUZyYW1lUmF0ZSAvIGZyYW1lUmF0ZSk7XG5cbiAgICB0aGlzLm1heEJ1ZmZlckluZGV4ID0gYnVmZmVyU2l6ZTtcbiAgICB0aGlzLmJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyU2l6ZSAqIGZyYW1lU2l6ZSk7XG4gICAgdGhpcy5zdW1zID0gbmV3IEZsb2F0MzJBcnJheShmcmFtZVNpemUpO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBmaW5hbGl6ZVN0cmVhbShlbmRUaW1lKSB7XG4gICAgLy8gQHRvZG8gLSBvdXRwdXQgY3VycmVudCBkYXRhLCBjb21wdXRlIHByb3BlciBlbmRUaW1lXG4gICAgc3VwZXIuZmluYWxpemVTdHJlYW0oZW5kVGltZSk7XG4gICAgdGhpcy50aWNrZXIuc3RvcCgpO1xuICAgIHRoaXMudGlja2VyID0gbnVsbDtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgaWYgKHRoaXMuYnVmZmVySW5kZXggPCB0aGlzLm1heEJ1ZmZlckluZGV4KSB7XG4gICAgICBjb25zdCBkYXRhID0gZnJhbWUuZGF0YTtcbiAgICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZVNpemU7IGkrKylcbiAgICAgICAgdGhpcy5idWZmZXJbdGhpcy5idWZmZXJJbmRleCAqIGZyYW1lU2l6ZSArIGldID0gZGF0YVtpXTtcblxuICAgICAgdGhpcy5idWZmZXJJbmRleCArPSAxO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU2NhbGFyKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuYnVmZmVySW5kZXggPCB0aGlzLm1heEJ1ZmZlckluZGV4KSB7XG4gICAgICBjb25zdCBkYXRhID0gZnJhbWUuZGF0YTtcbiAgICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcblxuICAgICAgdGhpcy5idWZmZXJbdGhpcy5idWZmZXJJbmRleCAqIGZyYW1lU2l6ZV0gPSBkYXRhWzBdO1xuICAgICAgdGhpcy5idWZmZXJJbmRleCArPSAxO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzRnJhbWUoZnJhbWUpIHtcbiAgICB0aGlzLnByZXBhcmVGcmFtZSgpO1xuXG4gICAgdGhpcy5mcmFtZS5tZXRhZGF0YSA9IGZyYW1lLm1ldGFkYXRhO1xuXG4gICAgdGhpcy5wcm9jZXNzRnVuY3Rpb24oZnJhbWUpO1xuXG4gICAgaWYgKHRoaXMudGlja2VyID09PSBudWxsKSB7XG4gICAgICBjb25zdCBwZXJpb2QgPSAxMDAwIC8gdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVJhdGUnKTsgLy8gaW4gbXNcbiAgICAgIHRoaXMudGlja2VyID0gbmV3IFRpY2tlcihwZXJpb2QsIHRoaXMucHJvcGFnYXRlRnJhbWUpO1xuICAgICAgdGhpcy50aWNrZXIuc3RhcnQoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvcGFnYXRlRnJhbWUobG9naWNhbFRpbWUpIHtcbiAgICB0aGlzLmZyYW1lLnRpbWUgPSBsb2dpY2FsVGltZSAvIDEwMDA7XG5cbiAgICBpZiAodGhpcy5idWZmZXJJbmRleCA+IDApXG4gICAgICB0aGlzLl9jb21wdXRlRnJhbWVEYXRhKCk7XG5cbiAgICBzdXBlci5wcm9wYWdhdGVGcmFtZSgpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9jb21wdXRlRnJhbWVEYXRhKCkge1xuICAgIGNvbnN0IG51bUZyYW1lcyA9IHRoaXMuYnVmZmVySW5kZXg7XG4gICAgY29uc3QgZnJhbWVTaXplID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmZyYW1lLmRhdGE7XG5cbiAgICAvLyBnZXQgbWVhbnMgZm9yIGVhY2ggdmVjdG9yIGluZGV4XG4gICAgY29uc3Qgc3VtcyA9IHRoaXMuc3VtcztcbiAgICBzdW1zLmZpbGwoMCk7XG5cbiAgICBmb3IgKGxldCBmcmFtZUluZGV4ID0gMDsgZnJhbWVJbmRleCA8IG51bUZyYW1lczsgZnJhbWVJbmRleCsrKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lU2l6ZTsgaSsrKVxuICAgICAgICBzdW1zW2ldICs9IGJ1ZmZlcltmcmFtZVNpemUgKiBmcmFtZUluZGV4ICsgaV07XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZVNpemU7IGkrKylcbiAgICAgIGRhdGFbaV0gPSBzdW1zW2ldIC8gbnVtRnJhbWVzO1xuXG4gICAgdGhpcy5idWZmZXJJbmRleCA9IDA7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2FtcGxlcjtcbiJdfQ==
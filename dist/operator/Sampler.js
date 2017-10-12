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

      if (sourceFrameRate <= 0 || !isFinite(sourceFrameRate)) sourceFrameRate = 10; // arbitrary value hoping that we won't loose data

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiRmxvYXQzMkFycmF5IiwicHJvdG90eXBlIiwiZmlsbCIsInZhbCIsImkiLCJsZW5ndGgiLCJwYXJhbWV0ZXJzIiwiZnJhbWVSYXRlIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsImNvbnN0YW50IiwibWV0YXMiLCJ1bml0IiwiU2FtcGxlciIsIm9wdGlvbnMiLCJ0aWNrZXIiLCJidWZmZXIiLCJidWZmZXJJbmRleCIsInByb3BhZ2F0ZUZyYW1lIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwicGFyYW1zIiwiZ2V0Iiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwic291cmNlRnJhbWVSYXRlIiwiaXNGaW5pdGUiLCJidWZmZXJTaXplIiwiTWF0aCIsImNlaWwiLCJtYXhCdWZmZXJJbmRleCIsInN1bXMiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJlbmRUaW1lIiwic3RvcCIsImZyYW1lIiwiZGF0YSIsInZhbHVlIiwicHJlcGFyZUZyYW1lIiwibWV0YWRhdGEiLCJwcm9jZXNzRnVuY3Rpb24iLCJwZXJpb2QiLCJzdGFydCIsImxvZ2ljYWxUaW1lIiwidGltZSIsIl9jb21wdXRlRnJhbWVEYXRhIiwibnVtRnJhbWVzIiwiZnJhbWVJbmRleCIsIkJhc2VMZm8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOztBQUNaOzs7Ozs7OztBQUVBLElBQUksQ0FBQ0MsYUFBYUMsU0FBYixDQUF1QkMsSUFBNUIsRUFBa0M7QUFDaENGLGVBQWFDLFNBQWIsQ0FBdUJDLElBQXZCLEdBQThCLFVBQVNDLEdBQVQsRUFBYztBQUMxQyxTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLQyxNQUF6QixFQUFpQ0QsR0FBakMsRUFBc0M7QUFDcEMsV0FBS0EsQ0FBTCxJQUFV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V0FBTCxHQUFtQixDQUFuQjtBQUNEOzs7RUFqSG1CckIsSUFBSXFELE87O2tCQW9IWHBDLE8iLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5pbXBvcnQgVGlja2VyIGZyb20gJ0BpcmNhbS90aWNrZXInO1xuXG5pZiAoIUZsb2F0MzJBcnJheS5wcm90b3R5cGUuZmlsbCkge1xuICBGbG9hdDMyQXJyYXkucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbih2YWwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWw7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IHBhcmFtZXRlcnMgPSB7XG4gIGZyYW1lUmF0ZToge1xuICAgIHR5cGU6ICdpbnRlZ2VyJyxcbiAgICBtaW46IDAuMDE1LFxuICAgIG1heDogK0luZmluaXR5LFxuICAgIGRlZmF1bHQ6IDAuMDUsXG4gICAgY29uc3RhbnQ6IHRydWUsXG4gICAgbWV0YXM6IHtcbiAgICAgIHVuaXQ6ICdzJyxcbiAgICB9LFxuICB9LFxufTtcblxuLyoqXG4gKiBNb2R1bGUgdGhhdCByZXNhbXBsZSBhbiBpbmNvbW1pbmcgdmVjdG9yIGZyYW1lIGF0IGEgZ2l2ZW4gZnJhbWVyYXRlLlxuICogSWYgMCBmcmFtZSBoYXMgYmVlbiByZWNlaXZlZCBzaW5jZSBsYXN0IHRpY2ssIG91dHB1dCBsYXN0IHZhbHVlcy5cbiAqIElmIG1vcmUgdGhhbiAxIGZyYW1lIHNpbmNlIGxhc3QgdGljaywgb3V0cHV0IHRoZSBtZWFuIG9mIGFsbCB0aGUgZnJhbWVzLlxuICpcbiAqIEB0b2RvIC0gYWRkIG9wdGlvbiBmb3Igb3V0cHV0IHR5cGUgKGkuZS4gbWVhbiwgbWF4LCBtaW4sIGxhc3QsIG1lZGlhbiwgZXRjLilcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmZyYW1lUmF0ZT0yMF0gLSBvdXRwdXQgc2FtcGxpbmcgcmF0ZSAoaW4gSHopXG4gKi9cbmNsYXNzIFNhbXBsZXIgZXh0ZW5kcyBsZm8uQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy50aWNrZXIgPSBudWxsO1xuICAgIHRoaXMuYnVmZmVyID0gbnVsbDtcbiAgICB0aGlzLmJ1ZmZlckluZGV4ID0gMDtcblxuICAgIHRoaXMucHJvcGFnYXRlRnJhbWUgPSB0aGlzLnByb3BhZ2F0ZUZyYW1lLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgY29uc3QgZnJhbWVSYXRlID0gdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVJhdGUnKTsgLy8gcGVyaW9kIGlzIGluIG1zXG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSBmcmFtZVJhdGU7XG5cbiAgICAvLyBidWlsZCBidWZmZXJcbiAgICBjb25zdCBmcmFtZVNpemUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG4gICAgbGV0IHNvdXJjZUZyYW1lUmF0ZSA9IHByZXZTdHJlYW1QYXJhbXMuZnJhbWVSYXRlO1xuXG4gICAgaWYgKHNvdXJjZUZyYW1lUmF0ZSA8PSAwIHx8ICFpc0Zpbml0ZShzb3VyY2VGcmFtZVJhdGUpKVxuICAgICAgc291cmNlRnJhbWVSYXRlID0gMTA7IC8vIGFyYml0cmFyeSB2YWx1ZSBob3BpbmcgdGhhdCB3ZSB3b24ndCBsb29zZSBkYXRhXG5cbiAgICAvLyBtYXggbnVtYmVyIG9mIHNvdXJjZSBmcmFtZXMgdG8gc3RvcmVcbiAgICBjb25zdCBidWZmZXJTaXplID0gTWF0aC5jZWlsKHNvdXJjZUZyYW1lUmF0ZSAvIGZyYW1lUmF0ZSk7XG5cbiAgICB0aGlzLm1heEJ1ZmZlckluZGV4ID0gYnVmZmVyU2l6ZTtcbiAgICB0aGlzLmJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyU2l6ZSAqIGZyYW1lU2l6ZSk7XG4gICAgdGhpcy5zdW1zID0gbmV3IEZsb2F0MzJBcnJheShmcmFtZVNpemUpO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBmaW5hbGl6ZVN0cmVhbShlbmRUaW1lKSB7XG4gICAgLy8gQHRvZG8gLSBvdXRwdXQgY3VycmVudCBkYXRhLCBjb21wdXRlIHByb3BlciBlbmRUaW1lXG4gICAgc3VwZXIuZmluYWxpemVTdHJlYW0oZW5kVGltZSk7XG4gICAgdGhpcy50aWNrZXIuc3RvcCgpO1xuICAgIHRoaXMudGlja2VyID0gbnVsbDtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgaWYgKHRoaXMuYnVmZmVySW5kZXggPCB0aGlzLm1heEJ1ZmZlckluZGV4KSB7XG4gICAgICBjb25zdCBkYXRhID0gZnJhbWUuZGF0YTtcbiAgICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZVNpemU7IGkrKylcbiAgICAgICAgdGhpcy5idWZmZXJbdGhpcy5idWZmZXJJbmRleCAqIGZyYW1lU2l6ZSArIGldID0gZGF0YVtpXTtcblxuICAgICAgdGhpcy5idWZmZXJJbmRleCArPSAxO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU2NhbGFyKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuYnVmZmVySW5kZXggPCB0aGlzLm1heEJ1ZmZlckluZGV4KSB7XG4gICAgICBjb25zdCBkYXRhID0gZnJhbWUuZGF0YTtcbiAgICAgIGNvbnN0IGZyYW1lU2l6ZSA9IHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTtcblxuICAgICAgdGhpcy5idWZmZXJbdGhpcy5idWZmZXJJbmRleCAqIGZyYW1lU2l6ZV0gPSBkYXRhWzBdO1xuICAgICAgdGhpcy5idWZmZXJJbmRleCArPSAxO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzRnJhbWUoZnJhbWUpIHtcbiAgICB0aGlzLnByZXBhcmVGcmFtZSgpO1xuXG4gICAgdGhpcy5mcmFtZS5tZXRhZGF0YSA9IGZyYW1lLm1ldGFkYXRhO1xuXG4gICAgdGhpcy5wcm9jZXNzRnVuY3Rpb24oZnJhbWUpO1xuXG4gICAgaWYgKHRoaXMudGlja2VyID09PSBudWxsKSB7XG4gICAgICBjb25zdCBwZXJpb2QgPSAxMDAwIC8gdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVJhdGUnKTsgLy8gaW4gbXNcbiAgICAgIHRoaXMudGlja2VyID0gbmV3IFRpY2tlcihwZXJpb2QsIHRoaXMucHJvcGFnYXRlRnJhbWUpO1xuICAgICAgdGhpcy50aWNrZXIuc3RhcnQoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvcGFnYXRlRnJhbWUobG9naWNhbFRpbWUpIHtcbiAgICB0aGlzLmZyYW1lLnRpbWUgPSBsb2dpY2FsVGltZSAvIDEwMDA7XG5cbiAgICBpZiAodGhpcy5idWZmZXJJbmRleCA+IDApXG4gICAgICB0aGlzLl9jb21wdXRlRnJhbWVEYXRhKCk7XG5cbiAgICBzdXBlci5wcm9wYWdhdGVGcmFtZSgpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9jb21wdXRlRnJhbWVEYXRhKCkge1xuICAgIGNvbnN0IG51bUZyYW1lcyA9IHRoaXMuYnVmZmVySW5kZXg7XG4gICAgY29uc3QgZnJhbWVTaXplID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmZyYW1lLmRhdGE7XG5cbiAgICAvLyBnZXQgbWVhbnMgZm9yIGVhY2ggdmVjdG9yIGluZGV4XG4gICAgY29uc3Qgc3VtcyA9IHRoaXMuc3VtcztcbiAgICBzdW1zLmZpbGwoMCk7XG5cbiAgICBmb3IgKGxldCBmcmFtZUluZGV4ID0gMDsgZnJhbWVJbmRleCA8IG51bUZyYW1lczsgZnJhbWVJbmRleCsrKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lU2l6ZTsgaSsrKVxuICAgICAgICBzdW1zW2ldICs9IGJ1ZmZlcltmcmFtZVNpemUgKiBmcmFtZUluZGV4ICsgaV07XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZVNpemU7IGkrKylcbiAgICAgIGRhdGFbaV0gPSBzdW1zW2ldIC8gbnVtRnJhbWVzO1xuXG4gICAgdGhpcy5idWZmZXJJbmRleCA9IDA7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2FtcGxlcjtcbiJdfQ==
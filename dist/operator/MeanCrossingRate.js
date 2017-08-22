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

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _core = require('waves-lfo/core');

var _MeanCrossingRate2 = require('./_MeanCrossingRate');

var _MeanCrossingRate3 = _interopRequireDefault(_MeanCrossingRate2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parameters = {
  noiseThreshold: {
    type: 'float',
    default: 0.1
  },
  frameSize: {
    type: 'integer',
    default: 512,
    metas: { kind: 'static' }
  },
  hopSize: { // should be nullable
    type: 'integer',
    default: null,
    nullable: true,
    metas: { kind: 'static' }
  }
  // centeredTimeTags: {
  //   type: 'boolean',
  //   default: false,
  // }


  /**
   * Mean Crossing Rate operator : estimates energy, frequency and periodicity of
   * a (n-dimension) signal, either on an input stream of signal frames, or by
   * using its own sliding window on an input stream of vectors.
   *
   * The mean is estimated on each new analyzed window using the following equation :  
   * `mean = min + (max - min) * 0.5;`
   *
   * @param {Object} options - Override default options
   * @param {Number} [options.noiseThreshold=0.1] - Threshold added to the mean to
   *  avoid confusion between noise and real signal.
   * @param {Number} [options.frameSize=512] - Size of the internal sliding window.
   * @param {Number} [options.hopSize=null] - Number of samples between
   *  two computations on the internal sliding window.
   */

  // We don't use centered time tags for signal input, as we don't know if it's
  // already been done by a previous slicer.
  // So we don't implement it for now.
  // would be :
  // @param {Boolean} [options.centeredTimeTags=false] - Move the time tag to the
  // middle of the frame.

};
var MeanCrossingRate = function (_BaseLfo) {
  (0, _inherits3.default)(MeanCrossingRate, _BaseLfo);

  function MeanCrossingRate() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MeanCrossingRate);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MeanCrossingRate.__proto__ || (0, _getPrototypeOf2.default)(MeanCrossingRate)).call(this, parameters, options));

    _this._mcrs = [];
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(MeanCrossingRate, [{
    key: 'onParamUpdate',
    value: function onParamUpdate(name, value, metas) {
      if (!this.params.hopSize) {
        this.params.set('hopSize', frameSize);
      }
    }

    /** @private */

  }, {
    key: 'processStreamParams',
    value: function processStreamParams() {
      var prevStreamParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.prepareStreamParams(prevStreamParams);

      // TODO : set output samplerate according to input samplerate + hopSize (?)
      this._mcrs = [];

      for (var i = 0; i < prevStreamParams.frameSize; i++) {
        this._mcrs.push(new _MeanCrossingRate3.default({
          noiseThreshold: this.params.get('noiseThreshold'),
          frameSize: this.params.get('frameSize'),
          hopSize: this.params.get('hopSize'),
          sampleRate: prevStreamParams.sourceSampleRate
        }));
      }

      // if input frames are of type "signal", input dimension is 1
      this.streamParams.frameSize = 3;
      this.streamParams.description = ['energy', 'frequency', 'periodicity'];
      this._mcrs.push(new _MeanCrossingRate3.default({
        noiseThreshold: this.params.get('noiseThreshold'),
        frameSize: this.params.get('frameSize'),
        hopSize: this.params.get('hopSize'),
        sampleRate: prevStreamParams.sourceSampleRate
      }));

      // otherwise we have to parallelize :
      if (this.streamParams.frameType === 'vector') {
        this.streamParams.frameSize *= prevStreamParams.frameSize;

        for (var _i = 1; _i < prevStreamParams.frameSize; _i++) {
          this.streamParams.description.concat(this.streamParams.description);
          this._mcrs.push(new _MeanCrossingRate3.default({
            noiseThreshold: this.params.get('noiseThreshold'),
            frameSize: this.params.get('frameSize'),
            hopSize: this.params.get('hopSize'),
            sampleRate: prevStreamParams.sourceSampleRate
          }));
        }
      }

      // not divided by hopSize, we just duplicate frames between.
      // this means we can comment the following line :
      // this.streamParams.frameRate = prevStreamParams.sourceSampleRate;

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      var inData = frame.data;
      var outData = this.frame.data;

      for (var i = 0; i < this._mcrs.length; i++) {
        var r = this._mcrs[i].process(inData[i]);
        outData[i * 3] = r.amplitude;
        outData[i * 3 + 1] = r.frequency;
        outData[i * 3 + 2] = r.periodicity;
      }
    }

    /** @private */

  }, {
    key: 'processSignal',
    value: function processSignal(frame) {
      this.frame.data = this._mcrs[0].processFrame(frame.data);
    }
  }]);
  return MeanCrossingRate;
}(_core.BaseLfo);

;

exports.default = MeanCrossingRate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm5vaXNlVGhyZXNob2xkIiwidHlwZSIsImRlZmF1bHQiLCJmcmFtZVNpemUiLCJtZXRhcyIsImtpbmQiLCJob3BTaXplIiwibnVsbGFibGUiLCJNZWFuQ3Jvc3NpbmdSYXRlIiwib3B0aW9ucyIsIl9tY3JzIiwibmFtZSIsInZhbHVlIiwicGFyYW1zIiwic2V0IiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJpIiwicHVzaCIsImdldCIsInNhbXBsZVJhdGUiLCJzb3VyY2VTYW1wbGVSYXRlIiwic3RyZWFtUGFyYW1zIiwiZGVzY3JpcHRpb24iLCJmcmFtZVR5cGUiLCJjb25jYXQiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwibGVuZ3RoIiwiciIsInByb2Nlc3MiLCJhbXBsaXR1ZGUiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsInByb2Nlc3NGcmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7O0FBRUEsSUFBTUEsYUFBYTtBQUNqQkMsa0JBQWdCO0FBQ2RDLFVBQU0sT0FEUTtBQUVkQyxhQUFTO0FBRkssR0FEQztBQUtqQkMsYUFBVztBQUNURixVQUFNLFNBREc7QUFFVEMsYUFBUyxHQUZBO0FBR1RFLFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSEUsR0FMTTtBQVVqQkMsV0FBUyxFQUFFO0FBQ1RMLFVBQU0sU0FEQztBQUVQQyxhQUFTLElBRkY7QUFHUEssY0FBVSxJQUhIO0FBSVBILFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSkE7QUFNVDtBQUNBO0FBQ0E7QUFDQTs7O0FBR0Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQTNDbUIsQ0FBbkI7SUE2Q01HLGdCOzs7QUFDSiw4QkFBMEI7QUFB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Q0FBWCxFQUFjZ0IsT0FBZCxDQUFzQkwsT0FBT1gsQ0FBUCxDQUF0QixDQUFWO0FBQ0FhLGdCQUFRYixJQUFJLENBQVosSUFBc0JlLEVBQUVFLFNBQXhCO0FBQ0FKLGdCQUFRYixJQUFJLENBQUosR0FBUSxDQUFoQixJQUFzQmUsRUFBRUcsU0FBeEI7QUFDQUwsZ0JBQVFiLElBQUksQ0FBSixHQUFRLENBQWhCLElBQXNCZSxFQUFFSSxXQUF4QjtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7a0NBQ2NULEssRUFBTztBQUNuQixXQUFLQSxLQUFMLENBQVdFLElBQVgsR0FBa0IsS0FBS25CLEtBQUwsQ0FBVyxDQUFYLEVBQWMyQixZQUFkLENBQTJCVixNQUFNRSxJQUFqQyxDQUFsQjtBQUNEOzs7OztBQUNGOztrQkFFY3JCLGdCIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuaW1wb3J0IF9NZWFuQ3Jvc3NpbmdSYXRlIGZyb20gJy4vX01lYW5Dcm9zc2luZ1JhdGUnO1xuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBub2lzZVRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4xLFxuICB9LFxuICBmcmFtZVNpemU6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogNTEyLFxuICAgIG1ldGFzOiB7IGtpbmQ6ICdzdGF0aWMnIH0sXG4gIH0sXG4gIGhvcFNpemU6IHsgLy8gc2hvdWxkIGJlIG51bGxhYmxlXG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgbnVsbGFibGU6IHRydWUsXG4gICAgbWV0YXM6IHsga2luZDogJ3N0YXRpYycgfSxcbiAgfSxcbiAgLy8gY2VudGVyZWRUaW1lVGFnczoge1xuICAvLyAgIHR5cGU6ICdib29sZWFuJyxcbiAgLy8gICBkZWZhdWx0OiBmYWxzZSxcbiAgLy8gfVxufVxuXG4vKipcbiAqIE1lYW4gQ3Jvc3NpbmcgUmF0ZSBvcGVyYXRvciA6IGVzdGltYXRlcyBlbmVyZ3ksIGZyZXF1ZW5jeSBhbmQgcGVyaW9kaWNpdHkgb2ZcbiAqIGEgKG4tZGltZW5zaW9uKSBzaWduYWwsIGVpdGhlciBvbiBhbiBpbnB1dCBzdHJlYW0gb2Ygc2lnbmFsIGZyYW1lcywgb3IgYnlcbiAqIHVzaW5nIGl0cyBvd24gc2xpZGluZyB3aW5kb3cgb24gYW4gaW5wdXQgc3RyZWFtIG9mIHZlY3RvcnMuXG4gKlxuICogVGhlIG1lYW4gaXMgZXN0aW1hdGVkIG9uIGVhY2ggbmV3IGFuYWx5emVkIHdpbmRvdyB1c2luZyB0aGUgZm9sbG93aW5nIGVxdWF0aW9uIDogIFxuICogYG1lYW4gPSBtaW4gKyAobWF4IC0gbWluKSAqIDAuNTtgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5ub2lzZVRocmVzaG9sZD0wLjFdIC0gVGhyZXNob2xkIGFkZGVkIHRvIHRoZSBtZWFuIHRvXG4gKiAgYXZvaWQgY29uZnVzaW9uIGJldHdlZW4gbm9pc2UgYW5kIHJlYWwgc2lnbmFsLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmZyYW1lU2l6ZT01MTJdIC0gU2l6ZSBvZiB0aGUgaW50ZXJuYWwgc2xpZGluZyB3aW5kb3cuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuaG9wU2l6ZT1udWxsXSAtIE51bWJlciBvZiBzYW1wbGVzIGJldHdlZW5cbiAqICB0d28gY29tcHV0YXRpb25zIG9uIHRoZSBpbnRlcm5hbCBzbGlkaW5nIHdpbmRvdy5cbiAqL1xuXG4vLyBXZSBkb24ndCB1c2UgY2VudGVyZWQgdGltZSB0YWdzIGZvciBzaWduYWwgaW5wdXQsIGFzIHdlIGRvbid0IGtub3cgaWYgaXQnc1xuLy8gYWxyZWFkeSBiZWVuIGRvbmUgYnkgYSBwcmV2aW91cyBzbGljZXIuXG4vLyBTbyB3ZSBkb24ndCBpbXBsZW1lbnQgaXQgZm9yIG5vdy5cbi8vIHdvdWxkIGJlIDpcbi8vIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuY2VudGVyZWRUaW1lVGFncz1mYWxzZV0gLSBNb3ZlIHRoZSB0aW1lIHRhZyB0byB0aGVcbi8vIG1pZGRsZSBvZiB0aGUgZnJhbWUuXG5cbmNsYXNzIE1lYW5Dcm9zc2luZ1JhdGUgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9tY3JzID0gW107XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgb25QYXJhbVVwZGF0ZShuYW1lLCB2YWx1ZSwgbWV0YXMpIHtcbiAgICBpZiAoIXRoaXMucGFyYW1zLmhvcFNpemUpIHtcbiAgICAgIHRoaXMucGFyYW1zLnNldCgnaG9wU2l6ZScsIGZyYW1lU2l6ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgLy8gVE9ETyA6IHNldCBvdXRwdXQgc2FtcGxlcmF0ZSBhY2NvcmRpbmcgdG8gaW5wdXQgc2FtcGxlcmF0ZSArIGhvcFNpemUgKD8pXG4gICAgdGhpcy5fbWNycyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2U3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTsgaSsrKSB7XG4gICAgICB0aGlzLl9tY3JzLnB1c2gobmV3IF9NZWFuQ3Jvc3NpbmdSYXRlKHtcbiAgICAgICAgbm9pc2VUaHJlc2hvbGQ6IHRoaXMucGFyYW1zLmdldCgnbm9pc2VUaHJlc2hvbGQnKSxcbiAgICAgICAgZnJhbWVTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lU2l6ZScpLFxuICAgICAgICBob3BTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2hvcFNpemUnKSxcbiAgICAgICAgc2FtcGxlUmF0ZTogcHJldlN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlLFxuICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8vIGlmIGlucHV0IGZyYW1lcyBhcmUgb2YgdHlwZSBcInNpZ25hbFwiLCBpbnB1dCBkaW1lbnNpb24gaXMgMVxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDM7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZGVzY3JpcHRpb24gPSBbICdlbmVyZ3knLCAnZnJlcXVlbmN5JywgJ3BlcmlvZGljaXR5JyBdO1xuICAgIHRoaXMuX21jcnMucHVzaChuZXcgX01lYW5Dcm9zc2luZ1JhdGUoe1xuICAgICAgbm9pc2VUaHJlc2hvbGQ6IHRoaXMucGFyYW1zLmdldCgnbm9pc2VUaHJlc2hvbGQnKSxcbiAgICAgIGZyYW1lU2l6ZTogdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVNpemUnKSxcbiAgICAgIGhvcFNpemU6IHRoaXMucGFyYW1zLmdldCgnaG9wU2l6ZScpLFxuICAgICAgc2FtcGxlUmF0ZTogcHJldlN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlLFxuICAgIH0pKTtcblxuICAgIC8vIG90aGVyd2lzZSB3ZSBoYXZlIHRvIHBhcmFsbGVsaXplIDpcbiAgICBpZiAodGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVUeXBlID09PSAndmVjdG9yJykge1xuICAgICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplICo9IHByZXZTdHJlYW1QYXJhbXMuZnJhbWVTaXplO1xuXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHByZXZTdHJlYW1QYXJhbXMuZnJhbWVTaXplOyBpKyspIHtcbiAgICAgICAgdGhpcy5zdHJlYW1QYXJhbXMuZGVzY3JpcHRpb24uY29uY2F0KHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgdGhpcy5fbWNycy5wdXNoKG5ldyBfTWVhbkNyb3NzaW5nUmF0ZSh7XG4gICAgICAgICAgbm9pc2VUaHJlc2hvbGQ6IHRoaXMucGFyYW1zLmdldCgnbm9pc2VUaHJlc2hvbGQnKSxcbiAgICAgICAgICBmcmFtZVNpemU6IHRoaXMucGFyYW1zLmdldCgnZnJhbWVTaXplJyksXG4gICAgICAgICAgaG9wU2l6ZTogdGhpcy5wYXJhbXMuZ2V0KCdob3BTaXplJyksXG4gICAgICAgICAgc2FtcGxlUmF0ZTogcHJldlN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlLFxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbm90IGRpdmlkZWQgYnkgaG9wU2l6ZSwgd2UganVzdCBkdXBsaWNhdGUgZnJhbWVzIGJldHdlZW4uXG4gICAgLy8gdGhpcyBtZWFucyB3ZSBjYW4gY29tbWVudCB0aGUgZm9sbG93aW5nIGxpbmUgOlxuICAgIC8vIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IHByZXZTdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlUmF0ZTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IGluRGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fbWNycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgciA9IHRoaXMuX21jcnNbaV0ucHJvY2VzcyhpbkRhdGFbaV0pO1xuICAgICAgb3V0RGF0YVtpICogM10gICAgICA9IHIuYW1wbGl0dWRlO1xuICAgICAgb3V0RGF0YVtpICogMyArIDFdICA9IHIuZnJlcXVlbmN5O1xuICAgICAgb3V0RGF0YVtpICogMyArIDJdICA9IHIucGVyaW9kaWNpdHk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTaWduYWwoZnJhbWUpIHtcbiAgICB0aGlzLmZyYW1lLmRhdGEgPSB0aGlzLl9tY3JzWzBdLnByb2Nlc3NGcmFtZShmcmFtZS5kYXRhKTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgTWVhbkNyb3NzaW5nUmF0ZTtcbiJdfQ==
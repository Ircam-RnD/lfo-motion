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
      this.streamParams.frameSize = 2; //3;
      this.streamParams.description = [/*'energy',*/'frequency', 'periodicity'];
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
        // outData[i * 3]      = r.amplitude;
        // outData[i * 3 + 1]  = r.frequency;
        // outData[i * 3 + 2]  = r.periodicity;
        outData[i * 3] = r.frequency;
        outData[i * 3 + 1] = r.periodicity;
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

exports.default = MeanCrossingRate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm5vaXNlVGhyZXNob2xkIiwidHlwZSIsImRlZmF1bHQiLCJmcmFtZVNpemUiLCJtZXRhcyIsImtpbmQiLCJob3BTaXplIiwibnVsbGFibGUiLCJNZWFuQ3Jvc3NpbmdSYXRlIiwib3B0aW9ucyIsIl9tY3JzIiwibmFtZSIsInZhbHVlIiwicGFyYW1zIiwic2V0IiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJpIiwicHVzaCIsImdldCIsInNhbXBsZVJhdGUiLCJzb3VyY2VTYW1wbGVSYXRlIiwic3RyZWFtUGFyYW1zIiwiZGVzY3JpcHRpb24iLCJmcmFtZVR5cGUiLCJjb25jYXQiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwibGVuZ3RoIiwiciIsInByb2Nlc3MiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSIsInByb2Nlc3NGcmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7O0FBRUEsSUFBTUEsYUFBYTtBQUNqQkMsa0JBQWdCO0FBQ2RDLFVBQU0sT0FEUTtBQUVkQyxhQUFTO0FBRkssR0FEQztBQUtqQkMsYUFBVztBQUNURixVQUFNLFNBREc7QUFFVEMsYUFBUyxHQUZBO0FBR1RFLFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSEUsR0FMTTtBQVVqQkMsV0FBUyxFQUFFO0FBQ1RMLFVBQU0sU0FEQztBQUVQQyxhQUFTLElBRkY7QUFHUEssY0FBVSxJQUhIO0FBSVBILFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSkE7QUFNVDtBQUNBO0FBQ0E7QUFDQTs7O0FBR0Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQTNDbUIsQ0FBbkI7SUE2Q01HLGdCOzs7QUFDSiw4QkFBMEI7QUFBQSxRQUFkQyxPQUFj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QVgsRUFBY2dCLE9BQWQsQ0FBc0JMLE9BQU9YLENBQVAsQ0FBdEIsQ0FBVjtBQUNBO0FBQ0E7QUFDQTtBQUNBYSxnQkFBUWIsSUFBSSxDQUFaLElBQXNCZSxFQUFFRSxTQUF4QjtBQUNBSixnQkFBUWIsSUFBSSxDQUFKLEdBQVEsQ0FBaEIsSUFBc0JlLEVBQUVHLFdBQXhCO0FBQ0Q7QUFDRjs7QUFFRDs7OztrQ0FDY1IsSyxFQUFPO0FBQ25CLFdBQUtBLEtBQUwsQ0FBV0UsSUFBWCxHQUFrQixLQUFLbkIsS0FBTCxDQUFXLENBQVgsRUFBYzBCLFlBQWQsQ0FBMkJULE1BQU1FLElBQWpDLENBQWxCO0FBQ0Q7Ozs7O2tCQUdZckIsZ0IiLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VMZm8gfSBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5pbXBvcnQgX01lYW5Dcm9zc2luZ1JhdGUgZnJvbSAnLi9fTWVhbkNyb3NzaW5nUmF0ZSc7XG5cbmNvbnN0IHBhcmFtZXRlcnMgPSB7XG4gIG5vaXNlVGhyZXNob2xkOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBkZWZhdWx0OiAwLjEsXG4gIH0sXG4gIGZyYW1lU2l6ZToge1xuICAgIHR5cGU6ICdpbnRlZ2VyJyxcbiAgICBkZWZhdWx0OiA1MTIsXG4gICAgbWV0YXM6IHsga2luZDogJ3N0YXRpYycgfSxcbiAgfSxcbiAgaG9wU2l6ZTogeyAvLyBzaG91bGQgYmUgbnVsbGFibGVcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogbnVsbCxcbiAgICBudWxsYWJsZTogdHJ1ZSxcbiAgICBtZXRhczogeyBraW5kOiAnc3RhdGljJyB9LFxuICB9LFxuICAvLyBjZW50ZXJlZFRpbWVUYWdzOiB7XG4gIC8vICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAvLyAgIGRlZmF1bHQ6IGZhbHNlLFxuICAvLyB9XG59XG5cbi8qKlxuICogTWVhbiBDcm9zc2luZyBSYXRlIG9wZXJhdG9yIDogZXN0aW1hdGVzIGVuZXJneSwgZnJlcXVlbmN5IGFuZCBwZXJpb2RpY2l0eSBvZlxuICogYSAobi1kaW1lbnNpb24pIHNpZ25hbCwgZWl0aGVyIG9uIGFuIGlucHV0IHN0cmVhbSBvZiBzaWduYWwgZnJhbWVzLCBvciBieVxuICogdXNpbmcgaXRzIG93biBzbGlkaW5nIHdpbmRvdyBvbiBhbiBpbnB1dCBzdHJlYW0gb2YgdmVjdG9ycy5cbiAqXG4gKiBUaGUgbWVhbiBpcyBlc3RpbWF0ZWQgb24gZWFjaCBuZXcgYW5hbHl6ZWQgd2luZG93IHVzaW5nIHRoZSBmb2xsb3dpbmcgZXF1YXRpb24gOlxuICogYG1lYW4gPSBtaW4gKyAobWF4IC0gbWluKSAqIDAuNTtgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5ub2lzZVRocmVzaG9sZD0wLjFdIC0gVGhyZXNob2xkIGFkZGVkIHRvIHRoZSBtZWFuIHRvXG4gKiAgYXZvaWQgY29uZnVzaW9uIGJldHdlZW4gbm9pc2UgYW5kIHJlYWwgc2lnbmFsLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmZyYW1lU2l6ZT01MTJdIC0gU2l6ZSBvZiB0aGUgaW50ZXJuYWwgc2xpZGluZyB3aW5kb3cuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuaG9wU2l6ZT1udWxsXSAtIE51bWJlciBvZiBzYW1wbGVzIGJldHdlZW5cbiAqICB0d28gY29tcHV0YXRpb25zIG9uIHRoZSBpbnRlcm5hbCBzbGlkaW5nIHdpbmRvdy5cbiAqL1xuXG4vLyBXZSBkb24ndCB1c2UgY2VudGVyZWQgdGltZSB0YWdzIGZvciBzaWduYWwgaW5wdXQsIGFzIHdlIGRvbid0IGtub3cgaWYgaXQnc1xuLy8gYWxyZWFkeSBiZWVuIGRvbmUgYnkgYSBwcmV2aW91cyBzbGljZXIuXG4vLyBTbyB3ZSBkb24ndCBpbXBsZW1lbnQgaXQgZm9yIG5vdy5cbi8vIHdvdWxkIGJlIDpcbi8vIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuY2VudGVyZWRUaW1lVGFncz1mYWxzZV0gLSBNb3ZlIHRoZSB0aW1lIHRhZyB0byB0aGVcbi8vIG1pZGRsZSBvZiB0aGUgZnJhbWUuXG5cbmNsYXNzIE1lYW5Dcm9zc2luZ1JhdGUgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9tY3JzID0gW107XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgb25QYXJhbVVwZGF0ZShuYW1lLCB2YWx1ZSwgbWV0YXMpIHtcbiAgICBpZiAoIXRoaXMucGFyYW1zLmhvcFNpemUpIHtcbiAgICAgIHRoaXMucGFyYW1zLnNldCgnaG9wU2l6ZScsIGZyYW1lU2l6ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgLy8gVE9ETyA6IHNldCBvdXRwdXQgc2FtcGxlcmF0ZSBhY2NvcmRpbmcgdG8gaW5wdXQgc2FtcGxlcmF0ZSArIGhvcFNpemUgKD8pXG4gICAgdGhpcy5fbWNycyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2U3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTsgaSsrKSB7XG4gICAgICB0aGlzLl9tY3JzLnB1c2gobmV3IF9NZWFuQ3Jvc3NpbmdSYXRlKHtcbiAgICAgICAgbm9pc2VUaHJlc2hvbGQ6IHRoaXMucGFyYW1zLmdldCgnbm9pc2VUaHJlc2hvbGQnKSxcbiAgICAgICAgZnJhbWVTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lU2l6ZScpLFxuICAgICAgICBob3BTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2hvcFNpemUnKSxcbiAgICAgICAgc2FtcGxlUmF0ZTogcHJldlN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlLFxuICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8vIGlmIGlucHV0IGZyYW1lcyBhcmUgb2YgdHlwZSBcInNpZ25hbFwiLCBpbnB1dCBkaW1lbnNpb24gaXMgMVxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDI7Ly8zO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gWyAvKidlbmVyZ3knLCovICdmcmVxdWVuY3knLCAncGVyaW9kaWNpdHknIF07XG4gICAgdGhpcy5fbWNycy5wdXNoKG5ldyBfTWVhbkNyb3NzaW5nUmF0ZSh7XG4gICAgICBub2lzZVRocmVzaG9sZDogdGhpcy5wYXJhbXMuZ2V0KCdub2lzZVRocmVzaG9sZCcpLFxuICAgICAgZnJhbWVTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lU2l6ZScpLFxuICAgICAgaG9wU2l6ZTogdGhpcy5wYXJhbXMuZ2V0KCdob3BTaXplJyksXG4gICAgICBzYW1wbGVSYXRlOiBwcmV2U3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZVJhdGUsXG4gICAgfSkpO1xuXG4gICAgLy8gb3RoZXJ3aXNlIHdlIGhhdmUgdG8gcGFyYWxsZWxpemUgOlxuICAgIGlmICh0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVR5cGUgPT09ICd2ZWN0b3InKSB7XG4gICAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgKj0gcHJldlN0cmVhbVBhcmFtcy5mcmFtZVNpemU7XG5cbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcHJldlN0cmVhbVBhcmFtcy5mcmFtZVNpemU7IGkrKykge1xuICAgICAgICB0aGlzLnN0cmVhbVBhcmFtcy5kZXNjcmlwdGlvbi5jb25jYXQodGhpcy5zdHJlYW1QYXJhbXMuZGVzY3JpcHRpb24pO1xuICAgICAgICB0aGlzLl9tY3JzLnB1c2gobmV3IF9NZWFuQ3Jvc3NpbmdSYXRlKHtcbiAgICAgICAgICBub2lzZVRocmVzaG9sZDogdGhpcy5wYXJhbXMuZ2V0KCdub2lzZVRocmVzaG9sZCcpLFxuICAgICAgICAgIGZyYW1lU2l6ZTogdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVNpemUnKSxcbiAgICAgICAgICBob3BTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2hvcFNpemUnKSxcbiAgICAgICAgICBzYW1wbGVSYXRlOiBwcmV2U3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZVJhdGUsXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBub3QgZGl2aWRlZCBieSBob3BTaXplLCB3ZSBqdXN0IGR1cGxpY2F0ZSBmcmFtZXMgYmV0d2Vlbi5cbiAgICAvLyB0aGlzIG1lYW5zIHdlIGNhbiBjb21tZW50IHRoZSBmb2xsb3dpbmcgbGluZSA6XG4gICAgLy8gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlID0gcHJldlN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgaW5EYXRhID0gZnJhbWUuZGF0YTtcbiAgICBjb25zdCBvdXREYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9tY3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByID0gdGhpcy5fbWNyc1tpXS5wcm9jZXNzKGluRGF0YVtpXSk7XG4gICAgICAvLyBvdXREYXRhW2kgKiAzXSAgICAgID0gci5hbXBsaXR1ZGU7XG4gICAgICAvLyBvdXREYXRhW2kgKiAzICsgMV0gID0gci5mcmVxdWVuY3k7XG4gICAgICAvLyBvdXREYXRhW2kgKiAzICsgMl0gID0gci5wZXJpb2RpY2l0eTtcbiAgICAgIG91dERhdGFbaSAqIDNdICAgICAgPSByLmZyZXF1ZW5jeTtcbiAgICAgIG91dERhdGFbaSAqIDMgKyAxXSAgPSByLnBlcmlvZGljaXR5OyAgICAgIFxuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU2lnbmFsKGZyYW1lKSB7XG4gICAgdGhpcy5mcmFtZS5kYXRhID0gdGhpcy5fbWNyc1swXS5wcm9jZXNzRnJhbWUoZnJhbWUuZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTWVhbkNyb3NzaW5nUmF0ZTtcbiJdfQ==
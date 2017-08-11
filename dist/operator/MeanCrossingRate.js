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

var _MeanCrossingRate2 = require('_MeanCrossingRate');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// motion-input indices :
// 0,1,2 -> accelerationIncludingGravity
// 3,4,5 -> acceleration
// 6,7,8 -> rotationRate

// but, as they are preprocessed by parent class,
// indices for acc + gyro are 0, 1, 2, 3, 4, 5 (see below)

var definitions = {
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
  },
  centeredTimeTags: {
    type: 'boolean',
    default: false
  }
};

var MeanCrossingRate = function (_BaseLfo) {
  (0, _inherits3.default)(MeanCrossingRate, _BaseLfo);

  function MeanCrossingRate() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MeanCrossingRate);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MeanCrossingRate.__proto__ || (0, _getPrototypeOf2.default)(MeanCrossingRate)).call(this, definitions, options));

    _this._mcrs = [];
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(MeanCrossingRate, [{
    key: 'onParamUpdate',
    value: function onParamUpdate(name, value, metas) {}

    /** @private */

  }, {
    key: 'processStreamParams',
    value: function processStreamParams() {
      var prevStreamParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.prepareStreamParams(prevStreamParams);

      // TODO : set output samplerate according to input samplerate + hopSize

      this._mcrs = [];

      for (var i = 0; i < prevStreamParams.frameSize; i++) {
        this._mcrs.push(new _MeanCrossingRate2._MeanCrossingRate({
          noiseThreshold: this.params.get('noiseThreshold'),
          frameSize: this.params.get('frameSize'),
          hopSize: this.params.get('hopSize'),
          sampleRate: prevStreamParams.sourceSampleRate
        }));
      }

      // for energy, frequency, and periodicity
      this.streamParams.frameSize = prevStreamParams.frameSize * 3;
      this.streamParams.frameRate = prevStreamParams.sourceSampleRate;

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
    // processFrame(frame) {
    //   this.prepareFrame(frame);
    //   this.processFunction(frame);
    // }

  }]);
  return MeanCrossingRate;
}(_core.BaseLfo);

exports.default = MeanCrossingRate;
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJub2lzZVRocmVzaG9sZCIsInR5cGUiLCJkZWZhdWx0IiwiZnJhbWVTaXplIiwibWV0YXMiLCJraW5kIiwiaG9wU2l6ZSIsIm51bGxhYmxlIiwiY2VudGVyZWRUaW1lVGFncyIsIk1lYW5Dcm9zc2luZ1JhdGUiLCJvcHRpb25zIiwiX21jcnMiLCJuYW1lIiwidmFsdWUiLCJwcmV2U3RyZWFtUGFyYW1zIiwicHJlcGFyZVN0cmVhbVBhcmFtcyIsImkiLCJwdXNoIiwicGFyYW1zIiwiZ2V0Iiwic2FtcGxlUmF0ZSIsInNvdXJjZVNhbXBsZVJhdGUiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVJhdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwibGVuZ3RoIiwiciIsInByb2Nlc3MiLCJhbXBsaXR1ZGUiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsSUFBTUEsY0FBYztBQUNsQkMsa0JBQWdCO0FBQ2RDLFVBQU0sT0FEUTtBQUVkQyxhQUFTO0FBRkssR0FERTtBQUtsQkMsYUFBVztBQUNURixVQUFNLFNBREc7QUFFVEMsYUFBUyxHQUZBO0FBR1RFLFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSEUsR0FMTztBQVVsQkMsV0FBUyxFQUFFO0FBQ1RMLFVBQU0sU0FEQztBQUVQQyxhQUFTLElBRkY7QUFHUEssY0FBVSxJQUhIO0FBSVBILFdBQU8sRUFBRUMsTUFBTSxRQUFSO0FBSkEsR0FWUztBQWdCbEJHLG9CQUFrQjtBQUNoQlAsVUFBTSxTQURVO0FBRWhCQyxhQUFTO0FBRk87QUFoQkEsQ0FBcEI7O0lBc0JxQk8sZ0I7OztBQUNuQiw4QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFBQSwwSkFDbEJYLFdBRGtCLEVBQ0xXLE9BREs7O0FBR3hCLFVBQUtDLEtBQUwsR0FBYSxFQUFiO0FBSHdCO0FBSXpCOztBQUVEOzs7OztrQ0FDY0MsSSxFQUFNQyxLLEVBQU9ULEssRUFBTyxDQUVqQzs7QUFFRDs7OzswQ0FDMkM7QUFBQSxVQUF2QlUsZ0JBQXVCLHVFQUFKLEVBQUk7O0FBQ3pDLFdBQUtDLG1CQUFMLENBQXlCRCxnQkFBekI7O0FBRUE7O0FBRUEsV0FBS0gsS0FBTCxHQUFhLEVBQWI7O0FBRUEsV0FBSyxJQUFJSyxJQUFJLENBQWIsRUFBZ0JBLElBQUlGLGlCQUFpQlgsU0FBckMsRUFBZ0RhLEdBQWhELEVBQXFEO0FBQ25ELGFBQUtMLEtBQUwsQ0FBV00sSUFBWCxDQUFnQix5Q0FBc0I7QUFDcENqQiwwQkFBZ0IsS0FBS2tCLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixnQkFBaEIsQ0FEb0I7QUFFcENoQixxQkFBVyxLQUFLZSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsV0FBaEIsQ0FGeUI7QUFHcENiLG1CQUFTLEtBQUtZLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixTQUFoQixDQUgyQjtBQUlwQ0Msc0JBQVlOLGlCQUFpQk87QUFKTyxTQUF0QixDQUFoQjtBQU1EOztBQUVEO0FBQ0EsV0FBS0MsWUFBTCxDQUFrQm5CLFNBQWxCLEdBQThCVyxpQkFBaUJYLFNBQWpCLEdBQTZCLENBQTNEO0FBQ0EsV0FBS21CLFlBQUwsQ0FBa0JDLFNBQWxCLEdBQThCVCxpQkFBaUJPLGdCQUEvQzs7QUFFQSxXQUFLRyxxQkFBTDtBQUNEOztBQUVEOzs7O2tDQUNjQyxLLEVBQU87QUFDbkIsVUFBTUMsU0FBU0QsTUFBTUUsSUFBckI7QUFDQSxVQUFNQyxVQUFVLEtBQUtILEtBQUwsQ0FBV0UsSUFBM0I7O0FBRUEsV0FBSyxJQUFJWCxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS0wsS0FBTCxDQUFXa0IsTUFBL0IsRUFBdUNiLEdBQXZDLEVBQTRDO0FBQzFDLFlBQU1jLElBQUksS0FBS25CLEtBQUwsQ0FBV0ssQ0FBWCxFQUFjZSxPQUFkLENBQXNCTCxPQUFPVixDQUFQLENBQXRCLENBQVY7QUFDQVksZ0JBQVFaLElBQUksQ0FBWixJQUFzQmMsRUFBRUUsU0FBeEI7QUFDQUosZ0JBQVFaLElBQUksQ0FBSixHQUFRLENBQWhCLElBQXNCYyxFQUFFRyxTQUF4QjtBQUNBTCxnQkFBUVosSUFBSSxDQUFKLEdBQVEsQ0FBaEIsSUFBc0JjLEVBQUVJLFdBQXhCO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7a0JBckRtQnpCLGdCO0FBc0RwQiIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcbmltcG9ydCB7IF9NZWFuQ3Jvc3NpbmdSYXRlIH0gZnJvbSAnX01lYW5Dcm9zc2luZ1JhdGUnO1xuXG4vLyBtb3Rpb24taW5wdXQgaW5kaWNlcyA6XG4vLyAwLDEsMiAtPiBhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5XG4vLyAzLDQsNSAtPiBhY2NlbGVyYXRpb25cbi8vIDYsNyw4IC0+IHJvdGF0aW9uUmF0ZVxuXG4vLyBidXQsIGFzIHRoZXkgYXJlIHByZXByb2Nlc3NlZCBieSBwYXJlbnQgY2xhc3MsXG4vLyBpbmRpY2VzIGZvciBhY2MgKyBneXJvIGFyZSAwLCAxLCAyLCAzLCA0LCA1IChzZWUgYmVsb3cpXG5cbmNvbnN0IGRlZmluaXRpb25zID0ge1xuICBub2lzZVRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4xLFxuICB9LFxuICBmcmFtZVNpemU6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogNTEyLFxuICAgIG1ldGFzOiB7IGtpbmQ6ICdzdGF0aWMnIH0sXG4gIH0sXG4gIGhvcFNpemU6IHsgLy8gc2hvdWxkIGJlIG51bGxhYmxlXG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgbnVsbGFibGU6IHRydWUsXG4gICAgbWV0YXM6IHsga2luZDogJ3N0YXRpYycgfSxcbiAgfSxcbiAgY2VudGVyZWRUaW1lVGFnczoge1xuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiBmYWxzZSxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZWFuQ3Jvc3NpbmdSYXRlIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX21jcnMgPSBbXTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBvblBhcmFtVXBkYXRlKG5hbWUsIHZhbHVlLCBtZXRhcykge1xuXG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zID0ge30pIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICAvLyBUT0RPIDogc2V0IG91dHB1dCBzYW1wbGVyYXRlIGFjY29yZGluZyB0byBpbnB1dCBzYW1wbGVyYXRlICsgaG9wU2l6ZVxuXG4gICAgdGhpcy5fbWNycyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2U3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTsgaSsrKSB7XG4gICAgICB0aGlzLl9tY3JzLnB1c2gobmV3IF9NZWFuQ3Jvc3NpbmdSYXRlKHtcbiAgICAgICAgbm9pc2VUaHJlc2hvbGQ6IHRoaXMucGFyYW1zLmdldCgnbm9pc2VUaHJlc2hvbGQnKSxcbiAgICAgICAgZnJhbWVTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lU2l6ZScpLFxuICAgICAgICBob3BTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2hvcFNpemUnKSxcbiAgICAgICAgc2FtcGxlUmF0ZTogcHJldlN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlLFxuICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8vIGZvciBlbmVyZ3ksIGZyZXF1ZW5jeSwgYW5kIHBlcmlvZGljaXR5XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gcHJldlN0cmVhbVBhcmFtcy5mcmFtZVNpemUgKiAzO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IHByZXZTdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlUmF0ZTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IGluRGF0YSA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0RGF0YSA9IHRoaXMuZnJhbWUuZGF0YTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fbWNycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgciA9IHRoaXMuX21jcnNbaV0ucHJvY2VzcyhpbkRhdGFbaV0pO1xuICAgICAgb3V0RGF0YVtpICogM10gICAgICA9IHIuYW1wbGl0dWRlO1xuICAgICAgb3V0RGF0YVtpICogMyArIDFdICA9IHIuZnJlcXVlbmN5O1xuICAgICAgb3V0RGF0YVtpICogMyArIDJdICA9IHIucGVyaW9kaWNpdHk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIC8vIHByb2Nlc3NGcmFtZShmcmFtZSkge1xuICAvLyAgIHRoaXMucHJlcGFyZUZyYW1lKGZyYW1lKTtcbiAgLy8gICB0aGlzLnByb2Nlc3NGdW5jdGlvbihmcmFtZSk7XG4gIC8vIH1cbn07Il19
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
        this._mcrs.push(new _MeanCrossingRate3.default({
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
  }]);
  return MeanCrossingRate;
}(_core.BaseLfo);

exports.default = MeanCrossingRate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk1lYW5Dcm9zc2luZ1JhdGUuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJub2lzZVRocmVzaG9sZCIsInR5cGUiLCJkZWZhdWx0IiwiZnJhbWVTaXplIiwibWV0YXMiLCJraW5kIiwiaG9wU2l6ZSIsIm51bGxhYmxlIiwiY2VudGVyZWRUaW1lVGFncyIsIk1lYW5Dcm9zc2luZ1JhdGUiLCJvcHRpb25zIiwiX21jcnMiLCJuYW1lIiwidmFsdWUiLCJwcmV2U3RyZWFtUGFyYW1zIiwicHJlcGFyZVN0cmVhbVBhcmFtcyIsImkiLCJwdXNoIiwicGFyYW1zIiwiZ2V0Iiwic2FtcGxlUmF0ZSIsInNvdXJjZVNhbXBsZVJhdGUiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVJhdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsImluRGF0YSIsImRhdGEiLCJvdXREYXRhIiwibGVuZ3RoIiwiciIsInByb2Nlc3MiLCJhbXBsaXR1ZGUiLCJmcmVxdWVuY3kiLCJwZXJpb2RpY2l0eSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxJQUFNQSxjQUFjO0FBQ2xCQyxrQkFBZ0I7QUFDZEMsVUFBTSxPQURRO0FBRWRDLGFBQVM7QUFGSyxHQURFO0FBS2xCQyxhQUFXO0FBQ1RGLFVBQU0sU0FERztBQUVUQyxhQUFTLEdBRkE7QUFHVEUsV0FBTyxFQUFFQyxNQUFNLFFBQVI7QUFIRSxHQUxPO0FBVWxCQyxXQUFTLEVBQUU7QUFDVEwsVUFBTSxTQURDO0FBRVBDLGFBQVMsSUFGRjtBQUdQSyxjQUFVLElBSEg7QUFJUEgsV0FBTyxFQUFFQyxNQUFNLFFBQVI7QUFKQSxHQVZTO0FBZ0JsQkcsb0JBQWtCO0FBQ2hCUCxVQUFNLFNBRFU7QUFFaEJDLGFBQVM7QUFGTztBQWhCQSxDQUFwQjs7SUFzQk1PLGdCOzs7QUFDSiw4QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFBQSwwSkFDbEJYLFdBRGtCLEVBQ0xXLE9BREs7O0FBR3hCLFVBQUtDLEtBQUwsR0FBYSxFQUFiO0FBSHdCO0FBSXpCOztBQUVEOzs7OztrQ0FDY0MsSSxFQUFNQyxLLEVBQU9ULEssRUFBTyxDQUVqQzs7QUFFRDs7OzswQ0FDMkM7QUFBQSxVQUF2QlUsZ0JBQXVCLHVFQUFKLEVBQUk7O0FBQ3pDLFdBQUtDLG1CQUFMLENBQXlCRCxnQkFBekI7O0FBRUE7O0FBRUEsV0FBS0gsS0FBTCxHQUFhLEVBQWI7O0FBRUEsV0FBSyxJQUFJSyxJQUFJLENBQWIsRUFBZ0JBLElBQUlGLGlCQUFpQlgsU0FBckMsRUFBZ0RhLEdBQWhELEVBQXFEO0FBQ25ELGFBQUtMLEtBQUwsQ0FBV00sSUFBWCxDQUFnQiwrQkFBc0I7QUFDcENqQiwwQkFBZ0IsS0FBS2tCLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixnQkFBaEIsQ0FEb0I7QUFFcENoQixxQkFBVyxLQUFLZSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsV0FBaEIsQ0FGeUI7QUFHcENiLG1CQUFTLEtBQUtZLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixTQUFoQixDQUgyQjtBQUlwQ0Msc0JBQVlOLGlCQUFpQk87QUFKTyxTQUF0QixDQUFoQjtBQU1EOztBQUVEO0FBQ0EsV0FBS0MsWUFBTCxDQUFrQm5CLFNBQWxCLEdBQThCVyxpQkFBaUJYLFNBQWpCLEdBQTZCLENBQTNEO0FBQ0EsV0FBS21CLFlBQUwsQ0FBa0JDLFNBQWxCLEdBQThCVCxpQkFBaUJPLGdCQUEvQzs7QUFFQSxXQUFLRyxxQkFBTDtBQUNEOztBQUVEOzs7O2tDQUNjQyxLLEVBQU87QUFDbkIsVUFBTUMsU0FBU0QsTUFBTUUsSUFBckI7QUFDQSxVQUFNQyxVQUFVLEtBQUtILEtBQUwsQ0FBV0UsSUFBM0I7O0FBRUEsV0FBSyxJQUFJWCxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS0wsS0FBTCxDQUFXa0IsTUFBL0IsRUFBdUNiLEdBQXZDLEVBQTRDO0FBQzFDLFlBQU1jLElBQUksS0FBS25CLEtBQUwsQ0FBV0ssQ0FBWCxFQUFjZSxPQUFkLENBQXNCTCxPQUFPVixDQUFQLENBQXRCLENBQVY7QUFDQVksZ0JBQVFaLElBQUksQ0FBWixJQUFzQmMsRUFBRUUsU0FBeEI7QUFDQUosZ0JBQVFaLElBQUksQ0FBSixHQUFRLENBQWhCLElBQXNCYyxFQUFFRyxTQUF4QjtBQUNBTCxnQkFBUVosSUFBSSxDQUFKLEdBQVEsQ0FBaEIsSUFBc0JjLEVBQUVJLFdBQXhCO0FBQ0Q7QUFDRjs7Ozs7a0JBR1l6QixnQiIsImZpbGUiOiJNZWFuQ3Jvc3NpbmdSYXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcbmltcG9ydCBfTWVhbkNyb3NzaW5nUmF0ZSBmcm9tICcuL19NZWFuQ3Jvc3NpbmdSYXRlJztcblxuLy8gbW90aW9uLWlucHV0IGluZGljZXMgOlxuLy8gMCwxLDIgLT4gYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eVxuLy8gMyw0LDUgLT4gYWNjZWxlcmF0aW9uXG4vLyA2LDcsOCAtPiByb3RhdGlvblJhdGVcblxuLy8gYnV0LCBhcyB0aGV5IGFyZSBwcmVwcm9jZXNzZWQgYnkgcGFyZW50IGNsYXNzLFxuLy8gaW5kaWNlcyBmb3IgYWNjICsgZ3lybyBhcmUgMCwgMSwgMiwgMywgNCwgNSAoc2VlIGJlbG93KVxuXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgbm9pc2VUaHJlc2hvbGQ6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIGRlZmF1bHQ6IDAuMSxcbiAgfSxcbiAgZnJhbWVTaXplOiB7XG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIGRlZmF1bHQ6IDUxMixcbiAgICBtZXRhczogeyBraW5kOiAnc3RhdGljJyB9LFxuICB9LFxuICBob3BTaXplOiB7IC8vIHNob3VsZCBiZSBudWxsYWJsZVxuICAgIHR5cGU6ICdpbnRlZ2VyJyxcbiAgICBkZWZhdWx0OiBudWxsLFxuICAgIG51bGxhYmxlOiB0cnVlLFxuICAgIG1ldGFzOiB7IGtpbmQ6ICdzdGF0aWMnIH0sXG4gIH0sXG4gIGNlbnRlcmVkVGltZVRhZ3M6IHtcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVmYXVsdDogZmFsc2UsXG4gIH1cbn1cblxuY2xhc3MgTWVhbkNyb3NzaW5nUmF0ZSBleHRlbmRzIEJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihkZWZpbml0aW9ucywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9tY3JzID0gW107XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgb25QYXJhbVVwZGF0ZShuYW1lLCB2YWx1ZSwgbWV0YXMpIHtcblxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgLy8gVE9ETyA6IHNldCBvdXRwdXQgc2FtcGxlcmF0ZSBhY2NvcmRpbmcgdG8gaW5wdXQgc2FtcGxlcmF0ZSArIGhvcFNpemVcblxuICAgIHRoaXMuX21jcnMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJldlN0cmVhbVBhcmFtcy5mcmFtZVNpemU7IGkrKykge1xuICAgICAgdGhpcy5fbWNycy5wdXNoKG5ldyBfTWVhbkNyb3NzaW5nUmF0ZSh7XG4gICAgICAgIG5vaXNlVGhyZXNob2xkOiB0aGlzLnBhcmFtcy5nZXQoJ25vaXNlVGhyZXNob2xkJyksXG4gICAgICAgIGZyYW1lU2l6ZTogdGhpcy5wYXJhbXMuZ2V0KCdmcmFtZVNpemUnKSxcbiAgICAgICAgaG9wU2l6ZTogdGhpcy5wYXJhbXMuZ2V0KCdob3BTaXplJyksXG4gICAgICAgIHNhbXBsZVJhdGU6IHByZXZTdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlUmF0ZSxcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvLyBmb3IgZW5lcmd5LCBmcmVxdWVuY3ksIGFuZCBwZXJpb2RpY2l0eVxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IHByZXZTdHJlYW1QYXJhbXMuZnJhbWVTaXplICogMztcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSBwcmV2U3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZVJhdGU7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCBpbkRhdGEgPSBmcmFtZS5kYXRhO1xuICAgIGNvbnN0IG91dERhdGEgPSB0aGlzLmZyYW1lLmRhdGE7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX21jcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHIgPSB0aGlzLl9tY3JzW2ldLnByb2Nlc3MoaW5EYXRhW2ldKTtcbiAgICAgIG91dERhdGFbaSAqIDNdICAgICAgPSByLmFtcGxpdHVkZTtcbiAgICAgIG91dERhdGFbaSAqIDMgKyAxXSAgPSByLmZyZXF1ZW5jeTtcbiAgICAgIG91dERhdGFbaSAqIDMgKyAyXSAgPSByLnBlcmlvZGljaXR5O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNZWFuQ3Jvc3NpbmdSYXRlO1xuIl19
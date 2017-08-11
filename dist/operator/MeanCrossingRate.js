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

    // this._mcr = new _MeanCrossingRate({
    //   noiseThreshold: this.params.get('noiseThreshold'),
    //   frameSize: this.params.get('frameSize'),
    //   hopSize: this.params.get('hopSize'),
    // });

    var _this = (0, _possibleConstructorReturn3.default)(this, (MeanCrossingRate.__proto__ || (0, _getPrototypeOf2.default)(MeanCrossingRate)).call(this, definitions, options));

    _this._mcrs = [];
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(MeanCrossingRate, [{
    key: 'onParamUpdate',
    value: function onParamUpdate(name, value, metas) {}
    // do something ? should not happen as everybody is constant
    // except the callback which is managed in the processVector method


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
          hopSize: this.params.get('hopSize')
        }));
      }

      // const descriptors = this.params.get('descriptors');

      // let len = 0;
      // for (let d of descriptors) {
      //   len += this._descriptorsInfo[d].length;
      // }

      // this.streamParams.frameSize = len;

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {}
    // TODO !!!!!!!!!!!!!!!!!!!!!!!!!!

    /*
    const descriptors = this.params.get('descriptors');
    const callback = this.params.get('callback');
    const inData = frame.data;
    const outData = this.frame.data;
    const accIndices = this.params.get('accIndices');
    const gyrIndices = this.params.get('gyrIndices');
    
    this._features.setAccelerometer(
      inData[accIndices[0]],
      inData[accIndices[1]],
      inData[accIndices[2]]
    );
     this._features.setGyroscope(
      inData[gyrIndices[0]],
      inData[gyrIndices[1]],
      inData[gyrIndices[2]]
    );
     const values = this._features.update();
     let i = 0;
    for (let d of descriptors) {
      const subDesc = this._descriptorsInfo[d]; // the array of the current descriptor's dimensions names
      const subValues = values[d];
       for (let subd of subDesc) {
        if (subd === 'duration' || subd === 'slide') {
          subValues[subd] = 0;
        }
        outData[i] = subValues[subd]; // here we fill the output frame (data)
        i++;
      }
    }
     if (callback) {
      const desc = new Array(this.streamParams.frameSize);
      for (let j = 0; j < desc.length; j++) {
        desc[j] = outData[j];
      }
      callback(desc);
    }
    */


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJub2lzZVRocmVzaG9sZCIsInR5cGUiLCJkZWZhdWx0IiwiZnJhbWVTaXplIiwibWV0YXMiLCJraW5kIiwiaG9wU2l6ZSIsIm51bGxhYmxlIiwiY2VudGVyZWRUaW1lVGFncyIsIk1lYW5Dcm9zc2luZ1JhdGUiLCJvcHRpb25zIiwiX21jcnMiLCJuYW1lIiwidmFsdWUiLCJwcmV2U3RyZWFtUGFyYW1zIiwicHJlcGFyZVN0cmVhbVBhcmFtcyIsImkiLCJwdXNoIiwicGFyYW1zIiwiZ2V0IiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLElBQU1BLGNBQWM7QUFDbEJDLGtCQUFnQjtBQUNkQyxVQUFNLE9BRFE7QUFFZEMsYUFBUztBQUZLLEdBREU7QUFLbEJDLGFBQVc7QUFDVEYsVUFBTSxTQURHO0FBRVRDLGFBQVMsR0FGQTtBQUdURSxXQUFPLEVBQUVDLE1BQU0sUUFBUjtBQUhFLEdBTE87QUFVbEJDLFdBQVMsRUFBRTtBQUNUTCxVQUFNLFNBREM7QUFFUEMsYUFBUyxJQUZGO0FBR1BLLGNBQVUsSUFISDtBQUlQSCxXQUFPLEVBQUVDLE1BQU0sUUFBUjtBQUpBLEdBVlM7QUFnQmxCRyxvQkFBa0I7QUFDaEJQLFVBQU0sU0FEVTtBQUVoQkMsYUFBUztBQUZPO0FBaEJBLENBQXBCOztJQXNCcUJPLGdCOzs7QUFDbkIsOEJBQTBCO0FBQUEsUUFBZEMsT0FBYyx1RUFBSixFQUFJO0FBQUE7O0FBR3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBUHdCLDBKQUNsQlgsV0FEa0IsRUFDTFcsT0FESzs7QUFTeEIsVUFBS0MsS0FBTCxHQUFhLEVBQWI7QUFUd0I7QUFVekI7O0FBRUQ7Ozs7O2tDQUNjQyxJLEVBQU1DLEssRUFBT1QsSyxFQUFPLENBR2pDO0FBRkM7QUFDQTs7O0FBR0Y7Ozs7MENBQzJDO0FBQUEsVUFBdkJVLGdCQUF1Qix1RUFBSixFQUFJOztBQUN6QyxXQUFLQyxtQkFBTCxDQUF5QkQsZ0JBQXpCOztBQUVBOztBQUVBLFdBQUtILEtBQUwsR0FBYSxFQUFiOztBQUVBLFdBQUssSUFBSUssSUFBSSxDQUFiLEVBQWdCQSxJQUFJRixpQkFBaUJYLFNBQXJDLEVBQWdEYSxHQUFoRCxFQUFxRDtBQUNuRCxhQUFLTCxLQUFMLENBQVdNLElBQVgsQ0FBZ0IseUNBQXNCO0FBQ3BDakIsMEJBQWdCLEtBQUtrQixNQUFMLENBQVlDLEdBQVosQ0FBZ0IsZ0JBQWhCLENBRG9CO0FBRXBDaEIscUJBQVcsS0FBS2UsTUFBTCxDQUFZQyxHQUFaLENBQWdCLFdBQWhCLENBRnlCO0FBR3BDYixtQkFBUyxLQUFLWSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsU0FBaEI7QUFIMkIsU0FBdEIsQ0FBaEI7QUFLRDs7QUFFRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxXQUFLQyxxQkFBTDtBQUNEOztBQUVEOzs7O2tDQUNjQyxLLEVBQU8sQ0ErQ3BCO0FBOUNDOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQThDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7a0JBckdtQlosZ0I7QUFzR3BCIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuaW1wb3J0IHsgX01lYW5Dcm9zc2luZ1JhdGUgfSBmcm9tICdfTWVhbkNyb3NzaW5nUmF0ZSc7XG5cbi8vIG1vdGlvbi1pbnB1dCBpbmRpY2VzIDpcbi8vIDAsMSwyIC0+IGFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHlcbi8vIDMsNCw1IC0+IGFjY2VsZXJhdGlvblxuLy8gNiw3LDggLT4gcm90YXRpb25SYXRlXG5cbi8vIGJ1dCwgYXMgdGhleSBhcmUgcHJlcHJvY2Vzc2VkIGJ5IHBhcmVudCBjbGFzcyxcbi8vIGluZGljZXMgZm9yIGFjYyArIGd5cm8gYXJlIDAsIDEsIDIsIDMsIDQsIDUgKHNlZSBiZWxvdylcblxuY29uc3QgZGVmaW5pdGlvbnMgPSB7XG4gIG5vaXNlVGhyZXNob2xkOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBkZWZhdWx0OiAwLjEsXG4gIH0sXG4gIGZyYW1lU2l6ZToge1xuICAgIHR5cGU6ICdpbnRlZ2VyJyxcbiAgICBkZWZhdWx0OiA1MTIsXG4gICAgbWV0YXM6IHsga2luZDogJ3N0YXRpYycgfSxcbiAgfSxcbiAgaG9wU2l6ZTogeyAvLyBzaG91bGQgYmUgbnVsbGFibGVcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogbnVsbCxcbiAgICBudWxsYWJsZTogdHJ1ZSxcbiAgICBtZXRhczogeyBraW5kOiAnc3RhdGljJyB9LFxuICB9LFxuICBjZW50ZXJlZFRpbWVUYWdzOiB7XG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IGZhbHNlLFxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1lYW5Dcm9zc2luZ1JhdGUgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoZGVmaW5pdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgLy8gdGhpcy5fbWNyID0gbmV3IF9NZWFuQ3Jvc3NpbmdSYXRlKHtcbiAgICAvLyAgIG5vaXNlVGhyZXNob2xkOiB0aGlzLnBhcmFtcy5nZXQoJ25vaXNlVGhyZXNob2xkJyksXG4gICAgLy8gICBmcmFtZVNpemU6IHRoaXMucGFyYW1zLmdldCgnZnJhbWVTaXplJyksXG4gICAgLy8gICBob3BTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2hvcFNpemUnKSxcbiAgICAvLyB9KTtcblxuICAgIHRoaXMuX21jcnMgPSBbXTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBvblBhcmFtVXBkYXRlKG5hbWUsIHZhbHVlLCBtZXRhcykge1xuICAgIC8vIGRvIHNvbWV0aGluZyA/IHNob3VsZCBub3QgaGFwcGVuIGFzIGV2ZXJ5Ym9keSBpcyBjb25zdGFudFxuICAgIC8vIGV4Y2VwdCB0aGUgY2FsbGJhY2sgd2hpY2ggaXMgbWFuYWdlZCBpbiB0aGUgcHJvY2Vzc1ZlY3RvciBtZXRob2RcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMgPSB7fSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIC8vIFRPRE8gOiBzZXQgb3V0cHV0IHNhbXBsZXJhdGUgYWNjb3JkaW5nIHRvIGlucHV0IHNhbXBsZXJhdGUgKyBob3BTaXplXG5cbiAgICB0aGlzLl9tY3JzID0gW107XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2U3RyZWFtUGFyYW1zLmZyYW1lU2l6ZTsgaSsrKSB7XG4gICAgICB0aGlzLl9tY3JzLnB1c2gobmV3IF9NZWFuQ3Jvc3NpbmdSYXRlKHtcbiAgICAgICAgbm9pc2VUaHJlc2hvbGQ6IHRoaXMucGFyYW1zLmdldCgnbm9pc2VUaHJlc2hvbGQnKSxcbiAgICAgICAgZnJhbWVTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2ZyYW1lU2l6ZScpLFxuICAgICAgICBob3BTaXplOiB0aGlzLnBhcmFtcy5nZXQoJ2hvcFNpemUnKSxcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvLyBjb25zdCBkZXNjcmlwdG9ycyA9IHRoaXMucGFyYW1zLmdldCgnZGVzY3JpcHRvcnMnKTtcblxuICAgIC8vIGxldCBsZW4gPSAwO1xuICAgIC8vIGZvciAobGV0IGQgb2YgZGVzY3JpcHRvcnMpIHtcbiAgICAvLyAgIGxlbiArPSB0aGlzLl9kZXNjcmlwdG9yc0luZm9bZF0ubGVuZ3RoO1xuICAgIC8vIH1cblxuICAgIC8vIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IGxlbjtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIC8vIFRPRE8gISEhISEhISEhISEhISEhISEhISEhISEhISFcblxuICAgIC8qXG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSB0aGlzLnBhcmFtcy5nZXQoJ2Rlc2NyaXB0b3JzJyk7XG4gICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLnBhcmFtcy5nZXQoJ2NhbGxiYWNrJyk7XG4gICAgY29uc3QgaW5EYXRhID0gZnJhbWUuZGF0YTtcbiAgICBjb25zdCBvdXREYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGFjY0luZGljZXMgPSB0aGlzLnBhcmFtcy5nZXQoJ2FjY0luZGljZXMnKTtcbiAgICBjb25zdCBneXJJbmRpY2VzID0gdGhpcy5wYXJhbXMuZ2V0KCdneXJJbmRpY2VzJyk7XG4gICAgXG4gICAgdGhpcy5fZmVhdHVyZXMuc2V0QWNjZWxlcm9tZXRlcihcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzBdXSxcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzFdXSxcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzJdXVxuICAgICk7XG5cbiAgICB0aGlzLl9mZWF0dXJlcy5zZXRHeXJvc2NvcGUoXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1swXV0sXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1sxXV0sXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1syXV1cbiAgICApO1xuXG4gICAgY29uc3QgdmFsdWVzID0gdGhpcy5fZmVhdHVyZXMudXBkYXRlKCk7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChsZXQgZCBvZiBkZXNjcmlwdG9ycykge1xuICAgICAgY29uc3Qgc3ViRGVzYyA9IHRoaXMuX2Rlc2NyaXB0b3JzSW5mb1tkXTsgLy8gdGhlIGFycmF5IG9mIHRoZSBjdXJyZW50IGRlc2NyaXB0b3IncyBkaW1lbnNpb25zIG5hbWVzXG4gICAgICBjb25zdCBzdWJWYWx1ZXMgPSB2YWx1ZXNbZF07XG5cbiAgICAgIGZvciAobGV0IHN1YmQgb2Ygc3ViRGVzYykge1xuICAgICAgICBpZiAoc3ViZCA9PT0gJ2R1cmF0aW9uJyB8fCBzdWJkID09PSAnc2xpZGUnKSB7XG4gICAgICAgICAgc3ViVmFsdWVzW3N1YmRdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBvdXREYXRhW2ldID0gc3ViVmFsdWVzW3N1YmRdOyAvLyBoZXJlIHdlIGZpbGwgdGhlIG91dHB1dCBmcmFtZSAoZGF0YSlcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgY29uc3QgZGVzYyA9IG5ldyBBcnJheSh0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkZXNjLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGRlc2Nbal0gPSBvdXREYXRhW2pdO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2soZGVzYyk7XG4gICAgfVxuICAgICovXG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgLy8gcHJvY2Vzc0ZyYW1lKGZyYW1lKSB7XG4gIC8vICAgdGhpcy5wcmVwYXJlRnJhbWUoZnJhbWUpO1xuICAvLyAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcbiAgLy8gfVxufTsiXX0=
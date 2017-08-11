'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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

var _MotionFeatures2 = require('./_MotionFeatures');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// motion-input indices :
// 0,1,2 -> accelerationIncludingGravity
// 3,4,5 -> acceleration
// 6,7,8 -> rotationRate

// but, as they are preprocessed by parent class,
// indices for acc + gyro are 0, 1, 2, 3, 4, 5 (see below)

var definitions = {
  descriptors: {
    type: 'any',
    default: ['accRaw', 'gyrRaw', 'accIntensity', 'gyrIntensity', 'freefall', 'kick', 'shake', 'spin', 'still'],
    constant: true
  },
  accIndices: {
    type: 'any',
    default: [0, 1, 2],
    constant: true
  },
  gyrIndices: {
    type: 'any',
    default: [3, 4, 5],
    constant: true
  },
  callback: {
    type: 'any',
    default: null,
    constant: false,
    metas: { kind: 'dynamic' }
  }
};

var MotionFeatures = function (_BaseLfo) {
  (0, _inherits3.default)(MotionFeatures, _BaseLfo);

  function MotionFeatures() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MotionFeatures);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MotionFeatures.__proto__ || (0, _getPrototypeOf2.default)(MotionFeatures)).call(this, definitions, options));

    _this._features = new _MotionFeatures2._MotionFeatures({
      descriptors: _this.params.get('descriptors'),
      spinThresh: 0.5, // original : 200
      stillThresh: 2, // original : 5000
      accIntensityParam1: 0.8,
      accIntensityParam2: 0.1
    });
    // this._callback = this.params.get('callback');

    _this._descriptorsInfo = {
      accRaw: ['x', 'y', 'z'],
      gyrRaw: ['x', 'y', 'z'],
      accIntensity: ['norm', 'x', 'y', 'z'],
      gyrIntensity: ['norm', 'x', 'y', 'z'],
      freefall: ['accNorm', 'falling', 'duration'],
      kick: ['intensity', 'kicking'],
      shake: ['shaking'],
      spin: ['spinning', 'duration', 'gyrNorm'],
      still: ['still', 'slide'],
      gyrZcr: ['amplitude', 'frequency', 'periodicity'],
      accZcr: ['amplitude', 'frequency', 'periodicity']
    };
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(MotionFeatures, [{
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

      var descriptors = this.params.get('descriptors');

      var len = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(descriptors), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var d = _step.value;

          len += this._descriptorsInfo[d].length;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.streamParams.frameSize = len;

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      var descriptors = this.params.get('descriptors');
      var callback = this.params.get('callback');
      var inData = frame.data;
      var outData = this.frame.data;
      var accIndices = this.params.get('accIndices');
      var gyrIndices = this.params.get('gyrIndices');

      this._features.setAccelerometer(inData[accIndices[0]], inData[accIndices[1]], inData[accIndices[2]]);

      this._features.setGyroscope(inData[gyrIndices[0]], inData[gyrIndices[1]], inData[gyrIndices[2]]);

      var values = this._features.update();

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(descriptors), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var d = _step2.value;

          var subDesc = this._descriptorsInfo[d]; // the array of the current descriptor's dimensions names
          var subValues = values[d];

          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = (0, _getIterator3.default)(subDesc), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var subd = _step3.value;

              if (subd === 'duration' || subd === 'slide') {
                subValues[subd] = 0;
              }
              outData[i] = subValues[subd]; // here we fill the output frame (data)
              i++;
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      if (callback) {
        var desc = new Array(this.streamParams.frameSize);
        for (var j = 0; j < desc.length; j++) {
          desc[j] = outData[j];
        }
        callback(desc);
      }
    }

    /** @private */
    // processFrame(frame) {
    //   this.prepareFrame(frame);
    //   this.processFunction(frame);
    // }

  }]);
  return MotionFeatures;
}(_core.BaseLfo);

exports.default = MotionFeatures;
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJkZXNjcmlwdG9ycyIsInR5cGUiLCJkZWZhdWx0IiwiY29uc3RhbnQiLCJhY2NJbmRpY2VzIiwiZ3lySW5kaWNlcyIsImNhbGxiYWNrIiwibWV0YXMiLCJraW5kIiwiTW90aW9uRmVhdHVyZXMiLCJvcHRpb25zIiwiX2ZlYXR1cmVzIiwicGFyYW1zIiwiZ2V0Iiwic3BpblRocmVzaCIsInN0aWxsVGhyZXNoIiwiYWNjSW50ZW5zaXR5UGFyYW0xIiwiYWNjSW50ZW5zaXR5UGFyYW0yIiwiX2Rlc2NyaXB0b3JzSW5mbyIsImFjY1JhdyIsImd5clJhdyIsImFjY0ludGVuc2l0eSIsImd5ckludGVuc2l0eSIsImZyZWVmYWxsIiwia2ljayIsInNoYWtlIiwic3BpbiIsInN0aWxsIiwiZ3lyWmNyIiwiYWNjWmNyIiwibmFtZSIsInZhbHVlIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJsZW4iLCJkIiwibGVuZ3RoIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJpbkRhdGEiLCJkYXRhIiwib3V0RGF0YSIsInNldEFjY2VsZXJvbWV0ZXIiLCJzZXRHeXJvc2NvcGUiLCJ2YWx1ZXMiLCJ1cGRhdGUiLCJpIiwic3ViRGVzYyIsInN1YlZhbHVlcyIsInN1YmQiLCJkZXNjIiwiQXJyYXkiLCJqIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsSUFBTUEsY0FBYztBQUNsQkMsZUFBYTtBQUNYQyxVQUFNLEtBREs7QUFFWEMsYUFBUyxDQUNQLFFBRE8sRUFFUCxRQUZPLEVBR1AsY0FITyxFQUlQLGNBSk8sRUFLUCxVQUxPLEVBTVAsTUFOTyxFQU9QLE9BUE8sRUFRUCxNQVJPLEVBU1AsT0FUTyxDQUZFO0FBYVhDLGNBQVU7QUFiQyxHQURLO0FBZ0JsQkMsY0FBWTtBQUNWSCxVQUFNLEtBREk7QUFFVkMsYUFBUyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUZDO0FBR1ZDLGNBQVU7QUFIQSxHQWhCTTtBQXFCbEJFLGNBQVk7QUFDVkosVUFBTSxLQURJO0FBRVZDLGFBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FGQztBQUdWQyxjQUFVO0FBSEEsR0FyQk07QUEwQmxCRyxZQUFVO0FBQ1JMLFVBQU0sS0FERTtBQUVSQyxhQUFTLElBRkQ7QUFHUkMsY0FBVSxLQUhGO0FBSVJJLFdBQU8sRUFBRUMsTUFBTSxTQUFSO0FBSkM7QUExQlEsQ0FBcEI7O0lBa0NxQkMsYzs7O0FBQ25CLDRCQUEwQjtBQUFBLFFBQWRDLE9BQWMsdUVBQUosRUFBSTtBQUFBOztBQUFBLHNKQUNsQlgsV0FEa0IsRUFDTFcsT0FESzs7QUFHeEIsVUFBS0MsU0FBTCxHQUFpQixxQ0FBb0I7QUFDbkNYLG1CQUFhLE1BQUtZLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixhQUFoQixDQURzQjtBQUVuQ0Msa0JBQVksR0FGdUIsRUFFbEI7QUFDakJDLG1CQUFhLENBSHNCLEVBR25CO0FBQ2hCQywwQkFBb0IsR0FKZTtBQUtuQ0MsMEJBQW9CO0FBTGUsS0FBcEIsQ0FBakI7QUFPQTs7QUFFQSxVQUFLQyxnQkFBTCxHQUF3QjtBQUN0QkMsY0FBUSxDQUFFLEdBQUYsRUFBTyxHQUFQLEVBQVksR0FBWixDQURjO0FBRXRCQyxjQUFRLENBQUUsR0FBRixFQUFPLEdBQVAsRUFBWSxHQUFaLENBRmM7QUFHdEJDLG9CQUFjLENBQUUsTUFBRixFQUFVLEdBQVYsRUFBZSxHQUFmLEVBQW9CLEdBQXBCLENBSFE7QUFJdEJDLG9CQUFjLENBQUUsTUFBRixFQUFVLEdBQVYsRUFBZSxHQUFmLEVBQW9CLEdBQXBCLENBSlE7QUFLdEJDLGdCQUFVLENBQUUsU0FBRixFQUFhLFNBQWIsRUFBd0IsVUFBeEIsQ0FMWTtBQU10QkMsWUFBTSxDQUFFLFdBQUYsRUFBZSxTQUFmLENBTmdCO0FBT3RCQyxhQUFPLENBQUUsU0FBRixDQVBlO0FBUXRCQyxZQUFNLENBQUUsVUFBRixFQUFjLFVBQWQsRUFBMEIsU0FBMUIsQ0FSZ0I7QUFTdEJDLGFBQU8sQ0FBRSxPQUFGLEVBQVcsT0FBWCxDQVRlO0FBVXRCQyxjQUFRLENBQUUsV0FBRixFQUFlLFdBQWYsRUFBNEIsYUFBNUIsQ0FWYztBQVd0QkMsY0FBUSxDQUFFLFdBQUYsRUFBZSxXQUFmLEVBQTRCLGFBQTVCO0FBWGMsS0FBeEI7QUFad0I7QUF5QnpCOztBQUVEOzs7OztrQ0FDY0MsSSxFQUFNQyxLLEVBQU94QixLLEVBQU8sQ0FHakM7QUFGQztBQUNBOzs7QUFHRjs7OzswQ0FDMkM7QUFBQSxVQUF2QnlCLGdCQUF1Qix1RUFBSixFQUFJOztBQUN6QyxXQUFLQyxtQkFBTCxDQUF5QkQsZ0JBQXpCOztBQUVBLFVBQU1oQyxjQUFjLEtBQUtZLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixhQUFoQixDQUFwQjs7QUFFQSxVQUFJcUIsTUFBTSxDQUFWO0FBTHlDO0FBQUE7QUFBQTs7QUFBQTtBQU16Qyx3REFBY2xDLFdBQWQsNEdBQTJCO0FBQUEsY0FBbEJtQyxDQUFrQjs7QUFDekJELGlCQUFPLEtBQUtoQixnQkFBTCxDQUFzQmlCLENBQXRCLEVBQXlCQyxNQUFoQztBQUNEO0FBUndDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBVXpDLFdBQUtDLFlBQUwsQ0FBa0JDLFNBQWxCLEdBQThCSixHQUE5Qjs7QUFFQSxXQUFLSyxxQkFBTDtBQUNEOztBQUVEOzs7O2tDQUNjQyxLLEVBQU87QUFDbkIsVUFBTXhDLGNBQWMsS0FBS1ksTUFBTCxDQUFZQyxHQUFaLENBQWdCLGFBQWhCLENBQXBCO0FBQ0EsVUFBTVAsV0FBVyxLQUFLTSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsVUFBaEIsQ0FBakI7QUFDQSxVQUFNNEIsU0FBU0QsTUFBTUUsSUFBckI7QUFDQSxVQUFNQyxVQUFVLEtBQUtILEtBQUwsQ0FBV0UsSUFBM0I7QUFDQSxVQUFNdEMsYUFBYSxLQUFLUSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsWUFBaEIsQ0FBbkI7QUFDQSxVQUFNUixhQUFhLEtBQUtPLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixZQUFoQixDQUFuQjs7QUFFQSxXQUFLRixTQUFMLENBQWVpQyxnQkFBZixDQUNFSCxPQUFPckMsV0FBVyxDQUFYLENBQVAsQ0FERixFQUVFcUMsT0FBT3JDLFdBQVcsQ0FBWCxDQUFQLENBRkYsRUFHRXFDLE9BQU9yQyxXQUFXLENBQVgsQ0FBUCxDQUhGOztBQU1BLFdBQUtPLFNBQUwsQ0FBZWtDLFlBQWYsQ0FDRUosT0FBT3BDLFdBQVcsQ0FBWCxDQUFQLENBREYsRUFFRW9DLE9BQU9wQyxXQUFXLENBQVgsQ0FBUCxDQUZGLEVBR0VvQyxPQUFPcEMsV0FBVyxDQUFYLENBQVAsQ0FIRjs7QUFNQSxVQUFNeUMsU0FBUyxLQUFLbkMsU0FBTCxDQUFlb0MsTUFBZixFQUFmOztBQUVBLFVBQUlDLElBQUksQ0FBUjtBQXRCbUI7QUFBQTtBQUFBOztBQUFBO0FBdUJuQix5REFBY2hELFdBQWQsaUhBQTJCO0FBQUEsY0FBbEJtQyxDQUFrQjs7QUFDekIsY0FBTWMsVUFBVSxLQUFLL0IsZ0JBQUwsQ0FBc0JpQixDQUF0QixDQUFoQixDQUR5QixDQUNpQjtBQUMxQyxjQUFNZSxZQUFZSixPQUFPWCxDQUFQLENBQWxCOztBQUZ5QjtBQUFBO0FBQUE7O0FBQUE7QUFJekIsNkRBQWlCYyxPQUFqQixpSEFBMEI7QUFBQSxrQkFBakJFLElBQWlCOztBQUN4QixrQkFBSUEsU0FBUyxVQUFULElBQXVCQSxTQUFTLE9BQXBDLEVBQTZDO0FBQzNDRCwwQkFBVUMsSUFBVixJQUFrQixDQUFsQjtBQUNEO0FBQ0RSLHNCQUFRSyxDQUFSLElBQWFFLFVBQVVDLElBQVYsQ0FBYixDQUp3QixDQUlNO0FBQzlCSDtBQUNEO0FBVndCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFXMUI7QUFsQ2tCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBb0NuQixVQUFJMUMsUUFBSixFQUFjO0FBQ1osWUFBTThDLE9BQU8sSUFBSUMsS0FBSixDQUFVLEtBQUtoQixZQUFMLENBQWtCQyxTQUE1QixDQUFiO0FBQ0EsYUFBSyxJQUFJZ0IsSUFBSSxDQUFiLEVBQWdCQSxJQUFJRixLQUFLaEIsTUFBekIsRUFBaUNrQixHQUFqQyxFQUFzQztBQUNwQ0YsZUFBS0UsQ0FBTCxJQUFVWCxRQUFRVyxDQUFSLENBQVY7QUFDRDtBQUNEaEQsaUJBQVM4QyxJQUFUO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7a0JBcEdtQjNDLGM7QUFxR3BCIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuaW1wb3J0IHsgX01vdGlvbkZlYXR1cmVzIH0gZnJvbSAnLi9fTW90aW9uRmVhdHVyZXMnO1xuXG4vLyBtb3Rpb24taW5wdXQgaW5kaWNlcyA6XG4vLyAwLDEsMiAtPiBhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5XG4vLyAzLDQsNSAtPiBhY2NlbGVyYXRpb25cbi8vIDYsNyw4IC0+IHJvdGF0aW9uUmF0ZVxuXG4vLyBidXQsIGFzIHRoZXkgYXJlIHByZXByb2Nlc3NlZCBieSBwYXJlbnQgY2xhc3MsXG4vLyBpbmRpY2VzIGZvciBhY2MgKyBneXJvIGFyZSAwLCAxLCAyLCAzLCA0LCA1IChzZWUgYmVsb3cpXG5cbmNvbnN0IGRlZmluaXRpb25zID0ge1xuICBkZXNjcmlwdG9yczoge1xuICAgIHR5cGU6ICdhbnknLFxuICAgIGRlZmF1bHQ6IFtcbiAgICAgICdhY2NSYXcnLFxuICAgICAgJ2d5clJhdycsXG4gICAgICAnYWNjSW50ZW5zaXR5JyxcbiAgICAgICdneXJJbnRlbnNpdHknLFxuICAgICAgJ2ZyZWVmYWxsJyxcbiAgICAgICdraWNrJyxcbiAgICAgICdzaGFrZScsXG4gICAgICAnc3BpbicsXG4gICAgICAnc3RpbGwnLFxuICAgIF0sXG4gICAgY29uc3RhbnQ6IHRydWUsXG4gIH0sXG4gIGFjY0luZGljZXM6IHtcbiAgICB0eXBlOiAnYW55JyxcbiAgICBkZWZhdWx0OiBbMCwgMSwgMl0sXG4gICAgY29uc3RhbnQ6IHRydWUsXG4gIH0sXG4gIGd5ckluZGljZXM6IHtcbiAgICB0eXBlOiAnYW55JyxcbiAgICBkZWZhdWx0OiBbMywgNCwgNV0sXG4gICAgY29uc3RhbnQ6IHRydWUsXG4gIH0sXG4gIGNhbGxiYWNrOiB7XG4gICAgdHlwZTogJ2FueScsXG4gICAgZGVmYXVsdDogbnVsbCxcbiAgICBjb25zdGFudDogZmFsc2UsXG4gICAgbWV0YXM6IHsga2luZDogJ2R5bmFtaWMnIH0sXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW90aW9uRmVhdHVyZXMgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoZGVmaW5pdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fZmVhdHVyZXMgPSBuZXcgX01vdGlvbkZlYXR1cmVzKHtcbiAgICAgIGRlc2NyaXB0b3JzOiB0aGlzLnBhcmFtcy5nZXQoJ2Rlc2NyaXB0b3JzJyksXG4gICAgICBzcGluVGhyZXNoOiAwLjUsIC8vIG9yaWdpbmFsIDogMjAwXG4gICAgICBzdGlsbFRocmVzaDogMiwgLy8gb3JpZ2luYWwgOiA1MDAwXG4gICAgICBhY2NJbnRlbnNpdHlQYXJhbTE6IDAuOCxcbiAgICAgIGFjY0ludGVuc2l0eVBhcmFtMjogMC4xLFxuICAgIH0pO1xuICAgIC8vIHRoaXMuX2NhbGxiYWNrID0gdGhpcy5wYXJhbXMuZ2V0KCdjYWxsYmFjaycpO1xuXG4gICAgdGhpcy5fZGVzY3JpcHRvcnNJbmZvID0ge1xuICAgICAgYWNjUmF3OiBbICd4JywgJ3knLCAneicgXSxcbiAgICAgIGd5clJhdzogWyAneCcsICd5JywgJ3onIF0sXG4gICAgICBhY2NJbnRlbnNpdHk6IFsgJ25vcm0nLCAneCcsICd5JywgJ3onIF0sXG4gICAgICBneXJJbnRlbnNpdHk6IFsgJ25vcm0nLCAneCcsICd5JywgJ3onIF0sXG4gICAgICBmcmVlZmFsbDogWyAnYWNjTm9ybScsICdmYWxsaW5nJywgJ2R1cmF0aW9uJyBdLFxuICAgICAga2ljazogWyAnaW50ZW5zaXR5JywgJ2tpY2tpbmcnIF0sXG4gICAgICBzaGFrZTogWyAnc2hha2luZycgXSxcbiAgICAgIHNwaW46IFsgJ3NwaW5uaW5nJywgJ2R1cmF0aW9uJywgJ2d5ck5vcm0nIF0sXG4gICAgICBzdGlsbDogWyAnc3RpbGwnLCAnc2xpZGUnIF0sXG4gICAgICBneXJaY3I6IFsgJ2FtcGxpdHVkZScsICdmcmVxdWVuY3knLCAncGVyaW9kaWNpdHknIF0sXG4gICAgICBhY2NaY3I6IFsgJ2FtcGxpdHVkZScsICdmcmVxdWVuY3knLCAncGVyaW9kaWNpdHknIF0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBvblBhcmFtVXBkYXRlKG5hbWUsIHZhbHVlLCBtZXRhcykge1xuICAgIC8vIGRvIHNvbWV0aGluZyA/IHNob3VsZCBub3QgaGFwcGVuIGFzIGV2ZXJ5Ym9keSBpcyBjb25zdGFudFxuICAgIC8vIGV4Y2VwdCB0aGUgY2FsbGJhY2sgd2hpY2ggaXMgbWFuYWdlZCBpbiB0aGUgcHJvY2Vzc1ZlY3RvciBtZXRob2RcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMgPSB7fSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gdGhpcy5wYXJhbXMuZ2V0KCdkZXNjcmlwdG9ycycpO1xuXG4gICAgbGV0IGxlbiA9IDA7XG4gICAgZm9yIChsZXQgZCBvZiBkZXNjcmlwdG9ycykge1xuICAgICAgbGVuICs9IHRoaXMuX2Rlc2NyaXB0b3JzSW5mb1tkXS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gbGVuO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSB0aGlzLnBhcmFtcy5nZXQoJ2Rlc2NyaXB0b3JzJyk7XG4gICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLnBhcmFtcy5nZXQoJ2NhbGxiYWNrJyk7XG4gICAgY29uc3QgaW5EYXRhID0gZnJhbWUuZGF0YTtcbiAgICBjb25zdCBvdXREYXRhID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGFjY0luZGljZXMgPSB0aGlzLnBhcmFtcy5nZXQoJ2FjY0luZGljZXMnKTtcbiAgICBjb25zdCBneXJJbmRpY2VzID0gdGhpcy5wYXJhbXMuZ2V0KCdneXJJbmRpY2VzJyk7XG4gICAgXG4gICAgdGhpcy5fZmVhdHVyZXMuc2V0QWNjZWxlcm9tZXRlcihcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzBdXSxcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzFdXSxcbiAgICAgIGluRGF0YVthY2NJbmRpY2VzWzJdXVxuICAgICk7XG5cbiAgICB0aGlzLl9mZWF0dXJlcy5zZXRHeXJvc2NvcGUoXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1swXV0sXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1sxXV0sXG4gICAgICBpbkRhdGFbZ3lySW5kaWNlc1syXV1cbiAgICApO1xuXG4gICAgY29uc3QgdmFsdWVzID0gdGhpcy5fZmVhdHVyZXMudXBkYXRlKCk7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChsZXQgZCBvZiBkZXNjcmlwdG9ycykge1xuICAgICAgY29uc3Qgc3ViRGVzYyA9IHRoaXMuX2Rlc2NyaXB0b3JzSW5mb1tkXTsgLy8gdGhlIGFycmF5IG9mIHRoZSBjdXJyZW50IGRlc2NyaXB0b3IncyBkaW1lbnNpb25zIG5hbWVzXG4gICAgICBjb25zdCBzdWJWYWx1ZXMgPSB2YWx1ZXNbZF07XG5cbiAgICAgIGZvciAobGV0IHN1YmQgb2Ygc3ViRGVzYykge1xuICAgICAgICBpZiAoc3ViZCA9PT0gJ2R1cmF0aW9uJyB8fCBzdWJkID09PSAnc2xpZGUnKSB7XG4gICAgICAgICAgc3ViVmFsdWVzW3N1YmRdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBvdXREYXRhW2ldID0gc3ViVmFsdWVzW3N1YmRdOyAvLyBoZXJlIHdlIGZpbGwgdGhlIG91dHB1dCBmcmFtZSAoZGF0YSlcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgY29uc3QgZGVzYyA9IG5ldyBBcnJheSh0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkZXNjLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGRlc2Nbal0gPSBvdXREYXRhW2pdO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2soZGVzYyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIC8vIHByb2Nlc3NGcmFtZShmcmFtZSkge1xuICAvLyAgIHRoaXMucHJlcGFyZUZyYW1lKGZyYW1lKTtcbiAgLy8gICB0aGlzLnByb2Nlc3NGdW5jdGlvbihmcmFtZSk7XG4gIC8vIH1cbn07Il19
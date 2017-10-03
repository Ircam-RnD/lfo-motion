import * as lfo from 'waves-lfo/common';

const BaseLfo = lfo.core.BaseLfo;
const MovingMedian = lfo.operator.MovingMedian;

const definitions = {
  filterOrder: {
    type: 'integer',
    default: 5,
    min: 1,
    max: +Infinity,
  },
  threshold: {
    type: 'float',
    default: 0.01,
    min: 0,
    max: 1,
  },
  minInter: {
    type: 'float',
    default: 0.2,
    min: 0,
  },
};

/**
 * Find a kick from the sensors values. The module must be connected to the
 * output of the `Intensity` operator. The module outputs when a kick is found.
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.filterOrder=5] - Buffer size of the internal median filter.
 * @param {Number} [options.threshold=0.01] - Delta intensity threshold above which to trig a kick.
 * @param {Number} [options.minInter=0.2] - Minimum interval between successive trigs in seconds.
 *
 * @example
 * import * as lfo from 'waves-lfo';
 * import * as lfoMotion from 'lfo-motion';
 *
 * const sensors = new lfoMotion.source.MotionInput();
 * const intensity = new lfoMotion.operator.Intensity();
 * const kick = new lfoMotion.operator.Kick();
 * const kickBridge = new lfo.sink.Bridge({
 *   processFrame: frame => {
 *     if (frame[0] === 1)
 *       // do some cool stuff
 *       console.log('kick');
 *   }
 * });
 *
 * sensors.connect(intensity);
 * intensity.connect(kick);
 * kick.connect(kickBridge);
 *
 * sensors.init()
 *   .then(() => {
 *     sensors.start();
 *   });
 */
class Kick extends BaseLfo {
  constructor(options = {}) {
    super(definitions, options);

    this.movingMedian = new MovingMedian({
      order: this.params.get('filterOrder'),
    });

    this._kickStartTime = null;
    this._lastMedian = 0;
    this._peak = 0;
  }

  onParamUpdate(name, value, metas) {
    if (name === 'filterOrder') {
      this.movingMedian.params.set('order', value);
      this.movingMedian.processStreamParams({
        frameType: 'scalar',
        frameSize: 1,
      });
    }
  }

  resetStream() {
    super.resetStream();
  }

  processStreamParams(prevStreamParams) {
    this.prepareStreamParams(prevStreamParams);

    this.streamParams.frameSize = 2;
    this.streamParams.frameRate = 0;
    this.streamParams.description = ['kick', 'peakIntensity'];

    this.movingMedian.processStreamParams({
      frameType: 'scalar',
      frameSize: 1,
    });

    this.propagateStreamParams();
  }

  processVector(frame) {
    const time = frame.time;
    const value = frame.data[0];
    const median = this._lastMedian;
    const delta = value - median;
    const threshold = this.params.get('threshold');
    const minInter = this.params.get('minInter');

    if (delta > threshold) {
      if (this._kickStartTime === null)
        this._kickStartTime = time;

      if (value > this._peak) {
        this._peak = value;
        // output frame
        this.frame.time = time;
        this.frame.data[0] = 1;
        this.frame.data[1] = this._peak;
        this.propagateFrame();
      }
    } else {
      if (time - this._kickStartTime > minInter && this._kickStartTime !== null) {
        this._kickStartTime = null;
        this._peak = 0;
        // output frame
        this.frame.time = time;
        this.frame.data[0] = 0;
        this.frame.data[1] = 0;
        this.propagateFrame();
      }
    }

    this._lastMedian = this.movingMedian.inputScalar(value);
  }

  processFrame(frame) {
    this.prepareStreamParams();
    this.processFunction(frame);
  }
}

export default Kick;

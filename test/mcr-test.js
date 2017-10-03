import test from 'tape';
import * as lfo from 'waves-lfo/common';
import * as lfoMotion from '../src/index';

let result = null;
const sampleRate = 100;

test('mean crossing rate', (t) => {
  const sensors = new lfo.source.EventIn({
    // frameType: 'vector',
    // frameSize: 1,
    // frameRate: 100,

    frameType: 'signal',
    frameSize: 1,
    sampleRate: sampleRate,

    description: [ 'stream of random numbers' ],
  });

  const slicer = new lfo.operator.Slicer({
    frameSize: 256,
    hopSize: 1,
    centeredTimeTags: true,
  })

  const mcr = new lfoMotion.operator.MeanCrossingRate({
    noiseThreshold: 0.05,
    frameSize: 512,
    hopSize: 256,
  });

  const mcrBridge = new lfo.sink.Bridge({
    processFrame: (frame) => {
      result = frame.data;
    },
  });

  //========== Graph creation : ==========//

  // if we want to feed mcr with vectors :

  // sensors.connect(mcr);
  // mcr.connect(mcrBridge);

  // if we want to feed mcr with signal :

  sensors.connect(slicer);
  slicer.connect(mcr);
  mcr.connect(mcrBridge);

  //============== Testing ==============//

  const setGlobalFrameSize = frameSize => {
    sensors.params.set('frameSize', frameSize);
    slicer.params.set('frameSize', frameSize);
    slicer.params.set('hopSize', frameSize);
  }

  sensors.init()
    .then(() => {
      sensors.start();
      let nextInput = [];

      //========== with odd length input

      nextInput = [ -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1 ];

      setGlobalFrameSize(nextInput.length);

      sensors.processFrame({
        time: null,
        data: nextInput,
      });

      t.equal(result[0], 50, 'frequency must be Nyquist');
      t.equal(result[1], 1, 'periodicity must be maximum');

      //========== with even length input, ascending

      nextInput = [ -1, 1, -1, 1, -1, 1, -1, 1, -1, 1 ];

      setGlobalFrameSize(nextInput.length);

      sensors.processFrame({
        time: null,
        data: nextInput,
      });

      t.equal(result[0], 50, 'frequency must be Nyquist');
      t.equal(result[1], 1, 'periodicity must be maximum');

      //========== with even length input, descending

      nextInput = [ 1, -1, 1, -1, 1, -1, 1, -1, 1, -1 ];

      setGlobalFrameSize(nextInput.length);

      sensors.processFrame({
        time: null,
        data: nextInput,
      });

      t.equal(result[0], 50, 'frequency must be Nyquist');
      t.equal(result[1], 1, 'periodicity must be maximum');

      //========== with minimum periodicity (~ impulse)

      nextInput = [ 1, 0, 0, 0, 0, 0 ];

      setGlobalFrameSize(nextInput.length);

      sensors.processFrame({
        time: null,
        data: nextInput,
      });

      const lowestFreq = sampleRate / nextInput.length;
      const epsilon = 10e-6;
      const msg = 'frequency must correspond to `sampleRate / nextInput.length`';

      t.equal((result[0] - lowestFreq) < epsilon, true, msg);
      t.equal(result[1], 0, 'periodicity must be minimum');

      //========== with zero periodicity (varioations below noiseThreshold)

      nextInput = [ 0, 0, 0, 0, 0, 0 ];

      setGlobalFrameSize(nextInput.length);

      sensors.processFrame({
        time: null,
        data: nextInput,
      });

      t.equal(result[0], 0, 'frequency must be zero');
      t.equal(result[1], 0, 'periodicity must be minimum');

      //========== end tests

      t.end();
    });
});

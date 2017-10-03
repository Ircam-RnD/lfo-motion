import test from 'tape';
import * as lfo from 'waves-lfo/common'
import * as lfoMotion from '../src/index';

test('kick', (t) => {
  t.plan(6);

  // const sensors = new source.MotionInput();
  let lastKickValue = 0;

  const sensors = new lfo.source.EventIn({
    frameType: 'vector',
    frameSize: 1,
    frameRate: 100,
  });

  const intensity = new lfoMotion.operator.Intensity({
    feedback: 0.8,
    gain: 0.1,
  });

  const kick = new lfoMotion.operator.Kick({
    filterOrder: 5,
    threshold: 0.01,
    // 200 ms : with a frameRate of 100 Hz, onsets must be spaced by 20 samples
    // or more not to be discarded.
    minInter: 0.2,
  });

  const kickBridge = new lfo.sink.Bridge({
    processFrame: frame => {
      const newKickValue = frame.data[0];

      if (newKickValue !== lastKickValue) {
        if (newKickValue === 1) {
          // console.log('kick start');
          t.equal(true, true);
        } else {
          // console.log('kick stop');
          t.equal(true, true);
        }
      }

      lastKickValue = newKickValue;
    },
  });

  sensors.connect(intensity);
  intensity.connect(kick);
  kick.connect(kickBridge);

  // This only works in a browser :

  // sensors.init()
  //   .then(() => {
  //     sensors.start();
  //   });

  // Browser simulation :

  sensors.init()
    .then(() => {
      sensors.start();

      for (let i = 0; i < 5000; i++)
        sensors.processFrame({
          time: i * 0.01,
          data: [ ((i > 100 && i < 200) || (i > 300 && i < 310)) ? 10000 : 0 ]
        });

      t.end();
    });
});
import test from 'tape';
import _MeanCrossingRate from '../src/operator/_MeanCrossingRate';

/*
test('motion features', (t) => {
  const kickCb = (res) => {
    console.log(`kick : ${res.state} - intensity : ${res.intensity}`);
  };

  const mf = new MotionFeatures({
    descriptors: [
      'accIntensity', 'kick', 'shake',
      'gyrIntensity', 'spin', 'still',
      'freefall'
    ],
    kickCallback: kickCb
  });

  // TODO: write actual tests from recorded file
  t.end();
});
*/

test('mean crossing rate', (t) => {
  let mcr = new _MeanCrossingRate({ noiseThreshold: 0.05 });

  let crossings;
  // console.log(JSON.stringify(crossings));

  crossings = mcr.processFrame([ -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1 ]);
  t.equal(crossings['frequency'], 1);
  t.equal(crossings['periodicity'], 1);

  crossings = mcr.processFrame([ -1, 1, -1, 1, -1, 1, -1, 1, -1, 1 ]);
  t.equal(crossings['frequency'], 1);
  t.equal(crossings['periodicity'], 1);

  crossings = mcr.processFrame([ -1, 1, -1, 1, -1, 1, -1, 1, -1 ]);
  t.equal(crossings['frequency'], 1);
  t.equal(crossings['periodicity'], 1);

  // crossings = mcr.processFrame([ 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, -1 ]);

  crossings = mcr.processFrame([ 1, 0, 0, 0, 0, 0 ]);
  t.equal(crossings['frequency'], 0.2);
  t.equal(crossings['periodicity'], 0);

  /* * * * * WITH SAMPLERATE * * * * */

  mcr = new _MeanCrossingRate({ noiseThreshold: 0.05, sampleRate: 1000 });

  crossings = mcr.processFrame([ -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1 ]);
  t.equal(crossings['frequency'], 500);
  t.equal(crossings['periodicity'], 1);

  t.end();
});

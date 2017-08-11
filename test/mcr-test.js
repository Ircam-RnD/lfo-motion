import test from 'tape';
import { _MeanCrossingRate } from '../src/operator/_MeanCrossingRate';

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

  //TODO: write actual tests from recorded file
  t.end();
});
*/

test('mean crossing rate', (t) => {
  const mcr = new _MeanCrossingRate({ noiseThreshold: 0.05 });

  let crossings;

  crossings = mcr.process([ -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1 ]);
  //console.log(JSON.stringify(crossings));
  m.equal(crossings['frequency'], 1);
  m.equal(crossings['periodicity'], 1);

  crossings = mcr.process([ 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, -1 ]);
  //console.log(JSON.stringify(crossings));

  crossings = mcr.process([ 1, 0, 0, 0, 0, 0 ]);
  console.log(JSON.stringify(crossings));

  t.end();
});

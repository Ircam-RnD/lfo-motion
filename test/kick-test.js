import test from 'tape';
import { sink } from 'waves-lfo/common'
import { source, operator } from '../src/index';

const motionInput = new source.MotionInput();
const kick = new operator.MotionFeatures({
  features: [ 'kick' ],
});

// const bridge = new sink.Bridge({
//   callback: (value) => {
//     if (value === 1)
//       // do stuff
//       console.log('kick');
//   }
// });

motionInput.connect(kick);
// kick.connect(bridge);

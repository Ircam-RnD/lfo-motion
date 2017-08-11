import * as lfo from 'waves-lfo/client';
import MotionInput from '../../../../dist/source/MotionInput';

const motionInput = new MotionInput();
const socketSend = new lfo.sink.SocketSend({ port: 5000 });
const logger = new lfo.sink.Logger({ time: false, data: true });

motionInput.connect(socketSend);

motionInput
  .init()
  .then(() => motionInput.start())
  .catch(err => console.log(err.stack));

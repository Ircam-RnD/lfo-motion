import * as lfo from '../../../../node_modules/waves-lfo/client';
import * as controllers from 'basic-controllers'
import * as lfoMotion from '../../../../dist';

const motionInput = new lfoMotion.source.MotionInput();
const onOff = new lfo.operator.OnOff({ state: 'on' });
const socketSend = new lfo.sink.SocketSend({ port: 5000 });

motionInput.connect(onOff);
onOff.connect(socketSend);

motionInput
  .init()
  .then(() => motionInput.start())
  .catch(err => console.log(err.stack));


// ---------------------------------------------------------------
// CONTROLS
// ---------------------------------------------------------------

const toggleStream = new controllers.Toggle({
  label: 'On / Off',
  active: true,
  container: '#controls',
  callback: value => {
    if (value)
      onOff.setState('on');
    else
      onOff.setState('off');
  }
})

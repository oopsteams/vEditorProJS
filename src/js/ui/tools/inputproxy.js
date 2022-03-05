import snippet from 'tui-code-snippet';
import { keyCodes } from '@/consts';
const TIMER_DELAY = 6 * 1000;

class InputProxy {
  constructor(textElement) {
    this.textElement = textElement;
    this.timer = null;
    this.__lastValue = this.textElement.value;
    this.__dirtyValue = this.__lastValue;
    this.eventHandler = {
      onTextInput: this._onTextInput.bind(this),
      onKeydown: this._onKeydown.bind(this),
      onTextChanged: this._onTextChanged.bind(this),
    };
    this._addEvent();
  }

  __stopTimer() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  __startTimer() {
    this.__stopTimer();
    const timerAction = () => {
      this._onTextChanged();
    };
    this.timer = window.setTimeout(timerAction, TIMER_DELAY);
  }

  _addEvent() {
    this.textElement.addEventListener('input', this.eventHandler.onTextInput);
    this.textElement.addEventListener('keydown', this.eventHandler.onKeydown);
    this.textElement.addEventListener('change', this.eventHandler.onTextChanged);
  }

  _removeEvent() {
    this.textElement.removeEventListener('input', this.eventHandler.onTextInput);
    this.textElement.removeEventListener('keydown', this.eventHandler.onKeydown);
    this.textElement.removeEventListener('change', this.eventHandler.onTextChanged);
  }

  startListener() {
    this._removeEvent();
    this._addEvent();
  }

  stopListener() {
    this.__stopTimer();
    this._removeEvent();
  }

  _onKeydown(event) {
    const { keyCode } = event;
    if (keyCode === keyCodes.ENTER) {
      this._onTextChanged();
    } else {
      // maybe input number by key press.
      const { value } = this.textElement;
      if (this.__dirtyValue !== value) {
        this.__dirtyValue = value;
        this.__startTimer();
      }
    }
  }

  _onTextChanged() {
    console.log('_onTextChanged value:', this.textElement.value);
    console.log('_onTextChanged __lastValue:', this.__lastValue);
    console.log('_onTextChanged __dirtyValue:', this.__dirtyValue);
    if (this.__lastValue !== this.__dirtyValue) {
      this.__stopTimer();
      this.__lastValue = this.__dirtyValue;
      this.fire('change', { target: this.textElement });
    }
  }

  _onTextInput() {
    const { value } = this.textElement;
    console.log('Inputproxy value:', value);
    if (this.__dirtyValue !== value) {
      this.__startTimer();
      this.__dirtyValue = value;
    }
  }
}

snippet.CustomEvents.mixin(InputProxy);
export default InputProxy;

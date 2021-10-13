import snippet from 'tui-code-snippet';
import fabric from 'fabric';
import Panel from '@/timeline/component/panel';
import Track from '@/timeline/component/track';
import WaveTrack from '../component/wavetrack';
import { getProperties, includes } from '@/util';
const { stamp, CustomEvents, extend, isArray } = snippet;

import { eventNames as events, tlComponentNames } from '@/consts';

const cssOnly = {
  cssOnly: true,
};
const backstoreOnly = {
  backstoreOnly: true,
};
// const pad = 5;
// const MIN_SPACE = 45;
const PANEL_HEIGHT = 50;
class TimeLine {
  constructor(
    wrapElement,
    { locale, makeSvgIcon, ui, cssPrefix, previewItemWidth, previewItemHeight }
  ) {
    this.ui = ui;
    this.inited = false;
    this.cssPrefix = cssPrefix;
    this.type = null;
    this.wrapElement = wrapElement;
    this.locale = locale;
    this.makeSvgIcon = makeSvgIcon;
    this.previewItemWidth = previewItemWidth;
    this.previewItemHeight = previewItemHeight;
    this.initCanvas();
    this._componentMap = {};
    this._objects = {};
    this.activeObj = null;
    this._handler = {
      onMouseDown: this._onMouseDown.bind(this),
      onObjectAdded: this._onObjectAdded.bind(this),
      onObjectRemoved: this._onObjectRemoved.bind(this),
      onObjectMoved: this._onObjectMoved.bind(this),
      onObjectSelected: this._onObjectSelected.bind(this),
    };
    this._createComponents();
    this._attachCanvasEvents();
    this.setTick().then((fPanel) => {
      this.inited = true;
      this.track = new Track(this, { top: fPanel.height, previewItemWidth, previewItemHeight });
      this.wavetrack = new WaveTrack(this, { top: fPanel.height + this.track.getBoxHeight() });
    });
    window.timeline = this;
  }

  getTimeLineMaxRect() {
    const rect = {};
    if (this.wrapElement) {
      rect.width = this.wrapElement.clientWidth;
      rect.height = this.wrapElement.clientHeight;
    }

    return rect;
  }

  initCanvas() {
    const dimension = this.getTimeLineMaxRect();
    const wrapHeight = dimension.height;
    this.canvasElement = document.createElement('canvas');
    this.wrapElement.appendChild(this.canvasElement);
    this._canvas = new fabric.Canvas(this.canvasElement, {
      containerClass: `${this.cssPrefix}-ruler-canvas-container`,
      enableRetinaScaling: true,
      selection: false,
    });
    dimension.height = Math.floor(wrapHeight * 1.2);
    this.resetDimension(dimension);
    this.contextContainer = this.canvasElement.getContext('2d');
    this.wrapElement.style.height = `${wrapHeight}px`;
    const footLayerRect = this.ui.getFootLayerMaxRect();
    console.log('footLayerRect height:', footLayerRect.height, ', wrapHeight:', wrapHeight);
    if (footLayerRect.height > wrapHeight) {
      this.wrapElement.style.height = `${footLayerRect.height}px`;
    }
    this.duration = Math.floor(dimension.width / this.previewItemWidth);
    // console.log('this.wrapElement.style.height:', this.wrapElement.style.height);
    // this._timelineElementWrap = document.querySelector(`.${this.cssPrefix}-timeline-wrap`);
    // console.log('this._timelineElementWrap.style.height:', this._timelineElementWrap.style.height);
  }

  resizeEditor({ width, height }) {
    const dimension = {};
    dimension.height = height * 2;
    dimension.width = width;
    this.resetDimension(dimension);
    console.log('timeline resizeEditor:', width, height);
    this.wrapElement.style.height = `${height}px`;
  }

  lock() {
    this.getPanel().disable();
    this.track.lock();
    this.deactivateAll();
  }

  unlock() {
    this.getPanel().enable();
    if (this.track) {
      this.track.unlock();
    }
  }

  setTick() {
    let count = Math.floor(this.duration);
    if (count < this.duration) {
      count = count + 1;
    }
    const height = this._canvas.getHeight();
    // const width = this._canvas.getWidth();
    // Math.floor(height * 0.1)
    const space = this.previewItemWidth; // (width - pad * 2) / (count + 1);
    const center = this.getCenter();
    console.log('height:', height);
    this.indicator = new fabric.Rect({
      type: 'rect',
      version: '3.6.3',
      left: center.left,
      top: PANEL_HEIGHT,
      width: 3,
      height: Math.floor(height - PANEL_HEIGHT),
      fill: '#f5f7f5',
      opacity: 1,
      hoverCursor: 'default',
      selectable: false,
    });
    const labelOptions = {
      left: center.left + 2,
      fontSize: 14,
      stroke: '#fff',
      fill: '#fff',
      top: Math.floor(PANEL_HEIGHT - 16),
      fontStyle: 'normal',
      fontWeight: 'normal',
      hoverCursor: 'default',
      selectable: false,
    };
    this.indicatorLabel = new fabric.Text('', labelOptions);
    // this._canvas.add(this.indicator);
    this.add(this.indicator);
    this.add(this.indicatorLabel);

    this.on({
      [events.TIME_CHANGED]: (params) => {
        const { time } = params;
        this.indicatorLabel.text = `${time}`;
      },
    });

    return this.getComponent(tlComponentNames.PANEL).setup({
      count,
      space,
      maxHeight: this.indicator.top,
    });
  }

  addVideoFrames(dur, files, context, cb) {
    const start = 0;
    // const duration = Math.round(dur);
    this.track.addVideoFrames(start, dur, files, this.previewItemWidth, context).then(() => {
      // console.log('fTrack add video ok:', fTrack);
      this.getComponent(tlComponentNames.PANEL).enable();
      if (cb) {
        cb();
      }
    });
  }

  addTransition(trackItem, duration, context, cb) {
    const start = 0;
    this.track
      .addTransition(trackItem, start, duration, this.previewItemWidth, context)
      .then(() => {
        if (cb) {
          cb();
        }
      });
  }

  addWave(dur, files, context, cb) {
    this.wavetrack.addWave(0, dur, files, this.previewItemWidth, context).then(() => {
      const waveDuration = this.wavetrack.totalDuration();
      const trackDuration = this.track.totalDuration();
      if (waveDuration > trackDuration) {
        this.changeDuration(waveDuration).then(() => {
          if (cb) {
            cb();
          }
        });
      } else if (cb) {
        cb();
      }
    });
  }

  getCurrentProgress() {
    return this.getComponent(tlComponentNames.PANEL).getCurrentProgress();
  }

  convertTimeToPos(time) {
    return this.getComponent(tlComponentNames.PANEL).getLeftPosByProgress(time);
  }

  getPosOffset(progress) {
    return this.getComponent(tlComponentNames.PANEL).getPosOffset(progress);
  }

  checkInRound(left, right) {
    return this.getComponent(tlComponentNames.PANEL).checkInRound(left, right);
  }

  getPanel() {
    return this.getComponent(tlComponentNames.PANEL);
  }

  getCurrentTime() {
    const progress = this.getCurrentProgress();
    return this.duration * progress;
  }

  changeTime(time) {
    const progress = time / this.duration;
    this.fire(events.PANEL_POS_CHANGED, { progress });
  }

  changeDuration(dur) {
    if (dur !== this.duration) {
      this.duration = dur;
      let count = Math.floor(this.duration);
      if (count < this.duration) {
        count = count + 1;
      }
      // const width = this._canvas.getWidth();
      const space = this.previewItemWidth; // (width - pad * 2) / (count + 1);

      return this.getComponent(tlComponentNames.PANEL).ticksChanged({
        count,
        space,
        duration: this.duration,
      });
    }

    return Promise.resolve();
  }

  totalDuration() {
    return this.track.totalDuration();
  }

  getCenter() {
    return this._canvas.getCenter();
  }

  setActiveObject(target) {
    this._canvas.setActiveObject(target);
  }

  getCanvas() {
    return this._canvas;
  }

  getCanvasElement() {
    return this.canvasElement;
  }

  resetDimension(dimension) {
    console.log('dimension:', dimension);
    const dim = {
      width: `${dimension.width}px`,
      height: `${dimension.height}px`, // Set height '' for IE9
      'max-width': `${dimension.width}px`,
      'max-height': `${dimension.height}px`,
    };
    this._canvas.setDimensions(dim, cssOnly);
    this._canvas.setDimensions(dimension, backstoreOnly);
  }

  showIndicator() {
    if (this.inited) {
      this.indicatorLabel.bringToFront();
      this.indicator.bringToFront();
    }
  }

  indicatorMoved({ time, progress }) {
    if (this.inited) {
      this.indicatorLabel.bringToFront();
      this.indicator.bringToFront();
      this.fire(events.TIME_CHANGED, { progress, time, duration: this.duration });
    }
  }

  syncIndicator({ time, progress }) {
    if (this.inited) {
      this.fire(events.SYNC_TIME_CHANGED, { progress, time, duration: this.duration });
    }
  }

  deactivateAll() {
    // if (this.activeObj) {
    //   this.setActiveObject(this.activeObj);
    // }
    this._canvas.renderAll();
    this._canvas.discardActiveObject();

    return this;
  }

  updateActiveObj(fObj) {
    this.activeObj = fObj;
    this.setActiveObject(this.activeObj);
  }

  renderRuler() {}

  selector(selectName) {
    return this.wrapElement.querySelector(selectName);
  }

  _createComponents() {
    this._register(this._componentMap, new Panel(this));
  }

  getComponent(name) {
    return this._componentMap[name];
  }

  _register(map, module) {
    map[module.getName()] = module;
  }

  _addFabricObject(obj) {
    const id = stamp(obj);
    this._objects[id] = obj;

    return id;
  }

  _removeFabricObject(id) {
    delete this._objects[id];
  }

  _createTextProperties(obj) {
    const predefinedKeys = [
      'text',
      'fontFamily',
      'fontSize',
      'fontStyle',
      'textAlign',
      'textDecoration',
      'fontWeight',
    ];
    const props = {};
    extend(props, getProperties(obj, predefinedKeys));

    return props;
  }

  createObjectProperties(obj) {
    const predefinedKeys = [
      'left',
      'top',
      'width',
      'height',
      'fill',
      'stroke',
      'strokeWidth',
      'opacity',
      'angle',
    ];
    const props = {
      id: stamp(obj),
      type: obj.type,
    };
    extend(props, getProperties(obj, predefinedKeys));

    if (includes(['i-text', 'text'], obj.type)) {
      extend(props, this._createTextProperties(obj, props));
    }

    return props;
  }

  _lazyFire(eventName, paramsMaker, target) {
    const existEventDelegation = target && target.canvasEventDelegation;
    const delegationState = existEventDelegation ? target.canvasEventDelegation(eventName) : 'none';
    // console.log('_lazyFire target:', target);
    if (delegationState === 'unregistered') {
      target.canvasEventRegister(eventName, (object) => {
        this.fire(eventName, paramsMaker(object));
      });
    }

    if (delegationState === 'none') {
      this.fire(eventName, paramsMaker(target));
    }
  }

  /* All Event Handlers */
  _onMouseDown(fEvent) {
    const { e: event } = fEvent;
    const originPointer = this._canvas.getPointer(event);
    this.fire(events.MOUSE_DOWN, event, originPointer);
  }

  _onObjectAdded(fEvent) {
    const obj = fEvent.target;
    this._addFabricObject(obj);
  }

  _onObjectRemoved(fEvent) {
    const obj = fEvent.target;

    this._removeFabricObject(stamp(obj));
  }

  _onObjectMoved(fEvent) {
    this._lazyFire(
      events.OBJECT_MOVED,
      (object) => this.createObjectProperties(object),
      fEvent.target
    );
  }

  _onObjectSelected(fEvent) {
    const { target } = fEvent;
    const params = this.createObjectProperties(target);
    this.fire(events.OBJECT_ACTIVATED, params);
  }

  _attachCanvasEvents() {
    const canvas = this._canvas;
    const handler = this._handler;
    canvas.on({
      'mouse:down': handler.onMouseDown,
      'object:added': handler.onObjectAdded,
      'object:removed': handler.onObjectRemoved,
      'object:moving': handler.onObjectMoved,
      'selection:updated': handler.onObjectSelected,
    });
  }

  add(objects) {
    let theArgs = [];
    if (isArray(objects)) {
      theArgs = objects;
    } else {
      theArgs.push(objects);
    }

    this._canvas.add(...theArgs);
  }
}

CustomEvents.mixin(TimeLine);

export default TimeLine;

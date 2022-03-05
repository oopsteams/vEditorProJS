import snippet from 'tui-code-snippet';
import fabric from 'fabric';
const { CustomEvents } = snippet;
import { roundValue } from '@/util';
const VERSION = { ver: 0 };

class SceneEffectItem {
  constructor({ start, duration, space, top, height, context }, track) {
    this.name = 'sceneeffect';
    this.start = start;
    this.duration = duration;
    this.context = context;
    this.track = track;
    this.space = space;
    this.boxHeight = height;
    this.top = top;
    this.range = [];
    this.startOffset = 0;
    this.timeRange = [];
    this.xyRange = [];
    this.transition = null;
    this.hasTransition = false;
    this.version = VERSION.ver;
    VERSION.ver += 1;
    // this._handlers = {
    //   mousedown: this._onFabricMouseDown.bind(this),
    //   mousemove: this._onFabricMouseMove.bind(this),
    //   mouseup: this._onFabricMouseUp.bind(this),
    // };
    this.lastStart = -1;

    this.timeRange[0] = 0;
    this.timeRange[1] = this.timeRange[0] + this.context.duration;
  }

  createGroup() {
    // const { start } = this;
    const start = this.reComputeStart();
    const x = this.getTimeline().convertTimeToPos(start);
    console.log('sceneEffect createGroup start:', start, ',x:', x);
    const views = [];
    this.frameViews.forEach((fv) => {
      if (!fv.exclude) {
        views.push(fv);
      }
    });
    const itemPanel = new fabric.Group(views, {
      left: x,
      top: this.top,
      lockMovementY: true,
      lockMovementX: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
      selectable: true,
      hoverCursor: 'default',
    });
    // selectable: false,
    this.itemPanel = itemPanel;

    return itemPanel;
  }

  setup() {
    // const { start } = this;
    const start = this.reComputeStart();
    console.log('sceneEffect setup start:', start);
    this.range[0] = this.getTimeline().convertTimeToPos(start);
    this.timeRange[0] = 0;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    this.timeRange[1] = this.timeRange[0] + this.context.duration;
    // this.setListener();

    return this.setFrames().then(() => {
      return this._make();
    });
  }

  changeDuration({ startAt, dur, callback }) {
    this.timeRange[0] = startAt;
    this.timeRange[1] = this.timeRange[0] + dur;
    this._rebuild(callback);
  }

  setListener() {
    const { trackItem } = this.context;
    trackItem.on({
      'track:item:start:changed': this.timeChanged.bind(this),
    });
  }

  setFrames() {
    this.frameViews = [];
    this.labels = [];

    return new Promise((resolve) => {
      this._newPolygon(() => {
        resolve();
      });
    });
  }

  _newRectOption() {
    const height = this.boxHeight;
    const width = this.space * this.getDuration();
    const options = {
      // type: 'rect',
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      stroke: '#ffffff',
      fill: '#898989',
      backgroundColor: '#585858',
      strokeWidth: 0,
      originX: 'left',
      fontSize: '14',
    };
    return options;
  }

  _newPolygon(callback) {
    // const { section } = this.context;
    const height = this.boxHeight;
    const width = this.space * this.getDuration();
    const options = {
      // type: 'rect',
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      stroke: '#ffffff',
      fill: '#a9a9a9',
      backgroundColor: '#585858',
      strokeWidth: 1,
      originX: 'left',
      fontSize: '14',
    };
    // const polygon = new fabric.Polygon(this.points, options);
    const rect = new fabric.Rect(this._newRectOption());
    rect.set({ fill: 'transparent' });
    const polygon = new fabric.Text('', options);
    this.label = polygon;
    this.frameViews.push(rect);
    this.frameViews.push(polygon);
    // this.originWidth = width;
    this.updateText();
    callback();
  }

  updateText() {
    let txt;
    const [, textBox] = this.frameViews;
    // const textBox = this.frameViews[1];
    if (textBox) {
      const tb = textBox;
      const { text } = this.context;
      txt = text;
      if (txt.length > 5) {
        txt = txt.substring(0, 5);
      }
      tb.text = txt;
      // const lineHeight = tb.calcTextHeight();
      this.getCanvas().renderAll();
      // const lineWidth = tb.calcTextWidth();
      // console.log('updateText lineWidth:', lineWidth);
    }
  }

  scaleLabel(width) {
    if (this.originWidth > 0) {
      const scaleX = width / this.originWidth;
      this.label.scaleX = scaleX > 1 ? 1 : scaleX;
    }
  }

  _make() {
    const width = this.space * this.getDuration();
    const group = this.createGroup(width);
    this.scaleLabel(width);

    return new Promise((resolve) => {
      const canvas = this.getCanvas();
      this._bindEventOnObj(group, (fObj) => {
        this.version = this.version + 1;
        this.xyRange[0] = fObj.left;
        this.xyRange[1] = fObj.left + fObj.width;
        // window.group = fObj;
        group.setCoords();
        canvas.renderAll();
        resolve(fObj);
      });
      canvas.add(group);
    });
  }

  reComputeStart() {
    const { trackItem } = this.context;
    const { start } = trackItem;
    // console.log('reComputeStart trackItem start:', start, ',timeRange:', this.timeRange);

    return start + this.timeRange[0];
  }

  getMaxTimeRange() {
    const { trackItem } = this.context;
    const { start } = trackItem;
    const dur = trackItem.getDuration();
    return { start, dur };
  }

  checkInCorrectRange2(x0, x1) {
    const { trackItem } = this.context;
    // const permit = this.track.timeline.checkInRound(x0, x1);
    console.log('checkInCorrectRange x0:', x0, ',x1:', x1, ',xyrange:', trackItem.xyRange);

    let newStart = this.getTimeline().convertPosToTime(x0);
    let newEnd = this.getTimeline().convertPosToTime(x1);
    const { start, dur } = this.getMaxTimeRange();
    console.log('maxTimeRange start:', start, ',dur:', dur, ',newStart:', newStart);
    console.log('maxTimeRange newEnd:', newEnd);
    if (newStart < start) {
      newStart = start;
      newEnd = newStart + this.getDuration();
    }
    if (newEnd > start + dur) {
      newEnd = start + dur;
      newStart = newEnd - this.getDuration();
    }
    x0 = this.getTimeline().convertTimeToPos(newStart);
    x1 = this.getTimeline().convertTimeToPos(newEnd);
    const startX = this.getTimeline().convertTimeToPos(start);
    const diffx = trackItem.xyRange[0] - startX;
    console.log('checkInCorrectRange result x0:', x0, ',x1:', x1, ',diffx:', diffx);
    console.log('maxTimeRange final newStart:', newStart, ',newEnd:', newEnd);

    return { left: x0 + diffx, right: x1 + diffx };
  }

  checkInCorrectRange(x0, x1) {
    let newStart = this.getTimeline().convertPosToTime(x0, true);
    let newEnd = this.getTimeline().convertPosToTime(x1, true);
    const { start, dur } = this.getMaxTimeRange();
    if (newStart < start) {
      newStart = start;
      newEnd = newStart + this.getDuration();
    }
    if (newEnd > start + dur) {
      newEnd = start + dur;
      newStart = newEnd - this.getDuration();
    }
    const startPos = this.getTimeline().getPanel().calcPosByTime(newStart);
    x0 = startPos.diff + startPos.centerLeft;
    const endPos = this.getTimeline().getPanel().calcPosByTime(newEnd);

    x1 = endPos.diff + endPos.centerLeft;
    const rx0 = startPos.diff + startPos.left;
    const rx1 = endPos.diff + endPos.left;
    // const startX = this.getTimeline().convertTimeToPos(start);
    const diffx = 0;

    return { left: x0 + diffx, right: x1 + diffx, start: newStart, end: newEnd, rx0, rx1 };
  }

  isInSameGroup(seItem) {
    const { trackItem } = this.context;
    return trackItem === seItem.context.trackItem;
  }

  getDuration() {
    return this.timeRange[1] - this.timeRange[0];
  }

  updateRect() {
    const width = this.space * this.getDuration();
    const [rect, textBox] = this.frameViews;
    rect.set({ width });
    textBox.set({ width });
    // const textBox = this.frameViews[1];
    const lineWidth = textBox.calcTextWidth();
    if (lineWidth > width) {
      // const scalex = width / lineWidth;
      // textBox.scaleX = scalex;
    }
  }

  timeChanged(deltaX) {
    const newStart = this.reComputeStart();
    const newX = this.getTimeline().convertTimeToPos(newStart);

    // console.log('sceneEffect timeChanged deltaX:', deltaX);
    this.itemPanel.left = newX + deltaX;
    this.xyRange[0] = this.itemPanel.left;
    this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
    this.itemPanel.setCoords();
    this.syncOffset();
  }

  triggerTimeChange(callback) {
    this.getTimeline().getPanel().fire(`panel:time:changed`, {});
    const { section, mode } = this.context;
    // this.getTimeline().ui.datasource.fire(`${this.track.eventPrefix.track}:time:change`, {
    //   index,
    //   section,
    //   range: this.timeRange,
    //   start: this.reComputeStart(),
    //   callback,
    // });
    this.getTimeline().ui.datasource.fire(`${this.track.eventPrefix.track}:scale`, {
      section,
      mode,
      start: this.reComputeStart(),
      range: this.timeRange,
      callback,
    });
  }

  updateStart(newStart) {
    const _lastStart = this.reComputeStart();
    // const newStart = this.reComputeStart();
    if (newStart !== _lastStart) {
      const dur = this.getDuration();
      const { start } = this.context.trackItem;
      this.timeRange[0] = newStart - start;
      this.timeRange[1] = this.timeRange[0] + dur;
      this.lastStart = newStart;
      const newX = this.getTimeline().convertTimeToPos(newStart);
      console.log('sceneEffect newStart:', newStart, ',timeRange:', this.timeRange);
      console.log('sceneEffect trackItem start:', start);
      this.range[0] = newX;
      const end = newStart + this.duration;
      this.range[1] = this.getTimeline().convertTimeToPos(end);
      // this.start = newStart;
      // const diff = newX - x;
      this.itemPanel.left = newX;
      this.xyRange[0] = this.itemPanel.left;
      this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
      this.itemPanel.setCoords();
      // this.getTimeline().updateActiveObj(this.itemPanel);
      // console.log('this.version:', this.version, 'panel left:', this.itemPanel.left);
    }
    this.triggerTimeChange();
    // this.getTimeline().fire(`${this.track.eventPrefix.track}:scale`, {
    //   section: this.context.section,
    //   mode: this.context.mode,
    //   start: this.reComputeStart(),
    //   range: this.timeRange,
    // });
  }

  updateRectWidth() {
    const width = this.space * this.getDuration();
    // const [polygon] = this.frameViews;
    this.frameViews.forEach((item) => {
      item.set({ width });
      item.setCoords();
    });
  }

  syncOffset() {
    const { left, top, width, height } = this.getRect();
    this.fire(`${this.track.eventPrefix.track}:move`, { left, top, width, height });
  }

  _rebuild(cb) {
    this.updateRectWidth();
    this.getCanvas().remove(this.itemPanel);
    this._make().then(() => {
      this.track.active(this);
      // this.getTimeline().fire(`${this.track.eventPrefix.track}:scale`, {
      //   section: this.context.section,
      //   mode: this.context.mode,
      //   start: this.reComputeStart(),
      //   range: this.timeRange,
      // });
      this.syncOffset();
      this.triggerTimeChange();
      if (cb) {
        cb(this);
      }
    });
  }

  increaseDuration(delta) {
    this.context.duration += delta;
    this.duration = this.context.duration;
    const { start } = this;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);

    return Promise.resolve();
  }

  updateSize({ left, right }) {
    let newT, delta;
    // console.log('updateSize left:', left, ',right:', right);
    const { duration } = this.context;

    const reBuild = () => {
      this._rebuild();
    };
    const t = this.getDuration();
    if (t < 0.1) {
      this.timeRange[1] = this.timeRange[0] + 0.1;
      reBuild();

      return;
    }
    if (left === 1) {
      newT = roundValue(t * right);
      if (newT + this.timeRange[0] > duration) {
        delta = newT + this.timeRange[0] - duration;
        if (delta >= 0.05) {
          delta = Math.floor(delta * 100) / 100;
          newT = delta + duration - this.timeRange[0];
          this.timeRange[1] = this.timeRange[0] + newT;
          this.increaseDuration(delta).then(() => {
            reBuild();
          });

          return;
        }
        newT = roundValue(duration - this.timeRange[0]);
      }
      this.timeRange[1] = this.timeRange[0] + newT;
      reBuild();
    } else {
      const timeDiff = t * (1 - left) + this.timeRange[0];
      if (timeDiff <= 0) {
        if (this.timeRange[0] === 0) {
          return;
        }
        this.timeRange[0] = 0;
      } else {
        this.timeRange[0] = roundValue(timeDiff);
      }
      reBuild();
    }
  }

  getTimeline() {
    return this.track.timeline;
  }

  getCanvas() {
    return this.track.timeline.getCanvas();
  }

  dispose(callback) {
    this.getCanvas().remove(this.itemPanel);
    this.track.remove(this);
    this.track.timeline.fire(`${this.track.eventPrefix.track}:ui:remove`, {
      item: this,
      callback,
    });
    // console.log('will set null context.trackItem:', this.context.trackItem);
    this.context.trackItem = null;
  }

  getRect() {
    const { left, top, width, height } = this.itemPanel;

    return { left, top, width, height };
  }

  updateTop(top) {
    if (top !== this.top) {
      this.top = top;
      this.itemPanel.set({ top });
      this.itemPanel.setCoords();
    }
  }

  focus() {
    this.track.active(this);
    this.track.timeline.fire(`${this.track.eventPrefix.slip}:selected`, { item: this });
    // const [, tb] = this.frameViews;
    if (!this.originWidth) {
      this.originWidth = this.label.width;
      const width = this.space * this.getDuration();
      this.scaleLabel(width);
    }
    console.log('effect calcTextWidth:', this.originWidth);
  }

  blur() {
    this.track.timeline.fire(`${this.track.eventPrefix.slip}:unselected`, { item: this });
  }

  _bindEventOnObj(fObj, cb) {
    const self = this;
    const canvas = this.getCanvas();

    fObj.on({
      added() {
        if (cb) {
          cb(this);
        }
      },
      selected() {
        self._isSelected = true;
        self._shapeObj = this;
        self.focus();
        // self.track.timeline.fire('slip:item:selected', { item: self, isLast: false });
      },
      deselected() {
        self._isSelected = false;
        self._shapeObj = null;
        self.blur();
      },
      modifiedInGroup(activeSelection) {
        console.log('modifiedInGroup in activeSelection:', activeSelection);
      },
      mousedown(fEvent) {
        self._startPoint = canvas.getPointer(fEvent.e);
        console.log('track transition mousedown _startPoint:', self._startPoint);
      },
      moving(fEvent) {
        const _startPoint = canvas.getPointer(fEvent.e);
        // const { x, y } = _startPoint, { sx = x, sy = y } = self._startPoint;
        self._startPoint = _startPoint;
        console.log('trackitem moving _startPoint:', _startPoint);
      },
    });
  }

  _onFabricMouseDown() {}

  _onFabricMouseMove() {}

  _onFabricMouseUp() {}
}

CustomEvents.mixin(SceneEffectItem);

export default SceneEffectItem;

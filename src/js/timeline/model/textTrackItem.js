import snippet from 'tui-code-snippet';
import fabric from 'fabric';
import { roundValue } from '@/util';
const { CustomEvents } = snippet;

class TextItem {
  constructor({ start, duration, space, top, height, context }, textTrack) {
    this.name = 'textitem';
    this.start = start;
    this.duration = duration;
    this.context = context;
    this.sections = [];
    this.textTrack = textTrack;
    this.space = space;
    this.boxHeight = height;
    this.top = top;
    this.range = [];
    this.startOffset = 0;
    this.frameViews = [];
    this.timeRange = [];
    this.xyRange = [];
    this.labels = [];
    this.transition = null;
    this.hasTransition = false;
    this._handlers = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
    };
  }

  createGroup() {
    const { start } = this;
    const x = this.getTimeline().convertTimeToPos(start);
    const views = this.frameViews;
    // this.frameViews.forEach((fv) => {
    //   if (!fv.exclude) {
    //     views.push(fv);
    //   }
    // });
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

  filterFrameViews() {
    // let lastFile;
    if (this.files.length > 0) {
      const [file] = this.files;
      file.w = this.space * this.getDuration();
    }
  }

  setup() {
    const { start } = this;
    this.range[0] = this.getTimeline().convertTimeToPos(start);
    this.timeRange[0] = 0;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    this.timeRange[1] = this.timeRange[0] + this.context.duration;
    // this.filterFrameViews();

    return this.setFrames().then(() => {
      return this._make();
      // console.log('set frames ok.', currentProgress);
    });
  }

  _make() {
    // const width = this.space * this.getDuration();
    const group = this.createGroup();

    return new Promise((resolve) => {
      const canvas = this.getCanvas();
      this._bindEventOnObj(group, (fObj) => {
        this.version = this.version + 1;
        // fObj.sendBackwards();
        // const offset = this.getTimeline().getPosOffset(currentProgress);
        // console.log('trackitem setup offset:', offset, ', xyRange:', this.xyRange);
        // fObj.left += offset;
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

  setFrames() {
    this.frameViews = [];
    this.labels = [];
    // const { start, space } = this;
    // const end = this.start + this.getDuration();

    return new Promise((resolve) => {
      this._newPolygon(() => {
        resolve();
      });
    });
  }

  updateText() {
    let txt;
    if (this.frameViews.length > 0) {
      const [, tb] = this.frameViews;
      const { section } = this.context;
      txt = section.text;
      if (txt.length > 5) {
        txt = txt.substring(0, 5);
      }
      tb.text = txt;
      // const lineHeight = tb.calcTextHeight();
      // this.boxHeight = lineHeight;
      this.getCanvas().renderAll();
    }
  }

  getDuration() {
    return this.timeRange[1] - this.timeRange[0];
  }

  setupRect(width, height) {
    const options = {
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      fill: 'transparent',
      backgroundColor: 'transparent', // transparent
      strokeWidth: 0,
      originX: 'left',
    };
    const rect = new fabric.Rect(options);
    this.frameViews.push(rect);
  }

  _newPolygon(callback) {
    const { section } = this.context;
    const height = this.boxHeight;
    const width = this.space * this.getDuration();
    // console.log('_newPolygon width:', width, ',height:', height);
    const options = {
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      stroke: section.fill,
      fill: '#898989',
      backgroundColor: 'transparent', // transparent
      strokeWidth: 1,
      originX: 'left',
      fontSize: '14',
    };
    // const polygon = new fabric.Polygon(this.points, options);

    const polygon = new fabric.Text('', options);
    this.setupRect(width, height);
    this.frameViews.push(polygon);
    this.updateText();
    callback();
  }

  timeChanged(time) {
    const x = this.getTimeline().convertTimeToPos(this.start);
    this.itemPanel.left = x + time;
    this.syncOffset();
    this.xyRange[0] = this.itemPanel.left;
    this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
    this.itemPanel.setCoords();
  }

  syncOffset() {
    const { left, top, width, height } = this.getRect();
    this.fire('track:text:move', { left, top, width, height });
  }

  updateStart(newStart) {
    const { start } = this;
    if (newStart !== start) {
      const { section } = this.context;
      const x = this.getTimeline().convertTimeToPos(start);
      // console.log('newStart:', newStart, ',start:', start);
      const newX = this.getTimeline().convertTimeToPos(newStart);
      // console.log('newX:', newX, ',x:', x);
      this.range[0] = newX;
      const end = newStart + this.duration;
      this.range[1] = this.getTimeline().convertTimeToPos(end);
      this.start = newStart;
      const diff = newX - x;
      this.itemPanel.left += diff;
      this.xyRange[0] = this.itemPanel.left;
      this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
      this.itemPanel.setCoords();
      this.textTrack.timeline.fire('track:text:scale', {
        section,
        start: this.start,
        range: this.timeRange,
      });
    }
  }

  updatePoint() {
    const width = this.space * this.getDuration();
    // const [polygon] = this.frameViews;
    this.frameViews.forEach((item) => {
      item.set({ width });
      item.setCoords();
    });
    // const width = this.space * this.getDuration();
    // polygon.set({ width });
    // polygon.setCoords();
  }

  increaseDuration(delta) {
    this.context.duration += delta;
    this.duration = this.context.duration;
    this.context.section.dur = this.duration;
  }

  updateSize({ left, right }) {
    let newT, delta;
    // console.log('updateSize left:', left, ',right:', right);
    const { duration } = this.context;

    const reBuild = () => {
      this.updatePoint();
      this.getCanvas().remove(this.itemPanel);
      this._make().then(() => {
        this.textTrack.active(this);
        // this.textTrack.scaleAfter(this);
        this.getTimeline().fire('track:text:scale', {
          section: this.context.section,
          start: this.start,
          range: this.timeRange,
        });
        this.syncOffset();
      });
    };
    const t = this.getDuration();
    if (t < 1) {
      this.timeRange[1] = this.timeRange[0] + 1;
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
          this.increaseDuration(delta);
          reBuild();

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
    return this.textTrack.timeline;
  }

  getCanvas() {
    return this.textTrack.timeline.getCanvas();
  }

  dispose() {
    this.getCanvas().remove(this.itemPanel);
    this.textTrack.remove(this);
  }

  hideTransition() {
    if (this.transition) {
      this.transition.hide();
    }
  }

  removeTransition() {
    if (this.transition) {
      this.transition.remove();
    }
  }

  getRect() {
    const { left, top, height } = this.itemPanel;
    const width = this.space * this.getDuration();
    return { left, top, width, height };
  }

  updateTop(top) {
    if (top !== this.top) {
      this.top = top;
      this.itemPanel.set({ top });
      this.itemPanel.setCoords();
    }
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
      },
      deselected() {
        self._isSelected = false;
        self._shapeObj = null;
      },
      modifiedInGroup() {},
      mousedown(fEvent) {
        self._startPoint = canvas.getPointer(fEvent.e);
        self.textTrack.active(self);
      },
      moving() {},
    });
  }

  _onFabricMouseDown() {}

  _onFabricMouseMove() {}

  _onFabricMouseUp() {}
}

CustomEvents.mixin(TextItem);

export default TextItem;

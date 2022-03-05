import snippet from 'tui-code-snippet';
import fabric from 'fabric';
const { CustomEvents } = snippet;
import { roundValue, getRgb } from '@/util';
import TrackBaseItem from '../base/trackBaseItem';
const VERSION = { ver: 0 };

class TextTrackItem extends TrackBaseItem {
  constructor({ start, duration, space, top, height, context }, track) {
    super({ start, space, top, height }, track);
    this.name = 'texttrackitem';
    this.duration = duration;
    this.context = context;

    this.range = [];
    this.startOffset = 0;
    this.frameViews = [];

    this.label = null;
    this.version = VERSION.ver;
    VERSION.ver += 1;
    this.lastStart = -1;

    this.timeRange[0] = 0;
    this.timeRange[1] = this.timeRange[0] + this.context.duration;
  }

  createGroup() {
    const start = this.reComputeStart();
    const x = this.getTimeline().convertTimeToPos(start);
    const views = [];
    this.frameViews.forEach((fv) => {
      views.push(fv);
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
    this.range[0] = this.getTimeline().convertTimeToPos(start);
    this.timeRange[0] = 0;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    this.timeRange[1] = this.timeRange[0] + this.context.duration;

    return this.setFrames().then(() => {
      return this._make();
    });
  }

  _make() {
    const width = this.space * this.getDuration();
    // const group = this.createGroup(width);
    const group = this.createGroup();
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

  setFrames() {
    this.frameViews = [];
    this.labels = [];
    // const { start, files, space } = this;
    // const end = this.start + this.getDuration();

    return new Promise((resolve) => {
      this.newItemFrame(() => {
        resolve();
      });
    });
  }

  updateText() {
    // let txt;
    if (this.frameViews.length > 0) {
      const [, tb] = this.frameViews;
      const { section } = this.context;
      const txt = section.cfg.text.text;
      // if (txt.length > 5) {
      //   txt = txt.substring(0, 5);
      // }
      tb.text = txt;
      this.getCanvas().renderAll();
      // window.ftext = tb;
      // this.originWidth = tb.width;
    }
  }

  focus() {
    this.track.active(this);
    const [, tb] = this.frameViews;
    if (!this.originWidth) {
      this.originWidth = tb.width;
      const width = this.space * this.getDuration();
      this.scaleLabel(width);
    }
    // console.log('calcTextWidth:', this.originWidth);
    // this.track.timeline.fire(`${this.track.eventPrefix.slip}:selected`, { item: this });
  }

  newRect(width, height, fillColor) {
    const fill = getRgb(fillColor, 0.2);
    const options = {
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      fill,
      backgroundColor: 'transparent', // transparent
      strokeWidth: 0,
      originX: 'left',
    };
    const rect = new fabric.Rect(options);
    this.frameViews.push(rect);
  }

  newItemFrame(callback) {
    const { section } = this.context;
    const height = this.boxHeight;
    const width = this.space * this.getDuration();
    const options = {
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      stroke: section.cfg.text.fill,
      fill: '#898989',
      backgroundColor: 'transparent', // transparent
      strokeWidth: 1,
      originX: 'left',
      fontSize: '14',
    };
    const label = new fabric.Text('', options);
    this.label = label;
    // this.originWidth = width;
    this.newRect(width, height, section.cfg.text.fill);
    this.frameViews.push(label);
    this.updateText();

    callback();
  }

  scaleLabel(width) {
    if (this.originWidth > 0) {
      const scaleX = width / this.originWidth;
      this.label.scaleX = scaleX > 1 ? 1 : scaleX;
    }
  }

  timeChanged(time) {
    const x = this.getTimeline().convertTimeToPos(this.start);
    this.itemPanel.left = x + time;
    this.syncItemOffset();
    this.xyRange[0] = this.itemPanel.left;
    this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
    this.itemPanel.setCoords();
    // this.fire('track:item:start:changed', { time });
  }

  syncItemOffset() {
    const { left, top, width, height } = this.itemPanel;
    this.fire(`${this.track.eventPrefix.track}:move`, { left, top, width, height });
  }

  increaseDuration(delta) {
    this.context.duration += delta;
    this.duration = this.context.duration;
    const { start } = this;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    // if (delta !== 0) {
    //   this.getTimeline().ui.datasource.fire(`${this.track.eventPrefix.track}:duration:changed`, {
    //     duration: this.duration,
    //     item: this,
    //   });
    // }

    return Promise.resolve();
  }

  triggerTimeChange(callback) {
    this.getTimeline().getPanel().fire(`panel:time:changed`, {});
    const { index } = this.track;
    const { section } = this.context;
    this.getTimeline().ui.datasource.fire(`${this.track.eventPrefix.track}:time:change`, {
      index,
      section,
      range: this.timeRange,
      start: this.reComputeStart(),
      callback,
    });
  }

  updateStart(newStart) {
    const _lastStart = this.reComputeStart();
    // const newStart = this.reComputeStart();
    if (newStart !== _lastStart) {
      // const dur = this.getDuration();
      // const { start } = this.context.trackItem;
      this.lastStart = newStart;
      const newX = this.getTimeline().convertTimeToPos(newStart);
      this.range[0] = newX;
      const end = newStart + this.duration;
      this.range[1] = this.getTimeline().convertTimeToPos(end);
      this.itemPanel.left = newX;
      this.start = newStart;
      this.xyRange[0] = this.itemPanel.left;
      this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
      this.itemPanel.setCoords();
      // this.getTimeline().updateActiveObj(this.itemPanel);
      // console.log('this.version:', this.version, 'panel left:', this.itemPanel.left);
    }
    this.triggerTimeChange();
  }

  updateFrames() {
    const width = this.space * this.getDuration();
    this.frameViews.forEach((item) => {
      item.set({ width });
      item.setCoords();
    });

    return Promise.resolve();
  }

  updateTimeRange(tRange, callback) {
    this.timeRange[0] = tRange[0];
    this.timeRange[1] = tRange[1];
    this.getCanvas().remove(this.itemPanel);

    this.updateFrames().then(() => {
      // const currentProgress = this.getTimeline().getCurrentProgress();
      this._make().then(() => {
        this.track.active(this);
        this.track.scaleAfter(this);

        this.triggerTimeChange();
        this.syncItemOffset();
        if (callback) {
          callback();
        }
      });
    });
  }

  changeDuration({ startAt, pos, dur, callback }) {
    this.start = startAt;
    this.timeRange[0] = pos;
    this.timeRange[1] = this.timeRange[0] + dur;
    this._rebuild(callback);
  }

  permitScaleOut() {
    return true;
  }

  updateSize({ left, right }) {
    let newT, delta;
    // console.log('updateSize left:', left, ',right:', right);
    const { duration } = this.context;
    const t = this.getDuration();

    const reBuild = () => {
      // console.log('new timeRange:', this.timeRange);
      this.updateTimeRange(this.timeRange);
    };
    if (t < 0.1) {
      this.timeRange[1] = this.timeRange[0] + 0.1;
      reBuild();

      return;
    }
    if (left === 1) {
      newT = roundValue(t * right);
      if (newT + this.timeRange[0] > duration) {
        delta = newT + this.timeRange[0] - duration;
        if (this.permitScaleOut() && delta >= 0.05) {
          delta = Math.floor(delta * 100) / 100;
          newT = delta + duration - this.timeRange[0];
          this.timeRange[1] = this.timeRange[0] + newT;
          this.increaseDuration(delta).then(() => {
            reBuild();
            // this.getTimeline().getPanel().enable();
          });

          return;
        }
        newT = roundValue(this.timeRange[1] - this.timeRange[0]);
      }
      this.timeRange[1] = this.timeRange[0] + newT;
      reBuild();
    } else {
      const timeDiff = t * (1 - left) + this.timeRange[0];
      if (timeDiff <= 0) {
        if (this.timeRange[0] === 0) {
          this.track.active(this);

          return;
        }
        this.timeRange[0] = 0;
      } else {
        this.timeRange[0] = roundValue(timeDiff);
      }
      reBuild();
    }
  }

  // blur() {
  //   this.track.timeline.fire(`${this.track.eventPrefix.slip}:unselected`, { item: this });
  // }

  // ==================================

  syncOffset() {
    const { left, top, width, height } = this.getRect();
    this.fire(`${this.track.eventPrefix.track}:move`, { left, top, width, height });
  }
}

CustomEvents.mixin(TextTrackItem);

export default TextTrackItem;

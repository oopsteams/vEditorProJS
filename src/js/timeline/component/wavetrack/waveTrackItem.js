import snippet from 'tui-code-snippet';
import fabric from 'fabric';
const { CustomEvents } = snippet;
import { roundValue } from '@/util';
import TrackBaseItem from '../base/trackBaseItem';
const VERSION = { ver: 0 };

class WaveTrackItem extends TrackBaseItem {
  constructor({ start, duration, files, space, top, height, context }, track) {
    super({ start, space, top, height }, track);
    this.name = 'wavetrackitem';
    this.duration = duration;
    this.context = context;

    this.range = [];
    this.startOffset = 0;
    this.frameViews = [];

    // this.label = null;
    this.version = VERSION.ver;
    VERSION.ver += 1;
    this.lastStart = -1;

    this.timeRange[0] = 0;
    this.timeRange[1] = this.timeRange[0] + this.context.duration;

    this.files = files;
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

  filterFrameViews() {
    // let lastFile;
    if (this.files.length > 0) {
      const [file] = this.files;
      file.w = this.space * this.getDuration();
    }
  }

  setup() {
    // const { start } = this;
    const start = this.reComputeStart();
    this.range[0] = this.getTimeline().convertTimeToPos(start);
    this.timeRange[0] = 0;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    this.timeRange[1] = this.timeRange[0] + this.context.duration;
    this.filterFrameViews();

    return this.setFrames().then(() => {
      return this._make();
    });
  }

  _make() {
    // const width = this.space * this.getDuration();
    // const group = this.createGroup(width);
    const group = this.createGroup();
    // this.scaleLabel(width);

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

  newItemFrame(callback) {
    const height = this.boxHeight;
    const width = this.space * this.getDuration();
    const [file] = this.files;
    const options = {
      type: 'rect',
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      stroke: '#5E2300',
      strokeWidth: 1,
      originX: 'left',
    };
    const polygon = new fabric.Rect(options);
    fabric.util.loadImage(file.url, (img) => {
      polygon.set(
        'fill',
        new fabric.Pattern({
          source: img,
          repeat: 'no-repeat',
        })
      );
      this.frameViews.push(polygon);
      callback();
    });
  }

  // scaleLabel(width) {
  //   const scaleX = width / this.originWidth;
  //   this.label.scaleX = scaleX > 1 ? 1 : scaleX;
  // }

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
    if (delta !== 0) {
      this.getTimeline().ui.datasource.fire(`${this.track.eventPrefix.track}:duration:changed`, {
        duration: this.duration,
        item: this,
      });
    }

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
    const x0 = this.timeRange[0] * this.space;
    const [polygon] = this.frameViews;
    const width = this.space * this.getDuration();
    console.log('updateFrames x0:', x0);
    polygon.fill.offsetX = 0 - x0;
    polygon.set({ width });
    polygon.setCoords();

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
    let newT;
    const { duration } = this.context;
    const t = this.getDuration();
    const reBuild = () => {
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
        newT = roundValue(duration - this.timeRange[0]);
      }
      this.timeRange[1] = this.timeRange[0] + newT;
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
    }
    reBuild();
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

CustomEvents.mixin(WaveTrackItem);

export default WaveTrackItem;

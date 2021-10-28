import snippet from 'tui-code-snippet';
import fabric from 'fabric';
// import Transition from '../component/Transition';
const { CustomEvents, extend } = snippet;

class TrackItem {
  constructor({ start, duration, files, space, top, height, context }, track) {
    this.name = 'item';
    this.start = start;
    this.duration = duration;
    this.context = context;
    this.track = track;
    this.files = files;
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
    this.version = 0;
    this.isImage = context.fileType.indexOf('image') >= 0;
    this._handlers = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
    };
  }

  createGroup() {
    const { start } = this;
    const x = this.getTimeline().convertTimeToPos(start);
    console.log('createGroup start:', start, ',x:', x);
    const views = [];
    this.frameViews.forEach((fv) => {
      if (!fv.exclude) {
        views.push(fv);
      }
    });
    console.log('views:', views);
    const itemPanel = new fabric.Group(views, {
      left: x,
      top: this.top,
      lockMovementY: true,
      lockMovementX: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
      selectable: false,
      hoverCursor: 'default',
    });
    // selectable: false,
    this.itemPanel = itemPanel;

    return itemPanel;
  }

  filterFrameViews() {
    let lastFile;
    const count = this.files.length;
    const [startAt, endAt] = this.timeRange;
    console.log('filterFrameViews timeRange:', startAt, ',', endAt);
    for (let i = 0; i < count; i += 1) {
      const file = this.files[i];
      file.exclude = false;
      if (i + 1 >= startAt && i <= endAt) {
        if (i > startAt && i - 1 < startAt && i > 0) {
          this.startOffset = startAt - i + 1;
          // file.w = (i - startAt) * this.space;
          lastFile.w = (i - startAt) * this.space;
          file.w = this.space;
        } else if (i < endAt && i + 1 > endAt) {
          file.w = (endAt - i) * this.space;
        } else {
          file.w = this.space;
        }
      } else {
        file.w = this.space;
        file.exclude = true;
        console.log('exclude:', i);
      }
      lastFile = file;
    }
  }

  setup() {
    const { start } = this;
    console.log('setup start:', start);
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
    const { start, files, space } = this;
    const end = this.start + this.getDuration();
    return new Promise((resolve) => {
      this._loopNewImage({ i: start, start, end, files, space }, () => {
        resolve();
      });
    });
  }

  updateFrames() {
    this.labels = [];
    const { start, files, space } = this;
    const end = this.start + this.duration;
    return new Promise((resolve) => {
      this.frameViews.forEach((fv) => {
        fv.exclude = true;
      });
      this._loopUpdateImage({ i: start, start, end, files, space }, () => {
        resolve();
      });
    });
  }

  _loopUpdateImage({ i, start, end, files, space }, callback) {
    let subIndex,
      _end = end;
    const height = this.boxHeight;
    // const self = this;

    if (Math.floor(end) < end) {
      _end = Math.floor(end) + 1;
    }
    if (i >= _end) {
      callback();

      return;
    }
    const count = files.length;
    // const x = this.getTimeline().convertTimeToPos(i);
    const idx = Math.round(i - start);
    subIndex = idx;
    if (subIndex >= count) {
      subIndex = count - 1;
    }
    const imgCount = this.frameViews.length;
    const file = files[subIndex];
    if (!file) {
      callback();

      return;
    }
    const imageOption = {
      left: this.startOffset + idx * this.space,
      top: 0,
      width: this.space,
      height,
      hoverCursor: 'default',
      selectable: false,
    };
    imageOption.scaleX = 1;
    // imageOption.scaleX = file.w / imageOption.width;
    if (imgCount > subIndex) {
      imageOption.scaleX = file.w / imageOption.width;
      console.log('subIndex:', subIndex, ',scaleX:', imageOption.scaleX);
      if (subIndex > 0) {
        imageOption.left = this.frameViews[subIndex - 1].rw + this.frameViews[subIndex - 1].left;
      }
      const fImage = this.frameViews[subIndex];
      fImage.set(imageOption);
      fImage.rw = file.w;
      fImage.exclude = file.exclude;
      this._loopUpdateImage({ i: i + 1, start, end, files, space }, callback);
    } else if (imgCount === subIndex) {
      const lastImage = this.frameViews[subIndex - 1];
      imageOption.left = lastImage.rw + lastImage.left;
      imageOption.scaleX = file.w / imageOption.width;
      if (file.url) {
        fabric.Image.fromURL(
          file.url,
          (fImage) => {
            fImage.setOptions(imageOption);
            fImage.time = i;
            fImage.rw = file.w;
            fImage.exclude = file.exclude;
            this.frameViews.push(fImage);
            this._loopUpdateImage({ i: i + 1, start, end, files, space }, callback);
          },
          {
            crossOrigin: 'Anonymous',
          }
        );
      } else {
        imageOption.fill = 'rgba(255,255,255,0.3)';
        imageOption.stroke = '#282828';
        const polygon = new fabric.Rect(imageOption);
        polygon.time = i;
        polygon.rw = file.w;
        polygon.exclude = file.exclude;
        this.frameViews.push(polygon);
        this._loopUpdateImage({ i: i + 1, start, end, files, space }, callback);
      }
    }
  }

  getDuration() {
    return this.timeRange[1] - this.timeRange[0];
  }

  _loopNewImage({ i, start, end, files, space }, callback) {
    let subIndex;
    const height = this.boxHeight;
    // const self = this;
    if (i >= end) {
      callback();

      return;
    }
    const count = files.length;
    // const x = this.getTimeline().convertTimeToPos(i);
    const idx = Math.round(i - start);
    subIndex = idx;
    if (subIndex >= count) {
      subIndex = count - 1;
    }
    const imgCount = this.frameViews.length;
    const file = files[subIndex];
    // console.log(`[${subIndex}]=>`, file.url, ',idx pos:', this.space * idx);
    const imageOption = {
      left: this.startOffset + idx * this.space,
      top: 0,
      width: this.space,
      height,
      hoverCursor: 'default',
      selectable: false,
    };
    imageOption.scaleX = file.w / imageOption.width;
    if (imgCount > 0) {
      imageOption.left = this.frameViews[imgCount - 1].rw + this.frameViews[imgCount - 1].left;
    }
    if (file.url) {
      fabric.Image.fromURL(
        file.url,
        (fImage) => {
          fImage.setOptions(imageOption);
          fImage.time = i;
          fImage.rw = file.w;
          fImage.exclude = file.exclude;
          this.frameViews.push(fImage);
          this._loopNewImage({ i: i + 1, start, end, files, space }, callback);
        },
        {
          crossOrigin: 'Anonymous',
        }
      );
    } else {
      imageOption.fill = 'rgba(255,255,255,0.3)';
      imageOption.stroke = '#282828';
      const polygon = new fabric.Rect(imageOption);
      polygon.time = i;
      polygon.rw = file.w;
      polygon.exclude = file.exclude;
      this.frameViews.push(polygon);
      this._loopNewImage({ i: i + 1, start, end, files, space }, callback);
    }
  }

  timeChanged(time) {
    const x = this.getTimeline().convertTimeToPos(this.start);
    this.itemPanel.left = x + time;
    this.syncItemOffset();
    this.xyRange[0] = this.itemPanel.left;
    this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
    this.itemPanel.setCoords();
  }

  syncItemOffset() {
    const { left, top, width, height } = this.itemPanel;
    this.fire('track:item:move', { left, top, width, height });
  }

  increaseDuration(delta) {
    let n;
    const count = this.files.length;
    n = Math.floor(delta);
    if (n < delta) {
      n += 1;
    }
    const file = this.files[count - 1];
    // console.log('increaseDuration file:', file, ',delta:', delta);
    for (let i = 0; i < n; i += 1) {
      const _file = {};
      extend(_file, file);
      this.files.push(_file);
    }
    this.context.duration += delta;
    this.duration = this.context.duration;
    const { start } = this;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    const total = this.track.totalDuration();
    if (total > this.getTimeline().duration) {
      return this.getTimeline().changeDuration(total);
    }

    return Promise.resolve();
  }

  updateStart(newStart) {
    const { start } = this;
    if (newStart !== start) {
      // const x = this.getTimeline().convertTimeToPos(start);
      console.log('newStart:', newStart, ',start:', start);
      const newX = this.getTimeline().convertTimeToPos(newStart);
      // console.log('newX:', newX, ',x:', x);
      this.range[0] = newX;
      const end = newStart + this.duration;
      this.range[1] = this.getTimeline().convertTimeToPos(end);
      this.start = newStart;
      // const diff = newX - x;
      this.itemPanel.left = newX;
      this.xyRange[0] = this.itemPanel.left;
      this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
      this.itemPanel.setCoords();
      this.track.timeline.fire('track:item:sorted', {
        start: this.start,
        range: this.timeRange,
        context: this.context,
      });
      this.getTimeline().updateActiveObj(this.itemPanel);
    }
  }

  updateSize({ left, right }) {
    let newT, delta;
    // console.log('updateSize left:', left, ',right:', right);
    const { duration } = this.context;
    const t = this.getDuration();

    const reBuild = () => {
      // console.log('new timeRange:', this.timeRange);

      this.getCanvas().remove(this.itemPanel);
      this.filterFrameViews();

      this.updateFrames().then(() => {
        // const currentProgress = this.getTimeline().getCurrentProgress();
        this._make().then(() => {
          this.track.active(this);
          this.track.scaleAfter(this);
          this.track.timeline.fire('track:item:scale', {
            range: this.timeRange,
            context: this.context,
          });
          this.syncItemOffset();
        });
      });
    };
    if (t < 0.2) {
      this.timeRange[1] = this.timeRange[0] + 0.2;
      reBuild();

      return;
    }
    if (left === 1) {
      newT = t * right;
      if (newT + this.timeRange[0] > duration) {
        delta = newT + this.timeRange[0] - duration;
        if (this.isImage && delta >= 0.05) {
          delta = Math.floor(delta * 100) / 100;
          newT = delta + duration - this.timeRange[0];
          this.timeRange[1] = this.timeRange[0] + newT;
          this.increaseDuration(delta).then(() => {
            reBuild();
            // this.getTimeline().getPanel().enable();
          });

          return;
        }
        newT = this.timeRange[1] - this.timeRange[0];
      }
      // 如果是图片可以超出原有duration，此时需要更新panel ticks
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
        this.timeRange[0] = timeDiff;
        //
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

  dispose() {
    if (this.frameViews.length > 0) {
      this.frameViews.forEach((img) => {
        if (img.dispose) {
          img.dispose();
        }
      });
    }
    if (this.transition) {
      this.transition.dispose();
      this.transition = null;
    }
    this.getCanvas().remove(this.itemPanel);
    this.track.remove(this);
  }

  setTransition() {
    /*
    if (!this.transition) {
      this.transition = new Transition(this, options, context);
      this.transition.setup().then(() => {
        this.transition.show(this);
      });
    } else {
      this.transition.recover();
      this.transition.show(this);
    }
    */
  }

  hideTransition() {
    if (this.transition) {
      this.transition.dispose();
      this.hasTransition = false;
    }
  }

  removeTransition() {
    if (this.transition) {
      this.transition.dispose();
    }
  }

  getRect() {
    const { left, top, width, height } = this.itemPanel;

    return { left, top, width, height };
  }

  _bindEventOnObj(fObj, cb) {
    const self = this;

    fObj.on({
      added() {
        if (cb) {
          cb(this);
        }
      },
      selected() {},
      deselected() {},
      modifiedInGroup() {},
      mousedown() {
        self.track.active(self);
      },
      moving() {},
    });
  }

  _onFabricMouseDown() {}

  _onFabricMouseMove() {}

  _onFabricMouseUp() {}
}

CustomEvents.mixin(TrackItem);

export default TrackItem;

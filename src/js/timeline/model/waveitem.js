import snippet from 'tui-code-snippet';
import fabric from 'fabric';
import Transition from '../component/Transition';
const { CustomEvents } = snippet;

class WaveItem {
  constructor({ start, duration, files, space, top, height, context }, waveTrack) {
    this.name = 'waveitem';
    this.start = start;
    this.duration = duration;
    this.context = context;
    this.waveTrack = waveTrack;
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
    console.log('setup start:', start);
    this.range[0] = this.getTimeline().convertTimeToPos(start);
    this.timeRange[0] = 0;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    this.timeRange[1] = this.timeRange[0] + this.context.duration;
    this.filterFrameViews();

    return this.setFrames().then(() => {
      return this._make();
      // console.log('set frames ok.', currentProgress);
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

  /*
  buildWave() {
    const points = [];
    this.points.forEach(({ x, y }) => {
      points.push({ x, y });
    });

    const lineOption = {
      left: 0,
      top: 0,
      width: this.space * this.duration,
      height,
      hoverCursor: 'default',
      fill: '#5E2300', //填充颜色
      stroke: '#5E2300', //笔触颜色
      strokeWidth: 2, //笔触宽度
      hasControls: false, //选中时是否可以放大缩小
      hasRotatingPoint: false, //选中时是否可以旋转
      hasBorders: false, //选中时是否有边框
      transparentCorners: true,
      perPixelTargetFind: true, //默认false。当设置为true，对象的检测会以像互点为基础，而不是以边界的盒模型为基础。
      selectable: false, //是否可被选中
    };

    return new fabric.Polyline(points, lineOption);
  }
  */

  setFrames() {
    this.frameViews = [];
    this.labels = [];
    const { start, files, space } = this;
    const end = this.start + this.getDuration();
    return new Promise((resolve) => {
      this._loopNewImage({ i: start, start, end, files, space }, () => {
        resolve();
      });
      // this.line = this.buildWave();
      // const x = this.getTimeline().convertTimeToPos(start);
      // this._bindEventOnObj(this.line, () => {
      //   resolve();
      // });
      // this.getTimeline().add(this.line);
    });
  }

  updateFrames() {
    this.labels = [];
    const { start, files, space } = this;
    const end = this.start + this.getDuration();
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
    const idx = i - start;
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
    console.log('subIndex:', subIndex);
    imageOption.scaleX = file.w / imageOption.width;
    console.log('subIndex:', subIndex, ',', imageOption.scaleX);
    if (imgCount > subIndex) {
      if (subIndex > 0) {
        imageOption.left = this.frameViews[subIndex - 1].rw + this.frameViews[subIndex - 1].left;
      }
      const fImage = this.frameViews[subIndex];
      fImage.set(imageOption);
      fImage.rw = file.w;
      fImage.exclude = file.exclude;
    }
    this._loopUpdateImage({ i: i + 1, start, end, files, space }, callback);
  }

  getDuration() {
    return this.timeRange[1] - this.timeRange[0];
  }

  _loopNewImage({ i, start, files }, callback) {
    let subIndex;
    const height = this.boxHeight;
    // const self = this;
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
      width: this.space * this.getDuration(),
      height,
      hoverCursor: 'default',
      selectable: false,
    };
    // imageOption.scaleX = file.w / imageOption.width;
    if (imgCount > 0) {
      imageOption.left = this.frameViews[imgCount - 1].rw + this.frameViews[imgCount - 1].left;
    }
    fabric.Image.fromURL(
      file.url,
      (fImage) => {
        fImage.setOptions(imageOption);
        fImage.time = i;
        fImage.rw = file.w;
        fImage.exclude = file.exclude;
        this.frameViews.push(fImage);
        // this._loopNewImage({ i: i + 1, start, end, files, space }, callback);
        callback();
      },
      {
        crossOrigin: 'Anonymous',
      }
    );
  }

  timeChanged(time) {
    const x = this.getTimeline().convertTimeToPos(this.start);
    this.itemPanel.left = x + time;
    const { left, top, width, height } = this.itemPanel;
    this.fire('track:wave:move', { left, top, width, height });
    this.xyRange[0] = this.itemPanel.left;
    this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
    this.itemPanel.setCoords();
  }

  updateStart(newStart) {
    const { start } = this;
    if (newStart !== start) {
      const x = this.getTimeline().convertTimeToPos(start);
      console.log('newStart:', newStart, ',start:', start);
      const newX = this.getTimeline().convertTimeToPos(newStart);
      console.log('newX:', newX, ',x:', x);
      this.range[0] = newX;
      const end = newStart + this.duration;
      this.range[1] = this.getTimeline().convertTimeToPos(end);
      this.start = newStart;
      const diff = newX - x;
      this.itemPanel.left += diff;
      this.xyRange[0] = this.itemPanel.left;
      this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
      console.log('group left:', this.itemPanel.left);
      this.itemPanel.setCoords();
    }
  }

  updateSize({ left, right }) {
    let newT;
    // console.log('updateSize left:', left, ',right:', right);
    const { duration } = this.context;
    const t = this.getDuration();
    if (t < 1) {
      return;
    }
    if (left === 1) {
      newT = t * right;
      if (newT + this.timeRange[0] > duration) {
        newT = duration - this.timeRange[0];
      }
      // 如果是图片可以超出原有duration，此时需要更新panel ticks
      this.timeRange[1] = this.timeRange[0] + newT;
    } else {
      const timeDiff = t * (1 - left) + this.timeRange[0];
      if (timeDiff <= 0) {
        if (this.timeRange[0] === 0) {
          this.waveTrack.active(this);

          return;
        }
        this.timeRange[0] = 0;
      } else {
        this.timeRange[0] = timeDiff;
      }
    }

    console.log('new timeRange:', this.timeRange);

    this.getCanvas().remove(this.itemPanel);
    this.filterFrameViews();

    this.updateFrames().then(() => {
      const currentProgress = this.getTimeline().getCurrentProgress();
      this._make(currentProgress).then(() => {
        this.waveTrack.active(this);
        this.waveTrack.scaleAfter(this);
      });
    });
  }

  getTimeline() {
    return this.waveTrack.timeline;
  }

  getCanvas() {
    return this.waveTrack.timeline.getCanvas();
  }

  dispose() {
    if (this.frameViews.length > 0) {
      this.frameViews.forEach((img) => {
        img.dispose();
      });
    }
    this.getCanvas().remove(this.itemPanel);
  }

  setTransition(options, context) {
    if (!this.transition) {
      this.transition = new Transition(this, options, context);
      this.transition.setup().then(() => {
        this.transition.show(this);
      });
    } else {
      this.transition.recover();
      this.transition.show(this);
    }
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
    const { left, top, width, height } = this.itemPanel;

    return { left, top, width, height };
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
      modifiedInGroup(activeSelection) {
        console.log('modifiedInGroup in activeSelection:', activeSelection);
      },
      mousedown(fEvent) {
        self._startPoint = canvas.getPointer(fEvent.e);
        console.log('track item mousedown _startPoint:', self._startPoint);
        self.waveTrack.active(self);
      },
      moving(fEvent) {
        const _startPoint = canvas.getPointer(fEvent.e);
        // const { x, y } = _startPoint, { sx = x, sy = y } = self._startPoint;
        self._startPoint = _startPoint;
        console.log('trackitem moving _startPoint:', _startPoint);
        /*
        const diff = self.range[0] - this.left;
        if (diff < 0) {
          this.left = self.range[0];
          if (!self.checkInCache(0)) {
            // self.timeline.fire('time:head', { progress: 0 });
            self.timeline.indicatorMoved({ progress: 0 });
          }
        } else if (diff > self.range[1]) {
          this.left = self.range[0] - self.range[1];
          if (!self.checkInCache(1)) {
            // self.timeline.fire('time:end', { progress: 1 });
            self.timeline.indicatorMoved({ progress: 1 });
          }
        } else {
          const progress = diff / self.range[1];
          if (!self.checkInCache(progress)) {
            self.timeline.indicatorMoved({ progress });
          }
        }
        */
      },
    });
  }

  _onFabricMouseDown(fEvent) {
    if (!fEvent.target) {
      this._isSelected = false;
      this._shapeObj = false;
    }

    if (!this._isSelected && !this._shapeObj) {
      this.hide();
    }
  }

  _onFabricMouseMove(fEvent) {
    const canvas = this.getCanvas();

    if (!fEvent.e) {
      const pointer = canvas.getPointer(fEvent.e);
      const startPointX = this._startPoint.x;
      const startPointY = this._startPoint.y;
      const width = startPointX - pointer.x;
      const height = startPointY - pointer.y;
      console.log('width:', width, ',height:', height);
    }
  }

  _onFabricMouseUp() {
    // const canvas = this.getCanvas();
    // const startPointX = this._startPoint.x;
    // const startPointY = this._startPoint.y;
    // const shape = this._shapeObj;
    // canvas.off({
    //   'mouse:move': this._handlers.mousemove,
    //   'mouse:up': this._handlers.mouseup,
    // });
  }
}

CustomEvents.mixin(WaveItem);

export default WaveItem;

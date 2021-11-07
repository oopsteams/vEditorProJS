import snippet from 'tui-code-snippet';
import fabric from 'fabric';
import { roundValue } from '@/util';
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

  updateTop(top) {
    if (top !== this.top) {
      this.top = top;
      this.itemPanel.set({ top });
      this.itemPanel.setCoords();
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
    const width = this.space * this.getDuration();
    const group = this.createGroup(width);

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
      this._newPolygon({ i: start, start, end, files, space }, () => {
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

  getDuration() {
    return this.timeRange[1] - this.timeRange[0];
  }

  _newPolygon({ files }, callback) {
    const height = this.boxHeight;
    const width = this.space * this.getDuration();
    const [file] = files;
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
    // const polygon = new fabric.Polygon(this.points, options);
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

  timeChanged(time) {
    // console.log('waveitem timeChanged:', time);
    const x = this.getTimeline().convertTimeToPos(this.start);
    this.itemPanel.left = x + time;
    // const { left, top, width, height } = this.getRect();
    // this.fire('track:wave:move', { left, top, width, height });
    this.syncWaveOffset();
    this.xyRange[0] = this.itemPanel.left;
    this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
    this.itemPanel.setCoords();
  }

  syncWaveOffset() {
    const { left, top, width, height } = this.getRect();
    this.fire('track:wave:move', { left, top, width, height });
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

  updatePoint({ x0 }) {
    const [polygon] = this.frameViews;
    const width = this.space * this.getDuration();
    polygon.fill.offsetX = 0 - x0;
    polygon.set({ width });
    polygon.setCoords();
    console.log('updatePoint fill offsetX:', polygon.fill.offsetX, ',polygon.left:', polygon.left);
    console.log('updatePoint width:', polygon.width);
  }

  updateSize({ left, right }) {
    let newT;
    // console.log('updateSize left:', left, ',right:', right);
    const { duration } = this.context;
    const t = this.getDuration();
    const reBuild = () => {
      this.updatePoint({ x0: this.timeRange[0] * this.space, x1: this.timeRange[1] * this.space });

      this.getCanvas().remove(this.itemPanel);

      this._make().then(() => {
        this.waveTrack.active(this);
        this.waveTrack.scaleAfter(this);
        this.getTimeline().fire('track:wave:scale', {
          range: this.timeRange,
          context: this.context,
        });
        this.syncWaveOffset();
      });
    };

    if (t < 1) {
      this.timeRange[1] = this.timeRange[0] + 1;
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
          return;
        }
        this.timeRange[0] = 0;
      } else {
        this.timeRange[0] = roundValue(timeDiff);
      }
    }
    reBuild();
  }

  getTimeline() {
    return this.waveTrack.timeline;
  }

  getCanvas() {
    return this.waveTrack.timeline.getCanvas();
  }

  dispose() {
    this.getCanvas().remove(this.itemPanel);
    this.waveTrack.remove(this);
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

  _onFabricMouseUp() {}
}

CustomEvents.mixin(WaveItem);

export default WaveItem;

// import snippet from 'tui-code-snippet';
import fabric from 'fabric';
import Component from '@/timeline/component';
import { tlComponentNames, eventNames } from '@/consts';

const pad = 0;
const defaultLineHeight = 5;
const defaultLineWidth = 3;

class Panel extends Component {
  constructor(timeline) {
    super(tlComponentNames.PANEL, timeline);
    this.range = [];
    this.ticks = [];
    this.labels = [];
    this.version = 0;
    this._handlers = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
      poschanged: this._onPosChanged.bind(this),
      itemRemove: this._onItemRemove.bind(this),
      itemAdd: this._onItemAdd.bind(this),
      itemChanged: this._onItemChanged.bind(this),
    };
    this.disabled = true;
    // tickschanged: this._onTicksChanged.bind(this),
    this.changeCache = {};
    this.start();
  }

  resize() {
    if (this.tickPanel) {
      const center = this.timeline.getCenter();
      const { left } = center;
      this.tickPanel.set({ left });
      this._onItemChanged();
    }
  }

  setup({ count, space, maxHeight }) {
    this.count = count;
    this.space = space;
    if (maxHeight) {
      this.maxHeight = maxHeight;
    }
    this.setTicks(count, space);
    const group = this.createGroup();

    return new Promise((resolve) => {
      const canvas = this.getCanvas();
      this._bindEventOnObj(group, (fObj) => {
        this.version = this.version + 1;
        if (!this.changeCache.version) {
          this.checkInCache(0);
        }
        // this.disable();
        resolve(fObj);
      });
      canvas.add(group);
    });
  }

  disable() {
    this.disabled = true;
    this.tickPanel.selectable = false;
    // console.log('panel disable!!!!');
  }

  enable() {
    this.disabled = false;
    this.tickPanel.selectable = true;
    // this.tickPanel.setCoords();
  }

  createGroup() {
    const center = this.timeline.getCenter();
    // console.log('this.ticks:', this.ticks);
    this.range[0] = center.left;
    const tickPanel = new fabric.Group(this.filterShowObjs(), {
      left: center.left,
      top: 0,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
    });
    // selectable: false,
    this.tickPanel = tickPanel;

    return tickPanel;
  }

  _newLine(index, x, top) {
    let tickHeight = defaultLineHeight;
    if (index === 0) {
      tickHeight = this.maxHeight;
    }
    const options = {
      type: 'rect',
      left: pad + x,
      top,
      width: defaultLineWidth,
      height: tickHeight,
      fill: '#ffd727',
      hoverCursor: 'default',
      selectable: false,
    };
    if (index < this.ticks.length) {
      const fRect = this.ticks[index];
      if (fRect) {
        fRect.set(options);
        fRect.exclude = false;

        return null;
      }
    }

    return new fabric.Rect(options);
  }

  _newLabel(index, x, top) {
    const left = index === 0 ? pad + x + 2 : pad + x;
    const options = {
      type: 'text',
      left,
      fontSize: 20,
      stroke: '#fff',
      fill: '#fff',
      top,
      fontStyle: 'normal',
      fontWeight: 'normal',
      hoverCursor: 'default',
      selectable: false,
    };
    if (index < this.labels.length) {
      const fText = this.labels[index];
      if (fText) {
        fText.set(options);
        fText.exclude = false;

        return null;
      }
    }

    return new fabric.Text(`${index}s`, options);
  }

  filterShowObjs() {
    const fobjs = [];
    this.ticks.forEach((t) => {
      if (!t.exclude) {
        fobjs.push(t);
      }
    });
    this.labels.forEach((l) => {
      if (!l.exclude) {
        fobjs.push(l);
      }
    });

    return fobjs;
  }

  setTicks(count, space) {
    const y1 = 0;
    this.ticks.forEach((t) => {
      t.exclude = true;
    });
    this.labels.forEach((l) => {
      l.exclude = true;
    });
    // this.ticks = [];
    // this.labels = [];
    for (let i = 0; i < count + 1; i += 1) {
      const x = i * space;
      const line = this._newLine(i, x, y1);
      const label = this._newLabel(i, x, defaultLineHeight);
      if (line) {
        line.exclude = false;
        this.ticks.push(line);
      }
      if (label) {
        label.exclude = false;
        this.labels.push(label);
      }
    }
    this.range[1] = count * space;
  }

  start() {
    this.timeline.on({
      [eventNames.PANEL_POS_CHANGED]: this._handlers.poschanged,
      'track:remove': this._handlers.itemRemove,
      'track:add': this._handlers.itemAdd,
      'track:item:scale': this._handlers.itemChanged,
      'track:item:changed': this._handlers.itemChanged,
      'track:wave:scale': this._handlers.itemChanged,
      'track:text:scale': this._handlers.itemChanged,
      'track:text:new': this._handlers.itemChanged,
      'track:animation:new': this._handlers.itemChanged,
    });
  }

  end() {
    this.timeline.off({
      [eventNames.PANEL_POS_CHANGED]: this._handlers.poschanged,
      'track:remove': this._handlers.itemRemove,
      'track:add': this._handlers.itemAdd,
      'track:item:scale': this._handlers.itemChanged,
      'track:item:changed': this._handlers.itemChanged,
      'track:wave:scale': this._handlers.itemChanged,
      'track:text:scale': this._handlers.itemChanged,
      'track:text:new': this._handlers.itemChanged,
    });
  }

  getCurrentProgress() {
    return this.changeCache.progress;
  }

  getPosOffset(progress) {
    if (!progress || progress < 0 || progress > 1) {
      return 0;
    }
    if (this.tickPanel && progress) {
      // console.log('this.range[1] :', this.range[1]);
      const diff = progress * this.range[1];
      return -diff;
    }

    return 0;
  }

  convertPosToTime(x) {
    const diff = x - this._left;
    // const diff = this.range[0] - x;
    const time = (diff * this.count) / this.range[1];
    const n = Math.floor(time / 0.05);
    const _time = Math.floor(n * 0.05 * 100) / 100;

    return _time;
  }

  getLeftPosByProgress(time) {
    const progress = time / this.count;
    if (!progress || progress < 0 || progress > 1) {
      return this.range[0];
    }
    if (this.tickPanel && progress) {
      const diff = progress * this.range[1];

      return this.range[0] + diff;
    }

    return this.range[0];
  }

  checkInRound(leftPosition, rightPosition) {
    const leftoffset = leftPosition - this._left; // this.getPosOffset(this.getCurrentProgress());
    const rightoffset = rightPosition - this._left;
    // leftPosition -= offset;
    // rightPosition -= offset;
    // console.log('checkInRound:', this.range);
    // console.log('leftoffset:', leftoffset, ',rightoffset:', rightoffset);
    // console.log('checkInRound leftPosition:', leftPosition, ',rightPosition:', rightPosition);
    if (
      leftoffset >= 0 &&
      leftoffset <= this.range[1] &&
      rightoffset >= 0 &&
      rightoffset <= this.range[1]
    ) {
      return { left: leftPosition, right: rightPosition };
    }
    if (leftoffset < 0) {
      leftPosition = this._left;
      rightPosition -= leftoffset;
    }
    if (rightoffset > this.range[1]) {
      const diff = rightoffset - this.range[1];
      leftPosition -= diff;
      rightPosition -= diff;
    }

    return { left: leftPosition, right: rightPosition };
  }

  _onPosChanged({ progress }) {
    if (progress < 0 || progress > 1) {
      return;
    }
    if (this.tickPanel && progress) {
      const diff = progress * this.range[1];
      this.tickPanel.left = this.range[0] - diff;
      this.changeCache.progress = progress;
      // if (!this.checkInCache(progress)) {
      const time = progress * this.count;
      const n = Math.floor(time / 0.05);
      const _time = Math.floor(n * 0.05 * 100) / 100;
      this.tickPanel.setCoords();
      this.timeline.indicatorMoved({ time: _time, progress });
      // }
    }
  }

  _onItemRemove({ track }) {
    if (track.groups.length === 0) {
      this.disable();
    }
  }

  _onItemAdd({ track }) {
    if (track.groups.length > 0) {
      this.enable();
      this._intervalAdjustDiff(false).then((params) => {
        this.timeline.syncIndicator(params);
      });
    }
  }

  _onItemChanged() {
    this._intervalAdjustDiff(false).then((params) => {
      this.timeline.syncIndicator(params);
      if (this.timeline.track.groups.length > 0) {
        this.enable();
      } else {
        this.disable();
      }
    });
  }

  ticksChanged({ count, space }) {
    const lastCount = this.count;
    if (this.count !== count || this.space !== space) {
      this.getCanvas().remove(this.tickPanel);
      // console.log('ticksChanged count:', count, ',duration:', duration);

      return this.setup({ count, space }).then(() => {
        // console.log('add panel ok:', fObj);
        const lastTime = this.changeCache.progress * lastCount;
        // console.log('lastTime:', lastTime, ', new r:', lastTime / count);
        this._onPosChanged({ progress: lastTime / count });
        this.tickPanel.setCoords();

        return Promise.resolve();
      });
    }

    return Promise.resolve();
  }

  checkInCache(newProgress) {
    const { version, progress } = this.changeCache;
    if (version !== this.version) {
      this.changeCache.version = this.version;
      this.changeCache.progress = newProgress;

      return false;
    }
    if (newProgress !== progress) {
      this.changeCache.version = this.version;
      this.changeCache.progress = newProgress;

      return false;
    }

    return true;
  }

  _intervalAdjustDiff(checkCache) {
    let diff;
    const fObj = this.tickPanel;
    diff = this.range[0] - fObj.left;

    return new Promise((resolve) => {
      if (diff < 0) {
        fObj.left = this.range[0];
        if (!checkCache || !this.checkInCache(0)) {
          resolve({ time: 0, progress: 0 });
        }
      } else if (diff > this.range[1]) {
        fObj.left = this.range[0] - this.range[1];
        if (!checkCache || !this.checkInCache(1)) {
          resolve({ time: this.range[1] / this.space, progress: 1 });
        }
      } else {
        const progress = diff / this.range[1];
        const time = progress * this.count;
        const n = Math.floor(time / 0.05);
        const _time = Math.floor(n * 0.05 * 100) / 100;
        const _progress = _time / this.count;
        diff = this.range[1] * _progress;
        fObj.left = this.range[0] - diff;
        if (!checkCache || !this.checkInCache(progress)) {
          resolve({ time: _time, progress: _progress });
        }
      }
      this._left = fObj.left;
    });
  }

  _adjustDiff(diff, fObj) {
    const self = this;
    if (diff < 0) {
      fObj.left = self.range[0];
      if (!self.checkInCache(0)) {
        // self.timeline.fire('time:head', { progress: 0 });
        self.timeline.indicatorMoved({ time: 0, progress: 0 });
      }
    } else if (diff > self.range[1]) {
      fObj.left = self.range[0] - self.range[1];
      if (!self.checkInCache(1)) {
        // self.timeline.fire('time:end', { progress: 1 });
        self.timeline.indicatorMoved({ time: self.range[1] / self.space, progress: 1 });
      }
    } else {
      const progress = diff / self.range[1];
      const time = progress * this.count;
      const n = Math.floor(time / 0.05);
      const _time = Math.floor(n * 0.05 * 100) / 100;
      const _progress = _time / this.count;
      diff = self.range[1] * _progress;
      fObj.left = self.range[0] - diff;
      if (!self.checkInCache(progress)) {
        self.timeline.indicatorMoved({ time: _time, progress: _progress });
      }
    }
    self._left = fObj.left;
  }

  _bindEventOnObj(fObj, cb) {
    const self = this;
    const canvas = this.getCanvas();

    fObj.on({
      added() {
        self._shapeObj = this;
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
      mouseup() {
        if (self.disabled) {
          return;
        }
        // const diff = self.range[0] - this.left;
        // const n = Math.floor(diff / 0.05);
        // const _diff = n * 0.05;
        // self._adjustDiff(diff, this);
        self.tickPanel.setCoords();
        self.timeline.deactivateAll();
      },
      mousedown(fEvent) {
        if (self.disabled) {
          return;
        }
        self._startPoint = canvas.getPointer(fEvent.e);
        self._left = this.left;
        // console.log('panel mousedown _startPoint:', self._startPoint);
      },
      moving(fEvent) {
        if (self.disabled) {
          return;
        }
        const _startPoint = canvas.getPointer(fEvent.e);
        // const { x, y } = _startPoint, { sx = x, sy = y } = self._startPoint;
        self._startPoint = _startPoint;
        // console.log('panel moving _x:', x - sx, ',_y:', y - sy);
        const diff = self.range[0] - this.left;
        self._adjustDiff(diff, this);
      },
    });
  }

  _onFabricMouseDown() {}

  _onFabricMouseMove() {}

  _onFabricMouseUp() {}
}

export default Panel;

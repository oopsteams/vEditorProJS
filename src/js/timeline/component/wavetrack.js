// import snippet from 'tui-code-snippet';
// import fabric from 'fabric';
import Component from '@/timeline/component';
import WaveItem from '../model/waveitem';
import WaveSlipWindow from './waveSlipWindow';
// import SlipWinndow from './slipWIndow';
import { tlComponentNames, eventNames } from '@/consts';
const boxHeight = 30;

class WaveTrack extends Component {
  constructor(timeline, { type, top }) {
    super(tlComponentNames.TRACK, timeline);
    this.range = [];
    this.groups = [];
    this.transitions = [];
    this.currentItem = null;
    this.version = 0;
    if (!type) {
      type = 'main';
    }
    this.type = type;
    this.top = top;
    this.slipWinndow = new WaveSlipWindow(this);
    this._handlers = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
      poschanged: this._onPosChanged.bind(this),
      tickschanged: this._onTicksChanged.bind(this),
      timechanged: this._onTimeChanged.bind(this),
      focusItem: this._onFocusItem.bind(this),
      syncTimeChanged: this._onTimeChanged.bind(this),
    };
    this.changeCache = {};
    this.start();
    this.counter = 0;
    this.setupSlip();
  }

  getBoxHeight() {
    return boxHeight;
  }

  totalDuration() {
    let total = 0;
    this.groups.forEach((ti) => {
      total += ti.getDuration();
    });

    return total;
  }

  isLastItem(item) {
    this.groups.sort(function (a, b) {
      return a.start - b.start;
    });

    return item === this.groups[this.groups.length - 1];
  }

  addWave(start, duration, files, space, context) {
    const total = this.totalDuration();
    console.log('addWave total:', total);
    start = start + total;

    const wi = new WaveItem(
      { start, duration, files, space, top: this.top, height: boxHeight, context },
      this
    );

    const progress = this.timeline.getCurrentProgress();

    return wi.setup(progress).then(() => {
      this.groups.push(wi);

      return Promise.resolve();
    });
    // return this.setup({ start, end, files, space }).then((fGroup) => {
    //   fGroup.ctx = context;

    //   return fGroup;
    // });
  }

  setCurrentItem(item) {
    this.currentItem = item;
  }

  hasItem() {
    return this.groups.length > 0;
  }

  remove(item) {
    const idx = this.groups.indexOf(item);
    if (idx >= 0) {
      this.groups.splice(idx, 1);
      const _item = this.hasItem();
      if (!_item) {
        this.setCurrentItem(null);
        this.slipWinndow.hide();
      }
    }
  }

  setupSlip() {
    this.slipWinndow.setup();
  }

  active(item) {
    this.setCurrentItem(item);
    const isLast = item === this.groups[this.groups.length - 1];
    this.timeline.fire('track:wave:active', { item, isLast });
    this.slipWinndow.show(item);
  }

  start() {
    this.timeline.on({
      // [eventNames.PANEL_POS_CHANGED]: this._handlers.timechanged,
      // [eventNames.PANEL_TICKS_CHANGED]: this._handlers.tickschanged,
      [eventNames.TIME_CHANGED]: this._handlers.timechanged,
      'track:wave:focus': this._handlers.focusItem,
      [eventNames.SYNC_TIME_CHANGED]: this._handlers.syncTimeChanged,
    });
  }

  end() {
    this._isSelected = false;
    this.timeline.off({
      [eventNames.TIME_CHANGED]: this._handlers.timechanged,
    });
  }

  _onPosChanged({ progress }) {
    if (!progress || progress < 0 || progress > 1) {
      return;
    }
    if (this.tickPanel && progress) {
      const diff = progress * this.range[1];
      this.tickPanel.left = this.range[0] - diff;
      // self.range[0] - this.left;
      // console.log('_onPosChanged diff:', diff, ',', this.range);
      // if (diff < 0) {
      //   this.tickPanel.left = this.range[0];
      // } else if (diff > this.range[1]) {
      //   this.tickPanel.left = this.range[0] - this.range[1];
      // } else {
      //   this.tickPanel.left = this.range[0] - diff;
      // }
    }
  }

  _onTicksChanged({ count, space, duration, lastDuration }) {
    if (this.count !== count || this.space !== space) {
      this.getCanvas().remove(this.tickPanel);
      this.setup({ count, space }).then(() => {
        // console.log('add panel ok:', fObj);
        const lastTime = this.changeCache.progress * lastDuration;
        console.log('lastTime:', lastTime, ', new r:', lastTime / duration);
        this._onPosChanged({ progress: lastTime / duration });
      });
    }
  }

  _onTimeChanged({ progress }) {
    const x = this.timeline.getPosOffset(progress);
    this.groups.forEach((g) => {
      g.timeChanged(x);
    });
  }

  _onFocusItem({ elemId }) {
    const currentTime = this.timeline.getCurrentTime();
    for (let i = 0, n = this.groups.length; i < n; i += 1) {
      const waveItem = this.groups[i];
      if (waveItem.context.elemId === elemId) {
        const _end = this.start + this.getDuration();
        if (currentTime < this.start || currentTime > _end) {
          this.timeline.changeTime(waveItem.start);
          this.active(waveItem);
        }
        break;
      }
    }
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

  updateStart(items, newStart) {
    let lastStart = newStart;
    console.log('updateStart lastStart:', lastStart);
    if (items.length > 0) {
      for (let i = 0; i < items.length; i += 1) {
        const ti = items[i];
        ti.updateStart(lastStart);
        lastStart = ti.start + ti.getDuration();
      }
      // this.groups.forEach((ti) => {
      //   ti.hasTransition = true;
      // });
      const lastItem = this.groups[this.groups.length - 1];
      lastItem.hideTransition();
    }
  }

  insertBefore(first, second) {
    let find;
    const items = [first];
    this.groups.sort(function (a, b) {
      return a.start - b.start;
    });
    for (let i = 0; i < this.groups.length; i += 1) {
      const ti = this.groups[i];
      if (ti === second) {
        items.push(ti);
        find = true;
        continue;
      }
      if (find) {
        if (ti === first) {
          break;
        }
        items.push(ti);
      }
    }
    this.updateStart(items, second.start);
  }

  insertAfter(first, second) {
    let find;
    const items = [];
    this.groups.sort(function (a, b) {
      return a.start - b.start;
    });
    for (let i = 0; i < this.groups.length; i += 1) {
      const ti = this.groups[i];
      if (ti === first) {
        find = true;
        continue;
      }
      if (find) {
        items.push(ti);
        if (ti === second) {
          break;
        }
      }
    }
    items.push(first);
    this.updateStart(items, first.start);
  }

  scaleAfter(first) {
    let find;
    const items = [];
    this.groups.sort(function (a, b) {
      return a.start - b.start;
    });
    for (let i = 0; i < this.groups.length; i += 1) {
      const ti = this.groups[i];
      if (ti === first) {
        find = true;
        continue;
      }
      if (find) {
        items.push(ti);
      }
    }
    this.updateStart(items, first.start + first.getDuration());
  }

  updatingPosition(item, { x, direct }) {
    let done = false;

    return new Promise((resolve) => {
      for (let i = 0; i < this.groups.length; i += 1) {
        const ti = this.groups[i];
        if (ti === item) {
          continue;
        }
        const [x0, x1] = ti.xyRange;
        console.log('x:', x, ',x0:', x0, ',x1:', x1, ',direct:', direct);
        if (x > x0 && x < x1) {
          if (direct > 0) {
            this.insertAfter(item, ti);
            done = true;
          } else if (direct < 0) {
            this.insertBefore(item, ti);
            done = true;
          }
          break;
        }
      }
      resolve(done);
    });
  }

  _bindEventOnObj(fObj, cb) {
    const self = this;
    const canvas = this.getCanvas();

    fObj.on({
      added() {
        self._shapeObj = this;
        if (cb) {
          self.timeline.showIndicator();
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
        console.log('panel mousedown _startPoint:', self._startPoint);
      },
      moving(fEvent) {
        console.log('panel moving fEvent:', fEvent);
        // const _startPoint = canvas.getPointer(fEvent.e);

        // self._startPoint = _startPoint;

        // const diff = self.range[0] - this.left;
        // if (diff < 0) {
        //   this.left = self.range[0];
        //   if (!self.checkInCache(0)) {
        //     self.timeline.fire('time:head', { progress: 0 });
        //     self.timeline.fire(eventNames.TIME_CHANGED, { progress: 0 });
        //   }
        // } else if (diff > self.range[1]) {
        //   this.left = self.range[0] - self.range[1];
        //   if (!self.checkInCache(1)) {
        //     self.timeline.fire('time:end', { progress: 1 });
        //     self.timeline.fire(eventNames.TIME_CHANGED, { progress: 1 });
        //   }
        // } else {
        //   const progress = diff / self.range[1];
        //   if (!self.checkInCache(progress)) {
        //     self.timeline.fire(eventNames.TIME_CHANGED, { progress });
        //   }
        // }
      },
    });
  }

  _onFabricMouseDown() {}

  _onFabricMouseMove() {
    // const canvas = this.getCanvas();
    // const pointer = canvas.getPointer(fEvent.e);
    // const startPointX = this._startPoint.x;
    // const startPointY = this._startPoint.y;
    // const width = startPointX - pointer.x;
    // const height = startPointY - pointer.y;
    // const shape = this._shapeObj;
    // if (!shape) {
    //   // this._shapeObj.set({
    //   //   isRegular: this._withShiftKey,
    //   // });
    //   console.log('width:', width, ',height:', height);
    // }
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

export default WaveTrack;

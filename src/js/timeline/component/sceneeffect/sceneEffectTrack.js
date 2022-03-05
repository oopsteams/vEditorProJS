// import snippet from 'tui-code-snippet';
// import fabric from 'fabric';
import Component from '@/timeline/component';
import SceneEffectItem from './sceneEffectItem';
import SESlipWindow from './slipwin';
import { tlComponentNames, eventNames } from '@/consts';
import { iterator } from '@/util';
const TrackEventPrefix = 'track:sceneeffect';
const SlipEventPrefix = 'slip:sceneeffect';

const boxHeight = 30;

class SceneEffectTrack extends Component {
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
    this.eventPrefix = { track: TrackEventPrefix, slip: SlipEventPrefix };
    this.slipWinndow = new SESlipWindow(this);
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
    this.name = 'se';
  }

  getBoxHeight() {
    return boxHeight;
  }

  getYOffset() {
    let top = 0,
      height = 0;
    if (this.groups.length > 0) {
      this.groups.forEach((ti) => {
        const { top: _top, height: _height } = ti.getRect();
        if (top < _top) {
          top = _top;
        }
        if (height < _height) {
          height = _height;
        }
      });
    } else {
      top = this.top;
      height = this.getBoxHeight();
    }

    return { top, height };
  }

  updateTop(top) {
    this.top = top;
    this.groups.forEach((wi) => {
      wi.updateTop(top);
    });
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

  addSceneEffect(space, context) {
    // const total = this.totalDuration();
    const { section, duration, trackItem } = context;
    const { start } = trackItem;
    section.startAt = start;
    const ai = new SceneEffectItem(
      { start, duration, space, top: this.top, height: boxHeight, context },
      this
    );
    // const progress = this.timeline.getCurrentProgress();

    return ai.setup().then(() => {
      this.groups.push(ai);
      this.timeline.getPanel().fire(`panel:time:changed`, {});

      return Promise.resolve(ai);
    });
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

  clearAll(callback) {
    const gs = [];
    this.groups.forEach((g) => {
      gs.push(g);
    });
    iterator(
      gs,
      (g, _idx, comeon) => {
        g.dispose(() => {
          comeon(true);
        });
      },
      callback
    );
    // gs.forEach((g) => {
    //   g.dispose();
    // });
  }

  setupSlip() {
    this.slipWinndow.setup();
  }

  active(item) {
    this.setCurrentItem(item);
    const isLast = item === this.groups[this.groups.length - 1];
    this.timeline.fire(`${this.eventPrefix.track}:active`, { item, isLast });
    this.slipWinndow.show(item);
  }

  blur() {
    this.slipWinndow.hide();
    this.timeline.fire(`${this.eventPrefix.slip}:unselected`, { item: null });
  }

  start() {
    this.timeline.on({
      [eventNames.TIME_CHANGED]: this._handlers.timechanged,
      [`${this.eventPrefix.track}:focus`]: this._handlers.focusItem,
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
    }
  }

  _onTicksChanged({ count, space, duration, lastDuration }) {
    if (this.count !== count || this.space !== space) {
      this.getCanvas().remove(this.tickPanel);
      this.setup({ count, space }).then(() => {
        // console.log('add panel ok:', fObj);
        const lastTime = this.changeCache.progress * lastDuration;
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
      const item = this.groups[i];
      if (item.context.elemId === elemId) {
        const _end = item.start + item.getDuration();
        if (currentTime < item.start || currentTime > _end) {
          this.timeline.changeTime(item.start);
          this.timeline.track.active(item);
        }
        break;
      }
    }
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

  swapItem(first, second) {
    const firstStart = first.reComputeStart();
    const secondStart = second.reComputeStart();
    first.updateStart(secondStart);
    second.updateStart(firstStart);
  }

  updatingPosition(item, { left, x, direct }) {
    let done = false;
    // findSelf = false;
    return new Promise((resolve) => {
      // const _items = [];
      for (let i = 0; i < this.groups.length; i += 1) {
        const ti = this.groups[i];
        if (ti === item) {
          // findSelf = true;
          continue;
        }
        if (!item.isInSameGroup(ti)) {
          continue;
        }
        const [x0, x1] = ti.xyRange;
        // console.log('x:', x, ',x0:', x0, ',x1:', x1, ',direct:', direct);
        // if (findSelf) {
        //   _items.push(ti);
        // }
        if (x > x0 && x < x1) {
          if (direct > 0) {
            // this.insertAfter(item, ti);
            this.swapItem(item, ti);
            done = true;
          } else if (direct < 0) {
            // this.insertBefore(item, ti);
            this.swapItem(item, ti);
            done = true;
          }
          break;
        }
      }
      if (!done) {
        const newStart = this.timeline.convertPosToTime(left);
        console.log('done newStart:', newStart, ',left:', left);
        item.updateStart(newStart);
        // this.syncMove(diff, _items);
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
      },
    });
  }

  focusByTrackItem(trackItem) {
    let find = false;
    this.groups.forEach((ai) => {
      if (ai.context.trackItem === trackItem) {
        ai.focus();
        find = true;
      }
    });
    if (!find) {
      this.blur();
      // this.timeline.fire(`${this.eventPrefix.slip}:unselected`, { item: null });
    }

    return find;
  }

  _onFabricMouseDown() {}

  _onFabricMouseMove() {}

  _onFabricMouseUp() {}
}

export default SceneEffectTrack;

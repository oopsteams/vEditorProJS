// import snippet from 'tui-code-snippet';
// import fabric from 'fabric';
import Component from '@/timeline/component';
import TrackItem from '../model/trackitem';
import TrackTransition from '../model/tracktransition';
import SlipWinndow from './slipWindow';
import { tlComponentNames, eventNames } from '@/consts';

class Track extends Component {
  constructor(timeline, { type, top, previewItemWidth, previewItemHeight }) {
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
    this.previewItemWidth = previewItemWidth;
    this.previewItemHeight = previewItemHeight;
    this.slipWinndow = new SlipWinndow(this);
    this._handlers = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
      poschanged: this._onPosChanged.bind(this),
      tickschanged: this._onTicksChanged.bind(this),
      timechanged: this._onTimeChanged.bind(this),
      syncTimeChanged: this._onSyncTimeChanged.bind(this),
    };
    this.changeCache = {};
    this.start();
    this.counter = 0;
    this.setupSlip();
    this.locked = false;
  }

  getBoxHeight() {
    return this.previewItemHeight;
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

  getTransitionItems(trackItem) {
    let preItem, nextItem;
    console.log('getTransitionItems trackItem:', trackItem);
    for (let i = 0, n = this.groups.length; i < n; i += 1) {
      const g = this.groups[i];
      if (g.name === 'item') {
        if (g === trackItem) {
          preItem = g;
          continue;
        }
        if (preItem) {
          nextItem = g;
          break;
        }
      }
    }

    return { item: preItem, next: nextItem };
    // if (preItem && nextItem) {
    //   this.insertBefore(trackTransition, nextItem);
    // }
    // return Promise.resolve();
  }

  getItemByTransition(transition) {
    if (transition) {
      for (let i = 0, n = this.groups.length; i < n; i += 1) {
        const g = this.groups[i];
        if (g.transition && g.transition === transition) {
          return g;
        }
      }
    }

    return null;
  }

  getItemByUid(uid) {
    for (let i = 0, n = this.groups.length; i < n; i += 1) {
      const g = this.groups[i];
      const { context } = g;
      if (context.section && context.section.uid === uid) {
        return g;
      }
    }
    console.log('not find uid:', uid, ',groups:', this.groups);

    return null;
  }

  addTransition(trackItem, start, duration, space, context) {
    const total = this.totalDuration();
    start = start + total;
    const { item, next } = this.getTransitionItems(trackItem);
    if (item.transition) {
      item.transition.context = context;
      if (!item.hasTransition) {
        item.hasTransition = true;

        return item.transition.reAdd().then(() => {
          this.groups.push(item.transition);
          if (item && next) {
            this.insertBefore(item.transition, next);
          }
          this.timeline.fire('track:add', { track: this });

          return Promise.resolve();
        });
      }

      return Promise.resolve();
    }

    return this.timeline.changeDuration(total + duration).then(() => {
      console.log('new Transition start at:', start);
      const tt = new TrackTransition(
        { start, duration, space, top: this.top, height: this.previewItemHeight, context },
        this
      );

      return tt.setup().then(() => {
        item.transition = tt;
        item.hasTransition = true;
        this.groups.push(tt);
        console.log('groups len:', this.groups.length);

        if (item && next) {
          this.insertBefore(tt, next);
        }
        this.timeline.fire('track:add', { track: this });

        return Promise.resolve();
      });
    });
  }

  /*
  removeTransition() {
    if (this.currentItem && !this.isLastItem(this.currentItem)) {
      this.currentItem.removeTransition();
      this.active(this.currentItem);
      this.timeline.deactivateAll();
      this.timeline.fire('track:remove', { track: this });

      return true;
    }

    return false;
  }
  */

  removeFrame() {
    this.timeline.fire('track:remove', { track: this });
  }

  addVideoFrames(start, duration, files, space, context) {
    const total = this.totalDuration();
    // console.log('addVideoFrames total:', total);
    start = start + total;
    if (context.height && this.groups.length === 0) {
      this.previewItemHeight = context.height;
    }

    return this.timeline.changeDuration(total + duration).then(() => {
      const progress = this.timeline.getCurrentProgress();
      // console.log('track addVideoFrames progress:', progress);
      const ti = new TrackItem(
        { start, duration, files, space, top: this.top, height: this.previewItemHeight, context },
        this
      );
      return ti.setup(progress).then(() => {
        // this.groups.forEach((ti) => {
        //   ti.hasTransition = true;
        // });
        // ti.hasTransition = false;
        this.groups.push(ti);
        this.timeline.fire('track:add', { track: this });
        this.unlock();

        return Promise.resolve();
      });
    });
  }

  setCurrentItem(item) {
    console.log('setCurrentItem item:', item);
    this.currentItem = item;
  }

  setupSlip() {
    this.slipWinndow.setup();
    // const onDeselected = this._onSlipDeselected.bind(this);
    // const onSlipSelected = this._onSlipSelected.bind(this);
    // this.slipWinndow.on({ 'slip:deselected': onDeselected });
    // this.slipWinndow.on({ 'slip:selected': onSlipSelected });
  }

  active(item) {
    this.setCurrentItem(item);
    if (this.locked) {
      return;
    }
    // const isLast = item === this.groups[this.groups.length - 1];
    // this.timeline.fire('track:item:active', { item, isLast });
    if (!this.isTransition(item)) {
      this.slipWinndow.show(item);
    }
  }

  focus() {
    console.log('track focus currentItem:', this.currentItem);
    if (this.currentItem) {
      this.active(this.currentItem);
      const isLast = this.isLastItem(this.currentItem);
      this.timeline.fire('slip:item:selected', { item: this.currentItem, isLast });
    }
  }

  isEmpty() {
    return this.groups.length === 0;
  }

  lock() {
    this.timeline.fire('track:item:active', { item: null });
    this.slipWinndow.hide();
    this.locked = true;
  }

  unlock() {
    this.locked = false;
    if (this.currentItem) {
      this.active(this.currentItem);
      const isLast = this.isLastItem(this.currentItem);
      this.timeline.fire('track:item:active', { item: this.currentItem, isLast });
    }
  }

  hasItem() {
    if (this.groups.length > 0) {
      for (let i = 0, n = this.groups.length; i < n; i += 1) {
        const g = this.groups[i];
        if (g.name === 'item') {
          return g;
        }
      }
    }

    return false;
  }

  remove(item) {
    const idx = this.groups.indexOf(item);
    if (idx >= 0) {
      if (this.isTransition(item)) {
        const ctx = this.getTransitionItems(item.context.trackItem);
        const preItem = ctx.item;
        console.log('preItem:', preItem, ',elemId:', item.context.elemId);
        preItem.hasTransition = false;
      }
      this.groups.splice(idx, 1);
      const _item = this.hasItem();
      if (_item) {
        this.updateStart(this.groups, 0);
        this.active(_item);
        // this.timeline.fire('track:item:changed', { item: null });
      } else {
        this.setCurrentItem(null);
        this.timeline.fire('track:item:active', { item: null });
        this.slipWinndow.hide();
      }
    }
  }

  clearAll() {
    const gs = [];
    const ts = [];
    this.groups.forEach((g) => {
      if (this.isTransition(g)) {
        ts.push(g);
      } else {
        gs.push(g);
      }
    });
    ts.forEach((g) => {
      g.dispose();
    });
    gs.forEach((g) => {
      g.dispose();
    });
    this.currentItem = null;
  }

  start() {
    this.timeline.on({
      // [eventNames.PANEL_POS_CHANGED]: this._handlers.timechanged,
      [eventNames.PANEL_TICKS_CHANGED]: this._handlers.tickschanged,
      [eventNames.TIME_CHANGED]: this._handlers.timechanged,
      [eventNames.SYNC_TIME_CHANGED]: this._handlers.syncTimeChanged,
    });
  }

  end() {
    this._isSelected = false;
    this.timeline.off({
      // [eventNames.PANEL_POS_CHANGED]: this._handlers.timechanged,
      [eventNames.PANEL_TICKS_CHANGED]: this._handlers.tickschanged,
      [eventNames.TIME_CHANGED]: this._handlers.timechanged,
      [eventNames.SYNC_TIME_CHANGED]: this._handlers.syncTimeChanged,
    });
  }

  _onSlipDeselected() {
    console.log('_onSlipDeselected in....');
  }

  _onSlipSelected() {
    console.log('_onSlipSelected in....');
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

  _onSyncTimeChanged({ progress }) {
    const x = this.timeline.getPosOffset(progress);
    this.groups.forEach((g) => {
      g.timeChanged(x);
    });
  }

  updateStart(items, newStart) {
    let lastStart = newStart;
    // console.log('updateStart lastStart:', lastStart);
    if (items.length > 0) {
      for (let i = 0; i < items.length; i += 1) {
        const ti = items[i];
        ti.updateStart(lastStart);
        lastStart = ti.start + ti.getDuration();
      }
      // this.groups.forEach((ti) => {
      //   ti.hasTransition = true;
      // });
      this.groups.sort(function (a, b) {
        return a.start - b.start;
      });
      const lastItem = this.groups[this.groups.length - 1];
      if (this.isTransition(lastItem)) {
        const _lastItem = lastItem.context.trackItem;
        if (_lastItem) {
          _lastItem.hideTransition();
        }
      }
    }
    // this.getCanvas().renderAll();
  }

  insertBefore(target, second) {
    let find;
    const items = [target];
    // this.groups.sort(function (a, b) {
    //   return a.start - b.start;
    // });
    for (let i = 0; i < this.groups.length; i += 1) {
      const ti = this.groups[i];
      if (ti === second) {
        items.push(ti);
        find = true;
        continue;
      }
      if (find) {
        if (ti === target) {
          break;
        }
        items.push(ti);
      }
    }
    this.updateStart(items, second.start);
  }

  insertAfter(target, second) {
    let find;
    const items = [];
    // this.groups.sort(function (a, b) {
    //   return a.start - b.start;
    // });
    for (let i = 0; i < this.groups.length; i += 1) {
      const ti = this.groups[i];
      if (ti === target) {
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
    items.push(target);
    this.updateStart(items, target.start);
  }

  scaleAfter(first) {
    let find;
    const items = [];

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

  isTransition(item) {
    return item.name === 'transition';
  }

  updatingPosition(item, { x, direct }) {
    let done = false;

    return new Promise((resolve) => {
      for (let i = 0; i < this.groups.length; i += 1) {
        const ti = this.groups[i];
        if (ti === item || this.isTransition(ti)) {
          continue;
        }
        const [x0, x1] = ti.xyRange;
        // console.log('x:', x, ',x0:', x0, ',x1:', x1, ',direct:', direct);
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

  _onFabricMouseDown() {}

  _onFabricMouseMove() {}

  _onFabricMouseUp() {}
}

export default Track;

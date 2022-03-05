// import snippet from 'tui-code-snippet';
// import fabric from 'fabric';
// import Component from '@/timeline/component';

import WaveTrackItem from './waveTrackItem';
import WaveSlipWindow from './slipwin';
import BaseTrack from '../base/baseTrack';

// import { eventNames } from '@/consts';
const TrackItem = WaveTrackItem;
const SlipWindow = WaveSlipWindow;

class WaveTrack extends BaseTrack {
  constructor(parent, index, { type, top, eventPrefix }) {
    super(parent, index, { top, eventPrefix });
    // this.range = [];
    this.version = 0;
    if (!type) {
      type = 'main';
    }

    this.type = type;

    this.slipWindow = new SlipWindow(this);
    this._handlers = {
      focusItem: this._onFocusItem.bind(this),
    };
    this.changeCache = {};
    this.start();
    this.counter = 0;
    this.setupSlip();
  }

  addItem(start, duration, files, space, context) {
    // const total = this.totalDuration();
    // const start = total;
    const { section } = context;
    const defaultTimePos = this.lastItemTimePos();
    if (start < defaultTimePos) {
      start = defaultTimePos;
    }
    section.startAt = start;
    const ti = new TrackItem(
      { start, duration, files, space, top: this.top, height: this.getBoxHeight(), context },
      this
    );

    return ti.setup().then(() => {
      this.groups.push(ti);
      this.timeline.getPanel().fire(`panel:time:changed`, {});

      return Promise.resolve(ti);
    });
  }

  setupSlip() {
    this.slipWindow.setup();
  }

  active(item) {
    this.setCurrentItem(item);
    const isLast = item === this.groups[this.groups.length - 1];
    this.timeline.fire(`${this.eventPrefix.track}:active`, { item, isLast });
    this.slipWindow.show(item);
  }

  blur() {
    this.slipWindow.hide();
    this.timeline.fire(`${this.eventPrefix.slip}:unselected`, { item: null });
  }

  start() {
    this.timeline.on({
      [`${this.eventPrefix.track}:focus`]: this._handlers.focusItem,
    });
  }

  // end() {
  //   this._isSelected = false;
  //   // this.timeline.off({
  //   //   [eventNames.TIME_CHANGED]: this._handlers.timechanged,
  //   // });
  // }

  // _onPosChanged({ progress }) {
  //   if (!progress || progress < 0 || progress > 1) {
  //     return;
  //   }
  //   if (this.tickPanel && progress) {
  //     const diff = progress * this.range[1];
  //     this.tickPanel.left = this.range[0] - diff;
  //   }
  // }

  // _onTicksChanged({ count, space, duration, lastDuration }) {
  //   if (this.count !== count || this.space !== space) {
  //     this.getCanvas().remove(this.tickPanel);
  //     this.setup({ count, space }).then(() => {
  //       // console.log('add panel ok:', fObj);
  //       const lastTime = this.changeCache.progress * lastDuration;
  //       this._onPosChanged({ progress: lastTime / duration });
  //     });
  //   }
  // }

  // _onTimeChanged({ progress }) {
  //   const x = this.timeline.getPosOffset(progress);
  //   this.groups.forEach((g) => {
  //     g.timeChanged(x);
  //   });
  // }

  _onFocusItem({ elemId }) {
    const currentTime = this.timeline.getCurrentTime();
    for (let i = 0, n = this.groups.length; i < n; i += 1) {
      const item = this.groups[i];
      if (item.context.elemId === elemId) {
        const _end = item.reComputeStart() + item.getDuration();
        if (currentTime < item.reComputeStart() || currentTime > _end) {
          this.timeline.changeTime(item.reComputeStart());
          this.active(item);
        }
        break;
      }
    }
  }

  getItemByUid(uid) {
    for (let i = 0, n = this.groups.length; i < n; i += 1) {
      const g = this.groups[i];
      const { context } = g;
      if (context.section && context.section.uid === uid) {
        return g;
      }
    }

    return null;
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
}

export default WaveTrack;

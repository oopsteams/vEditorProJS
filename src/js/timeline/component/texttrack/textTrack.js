// import snippet from 'tui-code-snippet';
// import fabric from 'fabric';
// import Component from '@/timeline/component';
import TextTrackItem from './textTrackItem';
import TextSlipWindow from './slipwin';
import BaseTrack from '../base/baseTrack';

// import { eventNames } from '@/consts';
const TrackItem = TextTrackItem;
const SlipWindow = TextSlipWindow;

class TextTrack extends BaseTrack {
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

  addItem(start, duration, space, context) {
    // const total = this.totalDuration();
    // const start = total;
    const { section } = context;
    if (start === 0) {
      start = this.totalDuration();
    }
    section.startAt = start;
    const ti = new TrackItem(
      { start, duration, space, top: this.top, height: this.getBoxHeight(), context },
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
        const _end = item.start + item.getDuration();
        if (currentTime < item.start || currentTime > _end) {
          this.timeline.changeTime(item.start);
          this.timeline.track.active(item);
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

export default TextTrack;

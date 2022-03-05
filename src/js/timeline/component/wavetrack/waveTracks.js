// import snippet from 'tui-code-snippet';
// import fabric from 'fabric';
import Component from '@/timeline/component';
import WaveTrack from './waveTrack';

import { tlComponentNames, eventNames } from '@/consts';
const Track = WaveTrack;
const TrackEventPrefix = 'track:wave';
const SlipEventPrefix = 'slip:wave';

const boxHeight = 30;

class WaveTracks extends Component {
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

    this._handlers = {
      timechanged: this._onTimeChanged.bind(this),
      // focusItem: this._onFocusItem.bind(this),
      syncTimeChanged: this._onTimeChanged.bind(this),
    };
    this.changeCache = {};
    this.start();
    this.counter = 0;
    this.name = 'wave';
    // this.setupSlip();
    this.initTrack(2);
  }

  getBoxHeight() {
    return boxHeight;
  }

  getYOffset() {
    let top = 0,
      height = 0;
    if (this.groups.length > 0) {
      this.groups.forEach((ti) => {
        const { top: _top, height: _height } = ti.getYOffset();
        if (top < _top) {
          top = _top;
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
    this.groups.forEach((track) => {
      const _top = this.top + track.index * this.getBoxHeight();
      track.updateTop(_top);
    });
  }

  initTrack(n) {
    for (let index = 0; index < n; index += 1) {
      const _t = new Track(this, index, {
        type: this.type,
        top: this.top + index * this.getBoxHeight(),
        eventPrefix: this.eventPrefix,
      });
      this.groups.push(_t);
    }
  }

  totalDuration() {
    let maxDuration = 0;
    this.groups.forEach((ti) => {
      if (maxDuration < ti.totalDuration()) {
        maxDuration = ti.totalDuration();
      }
    });

    return maxDuration;
  }

  addTrackItem({ start, duration, files, space, context }) {
    const index = context.isMain ? 0 : 1;
    const track = this.groups[index];
    console.log('index:', index, ',top:', track.top);

    return track.addItem(start, duration, files, space, context).then((item) => {
      return Promise.resolve(item);
    });
  }

  getItemByUid(uid) {
    for (let i = 0, n = this.groups.length; i < n; i += 1) {
      const g = this.groups[i];
      const item = g.getItemByUid(uid);
      if (item) {
        return item;
      }
    }
    console.log('not find uid:', uid, ',groups:', this.groups);

    return null;
  }

  remove(item) {
    this.groups.forEach((track) => {
      track.remove(item);
    });
  }

  clearAll() {
    this.groups.forEach((track) => {
      track.clearAll();
    });
  }

  hideAll() {
    this.groups.forEach((g) => {
      g.hide();
    });
  }

  showAll() {
    this.groups.forEach((g) => {
      g.show();
    });
  }

  // active(item) {
  //   this.setCurrentItem(item);
  //   const isLast = item === this.groups[this.groups.length - 1];
  //   this.timeline.fire(`${this.eventPrefix.track}:active`, { item, isLast });
  //   this.slipWinndow.show(item);
  // }

  // blur() {
  //   this.slipWinndow.hide();
  //   this.timeline.fire(`${this.eventPrefix.slip}:unselected`, { item: null });
  // }

  start() {
    this.timeline.on({
      [eventNames.TIME_CHANGED]: this._handlers.timechanged,
      // [`${this.eventPrefix.track}:focus`]: this._handlers.focusItem,
      [eventNames.SYNC_TIME_CHANGED]: this._handlers.syncTimeChanged,
    });
  }

  // end() {
  //   this._isSelected = false;
  //   this.timeline.off({
  //     [eventNames.TIME_CHANGED]: this._handlers.timechanged,
  //   });
  // }

  _onTimeChanged({ progress }) {
    const x = this.timeline.getPosOffset(progress);
    this.groups.forEach((g) => {
      g.timeChanged(x);
    });
  }

  // _onFocusItem({ elemId }) {
  //   const currentTime = this.timeline.getCurrentTime();
  //   for (let i = 0, n = this.groups.length; i < n; i += 1) {
  //     const item = this.groups[i];
  //     if (item.context.elemId === elemId) {
  //       const _end = item.start + item.getDuration();
  //       if (currentTime < item.start || currentTime > _end) {
  //         this.timeline.changeTime(item.start);
  //         this.timeline.track.active(item);
  //       }
  //       break;
  //     }
  //   }
  // }

  focusByTrackItem(trackItem) {
    let find = false;
    this.groups.forEach((track) => {
      find = track.focusByTrackItem(trackItem);
    });

    return find;
  }
}

export default WaveTracks;

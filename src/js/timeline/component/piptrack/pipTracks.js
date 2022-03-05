// import snippet from 'tui-code-snippet';
// import fabric from 'fabric';
import Component from '@/timeline/component';
import PipTrack from './pipTrack';
import { tlComponentNames, eventNames } from '@/consts';
import { iterator } from '@/util';
const Track = PipTrack;
const TrackEventPrefix = 'track:pip';
const SlipEventPrefix = 'slip:pip';

const boxHeight = 30;

class PipTracks extends Component {
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
    this.name = 'pip';
    // this.setupSlip();
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
    const oldCount = this.groups.length;
    if (n > oldCount) {
      for (let index = oldCount; index < n; index += 1) {
        const _t = new Track(this, index, {
          type: this.type,
          top: this.top + index * this.getBoxHeight(),
          eventPrefix: this.eventPrefix,
        });
        this.groups.push(_t);
      }
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

  addTrackItem(index, space, files, context) {
    // const total = this.totalDuration();
    // let track;
    console.log('pip Tracks addTrackItem index:', index);
    if (Number.isNaN(index) || index < 0) {
      const n = this.groups.length;
      index = n;
      const _t = new Track(this, index, {
        type: this.type,
        top: this.top + index * this.getBoxHeight(),
        eventPrefix: this.eventPrefix,
      });
      this.groups.push(_t);
    }
    const track = this.groups[index];

    return track.addPipItem(space, files, context).then((item) => {
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

  clearAll(callback) {
    iterator(
      this.groups,
      (track, _idx, comeon) => {
        track.clearAll(() => {
          comeon(true);
        });
      },
      callback
    );
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

  start() {
    this.timeline.on({
      [eventNames.TIME_CHANGED]: this._handlers.timechanged,
      // [`${this.eventPrefix.track}:focus`]: this._handlers.focusItem,
      [eventNames.SYNC_TIME_CHANGED]: this._handlers.syncTimeChanged,
    });
  }

  _onTimeChanged({ progress }) {
    const x = this.timeline.getPosOffset(progress);
    this.groups.forEach((g) => {
      g.timeChanged(x);
    });
  }

  focusByTrackItem(trackItem) {
    let find = false;
    this.groups.forEach((track) => {
      find = track.focusByTrackItem(trackItem);
    });

    return find;
  }
}

export default PipTracks;

import snippet from 'tui-code-snippet';
import fabric from 'fabric';
const { CustomEvents, extend } = snippet;
import TrackBaseItem from '../base/trackBaseItem';
import { roundValue } from '@/util';
const VERSION = { ver: 0 };

class PipTrackItem extends TrackBaseItem {
  constructor({ start, duration, space, files, top, height, context }, track) {
    super({ start, space, top, height }, track);
    this.name = 'piptrackitem';
    this.duration = duration;
    this.context = context;
    this.files = files;
    this.range = [];
    this.startOffset = 0;
    this.frameViews = [];
    this.transition = null;
    this.hasTransition = false;
    this.version = VERSION.ver;
    VERSION.ver += 1;
    this.lastStart = -1;

    this.timeRange[0] = 0;
    this.timeRange[1] = this.timeRange[0] + this.context.duration;
  }

  createGroup() {
    const start = this.reComputeStart();
    const x = this.getTimeline().convertTimeToPos(start);
    console.log('pip item createGroup start:', start, ',x:', x, ',top:', this.top);
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
    let i, cnt, midStart, remain, commonIndex, diff;
    const total = this.files.length;
    const { section } = this.context;
    console.log('trackitem filter frame section:', section);
    commonIndex = 0;
    if (section && section.commonIndex) {
      commonIndex = section.commonIndex;
      console.log('trackitem filter frame section commonIndex:', section.commonIndex);
    }
    const [startAt, endAt] = this.timeRange;
    console.log('filterFrameViews timeRange:', startAt, ',', endAt, ',commonIndex:', commonIndex);
    remain = startAt % 1;
    const startN = startAt - remain;
    cnt = startN;
    for (i = 0; i < cnt; i += 1) {
      const file = this.files[i];
      file.exclude = true;
    }
    diff = 1;
    if (remain > 0) {
      if (endAt - i <= 1) {
        diff = endAt - i;
      }
      const file = this.files[i];
      file.exclude = false;
      file.w = (diff - remain) * this.space;
      midStart = cnt + 1;
      console.log(`[${commonIndex}]file[${i}] include, w:`, file.w);
    } else if (endAt - cnt < 1) {
      remain = endAt - cnt;
      if (remain > 0) {
        const file = this.files[i];
        file.exclude = false;
        file.w = remain * this.space;
        console.log(`[${commonIndex}]file[${i}] include, w:`, file.w);
      }
      midStart = cnt + 1;
    } else {
      midStart = cnt;
    }
    for (i = midStart; i < endAt - 1; i += 1) {
      const file = this.files[i];
      file.exclude = false;
      file.w = this.space;
      console.log(`[${commonIndex}]file[${i}] include, w:`, file.w, ',full');
    }
    if (i < endAt) {
      remain = endAt - i;
      if (remain <= 1 && remain > 0) {
        if (i < total) {
          const file = this.files[i];
          file.exclude = false;
          file.w = remain * this.space;
          console.log(`[${commonIndex}]file[${i}] include, w:`, file.w, ',may full');
        }
        midStart = i + 1;
      } else {
        midStart = i;
      }
    } else {
      midStart = i;
    }
    cnt = total;
    for (i = midStart; i < cnt; i += 1) {
      const file = this.files[i];
      file.exclude = true;
      file.w = this.space;
    }
  }

  setup() {
    // const { start } = this;
    const start = this.reComputeStart();
    console.log('pip setup start:', start);
    this.range[0] = this.getTimeline().convertTimeToPos(start);
    this.timeRange[0] = 0;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    this.timeRange[1] = this.timeRange[0] + this.context.duration;
    this.filterFrameViews();

    return this.setFrames().then(() => {
      return this._make();
    });
  }

  _make() {
    // const width = this.space * this.getDuration();
    // const group = this.createGroup(width);
    const group = this.createGroup();
    // this.scaleLabel(width);

    return new Promise((resolve) => {
      const canvas = this.getCanvas();
      this._bindEventOnObj(group, (fObj) => {
        this.version = this.version + 1;
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
      this._loopNewImage({ i: start, start, end, files, space }, () => {
        resolve();
      });
    });
  }

  updateFrames() {
    this.labels = [];
    const { start, files, space } = this;
    const end = this.start + this.duration;
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
    const idx = Math.round(i - start);
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
    imageOption.scaleX = 1;
    // imageOption.scaleX = file.w / imageOption.width;
    if (imgCount > subIndex) {
      imageOption.scaleX = file.w / imageOption.width;
      // console.log('subIndex:', subIndex, ',scaleX:', imageOption.scaleX);
      if (subIndex > 0) {
        imageOption.left = this.frameViews[subIndex - 1].rw + this.frameViews[subIndex - 1].left;
      }
      const fImage = this.frameViews[subIndex];
      fImage.set(imageOption);
      fImage.rw = file.w;
      fImage.exclude = file.exclude;
      this._loopUpdateImage({ i: i + 1, start, end, files, space }, callback);
    } else if (imgCount === subIndex) {
      const lastImage = this.frameViews[subIndex - 1];
      imageOption.left = lastImage.rw + lastImage.left;
      imageOption.scaleX = file.w / imageOption.width;
      if (file.url) {
        fabric.Image.fromURL(
          file.url,
          (fImage) => {
            fImage.setOptions(imageOption);
            fImage.time = i;
            fImage.rw = file.w;
            fImage.exclude = file.exclude;
            this.frameViews.push(fImage);
            this._loopUpdateImage({ i: i + 1, start, end, files, space }, callback);
          },
          {
            crossOrigin: 'Anonymous',
          }
        );
      } else {
        imageOption.fill = 'rgba(255,255,255,0.3)';
        imageOption.stroke = '#282828';
        const polygon = new fabric.Rect(imageOption);
        polygon.time = i;
        polygon.rw = file.w;
        polygon.exclude = file.exclude;
        this.frameViews.push(polygon);
        this._loopUpdateImage({ i: i + 1, start, end, files, space }, callback);
      }
    }
  }

  // getDuration() {
  //   return this.timeRange[1] - this.timeRange[0];
  // }

  _loopNewImage({ i, start, end, files, space }, callback) {
    let subIndex;
    const height = this.boxHeight;
    // const self = this;
    if (i >= end) {
      callback();

      return;
    }
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
      width: this.space,
      height,
      hoverCursor: 'default',
      selectable: false,
    };
    imageOption.scaleX = file.w / imageOption.width;
    if (imgCount > 0) {
      imageOption.left = this.frameViews[imgCount - 1].rw + this.frameViews[imgCount - 1].left;
    }
    if (file.url) {
      fabric.Image.fromURL(
        file.url,
        (fImage) => {
          fImage.setOptions(imageOption);
          fImage.time = i;
          fImage.rw = file.w;
          fImage.exclude = file.exclude;
          console.log('trackItem => Image.fromURL fImage:', fImage);
          this.frameViews.push(fImage);
          this._loopNewImage({ i: i + 1, start, end, files, space }, callback);
        },
        {
          crossOrigin: 'Anonymous',
        }
      );
    } else {
      imageOption.fill = 'rgba(255,255,255,0.3)';
      imageOption.stroke = '#282828';
      const polygon = new fabric.Rect(imageOption);
      polygon.time = i;
      polygon.rw = file.w;
      polygon.exclude = file.exclude;
      this.frameViews.push(polygon);
      this._loopNewImage({ i: i + 1, start, end, files, space }, callback);
    }
  }

  timeChanged(time) {
    const x = this.getTimeline().convertTimeToPos(this.start);
    this.itemPanel.left = x + time;
    this.syncItemOffset();
    this.xyRange[0] = this.itemPanel.left;
    this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
    this.itemPanel.setCoords();
    // this.fire('track:item:start:changed', { time });
  }

  syncItemOffset() {
    const { left, top, width, height } = this.itemPanel;
    this.fire(`${this.track.eventPrefix.track}:move`, { left, top, width, height });
  }

  increaseDuration(delta) {
    let n;
    const count = this.files.length;
    n = Math.floor(delta);
    if (n < delta) {
      n += 1;
    }
    const file = this.files[count - 1];
    // console.log('increaseDuration file:', file, ',delta:', delta);
    for (let i = 0; i < n; i += 1) {
      const _file = {};
      extend(_file, file);
      this.files.push(_file);
    }
    this.context.duration += delta;
    this.duration = this.context.duration;
    const { start } = this;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    if (delta !== 0) {
      this.getTimeline().ui.datasource.fire(`${this.track.eventPrefix.track}:duration:changed`, {
        duration: this.duration,
        item: this,
      });
    }

    return Promise.resolve();
  }

  triggerTimeChange(callback) {
    this.getTimeline().getPanel().fire(`panel:time:changed`, {});
    const { index } = this.track;
    const { section } = this.context;
    this.getTimeline().ui.datasource.fire(`${this.track.eventPrefix.track}:time:change`, {
      index,
      section,
      range: this.timeRange,
      start: this.reComputeStart(),
      callback,
    });
  }

  updateStart(newStart) {
    const _lastStart = this.reComputeStart();
    // const newStart = this.reComputeStart();
    if (newStart !== _lastStart) {
      // const dur = this.getDuration();
      // const { start } = this.context.trackItem;
      this.lastStart = newStart;
      const newX = this.getTimeline().convertTimeToPos(newStart);
      this.range[0] = newX;
      const end = newStart + this.duration;
      this.range[1] = this.getTimeline().convertTimeToPos(end);
      this.itemPanel.left = newX;
      this.start = newStart;
      this.xyRange[0] = this.itemPanel.left;
      this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
      this.itemPanel.setCoords();
      // this.getTimeline().updateActiveObj(this.itemPanel);
      // console.log('this.version:', this.version, 'panel left:', this.itemPanel.left);
    }
    this.triggerTimeChange();
  }

  changeDuration({ startAt, pos, dur, callback }) {
    this.start = startAt;
    this.timeRange[0] = pos;
    this.timeRange[1] = this.timeRange[0] + dur;
    this.updateTimeRange([pos, pos + dur], callback);
  }

  permitScaleOut() {
    console.log('permitScaleOut fileType:', this.context.fileType);

    return this.context.fileType === 'none' || this.context.fileType.indexOf('image') >= 0;
  }

  updateTimeRange(tRange, callback) {
    this.timeRange[0] = tRange[0];
    this.timeRange[1] = tRange[1];
    this.getCanvas().remove(this.itemPanel);
    this.filterFrameViews();

    this.updateFrames().then(() => {
      // const currentProgress = this.getTimeline().getCurrentProgress();
      this._make().then(() => {
        this.track.active(this);
        this.track.scaleAfter(this);
        // this.track.timeline.fire(`${this.track.eventPrefix.track}:time:change`, {
        //   range: this.timeRange,
        //   context: this.context,
        //   callback,
        // });
        this.triggerTimeChange();
        this.syncItemOffset();
        if (callback) {
          this.itemPanel.setCoords();
          callback();
        }
      });
    });
  }

  updateSize({ left, right }) {
    let newT, delta;
    // console.log('updateSize left:', left, ',right:', right);
    const { duration } = this.context;
    const t = this.getDuration();

    const reBuild = () => {
      // console.log('new timeRange:', this.timeRange);
      this.updateTimeRange(this.timeRange);
    };
    if (t < 0.1) {
      this.timeRange[1] = this.timeRange[0] + 0.1;
      reBuild();

      return;
    }
    if (left === 1) {
      newT = roundValue(t * right);
      if (newT + this.timeRange[0] > duration) {
        delta = newT + this.timeRange[0] - duration;
        if (this.permitScaleOut() && delta >= 0.05) {
          delta = Math.floor(delta * 100) / 100;
          newT = delta + duration - this.timeRange[0];
          this.timeRange[1] = this.timeRange[0] + newT;
          this.increaseDuration(delta).then(() => {
            reBuild();
            // this.getTimeline().getPanel().enable();
          });

          return;
        }
        newT = roundValue(this.timeRange[1] - this.timeRange[0]);
      }
      this.timeRange[1] = this.timeRange[0] + newT;
      reBuild();
    } else {
      const timeDiff = t * (1 - left) + this.timeRange[0];
      if (timeDiff <= 0) {
        if (this.timeRange[0] === 0) {
          this.track.active(this);

          return;
        }
        this.timeRange[0] = 0;
      } else {
        this.timeRange[0] = roundValue(timeDiff);
        //
      }
      reBuild();
    }
  }

  dispose(callback) {
    if (this.frameViews.length > 0) {
      this.frameViews.forEach((img) => {
        if (img.dispose) {
          img.dispose();
        }
      });
    }
    if (this.transition) {
      this.transition.dispose();
      this.transition = null;
    }
    super.dispose(callback);
    // this.getCanvas().remove(this.itemPanel);
    // this.track.remove(this);
    // this.track.timeline.fire(`${this.track.eventPrefix.track}:ui:remove`, { item: this, callback });
  }

  // hide() {
  //   this.itemPanel.visible = false;
  // }

  // show() {
  //   this.itemPanel.visible = true;
  // }

  // getRect() {
  //   const { left, top, width, height } = this.itemPanel;

  //   return { left, top, width, height };
  // }

  // focus() {
  //   this.track.active(this);
  //   console.log('pip track item selected!!!!');
  //   this.track.timeline.fire(`${this.track.eventPrefix.slip}:selected`, { item: this });
  // }

  blur() {
    this.track.timeline.fire(`${this.track.eventPrefix.slip}:unselected`, { item: this });
  }

  // ==================================

  // reComputeStart() {
  //   // const { trackItem } = this.context;
  //   const { start } = this;
  //   // console.log('reComputeStart start:', start, ',timeRange:', this.timeRange);

  //   return start;
  // }

  // getMaxTimeRange() {
  //   const start = 0;
  //   const dur = this.getTimeline().track.totalDuration();
  //   return { start, dur };
  // }

  // checkInCorrectRange(x0, x1) {
  //   // const permit = this.track.timeline.checkInRound(x0, x1);
  //   let newStart = this.getTimeline().convertPosToTime(x0, true);
  //   let newEnd = this.getTimeline().convertPosToTime(x1, true);
  //   const { start, dur } = this.getMaxTimeRange();
  //   console.log('maxTimeRange start:', start, ',dur:', dur, ',newStart:', newStart);
  //   console.log('maxTimeRange newEnd:', newEnd);
  //   if (newStart < start) {
  //     newStart = start;
  //     newEnd = newStart + this.getDuration();
  //   }
  //   if (newEnd > start + dur) {
  //     newEnd = start + dur;
  //     newStart = newEnd - this.getDuration();
  //   }
  //   const startPos = this.getTimeline().getPanel().calcPosByTime(newStart);
  //   x0 = startPos.diff + startPos.centerLeft;
  //   const endPos = this.getTimeline().getPanel().calcPosByTime(newEnd);
  //   console.log('startPos:', startPos, ',endPos:', endPos);
  //   x1 = endPos.diff + endPos.centerLeft;
  //   const rx0 = startPos.diff + startPos.left;
  //   const rx1 = endPos.diff + endPos.left;
  //   // const startX = this.getTimeline().convertTimeToPos(start);
  //   const diffx = 0;
  //   console.log('checkInCorrectRange result x0:', x0, ',x1:', x1, ',diffx:', diffx);
  //   console.log('maxTimeRange final newStart:', newStart, ',newEnd:', newEnd);

  //   return { left: x0 + diffx, right: x1 + diffx, start: newStart, end: newEnd, rx0, rx1 };
  // }

  // isInSameGroup(seItem) {
  //   const { track } = this;
  //   return track === seItem.track;
  // }

  syncOffset() {
    const { left, top, width, height } = this.getRect();
    this.fire(`${this.track.eventPrefix.track}:move`, { left, top, width, height });
  }

  // updateTop(top) {
  //   if (top !== this.top) {
  //     this.top = top;
  //     this.itemPanel.set({ top });
  //     this.itemPanel.setCoords();
  //   }
  // }
}

CustomEvents.mixin(PipTrackItem);

export default PipTrackItem;

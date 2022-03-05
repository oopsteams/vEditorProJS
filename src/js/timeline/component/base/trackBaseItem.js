class TrackBaseItem {
  constructor({ start, space, top, height }, track) {
    this.track = track;
    this.start = start;
    this.space = space;
    this.boxHeight = height;
    this.top = top;
    this.timeRange = [];
    this.xyRange = [];
    this.itemPanel = null;
  }

  _bindEventOnObj(fObj, cb) {
    const self = this;

    fObj.on({
      added() {
        if (cb) {
          cb(this);
        }
      },
      selected() {
        self.focus();
      },
      deselected() {},
      modifiedInGroup() {},
      mousedown() {
        // self.track.active(self);
      },
      moving() {},
    });
  }

  checkInCorrectRange(x0, x1) {
    let newStart = this.getTimeline().convertPosToTime(x0, true);
    let newEnd = this.getTimeline().convertPosToTime(x1, true);
    const { start, dur } = this.getMaxTimeRange();
    if (newStart < start) {
      newStart = start;
      newEnd = newStart + this.getDuration();
    }
    if (newEnd > start + dur) {
      newEnd = start + dur;
      newStart = newEnd - this.getDuration();
    }
    const startPos = this.getTimeline().getPanel().calcPosByTime(newStart);
    x0 = startPos.diff + startPos.centerLeft;
    const endPos = this.getTimeline().getPanel().calcPosByTime(newEnd);

    x1 = endPos.diff + endPos.centerLeft;
    const rx0 = startPos.diff + startPos.left;
    const rx1 = endPos.diff + endPos.left;
    // const startX = this.getTimeline().convertTimeToPos(start);
    const diffx = 0;

    return { left: x0 + diffx, right: x1 + diffx, start: newStart, end: newEnd, rx0, rx1 };
  }

  updateTop(top) {
    if (top !== this.top && this.itemPanel) {
      this.top = top;
      this.itemPanel.set({ top });
      this.itemPanel.setCoords();
    }
  }

  isInSameGroup(seItem) {
    const { track } = this;
    return track === seItem.track;
  }

  getMaxTimeRange() {
    const start = 0;
    const dur = this.getTimeline().track.totalDuration();
    return { start, dur };
  }

  reComputeStart() {
    const { start } = this;
    // console.log('base item reComputeStart start:', start);

    return start;
  }

  getRect() {
    const { left, top, height } = this.itemPanel;
    const width = this.space * this.getDuration();
    return { left, top, width, height };
  }

  focus() {
    this.track.active(this);
    // this.track.timeline.fire(`${this.track.eventPrefix.slip}:selected`, { item: this });
  }

  getDuration() {
    return this.timeRange[1] - this.timeRange[0];
  }

  getTimeline() {
    return this.track.timeline;
  }

  getCanvas() {
    return this.track.timeline.getCanvas();
  }

  dispose(callback) {
    if (this.itemPanel) {
      this.getCanvas().remove(this.itemPanel);
      this.track.remove(this);
      this.track.timeline.fire(`${this.track.eventPrefix.track}:ui:remove`, {
        item: this,
        callback,
      });
    } else if (callback) {
      callback();
    }
  }

  hide() {
    if (this.itemPanel) {
      this.itemPanel.visible = false;
    }
  }

  show() {
    if (this.itemPanel) {
      this.itemPanel.visible = true;
    }
  }
}

export default TrackBaseItem;

import { roundTimeline, iterator } from '@/util';
const boxHeight = 30;

class BaseTrack {
  constructor(parent, index, { top, eventPrefix }) {
    this.index = index;
    this.parent = parent;
    this.top = top;
    this.timeline = this.parent.timeline;
    this.groups = [];
    this.currentItem = null;
    this.slipWindow = null;
    this.eventPrefix = eventPrefix;
    this.tag = '';
  }

  updateStart(items, newStart) {
    let lastStart = newStart;
    if (items.length > 0) {
      for (let i = 0; i < items.length; i += 1) {
        const ti = items[i];
        const _start = ti.reComputeStart();
        if (_start < lastStart) {
          ti.updateStart(lastStart);
        }
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
    this.updateStart(items, second.reComputeStart());
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
    this.updateStart(items, first.reComputeStart());
  }

  scaleAfter(first) {
    let find;
    const items = [];
    this.groups.sort(function (a, b) {
      return a.reComputeStart() - b.reComputeStart();
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
    this.updateStart(items, first.reComputeStart() + first.getDuration());
  }

  swapItem(first, second) {
    const firstStart = first.reComputeStart();
    const secondStart = second.reComputeStart();
    first.updateStart(secondStart);
    second.updateStart(firstStart);
  }

  updatingPosition(item, { left, x, start, direct }) {
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
        const newStart = roundTimeline(start); // this.timeline.convertPosToTime(left);
        console.log('done newStart:', newStart, ',left:', left);
        item.updateStart(newStart);
        // this.syncMove(diff, _items);
      }
      resolve(done);
    });
  }

  timeChanged(x) {
    this.groups.forEach((g) => {
      g.timeChanged(x);
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
        if (this.slipWindow) {
          this.slipWindow.hide();
        }
      }
    }
  }

  clearAll(callback) {
    const gs = [];
    this.groups.forEach((g) => {
      gs.push(g);
    });
    // gs.forEach((g) => {
    //   g.dispose();
    // });

    iterator(
      gs,
      (g, _idx, comeon) => {
        g.dispose(() => {
          comeon(true);
        });
      },
      () => {
        this.groups = [];
        if (callback) {
          callback();
        }
      }
    );
  }

  hide() {
    this.groups.forEach((g) => {
      g.hide();
    });
    if (this.slipWindow) {
      this.slipWindow.hide();
    }
  }

  show() {
    this.groups.forEach((g) => {
      g.show();
    });
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

  lastItemTimePos() {
    const item = this.groups[this.groups.length - 1];
    if (item) {
      return item.reComputeStart() + item.getDuration();
    }

    return 0;
  }

  getBoxHeight() {
    return boxHeight;
  }
}

export default BaseTrack;

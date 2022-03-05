import fabric from 'fabric';
// import snippet from 'tui-code-snippet';
import { winControls } from '@/timeline/controls';
// const { CustomEvents } = snippet;

class PipSlipWindow {
  constructor(track) {
    this.name = 'PipSlipWindow';
    this.track = track;
    this._handlers = {
      // mousedown: this._onFabricMouseDown.bind(this),
      // mousemove: this._onFabricMouseMove.bind(this),
      // mouseup: this._onFabricMouseUp.bind(this),
      targetmove: this._onTargetMove.bind(this),
    };
  }

  setupLabel() {
    const options = {
      left: 0,
      top: 0,
      width: 10,
      hoverCursor: 'default',
      selectable: false,
      stroke: '#ffffff',
      backgroundColor: 'rgba(137,137,137,0.5)',
      strokeWidth: 1,
      originX: 'left',
      fontSize: '11',
    };
    this.lable = new fabric.Text('', options);
    this.lable.visible = false;
    this.getTimeline().add(this.lable);
  }

  setup() {
    const tickHeight = 34;
    const options = {
      type: 'rect',
      left: 10,
      top: 0,
      width: 60,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: false,
      lockScalingY: true,
      lockScalingFlip: true,
      height: tickHeight,
      stroke: '#ffd727',
      fill: 'rgba(255,255,255,0.1)',
    };
    this.win = new fabric.Rect(options);
    this.win.controls = winControls;
    this.win.visible = false;
    this._bindEventOnObj(this.win);
    this.getTimeline().add(this.win);
    this.setupLabel();
  }

  updateLabel() {
    if (this.target) {
      const dur = Math.round(this.target.getDuration() * 100) / 100;
      this.lable.text = `${dur}s`;
    }
  }

  show(item) {
    this.hide();
    this.target = item;
    const rect = this.updateTargetRect();
    // rect.top -= 1;
    // rect.height += 2;
    // const { ml, mr } = this.win.oCoords;
    this.win.scaleX = 1;
    this.win.set(rect);
    this.lable.set(rect);
    this.win.visible = true;
    this.lable.visible = true;
    this.updateLabel();
    // const canvas = this.getCanvas();
    // canvas.on({
    //   'mouse:down': this._handlers.mousedown,
    // });
    this.lable.bringToFront();
    this.win.bringToFront();
    this.win.setCoords();
    this.getTimeline().updateActiveObj(this.win);
    this.target.on({
      [`${this.track.eventPrefix.track}:move`]: this._handlers.targetmove,
    });
  }

  hide() {
    this.win.visible = false;
    this.lable.visible = false;
    if (this.target) {
      this.target.off({
        [`${this.track.eventPrefix.track}:move`]: this._handlers.targetmove,
      });
      this.win.sendToBack();
    }
  }

  _bindEventOnObj(fObj, cb) {
    let leftDiff;
    const self = this;
    const canvas = this.getCanvas();

    fObj.on({
      added() {
        if (cb) {
          cb(this);
        }
      },
      scaled() {
        const { width } = self.targetRect;
        const permit = self.target.checkInCorrectRange(this.left, this.left + width * this.scaleX);
        leftDiff = self.targetRect.left - permit.rx0;

        console.log('leftDiff:', leftDiff, ',slip left:', this.left, ',', self.targetRect.left);
        const abLeftDiff = Math.abs(leftDiff);
        if (abLeftDiff >= 0 && abLeftDiff < 0.005) {
          leftDiff = 0;
        }
        if (leftDiff > 0) {
          this.left = self.targetRect.left;
          const left = this.scaleX;
          self.target.updateSize({ left, right: 1 });
        } else if (leftDiff === 0) {
          const right = this.scaleX;
          this.left = self.targetRect.left;
          self.target.updateSize({ left: 1, right });
          console.log('left fix width:', this.width, ',', width, ',right:', right);
        } else {
          const left = this.scaleX;
          self.target.updateSize({ left, right: 1 });
          console.log('left fix width:', this.width, ',', width, ',left:', left);
        }
      },
      selected() {
        self._isSelected = true;
        self._shapeObj = this;
        if (self.target) {
          const isLast = self.track.isLastItem(self.target);
          console.log('pip slipwin selected!!!!');
          self.track.timeline.fire(`${self.track.eventPrefix.slip}:selected`, {
            item: self.target,
            isLast,
            source: 'slip',
          });
        }
      },
      deselected() {
        self._isSelected = false;
        self._shapeObj = null;
        if (self.target) {
          const isLast = self.track.isLastItem(self.target);
          self.track.timeline.fire(`${self.track.eventPrefix.slip}:deselected`, {
            item: self.target,
            isLast,
          });
        }
      },
      modifiedInGroup(activeSelection) {
        console.log('modifiedInGroup in activeSelection:', activeSelection);
      },
      mousedown(fEvent) {
        self._startPoint = canvas.getPointer(fEvent.e);
        if (self.target) {
          self.track.timeline.fire(`${self.track.eventPrefix.slip}:mousedown`, {
            item: self.target,
          });
        }
      },
      mouseup(fEvent) {
        if (self.isMoving) {
          const { width } = self.targetRect;
          const permit = self.target.checkInCorrectRange(this.left, this.left + width);
          // const permit = self.target.checkInCorrectRange(this.left, this.left + this.width);
          if (permit) {
            this.left = permit.left;
            const { x } = canvas.getPointer(fEvent.e);
            if (this.left !== self.targetRect.left) {
              self.track
                .updatingPosition(self.target, {
                  left: this.left,
                  x,
                  start: permit.start,
                  direct: x - self._startPoint.x,
                })
                .then((done) => {
                  if (!done) {
                    this.left = self.targetRect.left;
                  } else {
                    self.show(self.target);
                  }
                });
            }
          } else {
            this.left = self.targetRect.left;
          }
        }
        self.isMoving = false;
      },
      moving(fEvent) {
        // const { width } = self.targetRect;

        if (!self._startPoint) {
          self._startPoint = canvas.getPointer(fEvent.e);
        }
        self.isMoving = true;
      },
    });
  }

  getCanvas() {
    return this.track.timeline.getCanvas();
  }

  getTimeline() {
    return this.track.timeline;
  }

  updateTargetRect() {
    const rect = this.target.getRect();
    const { left, top, width, height } = rect;
    this.targetRect = { left, top, width, height };
    // console.log('show this.targetRect:', this.targetRect);

    return rect;
  }

  _onTargetMove({ left, top }) {
    // console.log('_onTargetMove left:', left, ',top:', top);
    this.lable.set({ left, top: top - 1 });
    this.win.set({ left, top: top - 1 });
    this.lable.bringToFront();
    this.win.bringToFront();
    this.updateTargetRect();
  }
}

export default PipSlipWindow;

import fabric from 'fabric';
// import snippet from 'tui-code-snippet';
import { winControls } from '@/timeline/controls';
// const { CustomEvents } = snippet;
class SlipWinndow {
  constructor(track) {
    this.name = 'slipWindow';
    this.track = track;
    this._handlers = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
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
      fill: '#898989',
      backgroundColor: 'transparent',
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
      left: 0,
      top: 0,
      width: 10,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: false,
      lockScalingY: true,
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
    rect.top -= 1;
    rect.height += 2;
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
    this.getTimeline().updateActiveObj(this.win);
    this.target.on({
      'track:item:move': this._handlers.targetmove,
    });
  }

  hide() {
    this.win.visible = false;
    this.lable.visible = false;
    if (this.target) {
      this.target.off({
        'track:item:move': this._handlers.targetmove,
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
        leftDiff = self.targetRect.left - this.left;
        // const { ml, mr } = this.oCoords;
        // const leftDiff = ml.x - self.targetRect.ml.x;
        // const rightDiff = mr.x - self.targetRect.mr.x;
        console.log('leftDiff:', leftDiff, ',slip left:', this.left, ',', self.targetRect.left);
        const abLeftDiff = Math.abs(leftDiff);
        if (abLeftDiff >= 0 && abLeftDiff < 0.0001) {
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
        console.log('slip win:', this);
      },
      selected() {
        self._isSelected = true;
        self._shapeObj = this;
        if (self.target) {
          const isLast = self.track.isLastItem(self.target);
          self.track.timeline.fire('slip:item:selected', { item: self.target, isLast });
        }
      },
      deselected() {
        self._isSelected = false;
        self._shapeObj = null;
        // self.fire('slip:deselected', {});
        if (self.target) {
          const isLast = self.track.isLastItem(self.target);
          self.track.timeline.fire('slip:item:deselected', { item: self.target, isLast });
        }
      },
      modifiedInGroup() {},
      mousedown(fEvent) {
        self._startPoint = canvas.getPointer(fEvent.e);
        // console.log('panel mousedown _startPoint:', self._startPoint);
      },
      mouseup(fEvent) {
        if (self.isMoving) {
          const permit = self.track.timeline.checkInRound(this.left, this.left + this.width);
          if (permit) {
            const { x } = canvas.getPointer(fEvent.e);
            if (this.left !== self.targetRect.left) {
              self.track
                .updatingPosition(self.target, {
                  left: this.left,
                  x,
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
        const permit = self.track.timeline.checkInRound(this.left, this.left + this.width);
        if (permit) {
          if (!self._startPoint) {
            self._startPoint = canvas.getPointer(fEvent.e);
          }
          self.isMoving = true;
          // self._startPoint = canvas.getPointer(fEvent.e);
          // self.track.updatingPosition(self.target, { left: this.left, x: self._startPoint.x });
        } else {
          this.left = self.targetRect.left;
        }
      },
    });
  }

  getCanvas() {
    return this.track.timeline.getCanvas();
  }

  getTimeline() {
    return this.track.timeline;
  }

  _onFabricMouseDown() {}

  _onFabricMouseMove() {}

  _onFabricMouseUp() {}

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

// CustomEvents.mixin(SlipWinndow);
export default SlipWinndow;

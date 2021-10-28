import fabric from 'fabric';
// import snippet from 'tui-code-snippet';
import { winControls } from '@/timeline/controls';
// const { CustomEvents } = snippet;
class TextSlipWindow {
  constructor(track) {
    this.name = 'textSlipWindow';
    this.track = track;
    this._handlers = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
      targetmove: this._onTargetMove.bind(this),
    };
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
      height: tickHeight,
      stroke: '#ffd727',
      fill: 'rgba(255,255,255,0.1)',
    };
    this.win = new fabric.Rect(options);
    this.win.controls = winControls;
    this.win.visible = false;
    this._bindEventOnObj(this.win);
    this.getTimeline().add(this.win);
  }

  show(item) {
    console.log('show skip window.');
    this.hide();
    this.target = item;
    const rect = this.updateTargetRect();
    rect.top -= 1;
    rect.height += 2;
    // const { ml, mr } = this.win.oCoords;
    this.win.scaleX = 1;
    this.win.set(rect);
    this.win.visible = true;
    // const canvas = this.getCanvas();
    // canvas.on({
    //   'mouse:down': this._handlers.mousedown,
    // });
    this.win.bringToFront();
    this.getTimeline().updateActiveObj(this.win);
    this.target.on({
      'track:text:move': this._handlers.targetmove,
    });
  }

  hide() {
    this.win.visible = false;
    if (this.target) {
      this.target.off({
        'track:text:move': this._handlers.targetmove,
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
          self.track.timeline.fire('slip:text:selected', { item: self.target, isLast });
        }
      },
      deselected() {
        self._isSelected = false;
        self._shapeObj = null;
        if (self.target) {
          const isLast = self.track.isLastItem(self.target);
          self.track.timeline.fire('slip:text:deselected', { item: self.target, isLast });
        }
      },
      modifiedInGroup(activeSelection) {
        console.log('modifiedInGroup in activeSelection:', activeSelection);
      },
      mousedown(fEvent) {
        self._startPoint = canvas.getPointer(fEvent.e);
        // console.log('panel mousedown _startPoint:', self._startPoint);
      },
      mouseup(fEvent) {
        if (self.isMoving) {
          const permit = self.track.timeline.checkInRound(this.left, this.left + this.width);
          console.log('text slip win left:', this.left);
          if (permit) {
            this.left = permit.left;
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
            console.log('text slip win left(permit is false):', this.left);
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

  _onFabricMouseDown(fEvent) {
    if (!fEvent.target) {
      this._isSelected = false;
      this._shapeObj = false;
    }

    if (!this._isSelected && !this._shapeObj) {
      // this.hide();
    }
  }

  _onFabricMouseMove() {
    /*
    const canvas = this.getCanvas();
    if (!fEvent.e) {
      const pointer = canvas.getPointer(fEvent.e);
      const startPointX = this._startPoint.x;
      const startPointY = this._startPoint.y;
      const width = startPointX - pointer.x;
      const height = startPointY - pointer.y;
      console.log('width:', width, ',height:', height);
    }
    */
  }

  _onFabricMouseUp() {
    // const canvas = this.getCanvas();
    // const startPointX = this._startPoint.x;
    // const startPointY = this._startPoint.y;
    // const shape = this._shapeObj;
    // canvas.off({
    //   'mouse:move': this._handlers.mousemove,
    //   'mouse:up': this._handlers.mouseup,
    // });
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
    this.win.set({ left, top: top - 1 });
    this.win.bringToFront();
    this.updateTargetRect();
  }
}

export default TextSlipWindow;

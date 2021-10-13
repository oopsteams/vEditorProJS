// import snippet from 'tui-code-snippet';
import fabric from 'fabric';
// const { CustomEvents } = snippet;
const defaultWidth = 10;
const defaultHeight = 10;
const pad = 3;

class Transition {
  constructor(trackitem, options, context) {
    this.name = 'transition';
    this.trackitem = trackitem;
    this.context = context;
    this.options = options;
    this._show = true;
    this.isRemoved = false;
    this._handlers = {
      targetmove: this._onTargetMove.bind(this),
    };
  }

  setup() {
    const points = [
      { x: 0, y: 0 },
      { x: defaultWidth / 2, y: defaultHeight / 2 },
      { x: defaultWidth, y: 0 },
      { x: defaultWidth, y: defaultHeight },
      { x: defaultWidth / 2, y: defaultHeight / 2 },
      { x: 0, y: defaultHeight },
    ];
    const options = {
      type: 'polygon',
      left: 0,
      top: 0,
      width: defaultWidth,
      height: defaultHeight,
      lockMovementY: true,
      lockMovementX: true,
      lockRotation: true,
      lockScalingX: false,
      lockScalingY: true,
      hasControls: false,
      stroke: '#ffd727',
      strokeWidth: 3,
      fill: 'transparent',
    };
    return new Promise((resolve) => {
      this.icon = new fabric.Polygon(points, options);
      this.icon.visible = false;
      this._bindEventOnObj(this.icon, () => {
        resolve();
      });
      this.getTimeline().add(this.icon);
    });
  }

  show(item) {
    console.log('show skip window.');
    this.hide();
    this._show = true;
    this.target = item;
    const rect = this.updateTargetRect();
    this._onTargetMove(rect);
    this.target.on({
      'track:item:move': this._handlers.targetmove,
    });
  }

  hide() {
    if (this.target) {
      this.target.off({
        'track:item:move': this._handlers.targetmove,
      });
    }
    this.icon.visible = false;
    this._show = false;
  }

  recover() {
    this.icon.visible = false;
    this._show = false;
    this.isRemoved = false;
  }

  remove() {
    this.isRemoved = true;
    this.icon.visible = false;
    this._show = false;
  }

  _bindEventOnObj(fObj, cb) {
    const self = this;
    // const canvas = this.getCanvas();

    fObj.on({
      added() {
        if (cb) {
          cb(this);
        }
      },
      scaled() {},
      selected() {
        self._isSelected = true;
        self._shapeObj = this;
        console.log('Transition trigger in.......');
      },
      deselected() {
        self._isSelected = false;
        self._shapeObj = null;
        // self.fire('slip:deselected', {});
      },
    });
  }

  getCanvas() {
    return this.trackitem.track.timeline.getCanvas();
  }

  getTimeline() {
    return this.trackitem.track.timeline;
  }

  updateTargetRect() {
    const rect = this.target.getRect();
    const { left, top, width, height } = rect;
    this.targetRect = { left, top, width, height };
    console.log('show this.targetRect:', this.targetRect);

    return rect;
  }

  _onTargetMove({ left, top, width, height }) {
    console.log('_onTargetMove left:', left, ',top:', top);
    const iconTop = top + (height - defaultHeight) / 2;
    this.icon.set({ left: left + width - defaultWidth - pad, top: iconTop });
    if (this._show && !this.isRemoved) {
      this.icon.visible = true;
      this.icon.bringToFront();
    }
  }
}

export default Transition;

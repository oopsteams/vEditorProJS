// import snippet from 'tui-code-snippet';
import fabric from 'fabric';
// const { CustomEvents } = snippet;
const VERSION = { ver: 0 };
class TrackTransition {
  constructor({ start, duration, space, top, height, context }, track) {
    this.name = 'transition';
    this.start = start;
    this.duration = duration;
    this.context = context;
    this.track = track;
    this.space = space;
    this.boxHeight = height;
    this.top = top;
    this.range = [];
    this.startOffset = 0;
    this.timeRange = [];
    this.xyRange = [];
    this.transition = null;
    this.hasTransition = false;
    this.version = VERSION.ver;
    VERSION.ver += 1;
    this._handlers = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
    };
  }

  reAdd() {
    return new Promise((resolve) => {
      if (!this.getCanvas().contains(this.itemPanel)) {
        this._bindEventOnObj(this.itemPanel, (fObj) => {
          this.version = this.version + 1;
          this.xyRange[0] = fObj.left;
          this.xyRange[1] = fObj.left + fObj.width;
          fObj.setCoords();
          fObj.bringToFront();
          this.getTimeline().updateActiveObj(fObj);
          resolve(fObj);
        });
        this.getTimeline().add(this.itemPanel);
      } else {
        resolve(this.itemPanel);
      }
    });
  }

  setup() {
    const { start } = this;
    const x = this.getTimeline().convertTimeToPos(start);
    const width = this.duration * this.space;
    const height = this.boxHeight - 2;
    const points = [
      { x: 0, y: 0 },
      { x: width / 2, y: height / 2 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: width / 2, y: height / 2 },
      { x: 0, y: height },
    ];
    const options = {
      type: 'polygon',
      left: x,
      top: this.top,
      width,
      height,
      lockMovementY: true,
      lockMovementX: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
      stroke: '#ffd727',
      strokeWidth: 1,
      selectable: true,
      fill: '#ffd727',
    };
    this.range[0] = x;
    this.range[1] = this.getTimeline().convertTimeToPos(start + this.context.duration);
    this.timeRange[0] = 0;
    this.timeRange[1] = this.timeRange[0] + this.context.duration;

    return new Promise((resolve) => {
      this.itemPanel = new fabric.Polygon(points, options);
      // this.itemPanel.visible = false;
      this._bindEventOnObj(this.itemPanel, (fObj) => {
        this.version = this.version + 1;
        this.xyRange[0] = fObj.left;
        this.xyRange[1] = fObj.left + fObj.width;
        fObj.setCoords();
        fObj.bringToFront();
        // console.log('add new transition ok!!!');
        resolve(fObj);
      });
      this.getTimeline().add(this.itemPanel);
    });
  }

  getDuration() {
    console.log('getDuration timeRange:', this.timeRange);

    return this.timeRange[1] - this.timeRange[0];
  }

  timeChanged(time) {
    const x = this.getTimeline().convertTimeToPos(this.start);
    this.itemPanel.left = x + time;
    // const { left, top, width, height } = this.itemPanel;
    this.xyRange[0] = this.itemPanel.left;
    this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
    this.itemPanel.setCoords();
  }

  updateStart(newStart) {
    const { start } = this;
    if (newStart !== start) {
      // const x = this.getTimeline().convertTimeToPos(start);
      console.log('newStart:', newStart, ',start:', start);
      const newX = this.getTimeline().convertTimeToPos(newStart);
      // console.log('newX:', newX, ',x:', x);
      this.range[0] = newX;
      const end = newStart + this.duration;
      this.range[1] = this.getTimeline().convertTimeToPos(end);
      this.start = newStart;
      // const diff = newX - x;
      this.itemPanel.left = newX;
      this.xyRange[0] = this.itemPanel.left;
      this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
      // this.itemPanel.setCoords();
      // this.track.timeline.fire('track:item:sorted', {
      //   start: this.start,
      //   range: this.timeRange,
      //   context: this.context,
      // });
      this.itemPanel.setCoords();
      this.getTimeline().updateActiveObj(this.itemPanel);
      // console.log('this.version:', this.version, 'panel left:', this.itemPanel.left);
    }
  }

  getTimeline() {
    return this.track.timeline;
  }

  getCanvas() {
    return this.track.timeline.getCanvas();
  }

  dispose() {
    this.getCanvas().remove(this.itemPanel);
    this.track.remove(this);
    this.track.timeline.fire('track:transition:dispose', { item: this });
    // console.log('will set null context.trackItem:', this.context.trackItem);
    this.context.trackItem = null;
  }

  getRect() {
    const { left, top, width, height } = this.itemPanel;

    return { left, top, width, height };
  }

  _bindEventOnObj(fObj, cb) {
    const self = this;
    const canvas = this.getCanvas();

    fObj.on({
      added() {
        if (cb) {
          cb(this);
        }
      },
      selected() {
        self._isSelected = true;
        self._shapeObj = this;
        self.track.active(self);
        self.track.timeline.fire('slip:item:selected', { item: self, isLast: false });
      },
      deselected() {
        self._isSelected = false;
        self._shapeObj = null;
      },
      modifiedInGroup(activeSelection) {
        console.log('modifiedInGroup in activeSelection:', activeSelection);
      },
      mousedown(fEvent) {
        self._startPoint = canvas.getPointer(fEvent.e);
        console.log('track transition mousedown _startPoint:', self._startPoint);
      },
      moving(fEvent) {
        const _startPoint = canvas.getPointer(fEvent.e);
        // const { x, y } = _startPoint, { sx = x, sy = y } = self._startPoint;
        self._startPoint = _startPoint;
        console.log('trackitem moving _startPoint:', _startPoint);
      },
    });
  }

  _onFabricMouseDown() {}

  _onFabricMouseMove() {}

  _onFabricMouseUp() {}
}

export default TrackTransition;

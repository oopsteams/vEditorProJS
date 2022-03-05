// import snippet from 'tui-code-snippet';
import fabric from 'fabric';
// const { CustomEvents } = snippet;
const VERSION = { ver: 0 };
class BackCanvasItem {
  constructor({ start, duration, space, top, height, context }, track) {
    this.name = 'backcanvas';
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

  createGroup() {
    const { start } = this;
    const x = this.getTimeline().convertTimeToPos(start);
    console.log('createGroup start:', start, ',x:', x);
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

  setup() {
    const { start } = this;
    console.log('setup start:', start);
    this.range[0] = this.getTimeline().convertTimeToPos(start);
    this.timeRange[0] = 0;
    const end = start + this.duration;
    this.range[1] = this.getTimeline().convertTimeToPos(end);
    this.timeRange[1] = this.timeRange[0] + this.context.duration;

    return this.setFrames().then(() => {
      return this._make();
    });
  }

  setFrames() {
    this.frameViews = [];
    this.labels = [];

    return new Promise((resolve) => {
      this._newPolygon(() => {
        resolve();
      });
    });
  }

  _newRectOption() {
    const height = this.boxHeight;
    const width = this.space * this.getDuration();
    const options = {
      // type: 'rect',
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      stroke: '#ffffff',
      fill: '#898989',
      backgroundColor: '#585858',
      strokeWidth: 0,
      originX: 'left',
      fontSize: '14',
    };
    return options;
  }

  _newPolygon(callback) {
    // const { section } = this.context;
    const height = this.boxHeight;
    const width = this.space * this.getDuration();
    const options = {
      // type: 'rect',
      left: 0,
      top: 0,
      width,
      height,
      hoverCursor: 'default',
      selectable: false,
      stroke: '#ffffff',
      fill: '#a9a9a9',
      backgroundColor: '#585858',
      strokeWidth: 0,
      originX: 'left',
      fontSize: '14',
    };
    // const polygon = new fabric.Polygon(this.points, options);
    const rect = new fabric.Rect(this._newRectOption());
    rect.set({ fill: 'transparent' });
    const polygon = new fabric.Textbox('', options);
    this.frameViews.push(rect);
    this.frameViews.push(polygon);
    this.updateText();
    callback();
  }

  updateText() {
    let txt;
    const [rect, textBox] = this.frameViews;
    // const textBox = this.frameViews[1];
    if (textBox) {
      const tb = textBox;
      const { text } = this.context;
      txt = text;
      if (txt.length > 5) {
        txt = txt.substring(0, 5);
      }
      tb.text = txt;
      // const lineHeight = tb.calcTextHeight();
      const lineWidth = tb.calcTextWidth();
      if (lineWidth > rect.width) {
        // const scalex = rect.width / lineWidth;
        // tb.scaleX = scalex;
      }
      this.getCanvas().renderAll();
    }
  }

  _make() {
    const width = this.space * this.getDuration();
    const group = this.createGroup(width);

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

  getDuration() {
    return this.timeRange[1] - this.timeRange[0];
  }

  updateRect() {
    const width = this.space * this.getDuration();
    const [rect, textBox] = this.frameViews;
    rect.set({ width });
    textBox.set({ width });
    // const textBox = this.frameViews[1];
    const lineWidth = textBox.calcTextWidth();
    if (lineWidth > width) {
      // const scalex = width / lineWidth;
      // textBox.scaleX = scalex;
    }
  }

  timeChanged(time) {
    const { trackItem } = this.context;
    const x = this.getTimeline().convertTimeToPos(trackItem.start);
    this.start = trackItem.start;
    const total = trackItem.getDuration();
    if (total !== this.getDuration()) {
      this.timeRange[1] = this.timeRange[0] + total;
      this.updateRect();
      this.getCanvas().remove(this.itemPanel);
      this._make().then(() => {});
    } else {
      this.itemPanel.left = x + time;
      // const { left, top, width, height } = this.itemPanel;
      this.xyRange[0] = this.itemPanel.left;
      this.xyRange[1] = this.itemPanel.left + this.itemPanel.width;
      this.itemPanel.setCoords();
    }
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
    this.track.timeline.fire('track:sceneeffect:dispose', { sceneeffect: this.context });
    // console.log('will set null context.trackItem:', this.context.trackItem);
    this.context.trackItem = null;
  }

  getRect() {
    const { left, top, width, height } = this.itemPanel;

    return { left, top, width, height };
  }

  updateTop(top) {
    if (top !== this.top) {
      this.top = top;
      this.itemPanel.set({ top });
      this.itemPanel.setCoords();
    }
  }

  focus() {
    this.track.active(this);
    this.track.timeline.fire('slip:sceneeffect:selected', { item: this });
  }

  blur() {
    this.track.timeline.fire('slip:sceneeffect:unselected', { item: this });
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
        self.focus();
        // self.track.timeline.fire('slip:item:selected', { item: self, isLast: false });
      },
      deselected() {
        self._isSelected = false;
        self._shapeObj = null;
        self.blur();
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

export default BackCanvasItem;

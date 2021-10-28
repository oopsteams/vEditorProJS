import snippet from 'tui-code-snippet';
import fabric from 'fabric';

import Cropper from '@/component/cropper';
import Text from '@/component/text';
import Icon from '@/component/icon';
import Shape from '@/component/shape';

import CropperDrawingMode from '@/drawingMode/cropper';
import ShapeDrawingMode from '@/drawingMode/shape';
import TextDrawingMode from '@/drawingMode/text';
import IconDrawingMode from '@/drawingMode/icon';

import { getProperties, includes, isShape, Promise, cssPrefix } from '@/util';
import {
  componentNames as components,
  eventNames as events,
  drawingModes,
  fObjectOptions,
} from '@/consts';

const { extend, stamp, isArray, isString, forEachArray, forEachOwnProperties, CustomEvents } =
  snippet;
const DEFAULT_CSS_MAX_WIDTH = 1000;
const DEFAULT_CSS_MAX_HEIGHT = 800;
const EXTRA_PX_FOR_PASTE = 10;

const cssOnly = {
  cssOnly: true,
};
const backstoreOnly = {
  backstoreOnly: true,
};

class Graphics {
  constructor(element, { cssMaxWidth, cssMaxHeight } = {}) {
    /**
     * Fabric image instance
     * @type {fabric.Image}
     */
    this.canvasImage = null;

    /**
     * Max width of canvas elements
     * @type {number}
     */
    this.cssMaxWidth = cssMaxWidth || DEFAULT_CSS_MAX_WIDTH;

    /**
     * Max height of canvas elements
     * @type {number}
     */
    this.cssMaxHeight = cssMaxHeight || DEFAULT_CSS_MAX_HEIGHT;

    /**
     * cropper Selection Style
     * @type {Object}
     */
    this.cropSelectionStyle = {};

    /**
     * target fabric object for copy paste feature
     * @type {fabric.Object}
     * @private
     */
    this.targetObjectForCopyPaste = null;

    /**
     * Image name
     * @type {string}
     */
    this.imageName = '';

    /**
     * Object Map
     * @type {Object}
     * @private
     */
    this._objects = {};

    /**
     * Fabric-Canvas instance
     * @type {fabric.Canvas}
     * @private
     */
    this._canvas = null;

    /**
     * Drawing mode
     * @type {string}
     * @private
     */
    this._drawingMode = drawingModes.NORMAL;

    /**
     * DrawingMode map
     * @type {Object.<string, DrawingMode>}
     * @private
     */
    this._drawingModeMap = {};

    /**
     * Component map
     * @type {Object.<string, Component>}
     * @private
     */
    this._componentMap = {};

    /**
     * fabric event handlers
     * @type {Object.<string, function>}
     * @private
     */
    this._handler = {
      onMouseDown: this._onMouseDown.bind(this),
      onMouseUp: this._onMouseUp.bind(this),
      onMouseMove: this._onMouseMove.bind(this),
      onObjectAdded: this._onObjectAdded.bind(this),
      onObjectRemoved: this._onObjectRemoved.bind(this),
      onObjectMoved: this._onObjectMoved.bind(this),
      onObjectScaled: this._onObjectScaled.bind(this),
      onObjectModified: this._onObjectModified.bind(this),
      onObjectRotated: this._onObjectRotated.bind(this),
      onObjectSelected: this._onObjectSelected.bind(this),
      onPathCreated: this._onPathCreated.bind(this),
      onSelectionCleared: this._onSelectionCleared.bind(this),
      onSelectionCreated: this._onSelectionCreated.bind(this),
      onBeforeRender: this._onBeforeRender.bind(this),
    };
    // console.log(`graphics cssMaxWidth:${cssMaxWidth}, cssMaxHeight:${cssMaxHeight}`);
    this._setObjectCachingToFalse();
    this._setCanvasElement(element);
    this._createDrawingModeInstances();
    this._createComponents();
    this._attachCanvasEvents();
    // this._attachZoomEvents();
  }

  _setObjectCachingToFalse() {
    fabric.Object.prototype.objectCaching = false;
  }

  _setCanvasElement(element) {
    let selectedElement;
    let canvasElement;

    if (element.nodeType) {
      selectedElement = element;
    } else {
      selectedElement = document.querySelector(element);
    }

    if (selectedElement.nodeName.toUpperCase() !== 'CANVAS') {
      canvasElement = document.createElement('canvas');
      selectedElement.appendChild(canvasElement);
    }

    this._canvas = new fabric.Canvas(canvasElement, {
      containerClass: `${cssPrefix}-canvas-container`,
      enableRetinaScaling: false,
    });
  }

  createStaticCanvas() {
    const staticCanvas = new fabric.StaticCanvas();

    staticCanvas.set({
      enableRetinaScaling: false,
    });

    return staticCanvas;
  }

  _createDrawingModeInstances() {
    this._register(this._drawingModeMap, new CropperDrawingMode());
    // this._register(this._drawingModeMap, new FreeDrawingMode());
    // this._register(this._drawingModeMap, new LineDrawingMode());
    this._register(this._drawingModeMap, new ShapeDrawingMode());
    this._register(this._drawingModeMap, new TextDrawingMode());
    this._register(this._drawingModeMap, new IconDrawingMode());
    // this._register(this._drawingModeMap, new ZoomDrawingMode());
  }

  _createComponents() {
    // this._register(this._componentMap, new ImageLoader(this));
    this._register(this._componentMap, new Cropper(this));
    // this._register(this._componentMap, new Flip(this));
    // this._register(this._componentMap, new Rotation(this));
    // this._register(this._componentMap, new FreeDrawing(this));
    // this._register(this._componentMap, new Line(this));
    this._register(this._componentMap, new Text(this));
    this._register(this._componentMap, new Icon(this));
    // this._register(this._componentMap, new Filter(this));
    this._register(this._componentMap, new Shape(this));
    // this._register(this._componentMap, new Zoom(this));
  }

  _attachCanvasEvents() {
    const canvas = this._canvas;
    const handler = this._handler;
    canvas.on({
      'mouse:down': handler.onMouseDown,
      'object:added': handler.onObjectAdded,
      'object:removed': handler.onObjectRemoved,
      'object:moving': handler.onObjectMoved,
      'object:scaling': handler.onObjectScaled,
      'object:modified': handler.onObjectModified,
      'object:rotating': handler.onObjectRotated,
      'path:created': handler.onPathCreated,
      'selection:cleared': handler.onSelectionCleared,
      'selection:created': handler.onSelectionCreated,
      'selection:updated': handler.onObjectSelected,
      'before:render': handler.onBeforeRender,
    });
  }

  _addFabricObject(obj) {
    const id = stamp(obj);
    this._objects[id] = obj;

    return id;
  }

  _removeFabricObject(id) {
    delete this._objects[id];
  }

  createObjectProperties(obj) {
    const predefinedKeys = [
      'left',
      'top',
      'width',
      'height',
      'fill',
      'stroke',
      'strokeWidth',
      'opacity',
      'angle',
    ];
    const props = {
      id: stamp(obj),
      type: obj.type,
    };

    extend(props, getProperties(obj, predefinedKeys));

    if (includes(['i-text', 'text'], obj.type)) {
      extend(props, this._createTextProperties(obj, props));
    } else if (includes(['rect', 'triangle', 'circle', 'polygon'], obj.type)) {
      const shapeComp = this.getComponent(components.SHAPE);
      extend(props, {
        fill: shapeComp.makeFillPropertyForUserEvent(obj),
      });
    }

    return props;
  }

  _createTextProperties(obj) {
    const predefinedKeys = [
      'text',
      'fontFamily',
      'fontSize',
      'fontStyle',
      'textAlign',
      'textDecoration',
      'fontWeight',
    ];
    const props = {};
    extend(props, getProperties(obj, predefinedKeys));

    return props;
  }

  _lazyFire(eventName, paramsMaker, target) {
    const existEventDelegation = target && target.canvasEventDelegation;
    const delegationState = existEventDelegation ? target.canvasEventDelegation(eventName) : 'none';

    if (delegationState === 'unregistered') {
      target.canvasEventRegister(eventName, (object) => {
        this.fire(eventName, paramsMaker(object));
      });
    }

    if (delegationState === 'none') {
      this.fire(eventName, paramsMaker(target));
    }
  }

  isReadyRemoveObject() {
    const activeObject = this.getActiveObject();

    return activeObject && !activeObject.isEditing;
  }

  getActiveObject() {
    return this._canvas._activeObject;
  }

  getActiveObjects() {
    const activeObject = this._canvas._activeObject;

    return activeObject && activeObject.type === 'activeSelection' ? activeObject : null;
  }

  getActiveSelectionFromObjects(objects) {
    const canvas = this.getCanvas();

    return new fabric.ActiveSelection(objects, { canvas });
  }

  getActiveObjectIdForRemove() {
    const activeObject = this.getActiveObject();
    const { type, left, top } = activeObject;
    const isSelection = type === 'activeSelection';

    if (isSelection) {
      const group = new fabric.Group([...activeObject.getObjects()], {
        left,
        top,
      });

      return this._addFabricObject(group);
    }

    return this.getObjectId(activeObject);
  }

  setActiveObject(target) {
    this._canvas.setActiveObject(target);
  }

  setCropSelectionStyle(style) {
    this.cropSelectionStyle = style;
  }

  getComponent(name) {
    return this._componentMap[name];
  }

  getDrawingMode() {
    return this._drawingMode;
  }

  _register(map, module) {
    map[module.getName()] = module;
  }

  _isSameDrawingMode(mode) {
    return this.getDrawingMode() === mode;
  }

  _getDrawingModeInstance(modeName) {
    return this._drawingModeMap[modeName];
  }

  stopDrawingMode() {
    if (this._isSameDrawingMode(drawingModes.NORMAL)) {
      return;
    }

    const drawingModeInstance = this._getDrawingModeInstance(this.getDrawingMode());
    if (drawingModeInstance && drawingModeInstance.end) {
      drawingModeInstance.end(this);
    }
    this._drawingMode = drawingModes.NORMAL;
  }

  startDrawingMode(mode, option) {
    if (this._isSameDrawingMode(mode)) {
      return true;
    }

    // If the current mode is not 'NORMAL', 'stopDrawingMode()' will be called first.
    this.stopDrawingMode();

    const drawingModeInstance = this._getDrawingModeInstance(mode);
    if (drawingModeInstance && drawingModeInstance.start) {
      drawingModeInstance.start(this, option);

      this._drawingMode = mode;
    }

    return !!drawingModeInstance;
  }

  zoom({ x, y }, zoomLevel) {
    const zoom = this.getComponent(components.ZOOM);

    zoom.zoom({ x, y }, zoomLevel);
  }

  endZoomInMode() {
    const zoom = this.getComponent(components.ZOOM);

    zoom.endZoomInMode();
  }

  zoomOut() {
    const zoom = this.getComponent(components.ZOOM);

    zoom.zoomOut();
  }

  getZoomMode() {
    const zoom = this.getComponent(components.ZOOM);

    return zoom.mode;
  }

  startHandMode() {
    const zoom = this.getComponent(components.ZOOM);

    zoom.startHandMode();
  }

  endHandMode() {
    const zoom = this.getComponent(components.ZOOM);

    zoom.endHandMode();
  }

  resetZoom() {
    const zoom = this.getComponent(components.ZOOM);

    zoom.resetZoom();
  }

  toDataURL(options) {
    const cropper = this.getComponent(components.CROPPER);
    cropper.changeVisibility(false);

    const dataUrl = this._canvas && this._canvas.toDataURL(options);
    cropper.changeVisibility(true);

    return dataUrl;
  }

  setCanvasImage(name, canvasImage) {
    if (canvasImage) {
      stamp(canvasImage);
    }
    this.imageName = name;
    this.canvasImage = canvasImage;
  }

  setCssMaxDimension(maxDimension) {
    this.cssMaxWidth = maxDimension.width || this.cssMaxWidth;
    this.cssMaxHeight = maxDimension.height || this.cssMaxHeight;
  }

  _calcMaxDimension(width, height) {
    const wScaleFactor = this.cssMaxWidth / width;
    const hScaleFactor = this.cssMaxHeight / height;
    let cssMaxWidth = Math.min(width, this.cssMaxWidth);
    let cssMaxHeight = Math.min(height, this.cssMaxHeight);

    if (wScaleFactor < 1 && wScaleFactor < hScaleFactor) {
      cssMaxWidth = width * wScaleFactor;
      cssMaxHeight = height * wScaleFactor;
    } else if (hScaleFactor < 1 && hScaleFactor < wScaleFactor) {
      cssMaxWidth = width * hScaleFactor;
      cssMaxHeight = height * hScaleFactor;
    }

    return {
      width: Math.floor(cssMaxWidth),
      height: Math.floor(cssMaxHeight),
    };
  }

  setCanvasCssDimension(dimension) {
    this._canvas.setDimensions(dimension, cssOnly);
  }

  setCanvasBackstoreDimension(dimension) {
    this._canvas.setDimensions(dimension, backstoreOnly);
  }

  adjustCanvasDimension() {
    const canvasImage = this.canvasImage.scale(1);
    const { width, height } = canvasImage.getBoundingRect();
    const maxDimension = this._calcMaxDimension(width, height);

    this.setCanvasCssDimension({
      width: '100%',
      height: '100%', // Set height '' for IE9
      'max-width': `${maxDimension.width}px`,
      'max-height': `${maxDimension.height}px`,
    });
    console.log(`adjustCanvasDimension in.width:${width},height:${height}`);
    this.setCanvasBackstoreDimension({
      width,
      height,
    });
    this._canvas.centerObject(canvasImage);
  }

  setImageProperties(setting, withRendering) {
    const { canvasImage } = this;

    if (!canvasImage) {
      return;
    }

    canvasImage.set(setting).setCoords();
    if (withRendering) {
      this._canvas.renderAll();
    }
  }

  getCanvasElement() {
    return this._canvas.getElement();
  }

  getCanvas() {
    return this._canvas;
  }

  getCanvasImage() {
    return this.canvasImage;
  }

  getImageName() {
    return this.imageName;
  }

  addImageObject(imgUrl) {
    const callback = this._callbackAfterLoadingImageObject.bind(this);

    return new Promise((resolve) => {
      fabric.Image.fromURL(
        imgUrl,
        (image) => {
          callback(image);
          resolve(this.createObjectProperties(image));
        },
        {
          crossOrigin: 'Anonymous',
        }
      );
    });
  }

  getCenter() {
    return this._canvas.getCenter();
  }

  getCropzoneRect() {
    return this.getComponent(components.CROPPER).getCropzoneRect();
  }

  setCropzoneRect(mode) {
    this.getComponent(components.CROPPER).setCropzoneRect(mode);
  }

  getCroppedImageData(cropRect) {
    return this.getComponent(components.CROPPER).getCroppedImageData(cropRect);
  }

  setBrush(option) {
    const drawingMode = this._drawingMode;
    let compName = components.FREE_DRAWING;

    if (drawingMode === drawingModes.LINE_DRAWING) {
      compName = components.LINE;
    }

    this.getComponent(compName).setBrush(option);
  }

  setDrawingShape(type, options) {
    this.getComponent(components.SHAPE).setStates(type, options);
  }

  setIconStyle(type, iconColor) {
    this.getComponent(components.ICON).setStates(type, iconColor);
  }

  registerPaths(pathInfos) {
    this.getComponent(components.ICON).registerPaths(pathInfos);
  }

  changeCursor(cursorType) {
    const canvas = this.getCanvas();
    canvas.defaultCursor = cursorType;
    canvas.renderAll();
  }

  hasFilter(type) {
    return this.getComponent(components.FILTER).hasFilter(type);
  }

  setSelectionStyle(styles) {
    extend(fObjectOptions.SELECTION_STYLE, styles);
  }

  setObjectProperties(id, props) {
    const object = this.getObject(id);
    const clone = extend({}, props);

    object.set(clone);

    object.setCoords();

    this.getCanvas().renderAll();

    return clone;
  }

  getObjectProperties(id, keys) {
    const object = this.getObject(id);
    const props = {};

    if (isString(keys)) {
      props[keys] = object[keys];
    } else if (isArray(keys)) {
      forEachArray(keys, (value) => {
        props[value] = object[value];
      });
    } else {
      forEachOwnProperties(keys, (value, key) => {
        props[key] = object[key];
      });
    }

    return props;
  }

  getObjectPosition(id, originX, originY) {
    const targetObj = this.getObject(id);
    if (!targetObj) {
      return null;
    }

    return targetObj.getPointByOrigin(originX, originY);
  }

  setObjectPosition(id, posInfo) {
    const targetObj = this.getObject(id);
    const { x, y, originX, originY } = posInfo;
    if (!targetObj) {
      return false;
    }

    const targetOrigin = targetObj.getPointByOrigin(originX, originY);
    const centerOrigin = targetObj.getPointByOrigin('center', 'center');
    const diffX = centerOrigin.x - targetOrigin.x;
    const diffY = centerOrigin.y - targetOrigin.y;

    targetObj.set({
      left: x + diffX,
      top: y + diffY,
    });

    targetObj.setCoords();

    return true;
  }

  getCanvasSize() {
    const image = this.getCanvasImage();

    return {
      width: image ? image.width : 0,
      height: image ? image.height : 0,
    };
  }

  deactivateAll() {
    this._canvas.discardActiveObject();

    return this;
  }

  renderAll() {
    this._canvas.renderAll();

    return this;
  }

  add(objects) {
    let theArgs = [];
    if (isArray(objects)) {
      theArgs = objects;
    } else {
      theArgs.push(objects);
    }

    this._canvas.add(...theArgs);
  }

  discardSelection() {
    this._canvas.discardActiveObject();
    this._canvas.renderAll();
  }

  changeSelectableAll(selectable) {
    this._canvas.forEachObject((obj) => {
      obj.selectable = selectable;
      obj.hoverCursor = selectable ? 'move' : 'crosshair';
    });
  }

  /* All Event Handlers */
  _onMouseDown(fEvent) {
    const { e: event } = fEvent;
    const originPointer = this._canvas.getPointer(event);
    this._canvas.on({
      'mouse:up': this._handler.onMouseUp,
      'mouse:move': this._handler.onMouseMove,
    });
    // console.log('mouse down:', fEvent);
    this.fire(events.MOUSE_DOWN, event, originPointer);
  }

  _onMouseUp(fEvent) {
    const { e: event } = fEvent;
    const originPointer = this._canvas.getPointer(event);
    // console.log('mouse up:', fEvent);
    this._canvas.off({
      'mouse:up': this._handler.onMouseUp,
      'mouse:move': this._handler.onMouseMove,
    });
    this.fire(events.MOUSE_UP, event, originPointer);
  }

  _onMouseMove(fEvent) {
    const { e: event } = fEvent;
    const originPointer = this._canvas.getPointer(event);
    this.fire(events.MOUSE_MOVE, event, originPointer);
  }

  _onObjectAdded(fEvent) {
    const obj = fEvent.target;
    if (obj.isType('cropzone')) {
      return;
    }

    this._addFabricObject(obj);
  }

  _onObjectRemoved(fEvent) {
    const obj = fEvent.target;

    this._removeFabricObject(stamp(obj));
  }

  _onObjectMoved(fEvent) {
    this._lazyFire(
      events.OBJECT_MOVED,
      (object) => this.createObjectProperties(object),
      fEvent.target
    );
  }

  _onObjectScaled(fEvent) {
    this._lazyFire((object) => this.createObjectProperties(object), fEvent.target);
  }

  _onObjectModified(fEvent) {
    const { target } = fEvent;
    if (target.type === 'activeSelection') {
      const items = target.getObjects();

      items.forEach((item) => item.fire('modifiedInGroup', target));
    }

    this.fire(events.OBJECT_MODIFIED, target, this.getObjectId(target));
  }

  _onObjectRotated(fEvent) {
    this._lazyFire(
      events.OBJECT_ROTATED,
      (object) => this.createObjectProperties(object),
      fEvent.target
    );
  }

  _onObjectSelected(fEvent) {
    const { target } = fEvent;
    const params = this.createObjectProperties(target);

    this.fire(events.OBJECT_ACTIVATED, params);
  }

  _onPathCreated(obj) {
    const { x: left, y: top } = obj.path.getCenterPoint();
    obj.path.set(
      extend(
        {
          left,
          top,
        },
        fObjectOptions.SELECTION_STYLE
      )
    );

    const params = this.createObjectProperties(obj.path);

    this.fire(events.ADD_OBJECT, params);
  }

  _onSelectionCleared() {
    this.fire(events.SELECTION_CLEARED);
  }

  _onSelectionCreated(fEvent) {
    const { target } = fEvent;
    const params = this.createObjectProperties(target);
    // console.log('trigger _onSelectionCreated target:', fEvent.target);
    this.fire(events.OBJECT_ACTIVATED, params);
    this.fire(events.SELECTION_CREATED, fEvent.target);
  }

  _onBeforeRender(fEvent) {
    this.fire(events.BEFORE_RENDER, fEvent);
  }
  /* Event End */

  resetTargetObjectForCopyPaste() {
    const activeObject = this.getActiveObject();

    if (activeObject) {
      this.targetObjectForCopyPaste = activeObject;
    }
  }

  _callbackAfterLoadingImageObject(obj) {
    const centerPos = this.getCanvasImage().getCenterPoint();

    obj.set(fObjectOptions.SELECTION_STYLE);
    obj.set({
      left: centerPos.x,
      top: centerPos.y,
      crossOrigin: 'Anonymous',
    });

    this.getCanvas().add(obj).setActiveObject(obj);
  }

  pasteObject() {
    if (!this.targetObjectForCopyPaste) {
      return Promise.resolve([]);
    }

    const targetObject = this.targetObjectForCopyPaste;
    const isGroupSelect = targetObject.type === 'activeSelection';
    const targetObjects = isGroupSelect ? targetObject.getObjects() : [targetObject];
    let newTargetObject = null;

    this.discardSelection();

    return this._cloneObject(targetObjects).then((addedObjects) => {
      if (addedObjects.length > 1) {
        newTargetObject = this.getActiveSelectionFromObjects(addedObjects);
      } else {
        [newTargetObject] = addedObjects;
      }
      this.targetObjectForCopyPaste = newTargetObject;
      this.setActiveObject(newTargetObject);
    });
  }

  /**
   * Clone object
   * @param {fabric.Object} targetObjects - fabric object
   * @returns {Promise}
   * @private
   */
  _cloneObject(targetObjects) {
    const addedObjects = snippet.map(targetObjects, (targetObject) =>
      this._cloneObjectItem(targetObject)
    );

    return Promise.all(addedObjects);
  }

  /**
   * Clone object one item
   * @param {fabric.Object} targetObject - fabric object
   * @returns {Promise}
   * @private
   */
  _cloneObjectItem(targetObject) {
    return this._copyFabricObjectForPaste(targetObject).then((clonedObject) => {
      const objectProperties = this.createObjectProperties(clonedObject);
      this.add(clonedObject);

      this.fire(events.ADD_OBJECT, objectProperties);

      return clonedObject;
    });
  }

  /**
   * Copy fabric object with Changed position for copy and paste
   * @param {fabric.Object} targetObject - fabric object
   * @returns {Promise}
   * @private
   */
  _copyFabricObjectForPaste(targetObject) {
    const addExtraPx = (value, isReverse) =>
      isReverse ? value - EXTRA_PX_FOR_PASTE : value + EXTRA_PX_FOR_PASTE;

    return this._copyFabricObject(targetObject).then((clonedObject) => {
      const { left, top, width, height } = clonedObject;
      const { width: canvasWidth, height: canvasHeight } = this.getCanvasSize();
      const rightEdge = left + width / 2;
      const bottomEdge = top + height / 2;

      clonedObject.set(
        snippet.extend(
          {
            left: addExtraPx(left, rightEdge + EXTRA_PX_FOR_PASTE > canvasWidth),
            top: addExtraPx(top, bottomEdge + EXTRA_PX_FOR_PASTE > canvasHeight),
          },
          fObjectOptions.SELECTION_STYLE
        )
      );

      return clonedObject;
    });
  }

  /**
   * Copy fabric object
   * @param {fabric.Object} targetObject - fabric object
   * @returns {Promise}
   * @private
   */
  _copyFabricObject(targetObject) {
    return new Promise((resolve) => {
      targetObject.clone((cloned) => {
        const shapeComp = this.getComponent(components.SHAPE);
        if (isShape(cloned)) {
          shapeComp.processForCopiedObject(cloned, targetObject);
        }

        resolve(cloned);
      });
    });
  }
}

CustomEvents.mixin(Graphics);

export default Graphics;

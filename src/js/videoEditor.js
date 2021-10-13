import snippet from 'tui-code-snippet';
import Invoker from '@/invoker';
import UI from '@/ui';
import action from '@/action';
import commandFactory from '@/factory/command';
import Graphics from '@/graphics';
import { makeSelectionUndoData, makeSelectionUndoDatum } from '@/helper/selectionModifyHelper';
import { Promise, getObjectType } from '@/util';

const { isUndefined, forEach, CustomEvents } = snippet;
// const { CustomEvents } = snippet;

import {
  eventNames as events,
  commandNames as commands,
  keyCodes,
  rejectMessages,
  OBJ_TYPE,
} from '@/consts';

const {
  MOUSE_DOWN,
  OBJECT_MOVED,
  OBJECT_SCALED,
  OBJECT_ACTIVATED,
  OBJECT_ROTATED,
  OBJECT_ADDED,
  OBJECT_MODIFIED,
  ADD_TEXT,
  ADD_OBJECT,
  TEXT_EDITING,
  TEXT_CHANGED,
  ICON_CREATE_RESIZE,
  ICON_CREATE_END,
  SELECTION_CLEARED,
  SELECTION_CREATED,
  ADD_OBJECT_AFTER,
  BEFORE_RENDER,
} = events;

class VideoEditor {
  constructor(wrapper, options) {
    options = snippet.extend(
      {
        includeUI: true,
        usageStatistics: true,
      },
      options
    );

    this.mode = null;

    this.activeObjectId = null;

    if (options.includeUI) {
      const UIOption = options.includeUI;
      UIOption.usageStatistics = options.usageStatistics;

      this.ui = new UI(wrapper, UIOption, this.getActions());
      options = this.ui.setUiDefaultSelectionStyle(options);
    }
    this._invoker = new Invoker();
    const gOptions = snippet.extend(
      {
        cssMaxWidth: options.cssMaxWidth,
        cssMaxHeight: options.cssMaxHeight,
      },
      this.mergeEditorSize({ width: options.cssMaxWidth, height: options.cssMaxHeight })
    );

    this._graphics = new Graphics(this.ui ? this.ui.getEditorArea() : wrapper, gOptions);
    this._handlers = {
      keydown: this._onKeyDown.bind(this),
      mousedown: this._onMouseDown.bind(this),
      objectActivated: this._onObjectActivated.bind(this),
      objectMoved: this._onObjectMoved.bind(this),
      objectScaled: this._onObjectScaled.bind(this),
      objectRotated: this._onObjectRotated.bind(this),
      objectAdded: this._onObjectAdded.bind(this),
      objectModified: this._onObjectModified.bind(this),
      createdPath: this._onCreatedPath,
      addText: this._onAddText.bind(this),
      addObject: this._onAddObject.bind(this),
      textEditing: this._onTextEditing.bind(this),
      textChanged: this._onTextChanged.bind(this),
      iconCreateResize: this._onIconCreateResize.bind(this),
      iconCreateEnd: this._onIconCreateEnd.bind(this),
      selectionCleared: this._selectionCleared.bind(this),
      selectionCreated: this._selectionCreated.bind(this),
      onBeforeRender: this._onBeforeRender.bind(this),
    };

    this._attachInvokerEvents();
    this._attachGraphicsEvents();
    this._attachDomEvents();
    this._setSelectionStyle(options.selectionStyle, {
      applyCropSelectionStyle: options.applyCropSelectionStyle,
      applyGroupSelectionStyle: options.applyGroupSelectionStyle,
    });

    if (this.ui) {
      this.ui.initCanvas();
      // this.setReAction();
      // this._attachColorPickerInputBoxEvents();
    }
    fabric.enableGLFiltering = false;
  }

  getDatasource() {
    return this.ui.datasource;
  }

  getTimeline() {
    return this.ui.timeLine;
  }

  mergeEditorSize(options) {
    const editorRect = {};
    const _rect = this.ui.getEditorMaxRect();
    console.log('mergeEditorSize _rect:', _rect);
    if (_rect) {
      editorRect.cssMaxWidth = options.width;
      editorRect.cssMaxHeight = options.height;
      const aspect = options.height / options.width;
      const rectAspect = _rect.height / _rect.width;
      console.log('mergeEditorSize aspect:', aspect, ',rectAspect:', rectAspect);
      if (aspect >= rectAspect) {
        if (options.height > _rect.height) {
          editorRect.cssMaxHeight = _rect.height;
          editorRect.cssMaxWidth = _rect.height / aspect;
        }
      } else if (aspect < rectAspect) {
        if (options.width > _rect.width) {
          editorRect.cssMaxWidth = _rect.width;
          editorRect.cssMaxHeight = _rect.width * aspect;
        }
      }
      editorRect.cssMaxWidth = Math.floor(editorRect.cssMaxWidth);
      editorRect.cssMaxHeight = Math.floor(editorRect.cssMaxHeight);
    }

    return editorRect;
  }

  deactivateAll() {
    this._graphics.deactivateAll();
    this._graphics.renderAll();
  }

  changeSelectableAll(selectable) {
    this._graphics.changeSelectableAll(selectable);
  }

  discardSelection() {
    this._graphics.discardSelection();
  }

  stopDrawingMode() {
    this._graphics.stopDrawingMode();
  }

  startDrawingMode(mode, option) {
    return this._graphics.startDrawingMode(mode, option);
  }

  removeActiveObject() {
    const activeObjectId = this._graphics.getActiveObjectIdForRemove();

    this.removeObject(activeObjectId);
  }

  getDrawingMode() {
    return this._graphics.getDrawingMode();
  }

  executeSilent(commandName, ...args) {
    // Inject an Graphics instance as first parameter
    const theArgs = [this._graphics].concat(args);

    return this._invoker.executeSilent(commandName, ...theArgs);
  }

  execute(commandName, ...args) {
    // Inject an Graphics instance as first parameter
    const theArgs = [this._graphics].concat(args);

    return this._invoker.execute(commandName, ...theArgs);
  }

  clearObjects() {
    return this.execute(commands.CLEAR_OBJECTS);
  }

  zoom({ x, y, zoomLevel }) {
    this._graphics.zoom({ x, y }, zoomLevel);
  }

  resetZoom() {
    this._graphics.resetZoom();
  }

  loadImageFromFile(imgFile, imageName) {
    if (!imgFile) {
      return Promise.reject(rejectMessages.invalidParameters);
    }

    const imgUrl = URL.createObjectURL(imgFile);
    imageName = imageName || imgFile.name;

    return this.loadImageFromURL(imgUrl, imageName).then((value) => {
      URL.revokeObjectURL(imgFile);

      return value;
    });
  }

  loadImageFromURL(url, imageName) {
    if (!imageName || !url) {
      return Promise.reject(rejectMessages.invalidParameters);
    }

    return this.execute(commands.LOAD_IMAGE, imageName, url);
  }

  addImageObject(imgUrl) {
    if (!imgUrl) {
      return Promise.reject(rejectMessages.invalidParameters);
    }

    return this.execute(commands.ADD_IMAGE_OBJECT, imgUrl);
  }

  crop(rect) {
    const data = this._graphics.getCroppedImageData(rect);
    if (!data) {
      return Promise.reject(rejectMessages.invalidParameters);
    }

    return this.loadImageFromURL(data.url, data.imageName);
  }

  getCropzoneRect() {
    return this._graphics.getCropzoneRect();
  }

  setCropzoneRect(mode) {
    this._graphics.setCropzoneRect(mode);
  }

  _rotate(type, angle, isSilent) {
    let result = null;

    if (isSilent) {
      result = this.executeSilent(commands.ROTATE_IMAGE, type, angle);
    } else {
      result = this.execute(commands.ROTATE_IMAGE, type, angle);
    }

    return result;
  }

  rotate(angle, isSilent) {
    return this._rotate('rotate', angle, isSilent);
  }

  setAngle(angle, isSilent) {
    return this._rotate('setAngle', angle, isSilent);
  }

  setBrush(option) {
    this._graphics.setBrush(option);
  }

  setDrawingShape(type, options) {
    this._graphics.setDrawingShape(type, options);
  }

  setDrawingIcon(type, iconColor) {
    this._graphics.setIconStyle(type, iconColor);
  }

  addShape(type, options) {
    options = options || {};

    this._setPositions(options);

    return this.execute(commands.ADD_SHAPE, type, options);
  }

  addPolygonImg(type) {
    const shape = this._graphics.getComponent(type);
    if (shape && shape.addPolygonImg) {
      shape.addPolygonImg();
    }
  }

  addText(text, options) {
    text = text || '';
    options = options || {};

    return this.execute(commands.ADD_TEXT, text, options);
  }

  changeText(id, text) {
    text = text || '';

    return this.execute(commands.CHANGE_TEXT, id, text);
  }

  changeTextStyle(id, styleObj, isSilent) {
    const executeMethodName = isSilent ? 'executeSilent' : 'execute';

    return this[executeMethodName](commands.CHANGE_TEXT_STYLE, id, styleObj);
  }

  addIcon(type, options) {
    options = options || {};

    this._setPositions(options);

    return this.execute(commands.ADD_ICON, type, options);
  }

  changeIconColor(id, color) {
    return this.execute(commands.CHANGE_ICON_COLOR, id, color);
  }

  _selectionCleared() {
    this.fire(SELECTION_CLEARED);
  }

  _selectionCreated(eventTarget) {
    this.fire(SELECTION_CREATED, eventTarget);
  }

  registerIcons(infos) {
    this._graphics.registerPaths(infos);
  }

  changeCursor(cursorType) {
    this._graphics.changeCursor(cursorType);
  }

  removeObject(id) {
    const { type } = this._graphics.getObject(id);

    return this.execute(commands.REMOVE_OBJECT, id, getObjectType(type));
  }

  hasFilter(type) {
    return this._graphics.hasFilter(type);
  }

  removeFilter(type) {
    return this.execute(commands.REMOVE_FILTER, type);
  }

  applyFilter(type, options, isSilent) {
    const executeMethodName = isSilent ? 'executeSilent' : 'execute';

    return this[executeMethodName](commands.APPLY_FILTER, type, options);
  }

  toDataURL(options) {
    return this._graphics.toDataURL(options);
  }

  getImageName() {
    return this._graphics.getImageName();
  }

  resizeCanvasDimension(dimension) {
    if (!dimension) {
      return Promise.reject(rejectMessages.invalidParameters);
    }

    return this.execute(commands.RESIZE_CANVAS_DIMENSION, dimension);
  }

  _setPositions(options) {
    const centerPosition = this._graphics.getCenter();

    if (isUndefined(options.left)) {
      options.left = centerPosition.left;
    }

    if (isUndefined(options.top)) {
      options.top = centerPosition.top;
    }
  }

  _setSelectionStyle(selectionStyle, { applyCropSelectionStyle, applyGroupSelectionStyle }) {
    if (selectionStyle) {
      this._graphics.setSelectionStyle(selectionStyle);
    }

    if (applyCropSelectionStyle) {
      this._graphics.setCropSelectionStyle(selectionStyle);
    }

    if (applyGroupSelectionStyle) {
      this.on('selectionCreated', (eventTarget) => {
        if (eventTarget.type === 'activeSelection') {
          eventTarget.set(selectionStyle);
        }
      });
    }
  }

  _attachGraphicsEvents() {
    this._graphics.on({
      [MOUSE_DOWN]: this._handlers.mousedown,
      [OBJECT_MOVED]: this._handlers.objectMoved,
      [OBJECT_SCALED]: this._handlers.objectScaled,
      [OBJECT_ROTATED]: this._handlers.objectRotated,
      [OBJECT_ACTIVATED]: this._handlers.objectActivated,
      [OBJECT_ADDED]: this._handlers.objectAdded,
      [OBJECT_MODIFIED]: this._handlers.objectModified,
      [ADD_TEXT]: this._handlers.addText,
      [ADD_OBJECT]: this._handlers.addObject,
      [TEXT_EDITING]: this._handlers.textEditing,
      [TEXT_CHANGED]: this._handlers.textChanged,
      [ICON_CREATE_RESIZE]: this._handlers.iconCreateResize,
      [ICON_CREATE_END]: this._handlers.iconCreateEnd,
      [SELECTION_CLEARED]: this._handlers.selectionCleared,
      [SELECTION_CREATED]: this._handlers.selectionCreated,
      [BEFORE_RENDER]: this._handlers.onBeforeRender,
    });
  }

  _attachDomEvents() {
    // ImageEditor supports IE 9 higher
    document.addEventListener('keydown', this._handlers.keydown);
  }

  _detachDomEvents() {
    // ImageEditor supports IE 9 higher
    document.removeEventListener('keydown', this._handlers.keydown);
  }

  _attachInvokerEvents() {
    const {
      UNDO_STACK_CHANGED,
      REDO_STACK_CHANGED,
      EXECUTE_COMMAND,
      AFTER_UNDO,
      AFTER_REDO,
      HAND_STARTED,
      HAND_STOPPED,
    } = events;

    /**
     * Undo stack changed event
     * @event ImageEditor#undoStackChanged
     * @param {Number} length - undo stack length
     * @example
     * imageEditor.on('undoStackChanged', function(length) {
     *     console.log(length);
     * });
     */
    this._invoker.on(UNDO_STACK_CHANGED, this.fire.bind(this, UNDO_STACK_CHANGED));
    /**
     * Redo stack changed event
     * @event ImageEditor#redoStackChanged
     * @param {Number} length - redo stack length
     * @example
     * imageEditor.on('redoStackChanged', function(length) {
     *     console.log(length);
     * });
     */
    this._invoker.on(REDO_STACK_CHANGED, this.fire.bind(this, REDO_STACK_CHANGED));

    if (this.ui) {
      const canvas = this._graphics.getCanvas();

      this._invoker.on(EXECUTE_COMMAND, (command) => this.ui.fire(EXECUTE_COMMAND, command));
      this._invoker.on(AFTER_UNDO, (command) => this.ui.fire(AFTER_UNDO, command));
      this._invoker.on(AFTER_REDO, (command) => this.ui.fire(AFTER_REDO, command));

      canvas.on(HAND_STARTED, () => this.ui.fire(HAND_STARTED));
      canvas.on(HAND_STOPPED, () => this.ui.fire(HAND_STOPPED));
    }
  }

  _pushAddObjectCommand(obj) {
    const command = commandFactory.create(commands.ADD_OBJECT, this._graphics, obj);
    this._invoker.pushUndoStack(command);
  }

  _pushModifyObjectCommand(obj) {
    const { type } = obj;
    const props = makeSelectionUndoData(obj, (item) =>
      makeSelectionUndoDatum(this._graphics.getObjectId(item), item, type === 'activeSelection')
    );
    const command = commandFactory.create(commands.CHANGE_SELECTION, this._graphics, props);
    command.execute(this._graphics, props);

    this._invoker.pushUndoStack(command);
  }

  clearUndoStack() {
    this._invoker.clearUndoStack();
  }

  resetDimension(_option) {
    const rect = this.mergeEditorSize(_option);
    if (rect) {
      console.log('_option:', _option, ',rect:', rect);
      const dim = {
        width: '100%',
        height: '100%', // Set height '' for IE9
        'max-width': `${rect.cssMaxWidth}px`,
        'max-height': `${rect.cssMaxHeight}px`,
      };
      this._graphics.setCanvasCssDimension(dim);
      this._graphics.setCanvasBackstoreDimension(_option);
    }

    return rect;
  }

  getCanvas() {
    return this._graphics.getCanvas();
  }

  /* Event Handlers*/
  _onKeyDown(e) {
    const { ctrlKey, keyCode, metaKey } = e;
    const isModifierKey = ctrlKey || metaKey;

    if (isModifierKey) {
      if (keyCode === keyCodes.C) {
        this._graphics.resetTargetObjectForCopyPaste();
      } else if (keyCode === keyCodes.V) {
        this._graphics.pasteObject();
        // this.clearRedoStack();
      } else if (keyCode === keyCodes.Z) {
        // There is no error message on shortcut when it's empty
        // this.undo()['catch'](() => {});
      } else if (keyCode === keyCodes.Y) {
        // There is no error message on shortcut when it's empty
        // this.redo()['catch'](() => {});
      }
    }

    const isDeleteKey = keyCode === keyCodes.BACKSPACE || keyCode === keyCodes.DEL;
    const isRemoveReady = this._graphics.isReadyRemoveObject();

    if (!this.isColorPickerInputBoxEditing && isRemoveReady && isDeleteKey) {
      e.preventDefault();
      this.removeActiveObject();
    }
  }

  _onMouseDown(event, originPointer) {
    this.fire(events.MOUSE_DOWN, event, originPointer);
  }

  _onObjectActivated(props) {
    this.fire(events.OBJECT_ACTIVATED, props);
  }

  _onObjectMoved(props) {
    this.fire(events.OBJECT_MOVED, props);
  }

  _onObjectScaled(props) {
    this.fire(events.OBJECT_SCALED, props);
  }

  _onObjectRotated(props) {
    this.fire(events.OBJECT_ROTATED, props);
  }

  _onTextChanged(target) {
    this.fire(events.TEXT_CHANGED, target);
  }

  _onIconCreateResize(originPointer) {
    this.fire(events.ICON_CREATE_RESIZE, originPointer);
  }

  _onIconCreateEnd(originPointer) {
    this.fire(events.ICON_CREATE_END, originPointer);
  }

  _onTextEditing() {
    this.fire(events.TEXT_EDITING);
  }

  _onAddText(event) {
    this.fire(events.ADD_TEXT, {
      originPosition: event.originPosition,
      clientPosition: event.clientPosition,
    });
  }

  _onAddObject(objectProps) {
    const obj = this._graphics.getObject(objectProps.id);
    this._invoker.fire(events.EXECUTE_COMMAND, getObjectType(obj.type));
    this._pushAddObjectCommand(obj);
  }

  _onObjectAdded(objectProps) {
    this.fire(OBJECT_ADDED, objectProps);
    this.fire(ADD_OBJECT_AFTER, objectProps);
  }

  _onObjectModified(obj) {
    if (obj.type !== OBJ_TYPE.CROPZONE) {
      this._invoker.fire(events.EXECUTE_COMMAND, getObjectType(obj.type));
      this._pushModifyObjectCommand(obj);
    }
  }

  _onBeforeRender(fEvent) {
    this.fire(BEFORE_RENDER, fEvent);
  }
  /* Event End*/

  _attachColorPickerInputBoxEvents() {
    this.ui.on(events.INPUT_BOX_EDITING_STARTED, () => {
      this.isColorPickerInputBoxEditing = true;
    });
    this.ui.on(events.INPUT_BOX_EDITING_STOPPED, () => {
      this.isColorPickerInputBoxEditing = false;
    });
  }

  _detachColorPickerInputBoxEvents() {
    this.ui.off(events.INPUT_BOX_EDITING_STARTED);
    this.ui.off(events.INPUT_BOX_EDITING_STOPPED);
  }

  destroy() {
    this.stopDrawingMode();
    this._detachDomEvents();
    this._graphics.destroy();
    this._graphics = null;

    if (this.ui) {
      this._detachColorPickerInputBoxEvents();
      this.ui.destroy();
    }

    forEach(
      this,
      (value, key) => {
        this[key] = null;
      },
      this
    );
  }
}

action.mixin(VideoEditor);
CustomEvents.mixin(VideoEditor);

export default VideoEditor;

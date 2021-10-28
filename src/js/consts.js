import { keyMirror } from '@/util';

export const eventNames = {
  OBJECT_ACTIVATED: 'objectActivated',
  OBJECT_MOVED: 'objectMoved',
  OBJECT_SCALED: 'objectScaled',
  OBJECT_CREATED: 'objectCreated',
  OBJECT_ROTATED: 'objectRotated',
  OBJECT_ADDED: 'objectAdded',
  OBJECT_MODIFIED: 'objectModified',
  TEXT_EDITING: 'textEditing',
  TEXT_CHANGED: 'textChanged',
  ICON_CREATE_RESIZE: 'iconCreateResize',
  ICON_CREATE_END: 'iconCreateEnd',
  ADD_TEXT: 'addText',
  ADD_OBJECT: 'addObject',
  ADD_OBJECT_AFTER: 'addObjectAfter',
  MOUSE_DOWN: 'mousedown',
  MOUSE_UP: 'mouseup',
  MOUSE_MOVE: 'mousemove',
  // UNDO/REDO Events
  REDO_STACK_CHANGED: 'redoStackChanged',
  UNDO_STACK_CHANGED: 'undoStackChanged',
  SELECTION_CLEARED: 'selectionCleared',
  SELECTION_CREATED: 'selectionCreated',
  EXECUTE_COMMAND: 'executeCommand',
  AFTER_UNDO: 'afterUndo',
  AFTER_REDO: 'afterRedo',
  ZOOM_CHANGED: 'zoomChanged',
  HAND_STARTED: 'handStarted',
  HAND_STOPPED: 'handStopped',
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  INPUT_BOX_EDITING_STARTED: 'inputBoxEditingStarted',
  INPUT_BOX_EDITING_STOPPED: 'inputBoxEditingStopped',
  FOCUS: 'focus',
  BLUR: 'blur',
  BEFORE_RENDER: 'beforeRender',
  TIME_CHANGED: 'timeChanged',
  SYNC_TIME_CHANGED: 'syncTimeChanged',
  PANEL_POS_CHANGED: 'panelPosChanged',
  PANEL_TICKS_CHANGED: 'panelTicksChanged',
};

export const SHAPE_FILL_TYPE = {
  FILTER: 'filter',
  COLOR: 'color',
};

export const SHAPE_TYPE = ['rect', 'circle', 'triangle', 'polygon'];

export const filterType = {
  VINTAGE: 'vintage',
  SEPIA2: 'sepia2',
  REMOVE_COLOR: 'removeColor',
  COLOR_FILTER: 'colorFilter',
  REMOVE_WHITE: 'removeWhite',
  BLEND_COLOR: 'blendColor',
  BLEND: 'blend',
};

export const componentNames = keyMirror(
  'IMAGE_LOADER',
  'CROPPER',
  'FLIP',
  'ROTATION',
  'FREE_DRAWING',
  'LINE',
  'TEXT',
  'ICON',
  'FILTER',
  'SHAPE',
  'ZOOM'
);

export const tlComponentNames = keyMirror('PANEL', 'TRACK');

export const commandNames = {
  CLEAR_OBJECTS: 'clearObjects',
  LOAD_IMAGE: 'loadImage',
  FLIP_IMAGE: 'flip',
  ROTATE_IMAGE: 'rotate',
  ADD_OBJECT: 'addObject',
  REMOVE_OBJECT: 'removeObject',
  APPLY_FILTER: 'applyFilter',
  REMOVE_FILTER: 'removeFilter',
  ADD_ICON: 'addIcon',
  CHANGE_ICON_COLOR: 'changeIconColor',
  ADD_SHAPE: 'addShape',
  CHANGE_SHAPE: 'changeShape',
  ADD_TEXT: 'addText',
  CHANGE_TEXT: 'changeText',
  CHANGE_TEXT_STYLE: 'changeTextStyle',
  ADD_IMAGE_OBJECT: 'addImageObject',
  RESIZE_CANVAS_DIMENSION: 'resizeCanvasDimension',
  SET_OBJECT_PROPERTIES: 'setObjectProperties',
  SET_OBJECT_POSITION: 'setObjectPosition',
  CHANGE_SELECTION: 'changeSelection',
};

export const historyNames = {
  LOAD_IMAGE: 'Load',
  LOAD_MASK_IMAGE: 'Mask',
  ADD_MASK_IMAGE: 'Mask',
  ADD_IMAGE_OBJECT: 'Mask',
  CROP: 'Crop',
  APPLY_FILTER: 'Filter',
  REMOVE_FILTER: 'Filter',
  CHANGE_SHAPE: 'Shape',
  CHANGE_ICON_COLOR: 'Icon',
  ADD_TEXT: 'Text',
  CHANGE_TEXT_STYLE: 'Text',
  REMOVE_OBJECT: 'Delete',
  CLEAR_OBJECTS: 'Delete',
};

export const emptyCropRectValues = {
  LEFT: 0,
  TOP: 0,
  WIDTH: 0.5,
  HEIGHT: 0.5,
};

export const drawingModes = keyMirror(
  'NORMAL',
  'CROPPER',
  'FREE_DRAWING',
  'LINE_DRAWING',
  'TEXT',
  'SHAPE',
  'ICON',
  'ZOOM'
);

export const drawingMenuNames = {
  TEXT: 'text',
  CROP: 'crop',
  SHAPE: 'shape',
  ZOOM: 'zoom',
};

export const zoomModes = {
  DEFAULT: 'normal',
  ZOOM: 'zoom',
  HAND: 'hand',
};

export const keyCodes = {
  Z: 90,
  Y: 89,
  C: 67,
  V: 86,
  SHIFT: 16,
  BACKSPACE: 8,
  DEL: 46,
  ARROW_DOWN: 40,
  ARROW_UP: 38,
  SPACE: 32,
};

export const fObjectOptions = {
  SELECTION_STYLE: {
    borderColor: 'red',
    cornerColor: 'green',
    cornerSize: 10,
    originX: 'center',
    originY: 'center',
    transparentCorners: false,
  },
};

export const rejectMessages = {
  addedObject: 'The object is already added.',
  flip: 'The flipX and flipY setting values are not changed.',
  invalidDrawingMode: 'This operation is not supported in the drawing mode.',
  invalidParameters: 'Invalid parameters.',
  isLock: 'The executing command state is locked.',
  loadImage: 'The background image is empty.',
  loadingImageFailed: 'Invalid image loaded.',
  noActiveObject: 'There is no active object.',
  noObject: 'The object is not in canvas.',
  redo: 'The promise of redo command is reject.',
  rotation: 'The current angle is same the old angle.',
  undo: 'The promise of undo command is reject.',
  unsupportedOperation: 'Unsupported operation.',
  unsupportedType: 'Unsupported object type.',
};

export const selectorNames = {
  COLOR_PICKER_INPUT_BOX: '.tui-colorpicker-palette-hex',
};

export const defaultTextRangeValues = {
  realTimeEvent: true,
  min: 10,
  max: 100,
  value: 50,
};

export const familyMap = {
  'Microsoft_YaHei_Regular.typeface.json': '雅黑',
  'FZShouJinShu-S10S_regular.typeface.json': '瘦金',
  'ZCOOL_XiaoWei_Regular.json': '小魏',
  'ZCOOL_KuaiLe_Regular.json': '欢乐',
  'ZCOOL_QingKe_HuangYou_Regular.json': '幼圆黑',
  'Ma_Shan_Zheng_Regular.json': '软笔',
  'Zhi_Mang_Xing_Regular.json': '行书',
  'Liu_Jian_Mao_Cao_Regular.json': '毛草',
};

export const textDirection = {
  horizontal: '水平',
  vertical: '垂直',
};

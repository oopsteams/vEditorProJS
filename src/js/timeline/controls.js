import fabric from 'fabric';
const { scaleSkewCursorStyleHandler, scalingXOrSkewingY, scaleOrSkewActionName } =
  fabric.controlsUtils;

// function scaleSkewCursorStyleHandler(eventData, control, fabricObject) {
//   if (eventData[fabricObject.canvas.altActionKey]) {
//     return controls.skewCursorStyleHandler(eventData, control, fabricObject);
//   }
//   return controls.scaleCursorStyleHandler(eventData, control, fabricObject);
// }

// function scalingXOrSkewingY(eventData, transform, x, y) {
//   // ok some safety needed here.
//   if (eventData[transform.target.canvas.altActionKey]) {
//     return controls.skewHandlerY(eventData, transform, x, y);
//   }
//   return controls.scalingX(eventData, transform, x, y);
// }

// function scaleOrSkewActionName(eventData, control, fabricObject) {
//   const isAlternative = eventData[fabricObject.canvas.altActionKey];
//   if (control.x === 0) {
//     // then is scaleY or skewX
//     return isAlternative ? 'skewX' : 'scaleY';
//   }
//   if (control.y === 0) {
//     // then is scaleY or skewX
//     return isAlternative ? 'skewY' : 'scaleX';
//   }

//   return '';
// }

export const winControls = {
  ml: new fabric.Control({
    x: -0.5,
    y: 0,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: scalingXOrSkewingY,
    getActionName: scaleOrSkewActionName,
  }),
  mr: new fabric.Control({
    x: 0.5,
    y: 0,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: scalingXOrSkewingY,
    getActionName: scaleOrSkewActionName,
  }),
};

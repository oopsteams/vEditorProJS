import { extend } from 'tui-code-snippet';
// import { isSupportFileApi, base64ToBlob, toInteger, isEmptyCropzone } from '@/util';
import { eventNames, historyNames } from '@/consts';

export default {
  getActions() {
    return {
      main: this._mainAction(),
    };
  },
  _mainAction() {
    const exitCropOnAction = () => {
      if (this.ui.submenu === 'crop') {
        this.stopDrawingMode();
        this.ui.changeMenu('crop');
      }
    };
    return extend(
      {
        initLoadImage: (imagePath, imageName) =>
          this.loadImageFromURL(imagePath, imageName).then((sizeValue) => {
            exitCropOnAction();
            this.ui.initializeImgUrl = imagePath;
            this.ui.resizeEditor({ imageSize: sizeValue });
            this.clearUndoStack();
            this._invoker.fire(eventNames.EXECUTE_COMMAND, historyNames.LOAD_IMAGE);
          }),
      },
      this._commonAction()
    );
  },
  _commonAction() {
    return {
      deactivateAll: this.deactivateAll.bind(this),
      changeSelectableAll: this.changeSelectableAll.bind(this),
      discardSelection: this.discardSelection.bind(this),
      stopDrawingMode: this.stopDrawingMode.bind(this),
    };
  },
  mixin(VideoEditor) {
    extend(VideoEditor.prototype, this);
  },
};

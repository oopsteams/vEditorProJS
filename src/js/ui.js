import snippet from 'tui-code-snippet';
// import { getSelector, assignmentForDestroy, cls, getHistoryTitle, isSilentCommand } from '@/util';
import { getSelector, cls, cssPrefix } from '@/util';

import mainContainer from '@/ui/template/mainContainer';
import controls from './ui/template/controls';
import topMenu from './ui/template/topMenu';
import resultHtml from './ui/template/result';

import Locale from '@/ui/locale/locale';
import Theme from '@/ui/theme/theme';

import Make from '@/ui/make';
import Amake from '@/ui/amake';
import Imitate from '@/ui/imitate';
import Storage from '@/ui/storage';
import TimeLine from '@/timeline/ui/timeline';
import { eventNames } from './consts';
import DataSource from './datasource';

const SUB_UI_COMPONENT = {
  Make,
  Amake,
  Imitate,
  Storage,
};

const { CustomEvents, extend } = snippet;
const CSS_PREFIX = cssPrefix;

const defaultPreviewItem = {
  previewItemWidth: 45,
  previewItemHeight: 34,
};

class Ui {
  constructor(element, options, actions) {
    this.options = this._initializeOption(options);
    this._actions = actions;
    this._locale = new Locale(this.options.locale);
    this.theme = new Theme(this.options.theme);

    this.submenu = false;
    this.imageSize = {};
    this.uiSize = {};

    this.eventHandler = {};
    this._submenuChangeTransection = false;
    this._selectedElement = null;
    this._mainElement = null;
    this._editorElementWrap = null;
    this._editorElement = null;
    this._menuBarElement = null;
    this._subMenuElement = null;

    this.datasource = new DataSource({ context: null }, this);

    this._makeUiElement(element);
    this._setUiSize();
    this._initMenuEvent = false;

    this._makeSubMenu();
    this._attachTimeLineEvent();
    this._makeMainMenuElement('check');
    // this._attachHistoryEvent();
    // this._attachZoomEvent();
    this._attachDatasourceEvent();
  }

  setUiDefaultSelectionStyle(option) {
    return snippet.extend(
      {
        applyCropSelectionStyle: true,
        applyGroupSelectionStyle: true,
        selectionStyle: {
          cornerStyle: 'circle',
          cornerSize: 16,
          cornerColor: '#fff',
          cornerStrokeColor: '#D3D3D3',
          transparentCorners: false,
          lineWidth: 2,
          borderColor: '#fff',
        },
      },
      option
    );
  }

  _initializeOption(options) {
    return extend(
      {
        loadImage: {
          path: '',
          name: '',
        },
        locale: {},
        menuIconPath: '',
        menu: [
          // 'selection',
          'make',
          // 'imitate',
          // 'amake',
          // 'storage',
        ],
        initMenu: '',
        uiSize: {
          width: '100%',
          height: '100%',
        },
        menuBarPosition: 'bottom',
      },
      options
    );
  }

  _makeUiElement(element) {
    let selectedElement;

    window.snippet = snippet;

    if (element.nodeType) {
      selectedElement = element;
    } else {
      selectedElement = document.querySelector(element);
    }
    const selector = getSelector(selectedElement);

    selectedElement.classList.add(`${CSS_PREFIX}-container`);
    selectedElement.innerHTML = mainContainer({
      locale: this._locale,
      biImage: this.theme.getStyle('common.bi'),
      commonStyle: this.theme.getStyle('common'),
      headerStyle: this.theme.getStyle('header'),
      loadButtonStyle: this.theme.getStyle('loadButton'),
      downloadButtonStyle: this.theme.getStyle('downloadButton'),
      uploadButtonStyle: this.theme.getStyle('uploadButton'),
      submenuStyle: this.theme.getStyle('submenu'),
      cStyle: this.theme.getStyle('control'),
      cssPrefix,
    });

    this._selectedElement = selectedElement;
    this._selectedElement.classList.add(this.options.menuBarPosition);

    this._textureLayerElement = this._selectedElement.querySelector(cls('.layer-main-mid'));
    this._layerTopElement = this._selectedElement.querySelector(cls('.header-menu'));
    this._layerTopElement.innerHTML = topMenu({
      locale: this._locale,
      biImage: this.theme.getStyle('common.bi'),
      cStyle: this.theme.getStyle('control'),
      loadButtonStyle: this.theme.getStyle('loadButton'),
      downloadButtonStyle: this.theme.getStyle('downloadButton'),
      uploadButtonStyle: this.theme.getStyle('uploadButton'),
      menuBarPosition: this.options.menuBarPosition,
      cssPrefix,
    });
    this._mainMidLayerElement = this._selectedElement.querySelector(cls('.layer-main-mid'));
    this._controlLayerElement = this._selectedElement.querySelector(cls('.layer-main-left'));
    this._controlLayerElement.innerHTML = controls({
      locale: this._locale,
      biImage: this.theme.getStyle('common.bi'),
      cStyle: this.theme.getStyle('control'),
      menuBarPosition: this.options.menuBarPosition,
      cssPrefix,
    });

    this._mainElement = selector(cls('.layer-main'));
    this._editorElementWrap = selector(cls('.wrap'));
    this._timelineElementWrap = selector(cls('.timeline-wrap'));
    // console.log('ui new ._editorElementWrap:', this._editorElementWrap);
    this._editorElement = selector('.ve-pro');
    this._helpMenuBarElement = selector(cls('.help-menu'));
    this._layerTopMainControl = this._selectedElement.querySelector(cls('.header-btn'));
    this._mainMenuBarElement = this._layerTopMainControl.querySelector(cls('.main-menu'));
    this._menuBarElement = selector(cls('.menu'));
    // this._subMenuElement = selector(cls('.track-menu'));
    this._subMenuElement = selector(cls('.media-controls'));
    this._buttonElements = {
      download: this._selectedElement.querySelectorAll(cls('.download-btn[tag="download"]')),
      load: this._selectedElement.querySelectorAll(cls('.load-btn')),
    };

    // this._addHelpMenus();

    // this._historyMenu = new History(this._buttonElements[HISTORY_MENU], {
    //   locale: this._locale,
    //   makeSvgIcon: this.theme.makeMenSvgIconSet.bind(this.theme),
    // });

    // this._activateZoomMenus();
    const previewItemWidth = this.options.previewItemWidth
      ? this.options.previewItemWidth
      : defaultPreviewItem.previewItemWidth;
    const previewItemHeight = this.options.previewItemHeight
      ? this.options.previewItemHeight
      : defaultPreviewItem.previewItemHeight;

    this.timeLine = new TimeLine(this._timelineElementWrap, {
      locale: this._locale,
      makeSvgIcon: this.theme.makeMenSvgIconSet.bind(this.theme),
      ui: this,
      cssPrefix,
      previewItemWidth,
      previewItemHeight,
    });
  }

  getFootLayerMaxRect() {
    const rect = {};
    const selector = getSelector(this._selectedElement);
    this._footElement = selector(cls('.layer-foot'));
    if (this._footElement) {
      rect.width = this._footElement.clientWidth;
      rect.height = this._footElement.clientHeight;
    }

    return rect;
  }

  _makeSubMenu() {
    const textureAspect = this.options.textureAspect ? this.options.textureAspect : 3 / 2;
    snippet.forEach(this.options.menu, (menuName) => {
      const SubComponentClass =
        SUB_UI_COMPONENT[menuName.replace(/^[a-z]/, ($0) => $0.toUpperCase())];

      // make menu element
      this._makeMenuElement(menuName);

      // menu btn element
      this._buttonElements[menuName] = this._menuBarElement.querySelector(`.tie-btn-${menuName}`);

      this._subMenuElement.ui = this;
      // submenu ui instance
      this[menuName] = new SubComponentClass(this._subMenuElement, {
        locale: this._locale,
        makeSvgIcon: this.theme.makeMenSvgIconSet.bind(this.theme),
        menuBarPosition: this.options.menuBarPosition,
        usageStatistics: this.options.usageStatistics,
        textureLayer: this._textureLayerElement,
        theme: this.theme,
        cssPrefix,
        textureAspect,
        datasource: this.datasource,
        previewItemWidth: this.timeLine.previewItemWidth,
        previewItemHeight: this.timeLine.previewItemHeight,
      });
      this[menuName].ui = this;
    });
  }

  _setUiSize(uiSize = this.options.uiSize) {
    const elementDimension = this._selectedElement.style;
    elementDimension.width = uiSize.width;
    elementDimension.height = uiSize.height;
  }

  _addTooltipAttribute(element, tooltipName) {
    element.setAttribute(
      'tooltip-content',
      this._locale.localize(tooltipName.replace(/^[a-z]/g, ($0) => $0.toUpperCase()))
    );
  }

  _makeMenuElement(menuName, useIconTypes = ['normal', 'active', 'hover'], menuType = 'normal') {
    const btnElement = document.createElement('li');
    const menuItemHtml = this.theme.makeMenSvgIconSet(useIconTypes, menuName);

    this._addTooltipAttribute(btnElement, menuName);
    btnElement.className = `tie-btn-${menuName} ${cls('item')} ${menuType}`;
    btnElement.innerHTML = menuItemHtml;

    if (menuType === 'normal') {
      this._menuBarElement.appendChild(btnElement);
    } else {
      this._helpMenuBarElement.appendChild(btnElement);
    }
  }

  _makeMainMenuElement() {
    /*
    menuName,
    useIconTypes = ['normal', 'active', 'hover'],
    menuType = 'normal'
    */
    this._mainMenuBarElement.innerHTML = resultHtml({
      locale: this._locale,
      makeSvgIcon: this.theme.makeMenSvgIconSet.bind(this.theme),
      cssPrefix,
    });
    this.deleteAllElement = this._mainMenuBarElement.querySelector('li.tie-btn-deleteall');
    // this.deleteAllElement._display = this.deleteAllElement.style.display;
    // this.deleteAllElement.style.display = 'none';
    this.resultElement = this._mainMenuBarElement.querySelector('li.tie-btn-play');
    this.resultElement._display = this.resultElement.style.display;
    this.resultElement.style.display = 'none';
    const btnElement = this._mainMenuBarElement.querySelector('li.tie-btn-apply');
    const exportBtnElement = this._mainMenuBarElement.querySelector('li.tie-btn-export');
    const exportTemplate = this._exportTemplate.bind(this);
    exportBtnElement.addEventListener('click', exportTemplate);
    const onExport = this._onExport.bind(this);
    btnElement.addEventListener('click', onExport);
    this.exportBtnElement = btnElement;
    const deleteAll = this._deleteAll.bind(this);
    this.deleteAllElement.addEventListener('click', deleteAll);
    this.hideExport();
    this.timeLine.on({
      'track:remove': ({ track }) => {
        if (track.groups.length === 0) {
          this.hideExport();
        }
      },
      'track:add': ({ track }) => {
        if (track.groups.length > 0) {
          this.showExport();
        }
      },
    });
  }

  hideExport() {
    // const allItems = this._mainMenuBarElement.querySelector(`li.${this.cssPrefix}-item`);
    // allItems.forEach((item) => {
    //   item.style.display = 'none';
    // });
    this.exportBtnElement.style.display = 'none';
    this._mainMenuBarElement.style.display = 'none';
    this.resultElement.style.display = 'none';
  }

  showExport() {
    this.exportBtnElement.style.display = 'inline-block';
    this._mainMenuBarElement.style.display = 'table-cell';
  }

  _deleteAll() {
    this.timeLine.clearTracks();
    this.hideExport();
  }

  _onExport() {
    console.log('ready to export video....');
    this.timeLine.lock();
    this.datasource.fire('frame:export', {});
  }

  _exportTemplate() {
    this.timeLine.lock();
    this.datasource.fire('frame:template:export', {});
  }

  getEditorArea() {
    return this._editorElement;
  }

  getEditorMaxRect() {
    const rect = {};
    if (this._editorElementWrap) {
      rect.width = this._editorElementWrap.clientWidth;
      rect.height = this._editorElementWrap.clientHeight;
    }

    return rect;
  }

  /**
   * Init canvas
   * @ignore
   */
  initCanvas() {
    // const loadImageInfo = this._getLoadImage();
    // if (loadImageInfo.path) {
    //   this._actions.main.initLoadImage(loadImageInfo.path, loadImageInfo.name).then(() => {
    //     this.activeMenuEvent();
    //   });
    // }

    // this._addLoadEvent();

    this.activeMenuEvent();

    const gridVisual = document.createElement('div');

    gridVisual.className = cls('grid-visual');
    const grid = `<table>
           <tr><td class="dot left-top"></td><td></td><td class="dot right-top"></td></tr>
           <tr><td></td><td></td><td></td></tr>
           <tr><td class="dot left-bottom"></td><td></td><td class="dot right-bottom"></td></tr>
         </table>`;
    gridVisual.innerHTML = grid;
    this._editorContainerElement = this._editorElement.querySelector(cls('.canvas-container'));
    this._editorContainerElement.appendChild(gridVisual);
  }

  activeMenuEvent() {
    if (this._initMenuEvent) {
      return;
    }

    // this._addHelpActionEvent();
    // this._addDownloadEvent();
    this._addMenuEvent();
    this._initMenu();
    // this._historyMenu.addEvent(this._actions.history);
    this._initMenuEvent = true;
  }

  _addMenuEvent() {
    snippet.forEach(this.options.menu, (menuName) => {
      this._addMainMenuEvent(menuName);
      // this._addSubMenuEvent(menuName);
    });
  }

  _initMenu() {
    if (this.options.initMenu) {
      const evt = document.createEvent('MouseEvents');
      evt.initEvent('click', true, false);
      this._buttonElements[this.options.initMenu].dispatchEvent(evt);
    }

    if (this.icon) {
      this.icon.registerDefaultIcon();
    }
  }

  _addMainMenuEvent(menuName) {
    this.eventHandler[menuName] = () => this.changeMenu(menuName);
    this._buttonElements[menuName].addEventListener('click', this.eventHandler[menuName]);
  }

  changeMenu(menuName, toggle = true, discardSelection = true) {
    if (this.submenu === menuName) {
      return;
    }
    if (!this._submenuChangeTransection) {
      this._submenuChangeTransection = true;
      this._changeMenu(menuName, toggle, discardSelection);
      this._submenuChangeTransection = false;
    }
  }

  _changeMenu(menuName, toggle, discardSelection) {
    if (this.submenu) {
      this._buttonElements[this.submenu].classList.remove('active');
      this._mainElement.classList.remove(`${CSS_PREFIX}-menu-${this.submenu}`);
      if (discardSelection) {
        this._actions.main.discardSelection();
      }
      this._actions.main.changeSelectableAll(true);
      this[this.submenu].changeStandbyMode();
    }

    if (this.submenu === menuName && toggle) {
      this.submenu = null;
    } else {
      this._buttonElements[menuName].classList.add('active');
      this._mainElement.classList.add(`${CSS_PREFIX}-menu-${menuName}`);
      this.submenu = menuName;
      // console.log('this.submenu:', this.submenu, ',this[this.submenu]=>', this[this.submenu]);
      this[this.submenu].changeStartMode();
    }

    // this.resizeEditor();
  }

  _attachTimeLineEvent() {
    const timeChange = this._onTimeChanged.bind(this);
    this.timeLine.on({
      [eventNames.TIME_CHANGED]: timeChange,
      'timeline:clear:all': () => {
        this.datasource.fire('timeline:clear:all', {});
      },
    });
  }

  _attachDatasourceEvent() {
    const exportSuccess = this._onExportedOk.bind(this);
    const templateExportSuccess = this._onTemplateExportedOk.bind(this);
    this.datasource.on({
      'frame:export:success': exportSuccess,
      'frame:template:export:success': templateExportSuccess,
    });
  }

  _onTemplateExportedOk(result) {
    this.timeLine.unlock();
    if (!result) {
      return;
    }
    console.log('_onTemplateExportedOk result:', result);
  }

  _onExportedOk(result) {
    this.timeLine.unlock();
    if (!result) {
      return;
    }
    const { file } = result;
    if (file) {
      const { url, name, width, height } = file;
      const a = this.resultElement.querySelector('a');
      if (a) {
        a.href = url;
        const txt = this._locale.localize('Download');
        a.textContent = `${txt}[${name}].`;
        a.download = name;
      }
      this.resultElement.style.display = this.resultElement._display;
      console.log('_onExportedOk width:', width, ',height:', height);
    }
  }

  _onTimeChanged(params) {
    // console.log('_onTimeChanged params:', params);
    params.timestamp = Date.now();
    this.fire(eventNames.TIME_CHANGED, params);
  }

  updateDuration(dur) {
    if (this.timeLine) {
      this.timeLine.changeDuration(dur);
    }
  }

  addVideoFrames(dur, files, context, cb) {
    if (this.timeLine) {
      this.timeLine.addVideoFrames(dur, files, context, cb);
    }
  }

  addTransition(trackItem, dur, context, cb) {
    if (this.timeLine) {
      if (!context.duration) {
        context.duration = dur;
      }
      this.timeLine.addTransition(trackItem, dur, context, cb);
    }
  }

  resizeEditor() {
    this.timeLine.resizeEditor(this.getFootLayerMaxRect());
  }
}

CustomEvents.mixin(Ui);

export default Ui;

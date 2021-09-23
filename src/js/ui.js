import snippet from 'tui-code-snippet';
// import { getSelector, assignmentForDestroy, cls, getHistoryTitle, isSilentCommand } from '@/util';
import { getSelector, cls, cssPrefix } from '@/util';

import mainContainer from '@/ui/template/mainContainer';
import controls from './ui/template/controls';
import topMenu from './ui/template/topMenu';

import Locale from '@/ui/locale/locale';
import Theme from '@/ui/theme/theme';

import Make from '@/ui/make';
import Amake from '@/ui/amake';
import Imitate from '@/ui/imitate';
import Storage from './ui/storage';

const SUB_UI_COMPONENT = {
  Make,
  Amake,
  Imitate,
  Storage,
};

const { CustomEvents, extend } = snippet;
const CSS_PREFIX = cssPrefix;

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
    this._makeUiElement(element);
    this._setUiSize();
    this._initMenuEvent = false;

    this._makeSubMenu();
    // this._attachHistoryEvent();
    // this._attachZoomEvent();
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
          'imitate',
          'amake',
          'storage',
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
      cssPrefix,
    });

    this._selectedElement = selectedElement;
    this._selectedElement.classList.add(this.options.menuBarPosition);

    // this._layerTopElement = this._selectedElement.querySelector(cls('.layer-top'));
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
    this._controlLayerElement = this._selectedElement.querySelector(cls('.layer-main-left'));
    this._controlLayerElement.innerHTML = controls({
      locale: this._locale,
      biImage: this.theme.getStyle('common.bi'),
      cStyle: this.theme.getStyle('control'),
      loadButtonStyle: this.theme.getStyle('loadButton'),
      downloadButtonStyle: this.theme.getStyle('downloadButton'),
      uploadButtonStyle: this.theme.getStyle('uploadButton'),
      menuBarPosition: this.options.menuBarPosition,
      cssPrefix,
    });

    this._mainElement = selector(cls('.main'));
    this._editorElementWrap = selector(cls('.wrap'));
    // console.log('ui new ._editorElementWrap:', this._editorElementWrap);
    this._editorElement = selector('.ve-pro');
    this._helpMenuBarElement = selector(cls('.help-menu'));
    this._menuBarElement = selector(cls('.menu'));
    this._subMenuElement = selector(cls('.submenu'));
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
  }

  _makeSubMenu() {
    snippet.forEach(this.options.menu, (menuName) => {
      const SubComponentClass =
        SUB_UI_COMPONENT[menuName.replace(/^[a-z]/, ($0) => $0.toUpperCase())];

      // make menu element
      this._makeMenuElement(menuName);

      // menu btn element
      this._buttonElements[menuName] = this._menuBarElement.querySelector(`.tie-btn-${menuName}`);

      // submenu ui instance
      this[menuName] = new SubComponentClass(this._subMenuElement, {
        locale: this._locale,
        makeSvgIcon: this.theme.makeMenSvgIconSet.bind(this.theme),
        menuBarPosition: this.options.menuBarPosition,
        usageStatistics: this.options.usageStatistics,
        cssPrefix,
      });
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
}

CustomEvents.mixin(Ui);

export default Ui;

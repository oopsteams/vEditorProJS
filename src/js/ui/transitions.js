import TextureUI from '@/ui/withtexture';
import transitionsHtml from '@/ui/template/texture/transitions';
import templateHtml from '@/ui/template/submenu/transitions';
import itemHtml from '@/ui/template/texture/mediaitem';
import { cls } from '@/util';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 100;
const maxLabelHeight = 20;
const maxLineCount = 6;
const ItemBorderWeight = 4;

class Transitions extends TextureUI {
  constructor(
    subMenuElement,
    {
      locale,
      makeSvgIcon,
      menuBarPosition,
      usageStatistics,
      cssPrefix,
      theme,
      textureLayer,
      textureAspect,
      datasource,
      parent,
    }
  ) {
    super(subMenuElement, {
      locale,
      name: 'transition',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
      cssPrefix,
      theme,
      textureLayer,
      textureAspect,
      datasource,
    });
    this.counter = 0;
    this.items = {};
    this.parent = parent;
    this._els = {
      mainLayer: this.mediaBody.querySelector(cls('.media-layer-main')),
    };
    this.initCallback = null;
    this.buildActions();
    // this.setup();
    this.addDatasourceEvents();
    this.addEvents();
  }

  buildActions() {
    this.actions = {
      back: () => {
        this.changeStandbyMode();
        this.parent.changeStartMode();
        this.ui.changeMenu(this.parent.name);
        this.ui.timeLine.unlock();
      },
      delete: () => {
        if (this.activedTransition) {
          this.remove(this.activedTransition.context);
          this.activedTransition.dispose();
          this.removeSubMenu(['delete']);
        }
      },
    };
  }

  _onItemDeactive({ item }) {
    if (this.actived) {
      if (item) {
        // this.actions.back();
        console.log('transitions _onItemDeactive item:', item);
      }
    }
  }

  showMainLayer() {
    if (this._els.mainLayer.hasOwnProperty('_display')) {
      console.log('_display:', this._els.mainLayer._display);
      this._els.mainLayer.style.display = this._els.mainLayer._display;
    }
  }

  hideMainLayer() {
    const oriDisplay = this._els.mainLayer.style.display;
    if (oriDisplay !== 'none') {
      this._els.mainLayer._display = oriDisplay;
      this._els.mainLayer.style.display = 'none';
    }
  }

  _onItemActive({ item, isLast }) {
    if (this.actived) {
      const menuNames = ['back'];
      this.removeSubMenu(['delete']);
      if (item.name === 'item') {
        if (!isLast) {
          this.showMainLayer();
          this.setTrackItem(item);
        } else {
          this.removeSubMenu(['transition']);
          this.hideMainLayer();
        }
        this.addSubMenu(menuNames);
      } else if (item.name === 'transition') {
        this.activedTransition = item;
        menuNames.push('delete');
        // this.disableSubmenus(menuNames);
        console.log('active transition activedTransition:', this.activedTransition);
        this.addSubMenu(menuNames);

        const { trackItem } = this.activedTransition.context;

        if (trackItem) {
          this.setTrackItem(trackItem);
        }
      }
    }
  }

  setTrackItem(trackItem) {
    let elemId;
    this.trackItem = trackItem;
    const { transition } = trackItem;
    if (transition) {
      elemId = transition.context.elemId;
      console.log('setTrackItem elemId:', elemId);
    }
    this.activeElement(elemId);
  }

  _changeStartMode() {
    this.disableSubmenus(['back']);
    this.initDatas();
    this.showMainLayer();
  }

  initDatas(callback) {
    if (!this.inited) {
      this.initCallback = callback;
      this.datasource.fire('transitions:load', {});
    } else if (callback) {
      callback();
    }
  }

  existTransitionData(dataItem) {
    const { category, mode } = dataItem;
    for (const elemId in this.items) {
      if (this.items[elemId]) {
        const item = this.items[elemId];
        if (item.category === category && item.mode === mode) {
          return true;
        }
      }
    }

    return false;
  }

  _onTransitionsLoaded({ data }) {
    if (data) {
      this.inited = true;
      data.forEach((tran) => {
        if (!this.existTransitionData(tran)) {
          const elem = this._appendItem('#', minItemWidth, minItemWidth / 2, tran.label);
          // console.log('_onTransitionsLoaded elem:', elem);
          this.items[elem] = tran;
        }
      });
      if (this.initCallback) {
        this.initCallback();
      }
    }
  }

  copyDict(obj) {
    const rs = {};
    for (const k in obj) {
      if (obj[k]) {
        rs[k] = obj[k];
      }
    }

    return rs;
  }

  getTransitionSectionByMode(mode) {
    const keys = Object.keys(this.items);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      const elemId = keys[i];
      const transitionItem = this.items[elemId];
      if (transitionItem.mode === mode) {
        transitionItem.elemId = elemId;

        return this.copyDict(transitionItem);
      }
    }

    return null;
  }

  _onAddTransitionFromTemplate({ section, callback }) {
    this.initDatas(() => {
      const { mode, dur, pre } = section;
      const transition = this.getTransitionSectionByMode(mode);
      if (!transition) {
        if (callback) {
          callback();
        }

        return;
      }
      const trackItem = this.getTrackItem({ uid: pre });
      if (trackItem) {
        transition.dur = dur;
        transition.trackItem = trackItem;
        this.ui.addTransition(trackItem, transition.dur, transition, () => {
          this.activeElement(transition.elemId);
          if (callback) {
            callback();
          }
        });
      } else if (callback) {
        callback();
      }
    });
  }

  setupTransition(trackItem, transition, callback) {
    transition.trackItem = trackItem;
    this.ui.addTransition(trackItem, transition.dur, transition, () => {
      const section = this.parent.getSectionByItem(trackItem);
      console.log('setupTransition transition:', transition, ',section:', section);
      this.datasource.fire('track:transition:add', {
        transition,
        section,
        callback,
      });
    });
  }

  getTrackItem(section) {
    return this.getUI().timeLine.track.getItemByUid(section.uid);
  }

  _onAddBtnClick(event) {
    let dataset;
    const { tagName } = event.target;
    if (tagName === 'use') {
      dataset = event.target.parentNode.dataset;
    } else if (tagName === 'svg') {
      dataset = event.target.dataset;
    } else {
      return;
    }
    const elemId = dataset.id;
    const transitionItem = this.items[elemId];
    transitionItem.elemId = elemId;
    transitionItem.trackItem = this.trackItem;
    this.activeElement(elemId);
    const transition = this.copyDict(transitionItem);
    this.setupTransition(this.trackItem, transition, null);
    /*
    this.ui.addTransition(this.trackItem, transitionItem.dur, transition, () => {
      const section = this.parent.getSectionByItem(transitionItem.trackItem);
      this.datasource.fire('track:transition:add', {
        transition,
        section,
      });
    });
    */
  }

  activeElement(elemId) {
    // console.log('activeElement elemid:', elemId);
    // const layerItem = this._els.mainLayer.querySelector(`#${elemId}`);
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const allDataMenus = this._els.mainLayer.querySelectorAll(menuCss);
    allDataMenus.forEach((dm) => {
      const { id } = dm.querySelector('svg').dataset;
      console.log('activeElement dm dataset id:', id, ',elemId:', elemId);
      dm.classList.remove('active');
      if (id === elemId) {
        dm.classList.add('active');
      }
    });
    // const menuElem = layerItem.querySelector(menuCss);
    // menuElem.classList.add('active');
  }

  remove(transitionSection) {
    console.log('remove transitionSection:', transitionSection);
    const layerItem = this._els.mainLayer.querySelector(`#${transitionSection.elemId}`);
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const menuElem = layerItem.querySelector(menuCss);
    menuElem.classList.remove('active');
    const section = this.parent.getSectionByItem(transitionSection.trackItem);
    this.datasource.fire('track:transition:remove', { transition: transitionSection, section });
  }

  _appendItem(src, fileWidth, fileHeight, fileName) {
    let imgStyle = '',
      labelStyle,
      btnStyle,
      html;
    const onAddBtnClick = this._onAddBtnClick.bind(this);
    const boxSize = 2;
    const { width, height } = this.adjustItemSize(minItemWidth, maxLineCount);
    const imgWidth = width - ItemBorderWeight;
    const imgHeight = height - maxLabelHeight - ItemBorderWeight - boxSize * 2;
    const labelWidth = imgWidth;
    const labelHeight = maxLabelHeight;
    labelStyle = `width:${labelWidth}px;height:${labelHeight}px;`;
    labelStyle += `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
    labelStyle += `font-size:10px;`;
    btnStyle = `width:${labelWidth}px;position:absolute;left:0;top:0;`;
    btnStyle += `padding-right:2px;`;
    const layerItem = document.createElement('div');
    layerItem.id = `transitionItem_${this.counter}`;
    this.counter += 1;
    layerItem.setAttribute('id', layerItem.id);
    layerItem.className = `${this.cssPrefix}-media-item`;
    if ((fileWidth / imgWidth) * imgHeight > fileHeight) {
      imgStyle = `width:${imgWidth}px;`;
    } else {
      imgStyle = `height:${imgHeight}px;`;
    }
    html = `<div><img src="${src}" style="${imgStyle}" title="${fileName}" alt="${fileName}" /></div>`;
    html += `<div style="${labelStyle}">${fileName}</div>`;
    html += `<div style="${btnStyle}">`;
    html += `<span style="float:right;" class="${this.cssPrefix}-menu ${this.cssPrefix}-item check">`;
    html += `${this.makeSvgIcon(['normal', 'active', 'hover'], 'check', false)}`;
    html += `</span></div>`;
    layerItem.style.width = `${width}px`;
    layerItem.style.height = `${height}px`;
    layerItem.innerHTML = itemHtml({ html, cssPrefix: this.cssPrefix });
    this._els.mainLayer.appendChild(layerItem);
    const addElem = layerItem.querySelector(`.${this.cssPrefix}-menu.check>svg`);
    addElem.setAttribute('data-id', layerItem.id);
    addElem.addEventListener('click', onAddBtnClick);

    return layerItem.id;
  }

  addDatasourceEvents() {
    const onTransitionsLoaded = this._onTransitionsLoaded.bind(this);
    this.datasource.on({
      'transitions:loaded': onTransitionsLoaded,
    });
  }

  activeMenu() {
    // const menuNames = [];
    // if (item.name === 'item') {
    //   menuNames.push('delete');
    //   if (!isLast) {
    //     menuNames.push('transition');
    //   }
    //   this.disableSubmenus(menuNames);
    // } else if (item.name === 'transition') {
    //   menuNames.push('delete');
    //   this.disableSubmenus(menuNames);
    // }
  }

  addEvents() {
    const onItemDeactive = this._onItemDeactive.bind(this);
    const onItemActive = this._onItemActive.bind(this);
    this.getUI().timeLine.on({
      'slip:item:deselected': onItemDeactive,
      'slip:item:selected': onItemActive,
    });
    const onAddTransitionFromTemplate = this._onAddTransitionFromTemplate.bind(this);
    this.datasource.on({
      'sync:main:track:transition': onAddTransitionFromTemplate,
    });
  }

  getTextureHtml() {
    return transitionsHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default Transitions;

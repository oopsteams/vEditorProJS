import TextureUI from '@/ui/withtexture';
import animationsHtml from '@/ui/template/texture/animations';
import templateHtml from '@/ui/template/submenu/animationsmenu';
import itemHtml from '@/ui/template/texture/mediaitem';
import { cls } from '@/util';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 120;
const maxLabelHeight = 20;
const ItemBorderWeight = 4;

class AnimationControl extends TextureUI {
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
      name: 'animation',
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

  _changeStartMode() {
    this.disableSubmenus(['back']);
    this.initDatas();
    this.showMainLayer();
  }

  initDatas(callback) {
    this.initCallback = callback;
    this.datasource.fire('animations:load', {});
  }

  _onAnimationsLoaded({ data }) {
    if (data) {
      this.inited = true;
      data.forEach((animate) => {
        if (!this.existAnimationData(animate)) {
          const elem = this._appendItem('#', minItemWidth, minItemWidth / 2, animate.label);
          this.items[elem] = animate;
        }
      });
      if (this.initCallback) {
        this.initCallback();
      }
    }
  }

  buildActions() {
    this.actions = {
      back: () => {
        this.changeStandbyMode();
        this.parent.changeStartMode();
        this.ui.changeMenu(this.parent.name);
      },
      delete: () => {
        if (this.activedAnimation) {
          this.remove(this.activedAnimation.context);
          this.activedAnimation.dispose();
        }
      },
    };
  }

  _onItemDeactive({ item }) {
    if (this.actived) {
      if (item) {
        console.log('animations _onItemDeactive item:', item);
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

  updateActivedAnimation(item) {
    this.activedAnimation = item;
    if (item) {
      this.addSubMenu(['delete']);
      const { elemId } = item.context;
      this.activeElement(elemId);
    } else {
      this.removeSubMenu(['delete']);
      this.activeElement(null);
    }
  }

  _onAnimationItemSelected({ item }) {
    this.updateActivedAnimation(item);
  }

  _onAnimationItemUnselected({ item }) {
    if (item === null || this.activedAnimation === item) {
      this.updateActivedAnimation(null);
    }
  }

  _onItemActive({ item }) {
    if (this.actived) {
      const menuNames = ['back'];
      this.removeSubMenu(['delete']);
      if (item.name === 'item') {
        this.showMainLayer();
        this.setTrackItem(item);
        this.addSubMenu(menuNames);
      } else if (item.name === 'transition') {
        this.activedAnimation = null;
        this.hideMainLayer();
        this.addSubMenu(menuNames);
      } else if (item.name === 'animation') {
        this.activedAnimation = item;
        menuNames.push('delete');
        // this.disableSubmenus(menuNames);
        this.addSubMenu(menuNames);
        const { trackItem } = this.activedAnimation.context;
        if (trackItem) {
          this.setTrackItem(trackItem);
        }
      }
    }
  }

  setTrackItem(trackItem) {
    this.trackItem = trackItem;
    this.getUI().timeLine.animationtrack.focusByTrackItem(this.trackItem);
  }

  existAnimationData(dataItem) {
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

  copyDict(obj) {
    const rs = {};
    for (const k in obj) {
      if (obj[k]) {
        rs[k] = obj[k];
      }
    }

    return rs;
  }

  getAnimationSectionByMode(mode) {
    const keys = Object.keys(this.items);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      const elemId = keys[i];
      const animationItem = this.items[elemId];
      if (animationItem.mode === mode) {
        animationItem.elemId = elemId;

        return animationItem;
      }
    }

    return null;
  }

  setupAnimation(trackItem, animationItem, callback) {
    animationItem.trackItem = trackItem;
    const dur = trackItem.getDuration();
    const section = this.parent.getSectionByItem(trackItem);
    this.ui.timeLine.addAnimation(
      {
        duration: dur,
        section,
        elemId: animationItem.elemId,
        trackItem,
        text: animationItem.label,
      },
      () => {
        this.datasource.fire('track:animation:add', {
          animation: this.copyDict(animationItem),
          section,
          callback,
        });
      }
    );
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
    if (this.activedAnimation) {
      const { elemId } = this.activedAnimation.context;
      if (dataset.id === elemId) {
        return;
      }
    }
    const elemId = dataset.id;
    const animationItem = this.items[elemId];
    console.log(
      '_onAddBtnClick elemId:',
      elemId,
      ',trackItem:',
      this.trackItem,
      ', tran:',
      animationItem
    );
    animationItem.elemId = elemId;
    const { trackItem } = this;
    animationItem.trackItem = trackItem;
    const dur = trackItem.getDuration();
    console.log('animation dur:', dur);
    this.activeElement(elemId);
    const section = this.parent.getSectionByItem(trackItem);

    this.ui.timeLine.addAnimation(
      {
        duration: dur,
        section,
        elemId,
        trackItem,
        mode: animationItem.mode,
        text: animationItem.label,
      },
      () => {
        // const menuElem = layerItem.querySelector(menuCss);
        // menuElem.classList.add('active');
        // console.log('sync add transition transitionItem:', transitionItem);
        // console.log('add transition layerItem:', layerItem);
        // const section = this.parent.getSectionByItem(animationItem.trackItem);
        this.datasource.fire('track:animation:add', {
          animation: this.copyDict(animationItem),
          section,
        });
      }
    );
  }

  activeElement(elemId) {
    // console.log('activeElement elemid:', elemId);
    // const layerItem = this._els.mainLayer.querySelector(`#${elemId}`);
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const allDataMenus = this._els.mainLayer.querySelectorAll(menuCss);
    allDataMenus.forEach((dm) => {
      const { id } = dm.querySelector('svg').dataset;
      console.log('activeElement dm dataset id:', id);
      dm.classList.remove('active');
      if (id === elemId) {
        dm.classList.add('active');
      }
    });
    // const menuElem = layerItem.querySelector(menuCss);
    // menuElem.classList.add('active');
  }

  remove(animationSection) {
    const layerItem = this._els.mainLayer.querySelector(`#${animationSection.elemId}`);
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const menuElem = layerItem.querySelector(menuCss);
    menuElem.classList.remove('active');
    const { section } = animationSection;
    this.datasource.fire('track:animation:remove', { animation: animationSection, section });
  }

  _appendItem(src, fileWidth, fileHeight, fileName) {
    let imgStyle = '',
      labelStyle,
      btnStyle,
      html;
    const onAddBtnClick = this._onAddBtnClick.bind(this);
    const boxSize = 2;
    const { width, height } = this.adjustItemSize(minItemWidth);
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
    layerItem.id = `animationItem_${this.counter}`;
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
    html += `<span style="float:right;" class="${this.cssPrefix}-menu check">`;
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
    const onAnimationsLoaded = this._onAnimationsLoaded.bind(this);
    this.datasource.on({
      'animations:loaded': onAnimationsLoaded,
    });
  }

  activeMenu() {}

  addEvents() {
    const onItemDeactive = this._onItemDeactive.bind(this);
    const onItemActive = this._onItemActive.bind(this);
    const onAnimationItemSelected = this._onAnimationItemSelected.bind(this);
    const onAnimationItemUnselected = this._onAnimationItemUnselected.bind(this);
    this.getUI().timeLine.on({
      'slip:item:deselected': onItemDeactive,
      'slip:item:selected': onItemActive,
      'slip:animation:selected': onAnimationItemSelected,
      'slip:animation:unselected': onAnimationItemUnselected,
    });
  }

  getTextureHtml() {
    return animationsHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default AnimationControl;

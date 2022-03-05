import TextureUI from '@/ui/withtexture';
import sceneeffectHtml from '@/ui/template/texture/sceneeffectlist';
import templateHtml from '@/ui/template/submenu/sceneeffect';
import itemHtml from '@/ui/template/texture/mediaitem';
import { cls } from '@/util';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 100;
const maxLabelHeight = 20;
const maxLineCount = 6;
const ItemBorderWeight = 4;
const TrackEventPrefix = 'track:sceneeffect';
const SlipEventPrefix = 'slip:sceneeffect';

class SceneEffectControl extends TextureUI {
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
      name: 'sceneeffect',
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
    this.activedSceneEffect = null;
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
    if (!this.inited) {
      this.initCallback = callback;
      this.datasource.fire('sceneeffect:load', {});
    } else if (callback) {
      callback();
    }
  }

  _onEffectsLoaded({ data }) {
    if (data) {
      this.inited = true;
      data.forEach((animate) => {
        if (!this.existSceneEffectData(animate)) {
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
        if (this.activedSceneEffect) {
          this.remove(this.activedSceneEffect.context, () => {
            const { section } = this.activedSceneEffect.context;
            this.datasource.fire('track:sceneeffect:remove', {
              cfg: this.activedSceneEffect.context,
              section,
            });
            this.activedSceneEffect.dispose();
          });
        }
      },
    };
  }

  _onItemDeactive({ item }) {
    if (this.actived) {
      if (item) {
        console.log('sceneeffect _onItemDeactive item:', item);
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

  updateActivedSceneEffect(item) {
    this.activedSceneEffect = item;
    if (item) {
      this.addSubMenu(['delete']);
      const { elemId } = item.context;
      console.log('updateActivedSceneEffect elemId:', elemId, ',context:', item.context);
      this.activeElement(elemId);
    } else {
      this.removeSubMenu(['delete']);
      this.activeElement(null);
    }
  }

  _onAddEffectFromTemplate({ section, commonSection, callback }) {
    this.initDatas(() => {
      const { mode } = section;
      const cfg = this.getSeByMode(mode);
      if (cfg) {
        const trackItem = this.getUI().timeLine.track.getItemByUid(commonSection.uid);
        cfg.startAt = section.startAt;
        cfg.dur = section.dur;
        console.log(
          '_onAddEffectFromTemplate trackItem:',
          trackItem,
          ',cfg:',
          cfg,
          'commonSection:',
          commonSection
        );
        this.setupSceneEffect({ trackItem, sceneEffectItem: cfg, prevent: true, callback });
      } else if (callback) {
        callback();
      }
    });
  }

  _onSceneEffectItemSelected({ item }) {
    this.updateActivedSceneEffect(item);
  }

  _onSceneEffectItemUnselected({ item }) {
    if (item === null || this.activedSceneEffect === item) {
      this.updateActivedSceneEffect(null);
    }
  }

  activeMenu({ item }) {
    const menuNames = ['back'];
    console.log('sceneeffect activeMenu item:', item);
    this.removeSubMenu(['delete']);
    if (item.name === 'item') {
      this.showMainLayer();
      this.setTrackItem(item);
      this.addSubMenu(menuNames);
    } else if (item.name === 'transition') {
      // this.clearSubMenu();
      this.disableSubmenus(['back']);
      this.activedSceneEffect = null;
      this.hideMainLayer();
      this.addSubMenu(menuNames);
    } else if (item.name === 'sceneeffect') {
      this.activedSceneEffect = item;
      // this.clearSubMenu();
      menuNames.push('delete');
      this.addSubMenu(menuNames);
      const { trackItem } = this.activedSceneEffect.context;
      if (trackItem) {
        this.setTrackItem(trackItem);
      }
    }
  }

  setTrackItem(trackItem) {
    this.trackItem = trackItem;
    this.getUI().timeLine.sceneEffectTrack.focusByTrackItem(this.trackItem);
  }

  existSceneEffectData(dataItem) {
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

  getSeByMode(mode) {
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

  setupSceneEffect({ trackItem, sceneEffectItem, prevent, callback }) {
    sceneEffectItem.trackItem = trackItem;
    const dur = trackItem.getDuration();
    const section = this.parent.getSectionByItem(trackItem);
    console.log('setupSceneEffect trackItem start:', trackItem.start, ',section:', section);
    const cfg = this.copyDict(sceneEffectItem);
    cfg.startAt = 0;
    if (!cfg.elemId) {
      const _cfg = this.getSeByMode(cfg.mode);
      cfg.elemId = _cfg.elemId;
    }
    console.log('setupSceneEffect trackItem sceneEffectItem.startAt:', sceneEffectItem.startAt);
    this.ui.timeLine.addSceneEffect(
      {
        duration: dur,
        section,
        elemId: cfg.elemId,
        trackItem,
        mode: cfg.mode,
        text: cfg.label,
      },
      (item) => {
        if (prevent) {
          item.changeDuration({
            startAt: sceneEffectItem.startAt,
            dur: cfg.dur,
            callback,
          });
        } else {
          this.datasource.fire('track:sceneeffect:add', {
            cfg,
            section,
            callback: () => {
              item.changeDuration({
                startAt: sceneEffectItem.startAt,
                dur: cfg.dur,
                callback,
              });
            },
          });
        }
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
    if (this.activedSceneEffect) {
      const { elemId } = this.activedSceneEffect.context;
      if (dataset.id === elemId) {
        return;
      }
    }
    const elemId = dataset.id;
    const sceneEffectItem = this.items[elemId];
    // console.log(
    //   '_onAddBtnClick elemId:',
    //   elemId,
    //   ',trackItem:',
    //   this.trackItem,
    //   ', tran:',
    //   sceneEffectItem
    // );
    sceneEffectItem.elemId = elemId;
    const { trackItem } = this;
    sceneEffectItem.trackItem = trackItem;
    sceneEffectItem.startAt = 0; // trackItem.start;
    // const targetDuration = sceneEffectItem.dur;
    const dur = trackItem.getDuration();
    sceneEffectItem.dur = dur;

    console.log('sceneEffect dur:', dur);
    this.activeElement(elemId);
    // const section = this.parent.getSectionByItem(trackItem);

    this.setupSceneEffect({ trackItem, sceneEffectItem });
    /*
    const cfg = this.copyDict(sceneEffectItem);
    cfg.startAt = 0;
    this.ui.timeLine.addSceneEffect(
      {
        duration: dur,
        section,
        elemId,
        trackItem,
        mode: sceneEffectItem.mode,
        text: sceneEffectItem.label,
      },
      (item) => {
        this.datasource.fire('track:sceneeffect:add', {
          cfg,
          section,
          callback: () => {
            item.changeDuration({ startAt: cfg.startAt, dur: targetDuration });
          },
        });
      }
    );
    */
  }

  activeElement(elemId) {
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

  remove(sceneEffectSection, callback) {
    const layerItem = this._els.mainLayer.querySelector(`#${sceneEffectSection.elemId}`);
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const menuElem = layerItem.querySelector(menuCss);
    menuElem.classList.remove('active');
    if (callback) {
      callback();
    }
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
    layerItem.id = `sceneeffectItem_${this.counter}`;
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
    const onEffectsLoaded = this._onEffectsLoaded.bind(this);
    this.datasource.on({
      'sceneeffect:loaded': onEffectsLoaded,
    });
  }

  _onScaled(params) {
    this.datasource.fire(`${TrackEventPrefix}:scale`, params);
  }

  _onDispose({ item, callback }) {
    // console.log('sceneEffectTrack onDispose in...', item.context);
    this.remove(item.context, callback);
  }

  _onClear({ callback }) {
    this.ui.timeLine.sceneEffectTrack.clearAll(callback);
  }

  addEvents() {
    const onItemDeactive = this._onItemDeactive.bind(this);
    const onItemActive = this._onItemActive.bind(this);
    const onSceneEffectItemSelected = this._onSceneEffectItemSelected.bind(this);
    const onSceneEffectItemUnselected = this._onSceneEffectItemUnselected.bind(this);
    const onScaled = this._onScaled.bind(this);
    const onDispose = this._onDispose.bind(this);
    this.getUI().timeLine.on({
      'slip:item:deselected': onItemDeactive,
      'slip:item:selected': onItemActive,
      [`${TrackEventPrefix}:scale`]: onScaled,
      [`${SlipEventPrefix}:selected`]: onSceneEffectItemSelected,
      [`${SlipEventPrefix}:unselected`]: onSceneEffectItemUnselected,
      [`${TrackEventPrefix}:ui:remove`]: onDispose,
    });
    const onAddEffectFromTemplate = this._onAddEffectFromTemplate.bind(this);
    const onClear = this._onClear.bind(this);
    this.datasource.on({
      'sync:main:track:effect': onAddEffectFromTemplate,
      'sceneeffect:clear': onClear,
    });
  }

  getTextureHtml() {
    return sceneeffectHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default SceneEffectControl;

import TextureUI from '@/ui/withtexture';
import transitionsHtml from '@/ui/template/texture/transitions';
import templateHtml from '@/ui/template/submenu/transitions';
import itemHtml from '@/ui/template/texture/mediaitem';
import { cls } from '@/util';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 120;
const maxLabelHeight = 20;
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
    this.buildActions();
    // this.setup();
    this.addDatasourceEvents();
  }

  buildActions() {
    this.actions = {
      back: () => {
        this.changeStandbyMode();
        this.parent.changeStartMode();
        this.ui.changeMenu(this.parent.name);
        this.ui.timeLine.unlock();
      },
    };
  }

  setTrackItem(trackItem) {
    this.trackItem = trackItem;
    const { transition } = trackItem;
    if (transition) {
      const { elemId } = transition.context;
      console.log('setTrackItem elemId:', elemId);
      this.activeElement(elemId);
    }
  }

  _changeStartMode() {
    this.disableSubmenus(['back']);
    this.datasource.fire('transitions:load', {});
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
      data.forEach((tran) => {
        if (!this.existTransitionData(tran)) {
          const elem = this._appendItem('#', minItemWidth, minItemWidth / 2, tran.label);
          console.log('_onTransitionsLoaded elem:', elem);
          this.items[elem] = tran;
        }
      });
    }
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
    // const layerItem = this._els.mainLayer.querySelector(`#${elemId}`);
    // const menuCss = `.${this.cssPrefix}-menu.check`;
    // const allDataMenus = this._els.mainLayer.querySelectorAll(menuCss);
    // allDataMenus.forEach((dm) => {
    //   dm.classList.remove('active');
    // });
    console.log('_onAddBtnClick elemId:', elemId, ',trackItem:', this.trackItem);
    const transitionItem = this.items[elemId];
    transitionItem.elemId = elemId;
    transitionItem.trackItem = this.trackItem;
    this.activeElement(elemId);
    this.ui.addTransition(this.trackItem, transitionItem.dur, transitionItem, () => {
      // const menuElem = layerItem.querySelector(menuCss);
      // menuElem.classList.add('active');
      // console.log('sync add transition transitionItem:', transitionItem);
      // console.log('add transition layerItem:', layerItem);
      const section = this.parent.getSectionByItem(transitionItem.trackItem);
      this.datasource.fire('track:transition:add', { transition: transitionItem, section });
    });
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

  remove(transitionItem) {
    const layerItem = this._els.mainLayer.querySelector(`#${transitionItem.elemId}`);
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const menuElem = layerItem.querySelector(menuCss);
    menuElem.classList.remove('active');
    console.log('remove menuElem:', menuElem, ',transitionItem:', transitionItem);
    const section = this.parent.getSectionByItem(transitionItem.trackItem);
    this.datasource.fire('track:transition:remove', { transition: transitionItem, section });
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

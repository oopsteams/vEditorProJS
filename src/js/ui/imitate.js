import TextureUI from '@/ui/withtexture';
// import snippet from 'tui-code-snippet';
import templateHtml from '@/ui/template/submenu/imitate';
import imitateHtml from '@/ui/template/texture/imitate';
import itemHtml from '@/ui/template/texture/mediaitem';
import TemplateInstance from './templateInstance';
// import { eventNames, selectorNames } from '@/consts';
import { cls } from '@/util';
const minItemWidth = 100;
const maxLabelHeight = 20;
const maxLineCount = 6;
const ItemBorderWeight = 4;

class Imitate extends TextureUI {
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
      previewItemWidth,
      previewItemHeight,
    }
  ) {
    super(subMenuElement, {
      locale,
      name: 'imitate',
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
    this.previewItemWidth = previewItemWidth;
    this.previewItemHeight = previewItemHeight;
    const options = {
      locale,
      makeSvgIcon,
      menuBarPosition,
      usageStatistics,
      cssPrefix,
      theme,
      textureLayer,
      textureAspect,
      datasource,
      previewItemWidth,
      previewItemHeight,
      parent: this,
    };
    this._els = {
      mainLayer: this.mediaBody.querySelector(cls('.media-layer-main')),
      tbox: this.mediaBody.querySelector(cls('.media-layer-main-tbox>div')),
      bbox: this.mediaBody.querySelector(cls('.media-layer-main-bbox>div')),
    };
    // this.setup();
    this.templateInstance = new TemplateInstance(subMenuElement, options);
    this.items = {};
    this.localTemplates = {};
    this.subMenus = [this.templateInstance];
    this.addDatasourceEvents();
    this.buildActions();
  }

  adjustUI() {
    const aspect = 1 / this.textureAspect; // H / W
    const btnWidth = minItemWidth;

    const loadBtns = this.mediaBody.querySelectorAll(cls('.media-load-frame'));
    loadBtns.forEach((element) => {
      element.style.width = `${btnWidth}px`;
      element.style.height = `${btnWidth * aspect}px`;
    });

    this._addLoadEvent();
  }

  buildActions() {
    this.actions = {
      delete: () => {
        const { activedItem } = this;
        this.datasource.fire(`template:delete`, { section: activedItem });
      },
      play: () => {
        if (this.activedItem) {
          this.removeSubMenu(['play']);
          this.addSubMenu(['pause']);
          this.datasource.fire(`template:play`, { section: this.activedItem });
        }
      },
      pause: () => {
        this.datasource.fire('template:pause', {});
      },
      apply: () => {
        const { activedItem } = this;
        this.templateInstance.setItem(activedItem);
        this.changeStandbyMode();
        this.templateInstance.changeStartMode();
      },
    };
  }

  activeMenu({ item }) {
    const menuNames = ['delete', 'play', 'apply'];
    if (item) {
      this.addSubMenu(menuNames);
      this.removeSubMenu(['pause']);
    } else {
      // this.removeSubMenu(['transition']);
      this.disableSubmenus([]);
    }
  }

  existTemplateData(dataItem) {
    const { id } = dataItem;
    for (const elemId in this.items) {
      if (this.items[elemId]) {
        const item = this.items[elemId];
        if (item.id === id) {
          return true;
        }
      }
    }

    return false;
  }

  _changeStartMode() {
    this.datasource.fire('template:load', {});
  }

  _changeStandbyMode() {
    this.subMenus.forEach((sm) => {
      sm.changeStandbyMode();
    });
  }

  _onTemplateDeleted() {
    this._els.mainLayer.innerHTML = '';
    this.items = [];
    this.datasource.fire('template:load', {});
  }

  _onPlayComplete() {
    this.removeSubMenu(['pause']);
    this.addSubMenu(['play']);
  }

  _onTemplateReady({ section }) {
    if (section) {
      this.activedItem = section;
      this.activeMenu({ item: section });
    } else {
      this.activedItem = null;
      this.activeMenu({ item: null });
    }
  }

  _onTemplateLoaded(result) {
    const datas = result.data;
    console.log('_onTemplateLoaded datas:', datas);
    if (datas) {
      datas.forEach((template) => {
        if (!this.existTemplateData(template)) {
          const elem = this._appendItem(minItemWidth, minItemWidth / 2, template.name, template.id);
          // console.log('_onTransitionsLoaded elem:', elem);
          this.items[elem] = template;
        }
      });
    }
    this.hideLoading();
  }

  _onVzipLoaded({ loaded }) {
    // console.log(`_onVzipLoaded name:${name}, data:${data}`);
    if (loaded) {
      this.ui.changeMenu('make');
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
    this.activeElement(elemId);
    const templateSection = this.items[elemId];
    this.datasource.fire(`template:active`, { section: templateSection });
  }

  activeElement(elemId) {
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const allDataMenus = this._els.mainLayer.querySelectorAll(menuCss);
    for (let i = 0, n = allDataMenus.length; i < n; i += 1) {
      const dm = allDataMenus[i];
      const { id } = dm.querySelector('svg').dataset;
      if (id === elemId) {
        dm.classList.add('active');
      } else {
        dm.classList.remove('active');
      }
    }
  }

  deactiveElement(elemId) {
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const allDataMenus = this._els.mainLayer.querySelectorAll(menuCss);
    for (let i = 0, n = allDataMenus.length; i < n; i += 1) {
      const dm = allDataMenus[i];
      const { id } = dm.querySelector('svg').dataset;
      if (id === elemId) {
        dm.classList.remove('active');
        break;
      }
    }
  }

  _appendItem(fileWidth, fileHeight, fileName, itemId) {
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
    layerItem.id = `templateItem_${itemId}`;
    layerItem.setAttribute('id', layerItem.id);
    layerItem.className = `${this.cssPrefix}-media-item`;
    if ((fileWidth / imgWidth) * imgHeight > fileHeight) {
      imgStyle = `width:${imgWidth}px;`;
    } else {
      imgStyle = `height:${imgHeight}px;`;
    }
    imgStyle += `display:flex;align-items:center;justify-content:center;`;
    html = `<div style="${imgStyle}"></div>`;
    html += `<div style="${labelStyle}">${fileName}</div>`;
    html += `<div style="${btnStyle}">`;
    html += `<span style="float:right;" class="${this.cssPrefix}-menu check">`;
    html += `${this.makeSvgIcon(['normal', 'active', 'hover'], 'check', false)}`;
    html += `</span></div>`;
    layerItem.style.width = `${width}px`;
    layerItem.style.height = `${height}px`;
    layerItem.innerHTML = itemHtml({ html, cssPrefix: this.cssPrefix });
    this._els.bbox.appendChild(layerItem);
    const addElem = layerItem.querySelector(`.${this.cssPrefix}-menu.check>svg`);
    addElem.setAttribute('data-id', layerItem.id);
    addElem.addEventListener('click', onAddBtnClick);

    return layerItem.id;
  }

  _getParserByName(name) {
    let elemId;
    for (elemId in this.localTemplates) {
      if (this.localTemplates.hasOwnProperty(elemId)) {
        const parser = this.localTemplates[elemId];
        if (parser.srcFileName === name) {
          return parser;
        }
      }
    }

    return null;
  }

  iteratorLoad(cb) {
    let info;
    const n = this.__files.length;
    if (n === 0) {
      if (cb) {
        cb();
      }

      return;
    }
    const [file] = this.__files.splice(0, 1);
    if (!file) {
      this.iteratorLoad(cb);
    }
    const { name } = file;
    const parser = this._getParserByName(name);
    // console.log('iteratorLoad name:', name);
    if (parser) {
      info = 'File[] had imported!';
      info = info.replace('[]', `[${name}]`);
      alert(info);
      this.iteratorLoad(cb);
    } else if (name.indexOf('vzip') >= 0) {
      // file.type = 'vzip';
      this.datasource.fire('vzip:load', { file });
    } else {
      info = 'File Type is Error';
      alert(info);
      this.iteratorLoad(cb);
    }
  }

  _onFileChanged(event) {
    // const [file] = event.target.files;
    // let isMain = true;
    // const classNames = event.target.getAttribute('class');
    // console.log('event.target.files:', event.target.files, ',isMain:', isMain);
    this.__files = [];
    for (let i = 0, n = event.target.files.length; i < n; i += 1) {
      // const f = event.target.files[i];
      // f.isMain = isMain;
      this.__files.push(event.target.files[i]);
    }
    this.iteratorLoad(() => {
      console.log('Nothing Done!!!!');
    });
  }

  addDatasourceEvents() {
    const onTemplateLoaded = this._onTemplateLoaded.bind(this);
    const onTemplateReady = this._onTemplateReady.bind(this);
    const onPlayComplete = this._onPlayComplete.bind(this);
    const onTemplateDeleted = this._onTemplateDeleted.bind(this);
    const onVzipLoaded = this._onVzipLoaded.bind(this);
    this.datasource.on({
      'template:loaded': onTemplateLoaded,
      'template:ready': onTemplateReady,
      'template:play:complete': onPlayComplete,
      'template:deleted': onTemplateDeleted,
      'vzip:loaded': onVzipLoaded,
    });
  }

  _addLoadEvent() {
    const onFileChanged = this._onFileChanged.bind(this);
    const loadElement = this.mediaBody.querySelector(cls('.media-load-btn.main'));
    loadElement.addEventListener('change', onFileChanged);
  }

  getTextureHtml() {
    return imitateHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default Imitate;

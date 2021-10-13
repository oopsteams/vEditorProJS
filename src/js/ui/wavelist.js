import TextureUI from '@/ui/withtexture';
import waveHtml from '@/ui/template/texture/wavelist';
import templateHtml from '@/ui/template/submenu/wavelistmenu';
import itemHtml from '@/ui/template/texture/mediaitem';
import { cls } from '@/util';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 120;
const maxLabelHeight = 20;
const ItemBorderWeight = 4;

class WaveList extends TextureUI {
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
      name: 'wave',
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

  adjustUI() {
    const pad = 5;
    const n = 4;
    // const aspect = 2 / 3; // H / W
    const aspect = 1 / this.textureAspect; // H / W
    this.loadButton = this.mediaBody.querySelector(cls('.media-load-frame'));
    const width = this.textureLayer.clientWidth;
    const btnWidth = (width - pad * (n + 1)) / n;
    this.loadButton.style.width = `${btnWidth}px`;
    this.loadButton.style.height = `${btnWidth * aspect}px`;
    this._addLoadEvent();
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
    // this.datasource.fire('transitions:load', {});
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
          const elem = this._appendItem('#', 120, 60, tran.label);
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
    this.activeElement(elemId);
    const parser = this.items[elemId];
    const onProgress = this._onProgress.bind(this);
    if (parser) {
      const duration = parser.total_seconds;
      const { srcFileName, fileType } = parser;
      parser.setup(onProgress).then((section) => {
        this.ui.timeLine.addWave(
          section.dur,
          [{ url: section.file.data }],
          {
            name: srcFileName,
            duration,
            elemId,
            fileType,
            section,
          },
          () => {
            this.datasource.fire(`${parser.mime}:setup`, { parser, section });
            onProgress('加入队列', 1, '-');
          }
        );
        console.log('audio parser section:', section);
      });
    }
    /*
    this.ui.addTransition(this.trackItem, transitionItem.dur, transitionItem, () => {
      // const menuElem = layerItem.querySelector(menuCss);
      // menuElem.classList.add('active');
      // console.log('sync add transition transitionItem:', transitionItem);
      // console.log('add transition layerItem:', layerItem);
      const section = this.parent.getSectionByItem(transitionItem.trackItem);
      this.datasource.fire('track:transition:add', { transition: transitionItem, section });
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
      audioHtml = '',
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
    const audioStyle = `width:${imgWidth}px;height:${imgHeight / 2}px;`;
    if (src) {
      audioHtml = `<audio src="${src}" style="${audioStyle}" controls="controls" title="${fileName}" alt="${fileName}"></audio>`;
    } else {
      audioHtml = `${this.makeSvgIcon(['active'], 'music', false)}`;
    }
    layerItem.setAttribute('id', layerItem.id);
    layerItem.className = `${this.cssPrefix}-media-item`;
    if ((fileWidth / imgWidth) * imgHeight > fileHeight) {
      imgStyle = `width:${imgWidth}px;`;
    } else {
      imgStyle = `height:${imgHeight}px;`;
    }
    imgStyle += `display:flex;align-items:center;justify-content:center;`;
    html = `<div style="${imgStyle}">${audioHtml}</div>`;
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
    // const onTransitionsLoaded = this._onTransitionsLoaded.bind(this);
    // this.datasource.on({
    //   'transitions:loaded': onTransitionsLoaded,
    // });
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

  _getParserByName(name) {
    let elemId;
    for (elemId in this.items) {
      if (this.items.hasOwnProperty(elemId)) {
        const parser = this.items[elemId];
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
    if (parser) {
      info = 'File[] had imported!';
      info = info.replace('[]', `[${name}]`);
      alert(info);
      this.iteratorLoad(cb);
    } else {
      const { type } = file;
      if (type.indexOf('video') >= 0 || type.indexOf('audio') >= 0) {
        this.datasource.fire('audio:load', { file });
      } else {
        info = 'File Type is Error';
        alert(info);
        this.iteratorLoad(cb);
      }
    }
  }

  _onFileChanged(event) {
    // const [file] = event.target.files;
    console.log('event.target.files:', event.target.files);
    this.__files = [];
    for (let i = 0, n = event.target.files.length; i < n; i += 1) {
      this.__files.push(event.target.files[i]);
    }
    this.iteratorLoad(() => {
      console.log('Nothing Done!!!!');
    });
  }

  _onAudioLoaded({ parser }) {
    if (parser) {
      this.counter += 1;
      const { previewUrl, srcFileName } = parser;

      const elem = this._appendItem(previewUrl, minItemWidth, minItemWidth / 2, srcFileName);
      this.items[elem] = parser;
    }
    this.iteratorLoad(() => {
      console.log('_onVideoLoaded is last file.');
    });
  }

  _addLoadEvent() {
    const onFileChanged = this._onFileChanged.bind(this);
    const onLoaded = this._onAudioLoaded.bind(this);
    const loadElement = this.mediaBody.querySelector(cls('.media-load-btn'));
    loadElement.addEventListener('change', onFileChanged);
    this.datasource.on('audio:loaded', onLoaded);
  }

  getTextureHtml() {
    return waveHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default WaveList;

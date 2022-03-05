import TextureUI from '@/ui/withtexture';
import waveHtml from '@/ui/template/texture/wavelist';
import templateHtml from '@/ui/template/submenu/wavelistmenu';
import itemHtml from '@/ui/template/texture/mediaitem';
import { cls } from '@/util';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 100;
const maxLabelHeight = 20;
const maxLineCount = 6;
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
      tbox: this.mediaBody.querySelector(cls('.media-layer-main-tbox>div')),
      bbox: this.mediaBody.querySelector(cls('.media-layer-main-bbox>div')),
    };
    this._handler = {
      onAddBtnClick: this._onAddBtnClick.bind(this),
      onDupBtnClick: this._onDupBtnClick.bind(this),
    };
    this.__files = [];
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
        if (this.activedItem) {
          // console.log('waveItem context:', this.activedItem.context);
          this.activedItem.dispose();
          const { elemId } = this.activedItem.context;
          this.remove({ elemId });
          // const parser = this.items[elemId];
          // if (parser) {
          //   this.datasource.fire('audio:remove', { parser });
          //   this.removeSubMenu(['delete']);
          //   parser.selected = false;
          //   this.deactiveElement(elemId);
          // }
        }
      },
      play: () => {
        if (this.activedItem) {
          // console.log('play activedItem :', this.activedItem);
          this.playAudio();
        }
      },
      pause: () => {
        this.pauseAudio();
      },
    };
  }

  remove({ elemId }) {
    const parser = this.items[elemId];
    if (parser) {
      this.datasource.fire('audio:remove', { parser });
      this.removeSubMenu(['delete']);
      parser.selected = false;
      this.deactiveElement(elemId);
    }
  }
  /*
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
  */

  adjustUI() {
    // const pad = 5;
    // const n = 4;
    // const aspect = 2 / 3; // H / W
    const aspect = 1 / this.textureAspect; // H / W
    const btnWidth = minItemWidth;

    // this.loadButton = this.mediaBody.querySelector(cls('.media-load-frame'));
    // this.loadButton.style.width = `${btnWidth}px`;
    // this.loadButton.style.height = `${btnWidth * aspect}px`;

    const loadBtns = this.mediaBody.querySelectorAll(cls('.media-load-frame'));
    loadBtns.forEach((element) => {
      element.style.width = `${btnWidth}px`;
      element.style.height = `${btnWidth * aspect}px`;
    });

    this._addLoadEvent();
  }

  setTrackItem(trackItem) {
    this.trackItem = trackItem;
  }

  setActivedWaveItem(activedItem) {
    this.activedItem = activedItem;
    if (activedItem) {
      const { elemId } = this.activedItem.context;
      this.focusItemElement(elemId);
      this.addSubMenu(['delete']);
    } else {
      this.removeSubMenu(['delete']);
    }
  }

  _changeStartMode() {
    this.addSubMenu(['back']);
    // this.datasource.fire('transitions:load', {});
    this.initDatas();
  }

  initDatas(callback) {
    if (!this.inited) {
      this.initCallback = callback;
      this.datasource.fire('wave:load', {});
    } else if (callback) {
      callback();
    }
  }

  _onWaveLoaded(data) {
    if (data) {
      this.inited = true;
      if (this.initCallback) {
        this.initCallback();
      }
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

  setupWave(parser, waveCfgItem, callback) {
    let { startAt, pos, elemId } = waveCfgItem;
    const { prevent } = waveCfgItem;
    const onProgress = this._onProgress.bind(this);

    if (!pos) {
      pos = 0;
    }
    if (!startAt) {
      startAt = 0;
    }
    if (!elemId) {
      const keys = Object.keys(this.items);
      for (let i = 0, n = keys.length; i < n; i += 1) {
        if (this.items[keys[i]] === parser) {
          elemId = keys[i];
          break;
        }
      }
    }
    if (parser && !parser.selected) {
      const duration = parser.total_seconds;
      const { srcFileName, fileType, isMain } = parser;
      parser.setup(onProgress).then((section) => {
        if (!waveCfgItem.duration) {
          waveCfgItem.duration = section.dur;
        }
        this.ui.timeLine.addWave(
          section.dur,
          [{ url: section.file.data }],
          {
            name: srcFileName,
            duration,
            elemId,
            fileType,
            section,
            isMain,
          },
          (item) => {
            const { index } = item.track;
            parser.selected = true;
            if (!prevent) {
              this.datasource.fire(`audio:setup`, {
                index,
                parser,
                section,
                range: item.timeRange,
                start: item.reComputeStart(),
                callback: () => {
                  item.changeDuration({
                    startAt,
                    pos,
                    dur: waveCfgItem.duration,
                    callback,
                  });
                },
              });
            } else if (callback) {
              callback();
            }
            onProgress('加入队列', 1, '-');
          }
        );
      });
    }
  }

  _onDupBtnClick(event) {
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
    const parser = this.items[elemId];
    if (parser) {
      const _parser = parser.copy();
      if (_parser) {
        this.counter += 1;
        const { previewUrl, srcFileName } = _parser;
        _parser.isMain = parser.isMain;
        const elem = this._appendItem(
          previewUrl,
          minItemWidth,
          minItemWidth / 2,
          srcFileName,
          _parser.isMain
        );
        this.items[elem] = _parser;
      }
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
    const startAt = this.trackItem.start;
    const pos = 0;
    const elemId = dataset.id;

    const parser = this.items[elemId];
    console.log('wavelist _onAddBtnClick parser selected:', parser.selected);
    // const onProgress = this._onProgress.bind(this);
    if (parser && !parser.selected) {
      this.setupWave(parser, { elemId, startAt, pos });
      this.activeElement(elemId);
    } else {
      this.getUI().timeLine.fire('track:wave:focus', { elemId });
    }
  }

  activeElement(elemId) {
    const menuCss = `.${this.cssPrefix}-item.check`;
    const allDataMenus = this._els.mainLayer.querySelectorAll(menuCss);
    for (let i = 0, n = allDataMenus.length; i < n; i += 1) {
      const dm = allDataMenus[i];
      const { id } = dm.querySelector('svg').dataset;
      if (id === elemId) {
        dm.classList.add('active');
        break;
      }
    }
  }

  deactiveElement(elemId) {
    const menuCss = `.${this.cssPrefix}-item.check`;
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

  pauseAudio() {
    const audioplayer = this._els.mainLayer.querySelector(`.${this.cssPrefix}-audio`);
    if (audioplayer) {
      audioplayer.pause();
      this.removeSubMenu(['pause']);
      if (this.activedItem) {
        this.addSubMenu(['play']);
      }
    }
  }

  playAudio() {
    if (this.activedItem) {
      const { elemId } = this.activedItem.context;
      const parser = this.items[elemId];
      const { previewUrl } = parser;
      this.removeSubMenu(['play']);
      this.addSubMenu(['pause']);
      const audioplayer = this._els.mainLayer.querySelector(`.${this.cssPrefix}-audio`);

      audioplayer.src = previewUrl;
      audioplayer.addEventListener('timeupdate', () => {
        // const percent = audioplayer.currentTime / audioplayer.duration;
        const diff = audioplayer.currentTime - this.activedItem.timeRange[0];
        const timePos = this.activedItem.start + diff;
        if (audioplayer.currentTime >= this.activedItem.timeRange[1]) {
          this.pauseAudio();
        }
        this.getUI().timeLine.changeTime(timePos);
      });
      audioplayer.addEventListener('ended', () => {
        this.pauseAudio();
      });
      const ct = this.getUI().timeLine.getCurrentTime();
      const gdiff = ct - this.activedItem.start;
      if (gdiff > 0 && gdiff < this.activedItem.getDuration()) {
        audioplayer.currentTime = this.activedItem.timeRange[0] + gdiff;
      } else {
        audioplayer.currentTime = this.activedItem.timeRange[0];
      }
      audioplayer.play();
    }
  }

  focusItemElement(elemId) {
    const bodyLayer = this._els.mainLayer;
    const allItems = bodyLayer.querySelectorAll(`.${this.cssPrefix}-media-item`);
    allItems.forEach((elem) => {
      const id = elem.getAttribute('id');
      if (id && id.length > 0) {
        if (id === elemId) {
          elem.style.borderColor = 'white';
        } else {
          elem.style.borderColor = 'silver';
        }
      }
    });
  }

  _appendItem(src, fileWidth, fileHeight, fileName, isMain) {
    let imgStyle = '',
      labelStyle,
      btnStyle,
      audioHtml = '',
      html;
    let bodyLayer = this._els.mainLayer;
    if (!isMain) {
      bodyLayer = this._els.bbox;
    } else {
      bodyLayer = this._els.tbox;
    }

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
    layerItem.id = `waveItem_${this.counter}`;
    this.counter += 1;
    const audioStyle = `width:${imgWidth}px;height:${imgHeight / 2}px;margin-bottom:4px;`;

    layerItem.setAttribute('id', layerItem.id);
    layerItem.className = `${this.cssPrefix}-media-item`;
    if ((fileWidth / imgWidth) * imgHeight > fileHeight) {
      imgStyle = `width:${imgWidth}px;`;
    } else {
      imgStyle = `height:${imgHeight}px;`;
    }
    if (src) {
      audioHtml = `<audio src="${src}" style="${audioStyle}" controls="controls" title="${fileName}" alt="${fileName}"></audio>`;
      imgStyle += `display:flex;align-items:end;justify-content:center;`;
    } else {
      audioHtml = `${this.makeSvgIcon(['active'], 'music', false)}`;
      imgStyle += `display:flex;align-items:center;justify-content:center;`;
    }
    html = `<div style="${imgStyle}">${audioHtml}</div>`;
    html += `<div style="${labelStyle}">${fileName}</div>`;
    html += `<div style="${btnStyle}">`;
    html += `<ul style="float:left;" class="${this.cssPrefix}-menu" >`;
    html += `<li class="${this.cssPrefix}-item tight dup" `;
    html += `tooltip-content="${this.locale.localize('Duplicate')}">`;
    html += `${this.makeSvgIcon(['normal', 'active', 'hover'], 'duplicate', false)}`;
    html += `</li>`;
    html += `<li class="${this.cssPrefix}-item tight check" `;
    html += `tooltip-content="${this.locale.localize('Select')}">`;
    html += `${this.makeSvgIcon(['normal', 'active', 'hover'], 'check', false)}`;
    html += `</li>`;
    html += `</ul>`;
    // html += `<span style="float:right;" class="${this.cssPrefix}-menu check" >`;
    // html += `${this.makeSvgIcon(['normal', 'active', 'hover'], 'check', false)}`;
    // html += `</span>`;
    html += `</div>`;
    layerItem.style.width = `${width}px`;
    layerItem.style.height = `${height}px`;
    layerItem.innerHTML = itemHtml({ html, cssPrefix: this.cssPrefix });
    bodyLayer.appendChild(layerItem);
    const addElem = layerItem.querySelector(`.${this.cssPrefix}-item.check>svg`);
    addElem.setAttribute('data-id', layerItem.id);
    addElem.addEventListener('click', this._handler.onAddBtnClick);

    const dupElem = layerItem.querySelector(`.${this.cssPrefix}-item.dup>svg`);
    dupElem.setAttribute('data-id', layerItem.id);
    dupElem.addEventListener('click', this._handler.onDupBtnClick);

    return layerItem.id;
  }

  addDatasourceEvents() {}

  _onAddWaveFromTemplate({ parser, callback }) {
    this.initDatas(() => {
      this.counter += 1;
      const { previewUrl, srcFileName } = parser;
      const elem = this._appendItem(
        previewUrl,
        minItemWidth,
        minItemWidth / 2,
        srcFileName,
        parser.isMain
      );
      this.items[elem] = parser;
      this.setupWave(parser, { elemId: elem, startAt: 0, pos: 0, prevent: true }, callback);
      this.activeElement(elem);
    });
  }

  _onWaveActive({ item }) {
    if (this.actived) {
      console.log('_onWaveActive item:', item);
      this.setActivedWaveItem(item);
      this.removeSubMenu(['pause']);
      this.addSubMenu(['play']);
    }
  }

  _onWaveDeactive({ item }) {
    if (this.activedItem === item) {
      console.log('_onWaveActive item:', item);
      this.setActivedWaveItem(null);
      this.removeSubMenu(['play', 'pause']);
      this.pauseAudio();
    }
  }

  _onWaveScaled({ range, context }) {
    const { elemId } = context;
    const parser = this.items[elemId];
    if (parser) {
      parser.range = range;
    }
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
    let isMain = true;
    const classNames = event.target.getAttribute('class');
    if (classNames.indexOf('slave') >= 0) {
      isMain = false;
    }
    console.log('event.target.files:', event.target.files, ',isMain:', isMain);
    this.__files = [];
    for (let i = 0, n = event.target.files.length; i < n; i += 1) {
      const f = event.target.files[i];
      f.isMain = isMain;
      this.__files.push(event.target.files[i]);
    }
    this.iteratorLoad(() => {
      console.log('Nothing Done!!!!');
    });
  }

  _onAudioLoaded({ parser, file, callback }) {
    if (parser) {
      this.counter += 1;
      const { previewUrl, srcFileName } = parser;
      parser.isMain = file.isMain;
      const elem = this._appendItem(
        previewUrl,
        minItemWidth,
        minItemWidth / 2,
        srcFileName,
        file.isMain
      );
      this.items[elem] = parser;
    }
    this.iteratorLoad(() => {
      console.log('_onVideoLoaded is last file.');
      if (callback) {
        callback();
      }
    });
  }

  _addLoadEvent() {
    const onFileChanged = this._onFileChanged.bind(this);
    const onLoaded = this._onAudioLoaded.bind(this);
    const loadElement = this.mediaBody.querySelector(cls('.media-load-btn.main'));
    loadElement.addEventListener('change', onFileChanged);
    this.datasource.on('audio:loaded', onLoaded);
    const slaveLoadElement = this.mediaBody.querySelector(cls('.media-load-btn.slave'));
    if (slaveLoadElement) {
      slaveLoadElement.addEventListener('change', onFileChanged);
    }
  }

  _onDispose({ item }) {
    const { elemId } = item.context;
    this.remove({ elemId });
  }

  _onClear({ callback }) {
    this.ui.timeLine.wavetrack.clearAll();
    console.log('wave:clear in....');
    if (callback) {
      callback();
    }
    // const keys = Object.keys(this.items);
    // iterator(
    //   keys,
    //   (elemId, _idx, comeon) => {
    //     this.remove({
    //       elemId,
    //       callback: () => {
    //         comeon(true);
    //       },
    //     });
    //   },
    //   () => {
    //     this.ui.timeLine.wavetrack.clearAll();
    //     if (callback) {
    //       callback();
    //     }
    //   }
    // );
  }

  addEvents() {
    const onWaveActive = this._onWaveActive.bind(this);
    const onWaveDeactive = this._onWaveDeactive.bind(this);
    const onWaveScaled = this._onWaveScaled.bind(this);
    const onDispose = this._onDispose.bind(this);
    this.getUI().timeLine.on({
      'slip:wave:selected': onWaveActive,
      'slip:wave:deselected': onWaveDeactive,
      'track:wave:scale': onWaveScaled,
      'track:wave:ui:remove': onDispose,
    });
    const onClear = this._onClear.bind(this);
    // sync:main:wave
    const onAddWaveFromTemplate = this._onAddWaveFromTemplate.bind(this);
    const onWaveLoaded = this._onWaveLoaded.bind(this);
    this.datasource.on({
      'sync:main:wave': onAddWaveFromTemplate,
      'wave:loaded': onWaveLoaded,
      'wave:clear': onClear,
    });
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

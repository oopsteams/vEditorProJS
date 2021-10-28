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
          const parser = this.items[elemId];
          if (parser) {
            this.datasource.fire('audio:remove', { parser });
            this.removeSubMenu(['delete']);
          }
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
  }

  setActivedWaveItem(activedItem) {
    this.activedItem = activedItem;
    if (activedItem) {
      this.addSubMenu(['delete']);
    } else {
      this.removeSubMenu(['delete']);
    }
  }

  _changeStartMode() {
    this.addSubMenu(['back']);
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
    this.activeElement(elemId);
    const parser = this.items[elemId];
    console.log('wavelist _onAddBtnClick parser:', parser);
    const onProgress = this._onProgress.bind(this);
    if (parser && !parser.selected) {
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
            this.datasource.fire(`audio:setup`, { parser, section });
            onProgress('加入队列', 1, '-');
            parser.selected = true;
          }
        );
        console.log('audio parser section:', section);
      });
    } else {
      this.getUI().timeLine.fire('track:wave:focus', { elemId });
    }
  }

  activeElement(elemId) {
    const menuCss = `.${this.cssPrefix}-menu.check`;
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
    layerItem.id = `waveItem_${this.counter}`;
    this.counter += 1;
    const audioStyle = `width:${imgWidth}px;height:${imgHeight / 2}px;margin-bottom:5px;`;

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

  addDatasourceEvents() {}

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

  addEvents() {
    const onWaveActive = this._onWaveActive.bind(this);
    const onWaveDeactive = this._onWaveDeactive.bind(this);
    const onWaveScaled = this._onWaveScaled.bind(this);
    this.getUI().timeLine.on({
      'slip:wave:selected': onWaveActive,
      'slip:wave:deselected': onWaveDeactive,
      'track:wave:scale': onWaveScaled,
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

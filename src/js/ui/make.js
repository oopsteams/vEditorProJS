import TextureUI from '@/ui/withtexture';
// import snippet from 'tui-code-snippet';
import templateHtml from '@/ui/template/submenu/make';
import mediaHtml from '@/ui/template/texture/media';
import itemHtml from '@/ui/template/texture/mediaitem';
import Transitions from '@/ui/transitions';
import WaveList from './wavelist';
import TxtControl from './txtcontrol';
import AnimationControl from './animatecontrol';
import EmptyParser from './tools/emptyparser';
import SceneEffectControl from './sceneeffectcontrol';
import ForegroundEffectControl from './foregroundeffectcontrol';
import PipControl from './pipcontrol';
import { isSupportFileApi, cls } from '@/util';
import { SPECIAL_VALUES } from '@/consts';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 100;
const maxLabelHeight = 20;
const maxLineCount = 6;
const ItemBorderWeight = 4;
class Make extends TextureUI {
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
      name: 'make',
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
    this.parsers = {};
    this.__files = [];
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
    this.animationControl = new AnimationControl(subMenuElement, options);
    this.transitions = new Transitions(subMenuElement, options);
    this.waveList = new WaveList(subMenuElement, options);
    this.textTool = new TxtControl(subMenuElement, options);
    this.sceneEffect = new SceneEffectControl(subMenuElement, options);
    this.foregroundEffectControl = new ForegroundEffectControl(subMenuElement, options);
    this.pipControl = new PipControl(subMenuElement, options);
    this.subMenus = [];
    this.subMenus.push(this.transitions);
    this.subMenus.push(this.animationControl);
    this.subMenus.push(this.waveList);
    this.subMenus.push(this.textTool);
    this.subMenus.push(this.sceneEffect);
    this.subMenus.push(this.foregroundEffectControl);
    this.subMenus.push(this.pipControl);
    this._els = {
      mainLayer: this.mediaBody.querySelector(cls('.media-layer-main')),
    };
    subMenuElement.makeInstance = this;
    // this.setup();
    this.addEvents();
    this.buildActions();
    this.initData();
    // this.fixMenus = ['music', 'split', 'transition', 'separate', 'filter', 'animation'];
  }

  getTextureHtml() {
    return mediaHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }

  initData() {
    const parser = new EmptyParser(this.previewItemWidth, this.previewItemHeight);
    const elem = this._appendItem(null, 0, 0, '');
    parser._elemId = elem;
    this.parsers[elem] = parser;
  }

  adjustUI() {
    // const pad = 5;
    // const n = 4;
    // const aspect = 2 / 3; // H / W
    const aspect = 1 / this.textureAspect; // H / W
    this.loadButton = this.mediaBody.querySelector(cls('.media-load-frame'));
    // const width = this.textureLayer.clientWidth;
    // const btnWidth = (width - pad * (n + 1)) / n;
    const btnWidth = minItemWidth;
    this.loadButton.style.width = `${btnWidth}px`;
    this.loadButton.style.height = `${btnWidth * aspect}px`;
    this._addLoadEvent();
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
    // console.log('onFileChanged file:', file);
    const parser = this._getParserByName(name);
    if (parser) {
      info = 'File[] had imported!';
      info = info.replace('[]', `[${name}]`);
      alert(info);
      this.iteratorLoad(cb);
    } else {
      const { type } = file;
      if (type.indexOf('video') >= 0) {
        this.datasource.fire('video:load', { file });
      } else if (type.indexOf('image') >= 0) {
        this.datasource.fire('image:load', { file });
      } else {
        info = 'File Type is Error';
        alert(info);
        this.iteratorLoad(cb);
      }
    }
  }

  _onFileChanged(event) {
    // const [file] = event.target.files;
    if (!isSupportFileApi()) {
      alert('This browser does not support file-api');
    }
    // console.log('event.target.files:', event.target.files);
    this.__files = [];
    for (let i = 0, n = event.target.files.length; i < n; i += 1) {
      this.__files.push(event.target.files[i]);
    }
    this.iteratorLoad(() => {
      console.log('Nothing Done!!!!');
    });
  }

  _getParserByFileData(data) {
    const keys = Object.keys(this.parsers);
    for (let i, n = keys.length; i < n; i += 1) {
      const parser = this.parsers[keys[i]];
      if (parser.section && parser.section.file.data === data) {
        return parser;
      }
    }

    return null;
  }

  _getParserByName(name) {
    let elemId;
    for (elemId in this.parsers) {
      if (this.parsers.hasOwnProperty(elemId)) {
        const parser = this.parsers[elemId];
        if (parser.srcFileName === name) {
          return parser;
        }
      }
    }

    return null;
  }

  _addLoadEvent() {
    const onFileChanged = this._onFileChanged.bind(this);
    const onLoaded = this._onVideoLoaded.bind(this);
    const onImageLoaded = this._onImageLoaded.bind(this);
    const loadElement = this.mediaBody.querySelector(cls('.media-load-btn'));
    loadElement.addEventListener('change', onFileChanged);
    this.datasource.on('video:loaded', onLoaded);
    this.datasource.on('image:loaded', onImageLoaded);
  }

  _onVideoLoaded({ parser }) {
    if (parser) {
      this.counter += 1;
      const { snapshot, snapshotWidth, snapshotHeight, srcFileName } = parser;
      const elem = this._appendItem(snapshot, snapshotWidth, snapshotHeight, srcFileName);
      parser._elemId = elem;
      this.parsers[elem] = parser;
    }
    this.iteratorLoad(() => {
      // console.log('_onVideoLoaded is last file.');
      this.datasource.fire('source:loaded', { parser });
    });
  }

  _onImageLoaded({ parser }) {
    if (parser) {
      this.counter += 1;
      const { snapshot, snapshotWidth, snapshotHeight, srcFileName } = parser;
      const elem = this._appendItem(snapshot, snapshotWidth, snapshotHeight, srcFileName);
      parser._elemId = elem;
      this.parsers[elem] = parser;
    }
    this.iteratorLoad(() => {
      // console.log('_onImageLoaded is last file.');
      this.datasource.fire('source:loaded', { parser });
    });
  }

  tryPlay() {
    this.datasource.fire('try:play', {
      callback: () => {
        this.removeSubMenu(['pause']);
        this.addSubMenu(['play']);
      },
      syncTime: true,
    });
    this.removeSubMenu(['play']);
    this.addSubMenu(['pause']);
  }

  pausePlay() {
    this.datasource.fire('try:play:pause', {});
    this.removeSubMenu(['pause']);
    this.addSubMenu(['play']);
  }

  setupParser({ parser, sourceSection, prevent, callback }) {
    let duration = 0,
      section = null;
    const quality = 20;
    const vW = parser.metadata.width;
    const vH = parser.metadata.height;
    const outWidth = this.previewItemWidth;
    const outHeight = Math.floor((outWidth * vH) / vW);
    const onProgress = this._onProgress.bind(this);
    const elemId = parser._elemId;
    if (parser.mime === 'image' || parser.mime === 'none') {
      if (parser.updateDuation) {
        parser.updateDuation(SPECIAL_VALUES.Duration);
      }
      console.log('parser.total_seconds:', parser.total_seconds);
      console.log('SPECIAL_VALUES.Duration:', SPECIAL_VALUES.Duration);
      if (sourceSection) {
        parser.updateDuation(sourceSection.dur);
      }
    }
    // console.log('setupParser mime:', parser.mime);
    parser.parseKeyFrameImages(outWidth, outHeight, quality, onProgress).then((result) => {
      if (result) {
        // console.log('parseKeyFrameImages result:', result);
        duration = parser.total_seconds;
        if (sourceSection) {
          duration = sourceSection.dur;
        }
        const { srcFileName, fileType } = parser;
        onProgress('加入队列', 0.1, '-');
        parser.setup(prevent).then((__section) => {
          section = __section;
          if (sourceSection) {
            section = sourceSection;
          }
          console.log(
            'new __section:',
            __section,
            ',prevent:',
            prevent,
            ',sourceSection:',
            sourceSection
          );
          section.dur = duration;
          this.ui.addVideoFrames(
            duration,
            result,
            {
              name: srcFileName,
              duration,
              elemId,
              fileType,
              section,
              width: outWidth,
              height: outHeight,
            },
            () => {
              if (sourceSection && sourceSection.uid) {
                section.uid = sourceSection.uid;
              }
              if (!prevent) {
                this.datasource.fire(`${parser.mime}:setup`, { parser, section });
              }
              onProgress('加入队列', 1, '-');
              if (callback) {
                callback();
              }
            }
          );
        });
      } else if (callback) {
        callback();
      }
    });
  }

  _onAddTrackFromTemplate({ type, section: _section, parser, callback }) {
    let find = false,
      elem;
    console.log('_onAddTrackFromTemplate type:', type, ',_section:', _section);
    const keys = Object.keys(this.parsers);
    if (type === 'empty') {
      for (let i = 0, n = keys.length; i < n; i += 1) {
        const p = this.parsers[keys[i]];
        if (p.mime === 'none') {
          find = true;
          this.setupParser({ parser: p, sourceSection: _section, prevent: true, callback });
          break;
        }
      }
      if (!find && callback) {
        callback();
      }
    } else {
      for (let i = 0, n = keys.length; i < n; i += 1) {
        elem = keys[i];
        const p = this.parsers[elem];
        if (p === parser) {
          find = true;
          break;
        }
      }
      if (!find) {
        this.counter += 1;
        const { snapshot, snapshotWidth, snapshotHeight, srcFileName } = parser;
        elem = this._appendItem(snapshot, snapshotWidth, snapshotHeight, srcFileName);
        parser._elemId = elem;
        this.parsers[elem] = parser;
      }

      this.setupParser({ parser, sourceSection: _section, prevent: true, callback });
    }
  }

  _onAddBtnClick(event) {
    // let outWidth, outHeight, dataset;
    let dataset;
    // const onProgress = this._onProgress.bind(this);
    const { tagName } = event.target;
    if (tagName === 'use') {
      dataset = event.target.parentNode.dataset;
    } else if (tagName === 'svg') {
      dataset = event.target.dataset;
    } else {
      return;
    }
    const elemId = dataset.id;
    const parser = this.parsers[elemId];
    if (parser) {
      this.setupParser({ parser });
    } else {
      console.log('can not find parser:', elemId);
    }
  }

  _appendItem(src, fileWidth, fileHeight, fileName) {
    let imgStyle = '',
      labelStyle,
      btnStyle,
      imgHtml,
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
    layerItem.id = `mediaItem_${this.counter}`;
    layerItem.setAttribute('id', layerItem.id);
    layerItem.className = `${this.cssPrefix}-media-item`;
    const imgWrapStyle = `display:flex;align-items:center;justify-content:center;`;
    if (src) {
      if ((fileWidth / imgWidth) * imgHeight > fileHeight) {
        imgStyle = `width:${imgWidth}px;`;
      } else {
        imgStyle = `height:${imgHeight}px;`;
      }
      imgHtml = `<img src="${src}" style="${imgStyle}" title="${fileName}" alt="${fileName}" />`;
    } else {
      imgHtml = `${this.locale.localize('Empty')}`;
    }
    html = `<div style="${imgWrapStyle}">${imgHtml}</div>`;
    html += `<div style="${labelStyle}">${fileName}</div>`;
    html += `<div style="${btnStyle}">`;
    html += `<span style="float:right;" class="${this.cssPrefix}-menu add">`;
    html += `${this.makeSvgIcon(['normal', 'active', 'hover'], 'load', false)}`;
    html += `</span></div>`;
    layerItem.style.width = `${width}px`;
    layerItem.style.height = `${height}px`;
    layerItem.innerHTML = itemHtml({ html, cssPrefix: this.cssPrefix });
    this._els.mainLayer.appendChild(layerItem);
    const addElem = layerItem.querySelector(`.${this.cssPrefix}-menu.add>svg`);
    addElem.setAttribute('data-id', layerItem.id);
    addElem.addEventListener('click', onAddBtnClick);

    return layerItem.id;
  }

  _onItemScaled({ range, context, callback }) {
    const { elemId, section } = context;
    console.log('make js elemId:', elemId);
    const parser = this.parsers[elemId];
    if (parser && parser.section) {
      this.datasource.fire('track:item:scale', { section, range, callback });
    }
  }

  _onItemSorted({ start, range, context }) {
    const { elemId, section } = context;
    const parser = this.parsers[elemId];
    if (parser && parser.section) {
      this.datasource.fire('track:item:sorted', { start, section, range });
    }
  }

  _onTransitionDispose({ item }) {
    // console.log('transition dispose:', transition);
    this.transitions.remove(item.context);
  }

  _onDispose({ item }) {
    const { elemId, section } = item.context;
    this.remove({ elemId, section });
  }

  getSectionByItem(trackItem) {
    console.log('getSectionByItem trackItem:', trackItem);
    if (trackItem) {
      const { section } = trackItem.context;

      return section;
    }

    return null;
  }

  remove({ elemId, section }) {
    const parser = this.parsers[elemId];
    if (parser) {
      this.datasource.fire('track:item:remove', { section });
    }
  }

  buildActions() {
    this.actions = {
      delete: () => {
        if (this.activedItem.name === 'item') {
          const { elemId, section } = this.activedItem.context;
          const { track } = this.activedItem;
          this.activedItem.dispose();
          this.remove({ elemId, section });

          if (track.isEmpty()) {
            // this.fixMenus.splice(0, 1);
            this.removeSubMenu(['music', 'transition', 'text', 'transition']);
          } else {
            // this.fixMenus.push('music');
            this.addSubMenu(['music']);
          }
        } else if (this.activedItem.name === 'transition') {
          const { activedItem } = this;
          this.transitions.remove(activedItem.context);
          activedItem.dispose();
        }
      },
      transition: () => {
        const { activedItem } = this;
        const { elemId } = activedItem.context;
        const parser = this.parsers[elemId];
        if (parser) {
          // const { section } = parser;
          this.transitions.setTrackItem(activedItem);
          // this.ui.timeLine.track.lock();
          this.changeStandbyMode();
          this.transitions.changeStartMode();
        }
      },
      music: () => {
        const { activedItem } = this;
        this.ui.timeLine.showTrack(['wave']);
        // const { elemId } = activedItem.context;
        // const parser = this.parsers[elemId];
        this.waveList.setTrackItem(activedItem);
        this.changeStandbyMode();
        this.waveList.changeStartMode();
      },
      text: () => {
        const { activedItem } = this;
        console.log('text menu...');
        this.ui.timeLine.showDynamicTrack(['text']);
        this.textTool.setTrackItem(activedItem);
        this.changeStandbyMode();
        this.textTool.changeStartMode();
      },
      animation: () => {
        const { activedItem } = this;
        this.ui.timeLine.showTrack(['animation']);
        console.log('animation menu...');
        this.animationControl.setTrackItem(activedItem);
        this.changeStandbyMode();
        this.animationControl.changeStartMode();
      },
      sceneeffect: () => {
        const { activedItem } = this;
        this.ui.timeLine.showTrack(['se']);
        this.sceneEffect.setTrackItem(activedItem);
        this.changeStandbyMode();
        this.sceneEffect.changeStartMode();
      },
      foreground: () => {
        console.log('backcanvas in....');
        const { activedItem } = this;
        this.foregroundEffectControl.setTrackItem(activedItem);
        this.changeStandbyMode();
        this.foregroundEffectControl.changeStartMode();
      },
      pip: () => {
        const { activedItem } = this;
        this.ui.timeLine.showDynamicTrack(['pip']);
        this.pipControl.setTrackItem(activedItem);
        this.changeStandbyMode();
        this.pipControl.changeStartMode();
      },
      play: () => {
        this.tryPlay();
      },
      pause: () => {
        this.pausePlay();
      },
    };
  }

  _changeStartMode() {
    if (this.ui.timeLine) {
      this.ui.timeLine.unlock();
      console.log('_changeStartMode track:', this.ui.timeLine.track);
      if (this.ui.timeLine.track) {
        this.ui.timeLine.track.focus();
      }
    }
  }

  _changeStandbyMode() {
    this.subMenus.forEach((sm) => {
      sm.changeStandbyMode();
    });
  }

  _onWaveActive({ item }) {
    if (this.actived) {
      this.waveList.setActivedWaveItem(item);
      this.changeStandbyMode();
      this.waveList.changeStartMode();
    }
  }

  _onItemDeactive() {}

  _onClear({ callback }) {
    this.ui.timeLine.track.clearAll();
    if (callback) {
      callback();
    }
  }

  activeMenu({ item, isLast }) {
    const menuNames = ['music'];
    this.pausePlay();
    if (item.name === 'item') {
      menuNames.push('delete');
      menuNames.push('text');
      menuNames.push('animation');
      menuNames.push('sceneeffect');
      menuNames.push('foreground');
      menuNames.push('pip');
      if (!isLast) {
        menuNames.push('transition');
      } else {
        this.removeSubMenu(['transition']);
      }
      this.addSubMenu(menuNames);
      // this.disableSubmenus(menuNames);
    } else if (item.name === 'transition') {
      menuNames.push('delete');
      // this.disableSubmenus(menuNames);
      this.addSubMenu(menuNames);
      this.removeSubMenu(['transition', 'animation']);
    }
    console.log('activeMenu menuNames:', menuNames);
  }

  addEvents() {
    const onItemScaled = this._onItemScaled.bind(this);
    const onItemSorted = this._onItemSorted.bind(this);
    const onTransitionDispose = this._onTransitionDispose.bind(this);
    const onDispose = this._onDispose.bind(this);
    const onWaveActive = this._onWaveActive.bind(this);
    const onItemActive = this._onItemActive.bind(this);
    const onItemDeactive = this._onItemDeactive.bind(this);
    this.getUI().timeLine.on({
      'track:item:scale': onItemScaled,
      'track:item:sorted': onItemSorted,
      'track:item:active': onItemActive,
      'track:transition:dispose': onTransitionDispose,
      'slip:wave:selected': onWaveActive,
      'slip:item:selected': onItemActive,
      'slip:item:deselected': onItemDeactive,
      'track:ui:remove': onDispose,
    });
    const onAddTrackFromTemplate = this._onAddTrackFromTemplate.bind(this);
    const onClear = this._onClear.bind(this);
    this.datasource.on({
      'sync:main:track:section': onAddTrackFromTemplate,
      'track:clear': onClear,
    });
  }
}

export default Make;

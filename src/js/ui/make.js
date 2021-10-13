import TextureUI from '@/ui/withtexture';
// import snippet from 'tui-code-snippet';
import templateHtml from '@/ui/template/submenu/make';
import mediaHtml from '@/ui/template/texture/media';
import itemHtml from '@/ui/template/texture/mediaitem';
import Transitions from '@/ui/transitions';
import WaveList from './wavelist';

import { isSupportFileApi, cls } from '@/util';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 120;
const maxLabelHeight = 20;
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
    this.previewItemWidth = previewItemWidth;
    this.previewItemHeight = previewItemHeight;
    this.transitions = new Transitions(subMenuElement, {
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
    });
    this.waveList = new WaveList(subMenuElement, {
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
    });
    this.subMenus = [];
    this.subMenus.push(this.transitions);
    this._els = {
      mainLayer: this.mediaBody.querySelector(cls('.media-layer-main')),
    };
    // this.setup();
    this.addEvents();
    this.buildActions();
    // this.fixMenus = ['music'];
    this.fixMenus = ['music', 'split', 'transition', 'separate', 'filter', 'animation'];
  }

  getTextureHtml() {
    return mediaHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
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
    console.log('onFileChanged file:', file);
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
    console.log('event.target.files:', event.target.files);
    this.__files = [];
    for (let i = 0, n = event.target.files.length; i < n; i += 1) {
      this.__files.push(event.target.files[i]);
    }
    this.iteratorLoad(() => {
      console.log('Nothing Done!!!!');
    });
    // if (file && file.name) {
    //   const { name } = file;
    //   console.log('onFileChanged file:', file);
    //   const parser = this._getParserByName(name);
    //   if (parser) {
    //     info = 'File[] had imported!';
    //     info = info.replace('[]', `[${name}]`);
    //     alert(info);
    //   } else {
    //     const { type } = file;
    //     if (type.indexOf('video') >= 0) {
    //       this.datasource.fire('video:load', { file });
    //     } else if (type.indexOf('image') >= 0) {
    //       this.datasource.fire('image:load', { file });
    //     } else {
    //       info = 'File Type is Error';
    //       alert(info);
    //     }
    //   }
    // }
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
      this.parsers[elem] = parser;
    }
    this.iteratorLoad(() => {
      console.log('_onVideoLoaded is last file.');
    });
  }

  _onImageLoaded({ parser }) {
    if (parser) {
      this.counter += 1;
      const { snapshot, snapshotWidth, snapshotHeight, srcFileName } = parser;
      const elem = this._appendItem(snapshot, snapshotWidth, snapshotHeight, srcFileName);
      this.parsers[elem] = parser;
    }
    this.iteratorLoad(() => {
      console.log('_onImageLoaded is last file.');
    });
  }

  _onAddBtnClick(event) {
    let outWidth, outHeight, dataset;
    const onProgress = this._onProgress.bind(this);
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
      const quality = 20;
      const vW = parser.metadata.width;
      const vH = parser.metadata.height;
      // const aspect = this.previewItemWidth / this.previewItemHeight;
      // if (vW / vH > aspect) {
      //   outWidth = this.previewItemWidth;
      //   outHeight = Math.floor((outWidth * vH) / vW);
      // } else {
      //   outHeight = this.previewItemHeight;
      //   outWidth = Math.floor((outHeight * vW) / vH);
      // }
      outWidth = this.previewItemWidth;
      outHeight = Math.floor((outWidth * vH) / vW);
      parser.parseKeyFrameImages(outWidth, outHeight, quality, onProgress).then((result) => {
        if (result) {
          console.log('parseKeyFrameImages result:', result);
          const duration = parser.total_seconds;
          const { srcFileName, fileType } = parser;
          onProgress('加入队列', 0.1, '-');
          parser.setup().then((section) => {
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
                this.datasource.fire(`${parser.mime}:setup`, { parser, section });
                onProgress('加入队列', 1, '-');
              }
            );
          });
        }
      });
    } else {
      console.log('can not find parser:', elemId);
    }
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
    layerItem.id = `mediaItem_${this.counter}`;
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

  _onItemScaled({ range, context }) {
    const { elemId, section } = context;
    console.log('make js elemId:', elemId);
    const parser = this.parsers[elemId];
    if (parser && parser.section) {
      this.datasource.fire('track:item:scale', { section, range });
    }
  }

  _onItemSorted({ start, range, context }) {
    const { elemId, section } = context;
    const parser = this.parsers[elemId];
    if (parser && parser.section) {
      this.datasource.fire('track:item:sorted', { start, section, range });
    }
  }

  _onTransitionDispose({ transition }) {
    console.log('transition dispose:', transition);
  }

  getSectionByItem(trackItem) {
    console.log('getSectionByItem trackItem:', trackItem);
    const { section } = trackItem.context;
    // const parser = this.parsers[elemId];
    // if (parser) {
    //   const { section } = parser;

    //   return section;
    // }

    return section;
  }

  buildActions() {
    this.actions = {
      delete: () => {
        if (this.activedItem.name === 'item') {
          const { elemId, section } = this.activedItem.context;
          const { track } = this.activedItem;
          this.activedItem.dispose();
          const parser = this.parsers[elemId];
          if (parser) {
            this.datasource.fire('track:item:remove', { section });
          }
          if (!track.isEmpty()) {
            this.fixMenus.splice(0, 1);
          } else {
            this.fixMenus.push('music');
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
          this.ui.timeLine.track.lock();
          this.changeStandbyMode();
          this.transitions.changeStartMode();
        }
      },
      music: () => {
        const { activedItem } = this;
        // const { elemId } = activedItem.context;
        // const parser = this.parsers[elemId];
        this.waveList.setTrackItem(activedItem);
        this.changeStandbyMode();
        this.waveList.changeStartMode();
      },
    };
  }

  _changeStartMode() {
    if (this.ui.timeLine) {
      this.ui.timeLine.unlock();
    }
  }

  _changeStandbyMode() {
    this.subMenus.forEach((sm) => {
      sm.changeStandbyMode();
    });
  }

  activeMenu({ item, isLast }) {
    const menuNames = [];
    this.fixMenus.forEach((fm) => {
      menuNames.push(fm);
    });
    if (item.name === 'item') {
      menuNames.push('delete');
      if (!isLast) {
        menuNames.push('transition');
      }
      this.disableSubmenus(menuNames);
    } else if (item.name === 'transition') {
      menuNames.push('delete');
      this.disableSubmenus(menuNames);
    }
  }

  addEvents() {
    const onItemScaled = this._onItemScaled.bind(this);
    const onItemSorted = this._onItemSorted.bind(this);
    const onTransitionDispose = this._onTransitionDispose.bind(this);
    this.ui.timeLine.on({
      'track:item:scale': onItemScaled,
      'track:item:sorted': onItemSorted,
      'track:transition:dispose': onTransitionDispose,
    });
  }
}

export default Make;

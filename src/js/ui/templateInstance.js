import TextureUI from '@/ui/withtexture';
import sourceHtml from '@/ui/template/texture/templateSource';
import templateHtml from '@/ui/template/submenu/templatemenu';
import itemHtml from '@/ui/template/texture/mediaitem';
import { cls, iterator } from '@/util';
// import { eventNames, selectorNames } from '@/consts';
const minItemWidth = 100;
// const maxLabelHeight = 20;
const ItemBorderWeight = 4;

class TemplateInstance extends TextureUI {
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
      name: 'templateInstance',
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
    this.items = {};
    this.makeparsers = {};
    this.parent = parent;
    this.currentElemId = null;
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
      confirm: () => {
        console.log('confirm template import to editor!');
        this.datasource.fire('clean:render', {
          callback: () => {
            this.ui.timeLine.clearTracks();
            this.itemKeys = Object.keys(this.items);
            this.pos = 0;
            this.installEditor();
          },
        });
      },
    };
  }

  installWave() {
    const { bgm } = this.sectionItem.template;
    const { waveList } = this.subMenuElement.makeInstance;
    if (bgm) {
      waveList._onAudioLoaded({
        parser: bgm,
        callback: () => {
          waveList.setupWave(bgm);
        },
      });
    }
  }

  installTextEffect() {
    console.log('installTextEffect sectionItem:', this.sectionItem);
    const { sections } = this.sectionItem.template;
    const commonSections = [];
    const effectSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      } else if (sec.action === 'text') {
        effectSections.push(sec);
      }
    });
    const { textTool } = this.subMenuElement.makeInstance;
    const setupTextEffect = () => {
      iterator(
        effectSections,
        (sec, index, comeon) => {
          console.log('effect sec:', sec);
          if (index >= 0) {
            const { textSections } = sec;
            const [firstTextSection] = textSections;
            console.log('firstTextSection:', firstTextSection);
            textTool.setupText(firstTextSection, () => {
              textSections.forEach((ts, idx) => {
                if (idx > 0) {
                  textTool.addSection(ts);
                }
              });
              comeon(true);
            });
          }
        },
        () => {
          this.installAnimations();
        }
      );
    };
    setupTextEffect();
  }

  installAnimations() {
    const { sections } = this.sectionItem.template;
    const commonSections = [];
    const effectSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      } else if (sec.action === 'text') {
        effectSections.push(sec);
      }
    });
    const { animationControl } = this.subMenuElement.makeInstance;
    const setupAnimations = () => {
      iterator(
        commonSections,
        (item, idx, comeon) => {
          if (idx >= 0) {
            if (item.animations && item.animations.length > 0) {
              const trackItem = this.ui.timeLine.track.getItemByUid(item.uid);
              // item.animations.forEach((animation) => {
              //   const { mode } = animation;
              //   const animationSection = animationControl.getAnimationSectionByMode(mode);
              // });
              iterator(
                item.animations,
                (animation, _idx, _comeon) => {
                  if (_idx >= 0) {
                    const { mode } = animation;
                    const animationSection = animationControl.getAnimationSectionByMode(mode);
                    animationControl.setupAnimation(trackItem, animationSection, () => {
                      _comeon(true);
                    });
                  }
                },
                () => {
                  comeon(true);
                }
              );
            } else {
              comeon(true);
            }
          }
        },
        () => {
          console.log('installAnimations complete!');
          this.installWave();
        }
      );
    };

    if (!animationControl.inited) {
      animationControl.initDatas(() => {
        setupAnimations();
      });
    } else {
      setupAnimations();
    }
  }

  installTransition() {
    const { sections } = this.sectionItem.template;
    const transitionSections = [];
    const commonSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      } else if (sec.action === 'transition') {
        transitionSections.push(sec);
      }
    });
    /*
    const itemKeys = Object.keys(this.items);
    const getCommonKeyByUid = (uid) => {
      for (let i = 0, n = itemKeys.length; i < n; i += 1) {
        const item = this.items[itemKeys[i]];
        if (item.uid === uid) {
          return itemKeys[i];
        }
      }

      return null;
    };
    */
    console.log('installTransition transitionSections:', transitionSections);
    const { transitions } = this.subMenuElement.makeInstance;
    const setupTransitions = () => {
      iterator(
        transitionSections,
        (tran, idx, comeon) => {
          if (idx >= 0) {
            console.log('tran:', tran);
            const { mode } = tran;
            // const key = getCommonKeyByUid(tran.pre);
            // const makeParser = this.makeparsers[key];
            // console.log('key:', key, ',parser:', makeParser);
            const trackItem = this.ui.timeLine.track.getItemByUid(tran.pre);
            console.log('trackItem:', trackItem);
            const transitionSection = transitions.getTransitionSectionByMode(mode);
            console.log('transitionSection:', transitionSection);
            transitions.setupTransition(trackItem, transitionSection, () => {
              comeon(true);
            });
          }
        },
        () => {
          console.log('setup complete!');
          this.installTextEffect();
        }
      );
    };
    if (!transitions.inited) {
      transitions.initDatas(() => {
        setupTransitions();
      });
    } else {
      setupTransitions();
    }
  }

  installEditor() {
    const { sections } = this.sectionItem.template;
    const commonSections = [];
    // const transitionSections = [];
    // const effectSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      }
    });
    // commonSections.forEach((item, index) => {

    // });
    // const keys = Object.keys(this.items);

    if (this.pos < this.itemKeys.length) {
      const eid = this.itemKeys[this.pos];
      const parser = this.makeparsers[eid];
      const sourceSection = this.items[eid];
      this.subMenuElement.makeInstance.setupParser({ parser, sourceSection });
    } else {
      iterator(
        commonSections,
        (sec, idx, comeon) => {
          if (idx >= 0) {
            const { dur } = sec;
            const trackItem = this.ui.timeLine.track.getItemByUid(sec.uid);
            console.log('installEditor trackItem:', trackItem);
            console.log('installEditor dur:', dur);
            const cDur = trackItem.getDuration();
            if (cDur !== dur) {
              const rRange = [trackItem.timeRange[0], trackItem.timeRange[0] + dur];
              trackItem.updateTimeRange(rRange, () => {
                console.log('installEditor comeon idx:', idx);
                comeon(true);
              });
            } else {
              console.log('installEditor comeon idx:', idx);
              comeon(true);
            }
          }
        },
        () => {
          console.log('will call installTransition.....');
          this.installTransition();
        }
      );
    }
  }

  _onParserSetuped() {
    this.pos += 1;
    this.installEditor();
  }

  cleanUI() {
    this._els.mainLayer.innerHTML = '';
    this.items = {};
    this.makeparsers = {};
  }

  initUI() {
    const { sections } = this.sectionItem.template;
    const commonSections = [];
    const transitionSections = [];
    const effectSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      } else if (sec.action === 'transition') {
        transitionSections.push(sec);
      } else if (sec.action === 'text') {
        effectSections.push(sec);
      }
    });
    commonSections.forEach((item, index) => {
      const elemId = this._appendItem(
        minItemWidth,
        minItemWidth / 2,
        `${item.dur}s`,
        this.sectionItem.id,
        index
      );
      this.items[elemId] = item;
      console.log('init ui elemId:', elemId);
    });
  }

  setItem(sectionItem) {
    if (this.sectionItem !== sectionItem) {
      this.cleanUI();
      this.sectionItem = sectionItem;
      console.log('sectionItem:', this.sectionItem);
      this.initUI();
    }
    if (this.checkInited()) {
      this.addSubMenu(['confirm']);
    } else {
      this.removeSubMenu(['confirm']);
    }
  }

  _changeStartMode() {
    this.addSubMenu(['back']);
    // this.datasource.fire('transitions:load', {});
  }

  checkInited() {
    let inited = true;
    let find = false;
    const keys = Object.keys(this.items);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      const eid = keys[i];
      console.log('checkInited eid:', eid);
      if (!this.makeparsers.hasOwnProperty(eid)) {
        inited = false;
        break;
      }
      find = true;
    }
    console.log('inited:', inited, ',find:', find);

    return inited && find;
  }

  resetUI(parser) {
    // let imgStyle;
    const { snapshot, snapshotWidth, snapshotHeight } = parser;
    const { imgWidth, imgHeight } = this;
    const itemElem = this._els.mainLayer.querySelector(`#${this.currentElemId}`);
    if (itemElem) {
      const preview = itemElem.querySelector(cls('.preview'));
      preview.style.display = 'block';
      const imgElem = preview.querySelector('img');

      if ((snapshotWidth / imgWidth) * imgHeight > snapshotHeight) {
        imgElem.style.width = `${imgWidth}px`;
      } else {
        imgElem.style.height = `${imgHeight}px`;
      }
      imgElem.src = snapshot;
      this.makeparsers[this.currentElemId] = parser;
      if (this.checkInited()) {
        this.addSubMenu(['confirm']);
      } else {
        this.removeSubMenu(['confirm']);
      }
    }
  }

  _onFileChanged(event) {
    console.log('event.target.files:', event.target.files);
    console.log('event target:', event.target);
    console.log('event:', event);
    const __files = [];
    for (let i = 0, n = event.target.files.length; i < n; i += 1) {
      __files.push(event.target.files[i]);
    }
    const elem = event.target;
    const elemId = elem.getAttribute('data-id');
    this.currentElemId = elemId;
    console.log('elemId:', elemId);
    if (__files.length > 0) {
      const [file] = __files.splice(0, 1);
      const { name } = file;
      const { makeInstance } = this.subMenuElement;
      const parser = makeInstance._getParserByName(name);
      if (parser) {
        this.makeparsers[elemId] = parser;
        this.resetUI(parser);
      } else {
        const { type } = file;
        if (type.indexOf('video') >= 0) {
          this.datasource.fire('video:load', { file });
        } else if (type.indexOf('image') >= 0) {
          this.datasource.fire('image:load', { file });
        } else {
          const info = 'File Type is Error';
          alert(info);
        }
      }
    }
  }

  _onSourceLoaded({ parser }) {
    this.resetUI(parser);
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

  _appendItem(fileWidth, fileHeight, fileName, secId, itemId) {
    let imgStyle = '',
      labelStyle,
      html;
    // const onAddBtnClick = this._onAddBtnClick.bind(this);
    const boxSize = 2;
    const { width, height } = this.adjustItemSize(minItemWidth, 6);
    const imgWidth = width - ItemBorderWeight;
    const labelHeight = 0; // maxLabelHeight;
    const imgHeight = height - labelHeight - ItemBorderWeight - boxSize * 2;
    const labelWidth = imgWidth;

    labelStyle = `width:${labelWidth}px;color:#fff;`;
    labelStyle += `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
    labelStyle += `font-size:10px;`;
    // btnStyle = `width:${labelWidth}px;position:absolute;left:0;top:0;`;
    // btnStyle += `padding-right:2px;`;
    const layerItem = document.createElement('div');
    layerItem.id = `templateItem_${secId}_${itemId}`;
    layerItem.setAttribute('id', layerItem.id);
    layerItem.className = `${this.cssPrefix}-media-item`;
    this.imgWidth = imgWidth;
    this.imgHeight = imgHeight;
    if ((fileWidth / imgWidth) * imgHeight > fileHeight) {
      imgStyle = `width:${imgWidth}px;`;
    } else {
      imgStyle = `height:${imgHeight}px;`;
    }
    imgStyle += `display:flex;align-items:center;justify-content:center;cursor:pointer;`;
    html = `<div style="${imgStyle}">`;
    html += `<div class="${this.cssPrefix}-preview" style="position:absolute;left:0px;top:0px;"><img/></div>`;
    html += '<div>';
    html += `${this.makeSvgIcon(['normal', 'active', 'hover'], 'load', false)}`;
    html += `<div style="font-size:9px;">${this.locale.localize('Image Or Video')}</div>`;
    html += '</div>';
    html += `<input type="file" data-id="${layerItem.id}" class="${this.cssPrefix}-media-load-btn" 
    accept=".mp4,.webp,.jpeg,.png,.jpg"/>`;
    html += `</div>`;
    html += `<div style="${labelStyle}">${fileName}</div>`;
    layerItem.style.width = `${width}px`;
    layerItem.style.height = `${height}px`;
    layerItem.innerHTML = itemHtml({ html, cssPrefix: this.cssPrefix });
    this._els.mainLayer.appendChild(layerItem);
    // const addElem = layerItem.querySelector(`.${this.cssPrefix}-menu.check>svg`);
    // addElem.setAttribute('data-id', layerItem.id);
    // addElem.addEventListener('click', onAddBtnClick);
    const preview = layerItem.querySelector(cls('.preview'));
    preview.style.display = 'none';
    const onFileChanged = this._onFileChanged.bind(this);
    const loadElement = layerItem.querySelector(cls('.media-load-btn'));
    loadElement.addEventListener('change', onFileChanged);

    return layerItem.id;
  }

  addDatasourceEvents() {}

  activeMenu() {}

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

  /*
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
  */
  _onAudioLoaded({ parser }) {
    if (parser) {
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
    // const onLoaded = this._onAudioLoaded.bind(this);
    const loadElement = this.mediaBody.querySelector(cls('.media-load-btn'));
    loadElement.addEventListener('change', onFileChanged);
    // this.datasource.on('audio:loaded', onLoaded);
  }

  addEvents() {
    // this.getUI().timeLine.on({});
    const onSourceLoaded = this._onSourceLoaded.bind(this);
    const onParserSetuped = this._onParserSetuped.bind(this);
    this.datasource.on({
      'source:loaded': onSourceLoaded,
      'image:setuped': onParserSetuped,
      'video:setuped': onParserSetuped,
    });
  }

  getTextureHtml() {
    return sourceHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default TemplateInstance;

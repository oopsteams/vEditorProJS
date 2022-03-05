import snippet from 'tui-code-snippet';
import TextureUI from '@/ui/withtexture';
import textcfgHtml from '@/ui/template/texture/textcfg';
import templateHtml from '@/ui/template/submenu/texttoolmenu';
import textitemHtml from '@/ui/template/texture/textitem';

// import itemHtml from '@/ui/template/texture/mediaitem';
// import Colorpicker from '@/ui/tools/colorpicker';
import SvgColorpicker from './tools/svgcolorpicker';
import InputProxy from './tools/inputproxy';
import Range from '@/ui/tools/range';
import { isSupportFileApi, cls, colorReverse, roundValue, iterator } from '@/util';
// colorReverse
import {
  defaultTextRangeValues,
  defaultRotationRangeValues,
  defaultOpacityRangeValues,
  defaultRateRangeValues,
  SPECIAL_TAGS,
} from '@/consts';
const { extend } = snippet;
const minItemWidth = 100;
const maxDuration = 3;
// const maxLabelHeight = 20;
// const maxLineCount = 6;
// const ItemBorderWeight = 4;
const TrackEventPrefix = 'track:txt';
const SlipEventPrefix = 'slip:txt';

class TxtControl extends TextureUI {
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
      parent,
    }
  ) {
    super(subMenuElement, {
      locale,
      name: 'text',
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
    this.parent = parent;
    this._els = {
      mainLayer: this.mediaBody.querySelector(cls('.media-layer-main')),
      colorpicker: null,
      rbox: this.mediaBody.querySelector(cls('.media-layer-main-rbox')),
      lbox: this.mediaBody.querySelector(cls('.media-layer-main-lbox')),
      applyButton: this.mediaBody.querySelector('.tie-text-button.action'),
      shapeButtons: this.mediaBody.querySelectorAll('.shapes'),
    };
    this._els.infoInput = this._els.lbox.querySelector('.tie-text-input>input');
    this._els.familySelect = this._els.lbox.querySelector('.tie-text-selector.family>select');
    this._els.directionSelect = this._els.lbox.querySelector('.tie-text-selector.direction>select');
    this._els.modeCheckElement = this._els.lbox.querySelector('.tie-newtrack');
    const mainTextRangeOptions = extend({ skipListener: true }, defaultTextRangeValues);
    const mainRotationRangeOptions = extend({ skipListener: true }, defaultRotationRangeValues);
    this._els.textRange = new Range(
      {
        slider: this._els.lbox.querySelector('.tie-text-range'),
        input: this._els.lbox.querySelector('.tie-text-range-value'),
        cssPrefix,
      },
      mainTextRangeOptions
    );
    this._els.rotationRange = new Range(
      {
        slider: this._els.lbox.querySelector('.rotation-range'),
        input: this._els.lbox.querySelector('.rotation-range-value'),
        cssPrefix,
      },
      mainRotationRangeOptions
    );
    // this.colorPickerInputBox = this._els.textColorpicker.colorpickerElement.querySelector(
    //   selectorNames.COLOR_PICKER_INPUT_BOX
    // );
    this.subMenus = [];
    this.items = {};
    this.addEvents();
    this.selectedConfirm = false;
    this.cfg = {};
    this.updateCfg = {};
    // this.activedSubItem = null;
    this.activedSubItem = null;
    this.buildActions();
    this.__files = [];

    this.initGraphicEvents = false;

    this.trackItems = {};
    this.appliedShapes = {};
    this.setupSections = {};

    this.newTrackMode = true;
    this._initUI();
    this.sortIndex = 0;
    this._els.modeCheckElement.checked = this.newTrackMode;

    this._handler = {
      onEaseinChange: this.onEaseinChange.bind(this),
      onEaseoutChange: this.onEaseoutChange.bind(this),
      // _onItemColorChange: this._onItemColorChange.bind(this),
      onLockChange: this.onLockChange.bind(this),
      _onTextChange: this._onTextChange.bind(this),
      _onTextColorChange: this._onTextColorChange.bind(this),
      _onFamilyChange: this._onFamilyChange.bind(this),
      _onFontSizeChange: this._onFontSizeChange.bind(this),
      _onRotationChange: this._onRotationChange.bind(this),
      _onOpacityChange: this._onOpacityChange.bind(this),
      _onCenterClick: this._onCenterClick.bind(this),
      _onPosRateChange: this._onPosRateChange.bind(this),
      _onAttachChange: this._onAttachChange.bind(this),
    };

    this.subGroups = {};
  }

  getSortIndex() {
    const si = this.sortIndex;
    this.sortIndex += 1;

    return si;
  }

  adjustUI() {
    const btnWidth = minItemWidth;
    const newtrack = this.mediaBody.querySelector(cls('.checkbox-wrap'));
    newtrack.style.width = `${btnWidth}px`;
    // const leftbox = this.mediaBody.querySelector(cls('.media-layer-main-lbox'));
    // leftbox.style.width = '40%';
  }

  _syncSubGroupEasein({ section, value, className, callback }) {
    if (section.tag) {
      const subGroup = this.subGroups[section.tag];
      if (subGroup) {
        const { sections, items } = subGroup;
        const keys = Object.keys(sections);
        iterator(
          keys,
          (key, _idx, comeon) => {
            const sec = sections[key];
            const item = items[key];
            const { index } = item.track;
            sec.easein = value;
            if (value === '') {
              this._removeAnimation({
                index,
                className,
                section: sec,
                callback: () => {
                  comeon(true);
                },
              });
            } else {
              this._easeinAnimation({
                index,
                className,
                section: sec,
                callback: () => {
                  comeon(true);
                },
              });
            }
          },
          () => {
            if (callback) {
              callback();
            }
          }
        );
      }
    } else if (callback) {
      callback();
    }
  }

  _syncSubGroupEaseout({ section, value, className, callback }) {
    if (section.tag) {
      const subGroup = this.subGroups[section.tag];
      if (subGroup) {
        const { sections, items } = subGroup;
        const keys = Object.keys(sections);
        iterator(
          keys,
          (key, _idx, comeon) => {
            const sec = sections[key];
            sec.easeout = value;
            const item = items[key];
            const { index } = item.track;
            if (value === '') {
              this._removeAnimation({
                index,
                className,
                section: sec,
                callback: () => {
                  comeon(true);
                },
              });
            } else {
              this._easeoutAnimation({
                index,
                className,
                section: sec,
                callback: () => {
                  comeon(true);
                },
              });
            }
          },
          () => {
            if (callback) {
              callback();
            }
          }
        );
      }
    } else if (callback) {
      callback();
    }
  }

  _removeAnimation({ index, className, section, callback }) {
    this.datasource.fire(`${TrackEventPrefix}:section:animation:remove`, {
      index,
      className,
      section,
      callback,
    });
  }

  _easeinAnimation({ index, className, section, callback }) {
    this.datasource.fire(`${TrackEventPrefix}:section:easein`, {
      index,
      className,
      section,
      callback,
    });
  }

  _easeoutAnimation({ index, className, section, callback }) {
    this.datasource.fire(`${TrackEventPrefix}:section:easeout`, {
      index,
      className,
      section,
      callback,
    });
  }

  onEaseinChange(event) {
    let className = 'easein';
    console.log('easein changed:', event);
    const element = event.target;
    const { value } = element;
    const uid = element.getAttribute('uid');
    const { section } = this._getSectionByUid(uid);
    if (section) {
      section.easein = value;
      if (value === 'scale') {
        className = 'scalein';
      } else if (value === 'fade') {
        className = 'fadein';
      }
      const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
      const { index } = _subItem.track;
      const fireChanged = () => {
        if (value === '') {
          this._removeAnimation({
            index,
            className,
            section,
            callback: (sec) => {
              this.checkedBySection(sec);
              this.syncAnimations(sec);
            },
          });
        } else {
          this._easeinAnimation({
            index,
            className,
            section,
            callback: (sec) => {
              this.checkedBySection(sec);
              this.syncAnimations(sec);
            },
          });
        }
      };
      this._syncSubGroupEasein({
        section,
        value,
        className,
        callback: () => {
          fireChanged();
        },
      });
      // todo
    }
  }

  onEaseoutChange(event) {
    let className = 'easeout';
    console.log('easeout changed:', event);
    const element = event.target;
    const { value } = element;
    const uid = element.getAttribute('uid');
    const { section } = this._getSectionByUid(uid);
    if (section) {
      if (value === 'scale') {
        className = 'scaleout';
      } else if (value === 'fade') {
        className = 'fadeout';
      }
      section.easeout = value;
      const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
      const { index } = _subItem.track;
      const fireChanged = () => {
        if (value === '') {
          this._removeAnimation({
            index,
            className,
            section,
            callback: (sec) => {
              this.checkedBySection(sec);
              this.syncAnimations(sec);
            },
          });
        } else {
          this._easeoutAnimation({
            index,
            className,
            section,
            callback: (sec) => {
              this.checkedBySection(sec);
              this.syncAnimations(sec);
            },
          });
        }
      };
      this._syncSubGroupEaseout({
        section,
        value,
        className,
        callback: () => {
          fireChanged();
        },
      });
    }
  }

  resetSubtablePosition(subTable, top) {
    subTable.style.left = '20px';
    subTable.style.top = `${top}px`;
    subTable.style.display = subTable.style._display;
    // activeSubtable.style.backgroundColor = '#282828';
  }

  onActiveSubItem(section) {
    const { uid } = section;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);

    activeSubtable.style.backgroundColor = '#282828';
    this.resetSubtablePosition(activeSubtable, rowElement.clientHeight + 1);

    if (activeSubtable.fontSizeRange) {
      activeSubtable.fontSizeRange.resize();
    }
  }

  __clearAnimations(section) {
    if (section && section.builder) {
      const { uid } = section;
      const tableElem = this._els.rbox.querySelector(cls('.media-table'));
      const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
      const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
      const animationBox = activeSubtable.querySelector(
        cls('.media-cell-table.celltable.animation')
      );
      if (animationBox) {
        const rangeDivs = animationBox.querySelectorAll(`div.range-cell`);
        rangeDivs.forEach((d) => {
          d.rateRange.off();
          d.rateRange.destroy();
        });
        animationBox.innerHTML = '';
      }
    }
  }

  firstUpperCase(str) {
    return str.replace(/^[a-z]/, ($0) => $0.toUpperCase());
  }

  syncAnimations(section) {
    let html = '';
    if (section && section.builder) {
      const { uid } = section;
      const tableElem = this._els.rbox.querySelector(cls('.media-table'));
      const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
      const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
      const animationBox = activeSubtable.querySelector(
        cls('.media-cell-table.celltable.animation')
      );
      const { animations } = section.builder;
      if (animationBox) {
        this.__clearAnimations(section);
        animations.forEach((a, index) => {
          const { mode, targetPosition } = a;
          const { type, value } = this._parseModeValue(a.exportTemplate());
          console.log('type:', type, ',value:', value);
          const label = `${this.firstUpperCase(value)}${type}`;
          html += `<div class="${this.cssPrefix}-media-row subrow" uid="${uid}">`;
          html += `<div class="${this.cssPrefix}-media-cell" >`;
          html += `<span class="mode ${this.cssPrefix}-media-label">`;
          html += `${this.locale.localize(label)}</span>`;
          html += '</div>';
          html += `<div class="${this.cssPrefix}-media-cell range-cell" idx="${index}">`;
          html += `<span class="range ${this.cssPrefix}-media-label">`;
          html += `${this.locale.localize('DurationRate')}</span>`;
          html += `<div class="slider-range ${this.cssPrefix}-range pos" tag=${mode}></div>`;
          html += `<input class="${this.cssPrefix}-media-range-value pos" `;
          html += `value="${targetPosition}" uid="${uid}"/>`;
          html += '</div>';
          html += '</div>';
        });
        animationBox.innerHTML = html;
        const rangeDivs = animationBox.querySelectorAll(`div.range-cell`);
        rangeDivs.forEach((d) => {
          const rateRangeValues = extend({}, defaultRateRangeValues);
          const idx = parseInt(d.getAttribute('idx'), 10);
          const a = animations[idx];
          const { type } = this._parseModeValue(a.exportTemplate());
          rateRangeValues.value = a.targetPosition;
          if (type === 'out') {
            rateRangeValues.min = 0.5;
            rateRangeValues.max = 1;
          }
          const divElem = d.querySelector('div.slider-range.pos');
          const inputElem = d.querySelector('input.pos');
          const rateRange = new Range(
            {
              slider: divElem,
              input: inputElem,
              cssPrefix: this.cssPrefix,
            },
            rateRangeValues
          );
          d.rateRange = rateRange;
          rateRange.on('change', this._handler._onPosRateChange);
        });
      }
    }
  }

  setupAttachUI(attachSelect, excludeId) {
    let find;
    const { attachs } = this.cfg;
    console.log('setupAttachUI cfg:', this.cfg);
    if (attachs) {
      const { sky, objs } = attachs;
      const options = attachSelect;
      if (options.length === 0) {
        options.add(new Option(this.locale.localize('Default'), ''));
        if (sky) {
          options.add(new Option(this.locale.localize('Sky'), 'sky'));
        }
        objs.forEach((o) => {
          if (o.uid !== excludeId) {
            options.add(new Option(this.locale.localize(o.name), o.uid));
          }
        });

        return;
      }
      const len = options.length;
      const _objs = [];
      let pos = 1;
      if (sky) {
        if (options.length > 1) {
          options[1].value = 'sky';
          options[1].text = this.locale.localize('Sky');
        } else {
          options.add(new Option(this.locale.localize('Sky'), 'sky'));
        }
        pos = 2;
      }
      objs.forEach((o) => {
        find = false;
        for (let i = pos; i < len; i += 1) {
          if (options[i].value === o.uid) {
            find = true;
            break;
          }
        }
        if (!find && o.uid !== excludeId) {
          _objs.push(o);
        }
      });
      const _delObjs = [];
      const matchObj = (opt) => {
        let _find = false;
        for (let k = 0; k < objs.length; k += 1) {
          if (objs[k].uid === opt.value) {
            _find = true;
            break;
          }
        }

        return _find;
      };
      for (let i = pos; i < len; i += 1) {
        const opt = options[i];
        find = matchObj(opt);
        if (!find) {
          _delObjs.push(i);
        }
      }
      if (_delObjs.length > 0) {
        for (let j = _delObjs.length - 1; j >= 0; j -= 1) {
          options.remove(_delObjs[j]);
        }
      }
      _objs.forEach((o) => {
        options.add(new Option(this.locale.localize(o.name), o.uid));
      });
    }
  }

  setupTxtItemSubItem(section) {
    let fillColor, fontSize;
    const { uid } = section;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
    const bdElement = rowElement.querySelector(`.${this.cssPrefix}-media-icon.txtcolorpicker`);
    const svgElement = bdElement.querySelector(`svg[uid="${uid}"]`);
    const useList = svgElement.querySelectorAll('use');
    const defaultColor = '#585858';
    fillColor = defaultColor;

    activeSubtable.style._display = 'table';

    // const { text, size, fill, family, direction } = section.cfg.text;

    const { size, fill, rot, family, opacity, direction } = section.cfg.text;
    // if (text) {
    //   textElement.value = text;
    // }
    if (family) {
      const familySelect = activeSubtable.querySelector(
        `.${this.cssPrefix}-media-selector.family>select`
      );
      familySelect.value = family;
    }
    if (fill) {
      fillColor = fill;
    }
    if (size) {
      fontSize = parseInt(size, 10);
    }

    const colorpicker = new SvgColorpicker(
      bdElement,
      fillColor,
      this.toggleDirection,
      false,
      this.cssPrefix
    );
    svgElement.style.stroke = 'transparent';
    colorpicker.target = svgElement;
    colorpicker.on('change', this._handler._onTextColorChange);
    activeSubtable.colorpicker = colorpicker;
    useList.forEach((u) => {
      u.style.fill = fillColor;
    });
    if (!fontSize) {
      fontSize = defaultTextRangeValues.value;
    }
    defaultTextRangeValues.value = fontSize;
    const fontSizeRange = new Range(
      {
        slider: activeSubtable.querySelector('.slider-range'),
        input: activeSubtable.querySelector(cls('.media-range-value')),
        cssPrefix: this.cssPrefix,
      },
      defaultTextRangeValues
    );
    activeSubtable.fontSizeRange = fontSizeRange;
    fontSizeRange.value = fontSize;
    fontSizeRange.on('change', this._handler._onFontSizeChange);
    const rotationRange = new Range(
      {
        slider: activeSubtable.querySelector('.rotation-range'),
        input: activeSubtable.querySelector(cls('.rotation-range-value')),
        cssPrefix: this.cssPrefix,
      },
      defaultRotationRangeValues
    );

    activeSubtable.rotationRange = rotationRange;
    rotationRange.value = -rot;
    if (section.tag === SPECIAL_TAGS.LYRIC) {
      rotationRange.disable();
    } else {
      rotationRange.on('change', this._handler._onRotationChange);
    }

    const opacityRange = new Range(
      {
        slider: activeSubtable.querySelector('.opacity-range'),
        input: activeSubtable.querySelector(cls('.opacity-range-value')),
        cssPrefix: this.cssPrefix,
      },
      defaultOpacityRangeValues
    );

    activeSubtable.opacityRange = opacityRange;
    opacityRange.value = opacity ? opacity : 0;
    opacityRange.on('change', this._handler._onOpacityChange);

    const directionSelect = activeSubtable.querySelector(
      `.${this.cssPrefix}-media-selector.direction>select`
    );
    if (section.tag === SPECIAL_TAGS.LYRIC) {
      directionSelect.readonly = true;
    } else {
      if (direction) {
        directionSelect.value = direction;
      }
      directionSelect.addEventListener('change', this._handler._onFamilyChange);
    }
    const familySelect = activeSubtable.querySelector(
      `.${this.cssPrefix}-media-selector.family>select`
    );
    familySelect.addEventListener('change', this._handler._onFamilyChange);
    this.resetSubtablePosition(activeSubtable, rowElement.clientHeight + 1);
    activeSubtable.style.display = 'none';
    const centerBtn = activeSubtable.querySelector(`.${this.cssPrefix}-center-btn`);
    centerBtn.addEventListener('click', this._handler._onCenterClick);
    const attachSelect = activeSubtable.querySelector(cls(`.media-selector.attach>select`));
    attachSelect.addEventListener('change', this._handler._onAttachChange);
    console.log('textcontrol attachSelect:', attachSelect);
    this.setupAttachUI(attachSelect, uid);
    if (section.attach) {
      attachSelect.value = section.attach;
    }
  }

  reinitLocker(sec, rowElement) {
    let { fill: fillColor } = sec.cfg.text;
    const lockers = rowElement.querySelectorAll('.locker');
    lockers.forEach((locker) => {
      const lockElem = locker.querySelector('use.lock');
      const unlockElem = locker.querySelector('use.unlock');
      lockElem.style.display = 'none';
      unlockElem.style.display = 'block';
      locker.addEventListener('click', this._handler.onLockChange);
      if (!fillColor) {
        fillColor = '#828282';
      }
      locker.style.fillRule = 'evenodd';
      locker.style.fill = fillColor;
      locker.style.stroke = fillColor;
      locker.style.cursor = 'pointer';
      locker.style.display = 'block';
      lockElem.style.fill = fillColor;
      unlockElem.style.fill = fillColor;
    });
    if (sec.locked) {
      this._lockShapeObj(sec.uid);
    }
  }

  focusMiddle() {
    if (this.activedSubItem) {
      const timePos = this.activedSubItem.start + this.activedSubItem.getDuration() / 2;
      this.ui.timeLine.changeTime(timePos);
    }
  }

  reinitTxtItem(key) {
    let element;
    const sec = this.setupSections[key];
    // { text, size, fill, family, direction }
    // console.log('reinitTxtItem sec:', sec);
    const { uid } = sec;
    const { fill, text } = sec.cfg.text;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
    element = rowElement.querySelector(`.check`);
    element.setAttribute('disabled', 'true');
    if (this.activedSubItem && this.activedSubItem.context.section.uid === uid) {
      element.checked = true;
    } else {
      element.checked = false;
    }
    const textElement = rowElement.querySelector(`input.${this.cssPrefix}-media-value.text`);
    const backcolor = `#${colorReverse(fill)}`;
    textElement.style.color = fill;
    textElement.style.backgroundColor = backcolor;
    textElement.value = text;
    if (sec.tag === SPECIAL_TAGS.LYRIC) {
      textElement.readonly = true;
    } else {
      const inputProxy = new InputProxy(textElement);
      inputProxy.on('change', this._handler._onTextChange);
      rowElement.inputProxy = inputProxy;
    }

    element = rowElement.querySelector(`div.easein select`);
    if (sec.easein) {
      element.value = sec.easein;
    }
    element.addEventListener('change', this._handler.onEaseinChange);
    element = rowElement.querySelector(`div.easeout select`);
    if (sec.easeout) {
      element.value = sec.easeout;
    }
    element.addEventListener('change', this._handler.onEaseoutChange);
    element = rowElement.querySelector(`.duration`);
    element.innerHTML = sec.dur;

    this.setupTxtItemSubItem(sec);
    this.reinitLocker(sec, rowElement);
    if (this.activedSubItem && this.activedSubItem.context.section.uid === uid) {
      this.focusMiddle();
      this.checkedBySection(sec);
    }
  }

  clearItemListener(rowElement) {
    let element;
    if (rowElement) {
      const uid = rowElement.getAttribute('uid');
      // const { section } = this._getSectionByUid(uid);
      element = rowElement.querySelector(`div.easein select`);
      element.removeEventListener('change', this._handler.onEaseinChange);
      element = rowElement.querySelector(`div.easeout select`);
      element.removeEventListener('change', this._handler.onEaseoutChange);
      const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
      if (rowElement.inputProxy) {
        rowElement.inputProxy.stopListener();
        rowElement.inputProxy.off();
      }
      if (activeSubtable.colorpicker) {
        activeSubtable.colorpicker.off();
        activeSubtable.colorpicker.destroy();
      }
      if (activeSubtable.fontSizeRange) {
        activeSubtable.fontSizeRange.off();
        activeSubtable.fontSizeRange.destroy();
      }
      const directionSelect = activeSubtable.querySelector(
        `.${this.cssPrefix}-media-selector.direction>select`
      );
      directionSelect.removeEventListener('change', this._handler._onFamilyChange);
      const familySelect = activeSubtable.querySelector(
        `.${this.cssPrefix}-media-selector.family>select`
      );
      familySelect.removeEventListener('change', this._handler._onFamilyChange);
      const lockers = rowElement.querySelectorAll('.locker');
      lockers.forEach((locker) => {
        locker.removeEventListener('click', this._handler.onLockChange);
      });
      const centerBtn = activeSubtable.querySelector(`.${this.cssPrefix}-center-btn`);
      centerBtn.removeEventListener('click', this._handler._onCenterClick);
      const attachSelect = activeSubtable.querySelector(cls(`.media-selector.attach>select`));
      attachSelect.removeEventListener('change', this._handler._onAttachChange);
    }
  }

  syncTxtItems() {
    let html = '';
    const keys = Object.keys(this.setupSections);
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    tableElem.innerHTML = '';

    keys.forEach((key) => {
      const sec = this.setupSections[key];
      const { uid } = sec;
      const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
      this.clearItemListener(rowElement);
    });

    keys.forEach((key) => {
      const sec = this.setupSections[key];
      const { uid } = sec;
      const color = sec.cfg.text.fill;
      const stroke = `#${colorReverse(color)}`;
      const svgStyle = `fill-rule: evenodd;fill:${color};stroke:${stroke};cursor: pointer`;

      html += textitemHtml({
        uid,
        locale: this.locale,
        cellStyle: '',
        rowStyle: 'border:1px solid silver',
        cssPrefix: this.cssPrefix,
        svgStyle,
        subStyle: 'border:1px solid silver;border-top:0px;',
      });
    });
    tableElem.innerHTML = html;
    keys.forEach((key) => {
      this.reinitTxtItem(key);
    });
  }

  checkedBySection(section) {
    let element;
    const { uid } = section;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rows = tableElem.querySelectorAll(`div.row`);
    const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);

    rows.forEach((r) => {
      r.style.opacity = 0.2;
      element = r.querySelector(`.check`);
      element.checked = false;
      element = r.querySelector('div.subtable');
      element.style.display = 'none';
    });
    rowElement.style.opacity = 1;
    element = rowElement.querySelector(`.check`);
    element.checked = true;

    element = rowElement.querySelector(`.duration`);
    element.innerHTML = section.dur;

    this.onActiveSubItem(section);
  }

  _getSectionByUid(uid) {
    const section = this.setupSections[uid];
    return { section, key: uid };
  }

  setupIconD3Obj(shapeObj) {
    shapeObj.set({ stroke: 'rgba(255,255,255,0)', strokeWidth: 0 });
    if (this.activedSubItem) {
      // const canvasRect = this.getCanvasRect();
      shapeObj.setCoords();
    }
  }

  setTrackItem(trackItem) {
    this.trackItem = trackItem;
    this.activeMenu({ item: trackItem });
    // this.getUI().timeLine.pipTracks.focusByTrackItem(this.trackItem);
  }

  disableApplyBtn() {
    // this._els.applyButton.classList.remove('enabled');
    // this._els.applyButton.classList.add('disabled');
  }

  enableApplyBtn() {
    // this._els.applyButton.classList.remove('disabled');
    // this._els.applyButton.classList.add('enabled');
  }

  getCanvasRect() {
    return {
      width: this.ui.editor._graphics.getCanvas().getWidth(),
      height: this.ui.editor._graphics.getCanvas().getHeight(),
    };
  }

  convert3DPosition({ x, y }) {
    const canvasRect = this.getCanvasRect();
    const left = ((x + 1) / 2) * canvasRect.width;
    const top = ((1 - y) / 2) * canvasRect.height;

    return { left, top };
  }

  convertShapePosition(shapeObj) {
    const canvasRect = this.getCanvasRect();
    const { x: left, y: top } = shapeObj.getPointByOrigin('center', 'center');

    const x = (left / canvasRect.width) * 2 - 1;
    const y = -(top / canvasRect.height) * 2 + 1;
    const { width, height } = shapeObj;
    const pos = { x, y, left, top, width, height };

    return pos;
  }

  buildActions() {
    this.actions = {
      back: () => {
        this.changeStandbyMode();
        this.parent.changeStartMode();
        this.ui.changeMenu(this.parent.name);
      },
      delete: () => {
        if (this.activedSubItem) {
          this.removeSubMenu(['delete']);
          const { section } = this.activedSubItem.context;
          const { index } = this.activedSubItem.track;
          this.remove({
            index,
            section,
            callback: () => {
              this.activedSubItem.dispose();
              this.activedSubItem = null;
            },
          });
        }
      },
    };
  }

  getKeyBySection(sec) {
    const keys = Object.keys(this.setupSections);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      if (this.setupSections[keys[i]] === sec) {
        return keys[i];
      }
    }

    return null;
  }

  remove({ index, section, callback }) {
    /*
    const layerItem = this._els.mainLayer.querySelector(`#${ctx.elemId}`);
    const menuCss = `.${this.cssPrefix}-menu.check`;
    const menuElem = layerItem.querySelector(menuCss);
    menuElem.classList.remove('active');
    */

    // const { index } = this.activedSubItem.track;
    this.trigger3DObjRemove({
      index,
      section,
      callback: () => {
        this._clearSubGroup(section, () => {
          const key = this.getKeyBySection(section);
          delete this.setupSections[key];
          const shapeObj = this.appliedShapes[key];
          if (shapeObj) {
            delete this.appliedShapes[key];
            this.ui.editor._graphics.getCanvas().remove(shapeObj);
          }

          this.syncTxtItems();
          if (callback) {
            callback();
          }
        });
      },
    });
  }

  activeMenu({ item }) {
    const menuNames = ['back'];
    this.removeSubMenu(['delete']);
    console.log('text control activeMenu track item:', item);
    if (item) {
      this.addSubMenu(menuNames);
      // this.removeSubMenu(['pause']);
    } else {
      // this.removeSubMenu(['transition']);
      this.disableSubmenus(['back']);
    }
  }

  activeElement() {}

  syncApplyState() {
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const attachElems = tableElem.querySelectorAll(cls(`.media-selector.attach`));
    attachElems.forEach((elem) => {
      const attachSelect = elem.querySelector('select');
      const uid = attachSelect.getAttribute('uid');
      this.setupAttachUI(attachSelect, uid);
    });
  }

  colorToRGBAColor(color, alpha) {
    if (color.length > 0) {
      const c1 = parseInt(color.substring(1, 3), 16);
      const c2 = parseInt(color.substring(3, 3 + 2), 16);
      const c3 = parseInt(color.substring(5, 5 + 2), 16);

      return `rgba(${c1},${c2},${c3},${alpha})`;
    }

    return '';
  }

  activeShapeWin(section, option) {
    // const { width, height, x, y } = section.file;
    const { uid } = section;
    const trackItem = this.trackItems[uid];
    if (trackItem.win) {
      trackItem.win.bringToFront();
    } else {
      // //section, item, option, callback
      this.buildShapeWin(section, trackItem, option, (shape) => {
        this.appliedShapes[uid] = shape;
        this.setupIconD3Obj(shape);
      });
    }
  }

  angleToFabric(rot) {
    const fabricAngle = rot > 0 ? 360 - rot : -rot;
    console.log('angleToFabric fabricAngle:', fabricAngle);

    return fabricAngle;
  }

  angleTo3D(angle) {
    const d3Angle = angle <= 180 ? -angle : 360 - angle;

    return d3Angle;
  }

  buildShapeWin(section, item, option, callback) {
    let { left, top } = section.file;
    const { width, height, x, y } = section.file;
    const { rot } = section.cfg.text;
    // const { uid } = section;
    const trackItem = item;
    if (left === null || top === null) {
      const rs = this.convert3DPosition({ x, y });
      left = rs.left;
      top = rs.top;
    }
    const options = {
      type: 'rect',
      left,
      top,
      width,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      lockScalingFlip: true,
      lockSkewingX: true,
      lockSkewingY: true,
      height,
      stroke: '#ffd727',
      strokeWidth: 1,
      borderScaleFactor: 1,
      fill: 'rgba(255,255,255,0.2)',
    };
    if (option) {
      const keys = Object.keys(option);
      keys.forEach((k) => {
        options[k] = option[k];
      });
    }
    const colorpickerValue = this._els.colorpicker.color;
    options.fill = this.colorToRGBAColor(colorpickerValue, 0.2);
    trackItem.win = new fabric.Rect(options);
    const controlOptions = {
      ml: false,
      mr: false,
      mt: false,
      mb: false,
      mtr: true,
    };

    trackItem.win.setControlsVisibility(controlOptions);
    trackItem.win.rotate(this.angleToFabric(rot));
    const point = new fabric.Point(left, top);
    trackItem.win.setPositionByOrigin(point, 'center', 'center');
    const canvas = this.ui.editor._graphics.getCanvas();
    this._bindEventOnObj(trackItem.win, callback);
    canvas.add(trackItem.win);
  }

  _bindEventOnObj(fObj, cb) {
    const onShapeMoved = this._onShapeMoved.bind(this);
    const onShapeSelected = this._onShapeSelected.bind(this);
    const onShapeScaled = this._onIconShapeScaled.bind(this);
    const onShapeRotated = this._onShapeRotated.bind(this);
    const onShapeRotating = this._onShapeRotating.bind(this);
    fObj.on({
      added() {
        if (cb) {
          cb(fObj);
        }
      },
      scaled() {
        onShapeScaled({ shapeObj: fObj });
      },
      selected() {
        onShapeSelected({ shapeObj: fObj });
      },
      deselected() {},
      modifiedInGroup() {},
      mousedown() {},
      mouseup() {},
      moving() {
        onShapeMoved({ shapeObj: fObj });
      },
      rotated() {
        onShapeRotated({ shapeObj: fObj });
      },
      rotating() {
        onShapeRotating({ shapeObj: fObj });
      },
    });
  }

  buildShape({ snapshot, callback, name }) {
    const complete = (image) => {
      this.ui.editor._graphics.setCanvasImage(name, image);
      this.ui.editor.setDrawingShape('polygon', { polygonImg: image });
      this.ui.editor.addPolygonImg('SHAPE', (shapeObj) => {
        // console.log('build shape added shapeObj:', shapeObj);
        if (!this.appliedShapes[snapshot]) {
          this.appliedShapes[snapshot] = shapeObj;
        }
        if (callback) {
          callback(shapeObj);
        }
        shapeObj.setCoords();
      });
      // this.ui.editor._graphics.renderAll();
    };
    fabric.Image.fromURL(
      snapshot,
      (image) => {
        // URL.revokeObjectURL(snapshot);
        complete(image);
      },
      {
        crossOrigin: 'Anonymous',
      }
    );
  }

  _changeStartMode() {
    this.datasource.fire(`${TrackEventPrefix}:load`, {});
    this.ui.editor.openMouseListener();
  }

  _changeStandbyMode() {
    this.subMenus.forEach((sm) => {
      sm.changeStandbyMode();
    });
    this.ui.editor.closeMouseListener();
  }

  _initUI() {
    const defaultColor = '#00ff00';
    if (!this._els.colorpicker) {
      const colorElement = this.mediaBody.querySelector('.maintextcolorpicker');
      this._els.colorpicker = new SvgColorpicker(
        colorElement,
        defaultColor,
        this.toggleDirection,
        false,
        this.cssPrefix
      );
      this._els.colorpicker.on('change', this._onColorChanged.bind(this));
      this._onColorChanged();
    }
  }

  _onLoaded(cfg) {
    this.cfg = cfg;
    console.log('onloaded cfg:', cfg);
    this._initUI();
    this.syncApplyState();
    if (this.activedSubItem && this.activedSubItem.context.section) {
      this.checkedBySection(this.activedSubItem.context.section);
    }
  }

  trigger3DObjTextChanged({ index, section, cfg, callback }) {
    this.datasource.fire(`${TrackEventPrefix}:text:changed`, {
      index,
      section,
      cfg,
      callback,
    });
  }

  _syncSubGroupTextChanged({ section, cfg, callback }) {
    if (section.tag) {
      const subGroup = this.subGroups[section.tag];
      if (subGroup) {
        const { sections, items, shapes } = subGroup;
        const keys = Object.keys(sections);
        iterator(
          keys,
          (key, _idx, comeon) => {
            const sec = sections[key];
            const item = items[key];
            const { index } = item.track;
            const shape = shapes[key];
            this.trigger3DObjTextChanged({
              index,
              section: sec,
              cfg,
              callback: (newRect) => {
                if (newRect && newRect.width) {
                  const { left, top } = this.convertShapePosition(shape);
                  shape.setOptions(newRect);
                  const point = new fabric.Point(left, top);
                  shape.setPositionByOrigin(point, 'center', 'center');
                }
                comeon(true);
              },
            });
          },
          () => {
            if (callback) {
              callback();
            }
          }
        );
      }
    } else if (callback) {
      callback();
    }
  }

  changeShapeText(section) {
    const { uid } = section;
    const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
    const textCfg = {};
    const textElement = rowElement.querySelector(`input.${this.cssPrefix}-media-value.text`);
    textCfg.text = textElement.value;
    const familySelect = activeSubtable.querySelector(
      `.${this.cssPrefix}-media-selector.family>select`
    );
    textCfg.family = familySelect.value;
    const colorpickerValue = activeSubtable.colorpicker.color;
    textCfg.fill = colorpickerValue;
    textCfg.size = parseInt(activeSubtable.fontSizeRange.value, 10);
    textCfg.rot = -parseInt(activeSubtable.rotationRange.value, 10);
    textCfg.opacity = parseFloat(activeSubtable.opacityRange.value);
    const shapeObj = this.appliedShapes[uid];
    if (shapeObj) {
      const angle = this.angleToFabric(textCfg.rot);
      shapeObj.rotate(angle);
    }
    const directionSelect = activeSubtable.querySelector(
      `.${this.cssPrefix}-media-selector.direction>select`
    );
    textCfg.direction = directionSelect.value;

    const cfg = { text: textCfg };
    const fireChanged = () => {
      this.trigger3DObjTextChanged({
        index,
        section,
        cfg,
        callback: (newRect) => {
          if (shapeObj) {
            if (newRect && newRect.width) {
              const { left, top } = this.convertShapePosition(shapeObj);
              shapeObj.setOptions(newRect);
              const point = new fabric.Point(left, top);
              shapeObj.setPositionByOrigin(point, 'center', 'center');
            }
            this.ui.editor._graphics.getCanvas().setActiveObject(shapeObj);
            this.ui.editor._graphics.getCanvas().renderAll();
          }
        },
      });
    };
    if (section.tag === SPECIAL_TAGS.LYRIC) {
      textCfg.text = null;
      this._syncSubGroupTextChanged({
        section,
        cfg,
        callback: () => {
          fireChanged();
        },
      });
    } else {
      fireChanged();
    }
    // console.log('fire :text:changed cfg:', cfg, ',index:', index, ',rot:', textCfg.rot);
  }

  _syncSubGroupOpacityChanged({ section, cfg, callback }) {
    if (section.tag) {
      const subGroup = this.subGroups[section.tag];
      if (subGroup) {
        const { sections, items } = subGroup;
        const keys = Object.keys(sections);
        iterator(
          keys,
          (key, _idx, comeon) => {
            const sec = sections[key];
            const item = items[key];
            const { index } = item.track;
            this.datasource.fire(`${TrackEventPrefix}:background:opacity`, {
              index,
              section: sec,
              cfg,
              callback: () => {
                comeon(true);
              },
            });
          },
          () => {
            if (callback) {
              callback();
            }
          }
        );
      }
    } else if (callback) {
      callback();
    }
  }

  changeShapeOpacity(section) {
    const { uid } = section;
    const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
    const textCfg = {};
    textCfg.opacity = parseFloat(activeSubtable.opacityRange.value);
    const cfg = { text: textCfg };
    const fireChanged = () => {
      this.datasource.fire(`${TrackEventPrefix}:background:opacity`, {
        index,
        section,
        cfg,
      });
    };
    if (section.tag === SPECIAL_TAGS.LYRIC) {
      this._syncSubGroupOpacityChanged({
        section,
        cfg,
        callback: () => {
          fireChanged();
        },
      });
    } else {
      fireChanged();
    }
  }

  // updateIconColor(color, shapeObj, section) {
  //   const { uid } = section;
  //   const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
  //   const { index } = _subItem.track;
  //   const cfg = {
  //     color,
  //   };
  //   this.datasource.fire('pip:shape:color:changed', {
  //     index,
  //     section,
  //     cfg,
  //     callback: () => {
  //       console.log('updateIconColor ok.');
  //       shapeObj.set({ fill: this.colorToRGBAColor(color, 0.2) });
  //       section.cfg.color = color;
  //     },
  //   });
  // }

  updateIconShapeD3obj(shapeObj, section) {
    const { x, y, left, top, width, height } = this.convertShapePosition(shapeObj);
    const { uid } = section;
    const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    const cfg = {
      scaleX: shapeObj.scaleX,
      scaleY: shapeObj.scaleY,
      left,
      top,
      width,
      height,
      x,
      y,
    };
    this.datasource.fire('pip:sub:shape:changed', {
      index,
      section,
      cfg,
      callback: () => {
        console.log('update ok.');
      },
    });
  }

  updateShapeD3obj(shapeObj, section) {
    // let imgElem;
    const { x, y, left, top, width, height } = this.convertShapePosition(shapeObj);

    // test begin
    /*
    imgElem = document.getElementById('testImg');
    if (!imgElem) {
      imgElem = document.createElement('img');
      document.body.appendChild(imgElem);
    }
    imgElem.src = durl;
    imgElem.id = 'testImg';
    */
    // test end
    const { uid } = section;
    const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
    const { index } = _subItem.track;

    const maskFile = {};
    const cfg = {
      scaleX: shapeObj.scaleX,
      scaleY: shapeObj.scaleY,
      left,
      top,
      width,
      height,
      x,
      y,
      maskFile,
    };
    this.datasource.fire('pip:sub:shape:changed', {
      index,
      section,
      cfg,
      callback: () => {
        console.log('update ok.');
      },
    });
  }

  updateShapeRelativePostion({ x, y, shapeObj }) {
    const canvasRect = this.getCanvasRect();
    const left = ((x + 1) / 2) * canvasRect.width;
    const top = ((1 - y) / 2) * canvasRect.height;
    const point = new fabric.Point(left, top);
    shapeObj.setPositionByOrigin(point, 'center', 'center');
  }

  _onShapeMaskEdit({ shapeObj, event }) {
    if (shapeObj.edit) {
      console.log('shapeObj mask scaled ok!!!!!!!!!,event:', event);
      const { key } = this._getUidByShape(shapeObj);
      const section = this.setupSections[key];
      if (section) {
        this.updateShapeD3obj(shapeObj, section);
      }
    } else {
      console.log('shapeObj scale size ok !!!!!!');
    }
  }

  _onShapeRotating({ shapeObj }) {
    if (shapeObj) {
      const { uid } = this._getUidByShape(shapeObj);
      const tableElem = this._els.rbox.querySelector(cls('.media-table'));
      const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
      const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);

      const angle = Math.round(shapeObj.angle);
      shapeObj.rotate(angle);
      const rot = this.angleTo3D(angle);
      activeSubtable.rotationRange.value = -rot;
    }
  }

  _onShapeRotated({ shapeObj }) {
    if (shapeObj) {
      const { uid } = this._getUidByShape(shapeObj);
      const tableElem = this._els.rbox.querySelector(cls('.media-table'));
      const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
      const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);

      console.log('_onShapeRotated in shapeObj.angle:', shapeObj.angle);
      const angle = Math.round(shapeObj.angle);
      shapeObj.rotate(angle);
      const rot = this.angleTo3D(angle);
      console.log('_onShapeRotated rot:', rot);
      activeSubtable.rotationRange.value = -rot;
      const section = this.setupSections[uid];
      this.changeShapeText(section);
    }
  }

  _onIconShapeScaled({ shapeObj }) {
    if (shapeObj) {
      const { key } = this._getUidByShape(shapeObj);
      const section = this.setupSections[key];
      if (section) {
        shapeObj.setCoords();
        // this.ui.editor._graphics.renderAll();
        this.updateIconShapeD3obj(shapeObj, section);
      }
    }
  }

  _onShapeScaled({ shapeObj, event }) {
    if (shapeObj.edit) {
      console.log('shapeObj mask scaled ok!!!!!!!!!,event:', event);
    } else {
      console.log('shapeObj scale size ok !!!!!!');
      const { key } = this._getUidByShape(shapeObj);
      const section = this.setupSections[key];
      if (section) {
        shapeObj.setCoords();
        // this.ui.editor._graphics.renderAll();
        this.updateShapeD3obj(shapeObj, section);
      }
    }
  }

  _updateSectionLayer(section) {
    const { uid } = section;
    const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    if (!section.locked) {
      this.datasource.fire('update:sub:queue:layer', { index, section });
    }
  }

  _onShapeSelected({ shapeObj }) {
    const { key } = this._getUidByShape(shapeObj);
    const section = this.setupSections[key];
    if (section) {
      shapeObj.bringToFront();
      this.checkedBySection(section);
      this._updateSectionLayer(section);
    }
  }

  _getUidByShape(shapeObj) {
    const keys = Object.keys(this.appliedShapes);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      const _so = this.appliedShapes[keys[i]];
      if (_so === shapeObj) {
        return { uid: keys[i], key: keys[i] };
      }
    }

    return {};
  }

  _syncSubGroupMoved(section, { x, y, left, top }, callback) {
    if (section.tag) {
      const subGroup = this.subGroups[section.tag];
      if (subGroup) {
        const { sections, items, shapes } = subGroup;
        const keys = Object.keys(sections);
        keys.forEach((key) => {
          const sec = sections[key];
          const shape = shapes[key];
          if (shape) {
            const point = new fabric.Point(left, top);
            shape.setPositionByOrigin(point, 'center', 'center');
          }
          const _subItem = items[key];
          const { index } = _subItem.track;
          this.datasource.fire(`${TrackEventPrefix}:item:moved`, {
            index,
            cfg: { x, y, left, top },
            section: sec,
          });
        });
        if (callback) {
          callback();
        }
      }
    } else if (callback) {
      callback();
    }
  }

  _onShapeMoved({ shapeObj }) {
    // { shapeObj, o }
    // const { left, top } = shapeObj;
    const { key } = this._getUidByShape(shapeObj);
    if (key) {
      const section = this.setupSections[key];
      if (section) {
        const { x, y, left, top, width, height } = this.convertShapePosition(shapeObj);
        // console.log('_onShapeMoved section:', section);
        const { uid } = section;
        const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
        const { index } = _subItem.track;
        this._syncSubGroupMoved(section, { x, y, left, top }, () => {
          this.datasource.fire(`${TrackEventPrefix}:item:moved`, {
            index,
            cfg: { x, y, width, height, left, top },
            section,
          });
        });
      }
    } else {
      console.log('_onShapeMoved not find uid by shapeObj:', shapeObj);
    }
  }

  _onSubItemSelected({ item, source }) {
    console.log('_onTextSubItemSelected item:', item);
    if (source === 'slip') {
      const key = this.getKeyBySection(item.context.section);
      if (key) {
        this.activedSubItem = item;
        this.addSubMenu(['delete']);
        this.checkedBySection(item.context.section);
        const shapeObj = this.appliedShapes[key];
        this.ui.editor._graphics.getCanvas().setActiveObject(shapeObj);
      }
    }
  }

  _onDurationChanged({ item, duration }) {
    const { section } = item.context;
    const { uid } = section;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
    const element = rowElement.querySelector(`span.duration`);
    element.innerHTML = `${duration}`;
  }

  _onSubItemWinMousedown({ item }) {
    // console.log('_onSubItemMousedown item is null:', item === null);
    if (item === this.activedSubItem) {
      this.focusMiddle();
    }
  }

  _onModeChange() {
    this.newTrackMode = this._els.modeCheckElement.checked;
  }

  _onColorChanged() {
    const colorpickerValue = this._els.colorpicker.color;
    console.log('main color :', colorpickerValue);
    this._els.infoInput.style.color = colorpickerValue;
    const backcolor = `#${colorReverse(colorpickerValue)}`;
    this._els.infoInput.style.backgroundColor = backcolor;
  }

  _onFontSizeChange(_value, isLast, rangeProxy) {
    if (rangeProxy) {
      const uid = rangeProxy.rangeInputElement.getAttribute('uid');
      if (isLast) {
        const { section } = this._getSectionByUid(uid);
        console.log('fontRange isLast _value:', _value);
        this.changeShapeText(section);
      }
    }
  }

  _onRotationChange(_value, isLast, rangeProxy) {
    if (rangeProxy) {
      const uid = rangeProxy.rangeInputElement.getAttribute('uid');
      if (isLast) {
        const { section } = this._getSectionByUid(uid);
        console.log('RotationRange isLast _value:', _value);
        this.changeShapeText(section);
      }
    }
  }

  _onCenterClick(event) {
    const btn = event.target;
    const uid = btn.getAttribute('uid');
    if (uid) {
      const { key } = this._getSectionByUid(uid);
      const shapeObj = this.appliedShapes[key];
      const rs = this.convert3DPosition({ x: 0, y: 0 });
      const point = new fabric.Point(rs.left, rs.top);
      shapeObj.setPositionByOrigin(point, 'center', 'center');
      this._onShapeMoved({ shapeObj });
    }
  }

  _onOpacityChange(_value, isLast, rangeProxy) {
    if (rangeProxy) {
      const uid = rangeProxy.rangeInputElement.getAttribute('uid');
      if (isLast) {
        const { section } = this._getSectionByUid(uid);
        console.log('OpacityChange isLast _value:', _value);
        const val = roundValue(_value);
        rangeProxy.value = val;
        this.changeShapeOpacity(section);
      }
    }
  }

  _lockShapeObj(uid) {
    const { key, section } = this._getSectionByUid(uid);
    const shapeObj = this.appliedShapes[key];
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    const lockers = rowElement.querySelectorAll('.locker');
    lockers.forEach((locker) => {
      const lockElem = locker.querySelector('use.lock');
      const unlockElem = locker.querySelector('use.unlock');
      if (lockElem && unlockElem) {
        unlockElem.style.display = 'none';
        lockElem.style.display = 'block';
        shapeObj.visible = false;
        section.locked = true;
      }
    });
  }

  _unlockShapeObj(uid) {
    const { key, section } = this._getSectionByUid(uid);
    const shapeObj = this.appliedShapes[key];
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    const lockers = rowElement.querySelectorAll('.locker');
    lockers.forEach((locker) => {
      const lockElem = locker.querySelector('use.lock');
      const unlockElem = locker.querySelector('use.unlock');
      if (lockElem && unlockElem) {
        lockElem.style.display = 'none';
        unlockElem.style.display = 'block';
        shapeObj.visible = true;
        section.locked = false;
      }
    });
  }

  onLockChange(event) {
    let locker = event.target;
    if (locker.tagName === 'use') {
      locker = locker.parentNode;
    }
    const lockElem = locker.querySelector('use.lock');
    if (lockElem) {
      const uid = locker.getAttribute('uid');
      if (lockElem.style.display === 'none') {
        this._lockShapeObj(uid);
      } else {
        this._unlockShapeObj(uid);
      }
      this.ui.editor._graphics.renderAll();
    }
  }

  _onTextChange(event) {
    // console.log('_onTextChange event:', event);
    const textElement = event.target;
    const txt = textElement.value;
    if (txt.length === 0) {
      return;
    }
    const uid = textElement.getAttribute('uid');
    // console.log('_onTextChange uid:', uid, ',text:', textElement.value);
    const { section } = this._getSectionByUid(uid);
    this.changeShapeText(section);
  }

  _onTextColorChange(color, picker) {
    const svgElement = picker.target;
    const useList = svgElement.querySelectorAll('use');
    useList.forEach((u) => {
      u.style.fill = color;
    });
    const uid = svgElement.getAttribute('uid');
    const { section } = this._getSectionByUid(uid);
    // console.log('_onTextColorChange uid:', uid);
    // const shapeObj = this.appliedShapes[key];
    // this.updateShapeText(color, shapeObj, section);
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div.row[uid="${uid}"]`);
    // const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
    const textElement = rowElement.querySelector(`input.${this.cssPrefix}-media-value.text`);
    if (textElement) {
      textElement.style.color = color;
    }
    // const backcolor = `#${colorReverse(color)}`;
    // textElement.style.backgroundColor = backcolor;
    this.changeShapeText(section);
  }

  _onFamilyChange(event) {
    const uid = event.target.getAttribute('uid');
    if (uid) {
      const { section } = this._getSectionByUid(uid);
      this.changeShapeText(section);
    }
  }

  _onPosRateChange(_value, isLast, rangeProxy) {
    if (rangeProxy) {
      const uid = rangeProxy.rangeInputElement.getAttribute('uid');
      if (isLast) {
        const { section } = this._getSectionByUid(uid);
        const d = rangeProxy.rangeInputElement.parentNode;
        const idx = parseInt(d.getAttribute('idx'), 10);
        const { animations } = section.builder;
        animations[idx].updateTargetPosition(_value);
      }
    }
  }

  _onAttachChange(event) {
    const uid = event.target.getAttribute('uid');
    if (uid) {
      const { section } = this._getSectionByUid(uid);
      section.attach = event.target.value;
      const _subItem = this.ui.timeLine.textTracks.getItemByUid(uid);
      const { index } = _subItem.track;
      this.datasource.fire(`base:attached`, {
        index,
        section,
      });
    }
  }

  installText({ textSection, item, commonSection, prevent, callback }) {
    const { startAt, duration, trackIndex } = item;
    let section = { mime: 'none', file: {}, dur: duration, startAt };
    /*
    const keys = Object.keys(textSection);
    keys.forEach((k) => {
      section[k] = textSection[k];
    });*/
    const cfg = { text: textSection };
    section.cfg = cfg;
    if (prevent) {
      section = commonSection;
    }
    this.ui.timeLine.addTextItem(
      trackIndex,
      section.dur,
      {
        duration: section.dur,
        section,
      },
      (textItem) => {
        if (textItem) {
          this.activedSubItem = textItem;
        }
        if (!prevent) {
          const { index } = this.activedSubItem.track;
          if (!section.hasOwnProperty('sortIndex')) {
            section.sortIndex = this.getSortIndex();
          }
          this.datasource.fire(`${TrackEventPrefix}:setup`, {
            index,
            section,
            cfg,
            callback,
          });
        } else if (callback) {
          callback();
        }
      }
    );
  }

  _onApplyButtonClick() {
    let trackIndex = -1,
      dur;
    const direction = this._els.directionSelect.value;
    const family = this._els.familySelect.value;
    const text = this._els.infoInput.value;
    const fill = this._els.colorpicker.color;
    const size = parseInt(this._els.textRange.value, 10);
    const rot = -parseInt(this._els.rotationRange.value, 10);
    const opacity = 0;
    const textSection = { text, size, fill, family, direction, rot, opacity };
    // this.datasource.fire(`text:setup`, { textSection });
    console.log('_onApplyButtonClick activedItem:', this.activedSubItem);
    if (text.length === 0) {
      return;
    }
    if (!this.newTrackMode && this.activedSubItem) {
      trackIndex = this.activedSubItem.track.index;
    }

    const startAt = this.trackItem.start;
    const duration = this.trackItem.getDuration();
    dur = duration;
    if (dur > maxDuration) {
      dur = maxDuration;
    }
    const item = { startAt, duration: dur, trackIndex };
    this.installText({
      textSection,
      item,
      callback: (_section) => {
        console.log('_onApplyButtonClick _section:', _section);
        this.setupSections[_section.uid] = _section;
        this.trackItems[_section.uid] = this.activedSubItem;
        this.activeShapeWin(_section);
        this.syncTxtItems();
      },
    });
    // this.syncSections();
  }

  addGraphicEvents() {
    if (!this.initGraphicEvents) {
      // const onShapeMoved = this._onShapeMoved.bind(this);
      // const onShapeMaskEdit = this._onShapeMaskEdit.bind(this);
      // const onShapeScaled = this._onShapeScaled.bind(this);
      // const onShapeSelected = this._onShapeSelected.bind(this);
      // this.ui.editor._graphics.on({
      //   'pip:objectMoving': onShapeMoved,
      //   'pip:object:masked': onShapeMaskEdit,
      //   'pip:object:scaled': onShapeScaled,
      //   'pip:objectSelected': onShapeSelected,
      // });
      this.initGraphicEvents = true;
    }
  }

  _onFileChanged(event) {
    // const [file] = event.target.files;
    if (!isSupportFileApi()) {
      alert('This browser does not support file-api');
    }
    // console.log('event.target.files:', event.target.files);
    const [file] = event.target.files;
    this.datasource.fire(`${TrackEventPrefix}:lrc:load`, { file });
  }

  activeLyricShape(section, subGroup) {
    const { uid } = section;
    const { items, shapes } = subGroup;
    const trackItem = items[uid];
    if (!trackItem.win) {
      const option = {
        lockMovementX: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
      };
      this.buildShapeWin(section, trackItem, option, (shape) => {
        shapes[uid] = shape;
        shape.visible = false;
      });
    }
  }

  _onLyricLoaded({ parser }) {
    let end, start, subGroup;
    console.log('lyric parser:', parser);
    const family = this._els.familySelect.value;
    const fill = this._els.colorpicker.color;
    const size = parseInt(this._els.textRange.value, 10);
    const direction = 'horizontal';
    const datas = parser.data;
    const n = datas.length;
    const textSections = [];
    for (let i = 0; i < n - 1; i += 1) {
      const [times, text] = datas[i];
      start = times[0];
      if (times.length === 1) {
        const [nextTimes] = datas[i + 1];
        end = nextTimes[0];
      } else {
        end = times[1];
      }
      const textSection = { text, size, fill, family, direction, rot: 0, opacity: 0, start, end };
      textSections.push(textSection);
    }
    const [times, text] = datas[n - 1];
    start = times[0];
    if (times.length === 1) {
      end = start + 1;
    } else {
      end = times[1];
    }
    textSections.push({ text, size, fill, family, direction, rot: 0, opacity: 0, start, end });
    const track = this.ui.timeLine.textTracks.genTrack('lrc');
    // track.clearAll();
    const trackIndex = track.index;
    console.log('textSections:', textSections);
    iterator(
      textSections,
      (ts, _idx, comeon) => {
        const startAt = ts.start;
        const duration = ts.end - ts.start;
        const item = { startAt, duration, trackIndex };
        this.installText({
          textSection: ts,
          item,
          callback: (_section) => {
            _section.tag = SPECIAL_TAGS.LYRIC;
            if (_idx === 0) {
              this.setupSections[_section.uid] = _section;
              this.trackItems[_section.uid] = this.activedSubItem;
              const option = {
                lockMovementX: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
              };
              this.activeShapeWin(_section, option);
            } else {
              subGroup = this.subGroups[_section.tag];
              if (!subGroup) {
                this.subGroups[_section.tag] = { shapes: {}, sections: {}, items: {} };
                subGroup = this.subGroups[_section.tag];
              }
              subGroup.sections[_section.uid] = _section;
              subGroup.items[_section.uid] = this.activedSubItem;
              this.activeLyricShape(_section, subGroup);
            }
            comeon(true);
          },
        });
      },
      () => {
        this.syncTxtItems();
      }
    );
  }

  _clearSubGroup(_section, callback) {
    if (_section.tag) {
      const subGroup = this.subGroups[_section.tag];
      if (subGroup) {
        const { sections, items, shapes } = subGroup;
        const keys = Object.keys(this.sections);
        iterator(
          keys,
          (key, _idx, comeon) => {
            const section = sections[key];
            const item = items[key];
            const { index } = item.track;
            this.trigger3DObjRemove({
              index,
              section,
              callback: () => {
                delete sections[key];
                const shapeObj = shapes[key];
                if (shapeObj) {
                  delete this.shapes[key];
                  this.ui.editor._graphics.getCanvas().remove(shapeObj);
                }
                comeon(true);
              },
            });
          },
          () => {
            if (callback) {
              callback();
            }
          }
        );
      }
    } else if (callback) {
      callback();
    }
  }

  trigger3DObjRemove({ index, section, callback }) {
    this.datasource.fire(`${TrackEventPrefix}:item:remove`, {
      index,
      section,
      callback,
    });
  }

  _parseModeValue(animationSection) {
    const { mode, from } = animationSection;
    console.log('mode:', mode, ',from:', from);
    if (mode === 'easein' && from) {
      return { type: 'in', value: from };
    }
    if (mode === 'easeout' && from) {
      return { type: 'out', value: from };
    }
    if (mode === 'scalein') {
      return { type: 'in', value: 'scale' };
    }
    if (mode === 'fadein') {
      return { type: 'in', value: 'fade' };
    }
    if (mode === 'scaleout') {
      return { type: 'out', value: 'scale' };
    }
    if (mode === 'fadeout') {
      return { type: 'out', value: 'fade' };
    }

    return {};
  }

  _configSectionDatas({ section, commonSection }) {
    const { cfg } = commonSection;
    const { plainText } = section;
    if (plainText) {
      const { textArray, direction, family, rot } = plainText;
      if (textArray && textArray.length > 0) {
        const [text] = textArray;
        const { fillColor, txt, size } = text;
        cfg.text = { text: txt, size, fill: fillColor, family, direction, rot };
      }
    }
    if (section.animations) {
      section.animations.forEach((a) => {
        const { type, value } = this._parseModeValue(a);
        if (type === 'in') {
          commonSection.easein = value;
        } else {
          commonSection.easeout = value;
        }
      });
    }
  }

  _onAddSubTextFromTemplate({ index: sourceIndex, section, commonSection, callback }) {
    console.log(`section:`, section, ',commonSection:', commonSection, 'sourceIndex:', sourceIndex);
    const { position, origin, dur } = section;
    const { x, y } = position;
    const { scaleX, scaleY, width: w, height: h } = origin;
    // commonSection.file.width = w;
    // commonSection.file.height = h;
    commonSection.locked = true;
    this._configSectionDatas({ section, commonSection });
    console.log('w:', w, ',h:', h);
    this.ui.timeLine.textTracks.initTrack(sourceIndex + 1);
    const item = { startAt: commonSection.start_at, duration: dur, trackIndex: sourceIndex };
    this.installText({
      textSection: section.cfg.text,
      item,
      commonSection,
      sourceIndex,
      prevent: true,
      callback: (_section) => {
        console.log('_onApplyButtonClick _section:', _section);
        this.setupSections[commonSection.uid] = commonSection;
        this.trackItems[commonSection.uid] = this.activedSubItem;
        this.activeShapeWin(commonSection);
        this.syncTxtItems();
        const shapeObj = this.appliedShapes[commonSection.uid];
        shapeObj.scaleX = scaleX;
        shapeObj.scaleY = scaleY;
        this.updateShapeRelativePostion({ x, y, shapeObj });
        this.ui.timeLine.textTracks.hideAll();
        if (callback) {
          callback();
        }
      },
    });
  }

  _onPositionReset({ section, callback }) {
    const { uid, position, origin } = section;
    const { x, y } = position;
    const { scaleX, scaleY } = origin;
    const { key } = this._getSectionByUid(uid);
    console.log('text _onPositionReset key:', key, ',uid:', uid, ',section:', section);
    const shapeObj = this.appliedShapes[key];
    shapeObj.scaleX = scaleX;
    shapeObj.scaleY = scaleY;
    this.updateShapeRelativePostion({ x, y, shapeObj });
    if (callback) {
      callback();
    }
  }

  _onDispose({ item, callback }) {
    const { section } = item.context;
    const { index } = item.track;
    this.remove({ index, section, callback });
  }

  _onClear({ callback }) {
    this.ui.timeLine.textTracks.clearAll(callback);
  }

  _onItemUiRemoved({ item }) {
    const { section } = item.context;
    const key = this.getKeyBySection(section);
    if (key) {
      const { index } = item.track;
      this.trigger3DObjRemove({
        index,
        section,
        callback: () => {
          this._clearSubGroup(section, () => {
            delete this.setupSections[key];
            const shapeObj = this.appliedShapes[key];
            if (shapeObj) {
              delete this.appliedShapes[key];
              this.ui.editor._graphics.getCanvas().remove(shapeObj);
              this.activedSubItem = null;
            }
            this.syncTxtItems();
          });
        },
      });
    }
  }

  addEvents() {
    // this._els.applyButton.addEventListener('click', this._onApplyButtonClick.bind(this));
    // this._els.dimensionSelect.addEventListener('change', this._onDimensionChanged.bind(this));
    // this._els.backgroundSelect.addEventListener('change', this._onBackgroundChanged.bind(this));
    this._els.modeCheckElement.addEventListener('change', this._onModeChange.bind(this));
    const onLoaded = this._onLoaded.bind(this);
    const onSubItemSelected = this._onSubItemSelected.bind(this);
    const onSubItemWinMousedown = this._onSubItemWinMousedown.bind(this);
    const onDurationChanged = this._onDurationChanged.bind(this);
    const onLyricLoaded = this._onLyricLoaded.bind(this);
    const onItemRemoved = this._onItemUiRemoved.bind(this);
    const onDispose = this._onDispose.bind(this);

    const onAddSubTextFromTemplate = this._onAddSubTextFromTemplate.bind(this);
    const onPositionReset = this._onPositionReset.bind(this);
    const onClear = this._onClear.bind(this);
    this.datasource.on({
      [`${TrackEventPrefix}:loaded`]: onLoaded,
      [`${TrackEventPrefix}:duration:changed`]: onDurationChanged,
      [`${TrackEventPrefix}:${SPECIAL_TAGS.LYRIC}:loaded`]: onLyricLoaded,
      [`${TrackEventPrefix}:ui:remove`]: onItemRemoved,
      'sync:sub:text:section': onAddSubTextFromTemplate,
      'sync:sub:text:section:position': onPositionReset,
      'txt:clear': onClear,
    });
    this.getUI().timeLine.on({
      [`${SlipEventPrefix}:selected`]: onSubItemSelected,
      [`${SlipEventPrefix}:mousedown`]: onSubItemWinMousedown,
      [`${TrackEventPrefix}:ui:remove`]: onDispose,
    });

    this._els.applyButton.addEventListener('click', this._onApplyButtonClick.bind(this));

    const onFileChanged = this._onFileChanged.bind(this);
    const loadElement = this.mediaBody.querySelector(cls('.media-load-btn.lrc'));
    loadElement.addEventListener('change', onFileChanged);
  }

  getTextureHtml() {
    const html = textcfgHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
    // console.log('pip control html:', html);

    return html;
  }
}

export default TxtControl;

import TextureUI from '@/ui/withtexture';
import pipcfgHtml from '@/ui/template/texture/pipcfg';
import templateHtml from '@/ui/template/submenu/pipmenu';
import pipitemHtml from '@/ui/template/texture/pipitem';

import EmptyParser from '@/ui/tools/emptyparser';
// import itemHtml from '@/ui/template/texture/mediaitem';
import Colorpicker from '@/ui/tools/colorpicker';
import SvgColorpicker from './tools/svgcolorpicker';
import InputProxy from './tools/inputproxy';
import Range from '@/ui/tools/range';
import { isSupportFileApi, cls, colorReverse } from '@/util';
import { extend } from 'tui-code-snippet';
// colorReverse
import { defaultTextRangeValues, defaultScaleRangeValues, defaultRateRangeValues } from '@/consts';
const minItemWidth = 100;
// const maxLabelHeight = 20;
// const maxLineCount = 6;
// const ItemBorderWeight = 4;
const TrackEventPrefix = 'track:pip';
const SlipEventPrefix = 'slip:pip';

class PipControl extends TextureUI {
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
      name: 'pip',
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
      modeCheckElement: this.mediaBody.querySelector('.tie-newtrack'),
      colorpicker: null,
      rbox: this.mediaBody.querySelector(cls('.media-layer-main-rbox')),
      lbox: this.mediaBody.querySelector(cls('.media-layer-main-lbox')),
      applyButton: this.mediaBody.querySelector('.tie-text-button.action'),
      shapeButtons: this.mediaBody.querySelectorAll('.shapes'),
    };
    // this.colorPickerInputBox = this._els.textColorpicker.colorpickerElement.querySelector(
    //   selectorNames.COLOR_PICKER_INPUT_BOX
    // );
    this.subMenus = [];
    this.items = {};
    this.addEvents();
    this.selectedConfirm = false;
    this.cfg = {};
    this.updateCfg = {};
    this.activedSubItem = null;
    this.buildActions();
    this.__files = [];

    this.initGraphicEvents = false;

    this.parsers = {};
    this.appliedShapes = {};
    this.setupSections = {};

    this.newTrackMode = true;
    this._initUI();
    this.sortIndex = 0;
    this._els.modeCheckElement.checked = this.newTrackMode;

    this._handler = {
      onEaseinChange: this.onEaseinChange.bind(this),
      onEaseoutChange: this.onEaseoutChange.bind(this),
      _onItemColorChange: this._onItemColorChange.bind(this),
      onLockChange: this.onLockChange.bind(this),
      _onTextChange: this._onTextChange.bind(this),
      _onTextColorChange: this._onTextColorChange.bind(this),
      _onFamilyChange: this._onFamilyChange.bind(this),
      _onRangeChange: this._onRangeChange.bind(this),
      _onScaleRangeChange: this._onScaleRangeChange.bind(this),
      _onPosRateChange: this._onPosRateChange.bind(this),
      _onCenterClick: this._onCenterClick.bind(this),
      _onAttachChange: this._onAttachChange.bind(this),
    };
  }

  getSortIndex() {
    const si = this.sortIndex;
    this.sortIndex += 1;

    return si;
  }

  adjustUI() {
    // const pad = 5;
    // const n = 4;
    // const aspect = 2 / 3; // H / W
    const aspect = 1 / this.textureAspect; // H / W
    const btnWidth = minItemWidth;
    const loadBtns = this.mediaBody.querySelectorAll(cls('.media-item'));
    console.log('adjustUI loadBtns:', loadBtns);
    loadBtns.forEach((element) => {
      element.style.width = `${btnWidth}px`;
      element.style.height = `${btnWidth * aspect}px`;
    });

    const newtrack = this.mediaBody.querySelector(cls('.checkbox-wrap'));
    newtrack.style.width = `${btnWidth}px`;
    const leftbox = this.mediaBody.querySelector(cls('.media-layer-main-lbox'));
    leftbox.style.width = '40%';
    this._addLoadEvent();
  }

  installIcon(mode) {
    let ow, oh;
    const { width, height } = this.ui.editor.outOptions;
    ow = width / 3;
    oh = height / 3;
    if (ow > oh) {
      ow = oh;
    } else {
      oh = ow;
    }
    console.log('installIcon ow:', ow, ',oh:', oh);
    const parser = new EmptyParser(ow, oh);
    parser.snapshot = parser.uid;
    parser.mode = mode;
    // this.parsers[parser.snapshot] = parser;
    // check add or append
    this.datasource.fire('pip:source:editing', {
      callback: () => {
        this.addSubTrackIcon({ parser });
      },
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
      const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
      const { index } = _subItem.track;
      if (value === '') {
        this.datasource.fire('pip:sub:section:animation:remove', {
          index,
          className,
          section,
          callback: (sec) => {
            this.checkedBySection(sec);
            this.syncAnimations(sec);
          },
        });
      } else {
        this.datasource.fire('pip:sub:section:easein', {
          index,
          className,
          section,
          callback: (sec) => {
            this.checkedBySection(sec);
            this.syncAnimations(sec);
          },
        });
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
      const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
      const { index } = _subItem.track;
      if (value === '') {
        this.datasource.fire('pip:sub:section:animation:remove', {
          index,
          className,
          section,
          callback: (sec) => {
            this.checkedBySection(sec);
            this.syncAnimations(sec);
          },
        });
      } else {
        this.datasource.fire('pip:sub:section:easeout', {
          index,
          className,
          section,
          callback: (sec) => {
            this.checkedBySection(sec);
            this.syncAnimations(sec);
          },
        });
      }
    }
  }

  resetSubtablePosition(subTable, top) {
    subTable.style.left = '20px';
    subTable.style.top = `${top}px`;
    subTable.style.display = subTable.style._display;
    // activeSubtable.style.backgroundColor = '#282828';
  }

  onActiveSubItem(section) {
    let topDiff = 0;
    const { uid } = section;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    const activeSubtable3 = rowElement.querySelector(`div.subtable3[uid="${uid}"]`);
    const activeSubtable2 = rowElement.querySelector(`div.subtable2[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);

    this.resetSubtablePosition(activeSubtable, rowElement.clientHeight + 1);
    this.resetSubtablePosition(activeSubtable2, rowElement.clientHeight + 1);
    // this.resetSubtablePosition(activeSubtable3, rowElement.clientHeight + 1);
    activeSubtable3.style.left = '20px';

    if (activeSubtable.style.display !== 'none') {
      topDiff += parseInt(activeSubtable.style.top, 10) + activeSubtable.clientHeight;
    }
    if (activeSubtable2.style.display !== 'none') {
      topDiff += parseInt(activeSubtable2.style.top, 10) + activeSubtable2.clientHeight;
    }
    activeSubtable3.style.top = `${topDiff}px`;

    activeSubtable.style.backgroundColor = '#282828';

    if (activeSubtable.fontSizeRange) {
      activeSubtable.fontSizeRange.resize();
    }
  }

  __clearAnimations(section) {
    let activeSubtable;
    if (section && section.builder) {
      const { uid } = section;
      const tableElem = this._els.rbox.querySelector(cls('.media-table'));
      const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
      if (section.cfg && section.cfg.mode) {
        activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
      } else {
        activeSubtable = rowElement.querySelector(`div.subtable2[uid="${uid}"]`);
      }
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
    let html = '',
      activeSubtable;
    if (section && section.builder) {
      const { uid } = section;
      const tableElem = this._els.rbox.querySelector(cls('.media-table'));
      const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
      if (section.cfg && section.cfg.mode) {
        activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
      } else {
        activeSubtable = rowElement.querySelector(`div.subtable2[uid="${uid}"]`);
      }
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

  setupPipItemSubItem(section) {
    let fillColor,
      fontSize,
      backcolor,
      textDirection = 'horizontal';
    const { uid } = section;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    const activeSubtable3 = rowElement.querySelector(`div.subtable3[uid="${uid}"]`);
    const activeSubtable2 = rowElement.querySelector(`div.subtable2[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
    const bdElement = rowElement.querySelector(`.${this.cssPrefix}-media-icon.txtcolorpicker`);
    const svgElement = bdElement.querySelector(`svg[uid="${uid}"]`);
    const useList = svgElement.querySelectorAll('use');
    const defaultColor = '#585858';
    fillColor = defaultColor;

    activeSubtable.style._display = 'table';
    activeSubtable2.style._display = 'table';
    if (section.cfg && section.cfg.mode) {
      // const { text, size, fill, family, direction } = section.cfg.text;
      const textElement = activeSubtable.querySelector(`input.${this.cssPrefix}-media-value.text`);
      if (section.cfg.text) {
        const { text, size, fill, family, direction } = section.cfg.text;
        if (direction) {
          textDirection = direction;
        }
        if (text) {
          textElement.value = text;
        }
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
      }
      if (section.cfg.color) {
        backcolor = section.cfg.color;
      } else {
        backcolor = `#${colorReverse(fillColor)}`;
      }
      textElement.style.color = fillColor;
      textElement.style.backgroundColor = backcolor;
      // textElement.addEventListener('change', this._onTextChange.bind(this));
      const inputProxy = new InputProxy(textElement);
      inputProxy.on('change', this._handler._onTextChange);
      activeSubtable.inputProxy = inputProxy;
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
        fontSize = 50;
      }
      defaultTextRangeValues.value = fontSize;
      const fontSizeRange = new Range(
        {
          slider: activeSubtable.querySelector('.slider-range'),
          input: activeSubtable.querySelector(cls('.media-range-value.fontsize')),
          cssPrefix: this.cssPrefix,
        },
        defaultTextRangeValues
      );
      activeSubtable.fontSizeRange = fontSizeRange;
      fontSizeRange.value = fontSize;
      fontSizeRange.on('change', this._handler._onRangeChange);
      const directionSelect = activeSubtable.querySelector(
        `.${this.cssPrefix}-media-selector.direction>select`
      );
      directionSelect.value = textDirection;
      directionSelect.addEventListener('change', this._handler._onFamilyChange);
      const familySelect = activeSubtable.querySelector(
        `.${this.cssPrefix}-media-selector.family>select`
      );
      familySelect.addEventListener('change', this._handler._onFamilyChange);

      activeSubtable2.scaleSizeRange = activeSubtable2.querySelector(
        cls('.media-range-value.scalesize')
      );
      this.resetSubtablePosition(activeSubtable, rowElement.clientHeight + 1);
      this.resetSubtablePosition(activeSubtable2, rowElement.clientHeight + 1);
      activeSubtable2.style._display = 'none';
      activeSubtable2.style.display = 'none';
    } else {
      const scaleSizeValues = extend({}, defaultScaleRangeValues);
      scaleSizeValues.min = 0;
      scaleSizeValues.max = 0.5;
      scaleSizeValues.value = 0;
      console.log('defaultScaleSizeValues:', scaleSizeValues);
      const scaleSizeRange = new Range(
        {
          slider: activeSubtable2.querySelector('.slider-range'),
          input: activeSubtable2.querySelector(cls('.media-range-value.scalesize')),
          cssPrefix: this.cssPrefix,
        },
        scaleSizeValues
      );
      activeSubtable2.scaleSizeRange = scaleSizeRange;
      if (section.cfg.scaleSize) {
        scaleSizeRange.value = parseFloat(section.cfg.scaleSize);
      }
      scaleSizeRange.on('change', this._handler._onScaleRangeChange);
      this.resetSubtablePosition(activeSubtable, rowElement.clientHeight + 1);
      this.resetSubtablePosition(activeSubtable2, rowElement.clientHeight + 1);
      activeSubtable.style._display = 'none';
      activeSubtable.style.display = 'none';
    }
    if (activeSubtable3) {
      const centerBtn = activeSubtable3.querySelector(`.${this.cssPrefix}-center-btn`);
      centerBtn.addEventListener('click', this._handler._onCenterClick);
      const attachSelect = activeSubtable3.querySelector(cls(`.media-selector.attach>select`));
      attachSelect.addEventListener('change', this._handler._onAttachChange);
      console.log('textcontrol attachSelect:', attachSelect);
      this.setupAttachUI(attachSelect, uid);
      if (section.attach) {
        attachSelect.value = section.attach;
      }
    }
    this.syncAnimations(section);
  }

  reinitLocker(sec, rowElement) {
    let fillColor = sec.cfg.color;
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
    console.log('pip focusMiddle in.');
    if (this.activedSubItem) {
      const timePos = this.activedSubItem.start + this.activedSubItem.getDuration() / 2;
      console.log('pip focusMiddle timepos:', timePos);
      this.ui.timeLine.changeTime(timePos);
    }
  }

  reinitPipItem(key) {
    let element, svgElement;
    const sec = this.setupSections[key];
    const { uid } = sec;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    element = rowElement.querySelector(`.check`);
    element.setAttribute('disabled', 'true');
    if (this.activedSubItem && this.activedSubItem.context.section.uid === uid) {
      element.checked = true;
    } else {
      element.checked = false;
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

    if (sec.cfg.mode) {
      const bdElement = rowElement.querySelector(`.${this.cssPrefix}-media-icon.colorpicker`);
      svgElement = bdElement.querySelector(`svg[uid="${uid}"]`);
      const useList = svgElement.querySelectorAll('use');
      useList.forEach((u) => {
        u.style.fill = sec.cfg.color;
      });
      const colorpicker = new SvgColorpicker(
        bdElement,
        sec.cfg.color,
        this.toggleDirection,
        false,
        this.cssPrefix
      );
      // svgElement.style.backgroundColor = 'transparent';
      svgElement.style.stroke = 'transparent';
      colorpicker.target = svgElement;
      colorpicker.on('change', this._handler._onItemColorChange);
      bdElement.cpicker = colorpicker;
    }
    this.setupPipItemSubItem(sec);
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
      const { section } = this._getSectionByUid(uid);
      const activeSubtable3 = rowElement.querySelector(`div.subtable3[uid="${uid}"]`);
      const activeSubtable2 = rowElement.querySelector(`div.subtable2[uid="${uid}"]`);
      const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
      element = rowElement.querySelector(`div.easein select`);
      element.removeEventListener('change', this._handler.onEaseinChange);
      element = rowElement.querySelector(`div.easeout select`);
      element.removeEventListener('change', this._handler.onEaseoutChange);
      if (section.cfg.mode) {
        const bdElement = rowElement.querySelector(`.${this.cssPrefix}-media-icon.colorpicker`);
        if (bdElement.cpicker) {
          bdElement.cpicker.off();
          bdElement.cpicker.destroy();
        }
        // const textElement = activeSubtable.querySelector(
        //   `input.${this.cssPrefix}-media-value.text`
        // );
        if (activeSubtable.inputProxy) {
          activeSubtable.inputProxy.stopListener();
          activeSubtable.inputProxy.off();
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
      } else if (activeSubtable2.scaleSizeRange) {
        activeSubtable2.scaleSizeRange.off();
        activeSubtable2.scaleSizeRange.destroy();
      }
      if (activeSubtable3) {
        const centerBtn = activeSubtable3.querySelector(`.${this.cssPrefix}-center-btn`);
        centerBtn.removeEventListener('click', this._handler._onCenterClick);
        const attachSelect = activeSubtable3.querySelector(cls(`.media-selector.attach>select`));
        attachSelect.removeEventListener('change', this._handler._onAttachChange);
      }
      const lockers = rowElement.querySelectorAll('.locker');
      lockers.forEach((locker) => {
        locker.removeEventListener('click', this._handler.onLockChange);
      });
    }
  }

  syncPipItems() {
    let html = '',
      svgStyle = '',
      imgStyle = '',
      snapshot = '';
    // let lastRow = null;
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
      const parser = this.parsers[key];
      const sec = this.setupSections[key];
      const { uid } = sec;
      // const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
      // snapshot is uid.
      // if (!rowElement) {
      snapshot = parser.snapshot;
      svgStyle = 'display: none;';
      imgStyle = '';
      const color = '#ff0000';
      const stroke = '#282828';
      if (sec.cfg.mode) {
        svgStyle = `fill-rule: evenodd;fill:${color};stroke:${stroke};cursor: pointer`;
        imgStyle = 'display: none;';
        snapshot = sec.cfg.mode;
      }

      html += pipitemHtml({
        snapshot,
        uid,
        locale: this.locale,
        cellStyle: '',
        rowStyle: 'border:1px solid silver',
        cssPrefix: this.cssPrefix,
        svgStyle,
        imgStyle,
        subStyle: 'border:1px solid silver;border-top:0px;',
      });

      // }
    });
    tableElem.innerHTML = html;
    keys.forEach((key) => {
      this.reinitPipItem(key);
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
      element = r.querySelector('div.subtable2');
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
    const keys = Object.keys(this.setupSections);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      const sec = this.setupSections[keys[i]];
      if (sec.uid === uid) {
        return { section: sec, key: keys[i] };
      }
    }

    return {};
  }

  _getParserByFileData(data) {
    console.log('_getParserByFileData data:', data);
    const keys = Object.keys(this.parsers);
    console.log('parsers keys:', keys);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      const parser = this.parsers[keys[i]];
      console.log('parser.section.file.data:', parser.section.file.data);
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
      info = 'Pip File[] had imported!';
      info = info.replace('[]', `[${name}]`);
      // alert(info);
      console.log(info);
      this.datasource.fire('pip:source:editing', {
        callback: () => {
          this.addSubTrack({ parser });
          this.iteratorLoad(cb);
        },
      });
    } else {
      const { type } = file;
      // console.log('iteratorLoad file type:', type);
      if (type.indexOf('video') >= 0) {
        this.datasource.fire('pip:video:load', { file });
      } else if (type.indexOf('image') >= 0) {
        this.datasource.fire('pip:image:load', { file });
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
    // const [file] = event.target.files;
    this.__files = [];
    for (let i = 0, n = event.target.files.length; i < n; i += 1) {
      this.__files.push(event.target.files[i]);
    }
    this.iteratorLoad(() => {
      console.log('Nothing Done!!!!');
    });
    event.target.value = '';
  }

  _addLoadEvent() {
    const onFileChanged = this._onFileChanged.bind(this);
    const onLoaded = this._onVideoLoaded.bind(this);
    const onImageLoaded = this._onImageLoaded.bind(this);
    const loadElement = this.mediaBody.querySelector(cls('.media-load-btn'));
    loadElement.addEventListener('change', onFileChanged);
    this.datasource.on('pip:video:loaded', onLoaded);
    this.datasource.on('pip:image:loaded', onImageLoaded);
  }

  setupShapeD3Obj({ parser, shapeObj, commonSection, prevent, position, callback }) {
    shapeObj.set({ stroke: 'rgba(255,255,255,0)', strokeWidth: 0 });
    if (this.activedSubItem) {
      // const canvasRect = this.getCanvasRect();
      shapeObj.setCoords();
      // console.log('activedSubItem:', this.activedSubItem);
      // console.log('parsers:', this.parsers);
      const { section } = this.activedSubItem.context;
      if (!section.hasOwnProperty('sortIndex')) {
        section.sortIndex = this.getSortIndex();
      }
      // const parser = this._getParserByFileData(section.file.data);
      // console.log('parser:', parser);
      const { snapshotWidth, snapshotHeight } = parser;
      const { x, y, left, top } = this.convertShapePosition(shapeObj);
      const durl = shapeObj.toDataURL({ format: 'png' });
      const maskFile = { data: durl, type: 'url' };
      const cfg = {
        scaleX: shapeObj.scaleX,
        scaleY: shapeObj.scaleY,
        left,
        top,
        width: snapshotWidth,
        height: snapshotHeight,
        x,
        y,
        scaleSize: 0,
        maskFile,
      };
      const { index } = this.activedSubItem.track;
      if (!prevent) {
        this.datasource.fire('pip:sub:section:add', {
          index,
          parser,
          section,
          cfg,
          callback: (sec) => {
            // this.setupSections[snapshot] = sec;
            this.setupSections[sec.uid] = sec;
            if (callback) {
              callback(sec);
            }
            this.syncPipItems();
          },
        });
      } else {
        const { x: _x, y: _y, scaleX, scaleY } = position;
        shapeObj.scaleX = scaleX;
        shapeObj.scaleY = scaleY;
        this.updateShapeRelativePostion({ x: _x, y: _y, shapeObj });
        this.setupSections[commonSection.uid] = commonSection;
        if (callback) {
          callback(commonSection);
        }
        this.syncPipItems();
        // this.onActiveSubItem(commonSection);
      }
    } else if (callback) {
      callback(null);
    }
  }

  setupIconD3Obj({ parser, shapeObj, commonSection, position, callback, prevent }) {
    let color;
    shapeObj.set({ stroke: 'rgba(255,255,255,0)', strokeWidth: 0 });
    if (this.activedSubItem) {
      // const canvasRect = this.getCanvasRect();
      shapeObj.setCoords();
      // console.log('activedSubItem:', this.activedSubItem);
      // console.log('parsers:', this.parsers);
      const { section } = this.activedSubItem.context;
      if (!section.hasOwnProperty('sortIndex')) {
        section.sortIndex = this.getSortIndex();
      }
      // console.log('parser:', parser);
      const colorpickerValue = this._els.colorpicker.color;
      const vW = parser.metadata.width;
      const vH = parser.metadata.height;
      const { mode } = parser;
      const { x, y, left, top } = this.convertShapePosition(shapeObj);
      /*
      const direction = 'horizontal'; // this._els.directionSelect.value;
      const family = 'ZCOOL_QingKe_HuangYou_Regular.json'; // this._els.familySelect.value;
      const textValue = 'Hello'; // this._els.infoInput.value;
      const size = '50'; // this._els.textRange.value;
      const fill = '#ffbb3b'; // this._els.textColorpicker.color;
      const text = { text: textValue, size, fill, family, direction };
      */
      color = colorpickerValue;
      if (commonSection && commonSection.cfg && commonSection.cfg.color) {
        color = commonSection.cfg.color;
      }
      const cfg = {
        scaleX: shapeObj.scaleX,
        scaleY: shapeObj.scaleY,
        left,
        top,
        width: vW,
        height: vH,
        x,
        y,
        mode,
        color,
      };
      const { index } = this.activedSubItem.track;
      if (!prevent) {
        this.datasource.fire('pip:sub:section:add', {
          index,
          parser,
          section,
          cfg,
          callback: (sec) => {
            // this.setupSections[snapshot] = sec;
            this.setupSections[sec.uid] = sec;
            if (callback) {
              callback(sec);
            }
            this.syncPipItems();
          },
        });
      } else {
        const { x: _x, y: _y, scaleX, scaleY } = position;
        shapeObj.scaleX = scaleX;
        shapeObj.scaleY = scaleY;
        this.updateShapeRelativePostion({ x: _x, y: _y, shapeObj });
        this.setupSections[commonSection.uid] = commonSection;
        if (callback) {
          callback(commonSection);
        }
        this.syncPipItems();
        // this.onActiveSubItem(commonSection);
      }
    } else if (callback) {
      callback(null);
    }
  }

  addSubTrackIcon({ parser, commonSection, sourceIndex, prevent, position, callback }) {
    let trackIndex = -1,
      section = null;
    if (!this.newTrackMode && this.activedSubItem) {
      trackIndex = this.activedSubItem.track.index;
    }
    if (sourceIndex === 0 || sourceIndex) {
      trackIndex = sourceIndex;
    }
    const setupShapeWin = () => {
      this.buildShapeWin({ parser, commonSection, prevent, position, callback });
    };
    const elemId = 0;
    const { srcFileName, fileType } = parser;
    const vW = parser.metadata.width;
    const vH = parser.metadata.height;
    const outWidth = vW;
    const outHeight = vH;
    let duration = parser.total_seconds;
    if (prevent) {
      duration = commonSection.dur;
      parser.total_seconds = duration;
    }
    parser.parseKeyFrameImages().then((result) => {
      parser.setup().then((_section) => {
        if (prevent) {
          section = commonSection;
        } else {
          section = _section;
        }
        console.log('setup section:', section, ',commonSection:', commonSection);
        this.ui.timeLine.addPipItem(
          trackIndex,
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
          (item) => {
            // datasource fire
            this.activedSubItem = item;
            if (prevent && commonSection) {
              const startAt = commonSection.start_at;
              const pos = commonSection.file.start;
              const { dur } = commonSection;
              // const callback = () => {};
              this.activedSubItem.changeDuration({ startAt, pos, dur });
            }
            setupShapeWin();
          }
        );
      });
    });
  }

  addSubTrack({ parser, commonSection, sourceIndex, position, prevent, callback }) {
    let trackIndex = -1,
      section = null;
    const quality = 20;
    const { snapshot, srcFileName, fileType } = parser;
    const elemId = 0;
    const vW = parser.metadata.width;
    const vH = parser.metadata.height;
    const outWidth = this.previewItemWidth;
    const outHeight = Math.floor((outWidth * vH) / vW);
    let duration = parser.total_seconds;
    const onProgress = this._onProgress.bind(this);

    const setupShape = () => {
      this.buildShape({
        name: srcFileName,
        snapshot,
        callback: (shapeObj) => {
          this.addGraphicEvents();
          this.setupShapeD3Obj({
            parser,
            shapeObj,
            commonSection,
            position,
            prevent,
            callback: (sec) => {
              if (sec) {
                this.parsers[sec.uid] = parser;
                this.appliedShapes[sec.uid] = shapeObj;
              }
              if (callback) {
                callback();
              }
            },
          });
          if (!prevent) {
            this.ui.editor._graphics.getCanvas().setActiveObject(shapeObj);
            this.ui.editor._graphics.getCanvas().discardActiveObject();
          }
        },
      });
    };
    trackIndex = -1;
    if (!this.newTrackMode && this.activedSubItem) {
      trackIndex = this.activedSubItem.track.index;
    }
    if (sourceIndex === 0 || sourceIndex) {
      trackIndex = sourceIndex;
    }
    if (prevent) {
      duration = commonSection.dur;
      parser.total_seconds = duration;
    }
    parser.parseKeyFrameImages(outWidth, outHeight, quality, onProgress).then((result) => {
      parser.setup().then((_section) => {
        if (prevent) {
          section = commonSection;
        } else {
          section = _section;
        }
        this.ui.timeLine.addPipItem(
          trackIndex,
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
          (item) => {
            // datasource fire
            this.activedSubItem = item;
            if (prevent && commonSection) {
              const startAt = commonSection.start_at;
              const pos = commonSection.file.start;
              const { dur } = commonSection;
              // const callback = () => {};
              this.activedSubItem.changeDuration({ startAt, pos, dur });
            }
            setupShape();
          }
        );
      });
    });
  }

  _onVideoLoaded({ parser }) {
    if (parser) {
      this.counter += 1;
      // this.parsers[parser.snapshot] = parser;
      // check add or append
      this.datasource.fire('pip:source:editing', {
        callback: () => {
          this.addSubTrack({ parser });
        },
      });
    }
    this.iteratorLoad(() => {
      // console.log('_onVideoLoaded is last file.');
      this.datasource.fire('pip:source:loaded', { parser });
    });
  }

  _onImageLoaded({ parser }) {
    if (parser) {
      this.counter += 1;
      // const { snapshot, snapshotWidth, snapshotHeight, srcFileName } = parser;
      // const elem = this._appendItem(snapshot, snapshotWidth, snapshotHeight, srcFileName);
      // parser._elemId = elem;
      // this.parsers[parser.snapshot] = parser;
      this.datasource.fire('pip:source:editing', {
        callback: () => {
          this.addSubTrack({ parser });
        },
      });
    }
    this.iteratorLoad(() => {
      // console.log('_onImageLoaded is last file.');
      this.datasource.fire('pip:source:loaded', { parser });
    });
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
    const pos = { x, y, left, top };

    return pos;
  }

  updateShapeRelativePostion({ x, y, shapeObj }) {
    const canvasRect = this.getCanvasRect();
    // console.log('updateShapeRelativePostion canvasRect size:', canvasRect);
    const left = ((x + 1) / 2) * canvasRect.width;
    const top = ((1 - y) / 2) * canvasRect.height;
    // console.log('updateShapeRelativePostion left:', left, ',top:', top);
    const point = new fabric.Point(left, top);
    shapeObj.setPositionByOrigin(point, 'center', 'center');
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
              if (this.activedSubItem) {
                this.activedSubItem.dispose();
                this.activedSubItem = null;
              }
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
    // const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
    const loadElement = this.mediaBody.querySelector(cls('.media-load-btn'));

    this.datasource.fire('track:pipItem:remove', {
      index,
      section,
      callback: () => {
        const key = this.getKeyBySection(section);
        delete this.setupSections[key];
        const parser = this.parsers[key];
        // console.log('loadElement value:', loadElement.value, ',parser:', parser.srcFileName);
        if (parser) {
          if (loadElement.value.endsWith(parser.srcFileName)) {
            loadElement.value = '';
          }
          delete this.parsers[key];
        }
        const shapeObj = this.appliedShapes[key];
        if (shapeObj) {
          delete this.appliedShapes[key];
          const { polygonImg } = shapeObj;
          // const { uid } = section;
          if (polygonImg && polygonImg.dispose) {
            polygonImg.dispose();
          }
          this.ui.editor._graphics.getCanvas().remove(shapeObj);
        }
        if (parser) {
          parser.dispose();
        }
        this.syncPipItems();
        if (callback) {
          callback();
        }
      },
    });
  }

  activeMenu({ item }) {
    const menuNames = ['back'];
    this.removeSubMenu(['delete']);
    // console.log('pip control activeMenu track item:', item);
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
    // let modified = false;
    /*
    const modified = true;
    if (modified) {
      this.enableApplyBtn();
    } else {
      this.disableApplyBtn();
    }
    */
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

  buildShapeWin({ parser, commonSection, position, prevent, callback }) {
    const vW = parser.metadata.width;
    const vH = parser.metadata.height;
    const options = {
      type: 'rect',
      left: 10,
      top: 0,
      width: vW,
      lockMovementY: false,
      lockRotation: true,
      lockScalingX: false,
      lockScalingY: false,
      lockScalingFlip: true,
      lockSkewingX: true,
      lockSkewingY: true,
      height: vH,
      stroke: '#ffd727',
      strokeWidth: 1,
      borderScaleFactor: 1,
      fill: 'rgba(255,255,255,0.2)',
    };
    const colorpickerValue = this._els.colorpicker.color;
    options.fill = this.colorToRGBAColor(colorpickerValue, 0.2);
    parser.win = new fabric.Rect(options);
    const controlOptions = {
      ml: false,
      mr: false,
      mt: false,
      mb: false,
      mtr: false,
    };
    if (parser.mode === 'rect') {
      controlOptions.ml = controlOptions.mr = controlOptions.mt = controlOptions.mb = true;
    }
    // parser.win.controls = fabric.Object.prototype.controls;

    parser.win.setControlsVisibility(controlOptions);
    // this.win.controls = winControls;
    // parser.win.visible = false;
    const canvas = this.ui.editor._graphics.getCanvas();
    this._bindEventOnObj(parser.win, (shapeObj) => {
      // this.appliedShapes[parser.snapshot] = shapeObj;
      this.setupIconD3Obj({
        parser,
        shapeObj,
        commonSection,
        position,
        prevent,
        callback: (sec) => {
          if (sec) {
            this.appliedShapes[sec.uid] = shapeObj;
            this.parsers[sec.uid] = parser;
          }
          if (callback) {
            callback(sec);
          }
        },
      });
    });
    canvas.add(parser.win);
  }

  _bindEventOnObj(fObj, cb) {
    const onShapeMoved = this._onShapeMoved.bind(this);
    const onShapeSelected = this._onShapeSelected.bind(this);
    const onShapeScaled = this._onIconShapeScaled.bind(this);
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
    });
  }

  buildShape({ snapshot, callback, name }) {
    const complete = (image) => {
      this.ui.editor._graphics.setCanvasImage(name, image);
      this.ui.editor.setDrawingShape('polygon', { polygonImg: image });
      this.ui.editor.addPolygonImg('SHAPE', (shapeObj) => {
        // if (!this.appliedShapes[snapshot]) {
        //   this.appliedShapes[snapshot] = shapeObj;
        // }
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
    this.datasource.fire('pip:load', {});
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
      const colorElement = this.mediaBody.querySelector('.color-picker-ui.shape');
      this._els.colorpicker = new Colorpicker(
        colorElement,
        defaultColor,
        this.toggleDirection,
        false,
        this.cssPrefix
      );
      const colorValueElement = colorElement.querySelector('.color-picker-value');
      colorValueElement.style.height = '16px';
      colorValueElement.style.width = '16px';
      colorValueElement.style.borderRadius = 0;
      this._els.colorpicker.on('change', this._onColorChanged.bind(this));
      this._onColorChanged();
    }
  }

  _onLoaded(cfg) {
    this.cfg = cfg;
    const keys = Object.keys(cfg);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      this.updateCfg[keys[i]] = cfg[keys[i]];
    }
    this._initUI();
    this.syncApplyState();
    // console.log('pipcontrol onLoaded in ....');
    if (this.activedSubItem && this.activedSubItem.context.section) {
      // console.log('pipcontrol onLoaded will call checkedBySection...');
      this.checkedBySection(this.activedSubItem.context.section);
    }
  }

  changeShapeScaleSize(section) {
    const { uid } = section;
    const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    const activeSubtable2 = rowElement.querySelector(`div.subtable2[uid="${uid}"]`);
    const scaleSize = parseFloat(activeSubtable2.scaleSizeRange.value);
    const cfg = { scaleSize };
    this.datasource.fire(`${TrackEventPrefix}:scalesize:changed`, {
      index,
      section,
      cfg,
    });
  }

  changeShapeText(section) {
    const { uid } = section;
    const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    const activeSubtable2 = rowElement.querySelector(`div.subtable2[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
    const textCfg = {};
    const textElement = activeSubtable.querySelector(`input.${this.cssPrefix}-media-value.text`);
    textCfg.text = textElement.value;
    const familySelect = activeSubtable.querySelector(
      `.${this.cssPrefix}-media-selector.family>select`
    );
    textCfg.family = familySelect.value;
    const colorpickerValue = activeSubtable.colorpicker.color;
    textCfg.fill = colorpickerValue;
    textCfg.size = parseInt(activeSubtable.fontSizeRange.value, 10);
    const directionSelect = activeSubtable.querySelector(
      `.${this.cssPrefix}-media-selector.direction>select`
    );
    textCfg.direction = directionSelect.value;
    const scaleSize = parseFloat(activeSubtable2.scaleSizeRange.value);
    const cfg = { text: textCfg, scaleSize };
    this.datasource.fire('pip:sub:text:changed', {
      index,
      section,
      cfg,
    });
  }

  updateIconColor(color, shapeObj, section) {
    const { uid } = section;
    const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    const cfg = {
      color,
    };
    this.datasource.fire('pip:shape:color:changed', {
      index,
      section,
      cfg,
      callback: () => {
        console.log('updateIconColor ok.');
        shapeObj.set({ fill: this.colorToRGBAColor(color, 0.2) });
        section.cfg.color = color;
      },
    });
  }

  updateIconShapeD3obj(parser, shapeObj, section) {
    const vW = parser.metadata.width;
    const vH = parser.metadata.height;
    const { x, y, left, top } = this.convertShapePosition(shapeObj);
    const { uid } = section;
    const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    const cfg = {
      scaleX: shapeObj.scaleX,
      scaleY: shapeObj.scaleY,
      left,
      top,
      width: vW,
      height: vH,
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

  updateShapeD3obj(parser, shapeObj, section) {
    // let imgElem;
    const { snapshotWidth, snapshotHeight } = parser;
    const { x, y, left, top } = this.convertShapePosition(shapeObj);
    const durl = shapeObj.toDataURL({ format: 'png' });

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
    const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
    const { index } = _subItem.track;

    const maskFile = { data: durl, type: 'url' };
    const cfg = {
      scaleX: shapeObj.scaleX,
      scaleY: shapeObj.scaleY,
      left,
      top,
      width: snapshotWidth,
      height: snapshotHeight,
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
      const { textArray, direction, family } = plainText;
      if (textArray && textArray.length > 0) {
        const [text] = textArray;
        const { fillColor, txt, size } = text;
        cfg.text = { text: txt, size, fill: fillColor, family, direction };
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

  _onAddSubTrackFromTemplate({
    type,
    index: sourceIndex,
    section,
    commonSection,
    parser,
    callback,
  }) {
    // this.addSubTrack({ parser, prevent: true });

    this._configSectionDatas({ section, commonSection });
    this.ui.timeLine.pipTracks.initTrack(sourceIndex + 1);
    // const { mime, maskFile, file, action, dur, index, layerZ, name,
    //   origin, plainText, position, refer, sortIndex, start_at, uid, cfg } = section;
    const { cfg, position, origin } = section;
    const { x, y } = position;
    const { scaleX, scaleY, width: w, height: h } = origin;
    console.log(
      `FromTemplate x:${x},y:${y},scaleX:${scaleX}, scaleY:${scaleY}, width:${w}, height:${h}`
    );
    console.log(`FromTemplate (${commonSection.sortIndex})commonSection:`, commonSection);
    commonSection.locked = true;
    if (type === 'none') {
      const ow = w;
      const oh = h;
      const _parser = new EmptyParser(ow, oh);
      _parser.snapshot = _parser.uid;
      _parser.mode = cfg.mode;

      this.datasource.fire('pip:source:editing', {
        callback: () => {
          this.addSubTrackIcon({
            parser: _parser,
            commonSection,
            sourceIndex,
            prevent: true,
            position: { x, y, scaleX, scaleY },
            callback: () => {
              this.ui.timeLine.pipTracks.hideAll();
              if (callback) {
                callback();
              }
            },
          });
        },
      });
    } else {
      console.log('_onAddSubTrackFromTemplate type:', type);
      this.counter += 1;
      // const { snapshot, snapshotWidth, snapshotHeight, srcFileName } = parser;
      // const elem = this._appendItem(snapshot, snapshotWidth, snapshotHeight, srcFileName);
      // parser._elemId = elem;
      // this.parsers[parser.snapshot] = parser;
      this.datasource.fire('pip:source:editing', {
        callback: () => {
          this.addSubTrack({
            parser,
            commonSection,
            sourceIndex,
            prevent: true,
            position: { x, y, scaleX, scaleY },
            callback: () => {
              this.ui.timeLine.pipTracks.hideAll();
              if (callback) {
                callback();
              }
            },
          });
        },
      });
    }
  }

  _onPositionReset({ section, callback }) {
    const { uid, position, origin } = section;
    const { x, y } = position;
    const { scaleX, scaleY, width, height } = origin;

    const { key } = this._getSectionByUid(uid);
    console.log('pip _onPositionReset key:', key, ',uid:', uid, ',section:', section);
    const shapeObj = this.appliedShapes[key];
    if (shapeObj) {
      shapeObj.scaleX = scaleX;
      shapeObj.scaleY = scaleY;
      shapeObj.set({ width, height });
      this.updateShapeRelativePostion({ x, y, shapeObj });
      shapeObj.setCoords();
    }

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
    this.ui.timeLine.pipTracks.clearAll(callback);
    // const keys = Object.keys(this.setupSections);
    // console.log('pip onclear in..');
    // iterator(
    //   keys,
    //   (key, _idx, comeon) => {
    //     const section = this.setupSections[key];
    //     this.remove({
    //       index,
    //       section,
    //       callback: () => {
    //         comeon(true);
    //       },
    //     });
    //   },
    //   () => {
    //     if (callback) {
    //       callback();
    //     }
    //   }
    // );
  }

  _onShapeMaskEdit({ shapeObj }) {
    if (shapeObj.edit) {
      const { parser, key } = this._getParserByShape(shapeObj);
      const section = this.setupSections[key];
      if (parser && section) {
        this.updateShapeD3obj(parser, shapeObj, section);
      }
    } else {
      console.log('shapeObj scale size ok !!!!!!');
    }
  }

  _onIconShapeScaled({ shapeObj }) {
    if (shapeObj) {
      const { parser, key } = this._getParserByShape(shapeObj);
      const section = this.setupSections[key];
      if (parser && section) {
        shapeObj.setCoords();
        // this.ui.editor._graphics.renderAll();
        this.updateIconShapeD3obj(parser, shapeObj, section);
      }
    }
  }

  _onShapeScaled({ shapeObj }) {
    if (shapeObj.edit) {
      console.log('shapeObj mask scaled ok!.');
    } else {
      const { parser, key } = this._getParserByShape(shapeObj);
      const section = this.setupSections[key];
      if (parser && section) {
        shapeObj.setCoords();
        // this.ui.editor._graphics.renderAll();
        this.updateShapeD3obj(parser, shapeObj, section);
      }
    }
  }

  _updateSectionLayer(section) {
    const { uid } = section;
    const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
    const { index } = _subItem.track;
    // console.log('_updateSectionLayer section:', section);
    if (!section.locked) {
      this.datasource.fire('update:sub:queue:layer', { index, section });
    }
  }

  _onShapeSelected({ shapeObj }) {
    const { key } = this._getParserByShape(shapeObj);
    const section = this.setupSections[key];
    if (section) {
      console.log('_onShapeSelected key:', key);
      shapeObj.bringToFront();
      this.checkedBySection(section);
      this._updateSectionLayer(section);
    }
  }

  _getParserByShape(shapeObj) {
    const keys = Object.keys(this.appliedShapes);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      const _so = this.appliedShapes[keys[i]];
      if (_so === shapeObj) {
        const parser = this.parsers[keys[i]];

        return { parser, key: keys[i] };
      }
    }

    return {};
  }

  _onShapeMoved({ shapeObj }) {
    // { shapeObj, o }
    // const { left, top } = shapeObj;
    const { key } = this._getParserByShape(shapeObj);
    if (key) {
      const section = this.setupSections[key];
      if (section) {
        const { x, y, left, top } = this.convertShapePosition(shapeObj);
        const { uid } = section;
        const _subItem = this.ui.timeLine.pipTracks.getItemByUid(uid);
        const { index } = _subItem.track;

        this.datasource.fire('track:pipItem:moved', { index, cfg: { x, y, left, top }, section });
      }
    } else {
      console.log('_onShapeMoved not find parser by shapeObj:', shapeObj);
    }
  }

  _onSubItemSelected({ item, source }) {
    if (source === 'slip') {
      this.activedSubItem = item;
      this.addSubMenu(['delete']);
      const key = this.getKeyBySection(item.context.section);
      if (key) {
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
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
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

  _onShapeIconAdd(event) {
    let mode = '';
    const { tagName } = event.target;
    if (tagName === 'use') {
      mode = event.target.parentNode.parentNode.getAttribute('mode');
    } else {
      mode = event.target.parentNode.getAttribute('mode');
    }
    if (mode && mode.length > 0) {
      this.installIcon(mode);
    }
  }

  _onColorChanged() {
    const colorpickerValue = this._els.colorpicker.color;

    const useList = this._els.lbox.querySelectorAll(`.${this.cssPrefix}-media-button-frame use`);
    useList.forEach((u) => {
      u.style.fill = colorpickerValue;
    });
  }

  _onTextChange(event) {
    // console.log('_onTextChange event:', event);
    const textElement = event.target;
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
    // const shapeObj = this.appliedShapes[key];
    // this.updateShapeText(color, shapeObj, section);
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
    const textElement = activeSubtable.querySelector(`input.${this.cssPrefix}-media-value.text`);
    textElement.style.color = color;
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

  _onRangeChange(_value, isLast, rangeProxy) {
    if (rangeProxy) {
      const uid = rangeProxy.rangeInputElement.getAttribute('uid');
      if (isLast) {
        const { section } = this._getSectionByUid(uid);
        console.log('RangeChange isLast _value:', _value);
        this.changeShapeText(section);
      }
    }
  }

  _onScaleRangeChange(_value, isLast, rangeProxy) {
    if (rangeProxy) {
      const uid = rangeProxy.rangeInputElement.getAttribute('uid');
      if (isLast) {
        const { section } = this._getSectionByUid(uid);
        console.log('ScaleRangeChange isLast _value:', _value);
        this.changeShapeScaleSize(section);
      }
    }
  }

  _onAttachChange(event) {
    const uid = event.target.getAttribute('uid');
    if (uid) {
      const { section } = this._getSectionByUid(uid);
      section.attach = event.target.value;
      this.datasource.fire(`base:attached`, { section });
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

  _onItemColorChange(color, picker) {
    const svgElement = picker.target;
    const useList = svgElement.querySelectorAll('use');
    useList.forEach((u) => {
      u.style.fill = color;
    });
    // svgElement.style.fill = color;
    const uid = svgElement.getAttribute('uid');
    const { section, key } = this._getSectionByUid(uid);
    const shapeObj = this.appliedShapes[key];
    this.updateIconColor(color, shapeObj, section);

    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    const rowElement = tableElem.querySelector(`div[uid="${uid}"]`);
    const activeSubtable = rowElement.querySelector(`div.subtable[uid="${uid}"]`);
    const textElement = activeSubtable.querySelector(`input.${this.cssPrefix}-media-value.text`);
    const backcolor = color;
    textElement.style.backgroundColor = backcolor;

    const lockers = rowElement.querySelectorAll('.locker');
    lockers.forEach((locker) => {
      const lockElem = locker.querySelector('use.lock');
      const unlockElem = locker.querySelector('use.unlock');
      lockElem.style.fill = color;
      unlockElem.style.fill = color;
    });
  }

  addGraphicEvents() {
    if (!this.initGraphicEvents) {
      const onShapeMoved = this._onShapeMoved.bind(this);
      const onShapeMaskEdit = this._onShapeMaskEdit.bind(this);
      const onShapeScaled = this._onShapeScaled.bind(this);
      const onShapeSelected = this._onShapeSelected.bind(this);
      this.ui.editor._graphics.on({
        'pip:objectMoving': onShapeMoved,
        'pip:object:masked': onShapeMaskEdit,
        'pip:object:scaled': onShapeScaled,
        'pip:objectSelected': onShapeSelected,
      });
      this.initGraphicEvents = true;
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
    const onDispose = this._onDispose.bind(this);
    const onDurationChanged = this._onDurationChanged.bind(this);
    const onClear = this._onClear.bind(this);

    const onAddSubTrackFromTemplate = this._onAddSubTrackFromTemplate.bind(this);
    const onPositionReset = this._onPositionReset.bind(this);
    this.datasource.on({
      'pip:loaded': onLoaded,
      [`${TrackEventPrefix}:duration:changed`]: onDurationChanged,
      'sync:sub:track:section': onAddSubTrackFromTemplate,
      'sync:sub:track:section:position': onPositionReset,
      'pip:clear': onClear,
    });
    console.log('pipcontrol addEvents ok.');
    this.getUI().timeLine.on({
      [`${SlipEventPrefix}:selected`]: onSubItemSelected,
      [`${SlipEventPrefix}:mousedown`]: onSubItemWinMousedown,
      [`${TrackEventPrefix}:ui:remove`]: onDispose,
    });
    this._els.shapeButtons.forEach((btn) => {
      btn.addEventListener('click', this._onShapeIconAdd.bind(this));
    });
  }

  getTextureHtml() {
    const html = pipcfgHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
    // console.log('pip control html:', html);

    return html;
  }
}

export default PipControl;

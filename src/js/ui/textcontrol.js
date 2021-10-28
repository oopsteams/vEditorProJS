import TextureUI from '@/ui/withtexture';
import textHtml from '@/ui/template/texture/texttool';
import templateHtml from '@/ui/template/submenu/texttoolmenu';
// import itemHtml from '@/ui/template/texture/mediaitem';
import Range from '@/ui/tools/range';
import Colorpicker from '@/ui/tools/colorpicker';
import { cls } from '@/util';
import {
  familyMap,
  textDirection,
  defaultTextRangeValues,
  eventNames,
  selectorNames,
} from '@/consts';
// const minItemWidth = 120;
// const maxLabelHeight = 20;
// const ItemBorderWeight = 4;

class TextControl extends TextureUI {
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
    this.counter = 0;
    this.items = {};
    this.parent = parent;
    this._els = {
      mainLayer: this.mediaBody.querySelector(cls('.media-layer-main')),
      textColorpicker: new Colorpicker(
        this.mediaBody.querySelector('.tie-text-color'),
        '#ffbb3b',
        this.toggleDirection,
        this.usageStatistics,
        this.cssPrefix
      ),
      textRange: new Range(
        {
          slider: this.mediaBody.querySelector('.tie-text-range'),
          input: this.mediaBody.querySelector('.tie-text-range-value'),
          cssPrefix,
        },
        defaultTextRangeValues
      ),
      infoInput: this.mediaBody.querySelector('.tie-text-input>input'),
      familySelect: this.mediaBody.querySelector('.tie-text-selector.family>select'),
      directionSelect: this.mediaBody.querySelector('.tie-text-selector.direction>select'),
      applyButton: this.mediaBody.querySelector('.tie-text-button.action'),
    };
    this.colorPickerInputBox = this._els.textColorpicker.colorpickerElement.querySelector(
      selectorNames.COLOR_PICKER_INPUT_BOX
    );
    this.sectionsDiv = this._els.mainLayer.querySelector(cls('.text-sections'));
    if (this.sectionsDiv) {
      this.sectionsDiv.style.display = 'table';
    }
    this.buildActions();
    // this.setup();
    this.addDatasourceEvents();
    this.addEvents();
    this.selectedConfirm = false;
  }

  buildActions() {
    let sectionIndex = -1;
    this.actions = {
      back: () => {
        this.changeStandbyMode();
        this.parent.changeStartMode();
        this.ui.changeMenu(this.parent.name);
        this.ui.timeLine.unlock();
      },
      delete: () => {
        if (this.activedItem) {
          const { sections } = this.activedItem;
          if (this.activedSection) {
            sectionIndex = sections.indexOf(this.activedSection);
          }
          if (this.activedSection && sectionIndex >= 0) {
            if (sections.length > 1) {
              this.datasource.fire('text:remove', { section: this.activedSection });
            } else {
              this.datasource.fire('text:item:remove', { section: sections[0] });
              this.removeSubMenu(['delete']);
            }
          } else if (sections.length > 1) {
            const section = sections[sections.length - 1];
            this.datasource.fire('text:remove', { section });
          } else {
            this.datasource.fire('text:item:remove', { section: sections[0] });
            this.removeSubMenu(['delete']);
          }
        }
      },
    };
  }

  adjustUI() {}

  setTrackItem(trackItem) {
    this.trackItem = trackItem;
  }

  onTrackItemSelected({ item }) {
    if (this.actived) {
      this.setTrackItem(item);
      this.getUI().timeLine.texttrack.focusTrackItem(this.trackItem);
    }
  }

  setActivedTextItem(activedItem) {
    this.activedItem = activedItem;
    if (activedItem) {
      this.syncSections();
      this.addSubMenu(['delete']);
    } else {
      this.removeSubMenu(['delete']);
    }
  }

  _changeStartMode() {
    this.addSubMenu(['back']);
    this.ui.editor.openMouseListener();
  }

  _changeStandbyMode() {
    this.ui.editor.closeMouseListener();
  }

  existTextData(dataItem) {
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

  _onTextLoaded({ data }) {
    if (data) {
      data.forEach((tran) => {
        if (!this.existTextData(tran)) {
          const elem = this._appendItem('#', 120, 60, tran.label);
          console.log('_onTextLoaded elem:', elem);
          this.items[elem] = tran;
        }
      });
    }
  }

  syncSections() {
    let html = '',
      linehtml;
    if (!this.activedItem) {
      this.sectionsDiv.innerHTML = html;

      return;
    }
    console.log('syncSections in.....');
    const lineCss = 'display:table-row;font-size:10px;color: #cccccc;';
    const cellCss = 'display:table-cell;border:1px solid #cccccc;padding:5px;';
    const { sections } = this.activedItem;
    console.log('syncSections sections:', sections);
    if (sections.length > 0) {
      sections.forEach((sec) => {
        const { text, size, fill, family, direction, index } = sec;
        linehtml = `<div style="${lineCss}" class="row line${index}">`;
        linehtml += `<div style="${cellCss}">${text}</div>`;
        linehtml += `<div style="${cellCss}">${size}</div>`;
        linehtml += `<div style="${cellCss}"><span style="width:5px;height:5px;display:inline-block;background-color:${fill};"></span></div>`;
        linehtml += `<div style="${cellCss}">${familyMap[family]}</div>`;
        linehtml += `<div style="${cellCss}">${textDirection[direction]}</div>`;
        linehtml += '</div>';
        html += linehtml;
      });
    }
    console.log('html:', html);
    this.sectionsDiv.innerHTML = html;
    if (this.activedSection) {
      console.log('this.activedSection index:', this.activedSection.index);
      this.activeLineElement(this.activedSection.index);
    }
  }

  addDatasourceEvents() {
    // const onTransitionsLoaded = this._onTransitionsLoaded.bind(this);
    // this.datasource.on({
    //   'transitions:loaded': onTransitionsLoaded,
    // });
  }

  _onSectionUnSelected({ section }) {
    if (this.actived && section) {
      if (this.activedSection === section) {
        this.activeLineElement();
        this.activedSection = null;
      }
    }
  }

  _onSectionSelectChanged({ section }) {
    if (this.actived && section) {
      if (this.activedSection === section) {
        if (!this.selectedConfirm) {
          this.selectedConfirm = true;
        } else {
          this.activeLineElement();
          this.activedSection = null;
          this.selectedConfirm = false;
        }
      }
    }
  }

  activeLineElement(index) {
    const lineDivs = this.sectionsDiv.querySelectorAll(`div.row`);
    const classKey = `line${index}`;
    console.log('activeLineElement index:', index);
    console.log('activeLineElement divs:', lineDivs);
    lineDivs.forEach((element) => {
      const classVal = element.getAttribute('class');
      if (classVal.indexOf(classKey) >= 0) {
        element.style.backgroundColor = '#585858';
      } else {
        element.style.backgroundColor = 'transparent';
      }
    });
  }

  _onSectionSelected({ section }) {
    if (this.actived && section) {
      const { text, size, fill, family, direction, index } = section;
      this._els.directionSelect.value = direction;
      this._els.familySelect.value = family;
      this._els.infoInput.value = text;
      this._els.textRange.value = size;
      this._els.textColorpicker.color = fill;
      this.activeLineElement(index);
      this.activedSection = section;
    } else if (this.activedSection) {
      // const { index } = this.activedSection;
      // const lineDiv = this.sectionsDiv.querySelector(`.line${index}`);
      // lineDiv.style.backgroudColor = 'transparent';
      // this.activedSection = null;
    }
  }

  _onSectionRemoved({ section }) {
    console.log('_onSectionRemoved section:', section);
    const { sections } = this.activedItem;
    const idx = sections.indexOf(section);
    sections.splice(idx, 1);
    this.activedSection = null;
    this.syncSections();
    this.activeLineElement();
  }

  _onTextItemRemoved({ section }) {
    if (this.activedItem) {
      this.activedItem.sections = [];
      this.syncSections();
      this.activedItem.dispose();
      this.activedItem = null;
      this.activedSection = null;
      console.log('removed section:', section);
    }
  }

  _onSectionAdded({ section }) {
    if (this.activedItem) {
      this.activedSection = section;
      const { sections } = this.activedItem;
      const idx = sections.indexOf(section);
      if (idx < 0) {
        sections.push(section);
      }
      this._onSectionSelected({ section });
      this.syncSections();
    }
  }

  _onSetuped({ section }) {
    console.log('_onSetuped section:', section);
    this.activedItem.sections.push(section);
    this._onSectionSelected({ section });
    this.syncSections();
  }

  _onTextActive({ item }) {
    if (this.actived) {
      if (this.activedSection) {
        this._onSectionUnSelected({ section: this.activedSection });
      }
      this.setActivedTextItem(item);
      this.syncSections();
    }
  }

  _onTextDeactive({ item }) {
    if (this.activedItem === item) {
      if (this.activedSection) {
        this._onSectionUnSelected({ section: this.activedSection });
      }
      this.setActivedTextItem(null);
      this.syncSections();
    }
  }

  _onTextScaled({ section, start, range }) {
    this.datasource.fire('track:text:scale', { section, start, range });
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

  _addLoadEvent() {
    // const onFileChanged = this._onFileChanged.bind(this);
    // const onLoaded = this._onAudioLoaded.bind(this);
    // const loadElement = this.mediaBody.querySelector(cls('.media-load-btn'));
    // loadElement.addEventListener('change', onFileChanged);
    // this.datasource.on('text:loaded', onLoaded);
  }

  _changeTextRnageHandler(value, isLast) {
    // this.actions.changeTextStyle(
    //   {
    //     fontSize: value,
    //   },
    //   !isLast
    // );
    console.log('_changeTextRnageHandler value:', value, ',isLast:', isLast);
  }

  _changeColorHandler(color) {
    color = color || 'transparent';
    // this.actions.changeTextStyle({
    //   fill: color,
    // });
    console.log('_changeColorHandler color:', color);
  }

  _onApplyButtonClick() {
    const startAt = this.trackItem.start;
    const dur = this.trackItem.getDuration();
    const direction = this._els.directionSelect.value;
    const family = this._els.familySelect.value;
    const text = this._els.infoInput.value;
    const size = this._els.textRange.value;
    const fill = this._els.textColorpicker.color;
    const section = { text, size, fill, family, direction, startAt, dur };
    // this.datasource.fire(`text:setup`, { textSection });
    if (this.activedItem) {
      if (this.activedSection) {
        this.activedSection.direction = direction;
        this.activedSection.family = family;
        this.activedSection.text = text;
        this.activedSection.size = size;
        this.activedSection.fill = fill;
        console.log('will call update text:', this.activedSection);
        this.datasource.fire(`text:update`, { section: this.activedSection });
        this.activedItem.updateText();
        this.syncSections();
      } else {
        const oriSection = this.activedItem.context.section;
        this.activedItem.sections.push(section);
        console.log('will call add text:', section);
        this.syncSections();
        this.datasource.fire(`text:add`, { source: oriSection, section });
      }
    } else {
      this.ui.timeLine.addText(
        section.dur,
        {
          duration: dur,
          section,
        },
        (textItem) => {
          if (textItem) {
            this.activedItem = textItem;
            // this.activedItem.textTrack.active(this.activedItem);
          }
          this.datasource.fire(`text:setup`, { section });
          // onProgress('加入队列', 1, '-');
          // parser.selected = true;
        }
      );
    }
    // this.syncSections();
  }

  addEvents() {
    const onTextActive = this._onTextActive.bind(this);
    const onTextDeactive = this._onTextDeactive.bind(this);
    const onTextScaled = this._onTextScaled.bind(this);
    const onSectionSelected = this._onSectionSelected.bind(this);
    // const onSectionUnSelected = this._onSectionUnSelected.bind(this);
    const onSectionSelectChanged = this._onSectionSelectChanged.bind(this);
    const onSectionRemoved = this._onSectionRemoved.bind(this);
    const onSectionAdded = this._onSectionAdded.bind(this);
    const onSetuped = this._onSetuped.bind(this);
    const onTextItemRemoved = this._onTextItemRemoved.bind(this);
    this.getUI().timeLine.on({
      'slip:text:selected': onTextActive,
      'slip:text:deselected': onTextDeactive,
      'track:text:scale': onTextScaled,
      'slip:item:selected': this.onTrackItemSelected.bind(this),
    });

    this._els.textRange.on('change', this._changeTextRnageHandler.bind(this));
    this._els.textColorpicker.on('change', this._changeColorHandler.bind(this));

    this.colorPickerInputBox.addEventListener(
      eventNames.FOCUS,
      this._onStartEditingInputBox.bind(this)
    );
    this.colorPickerInputBox.addEventListener(
      eventNames.BLUR,
      this._onStopEditingInputBox.bind(this)
    );
    this._els.applyButton.addEventListener('click', this._onApplyButtonClick.bind(this));
    this.datasource.on({
      'text:section:selected': onSectionSelected,
      'text:removed': onSectionRemoved,
      'text:added': onSectionAdded,
      'text:setuped': onSetuped,
      'text:item:removed': onTextItemRemoved,
      'text:section:select:changed': onSectionSelectChanged,
    });
  }

  getTextureHtml() {
    return textHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default TextControl;

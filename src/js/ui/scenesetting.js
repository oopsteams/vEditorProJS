import TextureUI from '@/ui/withtexture';
// import snippet from 'tui-code-snippet';
import templateHtml from '@/ui/template/submenu/scenesettingmenu';
import settingHtml from '@/ui/template/texture/scenesettingcfg';
// import settingitemHtml from '@/ui/template/texture/scenesettingitem';
// import itemHtml from '@/ui/template/texture/mediaitem';
import Range from '@/ui/tools/range';
import Colorpicker from '@/ui/tools/colorpicker';
import { cls, buildElement } from '@/util';
import { SPECIAL_VALUES, defaultDurationRangeValues } from '@/consts';
import { extend } from 'tui-code-snippet';
// import { defaultScaleRangeValues, selectorNames } from '@/consts';

class Scenesetting extends TextureUI {
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
      name: 'scenesetting',
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

    this._els = {
      mainLayer: this.mediaBody.querySelector(cls('.media-layer-main')),
      backgroundColorpicker: null,

      backgroundSelect: this.mediaBody.querySelector('.tie-text-selector.background>select'),
      dimensionSelect: this.mediaBody.querySelector('.tie-text-selector.dimension>select'),
      // applyButton: this.mediaBody.querySelector('.tie-text-button.action'),
      applyButtonBox: this.mediaBody.querySelector(cls('.track-item.apply-button')),
      bgApplyButtonBox: this.mediaBody.querySelector(cls('.track-item.bg-apply-button')),
      // inputElement: this.mediaBody.querySelector(cls(`.media-duration`)),
      rbox: this.mediaBody.querySelector(cls('.media-layer-main-rbox')),
      lbox: this.mediaBody.querySelector(cls('.media-layer-main-lbox')),
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
    this._handler = {
      _onRangeChange: this._onRangeChange.bind(this),
      onFileChanged: this._onFileChanged.bind(this),
    };
  }

  disableApplyBtn(btnBox) {
    // this._els.applyButton.classList.remove('enabled');
    // this._els.applyButton.classList.add('disabled');

    btnBox.classList.remove('enabled');
    btnBox.classList.add('disabled');
  }

  btnIsEnable(btnBox) {
    const cssList = btnBox.classList;
    for (let i = 0, n = cssList.length; i < n; i += 1) {
      if (cssList[i] === 'enabled') {
        return true;
      }
    }

    return false;
  }

  enableApplyBtn(btnBox) {
    // this._els.applyButton.classList.remove('disabled');
    // this._els.applyButton.classList.add('enabled');

    btnBox.classList.remove('disabled');
    btnBox.classList.add('enabled');
  }

  _onBgApplyButtonClick() {
    let fileElem;
    if (this.btnIsEnable(this._els.bgApplyButtonBox)) {
      const { mode, color } = this.updateCfg;
      const leftTableElem = this._els.lbox.querySelector(cls('.media-table'));
      if (mode === 'cylinder') {
        fileElem = leftTableElem.querySelector(`div.row[tag="${mode}"] input`);
        console.log('cylinder fileElem files:', fileElem.files);
        if (fileElem.files && fileElem.files.length > 0) {
          this.datasource.fire('config:sky:cylinder', {
            file: fileElem.files[0],
            callback: (newcfg) => {
              console.log('cylinder return newcfg:', newcfg);
              this._updateCylinderRadiusRange(newcfg.ctx);
              this._onLoaded(newcfg);
            },
          });
        }
      } else if (mode === 'image') {
        fileElem = leftTableElem.querySelector(`div.row[tag="${mode}"] input`);
        console.log('image fileElem files:', fileElem.files);
        if (fileElem.files && fileElem.files.length > 0) {
          this.datasource.fire('config:sky:image', {
            file: fileElem.files[0],
            callback: (newcfg) => {
              this._onLoaded(newcfg);
            },
          });
        }
      } else {
        const cfg = { mode, color };
        this.datasource.fire(`config:change`, {
          cfg,
          callback: (newcfg) => {
            console.log('apply btn newcfg:', newcfg);
            this._onLoaded(newcfg);
            // this.disableApplyBtn();
          },
        });
      }
    }
  }

  _onApplyButtonClick() {
    if (this.btnIsEnable(this._els.applyButtonBox)) {
      const { width, height } = this.updateCfg;
      const cfg = { width: parseInt(width, 10), height: parseInt(height, 10) };
      this.datasource.fire(`config:change`, {
        cfg,
        callback: (newcfg) => {
          console.log('apply btn newcfg:', newcfg);
          this._onLoaded(newcfg);
          // this.disableApplyBtn();
        },
      });
    }
  }

  buildActions() {
    this.actions = {};
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

  activeElement() {}

  syncApplyState() {
    let modified = false;
    // const keys = Object.keys(this.updateCfg);
    // for (let i = 0, n = keys.length; i < n; i += 1) {
    //   if (this.updateCfg[keys[i]] !== this.cfg[keys[i]]) {
    //     modified = true;
    //     break;
    //   }
    // }
    const { width: originWidth, height: originHeight } = this.cfg;
    // const { width, height, mode, color } = this.updateCfg;
    const { width, height } = this.updateCfg;
    if (originWidth !== width || originHeight !== height) {
      modified = true;
    }
    if (width && height) {
      this._els.dimensionSelect.value = `${width}x${height}`;
    }
    /*
    if (mode) {
      this._els.backgroundSelect.value = mode;
    }
    if (color) {
      this._els.backgroundColorpicker.color = color;
    }
    */
    console.log('syncApplyState updateCfg:', this.updateCfg);
    if (modified) {
      this.enableApplyBtn(this._els.applyButtonBox);
    } else {
      this.disableApplyBtn(this._els.applyButtonBox);
    }
  }

  _changeStartMode() {
    console.log('setting _changeStartMode in...');
    this.datasource.fire('setting:load', {});
  }

  _changeStandbyMode() {
    this.subMenus.forEach((sm) => {
      sm.changeStandbyMode();
    });
  }

  _onBackgroundColorChanged() {
    const backgroundColorVal = this._els.backgroundColorpicker.color;
    this.updateCfg.color = backgroundColorVal;
    console.log('_onBackgroundColorChanged backgroundColorVal:', backgroundColorVal);
    const { mode, color } = this.updateCfg;
    const { mode: originMode, color: originColor } = this.cfg;
    if (mode !== originMode || color !== originColor) {
      this.enableApplyBtn(this._els.bgApplyButtonBox);
    } else {
      this.disableApplyBtn(this._els.bgApplyButtonBox);
    }
    // this.syncApplyState();
  }

  _onBackgroundChanged() {
    const backgroundVal = this._els.backgroundSelect.value;
    this.updateCfg.mode = backgroundVal;
    // if (backgroundVal === 'color') {
    //   this._els.backgroundColorpicker.show();
    // } else {
    //   this._els.backgroundColorpicker.hide();
    // }
    const { mode } = this.updateCfg;
    // if (backgroundVal === 'sky') {

    // } else if (backgroundVal === 'color') {

    // } else if (backgroundVal === 'foreground') {

    // } else if (backgroundVal === 'cylinder') {
    //   console.log('change mode cylinder.');
    // } else if (backgroundVal === 'image') {
    //   console.log('change mode image.');
    // }
    this.updateSkyMode(mode);
    if (['sky', 'color', 'foreground'].indexOf(backgroundVal) >= 0) {
      const { mode: originMode } = this.cfg;
      if (mode !== originMode) {
        this.enableApplyBtn(this._els.bgApplyButtonBox);
      } else {
        this.disableApplyBtn(this._els.bgApplyButtonBox);
      }
    } else {
      this.disableApplyBtn(this._els.bgApplyButtonBox);
    }
  }

  _onDurationChanged(event) {
    const duration = parseInt(event.target.value, 10);
    console.log('_onDurationChanged duration:', duration);
    if (duration > 0) {
      SPECIAL_VALUES.Duration = duration;
      this.updateCfg.trackDuration = duration;
    }
  }

  _onDimensionChanged() {
    const deimensionVal = this._els.dimensionSelect.value;
    const [width, height] = deimensionVal.split('x');
    console.log('_onDimensionChanged in,deimensionVal:', deimensionVal);
    this.updateCfg.width = parseInt(width, 10);
    this.updateCfg.height = parseInt(height, 10);
    this.syncApplyState();
  }

  _initUI() {
    let defaultColor;
    if (!this._els.backgroundColorpicker) {
      defaultColor = this.updateCfg.color;
      if (!defaultColor) {
        defaultColor = '#00ff00';
      }
      this._els.backgroundColorpicker = new Colorpicker(
        this.mediaBody.querySelector('.tie-text-color.background'),
        defaultColor,
        this.toggleDirection,
        false,
        this.cssPrefix
      );
      this._els.backgroundColorpicker.on('change', this._onBackgroundColorChanged.bind(this));
    }
    // this._els.applyButtonBox.classList.remove('enabled');
    // this._els.applyButtonBox.classList.add('disabled');
    const { mode } = this.updateCfg;
    this._els.backgroundSelect.value = mode;
    this._initTableData();
    this.disableApplyBtn(this._els.applyButtonBox);
    this.disableApplyBtn(this._els.bgApplyButtonBox);

    this.updateSkyMode(mode);
  }

  _newOpenFileElem({ rowElem, options, label, tag }) {
    // const rowElem = buildElement('div', { class: `${this.cssPrefix}-media-row row`, tag });
    const cellElem = buildElement('div', { class: `${this.cssPrefix}-media-cell cell`, tag });
    const cellLineElem = buildElement('div', {
      class: `${this.cssPrefix}-media-load-frame line`,
      tag,
    });
    cellElem.appendChild(cellLineElem);
    rowElem.appendChild(cellElem);
    console.log('options:', options);
    const labelElem = buildElement(
      'span',
      { class: `${this.cssPrefix}-media-label` },
      this.locale.localize(label)
    );
    const fileInputElem = buildElement('input', {
      class: `${this.cssPrefix}-media-load-btn`,
      type: 'file',
      accept: `.jpeg,.png,.jpg,.svg`,
      tag,
    });

    const iconElem = buildElement(
      'div',
      {},
      `${this.makeSvgIcon(['normal', 'active', 'hover'], 'iupload', false)}`
    );
    fileInputElem.addEventListener('change', this._handler.onFileChanged);
    cellLineElem.appendChild(labelElem);
    cellLineElem.appendChild(fileInputElem);
    cellLineElem.appendChild(iconElem);

    return { rowElem, cellLineElem };
  }

  _newRangeElem({ rowElem, options, label, tag }) {
    // const rowElem = buildElement('div', { class: `${this.cssPrefix}-media-row row`, tag });
    const cellElem = buildElement('div', { class: `${this.cssPrefix}-media-cell cell`, tag });
    const cellLineElem = buildElement('div', { class: `${this.cssPrefix}-media-cell-h line`, tag });
    cellElem.appendChild(cellLineElem);
    rowElem.appendChild(cellElem);
    // tableElem.appendChild(rowElem);
    const labelElem = buildElement(
      'span',
      { class: `${this.cssPrefix}-media-label` },
      this.locale.localize(label)
    );
    const rangeDivElem = buildElement('div', { class: `${this.cssPrefix}-range` });
    const rangeInputElem = buildElement('input', {
      class: `${this.cssPrefix}-range-value`,
      tag,
    });
    cellLineElem.appendChild(labelElem);
    cellLineElem.appendChild(rangeDivElem);
    cellLineElem.appendChild(rangeInputElem);
    cellLineElem.range = new Range(
      {
        slider: rangeDivElem,
        input: rangeInputElem,
        cssPrefix: this.cssPrefix,
      },
      options
    );
    cellLineElem.range.on('change', this._handler._onRangeChange);

    return cellLineElem;
  }

  updateSkyMode(mode) {
    const leftTableElem = this._els.lbox.querySelector(cls('.media-table'));
    const rows = leftTableElem.querySelectorAll(cls('.media-row'));
    rows.forEach((r) => {
      // display: table-row;
      r.style.display = 'none';
      const m = r.getAttribute('tag');
      // if (m.startsWith(mode)) {
      //   r.style.display = 'table-row';
      // }

      if (m === mode) {
        console.log('updateSkyMode mode:', mode);
        r.style.display = 'table-row';
      }
      if (m === 'cylinderR' && mode === 'cylinder') {
        const fileElem = leftTableElem.querySelector(`div.row[tag="${mode}"] input`);
        if (fileElem.files && fileElem.files.length > 0) {
          const rowElem = leftTableElem.querySelector(`div.row[tag="cylinderR"]`);
          rowElem.style.display = 'table-row';
        }
      }
    });
  }

  _initTableData() {
    let selectorVal, tag, cellLineElem, rowElem, cellElem;
    const leftTableElem = this._els.lbox.querySelector(cls('.media-table'));
    const tableElem = this._els.rbox.querySelector(cls('.media-table'));
    if (this.updateCfg.trackDuration > 0) {
      SPECIAL_VALUES.Duration = this.updateCfg.trackDuration;
      tag = 'trackDuration';
      selectorVal = `div.line[tag="${tag}"]`;
      cellLineElem = tableElem.querySelector(selectorVal);

      if (!cellLineElem) {
        rowElem = buildElement('div', { class: `${this.cssPrefix}-media-row row`, tag });
        tableElem.appendChild(rowElem);
        cellLineElem = this._newRangeElem({
          rowElem,
          options: defaultDurationRangeValues,
          label: this.locale.localize('Emptyduration'),
          tag,
        });
      }
      cellLineElem.range.value = this.updateCfg.trackDuration;
    }

    tag = 'cylinderR';
    selectorVal = `div.line[tag="${tag}"]`;
    cellLineElem = leftTableElem.querySelector(selectorVal);

    const { minZ, far } = this.updateCfg;
    if (!cellLineElem) {
      const rOptions = extend({}, defaultDurationRangeValues);
      rOptions.max = far - minZ;
      console.log('rOptions.max:', rOptions.max);
      rowElem = leftTableElem.querySelector(`div.row[tag="${tag}"]`);
      cellLineElem = this._newRangeElem({
        rowElem,
        options: rOptions,
        label: this.locale.localize('Cylinderr'),
        tag,
      });
    } else {
      cellLineElem.range.max = far - minZ;
    }

    tag = 'cylinder';
    selectorVal = `div.row[tag="${tag}"]`;
    // rowElem = tableElem.querySelector(selectorVal);
    rowElem = leftTableElem.querySelector(selectorVal);
    cellElem = leftTableElem.querySelector(`div.row[tag="${tag}"] div.cell`);
    if (!cellElem) {
      // const rowElem = buildElement('div', { class: `${this.cssPrefix}-media-row row`, tag });
      // tableElem.appendChild(rowElem);
      this._newOpenFileElem({ rowElem, options: {}, label: 'Open Your Image File', tag });
    }
    rowElem = null;
    tag = 'image';
    selectorVal = `div.row[tag="${tag}"]`;
    rowElem = leftTableElem.querySelector(selectorVal);
    cellElem = leftTableElem.querySelector(`div.row[tag="${tag}"] div.cell`);
    if (!cellElem) {
      this._newOpenFileElem({ rowElem, options: {}, label: 'Open Your Image File', tag });
    }
  }

  _onLoaded(cfg) {
    this.cfg = cfg;
    const keys = Object.keys(cfg);
    for (let i = 0, n = keys.length; i < n; i += 1) {
      this.updateCfg[keys[i]] = cfg[keys[i]];
    }
    if (this.updateCfg.trackDuration > 0) {
      SPECIAL_VALUES.Duration = this.updateCfg.trackDuration;
    }
    console.log('setting onloaded cfg:', cfg);
    this._initUI();
    this.syncApplyState();
    // this._els.inputElement.value = SPECIAL_VALUES.Duration;
  }

  _updateCylinderRadiusRange(ctx) {
    const _tag = 'cylinderR';
    const selectorVal = `div.line[tag="${_tag}"]`;
    const tableElem = this._els.lbox.querySelector(cls('.media-table'));
    const cellLineElem = tableElem.querySelector(selectorVal);
    cellLineElem.range.min = ctx.minRadius;

    const leftTableElem = this._els.lbox.querySelector(cls('.media-table'));
    const rowElem = leftTableElem.querySelector(`div.row[tag="${_tag}"]`);
    rowElem.style.display = 'table-row';
  }

  _onFileChanged(event) {
    const elem = event.target;
    const tag = elem.getAttribute('tag');
    console.log('onFileChanged tag:', tag);
    if (elem.files && elem.files.length > 0) {
      this.enableApplyBtn(this._els.bgApplyButtonBox);
    }
    if (tag === 'cylinder') {
      if (elem.files && elem.files.length > 0) {
        const cellLineElem = elem.parentNode;
        const labelElem = cellLineElem.querySelector(cls('.media-label'));
        labelElem.innerHTML = elem.files[0].name;
      }
    } else if (tag === 'image') {
      if (elem.files && elem.files.length > 0) {
        const cellLineElem = elem.parentNode;
        const labelElem = cellLineElem.querySelector(cls('.media-label'));
        labelElem.innerHTML = elem.files[0].name;
      }
    }
  }

  _onRangeChange(_value, isLast, rangeProxy) {
    if (rangeProxy && isLast) {
      const tag = rangeProxy.rangeInputElement.getAttribute('tag');
      if (tag === 'trackDuration') {
        // fire msg
        if (_value > 0) {
          SPECIAL_VALUES.Duration = _value;
          this.updateCfg.trackDuration = _value;
          this.datasource.fire('config:track:duration', {
            duration: _value,
          });
        }
      } else if (tag === 'cylinderR') {
        this.datasource.fire('config:sky:cylinder:radius', {
          radius: _value,
          callback: () => {
            console.log('changed radius.');
          },
        });
      }
    }
  }

  addEvents() {
    this._els.applyButtonBox.addEventListener('click', this._onApplyButtonClick.bind(this));
    this._els.bgApplyButtonBox.addEventListener('click', this._onBgApplyButtonClick.bind(this));
    this._els.dimensionSelect.addEventListener('change', this._onDimensionChanged.bind(this));
    this._els.backgroundSelect.addEventListener('change', this._onBackgroundChanged.bind(this));
    // this._els.inputElement.addEventListener('change', this._onDurationChanged.bind(this));
    const onLoaded = this._onLoaded.bind(this);
    this.datasource.on({
      'setting:loaded': onLoaded,
    });
  }

  getTextureHtml() {
    return settingHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default Scenesetting;

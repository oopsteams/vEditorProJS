import Submenu from '@/ui/submenuBase';

class TextureUI extends Submenu {
  constructor(
    subMenuElement,
    {
      locale,
      name,
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
      cssPrefix,
      theme,
      textureLayer,
      textureAspect,
      datasource,
    }
  ) {
    super(subMenuElement, {
      locale,
      name,
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
      cssPrefix,
    });
    this.ui = subMenuElement.ui;
    this.locale = locale;
    this.makeSvgIcon = makeSvgIcon;
    this.cssPrefix = cssPrefix;
    this.theme = theme;
    this.textureLayer = textureLayer;
    this.datasource = datasource;
    this.textureAspect = textureAspect;
    this.subMenuElement = subMenuElement;
    this.actived = false;
    this.actions = {};
    this.fixMenus = [];
    this.setup();
    this.disableSubmenus();
    this.addTrackItemEvents();
  }

  setup() {
    this.makeTextureUI();
    const leftMenuDivCss = `.${this.cssPrefix}-menu-${this.name}`;
    this.leftMenuLine = this.subMenuElement.querySelector(leftMenuDivCss);
    this.trackItemElements = this.leftMenuLine.querySelectorAll(`.${this.cssPrefix}-track-item`);
    const mediaBodyCss = `.${this.cssPrefix}-media-layer.${this.name}`;
    console.log('mediaBodyCss:', mediaBodyCss);
    this.mediaBody = this.textureLayer.querySelector(mediaBodyCss);
    console.log('mediaBody:', this.mediaBody);
    this.adjustUI();
  }

  addSubMenu(names) {
    names.forEach((name) => {
      const idx = this.fixMenus.indexOf(name);
      if (idx < 0) {
        this.fixMenus.push(name);
      }
    });
    this.disableSubmenus(this.fixMenus);
  }

  removeSubMenu(names) {
    names.forEach((name) => {
      const idx = this.fixMenus.indexOf(name);
      if (idx >= 0) {
        this.fixMenus.splice(idx, 1);
      }
    });
    this.disableSubmenus(this.fixMenus);
  }

  disableSubmenus(enabledNames) {
    let n, i, isEnable;
    const classNames = [];
    if (enabledNames) {
      enabledNames.forEach((mn) => {
        classNames.push(`tie-button-${mn}`);
      });
      // console.log('disableSubmenus enabledNames:', enabledNames.join(','));
    }

    if (this.trackItemElements && this.trackItemElements.length > 0) {
      this.trackItemElements.forEach((elem) => {
        const cns = elem.getAttribute('class').split(' ');
        isEnable = false;
        for (i = 0, n = cns.length; i < n; i += 1) {
          if (classNames.indexOf(cns[i]) >= 0) {
            isEnable = true;
            break;
          }
        }
        if (isEnable) {
          elem.classList.remove('disabled');
          elem.classList.add('enabled');
        } else {
          elem.classList.remove('enabled');
          elem.classList.add('disabled');
        }
      });
    }
  }

  commonActions() {
    return {};
  }

  changeStartMode() {
    this.textureLayer.classList.add(this.name);
    this.subMenuElement.classList.add(this.name);
    this.actived = true;
    this._changeStartMode();
  }

  changeStandbyMode() {
    this.textureLayer.classList.remove(this.name);
    this.subMenuElement.classList.remove(this.name);
    this.actived = false;
    this._changeStandbyMode();
  }

  _changeStartMode() {}

  _changeStandbyMode() {}

  makeTextureUI() {
    const textureHtml = this.getTextureHtml();
    if (textureHtml) {
      const textureContainer = document.createElement('div');
      textureContainer.className = `${this.cssPrefix}-media-layer ${this.name}`;
      textureContainer.innerHTML = textureHtml;
      this.textureLayer.appendChild(textureContainer);
    }
  }

  getTextureHtml() {
    return null;
  }

  textureSelector(selectName) {
    return this.textureLayer.querySelector(selectName);
  }

  textureSelectors(selectName) {
    return this.textureLayer.querySelectorAll(selectName);
  }

  adjustUI() {}

  activeMenu() {}

  _onItemActive({ item, isLast }) {
    if (this.actived) {
      this.activedItem = item;
      if (!item) {
        this.disableSubmenus();

        return;
      }
      this.activeMenu({ item, isLast });
    }
  }

  _onProgress(tag, rate, index) {
    if (window.init_req_onprogress) {
      window.init_req_onprogress(`${tag}(${index})`, rate * 100);
    }
  }

  _onSubMenuClick(event) {
    const buttonElement = event.target.closest(`.${this.cssPrefix}-track-item`);
    const cns = buttonElement.getAttribute('class').split(' ');
    if (cns.indexOf('disabled') >= 0) {
      return;
    }
    const prefix = 'tie-button-';
    for (let i = 0, n = cns.length; i < n; i += 1) {
      const cn = cns[i];
      if (cn.startsWith(prefix)) {
        const command = cn.substring(prefix.length);
        if (this.actions[command]) {
          this.actions[command]();
        }
        break;
      }
    }
    console.log('_onSubMenuClick cns:', cns);
  }

  adjustItemSize(itemWidth) {
    let n;
    const rect = {};
    const width = this.textureLayer.clientWidth;
    n = width / itemWidth;
    if (n > 4) {
      n = 4;
      rect.width = Math.floor(width / n);
    } else {
      rect.width = itemWidth;
    }
    rect.height = Math.floor(rect.width / this.textureAspect);

    return rect;
  }

  getUI() {
    return this.subMenuElement.ui;
  }

  addTrackItemEvents() {
    const onSubMenuClick = this._onSubMenuClick.bind(this);
    // const onItemActive = this._onItemActive.bind(this);
    // this.getUI().timeLine.on({
    //   'track:item:active': onItemActive,
    // });
    if (this.trackItemElements && this.trackItemElements.length > 0) {
      this.trackItemElements.forEach((elem) => {
        elem.addEventListener('click', onSubMenuClick);
      });
    }
  }
}

export default TextureUI;

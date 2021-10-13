import TextureUI from '@/ui/withtexture';
// import snippet from 'tui-code-snippet';
import templateHtml from '@/ui/template/submenu/imitate';
import imitateHtml from '@/ui/template/texture/imitate';
// import { eventNames, selectorNames } from '@/consts';

class Imitate extends TextureUI {
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
    }
  ) {
    super(subMenuElement, {
      locale,
      name: 'imitate',
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
    this._els = {};
    // this.setup();
  }

  getTextureHtml() {
    return imitateHtml({
      locale: this.locale,
      headerStyle: this.theme.getStyle('header'),
      makeSvgIcon: this.makeSvgIcon,
      cssPrefix: this.cssPrefix,
    });
  }
}

export default Imitate;

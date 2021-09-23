import Submenu from '@/ui/submenuBase';
// import snippet from 'tui-code-snippet';
import templateHtml from '@/ui/template/submenu/make';

// import { eventNames, selectorNames } from '@/consts';

class Imitate extends Submenu {
  constructor(
    subMenuElement,
    { locale, makeSvgIcon, menuBarPosition, usageStatistics, cssPrefix }
  ) {
    super(subMenuElement, {
      locale,
      name: 'imitate',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
      cssPrefix,
    });
    this.cssPrefix = cssPrefix;
    this.type = null;

    this._els = {};
  }
}

export default Imitate;

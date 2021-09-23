// import { getHelpMenuBarPosition } from '@/util';

export default ({
  // locale,
  cStyle,
  // loadButtonStyle,
  // downloadButtonStyle,
  // uploadButtonStyle,
  // menuBarPosition,
  cssPrefix,
}) => `
    <div class="${cssPrefix}-media-controls" style="${cStyle}">
        <ul class="${cssPrefix}-submenu"></ul>
    </div>
`;

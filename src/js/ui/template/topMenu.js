import { getHelpMenuBarPosition } from '@/util';

export default ({
  locale,
  cStyle,
  loadButtonStyle,
  downloadButtonStyle,
  uploadButtonStyle,
  menuBarPosition,
  cssPrefix,
}) => `
    <ul class="${cssPrefix}-help-menu ${getHelpMenuBarPosition(menuBarPosition)}"></ul>
    <div class="${cssPrefix}-controls" style="${cStyle}">
        <div class="${cssPrefix}-controls-logo">
            
        </div>
        <ul class="${cssPrefix}-menu"></ul>

        <div class="${cssPrefix}-controls-buttons">
            <div style="${loadButtonStyle}">
                ${locale.localize('Load')}
                <input type="file" class="${cssPrefix}-load-btn" />
            </div>
            <button class="${cssPrefix}-download-btn" tag="download" style="${downloadButtonStyle}">
                ${locale.localize('Download')}
            </button>
            <button class="${cssPrefix}-download-btn" tag="upload" style="${uploadButtonStyle}">
                ${locale.localize('Upload')}
            </button>
        </div>
    </div>
`;

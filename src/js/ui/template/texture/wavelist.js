export default ({ locale, headerStyle, makeSvgIcon, cssPrefix }) => `
  
  <div class="${cssPrefix}-media-layer-top">
    <div class="${cssPrefix}-media-header" style="${headerStyle}">
        ${locale.localize('Audio')}
    </div>
  </div>
  <div class="${cssPrefix}-media-layer-main">
    <div class="${cssPrefix}-media-layer-main-tbbox">
      <div style="display:none;"><audio class="${cssPrefix}-audio"></audio></div>
      <div class="${cssPrefix}-media-layer-main-tbox">
        <div>
          <div class="${cssPrefix}-media-item">
            <div class="${cssPrefix}-media-load-frame">
              <div>
                  ${makeSvgIcon(['normal', 'active'], 'load', true)}
                  <div>${locale.localize('Drag and drop your audio here')}</div>
              </div>
              <input type="file" class="${cssPrefix}-media-load-btn main" multiple="multiple"
              accept=".mp3,.aac,.mp4,.webp"/>
            </div>
          </div>
        </div>
      </div>
      <div class="${cssPrefix}-media-layer-main-bbox">
        <div>
          <div class="${cssPrefix}-media-item">
            <div class="${cssPrefix}-media-load-frame">
              <div>
                  ${makeSvgIcon(['normal', 'active'], 'load', true)}
                  <div>${locale.localize('Drag and drop your audio here')}</div>
              </div>
              <input type="file" class="${cssPrefix}-media-load-btn slave" multiple="multiple"
              accept=".mp3,.aac,.mp4,.webp"/>
            </div>
          </div>
        </div>
      </div>
    
    </div>
  </div>
  
`;

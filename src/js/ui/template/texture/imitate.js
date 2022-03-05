export default ({ locale, headerStyle, cssPrefix, makeSvgIcon }) => `
  <div class="${cssPrefix}-media-layer-top">
    <div class="${cssPrefix}-media-header" style="${headerStyle}">
        ${locale.localize('Imitate')}
    </div>
    <div class="${cssPrefix}-media-loading ${cssPrefix}-menu">
      ${makeSvgIcon(['active'], 'loading1', false)}
    </div>
  </div>
  <div class="${cssPrefix}-media-layer-main">
    <div class="${cssPrefix}-media-layer-main-tbbox">
      <div class="${cssPrefix}-media-layer-main-tbox">
        <div>
          <div class="${cssPrefix}-media-item">
            <div class="${cssPrefix}-media-load-frame">
              <div>
                  ${makeSvgIcon(['normal', 'active'], 'load', true)}
                  <div>${locale.localize('Drag and drop your template here')}</div>
              </div>
              <input type="file" class="${cssPrefix}-media-load-btn main" multiple="multiple"
              accept=".vzip"/>
            </div>
          </div>
        </div>
      </div>
      <div class="${cssPrefix}-media-layer-main-bbox">
        <div></div>
      </div>
    </div>
  </div>
`;

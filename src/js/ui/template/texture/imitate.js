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
  
  </div>
`;

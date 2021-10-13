export default ({ locale, headerStyle, cssPrefix }) => `
  <div class="${cssPrefix}-media-layer-top">
  <div class="${cssPrefix}-media-header" style="${headerStyle}">
      ${locale.localize('Imitate')}
  </div>
  </div>
  <div class="${cssPrefix}-media-layer-main">

  </div>
`;

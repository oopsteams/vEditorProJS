export default ({ locale, headerStyle, makeSvgIcon, cssPrefix }) => `
  
  <div class="${cssPrefix}-media-layer-top">
    <div class="${cssPrefix}-media-header" style="${headerStyle}">
        ${locale.localize('Media')}
    </div>
  </div>
  <div class="${cssPrefix}-media-layer-main">
    <div class="${cssPrefix}-media-item">
      <div class="${cssPrefix}-media-load-frame">
        <div>
            ${makeSvgIcon(['normal', 'active'], 'load', true)}
            <div>${locale.localize('Drag and drop your media here')}</div>
        </div>
        <input type="file" class="${cssPrefix}-media-load-btn" multiple="multiple"
         accept=".mp4,.webp,.jpeg,.png,.jpg"/>
      </div>
    <div>
  </div>
  
`;

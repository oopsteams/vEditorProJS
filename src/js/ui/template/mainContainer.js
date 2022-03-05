import footbar from './footbar';
export default ({ locale, makeSvgIcon, biImage, commonStyle, headerStyle, cStyle, cssPrefix }) => `
  <div class="${cssPrefix}-main-layer">
    <div class="${cssPrefix}-layer-top">
      <div class="${cssPrefix}-header" style="${headerStyle}">
        <!--
          <div class="${cssPrefix}-header-logo">
            <img src="${biImage}" />
          </div>
          -->
          <div class="${cssPrefix}-header-menu"></div>
          
          <div class="${cssPrefix}-header-btn">
            <div class="${cssPrefix}-main-controls" style="${cStyle}">
                <ul class="${cssPrefix}-main-menu"></ul>
            </div>
          </div>
          
      </div>
    </div>
    <div class="${cssPrefix}-layer-main">
      <div class="${cssPrefix}-layer-main-left"></div>
      <div class="${cssPrefix}-layer-main-mid"></div>
      <div class="${cssPrefix}-layer-main-right">
        <!-- 视频窗口 -->
        <div class="${cssPrefix}-main-container" style="${commonStyle}">
          
          <div class="${cssPrefix}-main">
              <div class="${cssPrefix}-wrap">
                  <div class="${cssPrefix}-size-wrap">
                      <div class="${cssPrefix}-align-wrap">
                          <div class="${cssPrefix}"></div>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
    <div class="${cssPrefix}-layer-foot">
      ${footbar({ locale, makeSvgIcon, cssPrefix })}
      <div class="${cssPrefix}-timeline-wrap"></div>
    </div>
  </div>
`;

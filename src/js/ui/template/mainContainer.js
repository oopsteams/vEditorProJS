export default ({
  locale,
  commonStyle,
  headerStyle,
  loadButtonStyle,
  downloadButtonStyle,
  uploadButtonStyle,
  submenuStyle,
  cssPrefix,
}) => `
  <div class="${cssPrefix}-main-layer">
    <div class="${cssPrefix}-layer-top">
      <div class="${cssPrefix}-header" style="${headerStyle}">
          <div class="${cssPrefix}-header-logo"></div>
          <div class="${cssPrefix}-header-menu"></div>
          <div class="${cssPrefix}-header-buttons">
              <div style="${loadButtonStyle}">
                  ${locale.localize('Load')}
                  <input type="file" class="${cssPrefix}-load-btn" />
              </div>
              <button class="${cssPrefix}-download-btn" style="${downloadButtonStyle}">
                  ${locale.localize('Download')}
              </button>
              <button class="${cssPrefix}-download-btn" style="${uploadButtonStyle}">
                  ${locale.localize('Upload')}
              </button>
          </div>
      </div>
    </div>
    <div class="${cssPrefix}-layer-main">
      <div class="${cssPrefix}-layer-main-left">素材菜单栏</div>
      <div class="${cssPrefix}-layer-main-mid">素材框</div>
      <div class="${cssPrefix}-layer-main-right">
        <!-- 视频窗口 -->
        <div class="${cssPrefix}-main-container" style="${commonStyle}">
          
          <div class="${cssPrefix}-main">
              <!--
              <div class="${cssPrefix}-submenu">
                  <div class="${cssPrefix}-submenu-style" style="${submenuStyle}"></div>
              </div>
              -->
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
    <div class="${cssPrefix}-layer-foot">时间轴编辑器</div>
  </div>
`;

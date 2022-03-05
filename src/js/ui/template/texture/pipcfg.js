export default ({ locale, headerStyle, makeSvgIcon, cssPrefix }) => `
  <div class="${cssPrefix}-media-layer-top">
    <div class="${cssPrefix}-media-header" style="${headerStyle}">
        ${locale.localize('Pipcfg')}
    </div>
  </div>
  <div class="${cssPrefix}-media-layer-main">

    <div class="${cssPrefix}-media-layer-main-lrbox">

      <div class="${cssPrefix}-media-layer-main-lbox">
        <div class="${cssPrefix}-checkbox-wrap fixed-width">
          <div class="${cssPrefix}-checkbox">
              <label>
                  <input type="checkbox" class="tie-newtrack">
                  <span>${locale.localize('Newtrack')}</span>
              </label>
          </div>
        </div>
        <div class="${cssPrefix}-media-item">
          <div class="${cssPrefix}-media-load-frame">
            <input type="file" class="${cssPrefix}-media-load-btn"
          accept=".mp4,.webp,.jpeg,.png,.jpg,.svg"/>
            <div>
                ${makeSvgIcon(['normal', 'active', 'hover'], 'iupload', false)}
                <div>${locale.localize('Upload your media file')}</div>
            </div>
            
          </div>
        </div>
        <div class="${cssPrefix}-media-item">
          <div class="${cssPrefix}-media-button-frame">
            <div class="color-picker-ui shape" style="display:flex;" 
            title="${locale.localize('Color')}"></div>
          </div>
          <div style="display:flex;">
            <div class="${cssPrefix}-media-button-frame">
              <div class="shapes" mode="mstar">
                  ${makeSvgIcon(['normal', 'active', 'hover'], 'mstar', false)}
                  <div>${locale.localize('Mstar')}</div>
              </div>
            </div>
            <div class="${cssPrefix}-media-button-frame">
              <div class="shapes" mode="rect">
                  ${makeSvgIcon(['normal', 'active', 'hover'], 'rect', false)}
                  <div>${locale.localize('Rect')}</div>
              </div>
            </div>
            <div class="${cssPrefix}-media-button-frame">
              <div class="shapes" mode="circle">
                  ${makeSvgIcon(['normal', 'active', 'hover'], 'circle', false)}
                  <div>${locale.localize('Circle')}</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <div class="${cssPrefix}-media-layer-main-rbox">
        <!--
        <ul class="${cssPrefix}-menu" style="text-align:left;">
          <li class="${cssPrefix}-newline tie-text-button action" 
          tooltip-content="${locale.localize('Apply')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'apply', false)}
          </li>
        </ul>
        -->
        <div class="${cssPrefix}-media-table"></div>
      </div>
    </div>

  </div>
`;

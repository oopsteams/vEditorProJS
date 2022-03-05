export default ({ locale, headerStyle, makeSvgIcon, cssPrefix }) => `
  <div class="${cssPrefix}-media-layer-top">
  <div class="${cssPrefix}-media-header" style="${headerStyle}">
      ${locale.localize('Scenesetting')}
  </div>
  </div>
  <div class="${cssPrefix}-media-layer-main">
    <div class="${cssPrefix}-media-layer-main-lrbox">
      <div class="${cssPrefix}-media-layer-main-lbox">
        <ul class="${cssPrefix}-menu" style="text-align:left;">
          <li class="${cssPrefix}-newline">
            <span class="selector ${cssPrefix}-label">${locale.localize('Dimension')}</span>
            <div class="tie-text-selector dimension">
              <select title="${locale.localize('Dimension')}">
                <option value="1280x720">1280x720</option>
                <option value="720x1280">720x1280</option>
              </select>
            </div>
            <div class="${cssPrefix}-media-icon apply" style="display:inline-block;position:relative;">
              <ul class="${cssPrefix}-track-menu" style="text-align:left;">
            
                <li class="${cssPrefix}-newline ${cssPrefix}-track-item apply-button enabled" 
                tooltip-content="${locale.localize('Apply')}">
                  ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'apply', false)}
                </li>
                
              </ul>
            </div>
          </li>
          <li class="${cssPrefix}-newline">
            <span class="selector ${cssPrefix}-label">${locale.localize('Background')}</span>
            <div class="tie-text-selector background">
              <select title="${locale.localize('Background')}">
                <option value="sky">${locale.localize('Bluesky')}</option>
                <option value="color">${locale.localize('Colorsky')}</option>
                <option value="foreground">${locale.localize('Foreground')}</option>
                <option value="image">${locale.localize('Image')}</option>
                <option value="cylinder">${locale.localize('Cylinder')}</option>
              </select>
            </div>
            
            <div class="${cssPrefix}-media-icon apply" style="display:inline-block;position:relative;">
              <ul class="${cssPrefix}-track-menu" style="text-align:left;">
            
                <li class="${cssPrefix}-newline ${cssPrefix}-track-item bg-apply-button enabled" 
                tooltip-content="${locale.localize('Apply')}">
                  ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'apply', false)}
                </li>
                
              </ul>
            </div>
          </li>
          <li class="${cssPrefix}-newline" style="text-align:center;">
            <div class="${cssPrefix}-media-table">
              <div class="${cssPrefix}-media-row row" tag="image">
              </div>
              <div class="${cssPrefix}-media-row row" tag="cylinder">
              </div>
              <div class="${cssPrefix}-media-row row" tag="cylinderR">
              </div>
              <div class="${cssPrefix}-media-row row" tag="color">
                <div class="tie-text-color background" title="${locale.localize('Color')}"></div>
              </div>
            </div>
            <!--<div class="tie-text-color background" title="${locale.localize('Color')}"></div>-->
          </li>
        </ul>
          <!--<ul class="${cssPrefix}-menu" style="text-align:left;">
          
            <li class="${cssPrefix}-newline tie-text-button action" 
            tooltip-content="${locale.localize('Apply')}">
              ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'apply', false)}
            </li>
            
          </ul>-->
      </div>
      <div class="${cssPrefix}-media-layer-main-rbox">
        <div class="${cssPrefix}-media-table"></div>
          <!--
          <ul class="${cssPrefix}-submenu" style="text-align:center;">
            <li class="${cssPrefix}-newline">
              <span class="input ${cssPrefix}-media-label">
              ${locale.localize('Emptyduration')}</span>
              <input class="${cssPrefix}-media-duration" 
              placeholder="${locale.localize('3')}" type="number" 
              onkeyup="this.value=this.value.replace(/\\D/g,'')" ></input>
            </li>
            <li class="${cssPrefix}-newline">
              <div class="${cssPrefix}-media-load-frame">
                <input type="file" class="${cssPrefix}-media-load-btn"
              accept=".jpeg,.png,.jpg,.svg"/>
                <div>
                    ${makeSvgIcon(['normal', 'active', 'hover'], 'iupload', false)}
                    <div>${locale.localize('Upload your image file')}</div>
                </div>
              </div>
            </li>
          </ul>
          -->
      </div>
    </div>
  </div>
`;

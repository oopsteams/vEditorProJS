export default ({ locale, headerStyle, makeSvgIcon, cssPrefix, svgStyle }) => `
  <div class="${cssPrefix}-media-layer-top">
    <div class="${cssPrefix}-media-header" style="${headerStyle}">
        ${locale.localize('Text')}
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
        <ul class="${cssPrefix}-list" style="text-align:left;">
          <li class="${cssPrefix}-newline">
            <div class="${cssPrefix}-media-cell-h">
              <span class="input ${cssPrefix}-label">${locale.localize('Text')}</span>
              <div class="tie-text-input" title="${locale.localize('Text')}">
                  <input placeholder="${locale.localize('TextContent')}"></input>
              </div>
              <div class="${cssPrefix}-media-icon maintextcolorpicker" style="display:inline-block;position:relative;${svgStyle}">
                <svg class="${cssPrefix}-media-icon svg_ic-menu" style="${svgStyle}">
                  <use xlink:href="#ic-rect" style="${svgStyle}"></use>
                </svg>
              </div>
            </div>
          </li>
          <li class="${cssPrefix}-newline">
            <div class="${cssPrefix}-media-cell-h">
              <span class="selector ${cssPrefix}-label">${locale.localize('Family')}</span>
              <div class="tie-text-selector family">
                <select title="${locale.localize('Family')}">
                  <option value="Microsoft_YaHei_Regular.typeface.json">雅黑</option>
                  <option value="FZShouJinShu-S10S_regular.typeface.json">瘦金</option>
                  <option value="ZCOOL_XiaoWei_Regular.json">小魏</option>
                  <option value="ZCOOL_KuaiLe_Regular.json">欢乐</option>
                  <option value="ZCOOL_QingKe_HuangYou_Regular.json">幼圆黑</option>
                  <option value="Ma_Shan_Zheng_Regular.json">软笔</option>
                  <option value="Zhi_Mang_Xing_Regular.json">行书</option>
                  <option value="Liu_Jian_Mao_Cao_Regular.json">毛草</option>
                </select>
              </div>
            </div>
          </li>
          <li class="${cssPrefix}-newline">
            <div class="${cssPrefix}-media-cell-h">
              <span class="selector ${cssPrefix}-label">${locale.localize('Direction')}</span>
              <div class="tie-text-selector direction">
                <select title="${locale.localize('Direction')}">
                  <option value="horizontal">水平</option>
                  <option value="vertical">垂直</option>
                </select>
              </div>
            </div>
          </li>
          <li class="${cssPrefix}-newline">
            <div class="${cssPrefix}-media-cell-h">
              <span class="range ${cssPrefix}-label">${locale.localize('Text size')}</span>
              <div class="tie-text-range"></div>
              <input class="tie-text-range-value ${cssPrefix}-range-value" value="0" />
            </div>
          </li>
          <li class="${cssPrefix}-newline">
            <div class="${cssPrefix}-media-cell-h">
              <span class="range ${cssPrefix}-label">${locale.localize('Rotation')}</span>
              <div class="rotation-range"></div>
              <input class="rotation-range-value ${cssPrefix}-range-value" value="0" />
            </div>
          </li>
          
        </ul>
        <ul class="${cssPrefix}-submenu" style="text-align:left;">
          <li class="${cssPrefix}-newline tie-text-button action">
            <div class="${cssPrefix}-button apply">
                ${makeSvgIcon(['normal', 'active'], 'apply')}
                <label>
                    ${locale.localize('Apply')}
                </label>
            </div>
          </li>
        </ul>
        <ul class="${cssPrefix}-submenu" style="text-align:left;">
          <li class="${cssPrefix}-newline">
            <div class="${cssPrefix}-media-item">
              <div class="${cssPrefix}-media-load-frame">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'load', true)}
                    <div>${locale.localize('Drag and drop your lrc here')}</div>
                </div>
                <input type="file" class="${cssPrefix}-media-load-btn lrc" 
                accept=".lrc"/>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="${cssPrefix}-media-layer-main-rbox">
        <div class="${cssPrefix}-media-table"></div>
      </div>
    </div>

  </div>
`;

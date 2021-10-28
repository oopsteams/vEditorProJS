export default ({ locale, headerStyle, makeSvgIcon, cssPrefix }) => `
  <div class="${cssPrefix}-media-layer-top">
  <div class="${cssPrefix}-media-header" style="${headerStyle}">
      ${locale.localize('Text')}
  </div>
  </div>
  <div class="${cssPrefix}-media-layer-main">
    <div class="${cssPrefix}-media-layer-main-lrbox">
      <div class="${cssPrefix}-media-layer-main-lbox">
          <ul class="${cssPrefix}-submenu" style="text-align:left;">
            <li class="${cssPrefix}-newline">
              <span class="input ${cssPrefix}-label">${locale.localize('Text')}</span>
              <div class="tie-text-input" title="${locale.localize('Text')}">
                  <input placeholder="${locale.localize('TextContent')}"></input>
              </div>
            </li>
            <li class="${cssPrefix}-newline">
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
            </li>
            <li class="${cssPrefix}-newline">
              <span class="selector ${cssPrefix}-label">${locale.localize('Direction')}</span>
              <div class="tie-text-selector direction">
                <select title="${locale.localize('Direction')}">
                  <option value="horizontal">水平</option>
                  <option value="vertical">垂直</option>
                </select>
              </div>
            </li>
            <li class="${cssPrefix}-newline" style="text-align:center;">
              <div class="tie-text-color" title="${locale.localize('Color')}"></div>
            </li>
            <li class="${cssPrefix}-newline ${cssPrefix}-range-wrap">
              <label class="range">${locale.localize('Text size')}</label>
              <div class="tie-text-range"></div>
              <input class="tie-text-range-value ${cssPrefix}-range-value" value="0" />
            </li>
            <li class="${cssPrefix}-newline tie-text-button action">
              <div class="${cssPrefix}-button apply">
                  ${makeSvgIcon(['normal', 'active'], 'apply')}
                  <label>
                      ${locale.localize('Apply')}
                  </label>
              </div>
            </li>
            
          </ul>
      </div>
      <div class="${cssPrefix}-media-layer-main-rbox">
          <ul class="${cssPrefix}-submenu" style="text-align:center;">
            <li class="${cssPrefix}-newline">
              <div class="${cssPrefix}-text-sections"></div>
            </li>
          </ul>
      </div>
    </div>
  </div>
`;

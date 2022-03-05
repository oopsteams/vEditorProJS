export default ({
  snapshot,
  uid,
  locale,
  cellStyle,
  rowStyle,
  cssPrefix,
  imgStyle,
  svgStyle,
  subStyle,
}) => `
  <div class="${cssPrefix}-media-row row" style="${rowStyle}" uid="${uid}">
  
    <div class="${cssPrefix}-media-cell" style="${cellStyle}">
      <div class="${cssPrefix}-media-cell-h">
        <div class="${cssPrefix}-checkbox">
            <label>
                <input type="checkbox" class="pip-item check"/>
                <span></span>
            </label>
        </div>
        <img class="${cssPrefix}-media-icon" src="${snapshot}" style="${imgStyle}"/>
        <div class="${cssPrefix}-media-icon colorpicker" style="display:inline-block;position:relative;${svgStyle}">
          <svg class="${cssPrefix}-media-icon svg_ic-menu" style="${svgStyle}" uid="${uid}">
            <use xlink:href="#ic-${snapshot}" style="${svgStyle}"></use>
          </svg>
        </div>
      </div>
    </div>
    <div class="${cssPrefix}-media-cell" style="${cellStyle}">
      <span class="selector ${cssPrefix}-media-label">${locale.localize('Easein')}</span>
      <div class="${cssPrefix}-media-selector easein">
        <select title="${locale.localize('Easein')}" uid="${uid}">
          <option value="">${locale.localize('None')}</option>
          <option value="left">${locale.localize('Leftin')}</option>
          <option value="top">${locale.localize('Topin')}</option>
          <option value="right">${locale.localize('Rightin')}</option>
          <option value="bottom">${locale.localize('Bottomin')}</option>
          <option value="scale">${locale.localize('Scalein')}</option>
          <option value="fade">${locale.localize('Fadein')}</option>
        </select>
      </div>
    </div>
    <div class="${cssPrefix}-media-cell" style="${cellStyle}">
      <span class="selector ${cssPrefix}-media-label">${locale.localize('Easeout')}</span>
      <div class="${cssPrefix}-media-selector easeout">
        <select title="${locale.localize('Easeout')}" uid="${uid}">
          <option value="">${locale.localize('None')}</option>
          <option value="left">${locale.localize('Leftout')}</option>
          <option value="top">${locale.localize('Topout')}</option>
          <option value="right">${locale.localize('Rightout')}</option>
          <option value="bottom">${locale.localize('Bottomout')}</option>
          <option value="scale">${locale.localize('Scaleout')}</option>
          <option value="fade">${locale.localize('Fadeout')}</option>
        </select>
      </div>
    </div>
    <div class="${cssPrefix}-media-cell" style="${cellStyle}">
        <span class="selector ${cssPrefix}-media-label">${locale.localize('Duration')}</span>
        <!-- <input class="${cssPrefix}-media-value duration" value="0" /> -->
        <span class="${cssPrefix}-media-label duration"></span>
    </div>
    <div class="${cssPrefix}-media-cell" style="${cellStyle}">
        <svg class="${cssPrefix}-media-icon svg_ic-menu locker" style="${svgStyle}" uid="${uid}">
          <use xlink:href="#ic-unlock" class="unlock" style="${svgStyle}"></use>
          <use xlink:href="#ic-lock" class="lock" style="${svgStyle}"></use>
        </svg>
    </div>
    <div class="${cssPrefix}-media-sub-table subtable" uid="${uid}" style="${subStyle}">
      <div class="${cssPrefix}-media-row " uid="${uid}">
        <div class="${cssPrefix}-media-cell" style="${cellStyle}">
          <div class="${cssPrefix}-media-cell-table celltable">

            <div class="${cssPrefix}-media-row subrow" uid="${uid}">
              <div class="${cssPrefix}-media-cell" style="${cellStyle}">
                <div class="${cssPrefix}-media-cell-h">
                  <span class="input ${cssPrefix}-media-label">${locale.localize('Text')}</span>
                  <input class="${cssPrefix}-media-value text" 
                  placeholder="${locale.localize('TextContent')}" uid="${uid}"></input>
                </div>
              </div>
              <div class="${cssPrefix}-media-cell" style="${cellStyle}">
                <div class="${cssPrefix}-media-cell-h">
                  <div class="${cssPrefix}-media-icon txtcolorpicker" style="display:inline-block;position:relative;${svgStyle}">
                    <svg class="${cssPrefix}-media-icon svg_ic-menu" style="${svgStyle}" uid="${uid}">
                      <use xlink:href="#ic-rect" style="${svgStyle}"></use>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="${cssPrefix}-media-cell" style="${cellStyle}">
                <div class="${cssPrefix}-media-cell-h">
                  <span class="selector ${cssPrefix}-media-label">
                  ${locale.localize('Family')}</span>
                  <div class="${cssPrefix}-media-selector family">
                    <select title="${locale.localize('Family')}" uid="${uid}">
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
              </div>
              
              <div class="${cssPrefix}-media-cell" style="${cellStyle}">
                <div class="${cssPrefix}-media-cell-h">
                  <span class="selector ${cssPrefix}-media-label">
                  ${locale.localize('Direction')}</span>
                  <div class="${cssPrefix}-media-selector direction">
                    <select title="${locale.localize('Direction')}" uid="${uid}">
                      <option value="horizontal">水平</option>
                      <option value="vertical">垂直</option>
                    </select>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
        
      </div>
      <div class="${cssPrefix}-media-row subrow" uid="${uid}">
        <div class="${cssPrefix}-media-cell" style="${cellStyle}">
          <div class="${cssPrefix}-media-cell-h">
            <span class="range ${cssPrefix}-media-label">${locale.localize('Text size')}</span>
            <div class="slider-range ${cssPrefix}-range"></div>
            <input class="${cssPrefix}-media-range-value fontsize" value="10" uid="${uid}"/>
          </div>
        </div>
      </div>

      <div class="${cssPrefix}-media-row subrow" uid="${uid}">
        <div class="${cssPrefix}-media-cell" style="${cellStyle}">
          <div class="${cssPrefix}-media-cell-table celltable" style="height:2px;">
          </div>
        </div>
      </div>
      
      <div class="${cssPrefix}-media-row subrow" uid="${uid}">
        
      </div>
    </div>
    <div class="${cssPrefix}-media-sub-table subtable2" uid="${uid}" style="${subStyle}">
      <div class="${cssPrefix}-media-row subrow" uid="${uid}">
        <div class="${cssPrefix}-media-cell" style="${cellStyle}">
          <div class="${cssPrefix}-media-cell-h">
            <span class="range ${cssPrefix}-media-label">${locale.localize('Scale size')}</span>
            <div class="slider-range ${cssPrefix}-range"></div>
            <input class="${cssPrefix}-media-range-value scalesize" value="0" uid="${uid}"/>
          </div>
        </div>
      </div>
      <div class="${cssPrefix}-media-row subrow" uid="${uid}">
        <div class="${cssPrefix}-media-cell" style="${cellStyle}">
          <div class="${cssPrefix}-media-cell-table celltable" style="height:2px;">
          </div>
        </div>
      </div>
    </div>
    <div class="${cssPrefix}-media-sub-table subtable3" uid="${uid}" style="${subStyle}">
      <div class="${cssPrefix}-media-row subrow" uid="${uid}">
        <div class="${cssPrefix}-media-cell" style="${cellStyle}">
          <div class="${cssPrefix}-media-cell-h">
            <span class="range ${cssPrefix}-media-label">${locale.localize('Reset')}</span>
            <input type="button" class="${cssPrefix}-center-btn" 
            value="${locale.localize('Center')}" uid="${uid}"/>
          </div>
        </div>
      </div>
      <div class="${cssPrefix}-media-row subrow" uid="${uid}">
        <div class="${cssPrefix}-media-cell" style="${cellStyle}">
          <div class="${cssPrefix}-media-cell-h">
            <span class="range ${cssPrefix}-media-label">${locale.localize('Attach')}</span>
            <div class="${cssPrefix}-media-selector attach">
              <select title="${locale.localize('Attach')}" uid="${uid}">
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

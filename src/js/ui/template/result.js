export default ({ locale, makeSvgIcon, cssPrefix }) => `
  <li class="tie-btn-play ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('play')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'animation', false)}
      <a class="${cssPrefix}-result-download" target="_blank"></a>
  </li>
  <li class="${cssPrefix}-vpartition ${cssPrefix}-item">
      <div></div>
  </li>
  <li class="tie-btn-deleteall ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('deleteall')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'deleteall', false)}
  </li>
  <li class="tie-btn-export ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('export')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'back', false)}
  </li>
  <li class="${cssPrefix}-vpartition ${cssPrefix}-item">
      <div></div>
  </li>
  <li class="tie-btn-apply ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('apply')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'check', false)}
  </li>
  <li class="${cssPrefix}-vpartition ${cssPrefix}-item">
      <div></div>
  </li>
  <li class="tie-btn-back ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('goback')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'back', false)}
  </li>
`;

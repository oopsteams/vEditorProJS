export default ({ locale, makeSvgIcon, cssPrefix }) => `
  <li class="tie-btn-download ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('Download')}">
      <a class="${cssPrefix}-result-download" target="_blank"></a>
  </li>
  <li class="${cssPrefix}-vpartition ${cssPrefix}-item">
      <div></div>
  </li>
  <li class="tie-btn-deleteall ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('DeleteAll')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'deleteall', false)}
  </li>
  <li class="tie-btn-export ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('Export')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'export', false)}
  </li>
  <li class="${cssPrefix}-vpartition ${cssPrefix}-item">
      <div></div>
  </li>
  <li class="tie-btn-apply ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('Apply')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'check', false)}
  </li>
  <li class="${cssPrefix}-vpartition ${cssPrefix}-item">
      <div></div>
  </li>
  <li class="tie-btn-back ${cssPrefix}-item normal" 
  tooltip-content="${locale.localize('Back')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'back', false)}
  </li>
`;

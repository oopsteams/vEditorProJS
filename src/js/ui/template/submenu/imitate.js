export default ({ locale, makeSvgIcon, cssPrefix }) => `
<ul class="${cssPrefix}-track-menu imitate">
  <li class="tie-button-delete ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Delete')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'delete', false)}
  </li>
  <li class="${cssPrefix}-partition">
      <div></div>
  </li>
  <li class="tie-button-apply ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Apply')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'apply', false)}
  </li>      
  
  <li class="tie-button-play ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Play')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'play', false)}
  </li>
  <li class="tie-button-pause ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Pause')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'pause', false)}
  </li>
</ul>
`;

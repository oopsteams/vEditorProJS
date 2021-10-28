export default ({ locale, makeSvgIcon, cssPrefix }) => `
<ul class="${cssPrefix}-track-menu wave">
  <li class="tie-button-back ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('back')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'back', false)}
  </li>

  <li class="${cssPrefix}-partition">
      <div></div>
  </li>
  <li class="tie-button-delete ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('delete')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'delete', false)}
  </li>
  <li class="tie-button-play ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('play')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'play', false)}
  </li>
  <li class="tie-button-pause ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('pause')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'pause', false)}
  </li>
</ul>
`;

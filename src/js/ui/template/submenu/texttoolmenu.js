export default ({ locale, makeSvgIcon, cssPrefix }) => `
<ul class="${cssPrefix}-track-menu text">
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
</ul>
`;

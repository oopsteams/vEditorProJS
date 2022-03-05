export default ({ locale, makeSvgIcon, cssPrefix }) => `
<ul class="${cssPrefix}-track-menu transition">
  <li class="tie-button-back ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Back')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'back', false)}
  </li>

  <li class="${cssPrefix}-partition">
      <div></div>
  </li>
  <li class="tie-button-delete ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Delete')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'delete', false)}
  </li>
</ul>
`;

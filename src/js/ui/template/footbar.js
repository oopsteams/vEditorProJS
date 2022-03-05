export default ({ locale, makeSvgIcon, cssPrefix }) => `
<ul class="${cssPrefix}-foot-bar ${cssPrefix}-controls">
  <li class="tie-button-first-frame ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('FirstFrame')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'pre', false)}
  </li>

  <li class="tie-button-tail-frame ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('TailFrame')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'next', false)}
  </li>
</ul>
`;

export default ({ locale, makeSvgIcon, cssPrefix }) => `
<ul class="${cssPrefix}-track-menu imitate">
  <li class="tie-button-split ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('split')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'split', false)}
  </li>
  <li class="${cssPrefix}-partition">
      <div></div>
  </li>
        

</ul>
`;

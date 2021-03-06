export default ({ locale, makeSvgIcon, cssPrefix }) => `
<ul class="${cssPrefix}-track-menu templateInstance">
  <li class="tie-button-back ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Back')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'back', false)}
  </li>

  <li class="${cssPrefix}-partition">
      <div></div>
  </li>
  <li class="tie-button-confirm ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Apply')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'apply', false)}
  </li>
  <!--
  <li class="tie-button-play ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Play')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'play', false)}
  </li>
  <li class="tie-button-pause ${cssPrefix}-track-item" 
  tooltip-content="${locale.localize('Pause')}">
      ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'pause', false)}
  </li>-->
</ul>
`;

export default ({ locale, makeSvgIcon, cssPrefix }) => `
    <ul class="${cssPrefix}-track-menu make">
        <li class="tie-button-split ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('split')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'split', false)}
        </li>
        <li class="tie-button-transition ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('transition')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'transition', false)}
        </li>
        <li class="tie-button-separate ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('separate')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'separate', false)}
        </li>
        <li class="tie-button-filter ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('filter')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'filter', false)}
        </li>
        <li class="tie-button-delete ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('delete')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'delete', false)}
        </li>
        <li class="tie-button-animation ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('animation')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'animation', false)}
        </li>
        <li class="tie-button-back ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('back')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'back', false)}
        </li>
        <li class="tie-button-music ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('music')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'music', false)}
        </li>
    </ul>
`;

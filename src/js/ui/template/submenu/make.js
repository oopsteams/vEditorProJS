export default ({ locale, makeSvgIcon, cssPrefix }) => `
    <ul class="${cssPrefix}-track-menu make">
        <li class="tie-button-transition ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Transition')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'transition', false)}
        </li>
        <li class="tie-button-music ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Music')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'music', false)}
        </li>
        
        <!--
        <li class="tie-button-filter ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Filter')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'filter', false)}
        </li>
        -->
        
        <li class="tie-button-animation ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Animation')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'animation', false)}
        </li>
        <li class="tie-button-sceneeffect ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Sceneeffect')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'sceneeffect', false)}
        </li>
        <li class="${cssPrefix}-partition">
            <div></div>
        </li>
        <li class="tie-button-text ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Text')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'text', false)}
        </li>
        <li class="tie-button-pip ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Pip')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'pip', false)}
        </li>
        
        <!--li class="tie-button-foreground ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Canvas')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'foregroundeffect', false)}
        </li-->
        
        <li class="${cssPrefix}-partition">
            <div></div>
        </li>
        <li class="tie-button-delete ${cssPrefix}-track-item" 
        tooltip-content="${locale.localize('Delete')}">
            ${makeSvgIcon(['normal', 'active', 'hover', 'disabled'], 'delete', false)}
        </li>
        
        <li class="${cssPrefix}-partition">
            <div></div>
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

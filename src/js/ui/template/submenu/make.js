export default ({ locale, makeSvgIcon, cssPrefix }) => `
    <ul class="${cssPrefix}-submenu-item">
        <li class="tie-shape-button">
            <div class="${cssPrefix}-button make">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'media', true)}
                </div>
                <label> ${locale.localize('make')} </label>
            </div>
            
        </li>
        <li class="${cssPrefix}-partition">
            <div></div>
        </li>
        

    </ul>
`;

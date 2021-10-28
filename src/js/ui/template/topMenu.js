import { getHelpMenuBarPosition } from '@/util';

export default ({ cStyle, menuBarPosition, cssPrefix }) => `
    <!--<ul class="${cssPrefix}-help-menu ${getHelpMenuBarPosition(menuBarPosition)}"></ul>-->
    <div class="${cssPrefix}-controls" style="${cStyle}">
        <!--<div class="${cssPrefix}-controls-logo">
        </div>-->
        <ul class="${cssPrefix}-menu"></ul>
    </div>
`;

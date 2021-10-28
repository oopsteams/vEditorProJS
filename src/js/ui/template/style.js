export default ({
  subMenuLabelActive,
  subMenuLabelNormal,
  subMenuRangeTitle,
  submenuPartitionVertical,
  submenuPartitionHorizontal,
  submenuCheckbox,
  submenuRangePointer,
  submenuRangeValue,
  submenuColorpickerTitle,
  submenuColorpickerButton,
  submenuRangeBar,
  submenuRangeSubbar,
  submenuDisabledRangePointer,
  submenuDisabledRangeBar,
  submenuDisabledRangeSubbar,
  submenuIconSize,
  menuIconSize,
  biSize,
  menuIconStyle,
  submenuIconStyle,
  cssPrefix,
}) => `
    .tie-icon-add-button.icon-bubble .${cssPrefix}-button[data-icontype="icon-bubble"] label,
    .tie-icon-add-button.icon-heart .${cssPrefix}-button[data-icontype="icon-heart"] label,
    .tie-icon-add-button.icon-location .${cssPrefix}-button[data-icontype="icon-location"] label,
    .tie-icon-add-button.icon-polygon .${cssPrefix}-button[data-icontype="icon-polygon"] label,
    .tie-icon-add-button.icon-star .${cssPrefix}-button[data-icontype="icon-star"] label,
    .tie-icon-add-button.icon-star-2 .${cssPrefix}-button[data-icontype="icon-star-2"] label,
    .tie-icon-add-button.icon-arrow-3 .${cssPrefix}-button[data-icontype="icon-arrow-3"] label,
    .tie-icon-add-button.icon-arrow-2 .${cssPrefix}-button[data-icontype="icon-arrow-2"] label,
    .tie-icon-add-button.icon-arrow .${cssPrefix}-button[data-icontype="icon-arrow"] label,
    .tie-icon-add-button.icon-bubble .${cssPrefix}-button[data-icontype="icon-bubble"] label,
    .tie-draw-line-select-button.line .${cssPrefix}-button.line label,
    .tie-draw-line-select-button.free .${cssPrefix}-button.free label,
    .tie-flip-button.flipX .${cssPrefix}-button.flipX label,
    .tie-flip-button.flipY .${cssPrefix}-button.flipY label,
    .tie-flip-button.resetFlip .${cssPrefix}-button.resetFlip label,
    .tie-crop-button .${cssPrefix}-button.apply.active label,
    .tie-crop-preset-button .${cssPrefix}-button.preset.active label,
    .tie-shape-button.rect .${cssPrefix}-button.rect label,
    .tie-shape-button.circle .${cssPrefix}-button.circle label,
    .tie-shape-button.triangle .${cssPrefix}-button.triangle label,
    .tie-text-effect-button .${cssPrefix}-button.active label,
    .tie-text-align-button.left .${cssPrefix}-button.left label,
    .tie-text-align-button.center .${cssPrefix}-button.center label,
    .tie-text-align-button.right .${cssPrefix}-button.right label,
    .tie-mask-apply.apply.active .${cssPrefix}-button.apply label,
    .${cssPrefix}-container .${cssPrefix}-submenu .${cssPrefix}-button:hover > label,
    .${cssPrefix}-container .${cssPrefix}-checkbox label > span {
        ${subMenuLabelActive}
    }
    .${cssPrefix}-container .${cssPrefix}-submenu .${cssPrefix}-button > label,
    .${cssPrefix}-container .${cssPrefix}-range-wrap.${cssPrefix}-newline.short label,
    .${cssPrefix}-container .${cssPrefix}-range-wrap.${cssPrefix}-newline.short label > span {
        ${subMenuLabelNormal}
    }
    .${cssPrefix}-container .${cssPrefix}-range-wrap label > span {
        ${subMenuRangeTitle}
    }
    .${cssPrefix}-container .${cssPrefix}-partition > div {
        ${submenuPartitionVertical}
    }
    .${cssPrefix}-container.left .${cssPrefix}-submenu .${cssPrefix}-partition > div,
    .${cssPrefix}-container.right .${cssPrefix}-submenu .${cssPrefix}-partition > div {
        ${submenuPartitionHorizontal}
    }
    .${cssPrefix}-container .${cssPrefix}-checkbox label > span:before {
        ${submenuCheckbox}
    }
    .${cssPrefix}-container .${cssPrefix}-checkbox label > input:checked + span:before {
        border: 0;
    }
    .${cssPrefix}-container .${cssPrefix}-virtual-range-pointer {
        ${submenuRangePointer}
    }
    .${cssPrefix}-container .${cssPrefix}-virtual-range-bar {
        ${submenuRangeBar}
    }
    .${cssPrefix}-container .${cssPrefix}-virtual-range-subbar {
        ${submenuRangeSubbar}
    }
    .${cssPrefix}-container .${cssPrefix}-disabled .${cssPrefix}-virtual-range-pointer {
        ${submenuDisabledRangePointer}
    }
    .${cssPrefix}-container .${cssPrefix}-disabled .${cssPrefix}-virtual-range-subbar {
        ${submenuDisabledRangeSubbar}
    }
    .${cssPrefix}-container .${cssPrefix}-disabled .${cssPrefix}-virtual-range-bar {
        ${submenuDisabledRangeBar}
    }
    .${cssPrefix}-container .${cssPrefix}-range-value {
        ${submenuRangeValue}
    }
    .${cssPrefix}-container .${cssPrefix}-submenu .${cssPrefix}-button .color-picker-value + label {
        ${submenuColorpickerTitle}
    }
    .${cssPrefix}-container .${cssPrefix}-submenu .${cssPrefix}-button .color-picker-value {
        ${submenuColorpickerButton}
    }
    .${cssPrefix}-container .svg_ic-menu {
        ${menuIconSize}
    }
    .${cssPrefix}-container .svg_ic-submenu {
        ${submenuIconSize}
    }
    .${cssPrefix}-container .${cssPrefix}-controls-logo > img,
    .${cssPrefix}-container .${cssPrefix}-header-logo > img {
        ${biSize}
    }
    .${cssPrefix}-track-menu use.normal.use-default,
    .${cssPrefix}-menu use.normal.use-default,
    .${cssPrefix}-main-menu use.normal.use-default,
    .${cssPrefix}-help-menu use.normal.use-default {
        fill-rule: evenodd;
        fill: "transparent";
        stroke: ${menuIconStyle.normal.color};
    }
    .${cssPrefix}-track-menu use.active.use-default,
    .${cssPrefix}-menu use.active.use-default,
    .${cssPrefix}-main-menu use.active.use-default,
    .${cssPrefix}-help-menu use.active.use-default {
        fill-rule: evenodd;
        fill: ${menuIconStyle.hover.color};
        stroke: ${menuIconStyle.active.color};
    }
    .${cssPrefix}-track-menu use.hover.use-default,
    .${cssPrefix}-menu use.hover.use-default,
    .${cssPrefix}-main-menu use.hover.use-default,
    .${cssPrefix}-help-menu use.hover.use-default {
        fill-rule: evenodd;
        fill: ${menuIconStyle.hover.color};
        stroke: ${menuIconStyle.hover.color};
    }
    .${cssPrefix}-menu use.disabled.use-default,
    .${cssPrefix}-main-menu use.disabled.use-default,
    .${cssPrefix}-help-menu use.disabled.use-default {
        fill-rule: evenodd;
        fill: ${menuIconStyle.disabled.color};
        stroke: ${menuIconStyle.disabled.color};
    }
    .${cssPrefix}-track-menu use.disabled.use-default {
      fill-rule: evenodd;
      fill: ${menuIconStyle.disabled.color};
      stroke: ${menuIconStyle.disabled.color};
    }
    .${cssPrefix}-submenu use.normal.use-default {
        fill-rule: evenodd;
        fill: ${submenuIconStyle.normal.color};
        stroke: ${submenuIconStyle.normal.color};
    }
    .${cssPrefix}-submenu use.active.use-default {
        fill-rule: evenodd;
        fill: ${submenuIconStyle.active.color};
        stroke: ${submenuIconStyle.active.color};
    }
`;

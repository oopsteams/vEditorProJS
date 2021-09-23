// Type definitions for Video Editor v1.0.0
// TypeScript Version: 3.2.2

declare namespace vEditorProJS {
    
    interface IThemeConfig {
        'common.bi.image'?: string;
        'common.bisize.width'?: string;
        'common.bisize.height'?: string;
        'common.backgroundImage'?: string;
        'common.backgroundColor'?: string;
        'common.border'?: string;
        'header.backgroundImage'?: string;
        'header.backgroundColor'?: string;
        'header.border'?: string;
        'loadButton.backgroundColor'?: string;
        'loadButton.border'?: string;
        'loadButton.color'?: string;
        'loadButton.fontFamily'?: string;
        'loadButton.fontSize'?: string;
        'downloadButton.backgroundColor'?: string;
        'downloadButton.border'?: string;
        'downloadButton.color'?: string;
        'downloadButton.fontFamily'?: string;
        'downloadButton.fontSize'?: string;
        'menu.normalIcon.path'?: string;
        'menu.normalIcon.name'?: string;
        'menu.activeIcon.path'?: string;
        'menu.activeIcon.name'?: string;
        'menu.iconSize.width'?: string;
        'menu.iconSize.height'?: string;
        'submenu.backgroundColor'?: string;
        'submenu.partition.color'?: string;
        'submenu.normalIcon.path'?: string;
        'submenu.normalIcon.name'?: string;
        'submenu.activeIcon.path'?: string;
        'submenu.activeIcon.name'?: string;
        'submenu.iconSize.width'?: string;
        'submenu.iconSize.height'?: string;
        'submenu.normalLabel.color'?: string;
        'submenu.normalLabel.fontWeight'?: string;
        'submenu.activeLabel.color'?: string;
        'submenu.activeLabel.fontWeight'?: string;
        'checkbox.border'?: string;
        'checkbox.backgroundColor'?: string;
        'range.pointer.color'?: string;
        'range.bar.color'?: string;
        'range.subbar.color'?: string;
        'range.value.color'?: string;
        'range.value.fontWeight'?: string;
        'range.value.fontSize'?: string;
        'range.value.border'?: string;
        'range.value.backgroundColor'?: string;
        'range.title.color'?: string;
        'range.title.fontWeight'?: string;
        'colorpicker.button.border'?: string;
        'colorpicker.title.color'?: string;
    }

    interface IIncludeUIOptions {
        loadImage?: {
          path: string;
          name: string;
        };
        theme?: IThemeConfig;
        menu?: string[];
        initMenu?: string;
        uiSize?: {
          width: string;
          height: string;
        };
        menuBarPosition?: string;
        usageStatistics?: boolean;
    }

    interface ISelectionStyleConfig {
        cornerStyle?: string;
        cornerSize?: number;
        cornerColor?: string;
        cornerStrokeColor?: string;
        transparentCorners?: boolean;
        lineWidth?: number;
        borderColor?: string;
        rotatingPointOffset?: number;
    }

    interface IOptions {
        includeUI?: IIncludeUIOptions;
        cssMaxWidth?: number;
        cssMaxHeight?: number;
        usageStatistics?: boolean;
        selectionStyle?: ISelectionStyleConfig;
    }

    interface IUIDimension {
        height?: string;
        width?: string;
    }

    interface IImageDimension {
        oldHeight?: number;
        oldWidth?: number;
        newHeight?: number;
        newWidth?: number;
    }

    interface IEditorSize {
        uiSize?: IUIDimension;
        imageSize?: IImageDimension;
    }

    interface UI {
        resizeEditor(dimension: IEditorSize): Promise<void>;
    }

    class VideoEditor {
        constructor(wrapper: string | Element, options: IOptions);
        public ui: UI;
    }
}
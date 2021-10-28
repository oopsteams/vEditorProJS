# vEditorProJS
Pro JS Video Editor
elvis_su@139.com
## Demo
![Image demo](https://raw.githubusercontent.com/oopsteams/vEditorProJS/master/newEditor.jpeg)
#   
## Add SubMenu
### */ui/template/texture/*  
#### construct "main-mid media-layer" html.
### *ui/template/submenu/* 
#### construct "layer-main-left" menu html.
### *ui/*  
#### menu control
_update name_  
name: 'animation'
### *texture.style*  
.{prefix}-layer-main-mid.animation  
    .{prefix}-media-layer.animation  
        display: flex;  

### *submenu.style*  
.{prefix}-layer-main-left  
    .{prefix}-media-controls.animation  
        .{prefix}-track-menu.animation  
            display: block;  
 
### *ui/template/style*  
set icon
### *ui/make.js*  
modify menu tags

*/timeline/component/*  
*/timeline/model/*  
### add icon
default.svg

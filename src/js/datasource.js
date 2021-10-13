import snippet from 'tui-code-snippet';
const { CustomEvents } = snippet;

class DataSource {
  constructor({ context }, editor) {
    this.context = context;
    this.editor = editor;
  }
}
CustomEvents.mixin(DataSource);

export default DataSource;

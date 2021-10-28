class EmptyParser {
  constructor(width, height) {
    this.totalSeconds = 3;
    this.srcFileName = '';
    this.fileType = 'none';
    this.mime = 'none';
    this.frameImages = [];
    this.metadata = { width, height };
    Object.defineProperty(this, 'total_seconds', {
      value: this.totalSeconds,
      writable: true,
    });
  }

  parseKeyFrameImages() {
    if (this.frameImages.length === 0) {
      this.frameImages = [{ url: null }, { url: null }, { url: null }];
    }

    return Promise.resolve(this.frameImages);
  }

  setup() {
    const section = { mime: 'none', file: { type: 'url', data: null }, dur: this.totalSeconds };
    this.section = section;
    const _section = { root: section };
    for (const k in section) {
      if (section[k]) {
        _section[k] = section[k];
      }
    }

    return Promise.resolve(_section);
  }
}

export default EmptyParser;

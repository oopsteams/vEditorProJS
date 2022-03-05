let EP_COUNTER = 0;
class EmptyParser {
  constructor(width, height) {
    this.totalSeconds = 3;
    this.srcFileName = '';
    this.fileType = 'none';
    this.mime = 'none';
    this.frameImages = [];
    this.metadata = { width, height };
    this.uid = `EP_${EP_COUNTER}`;
    EP_COUNTER += 1;
    Object.defineProperty(this, 'total_seconds', {
      value: this.totalSeconds,
      writable: true,
    });
  }

  updateDuation(seconds) {
    this.totalSeconds = seconds;
    this.total_seconds = seconds;
    console.log('emptyparser updateDuation totalSeconds:', this.totalSeconds);
  }

  parseKeyFrameImages() {
    if (this.frameImages.length !== this.totalSeconds) {
      this.frameImages = [];
      for (let i = 0, n = this.totalSeconds; i < n; i += 1) {
        this.frameImages.push({ url: null });
      }
      // this.frameImages = [{ url: null }, { url: null }, { url: null }];
    }

    return Promise.resolve(this.frameImages);
  }

  setup() {
    const section = { mime: 'none', file: { type: 'url', data: this.uid }, dur: this.totalSeconds };
    this.section = section;
    const _section = { root: section };
    for (const k in section) {
      if (section[k]) {
        _section[k] = section[k];
      }
    }

    return Promise.resolve(_section);
  }

  dispose() {}
}

export default EmptyParser;

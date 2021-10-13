/**
 * Component interface
 * @class
 * @param {string} name - component name
 * @param {TimeLine} timeline - TimeLine instance
 * @ignore
 */
class Component {
  constructor(name, timeline) {
    this.name = name;
    this.timeline = timeline;
  }

  fire(...args) {
    const context = this.timeline;
    return this.timeline.fire.apply(context, args);
  }

  getCanvasElement() {
    return this.timeline.getCanvasElement();
  }

  getCanvas() {
    return this.timeline.getCanvas();
  }

  getName() {
    return this.name;
  }
}

export default Component;

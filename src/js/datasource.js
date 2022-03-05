import snippet from 'tui-code-snippet';
const { CustomEvents } = snippet;
import { iterator } from '@/util';

class DataSource {
  constructor({ context }, editor) {
    this.ui = context;
    this.editor = editor;
    this._attachEvent();
  }

  installWave(template) {
    const { makeInstance } = this.ui._subMenuElement;
    const { audioList } = template;
    const { waveList } = makeInstance;
    audioList.forEach((bgm) => {
      waveList.setupWave(bgm);
    });
    // if (bgm) {
    //   waveList._onAudioLoaded({
    //     parser: bgm,
    //     callback: () => {
    //       waveList.setupWave(bgm);
    //     },
    //   });
    // }
  }

  installTextEffect(template) {
    const { makeInstance } = this.ui._subMenuElement;
    const { sections } = template;
    const commonSections = [];
    const effectSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      } else if (sec.action === 'text') {
        effectSections.push(sec);
      }
    });
    const { textTool } = makeInstance;
    const setupTextEffect = () => {
      iterator(
        effectSections,
        (sec, index, comeon) => {
          console.log('effect sec:', sec);
          if (index >= 0) {
            const { textSections } = sec;
            const [firstTextSection] = textSections;
            console.log('firstTextSection:', firstTextSection);
            textTool.setupText(firstTextSection, () => {
              textSections.forEach((ts, idx) => {
                if (idx > 0) {
                  textTool.addSection(ts);
                }
              });
              comeon(true);
            });
          }
        },
        () => {
          this.installAnimations(template);
        }
      );
    };
    setupTextEffect();
  }

  installSceneEffects(template) {
    const { makeInstance } = this.ui._subMenuElement;
    const { sections } = template;
    const commonSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      }
    });
    const { sceneEffect } = makeInstance;

    const setupSceneEffects = () => {
      iterator(
        commonSections,
        (item, idx, comeon) => {
          if (idx >= 0) {
            if (item.sceneeffects && item.sceneeffects.length > 0) {
              const trackItem = this.ui.timeLine.track.getItemByUid(item.uid);
              iterator(
                item.sceneeffects,
                (se, _idx, _comeon) => {
                  if (_idx >= 0) {
                    // const { mode } = se;
                    // const cfg = sceneEffect.getSeByMode(mode);
                    sceneEffect.setupSceneEffect(trackItem, se, () => {
                      _comeon(true);
                    });
                  }
                },
                () => {
                  comeon(true);
                }
              );
            } else {
              comeon(true);
            }
          }
        },
        () => {
          console.log('installSceneEffects complete!');
          this.installWave(template);
        }
      );
    };

    if (!sceneEffect.inited) {
      sceneEffect.initDatas(() => {
        setupSceneEffects();
      });
    } else {
      setupSceneEffects();
    }
  }

  installAnimations(template) {
    const { makeInstance } = this.ui._subMenuElement;
    const { sections } = template;
    const commonSections = [];
    const effectSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      } else if (sec.action === 'text') {
        effectSections.push(sec);
      }
    });
    const { animationControl } = makeInstance;
    const setupAnimations = () => {
      iterator(
        commonSections,
        (item, idx, comeon) => {
          if (idx >= 0) {
            if (item.animations && item.animations.length > 0) {
              const trackItem = this.ui.timeLine.track.getItemByUid(item.uid);
              // item.animations.forEach((animation) => {
              //   const { mode } = animation;
              //   const animationSection = animationControl.getAnimationSectionByMode(mode);
              // });
              iterator(
                item.animations,
                (animation, _idx, _comeon) => {
                  if (_idx >= 0) {
                    const { mode } = animation;
                    const animationSection = animationControl.getAnimationSectionByMode(mode);
                    animationControl.setupAnimation(trackItem, animationSection, () => {
                      _comeon(true);
                    });
                  }
                },
                () => {
                  comeon(true);
                }
              );
            } else {
              comeon(true);
            }
          }
        },
        () => {
          console.log('installAnimations complete!');
          // this.installWave();
          this.installSceneEffects(template);
        }
      );
    };

    if (!animationControl.inited) {
      animationControl.initDatas(() => {
        setupAnimations();
      });
    } else {
      setupAnimations();
    }
  }

  installTransition(template) {
    const { makeInstance } = this.ui._subMenuElement;
    const { sections } = template;
    const transitionSections = [];
    const commonSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      } else if (sec.action === 'transition') {
        transitionSections.push(sec);
      }
    });
    /*
    const itemKeys = Object.keys(this.items);
    const getCommonKeyByUid = (uid) => {
      for (let i = 0, n = itemKeys.length; i < n; i += 1) {
        const item = this.items[itemKeys[i]];
        if (item.uid === uid) {
          return itemKeys[i];
        }
      }

      return null;
    };
    */
    console.log('installTransition transitionSections:', transitionSections);
    const { transitions } = makeInstance;
    const setupTransitions = () => {
      iterator(
        transitionSections,
        (tran, idx, comeon) => {
          if (idx >= 0) {
            console.log('tran:', tran);
            const { mode } = tran;
            // const key = getCommonKeyByUid(tran.pre);
            // const makeParser = this.makeparsers[key];
            // console.log('key:', key, ',parser:', makeParser);
            const trackItem = this.ui.timeLine.track.getItemByUid(tran.pre);
            console.log('trackItem:', trackItem);
            const transitionSection = transitions.getTransitionSectionByMode(mode);
            console.log('transitionSection:', transitionSection);
            transitions.setupTransition(trackItem, transitionSection, () => {
              comeon(true);
            });
          }
        },
        () => {
          console.log('setup complete!');
          this.installTextEffect(template);
        }
      );
    };
    if (!transitions.inited) {
      transitions.initDatas(() => {
        setupTransitions();
      });
    } else {
      setupTransitions();
    }
  }

  reinstallEditorForDimension({ template }) {
    const { makeInstance } = this.ui._subMenuElement;
    const { sections } = template;
    const commonSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      }
    });
    if (this.pos < this.itemKeys.length) {
      const eid = this.itemKeys[this.pos];
      const parser = this.makeparsers[eid];
      const sourceSection = this.items[eid];
      makeInstance.setupParser({ parser, sourceSection });
    } else {
      iterator(
        commonSections,
        (sec, idx, comeon) => {
          if (idx >= 0) {
            const { dur } = sec;
            const trackItem = this.ui.timeLine.track.getItemByUid(sec.uid);
            console.log('installEditor trackItem:', trackItem);
            console.log('installEditor dur:', dur);
            const cDur = trackItem.getDuration();
            if (cDur !== dur) {
              const rRange = [trackItem.timeRange[0], trackItem.timeRange[0] + dur];
              trackItem.updateTimeRange(rRange, () => {
                console.log('installEditor comeon idx:', idx);
                comeon(true);
              });
            } else {
              console.log('installEditor comeon idx:', idx);
              comeon(true);
            }
          }
        },
        () => {
          console.log('will call installTransition.....');
          this.installTransition(template);
        }
      );
    }
  }

  initMakeInstance({ template }) {
    // const parser = makeInstance._getParserByName(name);
    const { makeInstance } = this.ui._subMenuElement;
    const { sections } = template;
    const commonSections = [];
    sections.forEach((sec) => {
      if (sec.action === 'common') {
        commonSections.push(sec);
      }
    });
    commonSections.forEach((sec) => {
      const parser = makeInstance._getParserByFileData(sec.file.data);
      makeInstance.setupParser({ parser, sourceSection: sec });
    });
    console.log('datasource initMakeInstance:', commonSections);
    this.installTransition(template);
  }

  onDimensionChanged({ template, callback }) {
    const { width, height } = template;
    console.log('onDimensionChanged width:', width, ',height:', height);
    this.editor.resetDimension({ width: parseInt(width, 10), height: parseInt(height, 10) });
    // this.editor.updateCanvasSize({ width, height });
    if (callback) {
      callback();
    }
  }

  _attachEvent() {
    const _onDimensionChanged = this.onDimensionChanged.bind(this);
    const onReinstall = this.initMakeInstance.bind(this);
    this.on({
      'dimension:changed': _onDimensionChanged,
      reinstall: onReinstall,
    });
  }
}
CustomEvents.mixin(DataSource);

export default DataSource;

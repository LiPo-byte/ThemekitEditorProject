import { DEFAULT_CROP_PROPS } from "@/pages/editor-xyflow/widget/base-config";

export const defaultCropProps = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0,
};

export const DEFAULT_ICON_RADIUS = 39.96;

const withDefaultIconRadius = <T extends Record<string, Record<string, any>>>(apps: T): T => {
    const next = {} as T;
    for (const key of Object.keys(apps) as Array<keyof T>) {
        next[key] = {
            ...apps[key],
            radius: DEFAULT_ICON_RADIUS,
        };
    }
    return next;
};
export const WidgetDefaultConfig = {
    Time_LayoutType_0: {
        ios: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "isGif": true,
          "sizes":[
                {
                    "size":1,
                    "name": "Time_IOS_Small",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":20,
                        "textHeight":18,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":10,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":16,
                        "textHeight":15,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "name": "Time_IOS_Medium",
                    "padding":16,
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":32,
                        "textHeight":29,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":25,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":14,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":18,
                        "textHeight":16,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "name": "Time_IOS_Large",
                    "padding":16,
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":54,
                        "textHeight":47,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":38,
                        "textHeight":33,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":20,
                        "bottomSpacing":20
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":30,
                        "textHeight":26,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                }
          ]
        },
        android: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "isGif": true,
          "sizes":[
                {
                    "size":1,
                    "name": "Time_Android_Small",
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "padding": 16,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":20,
                        "textHeight":18,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":10,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":16,
                        "textHeight":15,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "name": "Time_Android_Medium",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":32,
                        "textHeight":29,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":25,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":14,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":18,
                        "textHeight":16,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "name": "Time_Android_Large",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":54,
                        "textHeight":47,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":38,
                        "textHeight":33,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":20,
                        "bottomSpacing":20
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":30,
                        "textHeight":26,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                }
          ]
        }
    },
    Time_LayoutType_0_1: {
        ios: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "isGif": true,
          "sizes":[
                {
                    "size":1,
                    "name": "Time_IOS_Small",
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "padding":16,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "name": "Time_IOS_Medium",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":32,
                        "textHeight":29,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "name": "Time_IOS_Large",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":54,
                        "textHeight":47,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                }
          ]
        },
        android: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "isGif": true,
          "sizes":[
                {
                    "size":1,
                    "name": "Time_Android_Small",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "name": "Time_Android_Medium",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":32,
                        "textHeight":29,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "name": "Time_Android_Large",
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "padding":16,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":54,
                        "textHeight":47,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                }
          ]
        }
    },
    Time_LayoutType_1: {
        ios: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "isGif": true,
          "sizes":[
                {
                    "size":1,
                    "layoutType": 1,
                    "name": "Time_IOS_Small",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "time":{
                        "textAlignment":3,
                        "font":"AvenirNext-Heavy",
                        "textSize":43,
                        "textHeight":75,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"Helvetica Neue-Bold",
                        "textSize":17,
                        "textHeight":21,
                        "textColor":"#8C511B",
                        "alpha":1.0,
                        "topSpacing":8,
                        "bottomSpacing":8
                    },
                    "date":{
                        "font":"PingFangSC-Semibold",
                        "textSize":11,
                        "textHeight":14,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "layoutType": 1,
                    "name": "Time_IOS_Medium",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "time":{
                        "textAlignment":3,
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":53,
                        "textHeight":85,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"PingFangSC-Semibold",
                        "textSize":20,
                        "textHeight":24,
                        "textColor":"#8C511B",
                        "alpha":1.0,
                        "topSpacing":0,
                        "bottomSpacing":5
                    },
                    "date":{
                        "font":"PingFangSC-Semibold",
                        "textSize":13,
                        "textHeight":15,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "layoutType": 1,
                    "name": "Time_IOS_Large",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "time":{
                        "textAlignment":3,
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":110,
                        "textHeight":160,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"PingFangSC-Semibold",
                        "textSize":33,
                        "textHeight":41,
                        "textColor":"#8C511B",
                        "alpha":1.0,
                         "topSpacing":18,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"PingFangSC-Semibold",
                        "textSize":22,
                        "textHeight":25,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    }
                },
          ]
        },
        android: {
            "version":0,
            "isLockScreen":false,
            "type":1,
            "isGif": true,
            "sizes":[
                  {
                      "size":1,
                      "layoutType": 1,
                      "name": "Time_Android_Small",
                      "radius": 28,
                      "source": "",
                      "crop_props": defaultCropProps,
                      "padding":16,
                      "time":{
                          "textAlignment":3,
                          "font":"AvenirNext-Heavy",
                          "textSize":43,
                          "textHeight": 75,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      },
                      "day" :{
                          "font":"Helvetica Neue-Bold",
                          "textSize":17,
                          "textHeight":21,
                          "textColor":"#8C511B",
                          "alpha":1.0,
                          "topSpacing":8,
                          "bottomSpacing":8
                      },
                      "date":{
                          "font":"PingFangSC-Semibold",
                          "textSize":11,
                          "textHeight":14,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      }
                  },
                  {
                      "size":2,
                      "layoutType": 1,
                      "name": "Time_Android_Medium",
                      "radius": 28,
                      "source": "",
                      "crop_props": defaultCropProps,
                      "padding":16,
                      "time":{
                          "textAlignment":3,
                          "font":"AvenirNext-HeavyItalic",
                          "textSize":53,
                          "textHeight":85,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      },
                      "day" :{
                          "font":"PingFangSC-Semibold",
                          "textSize":20,
                          "textHeight":24,
                          "textColor":"#8C511B",
                          "alpha":1.0,
                          "topSpacing":0,
                          "bottomSpacing":5
                      },
                      "date":{
                          "font":"PingFangSC-Semibold",
                          "textSize":13,
                          "textHeight":15,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      }
                  },
                  {
                      "size":3,
                      "layoutType": 1,
                      "name": "Time_Android_Large",
                      "radius": 28,
                      "source": "",
                      "crop_props": defaultCropProps,
                      "padding":16,
                      "time":{
                          "textAlignment":3,
                          "font":"AvenirNext-HeavyItalic",
                          "textSize":110,
                          "textHeight": 160,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      },
                      "day" :{
                          "font":"PingFangSC-Semibold",
                          "textSize":33,
                          "textHeight":41,
                          "textColor":"#8C511B",
                          "alpha":1.0,
                           "topSpacing":18,
                          "bottomSpacing":10
                      },
                      "date":{
                          "font":"PingFangSC-Semibold",
                          "textSize":22,
                          "textHeight":25,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      }
                  },
            ]
          },
    },
    Time_LayoutType_2: {
        ios: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":3,
          "isGif": true,
          "sizes":[
                {
                    "size":1,
                    "layoutType": 2,
                    "name": "Time_IOS_Small",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "battery": {
                        "backgroundColor": "#252020",
                        "textColor":"#252020",
                    },
                    "time":{
                        "font":"AvenirNext-Heavy",
                        "textSize":43,
                        "textHeight":75,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"Helvetica Neue-Bold",
                        "textSize":17,
                        "textHeight":21,
                        "textColor":"#8C511B",
                        "alpha":1.0,
                        "topSpacing":8,
                        "bottomSpacing":8
                    },
                    "date":{
                        "font":"PingFangSC-Semibold",
                        "textSize":11,
                        "textHeight":14,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "layoutType": 2,
                    "name": "Time_IOS_Medium",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "battery": {
                        "backgroundColor": "#252020",
                        "textColor":"#252020",
                    },
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":53,
                        "textHeight": 85,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"PingFangSC-Semibold",
                        "textSize":20,
                        "textHeight":24,
                        "textColor":"#8C511B",
                        "alpha":1.0,
                        "topSpacing":0,
                        "bottomSpacing":5
                    },
                    "date":{
                        "font":"PingFangSC-Semibold",
                        "textSize":13,
                        "textHeight":15,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "layoutType": 2,
                    "name": "Time_IOS_Large",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "battery": {
                        "backgroundColor": "#252020",
                        "textColor":"#252020",
                    },
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":110,
                        "textHeight": 160,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"PingFangSC-Semibold",
                        "textSize":33,
                        "textHeight":41,
                        "textColor":"#8C511B",
                        "alpha":1.0,
                         "topSpacing":18,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"PingFangSC-Semibold",
                        "textSize":22,
                        "textHeight":25,
                        "textColor":"#8C511B",
                        "alpha":1.0
                    }
                },
          ]
        },
        android: {
            "version":0,
            "isLockScreen":false,
            "type":1,
            "textAlignment":3,
            "isGif": true,
            "sizes":[
                  {
                      "size":1,
                      "layoutType": 2,
                      "name": "Time_Android_Small",
                      "radius": 28,
                      "source": "",
                      "crop_props": defaultCropProps,
                      "padding":16,
                      "battery": {
                            "backgroundColor": "#252020",
                            "textColor":"#252020",
                        },
                      "time":{
                          "font":"AvenirNext-Heavy",
                          "textSize":43,
                          "textHeight": 75,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      },
                      "day" :{
                          "font":"Helvetica Neue-Bold",
                          "textSize":17,
                          "textHeight":21,
                          "textColor":"#8C511B",
                          "alpha":1.0,
                          "topSpacing":8,
                          "bottomSpacing":8
                      },
                      "date":{
                          "font":"PingFangSC-Semibold",
                          "textSize":11,
                          "textHeight":14,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      }
                  },
                  {
                      "size":2,
                      "layoutType": 2,
                      "name": "Time_Android_Medium",
                      "radius": 28,
                      "source": "",
                      "crop_props": defaultCropProps,
                      "padding":16,
                      "battery": {
                        "backgroundColor": "#252020",
                        "textColor":"#252020",
                    },
                      "time":{
                          "font":"AvenirNext-HeavyItalic",
                          "textSize":53,
                          "textHeight":85,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      },
                      "day" :{
                          "font":"PingFangSC-Semibold",
                          "textSize":20,
                          "textHeight":24,
                          "textColor":"#8C511B",
                          "alpha":1.0,
                          "topSpacing":0,
                          "bottomSpacing":5
                      },
                      "date":{
                          "font":"PingFangSC-Semibold",
                          "textSize":13,
                          "textHeight":15,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      }
                  },
                  {
                      "size":3,
                      "layoutType": 2,
                      "name": "Time_Android_Large",
                      "radius": 28,
                      "source": "",
                      "crop_props": defaultCropProps,
                      "padding":16,
                      "battery": {
                        "backgroundColor": "#252020",
                        "textColor":"#252020",
                    },
                      "time":{
                          "font":"AvenirNext-HeavyItalic",
                          "textSize":110,
                          "textHeight": 160,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      },
                      "day" :{
                          "font":"PingFangSC-Semibold",
                          "textSize":33,
                          "textHeight":41,
                          "textColor":"#8C511B",
                          "alpha":1.0,
                           "topSpacing":18,
                          "bottomSpacing":10
                      },
                      "date":{
                          "font":"PingFangSC-Semibold",
                          "textSize":22,
                          "textHeight":25,
                          "textColor":"#8C511B",
                          "alpha":1.0
                      }
                  },
            ]
          },
    },
    Time_LayoutType_3: {
        ios: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "isGif": true,
          "sizes":[
                {
                    "size":1,
                    "name": "Time_IOS_Small",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "layoutType": 3,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0,
                        "backgroundColor": "#FFFFFF"
                    },
                },
                {
                    "size":2,
                    "name": "Time_IOS_Medium",
                    "padding":16,
                    "radius": 28,
                    "layoutType": 3,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":46,
                        "textHeight":63,
                        "textColor":"#000000",
                        "alpha": 1,
                        "backgroundColor": "#FFFFFF"
                    },
                },
                {
                    "size":3,
                    "name": "Time_IOS_Large",
                    "padding":16,
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "layoutType": 3,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":80,
                        "textHeight":183,
                        "textColor":"#000000",
                        "alpha": 1,
                        "backgroundColor": "#FFFFFF"
                    },
                }
          ]
        },
        android: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "isGif": true,
          "sizes":[
                {
                    "size":1,
                    "name": "Time_Android_Small",
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "padding": 16,
                    "layoutType": 3,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0,
                        "backgroundColor": "#FFFFFF"
                    },
                },
                {
                    "size":2,
                    "name": "Time_Android_Medium",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "layoutType": 3,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":46,
                        "textHeight":63,
                        "textColor":"#000000",
                        "alpha": 1,
                        "backgroundColor": "#FFFFFF"
                    },
                },
                {
                    "size":3,
                    "name": "Time_Android_Large",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "layoutType": 3,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize": 80,
                        "textHeight": 183,
                        "textColor":"#000000",
                        "alpha":1.0,
                        "backgroundColor": "#FFFFFF"
                    },
                }
          ]
        }
    },
    Time_LayoutType_4: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":1,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 4,
                 "name":"Time_IOS_Small",
                 "radius": 28,
                  "source": "",
                "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":21,
                       "textHeight":29,
                       "textColor":"#000000",
                       "alpha":1.0,
                       "textAlignment": 1
                 },
                 "firstImageAnimation": {
                     "animationType": 3,
                     "padding": 4,
                     "crossPadding": 3,
                     "duration": 2,
                     "distance": 10,
                     "imageHeight": 136,
                     "imageWidth": 149,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationType": 2,
                     "padding": 18,
                     "crossPadding": 33,
                     "duration": 2,
                     "distance": 10,
                     "imageHeight": 89,
                     "imageWidth": 79,
                     "source": "",
                     "crop_props": defaultCropProps,
                 }
             }, 
             {
                 "size":2,
                 "layoutType": 4,
                 "name":"Time_IOS_Medium",
                 "radius": 28,
                 "source": "",
               "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":48,
                       "textHeight":66,
                       "textColor":"#000000",
                       "alpha":1.0,
                       "textAlignment": 3
                 },
                 "firstImageAnimation": {
                     "animationType": 3,
                     "padding": 0,
                     "crossPadding": 0,
                     "duration": 2,
                     "distance": 15,
                     "imageHeight": 155,
                     "imageWidth": 170,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationType": 2,
                     "padding": 30,
                     "crossPadding": 28,
                     "duration": 2,
                     "distance": 10,
                     "imageHeight": 88,
                     "imageWidth": 66,
                     "source": "",
                     "crop_props": defaultCropProps,
                 }
             }, 
             {
                 "size":3,
                 "layoutType": 4,
                 "name":"Time_IOS_Large",
                 "radius": 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":60,
                       "textHeight":82,
                       "textColor":"#000000",
                       "alpha":1.0,
                       "textAlignment": 2
                 },
                 "firstImageAnimation": {
                     "animationType": 3,
                     "padding": 2,
                     "crossPadding": 22,
                     "duration": 6,
                     "distance": 19,
                     "imageHeight": 300,
                     "imageWidth": 300,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationType": 2,
                     "padding": 8,
                     "crossPadding": 67,
                     "duration": 2,
                     "distance": 38,
                     "imageHeight": 200,
                     "imageWidth": 180,
                     "source": "",
                     "crop_props": defaultCropProps,
                 }
             }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": true,
            "type":1,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 4,
                 "name":"Time_Android_Small",
                 "radius": 28,
                  "source": "",
                "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":21,
                       "textHeight":29,
                       "textColor":"#000000",
                       "alpha":1.0,
                       "textAlignment": 1
                 },
             },
             {
                 "size":2,
                 "layoutType": 4,
                 "name":"Time_Android_Medium",
                 "radius": 28,
                 "source": "",
               "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":48,
                       "textHeight":66,
                       "textColor":"#000000",
                       "alpha":1.0,
                       "textAlignment": 3
                 },
             }, 
             {
                 "size":3,
                 "layoutType": 4,
                 "name":"Time_Android_Large",
                 "radius": 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":60,
                       "textHeight":82,
                       "textColor":"#000000",
                       "alpha":1.0,
                       "textAlignment": 2
                 },
             }
            ]
         }
    },
    Time_LayoutType_5: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":1,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 5,
                 "name":"Time_IOS_Small",
                 "radius": 28,
                  "source": "",
                "crop_props": defaultCropProps,
                 "time":{
                       "font": "AvenirNext-BoldItalic",
                       "textSize":11,
                       "textHeight":29,
                       "textColor":"#000000",
                       "alpha":1.0,
                 },
                 "firstImageAnimation": {
                    "animationCategory": 1,
                    "animationType": 0,
                    "padding": 0,
                    "crossPadding": -1,
                    "duration": 3,
                    "distance": 10,
                    "imageHeight": 112,
                    "imageWidth": 112,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                "secondImageAnimation": {
                    "animationCategory": 2,
                    "animationType": 0,
                    "padding": 26,
                    "crossPadding": -1,
                    "duration": 2,
                    "distance": 10,
                    "imageHeight": 60,
                    "imageWidth": 60,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
                "calendar": {
                    "font":"AvenirNext-BoldItalic",
                    "textColor": "#333333"
                }
             }, 
             {
                 "size":2,
                 "layoutType": 5,
                 "name":"Time_IOS_Medium",
                 "radius": 28,
                 "source": "",
               "crop_props": defaultCropProps,
                 "time":{
                       "font": "AvenirNext-BoldItalic",
                       "textSize":48,
                       "textHeight":66,
                       "textColor":"#000000",
                       "alpha":1.0,
                 },
                 "firstImageAnimation": {
                    "animationCategory": 1,
                    "animationType": 3,
                    "padding": 16,
                    "crossPadding": -1,
                    "duration": 4,
                    "distance": 15,
                    "imageHeight": 122,
                    "imageWidth": 122,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                 "secondImageAnimation": {
                    "animationCategory": 1,
                    "animationType": 3,
                    "padding": 50,
                    "crossPadding": -1,
                    "duration": -5,
                    "distance": 10,
                    "imageHeight": 50,
                    "imageWidth": 50,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
                "calendar": {
                    "font":"AvenirNext-BoldItalic",
                    "textColor": "#333333"
                }
             }, 
             {
                 "size":3,
                 "layoutType": 5,
                 "name":"Time_IOS_Large",
                 "radius": 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "time":{
                       "font": "AvenirNext-BoldItalic",
                       "textSize":60,
                       "textHeight":82,
                       "textColor":"#000000",
                       "alpha":1.0,
                 },
                 "firstImageAnimation": {
                    "animationCategory": 1,
                    "animationType": 0,
                    "padding": 26,
                    "crossPadding": 18,
                    "duration": 4,
                    "distance": 19,
                    "imageHeight": 198,
                    "imageWidth": 198,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                "secondImageAnimation": {
                    "animationCategory": 2,
                    "animationType": 0,
                    "padding": 60,
                    "crossPadding": 63,
                    "duration": 4,
                    "distance": 38,
                    "imageHeight": 108,
                    "imageWidth": 108,
                    "source": "",
                    "crop_props": defaultCropProps,
                },

                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
                "calendar": {
                    "font":"AvenirNext-BoldItalic",
                    "textColor": "#333333"
                }
             }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": true,
            "type":1,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 5,
                 "name":"Time_Android_Small",
                 "radius": 28,
                  "source": "",
                "crop_props": defaultCropProps,
                 "time":{
                       "font": "AvenirNext-BoldItalic",
                       "textSize":11,
                       "textHeight":29,
                       "textColor":"#000000",
                       "alpha":1.0,
                 },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
                "calendar": {
                    "font":"AvenirNext-BoldItalic",
                    "textColor": "#333333"
                }
             },
             {
                 "size":2,
                 "layoutType": 5,
                 "name":"Time_Android_Medium",
                 "radius": 28,
                 "source": "",
               "crop_props": defaultCropProps,
                 "time":{
                       "font": "AvenirNext-BoldItalic",
                       "textSize":48,
                       "textHeight":66,
                       "textColor":"#000000",
                       "alpha":1.0,
                 },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
                "calendar": {
                    "font":"AvenirNext-BoldItalic",
                    "textColor": "#333333"
                }
             }, 
             {
                 "size":3,
                 "layoutType": 5,
                 "name":"Time_Android_Large",
                 "radius": 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":60,
                       "textHeight":82,
                       "textColor":"#ff413d",
                       "alpha":1.0,
                 },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
                "calendar": {
                    "font":"AvenirNext-BoldItalic",
                    "textColor": "#333333"
                }
             }
            ]
         }
    },
    Time_LayoutType_6: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":1,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 6,
                 "name":"Time_IOS_Small",
                 "radius": 28,
                  "source": "",
                "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":21,
                       "textHeight":29,
                       "textColor":"#ff413d",
                       "alpha":1.0,
                 },
                 "firstImageAnimation": {
                    "animationCategory": 1,
                    "animationType": 0,
                    "padding": 0,
                    "crossPadding": -1,
                    "duration": 3,
                    "distance": 10,
                    "imageHeight": 112,
                    "imageWidth": 112,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                "secondImageAnimation": {
                    "animationCategory": 2,
                    "animationType": 0,
                    "padding": 26,
                    "crossPadding": -1,
                    "duration": 2,
                    "distance": 10,
                    "imageHeight": 60,
                    "imageWidth": 60,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
             }, 
             {
                 "size":2,
                 "layoutType": 6,
                 "name":"Time_IOS_Medium",
                 "radius": 28,
                 "source": "",
               "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":48,
                       "textHeight":66,
                       "textColor":"#ff413d",
                       "alpha":1.0,
                 },
                 "firstImageAnimation": {
                    "animationCategory": 1,
                    "animationType": 3,
                    "padding": 16,
                    "crossPadding": -1,
                    "duration": 4,
                    "distance": 15,
                    "imageHeight": 122,
                    "imageWidth": 122,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                 "secondImageAnimation": {
                    "animationCategory": 1,
                    "animationType": 3,
                    "padding": 50,
                    "crossPadding": -1,
                    "duration": -5,
                    "distance": 10,
                    "imageHeight": 50,
                    "imageWidth": 50,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
             }, 
             {
                 "size":3,
                 "layoutType": 6,
                 "name":"Time_IOS_Large",
                 "radius": 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":60,
                       "textHeight":82,
                       "textColor":"#ff413d",
                       "alpha":1.0,
                 },
                 "firstImageAnimation": {
                    "animationCategory": 1,
                    "animationType": 0,
                    "padding": 26,
                    "crossPadding": 18,
                    "duration": 4,
                    "distance": 19,
                    "imageHeight": 198,
                    "imageWidth": 198,
                    "source": "",
                    "crop_props": defaultCropProps,
                },
                "secondImageAnimation": {
                    "animationCategory": 2,
                    "animationType": 0,
                    "padding": 60,
                    "crossPadding": 63,
                    "duration": 4,
                    "distance": 38,
                    "imageHeight": 108,
                    "imageWidth": 108,
                    "source": "",
                    "crop_props": defaultCropProps,
                },

                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
             }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": true,
            "type":1,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 6,
                 "name":"Time_Android_Small",
                 "radius": 28,
                  "source": "",
                "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":21,
                       "textHeight":29,
                       "textColor":"#ff413d",
                       "alpha":1.0,
                 },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
             },
             {
                 "size":2,
                 "layoutType": 6,
                 "name":"Time_Android_Medium",
                 "radius": 28,
                 "source": "",
               "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":48,
                       "textHeight":66,
                       "textColor":"#ff413d",
                       "alpha":1.0,
                 },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
             }, 
             {
                 "size":3,
                 "layoutType": 6,
                 "name":"Time_Android_Large",
                 "radius": 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "time":{
                       "font":"AvenirNext-DemiBold",
                       "textSize":60,
                       "textHeight":82,
                       "textColor":"#ff413d",
                       "alpha":1.0,
                 },
                 "other": {
                    "backgroundColor": "#B4B4B4",
                    "alpha": 1
                },
                "month":{
                   "font": "AvenirNext-BoldItalic",
                   "textSize": 11,
                   "textHeight":15,
                   "textColor": "#000000",
                   "alpha": 1
                },
             }
            ]
         }
    },
    Calendar_LayoutType_0: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":2,
            "sizes":[
               {
                  "size":1,
                  "name":"Calendar_IOS_Small",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":3,
                            "font":"Helvetica",
                            "textSize":10,
                            "textColor":"#000000"
                },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":9,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":2,
                  "name":"Calendar_IOS_Medium",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor":"#000000"
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":3,
                  "name":"Calendar_IOS_Large",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":3,
                            "font":"Helvetica",
                            "textSize":30,
                            "textColor":"#000000",
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":16,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":2,
            "sizes":[
               {
                  "size":1,
                  "name":"Calendar_Android_Small",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":3,
                            "font":"Helvetica",
                            "textSize":10,
                            "textColor":"#000000"
                },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":9,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":2,
                  "name":"Calendar_Android_Medium",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor":"#000000"
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":3,
                  "name":"Calendar_Android_Large",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":3,
                            "font":"Helvetica",
                            "textSize":30,
                            "textColor":"#000000"
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":16,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               }
            ]
         },
    },
    Calendar_LayoutType_0_1: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":2,
            "sizes":[
               {
                  "size":1,
                  "name":"Calendar_IOS_Small",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":3,
                            "font":"Helvetica",
                            "textSize":10,
                            "textColor":"#000000"
                },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":9,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":2,
                  "name":"Calendar_IOS_Medium",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor":"#000000"
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         },
                         "date":{
                            "textAlignment":1,
                            "font":"Helvetica-Bold",
                            "textSize":57,
                            "textColor":"#F085AA"
                         },
               },
               {
                  "size":3,
                  "name":"Calendar_IOS_Large",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":3,
                            "font":"Helvetica",
                            "textSize":30,
                            "textColor":"#000000"
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":16,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":2,
            "sizes":[
               {
                  "size":1,
                  "name":"Calendar_Android_Small",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":3,
                            "font":"Helvetica",
                            "textSize":10,
                            "textColor":"#000000"
                },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":9,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":2,
                  "name":"Calendar_Android_Medium",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "date":{
                    "textAlignment":1,
                    "font":"Helvetica-Bold",
                    "textSize":57,
                    "textColor":"#F085AA"
                 },
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor":"#000000"
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":3,
                  "name":"Calendar_Android_Large",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":3,
                            "font":"Helvetica",
                            "textSize":30,
                            "textColor":"#000000"
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":16,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               }
            ]
         },
    },
    Calendar_LayoutType_1: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":2,
            "sizes":[
               {
                  "size":1,
                  "name":"Calendar_IOS_Small",
                  "layoutType": 1,
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":10,
                            "textColor":"#000000",
                            "alpha": 0.3,
                },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":9,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":2,
                  "name":"Calendar_IOS_Medium",
                  "layoutType": 1,
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor":"#000000",
                            "alpha": 0.3,
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":3,
                  "name":"Calendar_IOS_Large",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "layoutType": 1,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":30,
                            "textColor":"#000000",
                            "alpha": 0.3,
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":16,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":2,
            "sizes":[
               {
                  "size":1,
                  "name":"Calendar_Android_Small",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "layoutType": 1,
                  "radius": 28,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":10,
                            "textColor":"#000000",
                            "alpha": 0.3,
                },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":9,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":2,
                  "name":"Calendar_Android_Medium",
                  "layoutType": 1,
                  "source": '',
                  "crop_props": defaultCropProps,
                  "radius": 28,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor":"#000000",
                            "alpha": 0.3,
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":13,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               },
               {
                  "size":3,
                  "name":"Calendar_Android_Large",
                  "source": '',
                  "crop_props": defaultCropProps,
                  "layoutType": 1,
                  "radius": 28,
                  "month":{
                            "textAlignment":2,
                            "font":"Helvetica",
                            "textSize":30,
                            "textColor":"#000000",
                            "alpha": 0.3,
                         },
                  "calendar":{
                            "font":"Helvetica",
                            "textSize":16,
                            "textColor_past":"#6D6C6A",
                            "textColor_future":"#000000",
                            "textColor_now":"#000000",
                            "bgColor_now":"#979797",
                            "textColor_capital_day": "#000000",
                         }
               }
            ]
         },
    },
    Calendar_LayoutType_2: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":2,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 2,
                 "name":"Calendar_IOS_Small",
                 "source": '',
                 "crop_props": defaultCropProps,
                 "radius": 28,
                 "month":{
                     "font": "AvenirNext-DemiBold",
                     "textSize": 16,
                     "textHeight": 22,
                     "textColor": "#000000",
                     "alpha": 1,
                 },
                 "firstImageAnimation": {
                     "animationCategory": 0,
                     "animationType": 0,
                     "padding": 48,
                     "crossPadding": -1,
                     "duration": 2,
                     "distance": 6,
                     "imageHeight": 76,
                     "imageWidth": 52,
                     "source": '',
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 10,
                     "crossPadding": -1,
                     "duration": 5,
                     "distance": 10,
                     "imageHeight": 144,
                     "imageWidth": 144,
                     "source": '',
                     "crop_props": defaultCropProps,
                 },
                 "other": {
                     "backgroundColor": "#B4B4B4",
                     "alpha": 1
                 },
                 "day":{
                    "font": "AvenirNext-BoldItalic",
                    "textSize": 30,
                    "textHeight": 41
                 }
             },
             {
                 "size":2,
                 "layoutType": 2,
                 "name":"Calendar_IOS_Medium",
                 "source": '',
                 "crop_props": defaultCropProps,
                 "radius": 28,
                 "firstImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 16,
                     "crossPadding": 34,
                     "duration": 5,
                     "distance": 15,
                     "imageHeight": 42,
                     "imageWidth": 39,
                     "source": '',
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 100,
                     "crossPadding": 144,
                     "duration": -5,
                     "distance": 10,
                     "imageHeight": 21,
                     "imageWidth": 21,
                     "source": '',
                     "crop_props": defaultCropProps,
                 },
                 "other": {
                     "backgroundColor": "#87CEEB",
                     "alpha":1
                 },
                 "calendar": {
                     "font":"AvenirNext-BoldItalic",
                     "textColor_capital_day": "#333333",
                     "textColor_past": "#333333",
                     "textColor_future": "#333333",
                     "bgColor_now": "#333333",
                     "textSize": 10,
                     "textColor_now":"#000000",
                 }
             },
             {
                 "size":3,
                 "layoutType": 2,
                 "name":"Calendar_IOS_Large",
                 "source": '',
                 "crop_props": defaultCropProps,
                 "radius": 28,
                 "month":{
                    "font": "AvenirNext-BoldItalic",
                    "textSize": 72,
                    "textHeight": 98,
                    "alpha": 1,
                    "textColor": '#000000'
                 },
                 "firstImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 16,
                     "crossPadding": 28,
                     "duration": 5,
                     "distance": 19,
                     "imageHeight": 42,
                     "imageWidth": 39,
                     "source": '',
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 60,
                     "crossPadding": 160,
                     "duration": -6,
                     "distance": 38,
                     "imageHeight": 29,
                     "imageWidth": 28,
                     "source": '',
                     "crop_props": defaultCropProps,
                 },
                 "other": {
                     "backgroundColor": "#B4B4B4",
                     "alpha": 1
                 },
                 "year": {
                     "font": "AvenirNext-BoldItalic",
                     "textSize": 28,
                     "textHeight": 38,
                     "textColor": "#000000",
                     "alpha": 1,
                 },
                 "calendar": {
                     "font":"AvenirNext-BoldItalic",
                     "textColor_capital_day": "#333333",
                     "textColor_past": "#333333",
                     "textColor_future": "#333333",
                     "bgColor_now": "#333333",
                     "textSize": 16,
                     "textColor_now":"#000000",
                 }
             }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":2,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 2,
                 "name":"Calendar_Android_Small",
                 "source": '',
                 "crop_props": defaultCropProps,
                 "radius": 28,
                 "month":{
                     "font": "AvenirNext-DemiBold",
                     "textSize": 16,
                     "textHeight": 22,
                     "textColor": "#000000",
                     "alpha": 1,
                 },
                 "other": {
                     "backgroundColor": "#B4B4B4",
                     "alpha": 1
                 },
                 "day":{
                    "font": "AvenirNext-BoldItalic",
                    "textSize": 30,
                    "textHeight": 41
                 }
             },
             {
                 "size":2,
                 "layoutType": 2,
                "name":"Calendar_Android_Medium",
                 "source": '',
                 "crop_props": defaultCropProps,
                 "radius": 28,
                 "other": {
                     "backgroundColor": "#87CEEB",
                     "alpha":1
                 },
                 "calendar": {
                     "font":"AvenirNext-BoldItalic",
                     "textColor_capital_day": "#333333",
                     "textColor_past": "#333333",
                     "textColor_future": "#333333",
                     "bgColor_now": "#333333",
                     "textSize": 10,
                     "textColor_now":"#000000",
                 }
             },
             {
                 "size":3,
                 "layoutType": 2,
                 "name":"Calendar_Android_Large",
                 "source": '',
                 "crop_props": defaultCropProps,
                 "radius": 28,
                 "month":{
                    "font": "AvenirNext-BoldItalic",
                    "textSize": 72,
                    "textHeight": 98,
                    "alpha": 1,
                    "textColor": '#000000'
                 },
                 "other": {
                     "backgroundColor": "#B4B4B4",
                     "alpha": 1
                 },
                 "year": {
                     "font": "AvenirNext-BoldItalic",
                     "textSize": 28,
                     "textHeight": 38,
                     "textColor": "#000000",
                     "alpha": 1,
                 },
                 "calendar": {
                     "font":"AvenirNext-BoldItalic",
                     "textColor_capital_day": "#333333",
                     "textColor_past": "#333333",
                     "textColor_future": "#333333",
                     "bgColor_now": "#333333",
                     "textSize": 16,
                     "textColor_now":"#000000",
                 }
             }
            ]
         } 
    },
    PureImage_LayoutType_0: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type": 8,
            "sizes":[
               {
                  "size":1,
                  "name":"PureImage_IOS_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                },
                {
                "size":2,
                "name":"PureImage_IOS_Medium",
                radius: 28,
                "source": "",
                "crop_props": defaultCropProps,
                },
                {
                "size":3,
                "name":"PureImage_IOS_Large",
                radius: 28,
                "source": "",
                "crop_props": defaultCropProps,
                }
            ]
        },
        android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type": 8,
            "sizes":[
               {
                  "size":1,
                  "name":"PureImage_Android_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                },
                {
                "size":2,
                "name":"PureImage_Android_Medium",
                radius: 28,
                "source": "",
                "crop_props": defaultCropProps,
                },
                {
                "size":3,
                "name":"PureImage_Android_Large",
                radius: 28,
                "source": "",
                "crop_props": defaultCropProps,
                }
            ]
        }
    },
    Quotation_LayoutType_0: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":6,
            "sizes":[
               {
                  "size":1,
                  "name":"Quotation_IOS_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "quote":{
                            "content":"The\nunexpected\nencounter of a\nhit is a\nsurprise in\nyour efforts .",
                            "textAlignment":1,
                            "font":"AvenirNext-HeavyItalic",
                            "textSize":16,
                            "textColor":"#000000"
                  }
               },
               {
                  "size":2,
                  "name":"Quotation_IOS_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "quote":{
                            "content":"The unexpected\nencounter of a hit is a\nsurprise in your\nefforts .",
                            "textAlignment":1,
                            "font":"AvenirNext-HeavyItalic",
                            "textSize":24,
                            "textColor":"#000000"
                  }
               },
               {
                  "size":3,
                  "name":"Quotation_IOS_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "quote":{
                            "content":"The\nunexpected\nencounter of a\nhit is a surprise\nin your\nefforts .",
                            "textAlignment":1,
                            "font":"AvenirNext-HeavyItalic",
                            "textSize":36,
                            "textColor":"#000000"
                  }
               }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":6,
            "sizes":[
               {
                  "size":1,
                  "name":"Quotation_Android_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "quote":{
                            "content":"The\nunexpected\nencounter of a\nhit is a\nsurprise in\nyour efforts .",
                            "textAlignment":1,
                            "font":"AvenirNext-HeavyItalic",
                            "textSize":16,
                            "textColor":"#000000"
                  }
               },
               {
                  "size":2,
                  "name":"Quotation_Android_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "quote":{
                            "content":"The unexpected\nencounter of a hit is a\nsurprise in your\nefforts .",
                            "textAlignment":1,
                            "font":"AvenirNext-HeavyItalic",
                            "textSize":24,
                            "textColor":"#000000"
                  }
               },
               {
                  "size":3,
                  "name":"Quotation_Android_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "quote":{
                            "content":"The\nunexpected\nencounter of a\nhit is a surprise\nin your\nefforts .",
                            "textAlignment":1,
                            "font":"AvenirNext-HeavyItalic",
                            "textSize":36,
                            "textColor":"#000000"
                  }
               }
            ]
         }
    },
    Battery_LayoutType_0: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":5,
            radius: 28,
            "sizes":[
               {
                 "size":1,
                 "layoutType":0,
                "name":"Battery_IOS_Small",
                 "textAlignment":1,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":20,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26,
                    "padding": 0,
                    "intCommonField": 0,
                 },
                "battery_20": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_40": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_60": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_80": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_100": {
                   "source": "",
                   "crop_props": defaultCropProps,
                }
               },
               {
                 "size":2,
                 "layoutType":0,
                "name":"Battery_IOS_Medium",
                 "textAlignment":3,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":40,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26,
                    "padding": 0,
                    "intCommonField": 0,
                },
                "battery_20": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_40": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_60": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_80": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_100": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
               },
               {
                 "size":3,
                 "layoutType":0,
                "name":"Battery_IOS_Large",
                 "textAlignment":3,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":20,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26,
                    "padding": 0,
                    "intCommonField": 0,
                },
                "battery_20": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_40": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_60": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_80": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_100": {
                   "source": "",
                   "crop_props": defaultCropProps,
                }
               }
            ]
        },
        android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":5,
            "sizes":[
               {
                 "size":1,
                 "layoutType":0,
                "name":"Battery_Android_Small",
                 "textAlignment":1,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":20,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26,
                    "padding": 0,
                    "intCommonField": 0,
                },
                "battery_20": {
                    "source": "",
                    "crop_props": defaultCropProps,
                 },
                 "battery_40": {
                    "source": "",
                    "crop_props": defaultCropProps,
                 },
                 "battery_60": {
                    "source": "",
                    "crop_props": defaultCropProps,
                 },
                 "battery_80": {
                    "source": "",
                    "crop_props": defaultCropProps,
                 },
                 "battery_100": {
                    "source": "",
                    "crop_props": defaultCropProps,
                 },
               },
               {
                 "size":2,
                 "layoutType":0,
                "name":"Battery_Android_Medium",
                 "textAlignment":3,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":40,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26,
                    "padding": 0,
                    "intCommonField": 0,
                },
                "battery_20": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_40": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_60": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_80": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_100": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
               },
               {
                 "size":3,
                 "layoutType":0,
                "name":"Battery_Android_Large",
                 "textAlignment":3,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":20,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26,
                    "padding": 0,
                    "intCommonField": 0,
                },
                "battery_20": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_40": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_60": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_80": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
                "battery_100": {
                   "source": "",
                   "crop_props": defaultCropProps,
                },
               }
            ]
        }
    },
    Battery_LayoutType_1: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": true,
            "type":5,
            radius: 28,
            "sizes":[
               {
                 "size":1,
                 "layoutType":1,
                "name":"Battery_IOS_Small",
                 "textAlignment":2,
                 radius: 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":20,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26
                 },
               },
               {
                 "size":2,
                 "layoutType":1,
                "name":"Battery_IOS_Medium",
                 "textAlignment":2,
                 radius: 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":40,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26
                },
               },
               {
                 "size":3,
                 "layoutType":1,
                "name":"Battery_IOS_Large",
                 "textAlignment":2,
                 "source": "",
                 "crop_props": defaultCropProps,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":20,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26
                },
               }
            ]
        },
        android: {
            "version":0,
            "isLockScreen":false,
            "isGif": true,
            "type":5,
            "sizes":[
               {
                 "size":1,
                 "layoutType":1,
                "name":"Battery_Android_Small",
                 "textAlignment":2,
                 "source": "",
                 "crop_props": defaultCropProps,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":20,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26
                },
               },
               {
                 "size":2,
                 "layoutType":1,
                "name":"Battery_Android_Medium",
                 "textAlignment":2,
                 "source": "",
                 "crop_props": defaultCropProps,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":40,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26
                },
               },
               {
                 "size":3,
                 "layoutType":1,
                "name":"Battery_Android_Large",
                 "textAlignment":2,
                 "source": "",
                 "crop_props": defaultCropProps,
                 radius: 28,
                 "battery": {
                    "font":"Cochin-Bold",
                    "textSize":20,
                    "textColor":"#000000",
                    "alpha":1.0,
                    "textHeight": 26
                },
               }
            ]
        }
    },
    Battery_LayoutType_2: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":5,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 2,
                "name":"Battery_IOS_Small",
                 radius: 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "battery": {
                     "font":"AvenirNext-Bold",
                     "textSize":14,
                     "textColor":"#efa8ff",
                     "alpha":1.0,
                     "textHeight": 19
                  },
                 "firstImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 0,
                     "crossPadding": -1,
                     "duration": 5,
                     "distance": 0,
                     "imageHeight": 155,
                     "imageWidth": 155,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 0,
                     "crossPadding": -1,
                     "duration": -5,
                     "distance": 0,
                     "imageHeight": 155,
                     "imageWidth": 155,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "thirdImageAnimation": {
                     "animationCategory": 2,
                     "animationType": 2,
                     "padding": 57,
                     "crossPadding": -1,
                     "duration": 2,
                     "distance": 0,
                     "imageHeight": 41,
                     "imageWidth": 42,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "fourthImageAnimation": {
                     "animationCategory": 2,
                     "animationType": 0,
                     "padding": 54,
                     "crossPadding": -1,
                     "duration": 2,
                     "distance": 10,
                     "imageHeight": 39,
                     "imageWidth": 20,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "title": {
                     "content": "(✪ω✪)",
                     "font": "AvenirNext-Bold",
                     "textSize": 8,
                     "textHeight": 11,
                     "textColor": "#efa8ff",
                     "alpha":1.0
                 }
             },
             {
                 "size":2,
                 "layoutType": 2,
                "name":"Battery_IOS_Medium",
                 radius: 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "battery": {
                     "font":"AvenirNext-Bold",
                     "textSize":40,
                     "textColor":"#efa8ff",
                     "alpha":1.0,
                     "textHeight": 55
                  },
                 "firstImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 2,
                     "padding": 30,
                     "crossPadding": 15,
                     "duration": 5,
                     "distance": 0,
                     "imageHeight": 155,
                     "imageWidth": 148,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 2,
                     "padding": 30,
                     "crossPadding": 15,
                     "duration": -5,
                     "distance": 0,
                     "imageHeight": 155,
                     "imageWidth": 148,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "thirdImageAnimation": {
                     "animationCategory": 2,
                     "animationType": 2,
                     "padding": 72,
                     "crossPadding": 50,
                     "duration": 2,
                     "distance": 0,
                     "imageHeight": 62,
                     "imageWidth": 62,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "fourthImageAnimation": {
                     "animationCategory": 2,
                     "animationType": 2,
                     "padding": 88,
                     "crossPadding": 54,
                     "duration": 3,
                     "distance": 0,
                     "imageHeight": 60,
                     "imageWidth": 30,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "title": {
                     "content": "(✪ω✪)",
                     "font": "AvenirNext-Bold",
                     "textSize": 15,
                     "textHeight": 20,
                     "textColor": "#efa8ff",
                     "alpha":1.0
                 }
             },
             {
                 "size":3,
                 "layoutType": 2,
                "name":"Battery_IOS_Large",
                 radius: 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "battery": {
                     "font":"AvenirNext-Bold",
                     "textSize":24,
                     "textColor":"#efa8ff",
                     "alpha":1.0,
                     "textHeight": 33
                  },
                 "firstImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 0,
                     "crossPadding": -1,
                     "duration": 5,
                     "distance": 0,
                     "imageHeight": 345,
                     "imageWidth": 329,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "secondImageAnimation": {
                     "animationCategory": 1,
                     "animationType": 0,
                     "padding": 0,
                     "crossPadding": -1,
                     "duration": -5,
                     "distance": 0,
                     "imageHeight": 345,
                     "imageWidth": 329,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "thirdImageAnimation": {
                     "animationCategory": 2,
                     "animationType": 2,
                     "padding": 114,
                     "crossPadding": -1,
                     "duration": 3,
                     "distance": 0,
                     "imageHeight": 113,
                     "imageWidth": 114,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "fourthImageAnimation": {
                     "animationCategory": 2,
                     "animationType": 0,
                     "padding": 119,
                     "crossPadding": -1,
                     "duration": 2,
                     "distance": 0,
                     "imageHeight": 107,
                     "imageWidth": 54,
                     "source": "",
                     "crop_props": defaultCropProps,
                 },
                 "title": {
                     "content": "(✪ω✪)",
                     "font": "AvenirNext-Bold",
                     "textSize": 15,
                     "textHeight": 20,
                     "textColor": "#efa8ff",
                     "alpha":1.0
                 }
             }
            ]
         },
        android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":5,
            "sizes":[
             {
                 "size":1,
                 "layoutType": 2,
                "name":"Battery_Android_Small",
                 radius: 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "battery": {
                     "font":"AvenirNext-Bold",
                     "textSize":14,
                     "textColor":"#efa8ff",
                     "alpha":1.0,
                     "textHeight": 19
                  },
                 "title": {
                     "content": "(✪ω✪)",
                     "font": "AvenirNext-Bold",
                     "textSize": 8,
                     "textHeight": 11,
                     "textColor": "#efa8ff",
                     "alpha":1.0
                 }
             },
             {
                 "size":2,
                 "layoutType": 2,
                "name":"Battery_Android_Medium",
                 radius: 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "battery": {
                     "font":"AvenirNext-Bold",
                     "textSize":40,
                     "textColor":"#efa8ff",
                     "alpha":1.0,
                     "textHeight": 55
                  },
                 "title": {
                     "content": "(✪ω✪)",
                     "font": "AvenirNext-Bold",
                     "textSize": 15,
                     "textHeight": 20,
                     "textColor": "#efa8ff",
                     "alpha":1.0
                 }
             },
             {
                 "size":3,
                 "layoutType": 2,
                "name":"Battery_Android_Large",
                 radius: 28,
                 "source": "",
                 "crop_props": defaultCropProps,
                 "battery": {
                     "font":"AvenirNext-Bold",
                     "textSize":24,
                     "textColor":"#efa8ff",
                     "alpha":1.0,
                     "textHeight": 33
                  },
                 "title": {
                     "content": "(✪ω✪)",
                     "font": "AvenirNext-Bold",
                     "textSize": 15,
                     "textHeight": 20,
                     "textColor": "#efa8ff",
                     "alpha":1.0
                 }
             }
            ]
         } 
    },
    CountDown_LayoutType_0: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":9,
            "sizes":[
               {
                 "size": 1,
                 "layoutType": 0,
                 "name": "CountDown_IOS_Small",
                 "festivalName":"Halloween",
                 "source": "",
                 radius: 28,
                 "crop_props": defaultCropProps,
                 "remainDays": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":66,
                     "textHeight":78,
                     "textColor": "#BD1E2C"
                 },        
                 "days": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":14,
                     "textHeight":17,
                     "textColor": "#BD1E2C"
                 },
                 "title": {
                    //  "content":"Halloween",
                     "font":"HelveticaNeue-Bold",
                     "textSize":16,
                     "textHeight":19,
                     "textColor": "#BD1E2C"
                 }
              },
               {
                 "size": 2,
                 "layoutType": 0,
                 "name": "CountDown_IOS_Medium",
                 "festivalName":"Halloween",
                 "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                 "remainDays": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":46,
                     "textHeight":55,
                     "textColor": "#BD1E2C"
                 },
                 "days": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":14,
                     "textHeight":17,
                     "textColor": "#BD1E2C"
                 },
                 "title": {
                    //  "content":"Halloween",
                     "font":"HelveticaNeue-Bold",
                     "textSize":24,
                     "textHeight":28,
                     "textColor": "#BD1E2C"
                 }
              },
               {
                "size": 3,
                "layoutType": 0,
                "name": "CountDown_IOS_Large",
                "festivalName":"Halloween",
                "source": "",
                radius: 28,
                "crop_props": defaultCropProps,
                "remainDays": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":55,
                     "textHeight":66,
                     "textColor": "#BD1E2C"
                 },
                 "days": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":12,
                     "textHeight":15,
                     "textColor": "#BD1E2C"
                 },
                 "title": {
                    //  "content":"Halloween",
                     "font":"HelveticaNeue-Bold",
                     "textSize":34,
                     "textHeight":40,
                     "textColor": "#BD1E2C"
                 }
              }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":9,
            "sizes":[
               {
                 "size": 1,
                 "layoutType": 0,
                 "name": "CountDown_Android_Small",
                 "festivalName":"Halloween",
                 "source": "",
                 radius: 28,
                 "crop_props": defaultCropProps,
                 "remainDays": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":66,
                     "textHeight":78,
                     "textColor": "#BD1E2C"
                 },
                 "days": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":14,
                     "textHeight":17,
                     "textColor": "#BD1E2C"
                 },
                 "title": {
                    //  "content":"Halloween",
                     "font":"HelveticaNeue-Bold",
                     "textSize":16,
                     "textHeight":19,
                     "textColor": "#BD1E2C"
                 }
              },
               {
                 "size": 2,
                 "layoutType": 0,
                 "name": "CountDown_Android_Medium",
                 "festivalName":"Halloween",
                 "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                 "remainDays": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":46,
                     "textHeight":55,
                     "textColor": "#BD1E2C"
                 },
                 "days": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":14,
                     "textHeight":17,
                     "textColor": "#BD1E2C"
                 },
                 "title": {
                    //  "content":"Halloween",
                     "font":"HelveticaNeue-Bold",
                     "textSize":24,
                     "textHeight":28,
                     "textColor": "#BD1E2C"
                 }
              },
               {
                "size": 3,
                "layoutType": 0,
                "name": "CountDown_Android_Large",
                "festivalName":"Halloween",
                "source": "",
                radius: 28,
                "crop_props": defaultCropProps,
                "remainDays": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":55,
                     "textHeight":66,
                     "textColor": "#BD1E2C"
                 },
                 "days": {
                     "font":"HelveticaNeue-Bold",
                     "textSize":12,
                     "textHeight":15,
                     "textColor": "#BD1E2C"
                 },
                 "title": {
                    //  "content":"Halloween",
                     "font":"HelveticaNeue-Bold",
                     "textSize":34,
                     "textHeight":40,
                     "textColor": "#BD1E2C"
                 }
              }
            ]
         }
    },
    Launcher_LayoutType_0: {
        common: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":14,
            "sizes":[
               {
                  "size":1,
                  "layoutType":0,
                  "name":"Launcher_Common_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "title": {
                        "font":"HelveticaNeue",
                        "textSize":24,
                         "textColor":"#000000",
                         content: 'App Name'
                        },
                  "appLinks": [""],
                  "appLinksSource": Array.from({ length: 1 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               },
               {
                  "size":2,
                  "layoutType":0,
                  "name":"Launcher_Common_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","","","","","","","","","",""],
                  "appLinksSource": Array.from({ length: 13 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               },
               {
                  "size":3,
                  "layoutType":0,
                  "name":"Launcher_Common_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","","","","","","","","","","","","","","","",""],
                  "appLinksSource": Array.from({ length: 19 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               }
            ]
        }
    },
    Launcher_LayoutType_1: {
        common: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":14,
            "sizes":[
               {
                  "size":1,
                  "layoutType":1,
                  "name":"Launcher_Common_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "title": {
                        "font":"HelveticaNeue",
                        "textSize":24,
                         "textColor":"#000000",
                         "content": 'App Name',
                        },
                  "appLinks":[""],
                  "appLinksSource": Array.from({ length: 1 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               },
               {
                  "size":2,
                  "layoutType":1,
                  "name":"Launcher_Common_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","","",""],
                  "appLinksSource": Array.from({ length: 6 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               },
               {
                  "size":3,
                  "layoutType":1,
                  "name":"Launcher_Common_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","","","","","",""],
                  "appLinksSource": Array.from({ length: 9 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               }
            ]
        }
    },
    Launcher_LayoutType_5: {
        common: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":14,
            "sizes":[
               {
                  "size":1,
                  "layoutType":5,
                  "name":"Launcher_Common_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "title": {
                        "font":"HelveticaNeue",
                        "textSize":24,
                         "textColor":"#FFFFFF"
                        },
                  "appLinks":[""],
                //   "appLinksSource": Array.from({ length: 1 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               },
               {
                  "size":2,
                  "layoutType":5,
                  "name":"Launcher_Common_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","",""],
                //   "appLinksSource": Array.from({ length: 4 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               },
               {
                  "size":3,
                  "layoutType":5,
                  "name":"Launcher_Common_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","",""],
                //   "appLinksSource": Array.from({ length: 3 }, () => ({ source: '', "crop_props": DEFAULT_CROP_PROPS, }))
               }
            ]
        }
    },
    Launcher_LayoutType_6: {
        common: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":14,
            "sizes":[
               {
                  "size":1,
                  "layoutType":6,
                  "name":"Launcher_Common_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":[""],
               },
               {
                  "size":2,
                  "layoutType":6,
                  "name":"Launcher_Common_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["",""],
               },
               {
                  "size":3,
                  "layoutType":6,
                  "name":"Launcher_Common_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","",""],
               }
            ]
        }
    },
    Launcher_LayoutType_7: {
        common: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":14,
            "sizes":[
               {
                  "size":1,
                  "layoutType":7,
                  "name":"Launcher_Common_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":[""],
               },
               {
                  "size":2,
                  "layoutType":7,
                  "name":"Launcher_Common_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","",""],
               },
               {
                  "size":3,
                  "layoutType":7,
                  "name":"Launcher_Common_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","",""],
               }
            ]
        }
    },
    Launcher_LayoutType_8: {
        common: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":14,
            "sizes":[
               {
                  "size":1,
                  "layoutType":8,
                  "name":"Launcher_Common_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":[""],
               },
               {
                  "size":2,
                  "layoutType":8,
                  "name":"Launcher_Common_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","",""],
               },
               {
                  "size":3,
                  "layoutType":8,
                  "name":"Launcher_Common_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","","",""],
               }
            ]
        }
    },
    Launcher_LayoutType_9: {
        common: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":14,
            "sizes":[
               {
                  "size":1,
                  "layoutType":9,
                  "name":"Launcher_Common_Small",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":[""],
               },
               {
                  "size":2,
                  "layoutType":9,
                  "name":"Launcher_Common_Medium",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","","","","",""],
               },
               {
                  "size":3,
                  "layoutType":9,
                  "name":"Launcher_Common_Large",
                  "source": "",
                  radius: 28,
                  "crop_props": defaultCropProps,
                  "appLinks":["","","","","","","","","",""],
               }
            ]
        }
    },
    Dynamic_LayoutType_0: {
        common: {
            "version":0,
            "isLockScreen":false,
            "isGif": true,
            "type":13,
            "sizes":[
                   {
                      "size":1,
                      "name":"Dynamic_Common_Small",
                      "source": "",
                      radius: 28,
                      "crop_props": defaultCropProps,
                    },
                    {
                      "size":2,
                      "name":"Dynamic_Common_Medium",
                      "source": "",
                      radius: 28,
                      "crop_props": defaultCropProps,
                    },
                    {
                      "size":3,
                      "name":"Dynamic_Common_Large",
                      "source": "",
                      radius: 28,
                      "crop_props": defaultCropProps,
                    }
            ]
         }
    },
    Digital_LayoutType_0: {
        "ios": {
          "version": 0,
          "isLockScreen": false,
          "isGif": false,
          "type": 4,
          "sizes": [
            {
              "size": 1,
              "name": "Digital_IOS_Small",
              "source": "",
              radius: 28,
              "crop_props": defaultCropProps,
              "date": {
                "textAlignment": 2,
                "font": "AvenirNext-Medium",
                "textSize": 8,
                "textColor": "#000000"
              },
              "time": {
                "textAlignment": 2,
                "font": "HFDigits",
                "textSize": 40,
                "textColor": "#000000"
              },
              "weekday": {
                "show": true,
                "font": "AvenirNext-Medium",
                "textSize": 8,
                "selectedBgColor": "#000000",
                "selectedTextColor": "#FFFFFF",
                "unSelectedTextColor": "#000000"
              },
              "AmAndPm": {
                "show": true,
                "font": "AvenirNext-Medium",
                "textSize": 10,
                "textColor": "#000000"
              }
            },
            {
              "size": 2,
              "name": "Digital_IOS_Medium",
              "source": "",
              radius: 28,
              "crop_props": defaultCropProps,
              "date": {
                "textAlignment": 1,
                "font": "AvenirNext-Medium",
                "textSize": 10,
                "textColor": "#000000"
              },
              "time": {
                "textAlignment": 2,
                "font": "HFDigits",
                "textSize": 80,
                "textColor": "#000000"
              },
              "weekday": {
                "show": true,
                "font": "AvenirNext-Medium",
                "textSize": 10,
                "selectedBgColor": "#000000",
                "selectedTextColor": "#FFFFFF",
                "unSelectedTextColor": "#000000"
              },
              "AmAndPm": {
                "show": true,
                "font": "AvenirNext-Medium",
                "textSize": 10,
                "textColor": "#000000"
              }
            },
            {
              "size": 3,
              "name": "Digital_IOS_Large",
              "source": "",
              radius: 28,
              "crop_props": defaultCropProps,
              "date": {
                "textAlignment": 2,
                "font": "AvenirNext-Medium",
                "textSize": 14,
                "textColor": "#000000"
              },
              "time": {
                "textAlignment": 2,
                "font": "HFDigits",
                "textSize": 90,
                "textColor": "#000000"
              },
              "weekday": {
                "show": true,
                "font": "AvenirNext-Medium",
                "textSize": 14,
                "selectedBgColor": "#000000",
                "selectedTextColor": "#FFFFFF",
                "unSelectedTextColor": "#000000"
              },
              "AmAndPm": {
                "show": true,
                "font": "AvenirNext-Medium",
                "textSize": 14,
                "textColor": "#000000"
              }
            }
          ]
        },
        "android": {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 4,
            "sizes": [
              {
                "size": 1,
                "name": "Digital_Android_Small",
                "source": "",
                radius: 28,
                "crop_props": defaultCropProps,
                "date": {
                  "textAlignment": 2,
                  "font": "AvenirNext-Medium",
                  "textSize": 8,
                  "textColor": "#000000"
                },
                "time": {
                  "textAlignment": 2,
                  "font": "HFDigits",
                  "textSize": 40,
                  "textColor": "#000000"
                },
                "weekday": {
                  "show": true,
                  "font": "AvenirNext-Medium",
                  "textSize": 8,
                  "selectedBgColor": "#000000",
                  "selectedTextColor": "#FFFFFF",
                  "unSelectedTextColor": "#000000"
                },
                "AmAndPm": {
                  "show": true,
                  "font": "AvenirNext-Medium",
                  "textSize": 10,
                  "textColor": "#000000"
                }
              },
              {
                "size": 2,
                "name": "Digital_Android_Medium",
                "source": "",
                radius: 28,
                "crop_props": defaultCropProps,
                "date": {
                  "textAlignment": 1,
                  "font": "AvenirNext-Medium",
                  "textSize": 10,
                  "textColor": "#000000"
                },
                "time": {
                  "textAlignment": 2,
                  "font": "HFDigits",
                  "textSize": 80,
                  "textColor": "#000000"
                },
                "weekday": {
                  "show": true,
                  "font": "AvenirNext-Medium",
                  "textSize": 10,
                  "selectedBgColor": "#000000",
                  "selectedTextColor": "#FFFFFF",
                  "unSelectedTextColor": "#000000"
                },
                "AmAndPm": {
                  "show": true,
                  "font": "AvenirNext-Medium",
                  "textSize": 10,
                  "textColor": "#000000"
                }
              },
              {
                "size": 3,
                "name": "Digital_Android_Large",
                "source": "",
                radius: 28,
                "crop_props": defaultCropProps,
                "date": {
                  "textAlignment": 2,
                  "font": "AvenirNext-Medium",
                  "textSize": 14,
                  "textColor": "#000000"
                },
                "time": {
                  "textAlignment": 2,
                  "font": "HFDigits",
                  "textSize": 90,
                  "textColor": "#000000"
                },
                "weekday": {
                  "show": true,
                  "font": "AvenirNext-Medium",
                  "textSize": 14,
                  "selectedBgColor": "#000000",
                  "selectedTextColor": "#FFFFFF",
                  "unSelectedTextColor": "#000000"
                },
                "AmAndPm": {
                  "show": true,
                  "font": "AvenirNext-Medium",
                  "textSize": 14,
                  "textColor": "#000000"
                }
              }
            ]
          }
      },
    Weather_LayoutType_0: {
        "ios": {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 12,
            "separateLineColor": "#FFFFFF",
            "separateLineAlpha": 0.3,
            "imageCloud": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageRain": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSnow": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSun": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageThunder": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageWind": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes": [
                {
                    "size": 1,
                    "layoutType": 0,
                    "name": "Weather_IOS_Small",
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherMain": {
                        "font": "AvenirNext-Medium",
                        "textSize": 40,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "AvenirNext-Medium",
                        "textSize": 10,
                        "textColor": "#000000"
                    },
                },
                {
                    "size": 2,
                    "layoutType": 0,
                    "name": "Weather_IOS_Medium",
                    "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                    "weatherMain": {
                        "font": "AvenirNext-Medium",
                        "textSize": 40,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "AvenirNext-Medium",
                        "textSize": 10,
                        "textColor": "#000000"
                    },
                },
                {
                    "size": 3,
                    "layoutType": 0,
                    "name": "Weather_IOS_Large",
                    "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                    "weatherMain": {
                        "font": "AvenirNext-Medium",
                        "textSize": 40,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "AvenirNext-Medium",
                        "textSize": 10,
                        "textColor": "#000000"
                    },
                }
            ]
        },
        "android": {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 12,
            "separateLineColor": "#FFFFFF",
            "separateLineAlpha": 0.3,
            "imageCloud": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageRain": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSnow": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSun": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageThunder": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageWind": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes": [
                {
                    "size": 1,
                    "layoutType": 0,
                    "name": "Weather_Android_Small",
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherMain": {
                        "font": "AvenirNext-Medium",
                        "textSize": 40,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "AvenirNext-Medium",
                        "textSize": 10,
                        "textColor": "#000000"
                    },
                },
                {
                    "size": 2,
                    "layoutType": 0,
                    "name": "Weather_Android_Medium",
                    "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                    "weatherMain": {
                        "font": "AvenirNext-Medium",
                        "textSize": 40,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "AvenirNext-Medium",
                        "textSize": 10,
                        "textColor": "#000000"
                    },
                },
                {
                    "size": 3,
                    "layoutType": 0,
                    "name": "Weather_Android_Large",
                    "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                    "weatherMain": {
                        "font": "AvenirNext-Medium",
                        "textSize": 40,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "AvenirNext-Medium",
                        "textSize": 10,
                        "textColor": "#000000"
                    },
                }
            ]
        }
    },
    Weather_LayoutType_1: {
        "ios": {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 12,
            // "separateLineColor": "#FFFFFF",
            // "separateLineAlpha": 0.3,
            "imageCloud": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageRain": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSnow": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSun": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageThunder": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageWind": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes": [
                {
                    "size": 1,
                    "layoutType": 1,
                    "name": "Weather_IOS_Small",
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherWeekday": {
                        "font": "HFGeo",
                        "textSize": 20,
                        "textColor": "#000000"
                    },
                    "weatherDate": {
                        "font": "HFGeo",
                        "textSize": 13,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "HFGeo",
                        "textSize": 14,
                        "textColor": "#000000"
                    }
                },
                {
                    "size": 2,
                    "layoutType": 1,
                    "name": "Weather_IOS_Medium",
                    "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                    "weatherWeekday": {
                        "font": "HFGeo",
                        "textSize": 25,
                        "textColor": "#000000"
                    },
                    "weatherDate": {
                        "font": "HFGeo",
                        "textSize": 18,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "HFGeo",
                        "textSize": 14,
                        "textColor": "#000000"
                    }
                },
                {
                    "size": 3,
                    "layoutType": 1,
                    "name": "Weather_IOS_Large",
                    "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                    "weatherWeekday": {
                        "font": "HFGeo",
                        "textSize": 25,
                        "textColor": "#000000"
                    },
                    "weatherDate": {
                        "font": "HFGeo",
                        "textSize": 18,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "HFGeo",
                        "textSize": 14,
                        "textColor": "#000000"
                    }
                }
            ]
        },
        "android": {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 12,
            // "separateLineColor": "#FFFFFF",
            // "separateLineAlpha": 0.3,
            "imageCloud": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageRain": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSnow": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSun": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageThunder": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageWind": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes": [
                {
                    "size": 1,
                    "layoutType": 1,
                    "name": "Weather_Android_Small",
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherWeekday": {
                        "font": "HFGeo",
                        "textSize": 20,
                        "textColor": "#000000"
                    },
                    "weatherDate": {
                        "font": "HFGeo",
                        "textSize": 13,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "HFGeo",
                        "textSize": 14,
                        "textColor": "#000000"
                    }
                },
                {
                    "size": 2,
                    "layoutType": 1,
                    "name": "Weather_Android_Medium",
                    "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                    "weatherWeekday": {
                        "font": "HFGeo",
                        "textSize": 25,
                        "textColor": "#000000"
                    },
                    "weatherDate": {
                        "font": "HFGeo",
                        "textSize": 18,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "HFGeo",
                        "textSize": 14,
                        "textColor": "#000000"
                    }
                },
                {
                    "size": 3,
                    "layoutType": 1,
                    "name": "Weather_Android_Large",
                    "source": "",
                    radius: 28,
                    "crop_props": defaultCropProps,
                    "weatherWeekday": {
                        "font": "HFGeo",
                        "textSize": 25,
                        "textColor": "#000000"
                    },
                    "weatherDate": {
                        "font": "HFGeo",
                        "textSize": 18,
                        "textColor": "#000000"
                    },
                    "weatherSub": {
                        "font": "HFGeo",
                        "textSize": 14,
                        "textColor": "#000000"
                    }
                }
            ]
        }
    },
    Weather_LayoutType_2: {
        "ios": {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 12,
            "imageCloud": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageRain": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSnow": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSun": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageThunder": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageWind": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes": [
                {
                    "size": 1,
                    "layoutType": 2,
                    "name": "Weather_IOS_Small",
                    "textAlignment": 1,
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherMain": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherWeekday": {
                        "font": "Helvetica-Medium",
                        "textSize": 20,
                        "textColor": "#F5F1D8"
                    },
                    "weatherDate": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherSub": {
                        "textColor": "#F5F1D8"
                    }
                },
                {
                    "size": 2,
                    "layoutType": 2,
                    "name": "Weather_IOS_Medium",
                    "textAlignment": 1,
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherMain": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherWeekday": {
                        "font": "Helvetica-Medium",
                        "textSize": 36,
                        "textColor": "#F5F1D8"
                    },
                    "weatherDate": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherSub": {
                        "textColor": "#F5F1D8"
                    }
                },
                {
                    "size": 3,
                    "layoutType": 2,
                    "name": "Weather_IOS_Large",
                    "textAlignment": 1,
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherMain": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherWeekday": {
                        "font": "Helvetica-Medium",
                        "textSize": 45,
                        "textColor": "#F5F1D8"
                    },
                    "weatherDate": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherSub": {
                        "textColor": "#F5F1D8"
                    }
                }
            ]
        },
        "android": {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 12,
            "imageCloud": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageRain": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSnow": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageSun": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageThunder": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "imageWind": {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes": [
                {
                    "size": 1,
                    "layoutType": 2,
                    "name": "Weather_Android_Small",
                    "textAlignment": 1,
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherMain": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherWeekday": {
                        "font": "Helvetica-Medium",
                        "textSize": 20,
                        "textColor": "#F5F1D8"
                    },
                    "weatherDate": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherSub": {
                        "textColor": "#F5F1D8"
                    }
                },
                {
                    "size": 2,
                    "layoutType": 2,
                    "name": "Weather_Android_Medium",
                    "textAlignment": 1,
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherMain": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherWeekday": {
                        "font": "Helvetica-Medium",
                        "textSize": 36,
                        "textColor": "#F5F1D8"
                    },
                    "weatherDate": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherSub": {
                        "textColor": "#F5F1D8"
                    }
                },
                {
                    "size": 3,
                    "layoutType": 2,
                    "name": "Weather_Android_Large",
                    "textAlignment": 1,
                    "source": "",
                    "crop_props": defaultCropProps,
                    radius: 28,
                    "weatherMain": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherWeekday": {
                        "font": "Helvetica-Medium",
                        "textSize": 45,
                        "textColor": "#F5F1D8"
                    },
                    "weatherDate": {
                        "textColor": "#F5F1D8"
                    },
                    "weatherSub": {
                        "textColor": "#F5F1D8"
                    }
                }
            ]
        }
    },
    Clock_LayoutType_0: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":3,
            "textAlignment":2,
            "sizes":[
               {
                  "size":1,
                  "name":"Clock_IOS_Small",
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock":{
                      "clockPadding": 16,
                      "dialImage":"",
                      "hourHandImage":"",
                      "minuteHandImage":""
                  }
              },
               {
                   "size":2,
                   "name":"Clock_IOS_Medium",
                   "textAlignment":2,
                   "itemSpacing":24,
                   "lineSpacing":8,
                   "bgImage": "",
                   "source": "",
                   "crop_props": defaultCropProps,
                   radius: 28,
                   "clock":{
                       "clockPadding": 16,
                       "textPadding": 16,
                       "dialImage":"",
                       "hourHandImage":"",
                       "minuteHandImage": ""
                   },
                   "day":{
                      "font":"AvenirNext-HeavyItalic",
                      "textSize":24,
                      "textHeight":33,
                      "textColor":"#000000",
                      "alpha":1.0
                   },
                   "date":{
                      "font":"AvenirNext-HeavyItalic",
                      "textSize":16,
                      "textHeight":22,
                      "textColor":"#000000",
                      "alpha":1.0
                   }
              },
               {
                  "size":3,
                  "name":"Clock_IOS_Large",
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock":{
                      "clockPadding": 21,
                      "dialImage": "",
                      "hourHandImage": "",
                      "minuteHandImage": "",
                  }
              }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":3,
            "textAlignment":2,
            "sizes":[
               {
                  "size":1,
                  "name":"Clock_Android_Small",
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock":{
                      "clockPadding": 16,
                      "dialImage":"",
                      "hourHandImage":"",
                      "minuteHandImage":""
                  }
              },
               {
                   "size":2,
                   "name":"Clock_Android_Medium",
                   "textAlignment":2,
                   "itemSpacing":24,
                   "lineSpacing":8,
                   "bgImage": "",
                   "source": "",
                   "crop_props": defaultCropProps,
                   radius: 28,
                   "clock":{
                       "clockPadding": 16,
                       "textPadding": 16,
                       "dialImage":"",
                       "hourHandImage":"",
                       "minuteHandImage": ""
                   },
                   "day":{
                      "font":"AvenirNext-HeavyItalic",
                      "textSize":24,
                      "textHeight":33,
                      "textColor":"#000000",
                      "alpha":1.0
                   },
                   "date":{
                      "font":"AvenirNext-HeavyItalic",
                      "textSize":16,
                      "textHeight":22,
                      "textColor":"#000000",
                      "alpha":1.0
                   }
              },
               {
                  "size":3,
                  "name":"Clock_Android_Large",
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock":{
                      "clockPadding": 21,
                      "dialImage": "",
                      "hourHandImage": "",
                      "minuteHandImage": "",
                  }
              }
            ]
         }
    },
    Clock_LayoutType_1: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":3,
            "textAlignment":2,
            minuteClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            hourClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            dotClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes":[
               {
                  "size":1,
                  "name":"Clock_IOS_Small",
                  "layoutType":1,
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock":{
                      "clockPadding": 16,
                      "dialImage":"",
                      "hourHandImage":"",
                      "minuteHandImage":""
                  }
              },
               {
                   "size":2,
                   "name":"Clock_IOS_Medium",
                   "textAlignment":2,
                   "itemSpacing":24,
                   "lineSpacing":8,
                   "bgImage": "",
                   "layoutType":1,
                   "source": "",
                   "crop_props": defaultCropProps,
                   radius: 28,
                   "clock":{
                       "clockPadding": 16,
                       "textPadding": 16,
                       "dialImage":"",
                       "hourHandImage":"",
                       "minuteHandImage": ""
                   },
                   "day":{
                      "font":"AvenirNext-HeavyItalic",
                      "textSize":24,
                      "textHeight":33,
                      "textColor":"#000000",
                      "alpha":1.0
                   },
                   "date":{
                      "font":"AvenirNext-HeavyItalic",
                      "textSize":16,
                      "textHeight":22,
                      "textColor":"#000000",
                      "alpha":1.0
                   }
              },
               {
                  "size":3,
                  "name":"Clock_IOS_Large",
                  "layoutType":1,
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock":{
                      "clockPadding": 21,
                      "dialImage": "",
                      "hourHandImage": "",
                      "minuteHandImage": "",
                  }
              }
            ]
         },
         android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":3,
            "textAlignment":2,
            minuteClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            hourClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            dotClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes":[
               {
                  "size":1,
                  "name":"Clock_Android_Small",
                  "layoutType":1,
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock":{
                      "clockPadding": 16,
                      "dialImage":"",
                      "hourHandImage":"",
                      "minuteHandImage":""
                  }
              },
               {
                   "size":2,
                   "name":"Clock_Android_Medium",
                   "textAlignment":2,
                   "itemSpacing":24,
                   "lineSpacing":8,
                   "bgImage": "",
                   "layoutType":1,
                   "source": "",
                   "crop_props": defaultCropProps,
                   radius: 28,
                   "clock":{
                       "clockPadding": 16,
                       "textPadding": 16,
                       "dialImage":"",
                       "hourHandImage":"",
                       "minuteHandImage": ""
                   },
                   "day":{
                      "font":"AvenirNext-HeavyItalic",
                      "textSize":24,
                      "textHeight":33,
                      "textColor":"#000000",
                      "alpha":1.0
                   },
                   "date":{
                      "font":"AvenirNext-HeavyItalic",
                      "textSize":16,
                      "textHeight":22,
                      "textColor":"#000000",
                      "alpha":1.0
                   }
              },
               {
                  "size":3,
                  "name":"Clock_Android_Large",
                  "layoutType":1,
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock":{
                      "clockPadding": 21,
                      "dialImage": "",
                      "hourHandImage": "",
                      "minuteHandImage": "",
                  }
              }
            ]
         }, 
    },
    Music_LayoutType_0: {
        ios: {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 17,
            "music": {
              "source": "",
              "singer": "Michael Jackson",
              "songName": "Billie Jean",
              "crop_props": defaultCropProps,
            },
            "sizes": [
              {
                "size": 1,
                "layoutType": 0,
                "name": "Music_IOS_Small",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "player": {
                  "borderColor": "#000000",
                  "textColor": "#000000",
                  "font": "AvenirNext-DemiBold",
                  "commonField": "AvenirNext-Medium",
                  "textSize": 18,
                  "intCommonField": 12,
                },
                "appLinks":[-2]
              },
              {
                "size": 2,
                "layoutType": 0,
                "name": "Music_IOS_Medium",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "player": {
                  "borderColor": "#000000",
                  "textColor": "#000000",
                  "font": "AvenirNext-DemiBold",
                  "commonField": "AvenirNext-Medium",
                  "textSize": 10,
                  "intCommonField": 8,
                  "source": "",
                  "crop_props": defaultCropProps,
                },
                "appLinks":[-2]
              },
              {
                "size": 3,
                "layoutType": 0,
                "name": "Music_IOS_Large",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "player": {
                  "borderColor": "#000000",
                  "textColor": "#000000",
                  "font": "AvenirNext-DemiBold",
                  "commonField": "AvenirNext-Medium",
                  "textSize": 18,
                  "intCommonField": 12,
                  "source": "",
                  "crop_props": defaultCropProps,
                },
                "appLinks":[-2]
              }
            ]
          },
        android: {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 17,
            "music": {
                "source": "",
                "singer": "Michael Jackson",
                "songName": "Billie Jean",
                "crop_props": defaultCropProps,
            },
            "sizes": [
              {
                "size": 1,
                "layoutType": 0,
                "name": "Music_Android_Small",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "player": {
                  "borderColor": "#000000",
                  "textColor": "#000000",
                  "font": "AvenirNext-DemiBold",
                  "commonField": "AvenirNext-Medium",
                  "textSize": 18,
                  "intCommonField": 12,
                },
                "appLinks":[-2]
              },
              {
                "size": 2,
                "layoutType": 0,
                "name": "Music_Android_Medium",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "player": {
                  "borderColor": "#000000",
                  "textColor": "#000000",
                  "font": "AvenirNext-DemiBold",
                  "commonField": "AvenirNext-Medium",
                  "textSize": 10,
                  "intCommonField": 8,
                  "source": "",
                  "crop_props": defaultCropProps,
                },
                "appLinks":[-2]
              },
              {
                "size": 3,
                "layoutType": 0,
                "name": "Music_Android_Large",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "player": {
                  "borderColor": "#000000",
                  "textColor": "#000000",
                  "font": "AvenirNext-DemiBold",
                  "commonField": "AvenirNext-Medium",
                  "textSize": 18,
                  "intCommonField": 12,
                  "source": "",
                  "crop_props": defaultCropProps,
                },
                "appLinks":[-2]
              }
            ]
          }  
    },
    TimeMixBattery_LayoutType_0: {
        ios: {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 15,
            "sizes": [
              {
                "size": 1,
                "layoutType": 0,
                "name": "Time_Mix_Battery_IOS_Small",
                "padding": 16,
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "battery": {
                  "backgroundColor": "000000",
                  "textColor": "#FFFFFF"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 60,
                  "textHeight": 85,
                  "textColor": "#000000",
                  "alpha": 0.5,
                  "topTextAlignment": 3,
                  "bottomTextAlignment": 2
                }
              },
              {
                "size": 2,
                "layoutType": 0,
                "name": "Time_Mix_Battery_IOS_Medium",
                "padding": 86,
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "battery": {
                  "backgroundColor": "#000000",
                  "textColor": "#FFFFFF"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 90,
                  "textHeight": 127,
                  "textColor": "#000000",
                  "alpha": 0.5,
                  "topTextAlignment": 3,
                  "bottomTextAlignment": 2
                }
              },
              {
                "size": 3,
                "layoutType": 0,
                "name": "Time_Mix_Battery_IOS_Large",
                "padding": 46,
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "battery": {
                  "backgroundColor": "#000000",
                  "textColor": "#FFFFFF"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 150,
                  "textHeight": 211,
                  "textColor": "000000",
                  "alpha": 0.5,
                  "topTextAlignment": 3,
                  "bottomTextAlignment": 2
                }
              }
            ]
          },
        android: {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 15,
            "sizes": [
              {
                "size": 1,
                "layoutType": 0,
                "name": "Time_Mix_Battery_Android_Small",
                "padding": 16,
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "battery": {
                  "backgroundColor": "000000",
                  "textColor": "#FFFFFF"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 60,
                  "textHeight": 85,
                  "textColor": "#000000",
                  "alpha": 0.5,
                  "topTextAlignment": 3,
                  "bottomTextAlignment": 2
                }
              },
              {
                "size": 2,
                "layoutType": 0,
                "name": "Time_Mix_Battery_Android_Medium",
                "padding": 86,
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "battery": {
                  "backgroundColor": "#000000",
                  "textColor": "#FFFFFF"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 90,
                  "textHeight": 127,
                  "textColor": "#000000",
                  "alpha": 0.5,
                  "topTextAlignment": 3,
                  "bottomTextAlignment": 2
                }
              },
              {
                "size": 3,
                "layoutType": 0,
                "name": "Time_Mix_Battery_Android_Large",
                "padding": 46,
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "battery": {
                  "backgroundColor": "#000000",
                  "textColor": "#FFFFFF"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 150,
                  "textHeight": 211,
                  "textColor": "000000",
                  "alpha": 0.5,
                  "topTextAlignment": 3,
                  "bottomTextAlignment": 2
                }
              }
            ]
          }  
    },
    TimeMixCalendarMixBattery_LayoutType_0: {
        ios: {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 16,
            "textAlignment": 3,
            "sizes": [
              {
                "size": 1,
                "layoutType": 0,
                "padding": 16,
                "name": "Time_Mix_Calendar_Mix_Battery_IOS_Small",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "battery": {
                  "backgroundColor": "#FFF1D3",
                  "textColor": "#4F1826"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 55,
                  "textHeight": 68,
                  "textColor": "#FFF1D3",
                  "alpha": 0.8
                },
                "day": {
                  "font": "AvenirNext-Medium",
                  "textSize": 19,
                  "textHeight": 26,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0,
                  "topSpacing":15,
                  "bottomSpacing": 36
                },
                "date": {
                  "font": "Helvetica",
                  "textSize": 14,
                  "textHeight": 17,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0
                }
              },
              {
                "size": 2,
                "layoutType": 0,
                "name": "Time_Mix_Calendar_Mix_Battery_IOS_Medium",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "padding": 16,
                "battery": {
                  "backgroundColor": "#FFF1D3",
                  "textColor": "#4F1826"
                },
                "time": {
                  "font": "HelveticaNeue-Bold",
                  "textSize": 38,
                  "textHeight": 52,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0
                },
                "day": {
                  "font": "AvenirNext-Medium",
                  "textSize": 20,
                  "textHeight": 27,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0,
                  "topSpacing": 69,
                  "bottomSpacing": 40
                },
                "date": {
                  "font": "AvenirNext-Medium",
                  "textSize": 20,
                  "textHeight": 27,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0
                }
              },
              {
                "size": 3,
                "layoutType": 0,
                "name": "Time_Mix_Calendar_Mix_Battery_IOS_Large",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "padding": 16,
                "battery": {
                  "backgroundColor": "#FFF1D3",
                  "textColor": "#4F1826"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 125,
                  "textHeight": 171,
                  "textColor": "#FFF1D3",
                  "alpha": 0.8
                },
                "day": {
                  "font": "AvenirNext-Medium",
                  "textSize": 37,
                  "textHeight": 51,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0,
                  "topSpacing": 100,
                  "bottomSpacing": 67
                },
                "date": {
                  "font": "Helvetica",
                  "textSize": 25,
                  "textHeight": 30,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0
                }
              }
            ]
          },
        android: {
            "version": 0,
            "isLockScreen": false,
            "isGif": false,
            "type": 16,
            "textAlignment": 3,
            "sizes": [
              {
                "size": 1,
                "layoutType": 0,
                "padding": 16,
                "name": "Time_Mix_Calendar_Mix_Battery_Android_Small",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "battery": {
                  "backgroundColor": "#FFF1D3",
                  "textColor": "#4F1826"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 55,
                  "textHeight": 68,
                  "textColor": "#FFF1D3",
                  "alpha": 0.8
                },
                "day": {
                  "font": "AvenirNext-Medium",
                  "textSize": 19,
                  "textHeight": 26,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0,
                  "topSpacing":15,
                  "bottomSpacing": 36
                },
                "date": {
                  "font": "Helvetica",
                  "textSize": 14,
                  "textHeight": 17,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0
                }
              },
              {
                "size": 2,
                "layoutType": 0,
                "name": "Time_Mix_Calendar_Mix_Battery_Android_Medium",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "padding": 16,
                "battery": {
                  "backgroundColor": "#FFF1D3",
                  "textColor": "#4F1826"
                },
                "time": {
                  "font": "HelveticaNeue-Bold",
                  "textSize": 38,
                  "textHeight": 52,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0
                },
                "day": {
                  "font": "AvenirNext-Medium",
                  "textSize": 20,
                  "textHeight": 27,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0,
                  "topSpacing": 69,
                  "bottomSpacing": 40
                },
                "date": {
                  "font": "AvenirNext-Medium",
                  "textSize": 20,
                  "textHeight": 27,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0
                }
              },
              {
                "size": 3,
                "layoutType": 0,
                "name": "Time_Mix_Calendar_Mix_Battery_Android_Large",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                "padding": 16,
                "battery": {
                  "backgroundColor": "#FFF1D3",
                  "textColor": "#4F1826"
                },
                "time": {
                  "font": "AvenirNext-Heavy",
                  "textSize": 125,
                  "textHeight": 171,
                  "textColor": "#FFF1D3",
                  "alpha": 0.8
                },
                "day": {
                  "font": "AvenirNext-Medium",
                  "textSize": 37,
                  "textHeight": 51,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0,
                  "topSpacing": 100,
                  "bottomSpacing": 67
                },
                "date": {
                  "font": "Helvetica",
                  "textSize": 25,
                  "textHeight": 30,
                  "textColor": "#FFF1D3",
                  "alpha": 1.0
                }
              }
            ]
          }
    },
    TimeMixCalendarMixBattery_LayoutType_1: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":16,
            "sizes":[
                   {
                      "size":1,
                 "layoutType": 1,
                 "name": "Time_Mix_Calendar_Mix_Battery_IOS_Small",
                 "source": "",
                 "crop_props": defaultCropProps,
                 radius: 28,
                     "battery": {
                   "backgroundColor": "#D8D8D8",
                   "textColor":"#FFFFFF"
                      },
                      "time":{
                           "font":"AvenirNext-Heavy",
                           "textSize":60,
                           "textColor":"#FFBCBC",
                           "alpha":1.0,
                      "topTextAlignment": 3,
                      "bottomTextAlignment": 2
                      },
                      "day" :{
                           "font":"PingFangSC-Semibold",
                           "textSize":19,
                           "textColor":"#000000",
                           "alpha":1.0
                      }
                   },
                   {
                      "size":2,
                 "layoutType": 1,
                "name": "Time_Mix_Calendar_Mix_Battery_IOS_Medium",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                 "battery": {
                     "backgroundColor": "#D8D8D8",
                     "textColor":"#FFFFFF"
                  },
                      "time":{
                           "font":"AvenirNext-Heavy",
                           "textSize":75,
                           "textColor":"#FFBCBC",
                           "alpha":1.0,
                      "topTextAlignment": 1,
                      "bottomTextAlignment": 3
                      },
                      "day" :{
                           "font":"PingFangSC-Semibold",
                           "textSize":35,
                           "textColor":"#000000",
                           "alpha":1.0
                      }
                   },
                   {
                      "size":3,
                 "layoutType": 1,
                "name": "Time_Mix_Calendar_Mix_Battery_IOS_Large",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                 "battery": {
                     "backgroundColor": "#D8D8D8",
                  "textColor":"#FFFFFF"
                  },
                      "time":{
                           "font":"AvenirNext-Heavy",
                           "textSize":120,
                           "textColor":"#FFBCBC",
                           "alpha":1.0,
                      "topTextAlignment": 1,
                      "bottomTextAlignment": 3
                      },
                      "day" :{
                           "font":"PingFangSC-Semibold",
                           "textSize":44,
                           "textColor":"#000000",
                           "alpha":1.0
                      }
                   }
            ]
         },
        android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":16,
            "sizes":[
                   {
                      "size":1,
                 "layoutType": 1,
                 "name": "Time_Mix_Calendar_Mix_Battery_Android_Small",
                 "source": "",
                 "crop_props": defaultCropProps,
                 radius: 28,
                     "battery": {
                   "backgroundColor": "#D8D8D8",
                   "textColor":"#FFFFFF"
                      },
                      "time":{
                           "font":"AvenirNext-Heavy",
                           "textSize":60,
                           "textColor":"#FFBCBC",
                           "alpha":1.0,
                      "topTextAlignment": 3,
                      "bottomTextAlignment": 2
                      },
                      "day" :{
                           "font":"PingFangSC-Semibold",
                           "textSize":19,
                           "textColor":"#000000",
                           "alpha":1.0
                      }
                   },
                   {
                      "size":2,
                 "layoutType": 1,
                "name": "Time_Mix_Calendar_Mix_Battery_Android_Medium",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                 "battery": {
                     "backgroundColor": "#D8D8D8",
                     "textColor":"#FFFFFF"
                  },
                      "time":{
                           "font":"AvenirNext-Heavy",
                           "textSize":75,
                           "textColor":"#FFBCBC",
                           "alpha":1.0,
                      "topTextAlignment": 1,
                      "bottomTextAlignment": 3
                      },
                      "day" :{
                           "font":"PingFangSC-Semibold",
                           "textSize":35,
                           "textColor":"#000000",
                           "alpha":1.0
                      }
                   },
                   {
                      "size":3,
                 "layoutType": 1,
                "name": "Time_Mix_Calendar_Mix_Battery_Android_Large",
                "source": "",
                "crop_props": defaultCropProps,
                radius: 28,
                 "battery": {
                     "backgroundColor": "#D8D8D8",
                  "textColor":"#FFFFFF"
                  },
                      "time":{
                           "font":"AvenirNext-Heavy",
                           "textSize":120,
                           "textColor":"#FFBCBC",
                           "alpha":1.0,
                      "topTextAlignment": 1,
                      "bottomTextAlignment": 3
                      },
                      "day" :{
                           "font":"PingFangSC-Semibold",
                           "textSize":44,
                           "textColor":"#000000",
                           "alpha":1.0
                      }
                   }
            ]
         }
    },
    ClockMixBattery_LayoutType_0: {
        ios: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":18,
            minuteClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            hourClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            dotClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            dialLargeClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            dialSmallClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes":[
               {
                  "size": 1,
                  "layoutType": 0,
                  "name": "Clock_Mix_Battery_IOS_Small",
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock": {
                     "clockPadding": 0,
                     "dialImage":"",
                     "hourHandImage":"",
                     "minuteHandImage":"",
                     "tintColor": "#000000",
                     "dialColor":"#636362",
                     "alpha": 1.0
                  },
                  "battery": {
                     "containerColor": "#BDBDBD",
                     "alpha": 0.5,
                     "backgroundColor": "#000000",
                  }
              },
               {
                   "size": 2,
                   "layoutType": 0,
                   "name": "Clock_Mix_Battery_IOS_Medium",
                   "source": "",
                   "crop_props": defaultCropProps,
                   radius: 28,
                   "clock": {
                     "clockPadding": 0,
                     "dialImage":"",
                     "hourHandImage":"",
                     "minuteHandImage":"",
                     "tintColor": "#000000",
                     "dialColor":"#636362",
                     "alpha": 1.0
                   },
                   "battery": {
                     "containerColor": "#BDBDBD",
                     "alpha": 0.5,
                     "backgroundColor": "#000000"
                  }
              },
               {
                  "size": 3,
                  "layoutType": 0,
                  "name": "Clock_Mix_Battery_IOS_Large",
                   "source": "",
                   "crop_props": defaultCropProps,
                   radius: 28,
                  "clock": {
                     "clockPadding": 40,
                     "dialImage":"",
                     "hourHandImage":"",
                     "minuteHandImage":"",
                     "tintColor": "#000000",
                     "dialColor":"#636362",
                     "alpha": 1.0
                  },
                  "battery": {
                     "containerColor": "#BDBDBD",
                     "alpha": 0.5,
                     "backgroundColor": "#000000"
                  }
              }
            ]
         },
        android: {
            "version":0,
            "isLockScreen":false,
            "isGif": false,
            "type":18,
            minuteClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            hourClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            dotClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            dialLargeClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            dialSmallClock: {
                "source": "",
                "crop_props": defaultCropProps,
            },
            "sizes":[
               {
                  "size": 1,
                  "layoutType": 0,
                  "name": "Clock_Mix_Battery_Android_Small",
                  "source": "",
                  "crop_props": defaultCropProps,
                  radius: 28,
                  "clock": {
                     "clockPadding": 0,
                     "dialImage":"",
                     "hourHandImage":"",
                     "minuteHandImage":"",
                     "tintColor": "#000000",
                     "dialColor":"#636362",
                     "alpha": 1.0
                  },
                  "battery": {
                     "containerColor": "#BDBDBD",
                     "alpha": 0.5,
                     "backgroundColor": "#000000",
                     "textColor": '#ffffff',
                  }
              },
               {
                   "size": 2,
                   "layoutType": 0,
                   "name": "Clock_Mix_Battery_Android_Medium",
                   "source": "",
                   "crop_props": defaultCropProps,
                   radius: 28,
                   "clock": {
                     "clockPadding": 0,
                     "dialImage":"",
                     "hourHandImage":"",
                     "minuteHandImage":"",
                     "tintColor": "#000000",
                     "dialColor":"#636362",
                     "alpha": 1.0
                   },
                   "battery": {
                     "containerColor": "#BDBDBD",
                     "alpha": 0.5,
                     "backgroundColor": "#000000",
                     "textColor": '#ffffff',
                  }
              },
               {
                  "size": 3,
                  "layoutType": 0,
                  "name": "Clock_Mix_Battery_Android_Large",
                   "source": "",
                   "crop_props": defaultCropProps,
                   radius: 28,
                  "clock": {
                     "clockPadding": 40,
                     "dialImage":"",
                     "hourHandImage":"",
                     "minuteHandImage":"",
                     "tintColor": "#000000",
                     "dialColor":"#636362",
                     "alpha": 1.0
                  },
                  "battery": {
                     "containerColor": "#BDBDBD",
                     "alpha": 0.5,
                     "backgroundColor": "#000000",
                     "textColor": '#ffffff',
                  }
              }
            ]
         } 
    }
}

export const IconPackDefaultConfig = {
    apps: withDefaultIconRadius({
        zoom: {
            name: 'zoom',
            "crop_props": defaultCropProps,
            source: ''
        },
        amazon: { name: 'Amazon', crop_props: defaultCropProps, source: '' },
        app_store: { name: 'App Store', crop_props: defaultCropProps, source: '' },
        apple_store: { name: 'Apple Store', crop_props: defaultCropProps, source: '' },
        apple_tv: { name: 'Apple TV', crop_props: defaultCropProps, source: '' },
        books: { name: 'Books', crop_props: defaultCropProps, source: '' },
        calculator: { name: 'Calculator', crop_props: defaultCropProps, source: '' },
        calendar: { name: 'Calendar', crop_props: defaultCropProps, source: '' },
        camera: { name: 'Camera', crop_props: defaultCropProps, source: '' },
        chrome: { name: 'Chrome', crop_props: defaultCropProps, source: '' },
        clips: { name: 'Clips', crop_props: defaultCropProps, source: '' },
        clock: { name: 'Clock', crop_props: defaultCropProps, source: '' },
        contacts: { name: 'Contacts', crop_props: defaultCropProps, source: '' },
        facebook: { name: 'Facebook', crop_props: defaultCropProps, source: '' },
        facetime: { name: 'Facetime', crop_props: defaultCropProps, source: '' },
        files: { name: 'Files', crop_props: defaultCropProps, source: '' },
        find_my_iphone: { name: 'Find My iPhone', crop_props: defaultCropProps, source: '' },
        gmail: { name: 'Gmail', crop_props: defaultCropProps, source: '' },
        google_maps: { name: 'Google Maps', crop_props: defaultCropProps, source: '' },
        google_photos: { name: 'Google Photos', crop_props: defaultCropProps, source: '' },
        google: { name: 'Google', crop_props: defaultCropProps, source: '' },
        health: { name: 'Health', crop_props: defaultCropProps, source: '' },
        imovie: { name: 'iMovie', crop_props: defaultCropProps, source: '' },
        instagram: { name: 'Instagram', crop_props: defaultCropProps, source: '' },
        itunes: { name: 'iTunes', crop_props: defaultCropProps, source: '' },
        line: { name: 'Line', crop_props: defaultCropProps, source: '' },
        mail: { name: 'Mail', crop_props: defaultCropProps, source: '' },
        maps: { name: 'Maps', crop_props: defaultCropProps, source: '' },
        messages: { name: 'Messages', crop_props: defaultCropProps, source: '' },
        messenger: { name: 'Messenger', crop_props: defaultCropProps, source: '' },
        music: { name: 'Music', crop_props: defaultCropProps, source: '' },
        netflix: { name: 'Netflix', crop_props: defaultCropProps, source: '' },
        notes: { name: 'Notes', crop_props: defaultCropProps, source: '' },
        phone: { name: 'Phone', crop_props: defaultCropProps, source: '' },
        photos: { name: 'Photos', crop_props: defaultCropProps, source: '' },
        pinterest: { name: 'Pinterest', crop_props: defaultCropProps, source: '' },
        podcasts: { name: 'Podcasts', crop_props: defaultCropProps, source: '' },
        reddit: { name: 'Reddit', crop_props: defaultCropProps, source: '' },
        reminders: { name: 'Reminders', crop_props: defaultCropProps, source: '' },
        safari: { name: 'Safari', crop_props: defaultCropProps, source: '' },
        settings: { name: 'Settings', crop_props: defaultCropProps, source: '' },
        snapchat: { name: 'Snapchat', crop_props: defaultCropProps, source: '' },
        spotify: { name: 'Spotify', crop_props: defaultCropProps, source: '' },
        telegram: { name: 'Telegram', crop_props: defaultCropProps, source: '' },
        tiktok: { name: 'Tiktok', crop_props: defaultCropProps, source: '' },
        tumblr: { name: 'Tumblr', crop_props: defaultCropProps, source: '' },
        twitch: { name: 'Twitch', crop_props: defaultCropProps, source: '' },
        twitter: { name: 'Twitter', crop_props: defaultCropProps, source: '' },
        wallet: { name: 'Wallet', crop_props: defaultCropProps, source: '' },
        watch: { name: 'Watch', crop_props: defaultCropProps, source: '' },
        weather: { name: 'Weather', crop_props: defaultCropProps, source: '' },
        whatsapp: { name: 'WhatsApp', crop_props: defaultCropProps, source: '' },
        youtube: { name: 'Youtube', crop_props: defaultCropProps, source: '' },
    }),
    preview_long: {
        width: 887,
        height: 1920,
        isGif: false,
        exportWidth: 887,
        exportHeight: 1920,
        selectElements: {
            apps: [],
        },
        showElements: [],
        source: '',
    },
    preview_short: {
        width: 887,
        height: 1578,
        exportWidth: 887,
        exportHeight: 1578,
        selectElements: {
            apps: [],
        },
        showElements: [],
        source: '',
    },
    list_view: {
        width: 738,
        height: 564,
        exportWidth: 738,
        exportHeight: 564,
        selectElements: {
            apps: [],
        },
        showElements: [],
        source: '',
    },
}

const withPhotoShufflesHandler = (n: number) => {
    const obj:any = {};
    const ipadobj:any = {};
    for (let i = 1; i <= n; i++) {
        const wallpaper_name = 'wallpaper_' + i;
        const wallpaper_ipad_name = 'wallpaper_ipad_' + i;
        obj[wallpaper_name] = {
            source: '',
            name: wallpaper_name,
            width: 887,
            height: 1920,
        }
        ipadobj[wallpaper_ipad_name] = {
            source: '',
            name: wallpaper_ipad_name,
            width: 2048,
            height: 2732,
        }
    }
    return {
        wallpaperType: 1,
        ...obj,
        ...ipadobj,
        wallpaper_preview: {
            source: '',
            name: 'wallpaper_preview',
            width: 344,
            height: 658,
            ext: 'png',
        },
        wallpaper_preview_ipad: {
            source: '',
            name: 'wallpaper_preview_ipad',
            width: 516,
            height: 987,
            ext: 'png',
        }
    };

}
export const WallpaperDefaultConfig = {
    Wallpaper: {
        wallpaperType: 0,
        wallpaper: {
            source: '',
            name: 'wallpaper',
            width: 887,
            height: 1920,
        },
        wallpaper_ipad: {
            source: '',
            name: 'wallpaper_ipad',
            width: 2048,
            height: 2732,
        }
    },
    "Photo Shuffles": withPhotoShufflesHandler(5),
    "Wallpaper Depth": {
        wallpaperType: 2,
        wallpaper: {
            source: '',
            name: 'wallpaper',
            width: 887,
            height: 1920,
        },
        wallpaper_depth_preview: {
            source: '',
            name: 'wallpaper_depth_preview',
            width: 887,
            height: 1920,
        }
    },
    "Live Wallpaper IOS": {
        wallpaperType: 3,
        mov: {
            name: 'live_wallpaper_mov',
            movsource: '',
            width: 886,
            height: 1920,
        },
    },
    "Live Wallpaper Android": {
        wallpaperType: 4,
        mp4: {
            name: 'live_wallpaper_mp4',
            mp4source: '',
            width: 886,
            height: 1920,
        }
    }
}
export const DEFAULT_THEME_CONFIG = {
  selectElements: {
    apps: [],
    widgets: [],
    wallpaper: [],
  },
  preview_long: {
    width: 887,
    height: 1920,
    isGif: false,
    exportWidth: 887,
    exportHeight: 1920,
    showElements: [],
  },
  preview_short: {
    width: 887,
    height: 1578,
    exportWidth: 887,
    exportHeight: 1578,
    isGif: false,
    showElements: [],
  },
  list_view: {
    width: 984,
    height: 2130,
    exportWidth: 492,
    exportHeight: 1065,
    isGif: false,
    showElements: [],
  },
  preview_long_ipad: {
    width: 2048,
    height: 2732,
    exportWidth: 1024,
    exportHeight: 1366,
    isGif: false,
    showElements: [],
  },
  list_view_ipad: {
    width: 1024,
    height: 1366,
    exportWidth: 512,
    exportHeight: 683,
    isGif: false,
    showElements: [],
  },
};
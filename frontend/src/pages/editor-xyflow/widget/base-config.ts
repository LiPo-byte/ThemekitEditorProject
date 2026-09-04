export const WIDGET_SIZE: any = {
    small: {
        width: 155,
        height: 155,
    },
    medium: {
        width: 329,
        height: 155,
    },
    large: {
        width: 329,
        height: 345,
    },
};
export const CONFIG_SIZE_MAP: any = {
    1: WIDGET_SIZE.small,
    2: WIDGET_SIZE.medium,
    3: WIDGET_SIZE.large,
};

export const SIZE_LABEL_MAP: Record<number, 'small' | 'medium' | 'large'> = {
    1: 'small',
    2: 'medium',
    3: 'large',
};

export const DEFAULT_CROP_PROPS = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0,
};
export const TYPE_WIDGET_MAP:any = {
    1: 'time',
    2: 'calendar',
    3: 'clock',
    4: 'digital',
    5: 'battery',
    8: 'pureimage',
    9: 'countdown',
    6: 'quotation',
    14: 'launcher',
    13: 'dynamic',
    12: 'weather',
    15: 'timemixbattery',
    16: 'timemixcalendarmixbattery',
    17: 'music',
    18: 'clockmixbattery',
}

/** 与 TYPE_WIDGET_MAP 对应的展示名（大驼峰单词，空格分隔） */
export const TYPE_WIDGET_NAME_MAP: any = {
    1: 'Time',
    2: 'Calendar',
    3: 'Clock',
    4: 'Digital',
    5: 'Battery',
    8: 'Pure Image',
    9: 'Countdown',
    6: 'Quotation',
    14: 'Launcher',
    13: 'Dynamic',
    12: 'Weather',
    15: 'Time Mix Battery',
    16: 'Time Mix Calendar Mix Battery',
    17: 'Music',
    18: 'Clock Mix Battery',
}

export const SOURCENAME_TYPE_WIDGET_MAP:any = {
    9: 'countImage',
    4: 'digital_clock',
    15: 'mix_battery_time',
    16: 'mix_battery_time_calendar',
    18: 'mix_battery_clock',
}
export const APP_LINK_OPTIONS = [
    { value: -1, label: 'ThemeKit' },
    { value: 0, label: 'App_Store' },
    { value: 1, label: 'Apple_Store' },
    { value: 2, label: 'Apple_Music' },
    { value: 3, label: 'Apple_TV' },
    { value: 4, label: 'Amazon' },
    { value: 5, label: 'Books' },
    { value: 6, label: 'Calculator' },
    { value: 7, label: 'Calendar' },
    { value: 8, label: 'Camera' },
    { value: 9, label: 'Chrome' },
    { value: 10, label: 'Clock' },
    { value: 11, label: 'Clips' },
    { value: 12, label: 'Contacts' },
    { value: 13, label: 'Docs' },
    { value: 14, label: 'Facebook' },
    { value: 15, label: 'Facetime' },
    { value: 16, label: 'Files' },
    { value: 17, label: 'Find_My_iPhone' },
    { value: 18, label: 'Google' },
    { value: 19, label: 'Google_Maps' },
    { value: 20, label: 'Google_Photos' },
    { value: 21, label: 'Gmail' },
    { value: 22, label: 'Health' },
    { value: 23, label: 'iMovie' },
    { value: 24, label: 'iTunes' },
    { value: 25, label: 'Instagram' },
    { value: 26, label: 'Line' },
    { value: 27, label: 'Mail' },
    { value: 28, label: 'Maps' },
    { value: 29, label: 'Messages' },
    { value: 30, label: 'Messenger' },
    { value: 32, label: 'Notes' },
    { value: 33, label: 'Netflix' },
    { value: 34, label: 'Phone' },
    { value: 35, label: 'Photos' },
    { value: 36, label: 'Pinterest' },
    { value: 37, label: 'Podcasts' },
    { value: 38, label: 'Reminders' },
    { value: 39, label: 'Reddit' },
    { value: 40, label: 'Safari' },
    { value: 41, label: 'Settings' },
    { value: 42, label: 'Snapchat' },
    { value: 43, label: 'Spotify' },
    { value: 44, label: 'Telegram' },
    { value: 45, label: 'Tiktok' },
    { value: 46, label: 'Twitter' },
    { value: 47, label: 'Twitch' },
    { value: 48, label: 'Tumblr' },
    { value: 49, label: 'Wallet' },
    { value: 50, label: 'Watch' },
    { value: 51, label: 'Weather' },
    { value: 52, label: 'WhatsApp' },
    { value: 53, label: 'YouTube' },
    { value: 54, label: 'ZOOM' },
    { value: 55, label: 'FireFox' },
    { value: 56, label: 'DropBox' },
    { value: 57, label: 'Airbnb' },
    { value: 58, label: 'BurgerKing' },
    { value: 59, label: 'Flickr' },
    { value: 60, label: 'FoxNow' },
    { value: 61, label: 'Asana' },
    { value: 62, label: 'CarbManager' },
    { value: 63, label: 'Enlight' },
    { value: 64, label: 'Gboard' },
    { value: 65, label: 'AdobeLightroom' },
    { value: 66, label: 'Alook' },
    { value: 67, label: 'AlphaOmega' },
    { value: 68, label: 'Ancestry' },
    { value: 69, label: 'AppleNews' },
    { value: 70, label: 'AVPlayer' },
    { value: 71, label: 'Behance' },
    { value: 72, label: 'Booking' },
    { value: 73, label: 'Calendars5' },
    { value: 74, label: 'ClearTodos' },
    { value: 75, label: 'Evernote' },
    { value: 76, label: 'TextNow' },
    { value: 77, label: 'WeatherChannel' },
    { value: 78, label: 'Threads' },
    { value: 79, label: 'TimeTree' },
    { value: 80, label: 'Retouch' },
    { value: 81, label: 'GoogleSheets' },
    { value: 82, label: 'Tubi' },
    { value: 83, label: 'Tweetbot' },
    { value: 84, label: 'Uber' },
    { value: 85, label: 'UNO' },
    { value: 86, label: 'Vimeo' },
    { value: 87, label: 'VSCO' },
    { value: 88, label: 'Wazec' },
    { value: 89, label: 'Drive' },
    { value: 90, label: 'Widgetsmith' },
    { value: 91, label: 'Wish' },
    { value: 92, label: 'Word' },
    { value: 93, label: 'YahooMail' },
    { value: 94, label: 'Yelp' },
    { value: 95, label: 'ZAKER' },
    { value: 96, label: 'Zelle' },
    { value: 97, label: 'Zillow' },
    { value: 98, label: 'Duolingo' },
    { value: 99, label: 'Excel' },
    { value: 100, label: 'Fandango' },
    { value: 101, label: 'Fitbit' },
    { value: 102, label: 'FontsArt' },
    { value: 103, label: 'Forest' },
    { value: 104, label: 'GarageBand' },
    { value: 105, label: 'Goodreads' },
    { value: 106, label: 'Grammarly' },
    { value: 107, label: 'Halide' },
    { value: 108, label: 'Headspace' },
    { value: 109, label: 'Hulu' },
    { value: 110, label: 'IMDb' },
    { value: 111, label: 'Inshot' },
    { value: 112, label: 'KakaoTalk' },
    { value: 113, label: 'LastPass' },
    { value: 114, label: 'Launch' },
    { value: 125, label: 'Life360' },
    { value: 116, label: 'Litely' },
    { value: 117, label: 'Medium' },
    { value: 118, label: 'Musi' },
    { value: 119, label: 'MyFitnessPal' },
    { value: 120, label: 'nPlayer' },
    { value: 121, label: 'OfficeSuite' },
    { value: 122, label: 'OKOK' },
    { value: 123, label: 'PayPal' },
    { value: 124, label: 'PCalcLite' },
    // { value: 125, label: 'PhotoScan' },
    { value: 126, label: 'PicsArt' },
    { value: 127, label: 'PrimeVideo' },
    { value: 128, label: 'Shortcuts' },
    { value: 129, label: 'Starbucks' },
    { value: 130, label: "McDonald's" },
    { value: 131, label: 'Clash of Clans' },
    { value: 132, label: 'Genshin Impact' },
];

/**
 * 倒数日组件的节日名，取值抄自 rule_ymal/resource-validation/lock_screen_countdown_layout_0_nodiy.yml
 * 的 festivalName 枚举。客户端靠这个值查节日日期再算剩余天数，所以必须和 yml 逐字一致，
 * 撇号和点号（St.Patrick's Day / Presidents' Day）都不能改。
 *
 * 首页倒数日（widget type 9）的 yml 只校验 expected_type: str 没给枚举，
 * 但两端支持的节日是同一套，所以共用这份清单。
 */
export const FESTIVAL_NAME_OPTIONS = [
    'Easter',
    'Thanksgiving',
    "St.Patrick's Day",
    "Valentine's Day",
    "April Fool's Day",
    'Halloween',
    "Mother's Day",
    'Christmas',
    'NewYear',
    "Lincoln's Birthday",
    "Presidents' Day",
    'Arbor Day',
    'Memorial Day',
    'Flag Day',
    'Independence Day',
    'International Kissing Day',
    'World Chocolate Day',
    "World Teachers' Day",
    "Veteran's Day",
    "Father's Day",
    'Labor Day',
    'Columbus Day',
    'Black Friday',
].map((name) => ({ value: name, label: name }));

export const DEFAULT_RADIUS = 28;

export type WidgetSizeLabel = 'small' | 'medium' | 'large';
export type WidgetPlatform = 'ios' | 'android' | 'common';
export type WidgetExportMode = 'static' | 'dynamic';

export type WidgetExportRule = {
  timejpg: { width: number; height: number };
  timegif: { width: number; height: number };
  preview: { width: number; height: number };
  /** Battery Layout 0 的 widgets_{size}_battery_{20..100}.jpg，尺寸与主图 timejpg 不同；不配则回退 timejpg */
  batteryjpg?: { width: number; height: number };
};

export type WidgetExportRuleGroup = {
  static: WidgetExportRule;
  dynamic: WidgetExportRule;
};

/**
 * 导出规则（file_rules）：
 * - default：全平台/全 layoutType 兜底
 * - ios/android：平台维度
 * - 每个平台下可按 layoutType 覆盖；默认走 `default`
 */
export const WIDGET_EXPORT_FILE_RULES: {
  default: Record<WidgetSizeLabel, WidgetExportRuleGroup>;
  ios?: Record<number, Partial<Record<WidgetSizeLabel, WidgetExportRuleGroup>>>;
  android?: Record<number, Partial<Record<WidgetSizeLabel, WidgetExportRuleGroup>>>;
  common?: Record<number, Partial<Record<WidgetSizeLabel, WidgetExportRuleGroup>>>;
} = {
  default: {
    small: {
      static: {
        timejpg: { width: 310, height: 310 },
        timegif: { width: 310, height: 310 },
        preview: { width: 310, height: 310 },
      },
      dynamic: {
        timejpg: { width: 310, height: 310 },
        timegif: { width: 269, height: 269 },
        preview: { width: 269, height: 269 },
      },
    },
    medium: {
      static: {
        timejpg: { width: 658, height: 310 },
        timegif: { width: 658, height: 310 },
        preview: { width: 658, height: 310 },
      },
      dynamic: {
        timejpg: { width: 658, height: 310 },
        timegif: { width: 571, height: 269 },
        preview: { width: 571, height: 269 },
      },
    },
    large: {
      static: {
        timejpg: { width: 658, height: 690 },
        timegif: { width: 658, height: 690 },
        preview: { width: 658, height: 690 },
      },
      dynamic: {
        timejpg: { width: 658, height: 690 },
        timegif: { width: 571, height: 599 },
        preview: { width: 571, height: 599 },
      },
    },
  },
  ios: {
    4: {
      small: {
        static: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 310, height: 310 },
          preview: { width: 310, height: 310 },
        },
        dynamic: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
        },
      },
      medium: {
        static: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 658, height: 310 },
          preview: { width: 658, height: 310 },
        },
        dynamic: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
        },
      },
      large: {
        static: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 658, height: 690 },
          preview: { width: 658, height: 690 },
        },
        dynamic: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
        },
      },
    },
    5: {
      small: {
        static: {
          timejpg: { width: 269, height: 269 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
          batteryjpg: { width: 310, height: 310 },
        },
        dynamic: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
        },
      },
      medium: {
        static: {
          timejpg: { width: 571, height: 269 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
          batteryjpg: { width: 658, height: 310 },
        },
        dynamic: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
        },
      },
      large: {
        static: {
          timejpg: { width: 571, height: 599 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
          batteryjpg: { width: 658, height: 690 },
        },
        dynamic: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
        },
      },
    },
    6: {
      small: {
        static: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 310, height: 310 },
          preview: { width: 269, height: 269 },
        },
        dynamic: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
        },
      },
      medium: {
        static: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 658, height: 310 },
          preview: { width: 571, height: 269 },
        },
        dynamic: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
        },
      },
      large: {
        static: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 658, height: 690 },
          preview: { width: 571, height: 599 },
        },
        dynamic: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
        },
      },
    },
  },
  android: {
    4: {
      small: {
        static: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 310, height: 310 },
          preview: { width: 310, height: 310 },
        },
        dynamic: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
        },
      },
      medium: {
        static: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 658, height: 310 },
          preview: { width: 658, height: 310 },
        },
        dynamic: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
        },
      },
      large: {
        static: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 658, height: 690 },
          preview: { width: 658, height: 690 },
        },
        dynamic: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
        },
      },
    },
    5: {
      small: {
        static: {
          timejpg: { width: 269, height: 269 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
          batteryjpg: { width: 310, height: 310 },
        },
        dynamic: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
        },
      },
      medium: {
        static: {
          timejpg: { width: 571, height: 269 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
          batteryjpg: { width: 658, height: 310 },
        },
        dynamic: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
        },
      },
      large: {
        static: {
          timejpg: { width: 571, height: 599 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
          batteryjpg: { width: 658, height: 690 },
        },
        dynamic: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
        },
      },
    },
    6: {
      small: {
        static: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 310, height: 310 },
          preview: { width: 310, height: 310 },
        },
        dynamic: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
        },
      },
      medium: {
        static: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 658, height: 310 },
          preview: { width: 658, height: 310 },
        },
        dynamic: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
        },
      },
      large: {
        static: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 658, height: 690 },
          preview: { width: 658, height: 690 },
        },
        dynamic: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
        },
      },
    },
    13: {

    }
  },
  common: {
    // 与 ios/android 的 type 5 保持一致：type_5 的 yaml 不区分平台
    5: {
      small: {
        static: {
          timejpg: { width: 269, height: 269 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
          batteryjpg: { width: 310, height: 310 },
        },
        dynamic: {
          timejpg: { width: 310, height: 310 },
          timegif: { width: 269, height: 269 },
          preview: { width: 269, height: 269 },
        },
      },
      medium: {
        static: {
          timejpg: { width: 571, height: 269 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
          batteryjpg: { width: 658, height: 310 },
        },
        dynamic: {
          timejpg: { width: 658, height: 310 },
          timegif: { width: 571, height: 269 },
          preview: { width: 571, height: 269 },
        },
      },
      large: {
        static: {
          timejpg: { width: 571, height: 599 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
          batteryjpg: { width: 658, height: 690 },
        },
        dynamic: {
          timejpg: { width: 658, height: 690 },
          timegif: { width: 571, height: 599 },
          preview: { width: 571, height: 599 },
        },
      },
    },
    13: {
        small: {
            static: {
                timejpg: { width: 269, height: 269 },
                timegif: { width: 269, height: 269 },
                preview: { width: 269, height: 269 },
            },
            dynamic: {
                timejpg: { width: 269, height: 269 },
                timegif: { width: 269, height: 269 },
                preview: { width: 269, height: 269 },
            },
        },
        medium: {
          static: {
            timejpg: { width: 571, height: 269 },
            timegif: { width: 571, height: 269 },
            preview: { width: 571, height: 269 },
          },
          dynamic: {
            timejpg: { width: 571, height: 269 },
            timegif: { width: 571, height: 269 },
            preview: { width: 571, height: 269 },
          },
        },
        large: {
          static: {
            timejpg: { width: 571, height: 599 },
            timegif: { width: 571, height: 599 },
            preview: { width: 571, height: 599 },
          },
          dynamic: {
            timejpg: { width: 571, height: 599 },
            timegif: { width: 571, height: 599 },
            preview: { width: 571, height: 599 },
          },
        },
      },
  }
};

/**
 * 这些 type 的组件导出时不产出 widgets_{size}_{name}.jpg，
 * timegif 与 preview 仍按 WIDGET_EXPORT_FILE_RULES 正常导出。
 * 需要新增时把组件 type 数值填进来即可。
 */
export const WIDGET_EXPORT_SKIP_TIMEJPG_TYPES: number[] = [13];

export const shouldSkipWidgetTimeJpg = (type: unknown) =>
  WIDGET_EXPORT_SKIP_TIMEJPG_TYPES.includes(Number(type));

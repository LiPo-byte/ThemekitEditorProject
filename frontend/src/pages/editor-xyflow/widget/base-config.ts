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

export type WidgetSizeLabel = 'small' | 'medium' | 'large';
export type WidgetPlatform = 'ios' | 'android';
export type WidgetExportMode = 'static' | 'dynamic';

export type WidgetExportRule = {
  timejpg: { width: number; height: number };
  timegif: { width: number; height: number };
  preview: { width: number; height: number };
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
    5: {
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
  },
};

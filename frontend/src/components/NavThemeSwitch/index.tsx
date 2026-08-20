import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import type { SegmentedProps } from 'antd';
import { Segmented, theme } from 'antd';
import React from 'react';

export type NavThemeSwitchProps = {
  size?: SegmentedProps['size'];
  className?: string;
  style?: React.CSSProperties;
  /**
   * Segmented 默认 trackBg 不透明，会挡住底下容器的 backdrop-filter；
   * 打开后换成 filled 按钮同款半透明填充色。blur 本身由调用方通过 style 传。
   */
  glass?: boolean;
};

const NavThemeSwitch: React.FC<NavThemeSwitchProps> = ({
  size,
  className,
  style,
  glass,
}) => {
  const { token } = theme.useToken();
  const { initialState, setInitialState } = useModel('@@initialState');

  return (
    <Segmented
      value={initialState?.settings?.navTheme || 'light'}
      size={size}
      className={className}
      style={style}
      styles={
        glass ? { root: { background: token.colorFillTertiary } } : undefined
      }
      onChange={(v) => {
        setInitialState((s) => ({
          ...s,
          settings: {
            ...initialState?.settings,
            navTheme: v as LayoutSettings['navTheme'],
          },
        }));
      }}
      options={[
        { value: 'light', icon: <SunOutlined /> },
        { value: 'realDark', icon: <MoonOutlined /> },
      ]}
    />
  );
};

export default NavThemeSwitch;

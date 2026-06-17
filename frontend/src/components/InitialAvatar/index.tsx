import type { AvatarProps } from 'antd';
import { Avatar } from 'antd';
import React from 'react';

export type InitialAvatarProps = Omit<AvatarProps, 'children'> & {
  /** 用于生成首字母的字符串，如用户名 */
  name?: string | null;
  /** name 为空时的占位字符，默认 '?' */
  fallback?: string;
};

const InitialAvatar: React.FC<InitialAvatarProps> = ({
  name,
  fallback = '?',
  ...rest
}) => {
  const firstChar = name?.trim()?.[0];
  const initial = (firstChar ?? fallback).toUpperCase();

  return <Avatar {...rest}>{initial}</Avatar>;
};

export default InitialAvatar;

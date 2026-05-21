import {
  // FormattedMessage,
  Helmet,
  // SelectLang,
  useIntl,
  useModel,
} from '@umijs/max';

import { App, Button, Form, Input } from 'antd';
import { createStyles } from 'antd-style';
import React, { startTransition, useState } from 'react';
import { login } from '@/services/ant-design-pro/api';
import Settings from '../../../../config/defaultSettings';
import loginbg from './loginbg.svg';

type FieldType = {
  username?: string;
  password?: string;
  remember?: string;
};

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
    },
    grid: {
      inset: '-25%',
      width: '100%',
      height: '100%',
      transform: 'skewY(-12deg)',
      transformOrigin: 'center',
      maskImage: `radial-gradient(circle at center, white, transparent 80%);
      -webkit-mask-image: radial-gradient(circle at center, white, transparent 80%)`,
    },
    logincontent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      gap: '10px',
    }
  };
});

// const Lang = () => {
//   const { styles } = useStyles();

//   return (
//     <div className={styles.lang} data-lang>
//       {SelectLang && <SelectLang />}
//     </div>
//   );
// };

// const LoginMessage: React.FC<{
//   content: string;
// }> = ({ content }) => {
//   return (
//     <Alert
//       style={{
//         marginBottom: 24,
//       }}
//       title={content}
//       type="error"
//       showIcon
//     />
//   );
// };

const Login: React.FC = () => {
  const [_userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, _setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();
  /**
   * Validate redirect URL to prevent open redirect attacks
   * Only allow same-origin relative paths starting with '/'
   */
  const getSafeRedirectUrl = (redirect: string | null): string => {
    if (!redirect?.startsWith('/')) return '/';

    // Block protocol-relative URLs (//example.com)
    if (redirect.startsWith('//')) return '/';

    try {
      const parsed = new URL(redirect, window.location.origin);
      // Only allow same-origin URLs
      if (parsed.origin !== window.location.origin) return '/';
      // Return the path with query and hash preserved
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return '/';
    }
  };

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      console.log(userInfo, 'userInfo')
      startTransition(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // 登录
      const msg = await login({ ...values, type });
      if (msg?.access_token) {
        localStorage.setItem('access_token', msg.access_token);
      }
      if (msg.status === 'ok') {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        message.success(defaultLoginSuccessMessage);
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        const redirectUrl = getSafeRedirectUrl(urlParams.get('redirect'));
        window.location.href = redirectUrl;
        return;
      }
      // 如果失败去设置用户错误信息
      setUserLoginState(msg);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {Settings.title && `${Settings.title}`}
        </title>
      </Helmet>
      <div className={styles.logincontent}>
          <img style={{ width: '400px' }} src={loginbg} alt="" />
          <div>
            <h1 style={{ fontSize: 30 }}>{Settings.title}</h1>
            <Form
              name="basic"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              style={{ maxWidth: 600, width: '400px'}}
              onFinish={handleSubmit}
              onFinishFailed={() => {}}
              autoComplete="off"
              variant="underlined"
            >
              <Form.Item<FieldType>
                label="用户名"
                name="username"
                layout="vertical"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item<FieldType>
                label="密码"
                name="password"
                layout="vertical"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item label={null}>
                <Button block type="primary" htmlType="submit">
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
      </div>
    </div>
  );
};

export default Login;

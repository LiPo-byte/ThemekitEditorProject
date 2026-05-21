import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import React from 'react';

const AccountSettings: React.FC = () => {
  return (
    <PageContainer>
      <Card>
        <h2>个人设置</h2>
        <p>修改密码、绑定账号、消息通知偏好等</p>
      </Card>
    </PageContainer>
  );
};

export default AccountSettings;

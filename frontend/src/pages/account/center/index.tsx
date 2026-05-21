import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import React from 'react';

const AccountCenter: React.FC = () => {
  return (
    <PageContainer>
      <Card>
        <h2>个人中心</h2>
        <p>展示用户基本信息、最近活动等</p>
      </Card>
    </PageContainer>
  );
};

export default AccountCenter;

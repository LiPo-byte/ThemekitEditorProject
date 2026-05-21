import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import React from 'react';

const ComponentList: React.FC = () => {
  return (
    <PageContainer>
      <Card>
        <h2>组件列表</h2>
        <p>展示所有可用组件</p>
      </Card>
    </PageContainer>
  );
};

export default ComponentList;

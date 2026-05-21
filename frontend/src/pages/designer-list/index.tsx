import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import React from 'react';

const DesignerList: React.FC = () => {
  return (
    <PageContainer>
      <Card>
        <h2>设计师列表</h2>
        <p>展示所有设计师信息</p>
      </Card>
    </PageContainer>
  );
};

export default DesignerList;

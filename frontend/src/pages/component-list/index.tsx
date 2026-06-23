import React, { useState } from 'react';
import { Avatar, Button, Card, Col, Flex, Row } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
const { Meta } = Card;

const ComponentList: React.FC = () => {
  const d = [];
  for(let i = 0; i <= 10; i++) {
    d.push(i);
  }
  const [data, setData] = useState<any>(d);
  return (
    <PageContainer>
      <Row gutter={[20, 20]}>
        {data.map((i: number) => (
          <Col key={i} xs={24} sm={12} lg={6}>
            <Card
              cover={
                <img
                  draggable={false}
                  alt="example"
                  src="http://localhost:8000/data/project/e01cb63a-cc16-42e9-a0a5-ca6a6e4fa6f8/preview.webp"
                />
              }
              hoverable
              style={{ width: '100%' }}
              styles={{
                cover: {
                  borderBottom: '1px solid #f0f0f0',
                  margin: 'auto',
                  height: "200px",
                  overflow: 'hidden'
                }
              }}
            >
              <Meta
                title="今晚打老虎"
                description={
                  <Flex align='center' justify='space-between'>
                    <span>更新时间：2026-06-18</span>
                    <Avatar src="/avater/baking.svg" />
                  </Flex>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
};

export default ComponentList;

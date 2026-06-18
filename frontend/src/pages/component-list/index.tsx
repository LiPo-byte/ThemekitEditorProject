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
                  src="https://images.unsplash.com/photo-1777400547618-2fb8571fb11c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw5fHx8ZW58MHx8fHx8"
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

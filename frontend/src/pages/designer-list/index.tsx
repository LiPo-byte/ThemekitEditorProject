import React, { useEffect, useState } from 'react';

import { getApiV1Users, postApiV1Users } from './service';

import { PageContainer } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, message, Modal, Row } from 'antd';
const { Meta } = Card;
import InitialAvatar from '@/components/InitialAvatar';

const DesignerList: React.FC = () => {
  const [designers, setDesigners] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{
    username: string;
    password: string;
    confirmPassword: string;
  }>();

  const handleCancel = () => {
    form.resetFields();
    setOpen(false);
  };

  const handleOk = () => {
    form.submit();
  };

  const handleFinish = async (values: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    const username = values.username.trim();
    const param = {
      email: username + '@woohooart.com',
      username,
      password: values.password,
      full_name: username,
      is_active: true,
      is_superuser: false,
    };
    try {
      await postApiV1Users(param);
      message.success('添加成员成功');
      form.resetFields();
      setOpen(false);
      getUsers();
    } catch {
      // 错误已由全局 errorHandler 统一弹出 message，
      // 这里 catch 是为了不关闭 Modal，让用户修改后重试
    }
  };

  const getUsers = async () => {
    const { data, status } = await getApiV1Users();
    if (status === 'ok') {
      setDesigners(data.reverse())
    }
  };

  useEffect(() => {
    getUsers()
  }, []);

  return (
    <PageContainer>
      <Row gutter={[10, 10]}>
        {designers.map((designer) => (
          <Col key={designer.username} xs={24} sm={12} lg={6}>
            <Card hoverable style={{ width: '100%' }}>
              <Meta
                avatar={<InitialAvatar name={designer.username} />}
                title={designer.username}
                description={designer.id}
              />
            </Card>
          </Col>
        ))}
        <Col xs={24} sm={12} lg={6}>
          <Button
            variant="filled"
            color="default"
            block
            style={{ height: '100%', minHeight: 86 }}
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
          />
        </Col>
      </Row>
      <Modal
        title="添加成员"
        open={open}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 32, message: '用户名长度需为 3-32 个字符' },
              { pattern: /^[A-Za-z0-9_]+$/, message: '只能使用字母、数字、下划线' },
            ]}
          >
            <Input placeholder="请输入用户名" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少 8 位' },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="请输入密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default DesignerList;

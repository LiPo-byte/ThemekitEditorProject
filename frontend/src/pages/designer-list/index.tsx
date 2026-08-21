import React, { useEffect, useState } from 'react';

import {
  deleteApiV1User,
  getApiV1Users,
  patchApiV1User,
  postApiV1Users,
} from './service';

import { PageContainer } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Row,
  Tag,
} from 'antd';
import type { MenuProps } from 'antd';
const { Meta } = Card;
import InitialAvatar from '@/components/InitialAvatar';
import { useModel } from '@umijs/max';

const DesignerList: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  // currentUser 由 /users/me 返回，运行时带 id，但生成的 API.CurrentUser 类型里没有声明
  const currentUserId = (initialState?.currentUser as any)?.id;
  const [designers, setDesigners] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [freezingId, setFreezingId] = useState<string | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [form] = Form.useForm<{
    username: string;
    password: string;
    confirmPassword: string;
  }>();
  const [passwordForm] = Form.useForm<{
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
      setDesigners(data)
    }
  };

  useEffect(() => {
    getUsers()
  }, []);

  const openDeleteConfirm = (designer: { id: string; username: string }) => {
    Modal.confirm({
      title: `确定删除成员「${designer.username}」？`,
      content: '删除后不可恢复，该成员名下的项目也会一并删除。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setDeletingId(designer.id);
          await deleteApiV1User(designer.id);
          message.success('成员已删除');
          getUsers();
        } catch {
          // 错误已由全局 errorHandler 统一弹出 message
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleToggleFrozen = async (
    designer: { id: string; username: string },
    nextActive: boolean,
  ) => {
    try {
      setFreezingId(designer.id);
      const res = await patchApiV1User(designer.id, { is_active: nextActive });
      // 只有这一条的状态变了，整页重拉会让列表闪一下
      setDesigners((prev) =>
        prev.map((item) =>
          item.id === designer.id
            ? { ...item, is_active: res.is_active ?? nextActive }
            : item,
        ),
      );
      message.success(nextActive ? '已解冻' : '已冻结');
    } catch {
      // 错误已由全局 errorHandler 统一弹出 message
    } finally {
      setFreezingId(null);
    }
  };

  const handlePasswordCancel = () => {
    passwordForm.resetFields();
    setPasswordTarget(null);
  };

  const handlePasswordFinish = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!passwordTarget) return;
    try {
      await patchApiV1User(passwordTarget.id, { password: values.password });
      message.success('密码已修改');
      passwordForm.resetFields();
      setPasswordTarget(null);
    } catch {
      // 同上，保持 Modal 打开让用户修改后重试
    }
  };

  return (
    <PageContainer>
      <Row gutter={[10, 10]}>
        {designers.map((designer, index) => (
          <React.Fragment key={designer.id ?? designer.username}>
            {index === 0 && (
              <Col span={2}>
                <Button
                  variant="filled"
                  color="default"
                  block
                  style={{ height: '100%', minHeight: 86 }}
                  icon={<PlusOutlined />}
                  onClick={() => setOpen(true)}
                />
              </Col>
            )}
            <Col span={index === 0 ? 22 : 24}>
              <Dropdown
                trigger={['contextMenu']}
                menu={{
                  items: [
                    {
                      key: 'reset-password',
                      label: '修改密码',
                    },
                    // 冻结自己会让自己下一个请求就掉线，删除自己后端也直接 403，
                    // 所以这两个入口在自己这张卡上不给
                    ...(designer.id === currentUserId
                      ? []
                      : [
                          {
                            key: 'toggle-frozen',
                            label:
                              designer.is_active === false
                                ? '解冻成员'
                                : '冻结成员',
                            disabled: freezingId === designer.id,
                          },
                          {
                            key: 'delete-user',
                            label: '删除成员',
                            danger: true,
                            disabled: deletingId === designer.id,
                          },
                        ]),
                  ] as MenuProps['items'],
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation();
                    if (key === 'reset-password') {
                      setPasswordTarget({
                        id: designer.id,
                        username: designer.username,
                      });
                    }
                    if (key === 'toggle-frozen') {
                      handleToggleFrozen(designer, designer.is_active === false);
                    }
                    if (key === 'delete-user') {
                      openDeleteConfirm(designer);
                    }
                  },
                }}
              >
                <div>
                  <Card hoverable style={{ width: '100%' }}>
                    <Meta
                      avatar={<InitialAvatar name={designer.username} />}
                      title={
                        designer.is_active === false ? (
                          <span>
                            {designer.username}
                            <Tag style={{ marginInlineStart: 8 }}>已冻结</Tag>
                          </span>
                        ) : (
                          designer.username
                        )
                      }
                      description={designer.id}
                    />
                  </Card>
                </div>
              </Dropdown>
            </Col>
          </React.Fragment>
        ))}
        {!designers.length && (
          <Col span={24}>
            <Button
              variant="filled"
              color="default"
              block
              style={{ height: '100%', minHeight: 86 }}
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
            />
          </Col>
        )}
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
      <Modal
        title={`修改「${passwordTarget?.username ?? ''}」的密码`}
        open={!!passwordTarget}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
        onOk={() => passwordForm.submit()}
        onCancel={handlePasswordCancel}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordFinish}
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少 8 位' },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="请输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请再次输入新密码' },
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
            <Input.Password
              placeholder="请再次输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default DesignerList;

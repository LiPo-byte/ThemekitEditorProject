import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteProject,
  getProjectList,
  updateProjectVisibility,
  type ProjectListItem,
  type ProjectVisibility,
} from './service';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Flex,
  Modal,
  Pagination,
  Row,
  Tag,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { createStyles } from 'antd-style';
import { InitialAvatar } from '@/components';
const { Meta } = Card;
import dayjs from 'dayjs';

/** 轻量占位图，避免大 base64 打进包体积 */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect fill='%23f0f0f0' width='100%25' height='100%25'/%3E%3C/svg%3E";

/** 展示用缩略图最大边；封面 200px 高 + objectFit cover，@2x 屏约需 660px，留一点余量 */
const PREVIEW_DISPLAY_MAX = 720;

const coverImgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

/** 给右上角的可见性 Tag 提供定位参照 */
const coverWrapStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
};

const visibilityTagStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  margin: 0,
};

/** 将过大的预览图缩到展示尺寸，降低 hover/点击时的重绘成本 */
const ProjectCardCover: React.FC<{ src: string | null }> = ({ src }) => {
  const [thumbSrc, setThumbSrc] = useState(PLACEHOLDER_IMAGE);

  useEffect(() => {
    if (!src) {
      setThumbSrc(PLACEHOLDER_IMAGE);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      const { naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h || (w <= PREVIEW_DISPLAY_MAX && h <= PREVIEW_DISPLAY_MAX)) {
        setThumbSrc(src);
        return;
      }
      const scale = Math.min(PREVIEW_DISPLAY_MAX / w, PREVIEW_DISPLAY_MAX / h);
      const dw = Math.max(1, Math.round(w * scale));
      const dh = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setThumbSrc(src);
        return;
      }
      ctx.drawImage(img, 0, 0, dw, dh);
      canvas.toBlob(
        (blob) => {
          if (cancelled) return;
          if (!blob) {
            setThumbSrc(src);
            return;
          }
          const url = URL.createObjectURL(blob);
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          objectUrl = url;
          setThumbSrc(url);
        },
        'image/webp',
        0.9,
      );
    };
    img.onerror = () => {
      if (!cancelled) setThumbSrc(PLACEHOLDER_IMAGE);
    };
    img.src = src;

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return (
    <img
      draggable={false}
      alt=""
      loading="lazy"
      decoding="async"
      style={coverImgStyle}
      src={thumbSrc}
    />
  );
};

type ProjectCardProps = {
  item: ProjectListItem;
  focused: boolean;
  deleting: boolean;
  togglingVisibility: boolean;
  onFocus: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onToggleVisibility: (
    projectId: string,
    nextVisibility: ProjectVisibility,
  ) => void;
};

const ProjectCard = React.memo<ProjectCardProps>(
  ({
    item,
    focused,
    deleting,
    togglingVisibility,
    onFocus,
    onDelete,
    onToggleVisibility,
  }) => {
    const ownerName = item.owner.full_name || item.owner.username;
    const isPublic = item.visibility === 'public';
    return (
      <Dropdown
        trigger={['contextMenu']}
        // 别人的公开项目只能看，右键没有任何可执行项，就别弹一个空菜单了
        disabled={!item.can_edit}
        menu={{
          items: [
            {
              key: 'toggle-visibility',
              label: isPublic ? '设为私有' : '设为公开',
              disabled: togglingVisibility,
            },
            {
              key: 'delete-project',
              label: '删除项目',
              danger: true,
              disabled: deleting,
            },
          ] as MenuProps['items'],
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            if (key === 'delete-project') {
              onDelete(item.project_id);
            }
            if (key === 'toggle-visibility') {
              onToggleVisibility(
                item.project_id,
                isPublic ? 'private' : 'public',
              );
            }
          },
        }}
      >
        <div>
          <Card
            onClick={() => {
              onFocus(item.project_id);
            }}
            onContextMenu={() => {
              onFocus(item.project_id);
            }}
            onDoubleClick={() => {
              history.push('/editor-xyflow/' + item.project_id);
            }}
            cover={
              <div style={coverWrapStyle}>
                <ProjectCardCover src={item.preview_image} />
                <Tag
                  color={isPublic ? 'green' : 'default'}
                  style={visibilityTagStyle}
                >
                  {isPublic ? '公开' : '私有'}
                </Tag>
              </div>
            }
            hoverable
            style={{
              width: '100%',
              contain: 'layout paint style',
            }}
            styles={{
              cover: {
                borderBottom: '1px solid #f0f0f0',
                margin: 'auto',
                height: '200px',
                overflow: 'hidden',
                contain: 'paint',
              },
              root: focused
                ? {
                    borderColor: '#696FC7',
                    boxShadow: '0 2px 8px #A7AAE1',
                    borderRadius: 8,
                  }
                : undefined,
            }}
          >
            <Meta
              title={item.name}
              styles={
                focused
                  ? {
                      title: {
                        color: '#A7AAE1',
                      },
                      description: {
                        color: '#A7AAE1',
                      },
                    }
                  : undefined
              }
              description={
                <Flex align="center" justify="space-between">
                  <Flex vertical>
                    <span>
                      更新时间：
                      {dayjs(item.updated_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                    <span>创建人：{ownerName}</span>
                  </Flex>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                    }}
                  >
                    <InitialAvatar
                      style={{ width: '32px', height: '32px' }}
                      name={ownerName}
                    />
                  </div>
                </Flex>
              }
            />
          </Card>
        </div>
      </Dropdown>
    );
  },
);

/** 浮动分页条要跟随亮/暗主题，颜色只能取 token，不能写死 */
const useStyles = createStyles(({ token, css }) => ({
  paginationBar: css`
    position: fixed;
    right: 24px;
    bottom: 16px;
    z-index: 1000;
    padding: 8px 12px;
    background: ${token.colorBgElevated};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    box-shadow: ${token.boxShadowTertiary};
  `,
}));

/** 骨架屏占位卡片，铺满一屏即可，不必和 pageSize 对齐 */
const SKELETON_KEYS = Array.from(
  { length: 8 },
  (_, index) => `project-skeleton-${index}`,
);

const ProjectList: React.FC = () => {
  const { styles } = useStyles();
  const [data, setData] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [focusCard, setFocuseCard] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [togglingProjectId, setTogglingProjectId] = useState<string | null>(
    null,
  );
  const focusCardRef = useRef(focusCard);
  const currentRef = useRef(current);
  focusCardRef.current = focusCard;
  currentRef.current = current;

  const loadProjects = async (page = current) => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getProjectList({ skip: (page - 1) * 12, limit: 12 });
      setData(res.data);
      setTotal(res.count);
      return res;
    } catch {
      // 请求失败时全局拦截器会弹 toast，这里负责把页面从「空白」变成可重试的错误态
      setLoadError(true);
      setData([]);
      setTotal(0);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects(current);
  }, [current]);

  const openDeleteConfirm = useCallback((projectId: string) => {
    Modal.confirm({
      title: '确定删除该项目？',
      content: '删除后不可恢复。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setDeletingProjectId(projectId);
          await deleteProject(projectId);
          if (focusCardRef.current === projectId) {
            setFocuseCard(null);
          }
          message.success('项目已删除');
          const page = currentRef.current;
          const refreshed = await getProjectList({
            skip: (page - 1) * 12,
            limit: 12,
          });
          setData(refreshed.data);
          setTotal(refreshed.count);
          if (refreshed.data.length === 0 && page > 1) {
            setCurrent(page - 1);
          }
        } catch (error: any) {
          message.error('删除失败！请稍后再试');
        } finally {
          setDeletingProjectId(null);
        }
      },
    });
  }, []);

  const handleFocusCard = useCallback((projectId: string) => {
    setFocuseCard(projectId);
  }, []);

  const handleToggleVisibility = useCallback(
    async (projectId: string, nextVisibility: ProjectVisibility) => {
      try {
        setTogglingProjectId(projectId);
        const res = await updateProjectVisibility(projectId, nextVisibility);
        // 只有这一张卡的状态变了，整页重拉会让列表闪一下
        setData((prev) =>
          prev.map((item) =>
            item.project_id === projectId
              ? { ...item, visibility: res.visibility ?? nextVisibility }
              : item,
          ),
        );
        message.success(
          nextVisibility === 'public' ? '已设为公开' : '已设为私有',
        );
      } catch {
        message.error('切换失败！请稍后再试');
      } finally {
        setTogglingProjectId(null);
      }
    },
    [],
  );

  const renderContent = () => {
    // 加载中和「真的没有项目」在视觉上必须能区分，否则用户分不清是空还是没加载出来
    if (loading) {
      return (
        <Row gutter={[20, 20]} style={{ paddingBottom: 72 }}>
          {SKELETON_KEYS.map((skeletonKey) => (
            <Col key={skeletonKey} xs={24} sm={12} lg={6}>
              <Card
                loading
                style={{ width: '100%' }}
                cover={<div style={{ height: '100%', background: '#fafafa' }} />}
                styles={{
                  cover: {
                    height: '200px',
                    borderBottom: '1px solid #f0f0f0',
                  },
                }}
              />
            </Col>
          ))}
        </Row>
      );
    }

    if (loadError) {
      return (
        <Empty style={{ padding: '96px 0' }} description="项目列表加载失败">
          <Button
            onClick={() => {
              loadProjects(current);
            }}
          >
            重试
          </Button>
        </Empty>
      );
    }

    if (!data.length) {
      return (
        <Empty style={{ padding: '96px 0' }} description="还没有项目">
          <Button
            type="primary"
            onClick={() => {
              history.push('/editor-xyflow');
            }}
          >
            + Design
          </Button>
        </Empty>
      );
    }

    return (
      <Row gutter={[20, 20]} style={{ paddingBottom: 72 }}>
        {data.map((item) => (
          <Col key={item.project_id} xs={24} sm={12} lg={6}>
            <ProjectCard
              item={item}
              focused={focusCard === item.project_id}
              deleting={deletingProjectId === item.project_id}
              togglingVisibility={togglingProjectId === item.project_id}
              onFocus={handleFocusCard}
              onDelete={openDeleteConfirm}
              onToggleVisibility={handleToggleVisibility}
            />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <PageContainer>
      {renderContent()}
      {data.length ? (
        <div className={styles.paginationBar}>
          <Flex justify="end">
            <Pagination
              current={current}
              pageSize={12}
              showSizeChanger={false}
              total={total}
              onChange={(page) => {
                setCurrent(page);
              }}
            />
          </Flex>
        </div>
      ) : null}
    </PageContainer>
  );
};

export default ProjectList;

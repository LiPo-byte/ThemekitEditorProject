import { request } from '@umijs/max';

export type UserCreate = {
  email: string;
  username: string;
  password: string;
  full_name?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type UserPublic = {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
  created_at?: string | null;
};

export type UsersPublic = {
  status: string;
  data: UserPublic[];
  count: number;
};

/** 获取用户列表 GET /api/v1/users/ */
export async function getApiV1Users(
  params?: {
    skip?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<UsersPublic>('/api/v1/users/', {
    method: 'GET',
    params: {
      skip: 0,
      limit: 100,
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建用户（需要 superuser 权限） POST /api/v1/users/ */
export async function postApiV1Users(
  body: UserCreate,
  options?: { [key: string]: any },
) {
  return request<UserPublic>('/api/v1/users/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

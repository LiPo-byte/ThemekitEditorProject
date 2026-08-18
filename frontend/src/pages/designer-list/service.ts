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

export type UserUpdate = {
  email?: string | null;
  username?: string | null;
  password?: string | null;
  full_name?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type MessageResponse = {
  message: string;
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

/** 更新用户，传 password 即重置密码（需要 superuser 权限） PATCH /api/v1/users/{user_id} */
export async function patchApiV1User(
  userId: string,
  body: UserUpdate,
  options?: { [key: string]: any },
) {
  return request<UserPublic>(`/api/v1/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除用户（需要 superuser 权限，会级联删除其项目） DELETE /api/v1/users/{user_id} */
export async function deleteApiV1User(
  userId: string,
  options?: { [key: string]: any },
) {
  return request<MessageResponse>(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

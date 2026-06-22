import { request } from '@umijs/max';

export type ProjectCreateRequest = {
  name?: string;
};

export type ProjectCreateResponse = {
  project_id: string;
};

/** 创建草稿项目 POST /api/v1/project/ */
export async function postApiV1Project(
  body?: ProjectCreateRequest,
  options?: { [key: string]: any },
) {
  return request<ProjectCreateResponse>('/api/v1/project/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body ?? {},
    ...(options || {}),
  });
}

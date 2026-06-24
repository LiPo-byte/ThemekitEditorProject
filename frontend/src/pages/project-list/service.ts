import { request } from '@umijs/max';
export type ProjectOwnerInfo = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
};

export type ProjectListItem = {
  project_id: string;
  name: string;
  status: string;
  current_version: number;
  preview_image: string | null;
  created_at: string | null;
  updated_at: string | null;
  owner: ProjectOwnerInfo;
};

export type ProjectListResponse = {
  data: ProjectListItem[];
  count: number;
};


/** 获取项目列表 GET /api/v1/project/ */
export async function getProjectList(
  params?: { skip?: number; limit?: number },
  options?: { [key: string]: any },
) {
  return request<ProjectListResponse>('/api/v1/project/', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}




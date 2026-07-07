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

export type ProjectDeleteResponse = {
  project_id?: string;
  deleted?: boolean;
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

/** 删除项目 DELETE /api/v1/project/{project_id} */
export async function deleteProject(
  projectId: string,
  options?: { [key: string]: any },
) {
  return request<ProjectDeleteResponse>(`/api/v1/project/${projectId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}




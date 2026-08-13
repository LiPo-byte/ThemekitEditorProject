import { request } from '@umijs/max';
export type ProjectOwnerInfo = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
};

export type ProjectVisibility = 'private' | 'public';

export type ProjectListItem = {
  project_id: string;
  name: string;
  status: string;
  current_version: number;
  visibility: ProjectVisibility;
  /** 后端算好的写权限：别人的公开项目为 false，此时不给删除/改可见性入口 */
  can_edit: boolean;
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

export type ProjectUpdateVisibilityResponse = {
  project_id: string;
  visibility: ProjectVisibility;
  updated_at: string;
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

/** 切换项目公开/私有 PATCH /api/v1/project/{project_id}/visibility */
export async function updateProjectVisibility(
  projectId: string,
  visibility: ProjectVisibility,
  options?: { [key: string]: any },
) {
  return request<ProjectUpdateVisibilityResponse>(
    `/api/v1/project/${projectId}/visibility`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { visibility },
      ...(options || {}),
    },
  );
}




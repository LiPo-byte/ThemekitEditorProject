import { request } from '@umijs/max';

export type ProjectCreateRequest = {
  name?: string;
};

export type ProjectCreateResponse = {
  project_id: string;
};

export type ProjectElementSavePayload = {
  element_key: string;
  category: string;
  subtype: string;
  x?: number;
  y?: number;
  visible?: boolean;
  locked?: boolean;
  schema_version?: number;
  config_json?: Record<string, any>;
};

export type ProjectSaveRequest = {
  elements?: ProjectElementSavePayload[];
  preview_image?: string | null;
};

export type ProjectSaveResponse = {
  project_id: string;
  saved_count: number;
  updated_at: string;
};

export type ProjectDetailElement = {
  element_key: string;
  category: string;
  subtype: string;
  x: number;
  y: number;
  visible: boolean;
  locked: boolean;
  schema_version: number;
  config_json: Record<string, any>;
};

export type ProjectDetailResponse = {
  project_id: string;
  name: string;
  status: string;
  current_version: number;
  preview_image: string | null;
  created_at: string | null;
  updated_at: string | null;
  elements: ProjectDetailElement[];
};

export type ProjectUploadImageResponse = {
  url: string;
  path: string;
  content_type: string;
  size: number;
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

/** 批量保存项目元素 PUT /api/v1/project/{project_id}/elements/batch */
export async function putApiV1ProjectElementsBatch(
  projectId: string,
  body: ProjectSaveRequest,
  options?: { [key: string]: any },
) {
  return request<ProjectSaveResponse>(
    `/api/v1/project/${projectId}/elements/batch`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}

/** 获取项目详情 GET /api/v1/project/{project_id} */
export async function getProjectDetail(
  projectId: string,
  options?: { [key: string]: any },
) {
  return request<ProjectDetailResponse>(`/api/v1/project/${projectId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 上传项目图片 POST /api/v1/project/{project_id}/upload-image */
export async function uploadProjectImage(
  projectId: string,
  file: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();
  formData.append('file', file);
  return request<ProjectUploadImageResponse>(
    `/api/v1/project/${projectId}/upload-image`,
    {
      method: 'POST',
      data: formData,
      ...(options || {}),
    },
  );
}

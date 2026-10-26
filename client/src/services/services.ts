import api from './api';

/**
 * Auth endpoints removed in this build — there is no registration or login.
 *
 * The client auto-starts as authenticated (see store/authStore.ts), so the
 * project / render / export flows work without asking the user to sign in.
 */
export const authService = {
  /** @deprecated this build has no accounts */
  register: async () => { throw new Error('Authentication is not available in this build.'); },
  /** @deprecated this build has no accounts */
  login: async () => { throw new Error('Authentication is not available in this build.'); },
  /** @deprecated this build has no accounts */
  me: async () => { return { id: 'clipforge-user', email: 'user@clipforge.local', name: 'ClipForge User' }; },
};

export const projectService = {
  list: async (page = 1, limit = 10) => {
    const res = await api.get('/projects', { params: { page, limit } });
    return res.data.data;
  },

  get: async (id: string) => {
    const res = await api.get(`/projects/${id}`);
    return res.data.data;
  },

  getMetadata: async (url: string) => {
    const res = await api.post('/projects/metadata', { url });
    return res.data.data;
  },

  create: async (data: {
    url?: string;
    rightsConfirmed: boolean;
    rightsType: string;
    rightsSafeMode?: boolean;
    sourceType?: string;
  }) => {
    const res = await api.post('/projects', data);
    return res.data.data;
  },

  upload: async (
    file: File,
    data: { rightsConfirmed: boolean; rightsType: string; rightsSafeMode?: boolean }
  ) => {
    const form = new FormData();
    form.append('video', file);
    form.append('rightsConfirmed', String(data.rightsConfirmed));
    form.append('rightsType', data.rightsType);
    form.append('rightsSafeMode', String(Boolean(data.rightsSafeMode)));
    const res = await api.post('/projects/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};

export const renderService = {
  start: async (data: {
    projectId: string;
    clipId: string;
    editorConfig: any;
  }) => {
    const res = await api.post('/render', data);
    return res.data.data;
  },

  getStatus: async (jobId: string) => {
    const res = await api.get(`/render/${jobId}`);
    return res.data.data;
  },

  getMusicLibrary: async () => {
    const res = await api.get('/export/music/library');
    return res.data.data;
  },

  // Uses the axios instance so the token-refresh interceptor applies
  download: async (jobId: string) => {
    const res = await api.get(`/export/${jobId}/download`, { responseType: 'blob' });
    return res.data as Blob;
  },
};

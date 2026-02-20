import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/admin-guru";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post("/auth/login", { username, password }),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get("/auth/me"),
};

export const adminApi = {
  kelas: {
    list: () => apiClient.get("/admin/kelas"),
    create: (data: any) => apiClient.post("/admin/kelas", data),
    update: (id: string, data: any) => apiClient.put(`/admin/kelas/${id}`, data),
    delete: (id: string) => apiClient.delete(`/admin/kelas/${id}`),
    naikKelas: (data: any) => apiClient.post("/admin/kelas/naik-kelas", data),
  },
  siswa: {
    list: (params?: any) => apiClient.get("/admin/siswa", { params }),
    create: (data: any) => apiClient.post("/admin/siswa", data),
    update: (id: string, data: any) => apiClient.put(`/admin/siswa/${id}`, data),
    delete: (id: string) => apiClient.delete(`/admin/siswa/${id}`),
    import: (file: FormData) => apiClient.post("/admin/siswa/import", file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
    mapel: (id: string) => apiClient.get(`/admin/siswa/${id}/mapel`),
  },
  guru: {
    list: () => apiClient.get("/admin/guru"),
    create: (data: any) => apiClient.post("/admin/guru", data),
    update: (id: string, data: any) => apiClient.put(`/admin/guru/${id}`, data),
    delete: (id: string) => apiClient.delete(`/admin/guru/${id}`),
  },
  mapel: {
    list: () => apiClient.get("/admin/mapel"),
    create: (data: any) => apiClient.post("/admin/mapel", data),
    update: (id: string, data: any) => apiClient.put(`/admin/mapel/${id}`, data),
    delete: (id: string) => apiClient.delete(`/admin/mapel/${id}`),
  },
  kartuPelajar: {
    generate: (data: any) => apiClient.post("/admin/kartu-pelajar/generate", data),
    preview: (siswaId: string) => apiClient.get(`/admin/kartu-pelajar/preview/${siswaId}`),
    exportZip: (data: any) => apiClient.post("/admin/kartu-pelajar/export-zip", data, {
      responseType: "blob",
    }),
  },
  ujian: {
    status: () => apiClient.get("/admin/ujian/status"),
    updateStatus: (data: any) => apiClient.put("/admin/ujian/status", data),
    token: () => apiClient.get("/admin/ujian/token"),
    logAkses: () => apiClient.get("/admin/ujian/log-akses"),
  },
  dashboard: {
    stats: () => apiClient.get("/admin/dashboard/stats"),
    activity: () => apiClient.get("/admin/dashboard/activity"),
  },
};

export const guruApi = {
  ujian: {
    list: (params?: any) => apiClient.get("/guru/ujian", { params }),
    create: (data: any) => apiClient.post("/guru/ujian", data),
    update: (id: string, data: any) => apiClient.put(`/guru/ujian/${id}`, data),
    delete: (id: string) => apiClient.delete(`/guru/ujian/${id}`),
    addSoal: (id: string, data: any) => apiClient.post(`/guru/ujian/${id}/soal`, data),
    updateSoal: (id: string, soalId: string, data: any) =>
      apiClient.put(`/guru/ujian/${id}/soal/${soalId}`, data),
    deleteSoal: (id: string, soalId: string) => apiClient.delete(`/guru/ujian/${id}/soal/${soalId}`),
    hasil: (id: string) => apiClient.get(`/guru/ujian/${id}/hasil`),
    hasilSiswa: (id: string, siswaId: string) => apiClient.get(`/guru/ujian/${id}/hasil/${siswaId}`),
    nilaiSiswa: (id: string, siswaId: string, data: any) =>
      apiClient.put(`/guru/ujian/${id}/hasil/${siswaId}/nilai`, data),
  },
  raport: {
    list: () => apiClient.get("/guru/raport"),
    update: (id: string, data: any) => apiClient.put(`/guru/raport/${id}`, data),
    detail: (siswaId: string) => apiClient.get(`/guru/raport/${siswaId}`),
  },
  dashboard: {
    stats: () => apiClient.get("/guru/dashboard/stats"),
    aktivitas: () => apiClient.get("/guru/dashboard/aktivitas"),
  },
};

export const siswaApi = {
  ujian: {
    list: () => apiClient.get("/siswa/ujian"),
    detail: (id: string) => apiClient.get(`/siswa/ujian/${id}`),
    validasiToken: (data: any) => apiClient.post("/siswa/ujian/validasi-token", data),
    mulai: (id: string) => apiClient.post(`/siswa/ujian/${id}/mulai`),
    jawab: (id: string, data: any) => apiClient.post(`/siswa/ujian/${id}/jawab`, data),
    selesai: (id: string) => apiClient.post(`/siswa/ujian/${id}/selesai`),
    hasil: (id: string) => apiClient.get(`/siswa/ujian/${id}/hasil`),
  },
  raport: {
    list: () => apiClient.get("/siswa/raport"),
    detail: (id: string) => apiClient.get(`/siswa/raport/${id}`),
  },
  dashboard: {
    stats: () => apiClient.get("/siswa/dashboard/stats"),
    jadwal: () => apiClient.get("/siswa/dashboard/jadwal"),
  },
};

export const profileApi = {
  get: (nis: string) => apiClient.get(`/profile/${nis}`),
};

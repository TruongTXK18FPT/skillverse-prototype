import axiosInstance from './axiosInstance';

export interface MeowlSkinResponse {
  id: number;
  skinCode: string;
  name: string;
  nameVi: string;
  imageUrl: string;
  isPremium: boolean;
  price: number;
  isOwned: boolean;
}

export interface MeowlSkinRequest {
  skinCode: string;
  name: string;
  nameVi: string;
  isPremium: boolean;
  price: number;
}

export const skinService = {
  // Admin: Upload new skin
  uploadSkin: async (formData: FormData): Promise<MeowlSkinResponse> => {
    const response = await axiosInstance.post<MeowlSkinResponse>('/skins', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Admin: Update skin
  updateSkin: async (id: number, data: MeowlSkinRequest): Promise<MeowlSkinResponse> => {
    const response = await axiosInstance.put<MeowlSkinResponse>(`/skins/${id}`, data);
    return response.data;
  },

  // Admin: Delete skin
  deleteSkin: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/skins/${id}`);
  },

  // User: Purchase skin
  purchaseSkin: async (skinCode: string): Promise<string> => {
    const response = await axiosInstance.post<string>(`/skins/${skinCode}/purchase`);
    return response.data;
  },

  // Get all skins (with ownership status)
  getAllSkins: async (): Promise<MeowlSkinResponse[]> => {
    const response = await axiosInstance.get<MeowlSkinResponse[]>('/skins');
    return response.data;
  },

  // Get my skins
  getMySkins: async (): Promise<MeowlSkinResponse[]> => {
    const response = await axiosInstance.get<MeowlSkinResponse[]>('/skins/my-skins');
    return response.data;
  }
};

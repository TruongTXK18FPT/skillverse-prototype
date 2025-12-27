import axiosInstance from './axiosInstance';

export interface Slider {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  ctaText?: string;
  ctaLink?: string;
  createdAt: string;
  updatedAt: string;
}

class SliderService {
  private readonly BASE_URL = '/api';

  async getPublicSliders(): Promise<Slider[]> {
    const response = await axiosInstance.get<Slider[]>(`${this.BASE_URL}/public/sliders`);
    return response.data;
  }

  async getAllSlidersAdmin(): Promise<Slider[]> {
    const response = await axiosInstance.get<Slider[]>(`${this.BASE_URL}/admin/sliders`);
    return response.data;
  }

  async createSlider(formData: FormData): Promise<Slider> {
    const response = await axiosInstance.post<Slider>(`${this.BASE_URL}/admin/sliders`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateSlider(id: string, formData: FormData): Promise<Slider> {
    const response = await axiosInstance.put<Slider>(`${this.BASE_URL}/admin/sliders/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteSlider(id: string): Promise<void> {
    await axiosInstance.delete(`${this.BASE_URL}/admin/sliders/${id}`);
  }
}

const sliderService = new SliderService();
export default sliderService;

import axiosInstance from './axiosInstance';
import { Slider } from '../data/sliderDTOs';

class SliderService {
  private readonly BASE_URL = '/api';

  async getPublicSliders(isLogin: boolean = false): Promise<Slider[]> {
    const response = await axiosInstance.get<Slider[]>(`${this.BASE_URL}/public/sliders`, {
      params: { isLogin }
    });
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

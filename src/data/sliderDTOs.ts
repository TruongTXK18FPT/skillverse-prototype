export interface Slider {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  isLogin: boolean;
  ctaText?: string;
  ctaLink?: string;
  createdAt: string;
  updatedAt: string;
}

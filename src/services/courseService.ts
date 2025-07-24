export interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  image: string;
  level?: string;
  price?: string;
  rating?: number;
  students?: string | number;
  description?: string;
  duration?: string;
  modules?: number;
  certificate?: boolean;
}

export const fetchAllCourses = async (): Promise<Course[]> => {
  try {
    const response = await fetch('https://685174ec8612b47a2c0a2925.mockapi.io/Course');
    const data = await response.json();
    
    // Normalize and enhance course data
    return data.map((course: Course) => ({
      ...course,
      category: course.category?.trim().toLowerCase() || 'general',
      rating: course.rating ?? Math.random() * 2 + 3,
      students: course.students ?? Math.floor(Math.random() * 5000) + 100
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const findCourseById = async (id: string): Promise<Course | null> => {
  try {
    const courses = await fetchAllCourses();
    return courses.find(course => course.id === id) || null;
  } catch (error) {
    console.error('Error finding course by ID:', error);
    return null;
  }
};

export const parsePrice = (priceStr?: string): number => {
  if (!priceStr || 
      priceStr.toLowerCase().includes('miễn phí') || 
      priceStr.toLowerCase().includes('0 vnd') ||
      priceStr.trim() === '0') return 0;
  const numStr = priceStr.replace(/[^\d]/g, '');
  return parseInt(numStr) || 0;
};

export const isFreePrice = (priceStr?: string): boolean => {
  if (!priceStr) return true;
  const lowerPrice = priceStr.toLowerCase().trim();
  const freeFormats = ['miễn phí', '0 vnd', '0vnd', '0 vnđ', '0vnđ', 'free', 'gratis'];
  return freeFormats.some(format => lowerPrice.includes(format)) || 
         lowerPrice === '0' || 
         parsePrice(priceStr) === 0;
};

import { Roadmap } from '../components/roadmap';

export const learningRoadmapsData: Roadmap[] = [
  {
    id: 1,
    title: "Full Stack Web Development",
    category: "Programming",
    progress: 65,
    totalSteps: 8,
    completedSteps: 5,
    estimatedTime: "3 months",
    difficulty: "Intermediate",
    color: "#4F46E5",
    steps: [
      { id: 1, title: "HTML & CSS Fundamentals", completed: true, duration: "2 weeks" },
      { id: 2, title: "JavaScript ES6+", completed: true, duration: "3 weeks" },
      { id: 3, title: "React.js Basics", completed: true, duration: "4 weeks" },
      { id: 4, title: "Node.js & Express", completed: true, duration: "3 weeks" },
      { id: 5, title: "Database Design (MongoDB)", completed: true, duration: "2 weeks" },
      { id: 6, title: "REST API Development", completed: false, current: true, duration: "3 weeks" },
      { id: 7, title: "Authentication & Security", completed: false, duration: "2 weeks" },
      { id: 8, title: "Deployment & DevOps", completed: false, duration: "2 weeks" }
    ]
  },
  {
    id: 2,
    title: "Data Science & Machine Learning",
    category: "Data Science",
    progress: 35,
    totalSteps: 6,
    completedSteps: 2,
    estimatedTime: "4 months",
    difficulty: "Advanced",
    color: "#059669",
    steps: [
      { id: 1, title: "Python for Data Science", completed: true, duration: "3 weeks" },
      { id: 2, title: "Statistics & Probability", completed: true, duration: "4 weeks" },
      { id: 3, title: "Data Visualization", completed: false, current: true, duration: "3 weeks" },
      { id: 4, title: "Machine Learning Algorithms", completed: false, duration: "5 weeks" },
      { id: 5, title: "Deep Learning Basics", completed: false, duration: "4 weeks" },
      { id: 6, title: "MLOps & Model Deployment", completed: false, duration: "3 weeks" }
    ]
  },
  {
    id: 3,
    title: "Digital Marketing Mastery",
    category: "Marketing",
    progress: 80,
    totalSteps: 5,
    completedSteps: 4,
    estimatedTime: "2 months",
    difficulty: "Beginner",
    color: "#DC2626",
    steps: [
      { id: 1, title: "Digital Marketing Fundamentals", completed: true, duration: "1 week" },
      { id: 2, title: "SEO & Content Marketing", completed: true, duration: "3 weeks" },
      { id: 3, title: "Social Media Marketing", completed: true, duration: "2 weeks" },
      { id: 4, title: "Paid Advertising (Google Ads)", completed: true, duration: "3 weeks" },
      { id: 5, title: "Analytics & Performance Tracking", completed: false, current: true, duration: "2 weeks" }
    ]
  },
  {
    id: 4,
    title: "Mobile App Development",
    category: "Programming",
    progress: 20,
    totalSteps: 7,
    completedSteps: 1,
    estimatedTime: "5 months",
    difficulty: "Intermediate",
    color: "#7C3AED",
    steps: [
      { id: 1, title: "Mobile Development Fundamentals", completed: true, duration: "2 weeks" },
      { id: 2, title: "React Native Basics", completed: false, current: true, duration: "4 weeks" },
      { id: 3, title: "State Management", completed: false, duration: "3 weeks" },
      { id: 4, title: "Navigation & Routing", completed: false, duration: "2 weeks" },
      { id: 5, title: "Native Device Features", completed: false, duration: "4 weeks" },
      { id: 6, title: "App Store Deployment", completed: false, duration: "2 weeks" },
      { id: 7, title: "Performance Optimization", completed: false, duration: "3 weeks" }
    ]
  },
  {
    id: 5,
    title: "Cloud Computing & DevOps",
    category: "Infrastructure",
    progress: 45,
    totalSteps: 6,
    completedSteps: 3,
    estimatedTime: "4 months",
    difficulty: "Advanced",
    color: "#F59E0B",
    steps: [
      { id: 1, title: "Cloud Computing Fundamentals", completed: true, duration: "2 weeks" },
      { id: 2, title: "AWS/Azure Core Services", completed: true, duration: "4 weeks" },
      { id: 3, title: "Docker & Containerization", completed: true, duration: "3 weeks" },
      { id: 4, title: "Kubernetes Orchestration", completed: false, current: true, duration: "4 weeks" },
      { id: 5, title: "CI/CD Pipelines", completed: false, duration: "3 weeks" },
      { id: 6, title: "Monitoring & Logging", completed: false, duration: "2 weeks" }
    ]
  },
  {
    id: 6,
    title: "UI/UX Design Mastery",
    category: "Design",
    progress: 90,
    totalSteps: 5,
    completedSteps: 4,
    estimatedTime: "3 months",
    difficulty: "Beginner",
    color: "#EF4444",
    steps: [
      { id: 1, title: "Design Principles", completed: true, duration: "2 weeks" },
      { id: 2, title: "User Research & Personas", completed: true, duration: "3 weeks" },
      { id: 3, title: "Wireframing & Prototyping", completed: true, duration: "3 weeks" },
      { id: 4, title: "Visual Design & Branding", completed: true, duration: "4 weeks" },
      { id: 5, title: "Usability Testing", completed: false, current: true, duration: "2 weeks" }
    ]
  }
];

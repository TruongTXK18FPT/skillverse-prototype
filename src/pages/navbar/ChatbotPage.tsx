import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, Brain, Target, Briefcase, Book, Award, Star, ArrowRight,
  BookOpen, Globe, DollarSign, ChevronRight, Clock,
  Lightbulb, Zap,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/ChatbotPage.css';

// Add React JSX types
import type { ReactElement } from 'react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface CourseRecommendation {
  type: 'course';
  title: string;
  provider: string;
  duration: string;
  rating: number;
  students: number;
  price: string;
  image: string;
}

interface JobRecommendation {
  type: 'job';
  title: string;
  company: string;
  location: string;
  salary: string;
  posted: string;
  image: string;
}

interface SkillRecommendation {
  type: 'skill';
  title: string;
  category: string;
  difficulty: string;
  timeToLearn: string;
  demand: string;
  image: string;
}

type Recommendation = CourseRecommendation | JobRecommendation | SkillRecommendation;

interface AIResponse {
  text: string;
  recommendations?: {
    title: string;
    items: string[];
  }[];
  resources?: {
    title: string;
    link: string;
    description: string;
  }[];
  nextSteps?: string[];
}

interface AIResponseCategory {
  [key: string]: AIResponse;
}

interface AIResponseDatabase {
  [key: string]: AIResponseCategory;
}

const ChatbotPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Xin chào! Tôi là trợ lý AI của SkillVerse. Tôi có thể giúp bạn:',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { translations } = useLanguage();

  const promptCategories = [
    {
      title: translations.chatbot.features.careerPlanning,
      icon: Briefcase,
      color: 'blue',
      prompts: [
        translations.chatbot.quickPrompts.career,
        "How do I transition from traditional IT to AI/ML?",
        "What skills are most in-demand for remote work?",
        "Should I focus on specialization or stay full-stack?",
        "How to build a career roadmap for the next 5 years?"
      ]
    },
    {
      title: translations.chatbot.features.skillDevelopment,
      icon: BookOpen,
      color: 'green',
      prompts: [
        translations.chatbot.quickPrompts.skills,
        "How to balance learning technical and soft skills?",
        "What's the best way to learn cloud computing?",
        "Recommend a learning path for UI/UX design",
        "Essential skills for a data scientist role"
      ]
    },
    {
      title: translations.chatbot.features.courseRecommendation,
      icon: Target,
      color: 'purple',
      prompts: [
        translations.chatbot.quickPrompts.resources,
        "Tips for building a strong portfolio",
        "What should I include in my developer resume?",
        "How to negotiate salary for tech positions?",
        "Best practices for remote job applications"
      ]
    },
    {
      title: translations.chatbot.features.jobMarketInsights,
      icon: Globe,
      color: 'orange',
      prompts: [
        translations.chatbot.quickPrompts.jobs,
        "Future of AI and machine learning jobs",
        "Growing industries for tech professionals",
        "Impact of blockchain on job market",
        "Emerging roles in cybersecurity"
      ]
    }
  ];

  const quickPrompts = [
    translations.chatbot.quickPrompts.career,
    translations.chatbot.quickPrompts.resources,
    translations.chatbot.quickPrompts.skills,
    translations.chatbot.quickPrompts.plan,
    translations.chatbot.quickPrompts.jobs
  ];

  // AI Response Templates
  const aiResponses: AIResponseDatabase = {
    careerPlanning: {
      [translations.chatbot.quickPrompts.career]: {
        text: translations.chatbot.responses.careerPath,
        recommendations: [
          {
            title: "High-Growth Fields",
            items: [
              "AI/ML Engineers (40% YoY growth, avg. salary $150K)",
              "Cloud Solutions Architects (35% growth, avg. salary $140K)",
              "DevOps/Platform Engineers (30% growth, avg. salary $130K)",
              "Cybersecurity Specialists (25% growth, avg. salary $125K)",
              "Data Scientists (20% growth, avg. salary $135K)"
            ]
          },
          {
            title: "Emerging Roles",
            items: [
              "Web3/Blockchain Developers - Growing demand in DeFi and NFT spaces",
              "AR/VR Experience Designers - Key for metaverse development",
              "Edge Computing Engineers - Critical for IoT and 5G",
              "AI Ethics Officers - Essential for responsible AI deployment",
              "Digital Transformation Consultants - High demand across industries"
            ]
          }
        ],
        resources: [
          {
            title: "2024 Tech Career Report",
            link: "/resources/tech-careers-2024",
            description: "Comprehensive analysis of tech career trends, salaries, and growth projections"
          },
          {
            title: "Industry Skills Map",
            link: "/resources/skills-map",
            description: "Interactive tool to explore required skills for each career path"
          }
        ],
        nextSteps: [
          "Take our career assessment test to find your best fit",
          "Explore detailed learning paths for each role",
          "Join relevant tech communities and networks",
          "Book a session with a career counselor"
        ]
      }
    },
    skillDevelopment: {
      [translations.chatbot.quickPrompts.skills]: {
        text: translations.chatbot.responses.programming,
        recommendations: [
          {
            title: "Essential Programming Languages",
            items: [
              "Python - Versatile, beginner-friendly, high demand",
              "JavaScript - Web development essential, huge ecosystem",
              "SQL - Database fundamentals, always in demand",
              "TypeScript - Type-safe JavaScript development",
              "Go - Modern backend development, high performance"
            ]
          },
          {
            title: "Learning Resources",
            items: [
              "Interactive coding platforms (Codecademy, freeCodeCamp)",
              "Video courses (Udemy, Coursera, PluralSight)",
              "Documentation and tutorials (MDN, Python.org)",
              "Practice platforms (LeetCode, HackerRank)",
              "Community forums (Stack Overflow, Dev.to)"
            ]
          }
        ],
        resources: [
          {
            title: "Programming Fundamentals",
            link: "/courses/programming-basics",
            description: "Master the basics of programming with hands-on practice"
          },
          {
            title: "Web Development Path",
            link: "/paths/web-development",
            description: "Complete roadmap from beginner to professional web developer"
          }
        ],
        nextSteps: [
          "Choose your first programming language",
          "Set up your development environment",
          "Complete the beginner tutorials",
          "Build your first project"
        ]
      }
    },
    learningPath: {
      [translations.chatbot.quickPrompts.plan]: {
        text: translations.chatbot.responses.learning,
        recommendations: [
          {
            title: "Foundation Phase",
            items: [
              "Programming basics (variables, loops, functions)",
              "Data structures and algorithms",
              "Version control with Git",
              "Command line and terminal usage",
              "Basic computer science concepts"
            ]
          },
          {
            title: "Specialization Phase",
            items: [
              "Choose frontend or backend focus",
              "Learn relevant frameworks",
              "Master development tools",
              "Practice with real projects",
              "Build portfolio pieces"
            ]
          }
        ],
        resources: [
          {
            title: "Learning Path Generator",
            link: "/tools/path-generator",
            description: "Create a personalized learning path based on your goals"
          },
          {
            title: "Project Ideas",
            link: "/resources/project-ideas",
            description: "Collection of projects to build your portfolio"
          }
        ],
        nextSteps: [
          "Complete the skills assessment",
          "Set your learning goals",
          "Create a study schedule",
          "Join study groups"
        ]
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('xin chào') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Xin chào! Tôi có thể giúp gì cho bạn?';
    }
    
    if (lowerMessage.includes('lập trình web')) {
      return 'Để bắt đầu với lập trình web, bạn nên học theo thứ tự: HTML, CSS, JavaScript cơ bản. Sau đó có thể học thêm React hoặc Vue.js. SkillVerse có các khóa học từng bước phù hợp với bạn.';
    }
    
    if (lowerMessage.includes('frontend')) {
      return 'Một Frontend Developer cần có các kỹ năng: HTML, CSS, JavaScript, React/Vue/Angular, Responsive Design, Version Control (Git), và hiểu biết về UI/UX. Bạn có thể xem lộ trình học Frontend đầy đủ trên SkillVerse.';
    }
    
    if (lowerMessage.includes('react hooks')) {
      return 'React Hooks là tính năng cho phép bạn sử dụng state và các tính năng khác của React mà không cần viết class component. Các hooks phổ biến nhất là useState và useEffect. Bạn muốn tìm hiểu thêm về hook cụ thể nào?';
    }
    
    if (lowerMessage.includes('python')) {
      return 'Khóa học "Python cho Người Mới Bắt Đầu" của chúng tôi là lựa chọn tốt nhất để bắt đầu. Khóa học bao gồm các bài tập thực hành và dự án thực tế. Bạn có muốn xem thông tin chi tiết về khóa học không?';
    }
    
    if (lowerMessage.includes('khóa học')) {
      return 'SkillVerse có nhiều khóa học đa dạng về lập trình, thiết kế, marketing số và nhiều lĩnh vực khác. Bạn quan tâm đến lĩnh vực nào? Tôi có thể giới thiệu khóa học phù hợp.';
    }
    
    if (lowerMessage.includes('tư vấn')) {
      return 'Tôi có thể tư vấn về lộ trình học tập, định hướng nghề nghiệp và các khóa học phù hợp. Bạn đang quan tâm đến lĩnh vực nào?';
    }
    
    return 'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể diễn đạt lại hoặc chọn một trong các gợi ý phía trên để tôi có thể giúp bạn tốt hơn.';
  };

  const handleSuggestionClick = (example: string) => {
    setInputMessage(example);
  };

  const features = [
    {
      icon: Brain,
      title: 'Personalized Learning Path',
      description: 'Get customized course recommendations based on your goals and current skills',
      color: 'blue'
    },
    {
      icon: Target,
      title: 'Career Planning',
      description: 'Discover career opportunities and required skills for your dream job',
      color: 'green'
    },
    {
      icon: Briefcase,
      title: 'Job Market Insights',
      description: 'Stay updated with industry trends and in-demand skills',
      color: 'purple'
    },
    {
      icon: Book,
      title: 'Course Recommendations',
      description: 'Find the best courses to achieve your career goals',
      color: 'orange'
    }
  ];

  const recommendations: Recommendation[] = [
    {
      type: 'course' as const,
      title: 'React.js Advanced',
      provider: 'Skillverse',
      duration: '8 hours',
      rating: 4.8,
      students: 1234,
      price: 'Free',
      image: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      type: 'job' as const,
      title: 'Frontend Developer',
      company: 'Tech Corp',
      location: 'Remote',
      salary: '$50-70k/year',
      posted: '2 days ago',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      type: 'skill' as const,
      title: 'TypeScript',
      category: 'Programming',
      difficulty: 'Intermediate',
      timeToLearn: '4-6 weeks',
      demand: 'High',
      image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  return (
    <div className="sv-chatbot-container">
      <div className="sv-chatbot-content">
        {/* Header */}
        <div className="sv-chatbot-header">
          <h1 className="sv-chatbot-header__title">{translations.chatbot.title}</h1>
          <p className="sv-chatbot-header__description">
            {translations.chatbot.description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="sv-features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`sv-feature-card sv-feature-card--${feature.color}`}>
              <feature.icon className="sv-feature-card__icon" />
              <h3 className="sv-feature-card__title">{feature.title}</h3>
              <p className="sv-feature-card__description">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="sv-quick-prompts">
          <div className="sv-quick-prompts__title">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span>Quick Start</span>
          </div>
          <div className="sv-quick-prompts__grid">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                className="sv-quick-prompt-btn"
                onClick={() => handleSuggestionClick(prompt)}
              >
                {index === 0 && <Brain className="h-4 w-4" />}
                {index === 1 && <Book className="h-4 w-4" />}
                {index === 2 && <Target className="h-4 w-4" />}
                {index === 3 && <Clock className="h-4 w-4" />}
                {index === 4 && <Briefcase className="h-4 w-4" />}
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="sv-chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`sv-chat-message ${
                msg.type === 'bot' ? 'sv-chat-message--bot' : 'sv-chat-message--user'
              }`}
            >
              <div className="sv-chat-message__avatar">
                {msg.type === 'bot' ? (
                  <Bot className="text-blue-500" />
                ) : (
                  <User className="text-purple-500" />
                )}
              </div>
              <div className="sv-chat-message__content">
                <div className="sv-chat-message__text">
                  {msg.content}
                </div>
                <span className="sv-chat-message__time">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="sv-chat-message sv-chat-message--bot sv-chat-message--loading">
              <div className="sv-chat-message__avatar">
                <Bot className="text-blue-500" />
              </div>
              <div className="sv-chat-message__content">
                <div className="sv-chat-message__text">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="sv-chat-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={translations.chatbot.askPlaceholder}
            className="sv-chat-input__field"
          />
          <button type="submit" className="sv-chat-input__button">
            <Send className="h-5 w-5" />
          </button>
        </form>

        {/* Prompt Categories */}
        <div className="sv-prompt-categories">
          {promptCategories.map((category, index) => (
            <div key={index} className={`sv-prompt-category sv-prompt-category--${category.color}`}>
              <div className="sv-prompt-category__header">
                <category.icon className="sv-prompt-category__icon" />
                <h3 className="sv-prompt-category__title">{category.title}</h3>
              </div>
              <div className="sv-prompt-category__prompts">
                {category.prompts.map((prompt, promptIndex) => (
                  <button
                    key={promptIndex}
                    className="sv-prompt-btn"
                    onClick={() => handleSuggestionClick(prompt)}
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="sv-recommendations">
          <div className="sv-recommendations__header">
            <h2 className="sv-recommendations__title">Personalized Recommendations</h2>
            <p className="sv-recommendations__description">Based on your profile and interests</p>
          </div>

          <div className="sv-recommendations__grid">
            {recommendations.map((item, index) => {
              const isCourseRecommendation = (rec: Recommendation): rec is CourseRecommendation => rec.type === 'course';
              const isJobRecommendation = (rec: Recommendation): rec is JobRecommendation => rec.type === 'job';
              const isSkillRecommendation = (rec: Recommendation): rec is SkillRecommendation => rec.type === 'skill';

              return (
                <div key={index} className="sv-recommendation-card">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="sv-recommendation-card__image"
                  />
                  <div className="sv-recommendation-card__content">
                    <div className="sv-recommendation-card__badge">
                      {isCourseRecommendation(item) && <Book />}
                      {isJobRecommendation(item) && <Briefcase />}
                      {isSkillRecommendation(item) && <Award />}
                      <span>{item.type}</span>
                    </div>
                    <h3 className="sv-recommendation-card__title">{item.title}</h3>
                    {isCourseRecommendation(item) && (
                      <>
                        <p className="sv-recommendation-card__provider">{item.provider}</p>
                        <div className="sv-recommendation-card__meta">
                          <span>{item.duration}</span>
                          <span>•</span>
                          <div className="sv-recommendation-card__rating">
                            <Star />
                            <span>{item.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{item.students.toLocaleString()} students</span>
                        </div>
                        <div className="sv-recommendation-card__footer">
                          <span className="sv-recommendation-card__price">{item.price}</span>
                          <button className="sv-recommendation-card__button">
                            <span>View Course</span>
                            <ArrowRight />
                          </button>
                        </div>
                      </>
                    )}
                    {isJobRecommendation(item) && (
                      <>
                        <p className="sv-recommendation-card__company">{item.company}</p>
                        <div className="sv-recommendation-card__meta">
                          <span>{item.location}</span>
                          <span>•</span>
                          <span>{item.salary}</span>
                        </div>
                        <div className="sv-recommendation-card__footer">
                          <span className="sv-recommendation-card__posted">{item.posted}</span>
                          <button className="sv-recommendation-card__button">
                            <span>View Job</span>
                            <ArrowRight />
                          </button>
                        </div>
                      </>
                    )}
                    {isSkillRecommendation(item) && (
                      <>
                        <p className="sv-recommendation-card__category">{item.category}</p>
                        <div className="sv-recommendation-card__meta">
                          <span>{item.difficulty}</span>
                          <span>•</span>
                          <span>{item.timeToLearn}</span>
                          <span>•</span>
                          <span>{item.demand} demand</span>
                        </div>
                        <div className="sv-recommendation-card__footer">
                          <button className="sv-recommendation-card__button">
                            <span>Learn More</span>
                            <ArrowRight />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
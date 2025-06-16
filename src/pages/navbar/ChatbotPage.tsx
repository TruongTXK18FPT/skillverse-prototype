import React, { useState } from 'react';
import { 
  Send, Bot, User, Sparkles, Brain, Target, Briefcase, Book, Award, Star, ArrowRight,
  BookOpen, Globe, DollarSign, ChevronRight, Clock, CheckCircle, TrendingUp, Code,
  Lightbulb, Zap, Users, FileText, MessageCircle, Coffee
} from 'lucide-react';
import '../../styles/ChatbotPage.css';

interface ChatMessage {
  type: 'bot' | 'user';
  content: string | JSX.Element;
  timestamp: string;
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
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      type: 'bot',
      content: "Hi! I'm your AI Career Advisor. I can help you with career guidance, skill recommendations, and learning paths. What would you like to know?",
      timestamp: new Date().toISOString()
    }
  ]);

  const promptCategories = [
    {
      title: 'Career Planning',
      icon: Briefcase,
      color: 'blue',
      prompts: [
        "What career paths are trending in technology?",
        "How do I transition from traditional IT to AI/ML?",
        "What skills are most in-demand for remote work?",
        "Should I focus on specialization or stay full-stack?",
        "How to build a career roadmap for the next 5 years?"
      ]
    },
    {
      title: 'Skill Development',
      icon: BookOpen,
      color: 'green',
      prompts: [
        "Which programming languages should I learn first?",
        "How to balance learning technical and soft skills?",
        "What's the best way to learn cloud computing?",
        "Recommend a learning path for UI/UX design",
        "Essential skills for a data scientist role"
      ]
    },
    {
      title: 'Job Search',
      icon: Target,
      color: 'purple',
      prompts: [
        "How to prepare for technical interviews?",
        "Tips for building a strong portfolio",
        "What should I include in my developer resume?",
        "How to negotiate salary for tech positions?",
        "Best practices for remote job applications"
      ]
    },
    {
      title: 'Industry Insights',
      icon: Globe,
      color: 'orange',
      prompts: [
        "Current trends in web development",
        "Future of AI and machine learning jobs",
        "Growing industries for tech professionals",
        "Impact of blockchain on job market",
        "Emerging roles in cybersecurity"
      ]
    },
    {
      title: 'Personal Growth',
      icon: User,
      color: 'pink',
      prompts: [
        "How to improve problem-solving skills?",
        "Tips for work-life balance in tech",
        "Building professional relationships remotely",
        "Dealing with imposter syndrome",
        "Time management for continuous learning"
      ]
    },
    {
      title: 'Freelancing & Side Projects',
      icon: DollarSign,
      color: 'teal',
      prompts: [
        "How to start freelancing in tech?",
        "Building a personal brand as a developer",
        "Choosing the right side projects",
        "Setting freelance rates for beginners",
        "Managing multiple client projects"
      ]
    }
  ];

  const quickPrompts = [
    "Help me choose a tech career",
    "Recommend learning resources",
    "Review my skill gaps",
    "Create a study plan",
    "Find job opportunities"
  ];

  // AI Response Templates
  const aiResponses: AIResponseDatabase = {
    careerPlanning: {
      "What career paths are trending in technology?": {
        text: "Based on current market trends and industry data, here are the most promising career paths in technology for 2024 and beyond:",
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
          },
          {
            title: "Salary Calculator",
            link: "/resources/salary-calculator",
            description: "Compare salaries across roles, locations, and experience levels"
          }
        ],
        nextSteps: [
          "Take our career assessment test to find your best fit",
          "Explore detailed learning paths for each role",
          "Join relevant tech communities and networks",
          "Book a session with a career counselor"
        ]
      },
      "How do I transition from traditional IT to AI/ML?": {
        text: "Transitioning to AI/ML is an excellent career move. Here's a structured path to help you make this transition successfully:",
        recommendations: [
          {
            title: "Essential Skills to Develop",
            items: [
              "Python Programming (Advanced) - Focus on NumPy, Pandas",
              "Mathematics & Statistics - Linear Algebra, Calculus, Probability",
              "Machine Learning Fundamentals - Algorithms, Models, Evaluation",
              "Deep Learning - Neural Networks, TensorFlow/PyTorch",
              "MLOps - Model Deployment, Monitoring, Scaling"
            ]
          },
          {
            title: "Learning Path",
            items: [
              "Month 1-2: Python & Data Science Fundamentals",
              "Month 3-4: Mathematics & Statistics for ML",
              "Month 5-6: Machine Learning Algorithms",
              "Month 7-8: Deep Learning & Neural Networks",
              "Month 9-10: Practical Projects & Portfolio Building"
            ]
          }
        ],
        resources: [
          {
            title: "AI/ML Transition Course",
            link: "/courses/ai-ml-transition",
            description: "Comprehensive course designed for IT professionals"
          },
          {
            title: "Mathematics for ML",
            link: "/courses/math-ml",
            description: "Essential math concepts explained for practitioners"
          },
          {
            title: "Hands-on Projects",
            link: "/resources/ai-projects",
            description: "Real-world projects to build your portfolio"
          }
        ],
        nextSteps: [
          "Start with our Python for Data Science course",
          "Join AI/ML study groups and communities",
          "Build 3 practical ML projects for your portfolio",
          "Participate in Kaggle competitions"
        ]
      }
    },
    skillDevelopment: {
      "Which programming languages should I learn first?": {
        text: "The best programming languages to learn depend on your career goals. Here's a strategic approach based on different career paths:",
        recommendations: [
          {
            title: "Web Development Path",
            items: [
              "HTML/CSS - Foundation of web development (2-4 weeks)",
              "JavaScript - Essential for interactive websites (2-3 months)",
              "TypeScript - Type-safe JavaScript development (1 month)",
              "React/Vue.js - Modern frontend frameworks (2-3 months)",
              "Node.js - Backend JavaScript runtime (2 months)"
            ]
          },
          {
            title: "Data Science Path",
            items: [
              "Python - Primary language for data science (3 months)",
              "SQL - Database querying and management (1 month)",
              "R - Statistical computing and graphics (2 months)",
              "Julia - High-performance numerical analysis (optional)",
              "Scala - Big data processing with Spark (optional)"
            ]
          }
        ],
        resources: [
          {
            title: "Web Development Bootcamp",
            link: "/courses/web-dev-bootcamp",
            description: "Complete modern web development curriculum"
          },
          {
            title: "Interactive Tutorials",
            link: "/resources/coding-tutorials",
            description: "Hands-on coding practice with instant feedback"
          },
          {
            title: "Project Ideas",
            link: "/resources/beginner-projects",
            description: "Portfolio-worthy projects for beginners"
          }
        ],
        nextSteps: [
          "Choose your learning path (Web/Data/Mobile)",
          "Set up your development environment",
          "Complete the beginner-friendly tutorials",
          "Start building your first project"
        ]
      }
    },
    jobSearch: {
      "How to prepare for technical interviews?": {
        text: "Technical interviews require both technical knowledge and soft skills. Here's a comprehensive preparation guide:",
        recommendations: [
          {
            title: "Technical Preparation",
            items: [
              "Data Structures & Algorithms - Focus on problem-solving",
              "System Design - Scalability, reliability, performance",
              "Coding Challenges - Practice on LeetCode/HackerRank",
              "Design Patterns - Common solutions to recurring problems",
              "Time Complexity Analysis - Optimize your solutions"
            ]
          },
          {
            title: "Behavioral Preparation",
            items: [
              "STAR Method - Structure your experience stories",
              "Project Deep Dives - Explain technical decisions",
              "Collaboration Examples - Team and conflict resolution",
              "Leadership Stories - Initiative and impact",
              "Cultural Fit - Research company values"
            ]
          }
        ],
        resources: [
          {
            title: "Interview Prep Course",
            link: "/courses/tech-interview",
            description: "Comprehensive interview preparation with mock interviews"
          },
          {
            title: "Coding Problems",
            link: "/resources/interview-questions",
            description: "Curated list of most common interview questions"
          },
          {
            title: "System Design Guide",
            link: "/resources/system-design",
            description: "Step-by-step approach to system design interviews"
          }
        ],
        nextSteps: [
          "Create a 12-week interview prep schedule",
          "Practice coding problems daily (1-2 hours)",
          "Join mock interview sessions weekly",
          "Review and document your projects"
        ]
      }
    }
  };

  const handlePromptClick = (prompt: string) => {
    const userMessage: ChatMessage = {
      type: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Find matching response
    let response: AIResponse | undefined;
    Object.values(aiResponses).forEach(category => {
      if (category[prompt]) {
        response = category[prompt];
      }
    });

    // Simulate bot thinking
    setTimeout(() => {
      setIsTyping(false);
      
      const botMessage: ChatMessage = {
        type: 'bot',
        content: response ? formatAIResponse(response) : (
          <div className="sv-response-content">
            <p className="sv-response-text">
              I understand you're interested in {prompt.toLowerCase()}. Let me help you with that.
            </p>
            <div className="sv-response-section">
              <div className="sv-response-section__title">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Quick Suggestions</span>
              </div>
              <div className="sv-tags">
                <span className="sv-tag sv-tag--tech">Learn fundamentals</span>
                <span className="sv-tag sv-tag--soft">Practice regularly</span>
                <span className="sv-tag sv-tag--tool">Use modern tools</span>
              </div>
            </div>
          </div>
        ),
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, botMessage]);
    }, 1500);
  };

  const formatAIResponse = (response: AIResponse): JSX.Element => {
    return (
      <div className="sv-response-content">
        <p className="sv-response-text">{response.text}</p>

        {response.recommendations && (
          <div className="sv-response-section">
            {response.recommendations.map((rec, index) => (
              <div key={index} className="mb-6">
                <div className="sv-response-section__title">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span>{rec.title}</span>
                </div>
                <div className="sv-response-list">
                  {rec.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="sv-response-item">
                      <ChevronRight className="sv-response-item__bullet" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {response.resources && (
          <div className="sv-response-section">
            <div className="sv-response-section__title">
              <Book className="w-5 h-5 text-blue-500" />
              <span>Helpful Resources</span>
            </div>
            <div className="sv-resource-grid">
              {response.resources.map((resource, index) => (
                <div key={index} className="sv-resource-card">
                  <h4 className="sv-resource-card__title">{resource.title}</h4>
                  <p className="sv-resource-card__description">{resource.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {response.nextSteps && (
          <div className="sv-response-section">
            <div className="sv-response-section__title">
              <Target className="w-5 h-5 text-green-500" />
              <span>Next Steps</span>
            </div>
            <div className="sv-next-steps">
              {response.nextSteps.map((step, index) => (
                <button key={index} className="sv-next-step">
                  <ArrowRight className="sv-next-step__icon" />
                  <span>{step}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Add bot response
    const botMessage: ChatMessage = {
      type: 'bot',
      content: "I understand you're interested in web development. Based on your profile and goals, I recommend starting with React.js. Here are some personalized recommendations for you:",
      timestamp: new Date().toISOString()
    };

    setChatHistory([...chatHistory, userMessage, botMessage]);
    setMessage('');
  };

  return (
    <div className="sv-chatbot-container">
      <div className="sv-chatbot-content">
        {/* Header */}
        <div className="sv-chatbot-header">
          <h1 className="sv-chatbot-header__title">AI Career Advisor</h1>
          <p className="sv-chatbot-header__description">
            Get personalized career guidance and skill recommendations from our AI advisor
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

        {/* Quick Prompts with Icons */}
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
                onClick={() => handlePromptClick(prompt)}
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

        {/* Chat Messages with Enhanced Styling */}
        <div className="sv-chat-messages">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
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
                  {typeof msg.content === 'string' ? msg.content : msg.content}
                </div>
                <span className="sv-chat-message__time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
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
          </div>

        {/* Enhanced Input Area */}
        <form onSubmit={handleSubmit} className="sv-chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about career paths, skills, or courses..."
            className="sv-chat-input__field"
          />
          <button type="submit" className="sv-chat-input__button">
            <Send className="h-5 w-5" />
          </button>
        </form>

        {/* Prompt Categories with Visual Enhancements */}
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
                    onClick={() => handlePromptClick(prompt)}
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
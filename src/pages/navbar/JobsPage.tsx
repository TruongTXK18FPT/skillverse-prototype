import React, { useState } from 'react';
import { Search, MapPin, Clock, DollarSign, Briefcase, Star, Filter, ArrowRight } from 'lucide-react';
import '../../styles/JobsPage.css';

const JobsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', count: 89 },
    { id: 'data-entry', name: 'Data Entry', count: 23 },
    { id: 'design', name: 'Design', count: 18 },
    { id: 'writing', name: 'Writing', count: 15 },
    { id: 'research', name: 'Research', count: 12 },
    { id: 'translation', name: 'Translation', count: 11 },
    { id: 'social-media', name: 'Social Media', count: 10 }
  ];

  const jobs = [
    {
      id: 1,
      title: 'Logo Design for Startup',
      company: 'TechViet Solutions',
      category: 'design',
      budget: '$50 - $100',
      duration: '3-5 days',
      location: 'Remote',
      postedTime: '2 hours ago',
      description: 'Need a professional logo design for a tech startup. Looking for creative, modern design suitable for fintech industry.',
      skills: ['Adobe Illustrator', 'Logo Design', 'Brand Identity'],
      urgency: 'high',
      proposals: 12,
      rating: 4.8,
      verified: true
    },
    {
      id: 2,
      title: 'Excel Data Entry from PDF',
      company: 'Green Energy Corp',
      category: 'data-entry',
      budget: '$20 - $30',
      duration: '1-2 days',
      location: 'Remote',
      postedTime: '4 hours ago',
      description: 'Need to input data from 50 PDF files into Excel. Data includes customer information and order details.',
      skills: ['Excel', 'Data Entry', 'Attention to Detail'],
      urgency: 'medium',
      proposals: 8,
      rating: 4.6,
      verified: true
    },
    {
      id: 3,
      title: 'Marketing Blog Content Writing',
      company: 'Digital Marketing Hub',
      category: 'writing',
      budget: '$80 - $120',
      duration: '1 week',
      location: 'Remote',
      postedTime: '6 hours ago',
      description: 'Write 5 blog posts about digital marketing, each 1000-1500 words. Must be SEO-friendly and have marketing experience.',
      skills: ['Content Writing', 'SEO', 'Digital Marketing'],
      urgency: 'low',
      proposals: 15,
      rating: 4.9,
      verified: true
    },
    {
      id: 4,
      title: 'E-commerce Market Research',
      company: 'Online Retail Pro',
      category: 'research',
      budget: '$150 - $200',
      duration: '2 weeks',
      location: 'Remote',
      postedTime: '1 day ago',
      description: 'Analyze e-commerce market trends, competitive analysis, and consumer behavior research.',
      skills: ['Market Research', 'Data Analysis', 'Excel'],
      urgency: 'medium',
      proposals: 6,
      rating: 4.7,
      verified: false
    },
    {
      id: 5,
      title: 'English-Vietnamese Translation',
      company: 'Global Translate',
      category: 'translation',
      budget: '$30 - $50',
      duration: '3 days',
      location: 'Remote',
      postedTime: '1 day ago',
      description: 'Translate technical documentation from English to Vietnamese, approximately 20 A4 pages.',
      skills: ['English Translation', 'Technical Writing', 'Vietnamese'],
      urgency: 'high',
      proposals: 20,
      rating: 4.5,
      verified: true
    },
    {
      id: 6,
      title: 'Facebook Page Management',
      company: 'Fashion Brand X',
      category: 'social-media',
      budget: '$200 - $300',
      duration: '1 month',
      location: 'Remote',
      postedTime: '2 days ago',
      description: 'Manage Facebook page, create content, engage with customers, and run basic ads.',
      skills: ['Facebook Marketing', 'Content Creation', 'Social Media'],
      urgency: 'low',
      proposals: 25,
      rating: 4.4,
      verified: true
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Urgent';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Normal';
    }
  };

  return (
    <div className="sv-jobs-container">
      <div className="sv-jobs-content">
        {/* Header */}
        <div className="sv-jobs-header">
          <h1 className="sv-jobs-header__title">Micro Jobs</h1>
          <p className="sv-jobs-header__description">
            Find short-term projects that match your skills and start earning today
          </p>
        </div>

        {/* Search and Filter */}
        <div className="sv-jobs-search">
          <div className="sv-jobs-search__form">
            <div className="sv-jobs-search__input-wrapper">
              <Search className="sv-jobs-search__icon" />
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sv-jobs-search__input"
              />
            </div>
            <button className="sv-jobs-search__filter-btn">
              <Filter />
              <span>Advanced Filters</span>
            </button>
          </div>
        </div>

        <div className="sv-jobs-main">
          {/* Sidebar Categories */}
          <div className="sv-jobs-sidebar">
            <div className="sv-jobs-categories">
              <h3 className="sv-jobs-categories__title">Job Categories</h3>
              <div className="sv-jobs-categories__list">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`sv-jobs-category-btn ${
                      selectedCategory === category.id ? 'sv-jobs-category-btn--active' : ''
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="sv-jobs-category-btn__count">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="sv-jobs-list">
            {filteredJobs.map((job) => (
              <div key={job.id} className="sv-job-card">
                <div className="sv-job-card__header">
                  <div>
                    <h3 className="sv-job-card__title">{job.title}</h3>
                    <p className="sv-job-card__company">{job.company}</p>
                  </div>
                  <div className="sv-job-card__meta">
                    <div className="sv-job-card__meta-item">
                      <MapPin />
                      <span>{job.location}</span>
                    </div>
                    <div className="sv-job-card__meta-item">
                      <Clock />
                      <span>{job.duration}</span>
                    </div>
                    <div className="sv-job-card__meta-item">
                      <DollarSign />
                      <span>{job.budget}</span>
                    </div>
                  </div>
                </div>

                <p className="sv-job-card__description">{job.description}</p>

                <div className="sv-job-card__tags">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="sv-job-card__tag">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="sv-job-card__footer">
                  <div className="sv-job-card__stats">
                    <div className="sv-job-card__meta-item">
                      <Briefcase />
                      <span>{job.proposals} proposals</span>
                    </div>
                    <div className="sv-job-card__meta-item">
                      <Star className="fill-current" />
                      <span>{job.rating}</span>
                    </div>
                    <div className="sv-job-card__meta-item">
                      <Clock />
                      <span>{job.postedTime}</span>
                    </div>
                  </div>
                  <button className="sv-job-card__apply-btn">
                    <span>Apply Now</span>
                    <ArrowRight />
                  </button>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="sv-jobs-empty">
                <Briefcase className="sv-jobs-empty__icon" />
                <h3 className="sv-jobs-empty__title">No jobs found</h3>
                <p className="sv-jobs-empty__description">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
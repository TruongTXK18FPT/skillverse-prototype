import { useState } from 'react';
import { ArrowLeft, Filter, Search, BookOpen, Clock, Users, Star } from 'lucide-react';
import { RoadmapCard } from '../../components/roadmap';
import { learningRoadmapsData } from '../../data/roadmapsData';
import '../../styles/RoadmapPage.css';

const RoadmapPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  const categories = ['All', 'Programming', 'Data Science', 'Marketing', 'Design', 'Infrastructure'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredRoadmaps = learningRoadmapsData.filter(roadmap => {
    const matchesSearch = roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roadmap.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || roadmap.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || roadmap.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="roadmap-page">
      <div className="roadmap-page__container">
        {/* Header */}
        <div className="roadmap-page__header">
          <button onClick={handleGoBack} className="roadmap-page__back-btn">
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
          
          <div className="roadmap-page__header-content">
            <h1 className="roadmap-page__title">Learning Roadmaps</h1>
            <p className="roadmap-page__subtitle">
              Choose your learning path and start your journey to mastery
            </p>
          </div>

          {/* Stats */}
          <div className="roadmap-page__stats">
            <div className="roadmap-stat">
              <BookOpen className="roadmap-stat__icon" />
              <span className="roadmap-stat__value">{learningRoadmapsData.length}</span>
              <span className="roadmap-stat__label">Roadmaps</span>
            </div>
            <div className="roadmap-stat">
              <Users className="roadmap-stat__icon" />
              <span className="roadmap-stat__value">1.2k+</span>
              <span className="roadmap-stat__label">Learners</span>
            </div>
            <div className="roadmap-stat">
              <Star className="roadmap-stat__icon" />
              <span className="roadmap-stat__value">4.8</span>
              <span className="roadmap-stat__label">Rating</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="roadmap-page__filters">
          <div className="roadmap-filter-group">
            <Search className="roadmap-search__icon" />
            <input
              type="text"
              placeholder="Search roadmaps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="roadmap-search__input"
            />
          </div>

          <div className="roadmap-filter-group">
            <Filter className="roadmap-filter__icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="roadmap-filter__select"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="roadmap-filter-group">
            <Clock className="roadmap-filter__icon" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="roadmap-filter__select"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="roadmap-page__results">
          <div className="roadmap-page__results-header">
            <h2>Available Roadmaps ({filteredRoadmaps.length})</h2>
            <div className="roadmap-page__view-toggle">
              <button className="roadmap-view-btn roadmap-view-btn--active">Grid</button>
              <button className="roadmap-view-btn">List</button>
            </div>
          </div>

          {/* Roadmaps Grid */}
          <div className="roadmap-page__grid">
            {filteredRoadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                title={roadmap.title}
                category={roadmap.category}
                progress={roadmap.progress}
                estimatedTime={roadmap.estimatedTime}
                difficulty={roadmap.difficulty}
                color={roadmap.color}
                steps={roadmap.steps}
              />
            ))}
          </div>

          {filteredRoadmaps.length === 0 && (
            <div className="roadmap-page__empty">
              <div className="roadmap-empty__icon">
                <BookOpen className="h-12 w-12" />
              </div>
              <h3>No roadmaps found</h3>
              <p>Try adjusting your search criteria or browse all available roadmaps.</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedDifficulty('All');
                }}
                className="roadmap-empty__reset-btn"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;

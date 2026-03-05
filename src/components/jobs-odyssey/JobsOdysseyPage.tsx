import { useState, useEffect } from "react";
import { Briefcase, Zap, LayoutGrid } from "lucide-react";
import OdysseyLayout from "./OdysseyLayout";
import FateCard from "./FateCard";
import GigCard from "./GigCard";
import FilterConsole, { JobFilters } from "./FilterConsole";
import JobDetailsModal from "../job/JobDetailsModal";
import ShortTermJobDetailModal from "./ShortTermJobDetailModal";
import MeowlGuide from "../meowl/MeowlGuide";
import jobService from "../../services/jobService";
import shortTermJobService from "../../services/shortTermJobService";
import { JobPostingResponse } from "../../data/jobDTOs";
import { ShortTermJobResponse } from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import "./odyssey-styles.css";

type ViewType = "all" | "fulltime" | "shortterm";

const JobsOdysseyPage = () => {
  const { showError } = useToast();

  const [viewType, setViewType] = useState<ViewType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<JobFilters>({
    deploymentZone: "all",
    minBounty: 0,
    maxBounty: 50000000,
  });

  // Full-time jobs
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPostingResponse | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Short-term / gig jobs
  const [shortTermJobs, setShortTermJobs] = useState<ShortTermJobResponse[]>(
    [],
  );
  const [selectedGig, setSelectedGig] = useState<ShortTermJobResponse | null>(
    null,
  );
  const [isGigModalOpen, setIsGigModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const [regularJobs, gigJobs] = await Promise.all([
        jobService.getPublicJobs({
          search: searchTerm || undefined,
          status: "OPEN",
        }),
        shortTermJobService.getPublishedJobs(),
      ]);
      setJobs(regularJobs);
      setShortTermJobs(gigJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      showError(
        "Lỗi tải dữ liệu",
        "Không thể tải danh sách công việc. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filter full-time jobs
  const filteredJobs = jobs.filter((job) => {
    if (filters.deploymentZone === "remote" && !job.isRemote) return false;
    if (filters.deploymentZone === "onsite" && job.isRemote) return false;
    const avgBounty = (job.minBudget + job.maxBudget) / 2;
    if (avgBounty < filters.minBounty || avgBounty > filters.maxBounty)
      return false;
    return true;
  });

  // Filter short-term jobs
  const filteredGigs = shortTermJobs.filter((gig) => {
    if (filters.deploymentZone === "remote" && !gig.isRemote) return false;
    if (filters.deploymentZone === "onsite" && gig.isRemote) return false;
    if (gig.budget < filters.minBounty || gig.budget > filters.maxBounty)
      return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const inTitle = gig.title.toLowerCase().includes(term);
      const inDesc = gig.description?.toLowerCase().includes(term) ?? false;
      const inSkills =
        gig.requiredSkills?.some((s) => s.toLowerCase().includes(term)) ??
        false;
      if (!inTitle && !inDesc && !inSkills) return false;
    }
    return true;
  });

  const totalCount = filteredJobs.length + filteredGigs.length;

  // ── Full-time handlers ──
  const handleJobClick = (job: JobPostingResponse) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };
  const handleCloseJobModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedJob(null);
  };
  const handleApplySuccess = () => {
    fetchJobs();
    handleCloseJobModal();
  };

  // ── Gig handlers ──
  const handleGigClick = (gig: ShortTermJobResponse) => {
    setSelectedGig(gig);
    setIsGigModalOpen(true);
  };
  const handleCloseGigModal = () => {
    setIsGigModalOpen(false);
    setSelectedGig(null);
  };
  const handleGigApplySuccess = () => {
    fetchJobs();
    handleCloseGigModal();
  };

  // ── Render helpers ──
  const renderEmptyState = (icon: string, title: string) => (
    <div className="odyssey-empty">
      <div className="odyssey-empty__icon">{icon}</div>
      <h3 className="odyssey-empty__title">{title}</h3>
      <p className="odyssey-empty__text">
        {searchTerm
          ? `Không tìm thấy kết quả cho "${searchTerm}".`
          : "Hiện chưa có công việc phù hợp. Vui lòng quay lại sau."}
      </p>
    </div>
  );

  const renderAllView = () => {
    if (totalCount === 0) return renderEmptyState("🚀", "Không có công việc");

    return (
      <>
        {/* Full-time section */}
        {filteredJobs.length > 0 && (
          <div className="odyssey-section">
            <div className="odyssey-section__header">
              <Briefcase size={18} className="odyssey-section__icon" />
              <h2 className="odyssey-section__title">Toàn thời gian</h2>
              <span className="odyssey-section__count">
                {filteredJobs.length}
              </span>
              <button
                className="odyssey-section__link"
                onClick={() => setViewType("fulltime")}
              >
                Xem tất cả →
              </button>
            </div>
            <div className="odyssey-grid">
              {filteredJobs.slice(0, 6).map((job) => (
                <FateCard
                  key={`ft-${job.id}`}
                  job={job}
                  onClick={() => handleJobClick(job)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Short-term section */}
        {filteredGigs.length > 0 && (
          <div className="odyssey-section">
            <div className="odyssey-section__header">
              <Zap
                size={18}
                className="odyssey-section__icon odyssey-section__icon--gig"
              />
              <h2 className="odyssey-section__title">Ngắn hạn · Gig</h2>
              <span className="odyssey-section__count odyssey-section__count--gig">
                {filteredGigs.length}
              </span>
              <button
                className="odyssey-section__link"
                onClick={() => setViewType("shortterm")}
              >
                Xem tất cả →
              </button>
            </div>
            <div className="odyssey-grid">
              {filteredGigs.slice(0, 6).map((gig) => (
                <GigCard
                  key={`st-${gig.id}`}
                  job={gig}
                  onClick={() => handleGigClick(gig)}
                />
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderFullTimeGrid = () => {
    if (filteredJobs.length === 0)
      return renderEmptyState("💼", "Không có công việc toàn thời gian");
    return (
      <div className="odyssey-grid">
        {filteredJobs.map((job) => (
          <FateCard
            key={job.id}
            job={job}
            onClick={() => handleJobClick(job)}
          />
        ))}
      </div>
    );
  };

  const renderGigGrid = () => {
    if (filteredGigs.length === 0)
      return renderEmptyState("⚡", "Không có gig / công việc ngắn hạn");
    return (
      <div className="odyssey-grid">
        {filteredGigs.map((gig) => (
          <GigCard key={gig.id} job={gig} onClick={() => handleGigClick(gig)} />
        ))}
      </div>
    );
  };

  const tabs: {
    key: ViewType;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "all",
      label: "Tất cả",
      icon: <LayoutGrid size={15} />,
      count: totalCount,
    },
    {
      key: "fulltime",
      label: "Toàn thời gian",
      icon: <Briefcase size={15} />,
      count: filteredJobs.length,
    },
    {
      key: "shortterm",
      label: "Ngắn hạn",
      icon: <Zap size={15} />,
      count: filteredGigs.length,
    },
  ];

  return (
    <OdysseyLayout>
      {/* Category Tabs */}
      <div className="ody-nav">
        <div className="ody-nav__track">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`ody-nav__pill${viewType === tab.key ? " ody-nav__pill--active" : ""}${tab.key === "shortterm" ? " ody-nav__pill--gig" : ""}`}
              onClick={() => setViewType(tab.key)}
            >
              {tab.icon}
              <span className="ody-nav__label">{tab.label}</span>
              <span className="ody-nav__count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Console */}
      <FilterConsole
        onFilterChange={setFilters}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
      />

      {/* Content */}
      {isLoading ? (
        <div className="odyssey-loading">
          <MeowlKuruLoader size="medium" text="" />
          <p className="odyssey-loading__text">Đang tải công việc...</p>
        </div>
      ) : viewType === "all" ? (
        renderAllView()
      ) : viewType === "fulltime" ? (
        renderFullTimeGrid()
      ) : (
        renderGigGrid()
      )}

      {/* Full-time details modal */}
      {isDetailsModalOpen && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={handleCloseJobModal}
          onApplySuccess={handleApplySuccess}
        />
      )}

      {/* Gig details modal */}
      {isGigModalOpen && selectedGig && (
        <ShortTermJobDetailModal
          job={selectedGig}
          onClose={handleCloseGigModal}
          onApplySuccess={handleGigApplySuccess}
        />
      )}

      <MeowlGuide currentPage="jobs" />
    </OdysseyLayout>
  );
};

export default JobsOdysseyPage;

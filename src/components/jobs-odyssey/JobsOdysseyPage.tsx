import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Zap, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import OdysseyLayout from "./OdysseyLayout";
import FateCard from "./FateCard";
import GigCard from "./GigCard";
import FilterConsole, { JobFilters } from "./FilterConsole";
import MeowlGuide from "../meowl/MeowlGuide";
import jobService from "../../services/jobService";
import shortTermJobService from "../../services/shortTermJobService";
import { JobPostingResponse } from "../../data/jobDTOs";
import { ShortTermJobResponse, ShortTermApplicationStatus } from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import { useAuth } from "../../context/AuthContext";
import "./odyssey-styles.css";

type ViewType = "all" | "fulltime" | "shortterm";
const PAGE_SIZE = 6;

const JobsOdysseyPage = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const { user } = useAuth();
  const isRecruiter = user?.roles.includes("RECRUITER") ?? false;

  const [viewType, setViewType] = useState<ViewType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<JobFilters>({
    deploymentZone: "all",
    minBounty: 0,
    maxBounty: 50000000,
  });

  // Full-time jobs
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPagesJobs, setTotalPagesJobs] = useState(0);
  const [currentPageJobs, setCurrentPageJobs] = useState(0);

  // Short-term / gig jobs
  const [shortTermJobs, setShortTermJobs] = useState<ShortTermJobResponse[]>([]);
  const [totalGigs, setTotalGigs] = useState(0);
  const [totalPagesGigs, setTotalPagesGigs] = useState(0);
  const [currentPageGigs, setCurrentPageGigs] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  // Track which jobs the current user has applied to
  const [userApplications, setUserApplications] = useState<
    Map<number, ShortTermApplicationStatus>
  >(new Map());

  // Fetch user applications once (on mount)
  useEffect(() => {
    if (isRecruiter) return;
    shortTermJobService
      .getMyApplications()
      .then((apps) => {
        const map = new Map<number, ShortTermApplicationStatus>();
        for (const app of apps) {
          map.set(app.jobId, app.status);
        }
        setUserApplications(map);
      })
      .catch(() => { /* ignore */ });
  }, [isRecruiter]);

  // Fetch full-time jobs with pagination
  const fetchFullTimeJobs = useCallback(
    async (page: number) => {
      try {
        const result = await jobService.getPublicJobsPaged(page, PAGE_SIZE);
        setJobs(result.content);
        setTotalJobs(result.totalElements);
        setTotalPagesJobs(result.totalPages);
        setCurrentPageJobs(page);
      } catch {
        showError("Lỗi tải dữ liệu", "Không thể tải danh sách công việc toàn thời gian.");
      }
    },
    [showError],
  );

  // Fetch short-term jobs with pagination
  const fetchGigJobs = useCallback(
    async (page: number) => {
      try {
        const result = await shortTermJobService.getPublishedJobsPaged(page, PAGE_SIZE);
        const enriched = result.content.map((gig) => ({
          ...gig,
          hasApplied: userApplications.has(gig.id),
          canApply:
            userApplications.has(gig.id) ||
            (gig.applicantCount ?? 0) >= (gig.maxApplicants ?? Infinity),
        }));
        setShortTermJobs(enriched);
        setTotalGigs(result.totalElements);
        setTotalPagesGigs(result.totalPages);
        setCurrentPageGigs(page);
      } catch {
        showError("Lỗi tải dữ liệu", "Không thể tải danh sách công việc ngắn hạn.");
      }
    },
    [userApplications, showError],
  );

  // Reload when search term or filters change — always go back to page 0
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchFullTimeJobs(0),
      fetchGigJobs(0),
    ])
      .catch(() => { /* handled in individual functions */ })
      .finally(() => setIsLoading(false));
  }, [searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchFullTimeJobs(0),
      fetchGigJobs(0),
    ])
      .catch(() => { /* handled in individual functions */ })
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle tab switch — reload paginated data for the selected tab
  const handleViewChange = (next: ViewType) => {
    setViewType(next);
  };

  // Client-side filter helpers
  const filteredJobs = jobs.filter((job) => {
    if (filters.deploymentZone === "remote" && !job.isRemote) return false;
    if (filters.deploymentZone === "onsite" && job.isRemote) return false;
    const avgBounty = (job.minBudget + job.maxBudget) / 2;
    if (avgBounty < filters.minBounty || avgBounty > filters.maxBounty)
      return false;
    return true;
  });

  const filteredGigs = shortTermJobs.filter((gig) => {
    if (filters.deploymentZone === "remote" && !gig.isRemote) return false;
    if (filters.deploymentZone === "onsite" && gig.isRemote) return false;
    if (gig.budget < filters.minBounty || gig.budget > filters.maxBounty)
      return false;
    return true;
  });

  const totalCount = totalJobs + totalGigs;

  // ── Pagination helpers ──
  const goToPageJobs = (page: number) => {
    setIsLoading(true);
    fetchFullTimeJobs(page).finally(() => setIsLoading(false));
  };

  const goToPageGigs = (page: number) => {
    setIsLoading(true);
    fetchGigJobs(page).finally(() => setIsLoading(false));
  };

  // ── Handlers ──
  const handleJobClick = (job: JobPostingResponse) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleGigClick = (gig: ShortTermJobResponse) => {
    navigate(`/short-term-jobs/${gig.id}/view`);
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

  // ── Pagination controls ──
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
  ) => {
    if (totalPages <= 1) return null;
    return (
      <div className="odyssey-pagination">
        <button
          className="odyssey-pagination__btn"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="odyssey-pagination__info">
          {currentPage + 1} / {totalPages}
        </span>
        <button
          className="odyssey-pagination__btn"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  // ── All view (preview of each type) ──
  const renderAllView = () => {
    if (totalCount === 0) return renderEmptyState("🚀", "Không có công việc");

    return (
      <>
        {/* Full-time preview */}
        {filteredJobs.length > 0 && (
          <div className="odyssey-section">
            <div className="odyssey-section__header">
              <Briefcase size={18} className="odyssey-section__icon" />
              <h2 className="odyssey-section__title">Toàn thời gian</h2>
              <span className="odyssey-section__count">{totalJobs}</span>
              <button
                className="odyssey-section__link"
                onClick={() => handleViewChange("fulltime")}
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

        {/* Short-term preview */}
        {filteredGigs.length > 0 && (
          <div className="odyssey-section">
            <div className="odyssey-section__header">
              <Zap
                size={18}
                className="odyssey-section__icon odyssey-section__icon--gig"
              />
              <h2 className="odyssey-section__title">Ngắn hạn · Gig</h2>
              <span className="odyssey-section__count odyssey-section__count--gig">
                {totalGigs}
              </span>
              <button
                className="odyssey-section__link"
                onClick={() => handleViewChange("shortterm")}
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

  // ── Full-time grid ──
  const renderFullTimeGrid = () => {
    if (filteredJobs.length === 0)
      return renderEmptyState("💼", "Không có công việc toàn thời gian");
    return (
      <>
        <div className="odyssey-grid">
          {filteredJobs.map((job) => (
            <FateCard
              key={job.id}
              job={job}
              onClick={() => handleJobClick(job)}
            />
          ))}
        </div>
        {renderPagination(currentPageJobs, totalPagesJobs, goToPageJobs)}
      </>
    );
  };

  // ── Gig grid ──
  const renderGigGrid = () => {
    if (filteredGigs.length === 0)
      return renderEmptyState("⚡", "Không có gig / công việc ngắn hạn");
    return (
      <>
        <div className="odyssey-grid">
          {filteredGigs.map((gig) => (
            <GigCard key={gig.id} job={gig} onClick={() => handleGigClick(gig)} />
          ))}
        </div>
        {renderPagination(currentPageGigs, totalPagesGigs, goToPageGigs)}
      </>
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
      count: totalJobs,
    },
    {
      key: "shortterm",
      label: "Ngắn hạn",
      icon: <Zap size={15} />,
      count: totalGigs,
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
              onClick={() => handleViewChange(tab.key)}
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

      <MeowlGuide currentPage="jobs" />
    </OdysseyLayout>
  );
};

export default JobsOdysseyPage;

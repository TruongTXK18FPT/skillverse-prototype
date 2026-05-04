import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import OdysseyLayout from "./OdysseyLayout";
import LongTermJobCard from "./FateCard.tsx";
import ShortTermJobCard from "./GigCard.tsx";
import JobsFilterPanel, {
  JobViewType,
  JobFilterState,
  JOB_BUDGET_CAP,
} from "./FilterConsole.tsx";
import MeowlGuide from "../meowl/MeowlGuide";
import Pagination from "../shared/Pagination";
import jobService from "../../services/jobService";
import shortTermJobService from "../../services/shortTermJobService";
import { JobPostingResponse } from "../../data/jobDTOs";
import { ShortTermJobResponse } from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import authService from "../../services/authService";
import LoginRequiredModal from "../auth/LoginRequiredModal";
import "./odyssey-styles.css";

const PAGE_SIZE = 6;

type MixedFeedItem =
  | {
      type: "long-term";
      key: string;
      postedAt: number;
      data: JobPostingResponse;
    }
  | {
      type: "short-term";
      key: string;
      postedAt: number;
      data: ShortTermJobResponse;
    };

const JobsOdysseyPage = () => {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [viewType, setViewType] = useState<JobViewType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<JobFilterState>({
    workMode: "all",
    minBudget: 0,
    maxBudget: JOB_BUDGET_CAP,
  });

  const [longTermJobs, setLongTermJobs] = useState<JobPostingResponse[]>([]);
  const [longTermCurrentPage, setLongTermCurrentPage] = useState(0);

  const [shortTermJobs, setShortTermJobs] = useState<ShortTermJobResponse[]>([]);
  const [shortTermCurrentPage, setShortTermCurrentPage] = useState(0);

  const [allCurrentPage, setAllCurrentPage] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchLongTermJobs = useCallback(
    async () => {
      try {
        const jobs = await jobService.getPublicJobs();
        setLongTermJobs(jobs);
        setLongTermCurrentPage(0);
      } catch {
        showError("Lỗi tải dữ liệu", "Không thể tải danh sách công việc dài hạn.");
      }
    },
    [showError],
  );

  const fetchShortTermJobs = useCallback(
    async () => {
      try {
        const jobs = await shortTermJobService.getPublishedJobs();
        setShortTermJobs(jobs);
        setShortTermCurrentPage(0);
      } catch {
        showError("Lỗi tải dữ liệu", "Không thể tải danh sách công việc ngắn hạn.");
      }
    },
    [showError],
  );

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchLongTermJobs(), fetchShortTermJobs()])
      .catch(() => {
        // Errors are handled in each fetch function.
      })
      .finally(() => setIsLoading(false));
  }, [fetchLongTermJobs, fetchShortTermJobs]);

  useEffect(() => {
    setAllCurrentPage(0);
    setLongTermCurrentPage(0);
    setShortTermCurrentPage(0);
  }, [searchTerm, filters.workMode, filters.minBudget, filters.maxBudget]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredLongTermJobs = longTermJobs.filter((job) => {
    if (filters.workMode === "remote" && !job.isRemote) return false;
    if (filters.workMode === "onsite" && job.isRemote) return false;

    if (!job.isNegotiable) {
      // Keep jobs when their salary range overlaps the selected budget range.
      if (
        job.maxBudget < filters.minBudget ||
        job.minBudget > filters.maxBudget
      ) {
        return false;
      }
    }

    if (!normalizedSearch) return true;

    const searchPool = [
      job.title,
      job.recruiterCompanyName,
      job.location,
      job.description,
      ...job.requiredSkills,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchPool.includes(normalizedSearch);
  });

  const filteredShortTermJobs = shortTermJobs.filter((job) => {
    if (filters.workMode === "remote" && !job.isRemote) return false;
    if (filters.workMode === "onsite" && job.isRemote) return false;

    if (
      !job.isNegotiable &&
      (job.budget < filters.minBudget || job.budget > filters.maxBudget)
    ) {
      return false;
    }

    if (!normalizedSearch) return true;

    const searchPool = [
      job.title,
      job.recruiterInfo?.companyName,
      job.recruiterCompanyName,
      job.location,
      job.description,
      ...(job.requiredSkills ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchPool.includes(normalizedSearch);
  });

  const longTermVisibleCount = filteredLongTermJobs.length;
  const shortTermVisibleCount = filteredShortTermJobs.length;
  const totalFilteredResults = longTermVisibleCount + shortTermVisibleCount;

  useEffect(() => {
    const maxPageIndex = Math.max(Math.ceil(totalFilteredResults / PAGE_SIZE) - 1, 0);
    setAllCurrentPage((previousPage) => Math.min(previousPage, maxPageIndex));
  }, [totalFilteredResults]);

  const mixedFeed = useMemo<MixedFeedItem[]>(() => {
    const resolveTimestamp = (value?: string | null) => {
      if (!value) return 0;
      const timestamp = new Date(value).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const longTermItems: MixedFeedItem[] = filteredLongTermJobs.map((job) => ({
      type: "long-term",
      key: `long-term-${job.id}`,
      postedAt: resolveTimestamp(job.createdAt),
      data: job,
    }));

    const shortTermItems: MixedFeedItem[] = filteredShortTermJobs.map((job) => ({
      type: "short-term",
      key: `short-term-${job.id}`,
      postedAt: resolveTimestamp(job.createdAt),
      data: job,
    }));

    return [...longTermItems, ...shortTermItems].sort(
      (a, b) => b.postedAt - a.postedAt,
    );
  }, [filteredLongTermJobs, filteredShortTermJobs]);

  const handleLongTermCardClick = (job: JobPostingResponse) => {
    if (!authService.isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/jobs/${job.id}`);
  };

  const handleShortTermCardClick = (job: ShortTermJobResponse) => {
    if (!authService.isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/short-term-jobs/${job.id}/view`);
  };

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

  const renderPagination = (
    totalItems: number,
    currentPage: number,
    onPageChange: (page: number) => void,
  ) => {
    if (totalItems <= PAGE_SIZE) return null;

    return (
      <div className="odyssey-pagination-host">
        <Pagination
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          currentPage={currentPage + 1}
          onPageChange={(page) => onPageChange(page - 1)}
          scrollOffset={1600}
        />
      </div>
    );
  };

  const renderAllTab = () => {
    if (totalFilteredResults === 0) {
      return renderEmptyState("📭", "Chưa có công việc phù hợp");
    }

    const pageStart = allCurrentPage * PAGE_SIZE;
    const pagedMixedFeed = mixedFeed.slice(pageStart, pageStart + PAGE_SIZE);

    return (
      <section className="jobs-mixed-feed">
        <header className="jobs-mixed-feed__summary">
          <div>
            <h2 className="jobs-mixed-feed__title">Tất cả cơ hội việc làm</h2>
            <p className="jobs-mixed-feed__description">
              Danh sách bao gồm cả công việc dài hạn và ngắn hạn hiện có
            </p>
          </div>
          <div className="jobs-mixed-feed__chips">
            <span className="jobs-mixed-feed__chip">
              {totalFilteredResults} kết quả
            </span>
            <span className="jobs-mixed-feed__chip jobs-mixed-feed__chip--long-term">
              {longTermVisibleCount} dài hạn
            </span>
            <span className="jobs-mixed-feed__chip jobs-mixed-feed__chip--short-term">
              {shortTermVisibleCount} ngắn hạn
            </span>
          </div>
        </header>

        <div className="odyssey-grid jobs-mixed-feed__grid">
          {pagedMixedFeed.map((item) =>
            item.type === "long-term" ? (
              <LongTermJobCard
                key={item.key}
                job={item.data}
                jobTypeLabel="Dài hạn"
                onClick={() => handleLongTermCardClick(item.data)}
              />
            ) : (
              <ShortTermJobCard
                key={item.key}
                job={item.data}
                jobTypeLabel="Ngắn hạn"
                onClick={() => handleShortTermCardClick(item.data)}
              />
            ),
          )}
        </div>

        {renderPagination(totalFilteredResults, allCurrentPage, setAllCurrentPage)}
      </section>
    );
  };

  const renderLongTermTab = () => {
    if (filteredLongTermJobs.length === 0) {
      return renderEmptyState("💼", "Không có công việc dài hạn");
    }

    const pageStart = longTermCurrentPage * PAGE_SIZE;
    const pagedJobs = filteredLongTermJobs
      .slice()
      .sort((a, b) => {
        const bTime = new Date(b.createdAt ?? 0).getTime();
        const aTime = new Date(a.createdAt ?? 0).getTime();
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      })
      .slice(pageStart, pageStart + PAGE_SIZE);

    return (
      <>
        <div className="odyssey-grid">
          {pagedJobs.map((job) => (
            <LongTermJobCard
              key={job.id}
              job={job}
              onClick={() => handleLongTermCardClick(job)}
            />
          ))}
        </div>
        {renderPagination(filteredLongTermJobs.length, longTermCurrentPage, setLongTermCurrentPage)}
      </>
    );
  };

  const renderShortTermTab = () => {
    if (filteredShortTermJobs.length === 0) {
      return renderEmptyState("⚡", "Không có công việc ngắn hạn");
    }

    const pageStart = shortTermCurrentPage * PAGE_SIZE;
    const pagedJobs = filteredShortTermJobs
      .slice()
      .sort((a, b) => {
        const bTime = new Date(b.createdAt ?? 0).getTime();
        const aTime = new Date(a.createdAt ?? 0).getTime();
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      })
      .slice(pageStart, pageStart + PAGE_SIZE);

    return (
      <>
        <div className="odyssey-grid">
          {pagedJobs.map((job) => (
            <ShortTermJobCard
              key={job.id}
              job={job}
              onClick={() => handleShortTermCardClick(job)}
            />
          ))}
        </div>
        {renderPagination(filteredShortTermJobs.length, shortTermCurrentPage, setShortTermCurrentPage)}
      </>
    );
  };

  return (
    <OdysseyLayout>
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để xem chi tiết"
        message="Bạn cần đăng nhập để xem chi tiết công việc và ứng tuyển"
        feature="Xem chi tiết công việc"
      />

      <JobsFilterPanel
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        viewType={viewType}
        onViewTypeChange={setViewType}
        resultsCount={totalFilteredResults}
        longTermCount={longTermVisibleCount}
        shortTermCount={shortTermVisibleCount}
      />

      {isLoading ? (
        <div className="odyssey-loading">
          <MeowlKuruLoader size="medium" text="" />
          <p className="odyssey-loading__text">Đang tải công việc...</p>
        </div>
      ) : viewType === "all" ? (
        renderAllTab()
      ) : viewType === "long-term" ? (
        renderLongTermTab()
      ) : (
        renderShortTermTab()
      )}

      <MeowlGuide currentPage="jobs" />
    </OdysseyLayout>
  );
};

export default JobsOdysseyPage;

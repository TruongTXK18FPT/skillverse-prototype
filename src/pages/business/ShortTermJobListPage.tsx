import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Badge,
  Drawer,
  Checkbox,
  Stack,
  Spacer,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiClock,
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShortTermJobCard,
  ShortTermJobList,
} from "../../components/short-term-job";
import shortTermJobService from "../../services/shortTermJobService";
import {
  ShortTermJobResponse,
  JobUrgency,
  ShortTermJobFilters,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import "../../components/business-hud/short-term-fleet.css";

// ==================== CONSTANTS ====================

const URGENCY_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: JobUrgency.NORMAL, label: "Bình thường" },
  { value: JobUrgency.URGENT, label: "Gấp" },
  { value: JobUrgency.VERY_URGENT, label: "Rất gấp" },
  { value: JobUrgency.ASAP, label: "Cần ngay" },
];

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Mới nhất" },
  { value: "createdAt,asc", label: "Cũ nhất" },
  { value: "budget,desc", label: "Ngân sách cao nhất" },
  { value: "budget,asc", label: "Ngân sách thấp nhất" },
  { value: "applicationDeadline,asc", label: "Sắp hết hạn" },
];

// ==================== PAGE COMPONENT ====================

const ShortTermJobListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Drawer state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const onFilterOpen = () => setIsFilterOpen(true);
  const onFilterClose = () => setIsFilterOpen(false);

  // State
  const [jobs, setJobs] = useState<ShortTermJobResponse[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<ShortTermJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  // Filter state
  const [filter, setFilter] = useState<ShortTermJobFilters>({
    search: searchParams.get("keyword") || "",
    urgency: (searchParams.get("urgency") as JobUrgency) || undefined,
    isRemote: searchParams.get("isRemote") === "true" ? true : undefined,
    minBudget: searchParams.get("minBudget")
      ? Number(searchParams.get("minBudget"))
      : undefined,
    maxBudget: searchParams.get("maxBudget")
      ? Number(searchParams.get("maxBudget"))
      : undefined,
    skills: searchParams.get("skills")?.split(",").filter(Boolean) || [],
  });

  const [sort, setSort] = useState(
    searchParams.get("sort") || "createdAt,desc",
  );

  // ========== FETCH JOBS ==========
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await shortTermJobService.searchJobs(
        filter,
        currentPage,
        12,
      );

      setJobs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      showError("Lỗi", "Không thể tải danh sách công việc");
    } finally {
      setIsLoading(false);
    }
  }, [filter, currentPage, sort, showError]);

  const fetchFeaturedJobs = useCallback(async () => {
    try {
      const response = await shortTermJobService.searchJobs(
        { urgency: JobUrgency.URGENT },
        0,
        4,
      );
      setFeaturedJobs(response.content);
    } catch (error) {
      console.error("Failed to fetch featured jobs:", error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchFeaturedJobs();
  }, [fetchFeaturedJobs]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.search) params.set("keyword", filter.search);
    if (filter.urgency) params.set("urgency", filter.urgency);
    if (filter.isRemote !== undefined)
      params.set("isRemote", String(filter.isRemote));
    if (filter.minBudget) params.set("minBudget", String(filter.minBudget));
    if (filter.maxBudget) params.set("maxBudget", String(filter.maxBudget));
    if (filter.skills && filter.skills.length > 0)
      params.set("skills", filter.skills.join(","));
    if (sort !== "createdAt,desc") params.set("sort", sort);

    setSearchParams(params, { replace: true });
  }, [filter, sort, setSearchParams]);

  // ========== HANDLERS ==========
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchJobs();
  };

  const handleFilterChange = (
    key: keyof ShortTermJobFilters,
    value: unknown,
  ) => {
    setFilter((prev: ShortTermJobFilters) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setFilter({
      search: "",
      urgency: undefined,
      isRemote: undefined,
      minBudget: undefined,
      maxBudget: undefined,
      skills: [],
    });
    setSort("createdAt,desc");
    setCurrentPage(0);
  };

  const handleSaveJob = async (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs((prev) => prev.filter((id) => id !== jobId));
      showInfo("Thông báo", "Đã bỏ lưu");
    } else {
      setSavedJobs((prev) => [...prev, jobId]);
      showSuccess("Thành công", "Đã lưu công việc");
    }
  };

  const handleApply = (jobId: string) => {
    navigate(`/short-term-jobs/${jobId}`);
  };

  const handleViewDetails = (jobId: string) => {
    navigate(`/short-term-jobs/${jobId}`);
  };

  // ========== RENDER ==========
  return (
    <Box className="stj-list-page" minH="100vh">
      {/* Hero Header */}
      <Box className="stj-list-hero">
        <Container maxW="container.xl">
          <VStack gap={3} align="start" py={8}>
            <Badge className="stj-list-hero__badge">⚡ FREELANCE & GIG</Badge>
            <Heading className="stj-list-hero__title" size="2xl">
              Công Việc Ngắn Hạn
            </Heading>
            <Text className="stj-list-hero__subtitle">
              Khám phá hàng trăm cơ hội freelance, dự án ngắn hạn — bắt đầu ngay
              hôm nay
            </Text>

            {/* Search Bar in Hero */}
            <Box className="stj-list-searchbox" w="100%">
              <form onSubmit={handleSearch}>
                <Flex gap={3} wrap="wrap" align="center">
                  <InputGroup
                    flex={1}
                    minW="250px"
                    startElement={
                      <Icon color="gray.400">
                        <FiSearch />
                      </Icon>
                    }
                  >
                    <Input
                      className="stj-list-searchbox__input"
                      placeholder="Tìm kiếm theo tên, kỹ năng, mô tả..."
                      value={filter.search || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange("search", e.target.value)
                      }
                      bg="white"
                      size="lg"
                    />
                  </InputGroup>

                  <NativeSelect.Root maxW="180px">
                    <NativeSelect.Field
                      value={sort}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setSort(e.target.value)
                      }
                      bg="white"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>

                  <NativeSelect.Root maxW="150px">
                    <NativeSelect.Field
                      value={filter.urgency || ""}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleFilterChange(
                          "urgency",
                          e.target.value || undefined,
                        )
                      }
                      bg="white"
                    >
                      {URGENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>

                  <Button
                    variant="outline"
                    onClick={onFilterOpen}
                    size="lg"
                    bg="white"
                    color="gray.700"
                    borderColor="gray.200"
                  >
                    <FiFilter />
                    Bộ lọc
                  </Button>

                  <Button
                    type="submit"
                    colorPalette="yellow"
                    size="lg"
                    fontWeight="bold"
                    px={8}
                  >
                    <FiSearch />
                    Tìm kiếm
                  </Button>
                </Flex>
              </form>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box bg="gray.50" py={8}>
        <Container maxW="container.xl">
          {/* Active Filters */}
          {(filter.urgency ||
            filter.isRemote !== undefined ||
            filter.minBudget ||
            filter.maxBudget) && (
            <Flex
              mb={4}
              gap={2}
              wrap="wrap"
              align="center"
              bg="white"
              p={3}
              borderRadius="lg"
              boxShadow="xs"
            >
              <Text fontSize="sm" color="gray.500" fontWeight="600">
                Đang lọc:
              </Text>
              {filter.urgency && (
                <Badge colorPalette="orange" variant="subtle">
                  {
                    URGENCY_OPTIONS.find((u) => u.value === filter.urgency)
                      ?.label
                  }
                </Badge>
              )}
              {filter.isRemote !== undefined && (
                <Badge colorPalette="purple" variant="subtle">
                  {filter.isRemote ? "🌐 Remote" : "📍 Tại chỗ"}
                </Badge>
              )}
              {(filter.minBudget || filter.maxBudget) && (
                <Badge colorPalette="green" variant="subtle">
                  💰 {filter.minBudget?.toLocaleString()} -{" "}
                  {filter.maxBudget?.toLocaleString()} VND
                </Badge>
              )}
              <Spacer />
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={handleClearFilters}
              >
                ✕ Xóa bộ lọc
              </Button>
            </Flex>
          )}

          {/* Featured Jobs */}
          {featuredJobs.length > 0 && currentPage === 0 && !filter.search && (
            <Box mb={8}>
              <Heading size="md" mb={4} color="orange.600">
                <Icon mr={2} color="orange.500">
                  <FiClock />
                </Icon>
                🔥 Công việc gấp — Ứng tuyển ngay
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {featuredJobs.map((job) => (
                  <ShortTermJobCard
                    key={job.id}
                    job={job}
                    variant="featured"
                    onApply={handleApply}
                    onSave={handleSaveJob}
                    onViewDetails={handleViewDetails}
                    isSaved={savedJobs.includes(String(job.id))}
                  />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Results Count + Refresh */}
          <Flex mb={4} justify="space-between" align="center">
            <Text color="gray.600" fontWeight="500">
              Tìm thấy <strong>{totalElements}</strong> công việc
            </Text>
            <HStack gap={3}>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchJobs}
                loading={isLoading}
              >
                <FiRefreshCw />
                Làm mới
              </Button>
              <Button
                colorPalette="yellow"
                size="sm"
                onClick={() => navigate("/short-term-jobs/create")}
              >
                <FiPlus />
                Đăng công việc
              </Button>
            </HStack>
          </Flex>

          {/* Job Listings */}
          {isLoading ? (
            <Flex justify="center" py={16}>
              <VStack gap={4}>
                <Spinner size="xl" color="orange.500" />
                <Text color="gray.500">Đang tải danh sách...</Text>
              </VStack>
            </Flex>
          ) : (
            <>
              <ShortTermJobList
                jobs={jobs}
                onApply={handleApply}
                onSave={handleSaveJob}
                onViewDetails={handleViewDetails}
                savedJobs={savedJobs}
                columns={3}
                emptyMessage="Không tìm thấy công việc nào phù hợp"
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <Flex justify="center" mt={8} gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ← Trước
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      currentPage < 3
                        ? i
                        : currentPage > totalPages - 3
                          ? totalPages - 5 + i
                          : currentPage - 2 + i;
                    if (pageNum < 0 || pageNum >= totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "solid" : "outline"}
                        colorPalette={
                          currentPage === pageNum ? "yellow" : "gray"
                        }
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Sau →
                  </Button>
                </Flex>
              )}
            </>
          )}
        </Container>
      </Box>

      {/* Filter Drawer */}
      <Drawer.Root
        open={isFilterOpen}
        placement="end"
        onOpenChange={(e) => setIsFilterOpen(e.open)}
        size="sm"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger />
            <Drawer.Header borderBottomWidth="1px">
              <Heading size="md">⚙️ Bộ lọc nâng cao</Heading>
            </Drawer.Header>
            <Drawer.Body>
              <VStack gap={6} align="stretch" py={4}>
                {/* Remote */}
                <Box>
                  <Text
                    fontWeight="bold"
                    mb={3}
                    fontSize="sm"
                    textTransform="uppercase"
                    color="gray.500"
                  >
                    Hình thức làm việc
                  </Text>
                  <Stack>
                    <Checkbox.Root
                      checked={filter.isRemote === true}
                      onCheckedChange={(details) =>
                        handleFilterChange(
                          "isRemote",
                          details.checked ? true : undefined,
                        )
                      }
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label>🌐 Remote</Checkbox.Label>
                    </Checkbox.Root>
                    <Checkbox.Root
                      checked={filter.isRemote === false}
                      onCheckedChange={(details) =>
                        handleFilterChange(
                          "isRemote",
                          details.checked ? false : undefined,
                        )
                      }
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label>📍 Tại văn phòng</Checkbox.Label>
                    </Checkbox.Root>
                  </Stack>
                </Box>

                {/* Budget Range */}
                <Box>
                  <Text
                    fontWeight="bold"
                    mb={3}
                    fontSize="sm"
                    textTransform="uppercase"
                    color="gray.500"
                  >
                    Ngân sách (VND)
                  </Text>
                  <HStack>
                    <Input
                      type="number"
                      placeholder="Từ"
                      value={filter.minBudget || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange(
                          "minBudget",
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                    <Text fontWeight="bold" color="gray.400">
                      —
                    </Text>
                    <Input
                      type="number"
                      placeholder="Đến"
                      value={filter.maxBudget || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange(
                          "maxBudget",
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </HStack>
                </Box>

                {/* Quick Budget */}
                <Box>
                  <Text
                    fontWeight="bold"
                    mb={3}
                    fontSize="sm"
                    textTransform="uppercase"
                    color="gray.500"
                  >
                    Ngân sách nhanh
                  </Text>
                  <Stack>
                    {[
                      { label: "💵 Dưới 1 triệu", min: 0, max: 1000000 },
                      { label: "💰 1-5 triệu", min: 1000000, max: 5000000 },
                      { label: "💎 5-10 triệu", min: 5000000, max: 10000000 },
                      {
                        label: "🏆 Trên 10 triệu",
                        min: 10000000,
                        max: undefined,
                      },
                    ].map((opt) => (
                      <Checkbox.Root
                        key={opt.label}
                        checked={
                          filter.minBudget === opt.min &&
                          filter.maxBudget === opt.max
                        }
                        onCheckedChange={(details) => {
                          if (details.checked) {
                            setFilter((prev: ShortTermJobFilters) => ({
                              ...prev,
                              minBudget: opt.min,
                              maxBudget: opt.max,
                            }));
                          } else {
                            setFilter((prev: ShortTermJobFilters) => ({
                              ...prev,
                              minBudget: undefined,
                              maxBudget: undefined,
                            }));
                          }
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label>{opt.label}</Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </Stack>
                </Box>

                {/* Actions */}
                <HStack mt={4}>
                  <Button
                    flex={1}
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    Xóa bộ lọc
                  </Button>
                  <Button
                    flex={1}
                    colorPalette="yellow"
                    onClick={onFilterClose}
                  >
                    Áp dụng
                  </Button>
                </HStack>
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
};

export default ShortTermJobListPage;

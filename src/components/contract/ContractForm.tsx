import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Loader2,
  Search,
  User,
  Briefcase,
  DollarSign,
  Clock,
  Shield,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  Contract,
  ContractType,
  CreateContractRequest,
  ContractResponse,
  UpdateContractRequest,
  formatSalaryText,
} from "../../types/contract";
import contractService from "../../services/contractService";
import jobService from "../../services/jobService";
import {
  JobApplicationResponse,
  JobApplicationStatus,
} from "../../data/jobDTOs";
import { useToast } from "../../hooks/useToast";
import {
  // Template data
  JOB_DESCRIPTION_TEMPLATES,
  PROBATION_OBJECTIVES_TEMPLATES,
  PROBATION_EVALUATION_TEMPLATES,
  WORKING_SCHEDULE_PRESETS,
  REMOTE_WORK_POLICY_TEMPLATES,
  LEAVE_POLICY_TEMPLATES,
  INSURANCE_POLICY_TEMPLATES,
  TRAINING_POLICY_TEMPLATES,
  OTHER_BENEFITS_TEMPLATES,
  TERMINATION_CLAUSE_TEMPLATES,
  CONFIDENTIALITY_CLAUSE_TEMPLATES,
  IP_CLAUSE_TEMPLATES,
  BONUS_POLICY_TEMPLATES,
  ALLOWANCE_PRESETS,
  LEGAL_TEXT_TEMPLATES,
  CONTRACT_TYPE_DEFAULTS,
  AllowancePreset,
  getRecommendedProbationSalary,
  appendTemplate,
} from "../../data/contractTemplates";
import ContractMarkdownViewer from "./ContractMarkdownViewer";
import ContractMarkdownEditor from "./ContractMarkdownEditor";
import ContractClauses from "./ContractClauses";
import "./ContractForm.css";

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type TemplateOption = {
  label: string;
  value: string;
  description?: string;
};

const CONTRACT_TYPE_OPTIONS = [
  {
    value: ContractType.PROBATION,
    label: "Thử việc",
    desc: "Tối đa 60 ngày theo Bộ luật Lao động 2019, Điều 27.",
  },
  {
    value: ContractType.FULL_TIME,
    label: "Toàn thời gian",
    desc: "Hợp đồng lao động chính thức, áp dụng cho tuyển dụng dài hạn.",
  },
  {
    value: ContractType.PART_TIME,
    label: "Thời vụ",
    desc: "Theo công việc hoặc thời hạn xác định, phù hợp nhu cầu ngắn hạn.",
  },
] as const;

const STEPS = [
  { num: 1 as Step, label: "Ứng viên", icon: <User size={14} /> },
  { num: 2 as Step, label: "Công việc", icon: <Briefcase size={14} /> },
  { num: 3 as Step, label: "Lương & Phụ cấp", icon: <DollarSign size={14} /> },
  { num: 4 as Step, label: "Giờ làm & Nghỉ phép", icon: <Clock size={14} /> },
  { num: 5 as Step, label: "Phúc lợi & Bảo hiểm", icon: <Shield size={14} /> },
  { num: 6 as Step, label: "Điều khoản pháp lý", icon: <FileText size={14} /> },
];

interface ContractFormProps {
  applicationId?: number;
  contractId?: number;
  initialApplication?: JobApplicationResponse | null;
  availableApplications?: JobApplicationResponse[];
  defaultWorkingLocation?: string;
  onSuccess?: (contract: Contract) => void;
  onCancel?: () => void;
}

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildApplicationSummaryFromContract = (
  contract: ContractResponse,
): JobApplicationResponse | null => {
  if (!contract.applicationId) return null;

  return {
    id: contract.applicationId,
    jobId: contract.jobId ?? 0,
    jobTitle: contract.jobTitle || contract.applicationJobTitle || "",
    userId: contract.userId ?? contract.candidateId,
    userFullName: contract.candidateName || contract.userFullName || "",
    userEmail: contract.candidateEmail,
    userProfessionalTitle: contract.candidatePosition,
    coverLetter: null,
    status: JobApplicationStatus.ACCEPTED,
    appliedAt: contract.createdAt,
    reviewedAt: null,
    processedAt: null,
    acceptanceMessage: null,
    rejectionReason: null,
    interviewResult: null,
    offerDetails: null,
    candidateOfferResponse: null,
    offerRound: null,
    recruiterCompanyName: contract.employerCompanyName || "",
    minBudget: 0,
    maxBudget: 0,
    isRemote: (contract.workingLocation || "").toLowerCase().includes("remote"),
    location: contract.workingLocation || null,
    contractId: contract.id,
    contractStatus: contract.status,
  };
};

const ContractForm: React.FC<ContractFormProps> = ({
  applicationId,
  contractId,
  initialApplication,
  availableApplications,
  defaultWorkingLocation,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { id: routeContractId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { showError, showSuccess } = useToast();
  const resolvedContractId =
    contractId ?? (routeContractId ? parseInt(routeContractId, 10) : undefined);
  const isEditMode =
    typeof resolvedContractId === "number" && !Number.isNaN(resolvedContractId);

  // ── State ─────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<Step>(
    initialApplication || isEditMode ? 2 : 1,
  );
  const [hasReviewedClauses, setHasReviewedClauses] = useState(false);
  const [clausesAcknowledged, setClausesAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Template dropdown state (keyed by field name)
  const [openTemplateDropdown, setOpenTemplateDropdown] = useState<
    string | null
  >(null);

  // Step 1: Application selection
  const [applications, setApplications] = useState<JobApplicationResponse[]>(
    [],
  );
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplicationResponse | null>(initialApplication || null);

  // Step 2: Job content
  const [contractType, setContractType] = useState<ContractType>(
    ContractType.FULL_TIME,
  );
  const [candidatePosition, setCandidatePosition] = useState("");
  const [workingLocation, setWorkingLocation] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Step 3: Compensation
  const [salary, setSalary] = useState("");
  const [salaryText, setSalaryText] = useState("");
  const [salaryPaymentDate, setSalaryPaymentDate] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [mealAllowance, setMealAllowance] = useState("");
  const [transportAllowance, setTransportAllowance] = useState("");
  const [housingAllowance, setHousingAllowance] = useState("");
  const [otherAllowances, setOtherAllowances] = useState("");
  const [bonusPolicy, setBonusPolicy] = useState("");

  // Probation fields
  const [probationMonths, setProbationMonths] = useState(1);
  const [probationSalary, setProbationSalary] = useState("");
  const [probationSalaryText, setProbationSalaryText] = useState("");
  const [probationObjectives, setProbationObjectives] = useState("");
  const [probationEvaluationCriteria, setProbationEvaluationCriteria] =
    useState("");

  // Step 4: Working hours & leave
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(8);
  const [workingHoursPerWeek, setWorkingHoursPerWeek] = useState(40);
  const [workingSchedule, setWorkingSchedule] = useState(
    "Thứ 2 - Thứ 6, 08:30 - 17:30",
  );
  const [remoteWorkPolicy, setRemoteWorkPolicy] = useState("");
  const [annualLeaveDays, setAnnualLeaveDays] = useState(12);
  const [leavePolicy, setLeavePolicy] = useState("");

  // Step 5: Benefits & insurance
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [healthCheckupAnnual, setHealthCheckupAnnual] = useState(true);
  const [trainingPolicy, setTrainingPolicy] = useState("");
  const [otherBenefits, setOtherBenefits] = useState("");

  // Step 6: Legal clauses
  const [terminationNoticeDays, setTerminationNoticeDays] = useState(30);
  const [terminationClause, setTerminationClause] = useState("");
  const [confidentialityClause, setConfidentialityClause] = useState("");
  const [ipClause, setIpClause] = useState("");
  const [nonCompeteClause, setNonCompeteClause] = useState(false);
  const [nonCompeteDurationMonths, setNonCompeteDurationMonths] = useState(6);
  const [legalText, setLegalText] = useState("");

  // Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Submit result
  const [, setCreatedContract] = useState<ContractResponse | null>(null);

  const urlApplicationId = searchParams.get("applicationId");

  // ── Template helpers ────────────────────────────────────────────
  const closeAllDropdowns = useCallback(
    () => setOpenTemplateDropdown(null),
    [],
  );

  const handleTemplateSelect = useCallback(
    (field: string, value: string, mode: "append" | "replace" = "append") => {
      const setterMap: Record<string, (v: string) => void> = {
        jobDescription: setJobDescription,
        probationObjectives: setProbationObjectives,
        probationEvaluationCriteria: setProbationEvaluationCriteria,
        workingSchedule: setWorkingSchedule,
        remoteWorkPolicy: setRemoteWorkPolicy,
        leavePolicy: setLeavePolicy,
        insurancePolicy: setInsurancePolicy,
        trainingPolicy: setTrainingPolicy,
        otherBenefits: setOtherBenefits,
        terminationClause: setTerminationClause,
        confidentialityClause: setConfidentialityClause,
        ipClause: setIpClause,
        bonusPolicy: setBonusPolicy,
        legalText: setLegalText,
      };
      const setter = setterMap[field];
      if (setter) {
        const newValue =
          mode === "append"
            ? appendTemplate(
                field === "jobDescription"
                  ? jobDescription
                  : field === "probationObjectives"
                    ? probationObjectives
                    : field === "probationEvaluationCriteria"
                      ? probationEvaluationCriteria
                      : field === "workingSchedule"
                        ? workingSchedule
                        : field === "remoteWorkPolicy"
                          ? remoteWorkPolicy
                          : field === "leavePolicy"
                            ? leavePolicy
                            : field === "insurancePolicy"
                              ? insurancePolicy
                              : field === "trainingPolicy"
                                ? trainingPolicy
                                : field === "otherBenefits"
                                  ? otherBenefits
                                  : field === "terminationClause"
                                    ? terminationClause
                                    : field === "confidentialityClause"
                                      ? confidentialityClause
                                      : field === "ipClause"
                                        ? ipClause
                                        : field === "bonusPolicy"
                                          ? bonusPolicy
                                          : legalText,
                value,
              )
            : value;
        setter(newValue);
      }
      closeAllDropdowns();
    },
    [
      jobDescription,
      probationObjectives,
      probationEvaluationCriteria,
      workingSchedule,
      remoteWorkPolicy,
      leavePolicy,
      insurancePolicy,
      trainingPolicy,
      otherBenefits,
      terminationClause,
      confidentialityClause,
      ipClause,
      bonusPolicy,
      legalText,
      closeAllDropdowns,
    ],
  );

  const handleContractTypeChange = useCallback(
    (newType: ContractType) => {
      setContractType(newType);
      if (!hasReviewedClauses) {
        setClausesAcknowledged(false);
      }
      const defaults = CONTRACT_TYPE_DEFAULTS[newType];
      setAnnualLeaveDays(defaults.annualLeaveDays);
      setTerminationNoticeDays(defaults.terminationNoticeDays);
      setWorkingHoursPerDay(defaults.workingHoursPerDay);
      setWorkingHoursPerWeek(defaults.workingHoursPerWeek);
      if (newType === ContractType.PROBATION) {
        setProbationMonths(defaults.probationMonths ?? 1);
        // Auto-suggest probation salary if salary is set
        const sal = parseInt(salary, 10);
        if (sal > 0) {
          const suggested = getRecommendedProbationSalary(sal, newType);
          setProbationSalary(String(suggested));
        }
      }
    },
    [hasReviewedClauses, salary],
  );

  const handleAllowancePreset = useCallback((preset: AllowancePreset) => {
    if (preset.mealAllowance !== undefined)
      setMealAllowance(String(preset.mealAllowance));
    if (preset.transportAllowance !== undefined)
      setTransportAllowance(String(preset.transportAllowance));
    if (preset.housingAllowance !== undefined)
      setHousingAllowance(String(preset.housingAllowance));
  }, []);

  const handleProbationSalaryAuto = useCallback(() => {
    const sal = parseInt(salary, 10);
    if (sal > 0) {
      const suggested = getRecommendedProbationSalary(sal, contractType);
      setProbationSalary(String(suggested));
    }
  }, [salary, contractType]);

  const applyApplicationDefaults = useCallback(
    (application: JobApplicationResponse) => {
      setSelectedApplication(application);
      setCandidatePosition(
        (prev) =>
          prev ||
          application.jobTitle ||
          application.userProfessionalTitle ||
          "",
      );
      setWorkingLocation((prev) => {
        if (prev) return prev;
        if (application.isRemote) return "Remote";
        return application.location || defaultWorkingLocation || "";
      });
    },
    [defaultWorkingLocation],
  );

  const handleSelectApplication = useCallback(
    (application: JobApplicationResponse) => {
      applyApplicationDefaults(application);
    },
    [applyApplicationDefaults],
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = () => closeAllDropdowns();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [closeAllDropdowns]);

  // ── Effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (defaultWorkingLocation && !workingLocation)
      setWorkingLocation(defaultWorkingLocation);
  }, [defaultWorkingLocation, workingLocation]);

  useEffect(() => {
    if (!isEditMode || !resolvedContractId) return;

    let cancelled = false;
    setIsLoading(true);

    contractService
      .getContractById(resolvedContractId)
      .then((existingContract) => {
        if (cancelled) return;

        const linkedApplication =
          buildApplicationSummaryFromContract(existingContract);
        if (linkedApplication) {
          setSelectedApplication(linkedApplication);
          setApplications((prev) => {
            if (prev.some((item) => item.id === linkedApplication.id))
              return prev;
            return [linkedApplication, ...prev];
          });
        }

        setCurrentStep(2);
        setContractType(existingContract.contractType);
        setCandidatePosition(existingContract.candidatePosition || "");
        setWorkingLocation(
          existingContract.workingLocation || defaultWorkingLocation || "",
        );
        setJobDescription(existingContract.jobDescription || "");
        setSalary(String(existingContract.salary || ""));
        setSalaryText(existingContract.salaryText || "");
        setSalaryPaymentDate(existingContract.salaryPaymentDate || 10);
        setPaymentMethod(existingContract.paymentMethod || "bank_transfer");
        setMealAllowance(
          existingContract.mealAllowance
            ? String(existingContract.mealAllowance)
            : "",
        );
        setTransportAllowance(
          existingContract.transportAllowance
            ? String(existingContract.transportAllowance)
            : "",
        );
        setHousingAllowance(
          existingContract.housingAllowance
            ? String(existingContract.housingAllowance)
            : "",
        );
        setOtherAllowances(existingContract.otherAllowances || "");
        setBonusPolicy(existingContract.bonusPolicy || "");
        setProbationMonths(existingContract.probationMonths || 1);
        setProbationSalary(
          existingContract.probationSalary
            ? String(existingContract.probationSalary)
            : "",
        );
        setProbationSalaryText(existingContract.probationSalaryText || "");
        setProbationObjectives(existingContract.probationObjectives || "");
        setProbationEvaluationCriteria(
          existingContract.probationEvaluationCriteria || "",
        );
        setWorkingHoursPerDay(existingContract.workingHoursPerDay || 8);
        setWorkingHoursPerWeek(existingContract.workingHoursPerWeek || 40);
        setWorkingSchedule(
          existingContract.workingSchedule || "Thứ 2 - Thứ 6, 08:00 - 17:00",
        );
        setRemoteWorkPolicy(existingContract.remoteWorkPolicy || "");
        setAnnualLeaveDays(
          existingContract.annualLeaveDays ??
            CONTRACT_TYPE_DEFAULTS[existingContract.contractType]
              .annualLeaveDays,
        );
        setLeavePolicy(existingContract.leavePolicy || "");
        setInsurancePolicy(existingContract.insurancePolicy || "");
        setHealthCheckupAnnual(existingContract.healthCheckupAnnual ?? true);
        setTrainingPolicy(existingContract.trainingPolicy || "");
        setOtherBenefits(existingContract.otherBenefits || "");
        setTerminationNoticeDays(
          existingContract.terminationNoticeDays ??
            CONTRACT_TYPE_DEFAULTS[existingContract.contractType]
              .terminationNoticeDays,
        );
        setTerminationClause(existingContract.terminationClause || "");
        setConfidentialityClause(existingContract.confidentialityClause || "");
        setIpClause(existingContract.ipClause || "");
        setNonCompeteClause(Boolean(existingContract.nonCompeteClause));
        setNonCompeteDurationMonths(
          existingContract.nonCompeteDurationMonths || 6,
        );
        setLegalText(existingContract.legalText || "");
        setStartDate(existingContract.startDate || "");
        setEndDate(existingContract.endDate || "");
        setClausesAcknowledged(false);
      })
      .catch((error) => {
        if (cancelled) return;
        showError(
          "Lỗi tải hợp đồng",
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu hợp đồng để chỉnh sửa.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [defaultWorkingLocation, isEditMode, resolvedContractId, showError]);

  useEffect(() => {
    if (isEditMode) return;
    if (availableApplications) {
      const accepted = availableApplications.filter(
        (a) => a.status === "ACCEPTED" && !a.contractId,
      );
      setApplications(accepted);
      if (initialApplication) {
        applyApplicationDefaults(initialApplication);
        setCurrentStep(2);
      }
    }
  }, [
    applyApplicationDefaults,
    availableApplications,
    initialApplication,
    isEditMode,
  ]);

  useEffect(() => {
    if (currentStep === 1 && !selectedApplication && !applicationsLoading) {
      void loadApplications();
    }
  }, [applicationsLoading, currentStep, selectedApplication]);

  useEffect(() => {
    if (isEditMode) return;
    if (initialApplication || availableApplications) return;
    const appId = urlApplicationId
      ? parseInt(urlApplicationId, 10)
      : (applicationId ?? null);
    if (appId) {
      setIsLoading(true);
      jobService
        .getMyApplications()
        .then((apps) => {
          const found = apps.find((a) => a.id === appId);
          if (found) {
            applyApplicationDefaults(found);
            setCurrentStep(2);
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [
    applicationId,
    applyApplicationDefaults,
    availableApplications,
    initialApplication,
    isEditMode,
    urlApplicationId,
  ]);

  // Auto-generate salary text
  useEffect(() => {
    const amount = parseInt(salary, 10);
    if (amount > 0) setSalaryText(formatSalaryText(amount));
  }, [salary]);

  useEffect(() => {
    const amount = parseInt(probationSalary, 10);
    if (amount > 0) setProbationSalaryText(formatSalaryText(amount));
  }, [probationSalary]);

  // ── Data loading ───────────────────────────────────────────────
  const loadApplications = async () => {
    if (selectedApplication) return;
    if (availableApplications) return;
    if (isEditMode) return;
    setApplicationsLoading(true);
    try {
      const apps = await jobService.getMyApplications();
      setApplications(
        apps.filter((a) => a.status === "ACCEPTED" && !a.contractId),
      );
    } catch {
      showError("Lỗi tải dữ liệu", "Không thể tải danh sách ứng viên.");
    } finally {
      setApplicationsLoading(false);
    }
  };

  const filteredApplications = applications.filter(
    (app) =>
      app.userFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const clausePreviewContract: Partial<Contract> = {
    contractType,
    jobTitle: selectedApplication?.jobTitle || candidatePosition,
    candidatePosition,
    workingLocation,
    jobDescription,
    salary: salary ? parseInt(salary, 10) : 0,
    salaryText,
    salaryPaymentDate,
    paymentMethod,
    mealAllowance: mealAllowance ? parseInt(mealAllowance, 10) : undefined,
    transportAllowance: transportAllowance
      ? parseInt(transportAllowance, 10)
      : undefined,
    housingAllowance: housingAllowance
      ? parseInt(housingAllowance, 10)
      : undefined,
    otherAllowances,
    bonusPolicy,
    probationMonths,
    probationSalary: probationSalary
      ? parseInt(probationSalary, 10)
      : undefined,
    probationSalaryText,
    probationObjectives,
    probationEvaluationCriteria,
    workingHoursPerDay,
    workingHoursPerWeek,
    workingSchedule,
    remoteWorkPolicy,
    annualLeaveDays,
    leavePolicy,
    insurancePolicy,
    healthCheckupAnnual,
    trainingPolicy,
    otherBenefits,
    terminationNoticeDays,
    terminationClause,
    confidentialityClause,
    ipClause,
    nonCompeteClause: nonCompeteClause ? "Có" : undefined,
    nonCompeteDurationMonths: nonCompeteClause
      ? nonCompeteDurationMonths
      : undefined,
    legalText,
    startDate,
    endDate: endDate || undefined,
  };

  // ── Validation ─────────────────────────────────────────────────
  const canProceedFromStep1 = selectedApplication !== null || isEditMode;
  const canProceedFromStep2 = contractType && !!startDate;
  const canProceedFromStep3 = !!salary && parseInt(salary, 10) > 0;
  const canProceedFromStep4 = true; // all optional
  const canProceedFromStep5 = true; // all optional

  // ── Navigation ────────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep < 6) setCurrentStep((currentStep + 1) as Step);
  };
  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  // ── Submit ────────────────────────────────────────────────────
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedApplication && !isEditMode) return;

    // Client-side validation before submit
    if (!contractType || !startDate || !salary || parseInt(salary, 10) <= 0) {
      setSubmitError(
        "Vui lòng điền đầy đủ thông tin bắt buộc: loại hợp đồng, ngày bắt đầu và lương chính thức.",
      );
      return;
    }
    if (
      contractType === ContractType.PROBATION &&
      (!probationSalary || parseInt(probationSalary, 10) <= 0)
    ) {
      setSubmitError(
        "Vui lòng nhập lương thử việc (>= 85% lương chính thức theo BLL 2019 Điều 27).",
      );
      return;
    }
    if (contractType !== ContractType.FULL_TIME && !endDate) {
      setSubmitError("Vui lòng nhập ngày kết thúc cho hợp đồng có thời hạn.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload: CreateContractRequest = {
        applicationId: selectedApplication?.id,
        contractType,
        // Step 2
        jobTitle: selectedApplication?.jobTitle || candidatePosition,
        candidatePosition,
        workingLocation,
        jobDescription,
        // Step 3
        salary: parseInt(salary, 10),
        salaryText,
        salaryPaymentDate,
        paymentMethod,
        mealAllowance: mealAllowance ? parseInt(mealAllowance, 10) : undefined,
        transportAllowance: transportAllowance
          ? parseInt(transportAllowance, 10)
          : undefined,
        housingAllowance: housingAllowance
          ? parseInt(housingAllowance, 10)
          : undefined,
        otherAllowances: otherAllowances || undefined,
        bonusPolicy: bonusPolicy || undefined,
        probationMonths:
          contractType === ContractType.PROBATION ? probationMonths : undefined,
        probationSalary:
          contractType === ContractType.PROBATION && probationSalary
            ? parseInt(probationSalary, 10)
            : undefined,
        probationSalaryText:
          (contractType === ContractType.PROBATION && probationSalaryText) ||
          undefined,
        probationObjectives: probationObjectives || undefined,
        probationEvaluationCriteria: probationEvaluationCriteria || undefined,
        // Step 4
        workingHoursPerDay,
        workingHoursPerWeek,
        workingSchedule,
        remoteWorkPolicy: remoteWorkPolicy || undefined,
        annualLeaveDays,
        leavePolicy: leavePolicy || undefined,
        // Step 5
        insurancePolicy: insurancePolicy || undefined,
        healthCheckupAnnual,
        trainingPolicy: trainingPolicy || undefined,
        otherBenefits: otherBenefits || undefined,
        // Step 6
        terminationNoticeDays,
        terminationClause: terminationClause || undefined,
        confidentialityClause: confidentialityClause || undefined,
        ipClause: ipClause || undefined,
        nonCompeteClause: nonCompeteClause ? "Có" : undefined,
        nonCompeteDurationMonths: nonCompeteClause
          ? nonCompeteDurationMonths
          : undefined,
        legalText: legalText || undefined,
        // Dates
        startDate,
        endDate: endDate || undefined,
      };

      if (isEditMode && resolvedContractId) {
        const { applicationId: _ignoredApplicationId, ...updatePayload } =
          payload;
        const updated = await contractService.updateContract(
          resolvedContractId,
          updatePayload as UpdateContractRequest,
        );
        setCreatedContract(updated);
        showSuccess(
          "Cập nhật hợp đồng thành công",
          "Bản nháp hợp đồng đã được lưu.",
        );
        onSuccess?.(updated);
        if (!onSuccess) {
          navigate(`/business/contracts/${updated.id}`);
        }
        return;
      }

      const contract = await contractService.createContract(payload);
      const sent = await contractService.sendForSignature(contract.id);
      setCreatedContract(sent);
      showSuccess(
        "Tạo hợp đồng thành công",
        "Hợp đồng đã được gửi đến ứng viên để ký.",
      );
      onSuccess?.(sent);
      if (!onSuccess) {
        navigate(`/business/contracts/${sent.id}`);
      }
    } catch (error) {
      showError(
        "Lỗi tạo hợp đồng",
        error instanceof Error ? error.message : "Không thể tạo hợp đồng.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────
  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: {
      required?: boolean;
      placeholder?: string;
      hint?: string;
      type?: string;
      min?: string;
      max?: string;
      rows?: number;
      disabled?: boolean;
    } = {},
  ) => (
    <div className="cf-form-group">
      <label className="cf-label">
        {label}
        {opts.required && <span className="cf-required"> *</span>}
      </label>
      {opts.rows ? (
        <textarea
          className="cf-input cf-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={opts.placeholder}
          rows={opts.rows}
        />
      ) : (
        <input
          type={opts.type || "text"}
          className="cf-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={opts.placeholder}
          min={opts.min}
          max={opts.max}
          disabled={opts.disabled}
        />
      )}
      {opts.hint && <span className="cf-hint">{opts.hint}</span>}
    </div>
  );

  const renderTemplateDropdown = (
    field: string,
    templates: readonly TemplateOption[],
    mode: "append" | "replace" = "append",
  ) => (
    <div className="cf-template-row">
      <button
        type="button"
        className="cf-template-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpenTemplateDropdown(
            openTemplateDropdown === field ? null : field,
          );
        }}
      >
        Chèn mẫu <ChevronDown size={12} />
      </button>
      {openTemplateDropdown === field && (
        <div className="cf-template-dropdown">
          {templates.map((template) => (
            <button
              key={template.label}
              type="button"
              className="cf-template-option"
              onClick={() => handleTemplateSelect(field, template.value, mode)}
            >
              <span className="cf-template-option__label">
                {template.label}
              </span>
              {template.description && (
                <span className="cf-template-option__desc">
                  {template.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderMarkdownField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: {
      field: string;
      placeholder?: string;
      rows?: number;
      templates?: readonly TemplateOption[];
      templateMode?: "append" | "replace";
    },
  ) => (
    <div className="cf-form-group cf-markdown-field">
      <label className="cf-label">{label}</label>
      {opts.templates &&
        opts.templates.length > 0 &&
        renderTemplateDropdown(opts.field, opts.templates, opts.templateMode)}
      <ContractMarkdownEditor
        value={value}
        onChange={onChange}
        placeholder={opts.placeholder}
        rows={opts.rows ?? 3}
        minRows={2}
        maxRows={12}
      />
      <div className="cf-markdown-preview">
        <div className="cf-markdown-preview__header">
          <span>Xem trước</span>
          <span>
            {value.trim()
              ? "Nội dung hiển thị bên dưới"
              : "Nhập nội dung hoặc chèn mẫu để xem trước"}
          </span>
        </div>
        <div className="cf-markdown-preview__body">
          <ContractMarkdownViewer
            content={value}
            placeholder="Chưa có nội dung để xem trước."
          />
        </div>
      </div>
    </div>
  );

  // ── Step renderers ────────────────────────────────────────────
  const renderClauseReviewGate = () => {
    const nextStep = STEPS.find((step) => step.num === currentStep);

    return (
      <div className="contract-form-wrapper contract-form-wrapper--review-gate">
        <div className="contract-form-header contract-form-header--review-gate">
          <span className="cf-review-kicker">Bước đầu tiên</span>
          <h2>Rà soát điều khoản trước khi soạn hợp đồng</h2>
          <p className="cf-header-subtitle">
            Trước khi tiếp tục nhập dữ liệu chi tiết, vui lòng xem toàn bộ điều
            khoản mẫu và xác nhận đồng ý áp dụng khung hợp đồng này.
          </p>
        </div>

        <div className="cf-review-shell">
          <div className="cf-review-shell__header">
            <div>
              <h3 className="cf-step-title">Bộ điều khoản áp dụng</h3>
              <p className="cf-step-desc">
                Chọn loại hợp đồng cần dùng để xem đúng bộ điều khoản pháp lý.
                Sau khi đồng ý, hệ thống sẽ chuyển sang bước{" "}
                {nextStep?.label.toLowerCase() || "tiếp theo"}.
              </p>
            </div>

            {selectedApplication && (
              <div className="cf-review-summary-card">
                <span className="cf-review-summary-card__label">
                  Ứng viên hiện tại
                </span>
                <strong>{selectedApplication.userFullName}</strong>
                <p>
                  {selectedApplication.jobTitle ||
                    candidatePosition ||
                    "Chưa chọn vị trí"}{" "}
                  · {selectedApplication.userEmail}
                </p>
              </div>
            )}
          </div>

          <div className="cf-review-type-options">
            {CONTRACT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`cf-review-type-option ${
                  contractType === option.value
                    ? "cf-review-type-option--active"
                    : ""
                }`}
                onClick={() => handleContractTypeChange(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.desc}</span>
              </button>
            ))}
          </div>

          <div className="cf-review-sheet">
            <ContractClauses
              contractType={contractType}
              contract={clausePreviewContract}
            />
          </div>

          <label className="cf-review-consent">
            <input
              type="checkbox"
              checked={clausesAcknowledged}
              onChange={(event) => setClausesAcknowledged(event.target.checked)}
            />
            <span>
              Tôi đã đọc, hiểu và đồng ý tiếp tục soạn thảo hợp đồng dựa trên bộ
              điều khoản hiển thị ở trên.
            </span>
          </label>
        </div>

        <div className="cf-nav">
          <button
            type="button"
            className="cf-btn cf-btn--back"
            onClick={onCancel || (() => navigate(-1))}
          >
            <ChevronLeft size={16} />
            Hủy
          </button>

          <button
            type="button"
            className="cf-btn cf-btn--submit"
            onClick={() => setHasReviewedClauses(true)}
            disabled={!clausesAcknowledged}
          >
            <Check size={16} />
            Đồng ý và tiếp tục
          </button>
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="cf-step-content">
      <h3 className="cf-step-title">Chọn ứng viên</h3>
      <p className="cf-step-desc">
        Chọn ứng viên đã được chấp nhận để tạo hợp đồng lao động.
      </p>

      <div className="cf-search-bar">
        <Search size={16} className="cf-search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm ứng viên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="cf-search-input"
        />
      </div>

      {applicationsLoading ? (
        <div className="cf-loading">
          <Loader2 size={24} className="cf-spin" />
          <p>Đang tải danh sách ứng viên...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="cf-empty">
          <User size={32} />
          <p>Không có ứng viên nào được chấp nhận chưa có hợp đồng.</p>
        </div>
      ) : (
        <div className="cf-application-list">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className={`cf-application-card ${selectedApplication?.id === app.id ? "cf-application-card--selected" : ""}`}
              onClick={() => handleSelectApplication(app)}
            >
              <div className="cf-application-card__check">
                {selectedApplication?.id === app.id && <Check size={16} />}
              </div>
              <div className="cf-application-card__info">
                <h4>{app.userFullName}</h4>
                <p>{app.jobTitle}</p>
                <span className="cf-application-card__date">
                  Ứng tuyển:{" "}
                  {new Date(app.appliedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="cf-step-content">
      <h3 className="cf-step-title">Nội dung công việc</h3>
      <p className="cf-step-desc">
        Nhập thông tin về vị trí, địa điểm và nội dung công việc.
      </p>

      <div className="cf-form-grid">
        <div className="cf-form-group">
          <label className="cf-label">
            Loại hợp đồng <span className="cf-required">*</span>
          </label>
          <div className="cf-radio-group">
            {CONTRACT_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`cf-radio-option ${contractType === opt.value ? "cf-radio-option--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="contractType"
                  value={opt.value}
                  checked={contractType === opt.value}
                  onChange={() => handleContractTypeChange(opt.value)}
                  className="cf-radio-input"
                />
                <div>
                  <span className="cf-radio-label">{opt.label}</span>
                  <span className="cf-radio-desc">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="cf-form-row">
          {renderField("Ngày bắt đầu", startDate, setStartDate, {
            required: true,
            type: "date",
          })}
          {contractType !== ContractType.FULL_TIME
            ? renderField("Ngày kết thúc", endDate, setEndDate, {
                type: "date",
                hint: "Để trống nếu không xác định",
              })
            : renderField("Ngày kết thúc (nếu có)", endDate, setEndDate, {
                type: "date",
                hint: "Để trống cho hợp đồng không xác định thời hạn",
              })}
        </div>

        {renderField(
          "Chức danh / Vị trí tuyển dụng",
          candidatePosition,
          setCandidatePosition,
          {
            placeholder: "Ví dụ: Kỹ sư phần mềm, Nhân viên Marketing...",
          },
        )}
        {renderField("Địa điểm làm việc", workingLocation, setWorkingLocation, {
          placeholder: "Ví dụ: Hồ Chí Minh, Quận 1, hoặc Remote",
        })}

        <div className="cf-preset-row">
          <span className="cf-preset-label">Bắt đầu nhanh:</span>
          {[
            { label: "Hôm nay", value: formatDateInputValue(new Date()) },
            {
              label: "+7 ngày",
              value: formatDateInputValue(
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              ),
            },
            {
              label: "Đầu tháng sau",
              value: formatDateInputValue(
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  1,
                ),
              ),
            },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`cf-preset-pill ${startDate === preset.value ? "cf-preset-pill--active" : ""}`}
              onClick={() => setStartDate(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {(selectedApplication?.jobTitle ||
          selectedApplication?.userProfessionalTitle) && (
          <div className="cf-preset-row">
            <span className="cf-preset-label">Gợi ý nhanh:</span>
            {selectedApplication?.jobTitle && (
              <button
                type="button"
                className={`cf-preset-pill ${candidatePosition === selectedApplication.jobTitle ? "cf-preset-pill--active" : ""}`}
                onClick={() =>
                  setCandidatePosition(selectedApplication.jobTitle)
                }
              >
                Theo vị trí tuyển
              </button>
            )}
            {selectedApplication?.userProfessionalTitle && (
              <button
                type="button"
                className={`cf-preset-pill ${candidatePosition === selectedApplication.userProfessionalTitle ? "cf-preset-pill--active" : ""}`}
                onClick={() =>
                  setCandidatePosition(
                    selectedApplication.userProfessionalTitle || "",
                  )
                }
              >
                Theo hồ sơ ứng viên
              </button>
            )}
            {selectedApplication?.location && !selectedApplication.isRemote && (
              <button
                type="button"
                className={`cf-preset-pill ${workingLocation === selectedApplication.location ? "cf-preset-pill--active" : ""}`}
                onClick={() =>
                  setWorkingLocation(selectedApplication.location || "")
                }
              >
                Theo địa điểm tuyển
              </button>
            )}
            <button
              type="button"
              className={`cf-preset-pill ${workingLocation === "Remote" ? "cf-preset-pill--active" : ""}`}
              onClick={() => setWorkingLocation("Remote")}
            >
              Remote
            </button>
            <button
              type="button"
              className={`cf-preset-pill ${workingLocation === "Hybrid" ? "cf-preset-pill--active" : ""}`}
              onClick={() => setWorkingLocation("Hybrid")}
            >
              Hybrid
            </button>
          </div>
        )}

        {renderMarkdownField(
          "Mô tả công việc / Nhiệm vụ",
          jobDescription,
          setJobDescription,
          {
            field: "jobDescription",
            placeholder:
              "Liệt kê các công việc, trách nhiệm chính của vị trí...",
            rows: 4,
            templates: JOB_DESCRIPTION_TEMPLATES[contractType],
          },
        )}

        {contractType === ContractType.PROBATION && (
          <>
            <div className="cf-section-divider">
              <span className="cf-section-divider-label">Thử việc</span>
            </div>
            <div className="cf-form-group">
              <label className="cf-label">
                Số tháng thử việc <span className="cf-required">*</span>
              </label>
              <div className="cf-probation-selector">
                {[1, 2, 3].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`cf-probation-btn ${probationMonths === m ? "cf-probation-btn--selected" : ""}`}
                    onClick={() => setProbationMonths(m)}
                  >
                    {m} tháng
                  </button>
                ))}
              </div>
            </div>
            <div className="cf-form-row">
              <div className="cf-form-group">
                <label className="cf-label">Lương thử việc (VND)</label>
                <div className="cf-input-with-action">
                  <input
                    type="number"
                    className="cf-input"
                    value={probationSalary}
                    onChange={(e) => setProbationSalary(e.target.value)}
                    placeholder="Ví dụ: 12750000"
                    min="0"
                  />
                  {salary && parseInt(salary, 10) > 0 && (
                    <button
                      type="button"
                      className="cf-input-action-btn"
                      onClick={handleProbationSalaryAuto}
                      title={`Tự động: ≥85% lương chính thức (${(parseInt(salary, 10) * 0.85).toLocaleString("vi-VN")} VND)`}
                    >
                      Auto (≥85%)
                    </button>
                  )}
                </div>
                <span className="cf-hint">
                  Theo BLL 2019 Điều 27: ≥ 85% lương chính thức
                </span>
              </div>
              <div className="cf-form-group">
                <label className="cf-label">Lương thử việc (bằng chữ)</label>
                <input
                  type="text"
                  className="cf-input"
                  value={probationSalaryText}
                  readOnly
                  placeholder="Tự động tạo"
                />
              </div>
            </div>

            {renderMarkdownField(
              "Mục tiêu thử việc",
              probationObjectives,
              setProbationObjectives,
              {
                field: "probationObjectives",
                placeholder:
                  "Ví dụ: Hoàn thành dự án A trong thời gian thử việc...",
                rows: 2,
                templates: PROBATION_OBJECTIVES_TEMPLATES,
              },
            )}

            {renderMarkdownField(
              "Tiêu chí đánh giá thử việc",
              probationEvaluationCriteria,
              setProbationEvaluationCriteria,
              {
                field: "probationEvaluationCriteria",
                placeholder:
                  "Ví dụ: Đạt 80% KPI, hoàn thành deadline, làm việc nhóm tốt...",
                rows: 2,
                templates: PROBATION_EVALUATION_TEMPLATES,
              },
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="cf-step-content">
      <h3 className="cf-step-title">Lương & Phụ cấp</h3>
      <p className="cf-step-desc">
        Xác định mức lương chính thức và các khoản phụ cấp đi kèm.
      </p>

      <div className="cf-form-grid">
        <div className="cf-salary-block">
          <div className="cf-form-row">
            {renderField("Lương chính thức (VND)", salary, setSalary, {
              required: true,
              type: "number",
              placeholder: "15000000",
              min: "0",
            })}
            <div className="cf-form-group">
              <label className="cf-label">
                Bằng chữ <span className="cf-required">*</span>
              </label>
              <input
                type="text"
                className="cf-input"
                value={salaryText}
                readOnly
                placeholder="Tự động tạo"
              />
            </div>
          </div>
        </div>

        <div className="cf-form-row">
          {renderField(
            "Ngày thanh toán lương",
            String(salaryPaymentDate),
            (v) => setSalaryPaymentDate(parseInt(v) || 10),
            {
              type: "number",
              min: "1",
              max: "28",
              hint: "Ngày trong tháng (1-28)",
            },
          )}
          <div className="cf-form-group">
            <label className="cf-label">Phương thức thanh toán</label>
            <select
              className="cf-input cf-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              <option value="cash">Tiền mặt</option>
              <option value="e_wallet">Ví điện tử</option>
            </select>
          </div>
        </div>

        <div className="cf-preset-row">
          <span className="cf-preset-label">Thiết lập nhanh:</span>
          {[5, 10, 15, 25].map((day) => (
            <button
              key={day}
              type="button"
              className={`cf-preset-pill ${salaryPaymentDate === day ? "cf-preset-pill--active" : ""}`}
              onClick={() => setSalaryPaymentDate(day)}
            >
              Ngày {day}
            </button>
          ))}
          {[
            { label: "Chuyển khoản", value: "bank_transfer" },
            { label: "Tiền mặt", value: "cash" },
            { label: "Ví điện tử", value: "e_wallet" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`cf-preset-pill ${paymentMethod === option.value ? "cf-preset-pill--active" : ""}`}
              onClick={() => setPaymentMethod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="cf-section-divider">
          <span className="cf-section-divider-label">Phụ cấp</span>
        </div>
        <div className="cf-form-row">
          {renderField("Phụ cấp ăn (VND)", mealAllowance, setMealAllowance, {
            type: "number",
            placeholder: "730000",
          })}
          {renderField(
            "Phụ cấp đi lại (VND)",
            transportAllowance,
            setTransportAllowance,
            {
              type: "number",
              placeholder: "0",
            },
          )}
        </div>
        <div className="cf-form-row">
          {renderField(
            "Phụ cấp nhà ở (VND)",
            housingAllowance,
            setHousingAllowance,
            {
              type: "number",
              placeholder: "0",
            },
          )}
        </div>

        <div className="cf-preset-row">
          <span className="cf-preset-label">Phụ cấp đề xuất:</span>
          {ALLOWANCE_PRESETS[contractType].map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="cf-preset-pill"
              onClick={() => handleAllowancePreset(preset)}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {renderMarkdownField(
          "Các khoản phụ cấp khác",
          otherAllowances,
          setOtherAllowances,
          {
            field: "otherAllowances",
            placeholder:
              "Ví dụ: Phụ cấp điện thoại 200k, xăng xe 500k, hỗ trợ gửi xe...",
            rows: 2,
          },
        )}

        <div className="cf-section-divider">
          <span className="cf-section-divider-label">Thưởng</span>
        </div>
        {renderMarkdownField("Chính sách thưởng", bonusPolicy, setBonusPolicy, {
          field: "bonusPolicy",
          placeholder:
            "Ví dụ: Thưởng tháng 13 (Tết Nguyên Đán), thưởng hiệu suất theo quý...",
          rows: 2,
          templates: BONUS_POLICY_TEMPLATES,
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="cf-step-content">
      <h3 className="cf-step-title">Giờ làm việc & Nghỉ phép</h3>
      <p className="cf-step-desc">
        Quy định thời gian làm việc và chế độ nghỉ phép hàng năm.
      </p>

      <div className="cf-form-grid">
        <div className="cf-form-row">
          {renderField(
            "Giờ làm việc/ngày",
            String(workingHoursPerDay),
            (v) => setWorkingHoursPerDay(parseInt(v) || 8),
            {
              type: "number",
              min: "1",
              max: "12",
              hint: "Mặc định: 8 giờ (BLL 2019, Điều 104)",
            },
          )}
          {renderField(
            "Giờ làm việc/tuần",
            String(workingHoursPerWeek),
            (v) => setWorkingHoursPerWeek(parseInt(v) || 40),
            {
              type: "number",
              min: "1",
              max: "60",
              hint: "Mặc định: 40 giờ",
            },
          )}
        </div>
        {/* Schedule presets */}
        <div className="cf-form-group">
          <label className="cf-label">Ca làm việc</label>
          <div className="cf-preset-row">
            {WORKING_SCHEDULE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`cf-preset-pill ${workingSchedule === preset.value ? "cf-preset-pill--active" : ""}`}
                onClick={() => setWorkingSchedule(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="cf-input"
            value={workingSchedule}
            onChange={(e) => setWorkingSchedule(e.target.value)}
            placeholder="Thứ 2 - Thứ 6, 08:00 - 17:00"
          />
        </div>

        {renderMarkdownField(
          "Chính sách làm việc từ xa",
          remoteWorkPolicy,
          setRemoteWorkPolicy,
          {
            field: "remoteWorkPolicy",
            placeholder:
              "Ví dụ: Cho phép 2 ngày/tuần WFH, cần phê duyệt từ quản lý...",
            rows: 2,
            templates: REMOTE_WORK_POLICY_TEMPLATES,
          },
        )}

        <div className="cf-section-divider">
          <span className="cf-section-divider-label">Nghỉ phép</span>
        </div>
        <div className="cf-form-row">
          {renderField(
            "Số ngày nghỉ phép năm",
            String(annualLeaveDays),
            (v) => setAnnualLeaveDays(parseInt(v) || 12),
            {
              type: "number",
              min: "0",
              max: "30",
              hint: "Mặc định theo loại HĐ: Thử việc=0, Toàn thời gian=12, Thời vụ=6",
            },
          )}
        </div>

        {renderMarkdownField(
          "Chính sách nghỉ phép chi tiết",
          leavePolicy,
          setLeavePolicy,
          {
            field: "leavePolicy",
            placeholder:
              "Ví dụ: Nghỉ phép năm 12 ngày, nghỉ ốm theo BHXH, nghỉ thai sản theo quy định...",
            rows: 3,
            templates: LEAVE_POLICY_TEMPLATES[contractType],
          },
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="cf-step-content">
      <h3 className="cf-step-title">Phúc lợi & Bảo hiểm</h3>
      <p className="cf-step-desc">
        Các quyền lợi, chế độ bảo hiểm và đào tạo dành cho nhân viên.
      </p>

      <div className="cf-form-grid">
        {/* Insurance */}
        <div className="cf-section-divider">
          <span className="cf-section-divider-label">Bảo hiểm</span>
        </div>
        {renderMarkdownField(
          "Chính sách bảo hiểm",
          insurancePolicy,
          setInsurancePolicy,
          {
            field: "insurancePolicy",
            placeholder:
              "Ví dụ: BHXH 18%, BHYT 3%, BHTN 1% theo quy định. Công ty đóng đủ 22%...",
            rows: 3,
            templates: INSURANCE_POLICY_TEMPLATES[contractType],
          },
        )}
        <div className="cf-form-group">
          <label className="cf-checkbox-label">
            <input
              type="checkbox"
              className="cf-checkbox"
              checked={healthCheckupAnnual}
              onChange={(e) => setHealthCheckupAnnual(e.target.checked)}
            />
            Khám sức khỏe định kỳ hàng năm
          </label>
          <span className="cf-hint">Theo BLL 2019, Điều 152</span>
        </div>

        {/* Training */}
        <div className="cf-section-divider">
          <span className="cf-section-divider-label">Đào tạo</span>
        </div>
        {renderMarkdownField(
          "Chính sách đào tạo & phát triển",
          trainingPolicy,
          setTrainingPolicy,
          {
            field: "trainingPolicy",
            placeholder:
              "Ví dụ: Ngân sách đào tạo 5 triệu/năm, tham gia hội thảo, khóa học chuyên môn...",
            rows: 3,
            templates: TRAINING_POLICY_TEMPLATES,
          },
        )}

        {/* Other benefits */}
        <div className="cf-section-divider">
          <span className="cf-section-divider-label">Phúc lợi khác</span>
        </div>
        {renderMarkdownField(
          "Các phúc lợi khác",
          otherBenefits,
          setOtherBenefits,
          {
            field: "otherBenefits",
            placeholder:
              "Ví dụ: Team building hằng quý, bảo hiểm sức khỏe cao cấp, laptop/thiết bị...",
            rows: 3,
            templates: OTHER_BENEFITS_TEMPLATES,
          },
        )}
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="cf-step-content" id="cf-step-6-content">
      <h3 className="cf-step-title">Điều khoản pháp lý</h3>
      <p className="cf-step-desc">
        Các điều khoản về bảo mật, sở hữu trí tuệ, cạnh tranh và chấm dứt hợp
        đồng.
      </p>

      <div className="cf-form-grid">
        <div className="cf-legal-step">
          {/* Termination */}
          <div className="cf-section-divider">
            <span className="cf-section-divider-label">Chấm dứt hợp đồng</span>
          </div>
          <div className="cf-form-row">
            {renderField(
              "Thời hạn báo trước (ngày)",
              String(terminationNoticeDays),
              (v) => setTerminationNoticeDays(parseInt(v) || 30),
              {
                type: "number",
                min: "1",
                max: "90",
                hint: `Mặc định: Thử việc=3, Thời vụ=15, Toàn thời gian=30 ngày`,
              },
            )}
          </div>
          {renderMarkdownField(
            "Điều khoản chấm dứt chi tiết",
            terminationClause,
            setTerminationClause,
            {
              field: "terminationClause",
              placeholder:
                "Ví dụ: Thanh lý HĐL trong vòng 7 ngày làm việc, hoàn trả tài sản, bồi thường...",
              rows: 2,
              templates: TERMINATION_CLAUSE_TEMPLATES[contractType],
            },
          )}

          {/* Confidentiality */}
          <div className="cf-section-divider">
            <span className="cf-section-divider-label">
              Bảo mật & Sở hữu trí tuệ
            </span>
          </div>
          {renderMarkdownField(
            "Điều khoản bảo mật",
            confidentialityClause,
            setConfidentialityClause,
            {
              field: "confidentialityClause",
              placeholder:
                "Ví dụ: Cấm tiết lộ thông tin mật, bí quyết kinh doanh, dữ liệu khách hàng...",
              rows: 2,
              templates: CONFIDENTIALITY_CLAUSE_TEMPLATES,
            },
          )}
          {renderMarkdownField(
            "Điều khoản sở hữu trí tuệ",
            ipClause,
            setIpClause,
            {
              field: "ipClause",
              placeholder:
                "Ví dụ: Mọi sáng chế, sáng kiến trong quá trình làm việc thuộc quyền sở hữu công ty...",
              rows: 2,
              templates: IP_CLAUSE_TEMPLATES,
            },
          )}

          {/* Non-compete */}
          <div className="cf-form-group">
            <label className="cf-checkbox-label">
              <input
                type="checkbox"
                className="cf-checkbox"
                checked={nonCompeteClause}
                onChange={(e) => setNonCompeteClause(e.target.checked)}
              />
              Có điều khoản cạnh tranh (sau khi nghỉ việc)
            </label>
          </div>
          {nonCompeteClause && (
            <div className="cf-form-row">
              {renderField(
                "Thời gian cạnh tranh (tháng)",
                String(nonCompeteDurationMonths),
                (v) => setNonCompeteDurationMonths(parseInt(v) || 6),
                {
                  type: "number",
                  min: "0",
                  max: "24",
                  hint: "Tối đa 24 tháng theo BLL 2019, Điều 62",
                },
              )}
            </div>
          )}

          {/* Additional legal text */}
          <div className="cf-section-divider">
            <span className="cf-section-divider-label">Điều khoản bổ sung</span>
          </div>
          {renderMarkdownField(
            "Các điều khoản bổ sung khác",
            legalText,
            setLegalText,
            {
              field: "legalText",
              placeholder: "Nhập các điều khoản riêng bổ sung (nếu có)...",
              rows: 3,
              templates: LEGAL_TEXT_TEMPLATES,
              templateMode: "replace",
            },
          )}
        </div>
        {/* end .cf-legal-step */}

        {/* Live clauses preview */}
        <div className="cf-clauses-preview">
          <div className="cf-clauses-preview__header">
            <span>Xem trước hợp đồng</span>
            <span>Cập nhật trực tiếp theo nội dung đã nhập</span>
          </div>
          <div className="cf-clauses-preview__body">
            <ContractClauses
              contractType={contractType}
              contract={clausePreviewContract}
              compact
            />
          </div>
        </div>
      </div>
      {/* end .cf-form-grid */}
    </div>
  );

  // ── Main render ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="cf-loading-page">
        <Loader2 size={32} className="cf-spin" />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!hasReviewedClauses) {
    return renderClauseReviewGate();
  }

  return (
    <div className="contract-form-wrapper" data-step={currentStep}>
      <div className="contract-form-header">
        <h2>
          {isEditMode ? "Cập nhật Hợp đồng Lao động" : "Tạo Hợp đồng Lao động"}
        </h2>
        {selectedApplication && (
          <p className="cf-header-subtitle">
            Cho ứng viên: <strong>{selectedApplication.userFullName}</strong>
            {candidatePosition && <span> — {candidatePosition}</span>}
          </p>
        )}
      </div>

      {/* Stepper */}
      <div className="cf-stepper">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div
              className={`cf-step ${currentStep === step.num ? "cf-step--active" : ""} ${currentStep > step.num ? "cf-step--done" : ""}`}
            >
              <div className="cf-step-circle">
                {currentStep > step.num ? <Check size={14} /> : step.num}
              </div>
              <span className="cf-step-label">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && <div className="cf-step-connector" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="cf-body">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="cf-submit-error">
          <AlertTriangle size={16} />
          <p>{submitError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="cf-nav">
        <button
          type="button"
          className="cf-btn cf-btn--back"
          onClick={
            currentStep === 1 ? onCancel || (() => navigate(-1)) : handleBack
          }
        >
          <ChevronLeft size={16} />
          {currentStep === 1 ? "Hủy" : "Quay lại"}
        </button>

        {currentStep < 6 ? (
          <button
            type="button"
            className="cf-btn cf-btn--next"
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !canProceedFromStep1) ||
              (currentStep === 2 && !canProceedFromStep2) ||
              (currentStep === 3 && !canProceedFromStep3) ||
              (currentStep === 4 && !canProceedFromStep4) ||
              (currentStep === 5 && !canProceedFromStep5)
            }
          >
            Tiếp theo
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="cf-btn cf-btn--submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="cf-spin" />
                {isEditMode ? "Đang lưu..." : "Đang gửi..."}
              </>
            ) : (
              <>
                <Check size={16} />
                {isEditMode ? "Lưu cập nhật" : "Gửi hợp đồng"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ContractForm;

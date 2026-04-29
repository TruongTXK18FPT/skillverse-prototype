#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const CATEGORIES = ["KNOWLEDGE", "SKILL", "SITUATION", "ANALYSIS"];
const OPTION_LETTERS = ["A", "B", "C", "D"];

const SKILLS = [
  {
    role: "Backend Developer",
    skillArea: "Server-side Languages",
    relativePath: "technology/backend-developer/server-side-languages.json",
    focus: [
      "Node.js, Java Spring Boot, Python Django, PHP/Laravel",
      "Concurrency model, async I/O, runtime behavior, memory concerns",
      "Error handling strategy, logging, dependency management, testing",
      "Trade-offs among ecosystems in real production scenarios"
    ]
  },
  {
    role: "Backend Developer",
    skillArea: "Database Management",
    relativePath: "technology/backend-developer/database-management.json",
    focus: [
      "Relational modeling, normalization, indexing, query plans",
      "Transactions, isolation levels, locking and consistency",
      "Replication, partitioning, backup/recovery and migrations",
      "SQL vs NoSQL trade-offs and operational decision-making"
    ]
  },
  {
    role: "Backend Developer",
    skillArea: "API Design (REST/GraphQL)",
    relativePath: "technology/backend-developer/api-design-rest-graphql.json",
    focus: [
      "REST resource design, status codes, idempotency, versioning",
      "GraphQL schema design, resolvers, N+1 mitigation, pagination",
      "Caching, rate limiting, contract evolution and compatibility",
      "Error contracts, observability and API governance"
    ]
  },
  {
    role: "Backend Developer",
    skillArea: "Security",
    relativePath: "technology/backend-developer/security.json",
    focus: [
      "Authentication/authorization, OAuth2/OIDC, session and token handling",
      "OWASP Top 10, input validation, secure coding practices",
      "Secrets management, encryption, key rotation, transport security",
      "Threat modeling, incident response and defense-in-depth"
    ]
  },
  {
    role: "Frontend Developer",
    skillArea: "HTML/CSS Fundamentals",
    relativePath: "technology/frontend-developer/html-css-fundamentals.json",
    focus: [
      "Semantic HTML, accessibility, forms, landmarks",
      "CSS layout systems (Flexbox/Grid), responsive design",
      "Cascade, specificity, architecture and maintainability",
      "Cross-browser behavior and practical UI implementation"
    ]
  },
  {
    role: "Frontend Developer",
    skillArea: "JavaScript/TypeScript",
    relativePath: "technology/frontend-developer/javascript-typescript.json",
    focus: [
      "Closures, async flow, event loop, error handling",
      "TypeScript typing strategies, generics, utility types",
      "State management patterns and immutable updates",
      "Debugging, testing and code quality practices"
    ]
  },
  {
    role: "Frontend Developer",
    skillArea: "UI Frameworks (React/Vue)",
    relativePath: "technology/frontend-developer/ui-frameworks-react-vue.json",
    focus: [
      "Component composition, lifecycle/rendering model",
      "State, props, context/store patterns",
      "Performance optimization, memoization, code splitting",
      "Architecture choices and team conventions"
    ]
  },
  {
    role: "Frontend Developer",
    skillArea: "Web Performance",
    relativePath: "technology/frontend-developer/web-performance.json",
    focus: [
      "Core Web Vitals (LCP, INP, CLS) and diagnostics",
      "Asset strategy, caching, lazy loading, prefetching",
      "Runtime performance, rendering pipeline and bundle analysis",
      "Monitoring, performance budgets and optimization trade-offs"
    ]
  },
  {
    role: "UI/UX Designer",
    skillArea: "Design Fundamentals",
    relativePath: "design/ui-ux-designer/design-fundamentals.json",
    focus: [
      "Design principles, hierarchy, composition and visual balance",
      "Typography, color theory and spacing systems",
      "Accessibility basics, usability heuristics and consistency",
      "Critiquing design decisions with clear rationale"
    ]
  },
  {
    role: "UI/UX Designer",
    skillArea: "UX Research",
    relativePath: "design/ui-ux-designer/ux-research.json",
    focus: [
      "Research planning, hypotheses and method selection",
      "Interviews, surveys, diary studies and observation",
      "Synthesizing insights, affinity mapping and prioritization",
      "Turning research findings into actionable product decisions"
    ]
  },
  {
    role: "UI/UX Designer",
    skillArea: "User Flow & Information Architecture",
    relativePath: "design/ui-ux-designer/user-flow-information-architecture.json",
    focus: [
      "Journey mapping, task flows and edge-case handling",
      "Information architecture, labeling, navigation and findability",
      "Card sorting, sitemap design and content grouping",
      "Designing flows that reduce friction and cognitive load"
    ]
  },
  {
    role: "UI/UX Designer",
    skillArea: "Wireframing & Prototyping",
    relativePath: "design/ui-ux-designer/wireframing-prototyping.json",
    focus: [
      "Low-fidelity wireframes, layout exploration and iteration",
      "Interactive prototypes for validation and stakeholder alignment",
      "Tooling trade-offs, component reuse and design handoff",
      "Testing assumptions before investing in high-fidelity UI"
    ]
  },
  {
    role: "UI/UX Designer",
    skillArea: "Visual UI Design",
    relativePath: "design/ui-ux-designer/visual-ui-design.json",
    focus: [
      "Visual systems, tokens, color palette and contrast",
      "Components, states, empty states and feedback patterns",
      "Polish details: alignment, rhythm, motion and micro-interactions",
      "Balancing brand expression with usability and accessibility"
    ]
  },
  {
    role: "Mobile Developer",
    skillArea: "Native Mobile Development",
    relativePath: "technology/mobile-developer/native-mobile-development.json",
    focus: [
      "iOS and Android native language fundamentals (Swift/Kotlin)",
      "Platform SDKs, lifecycle management, app architecture",
      "Memory management, performance optimization and battery awareness",
      "OS-specific patterns, permissions and cross-platform trade-offs"
    ]
  },
  {
    role: "Mobile Developer",
    skillArea: "Mobile Testing & Debugging",
    relativePath: "technology/mobile-developer/mobile-testing-debugging.json",
    focus: [
      "Unit testing, integration testing and UI automation frameworks",
      "Device profiling: CPU, memory, network, battery and thermal analysis",
      "Debugging tools (Xcode, Android Studio) and remote debugging",
      "Crash analytics, performance monitoring and troubleshooting real devices"
    ]
  },
  {
    role: "Mobile Developer",
    skillArea: "App Release & Publishing",
    relativePath: "technology/mobile-developer/app-release-publishing.json",
    focus: [
      "Code signing, provisioning profiles and certificate management",
      "App Store Connect and Google Play Console distribution workflows",
      "Release notes, versioning, beta testing and rollout strategies",
      "Store guidelines compliance, review processes and post-launch monitoring"
    ]
  },
  {
    role: "DevOps Engineer",
    skillArea: "CI/CD Pipelines",
    relativePath: "technology/devops-engineer/ci-cd-pipelines.json",
    focus: [
      "Pipeline design: build, test, deploy stages and orchestration",
      "Tools (Jenkins, GitHub Actions, GitLab CI, CircleCI) and configuration",
      "Artifact management, staging environments and deployment strategies",
      "Monitoring, rollbacks, incident response and pipeline optimization"
    ]
  },
  {
    role: "DevOps Engineer",
    skillArea: "Containers & Docker",
    relativePath: "technology/devops-engineer/containers-docker.json",
    focus: [
      "Docker fundamentals: images, layers, Dockerfile optimization",
      "Container registry management, image scanning and distribution",
      "Orchestration platforms (Kubernetes basics, Compose) and resource management",
      "Networking, storage, security and multi-container application patterns"
    ]
  },
  {
    role: "DevOps Engineer",
    skillArea: "Cloud Infrastructure",
    relativePath: "technology/devops-engineer/cloud-infrastructure.json",
    focus: [
      "Cloud platforms (AWS, GCP, Azure) core services and architectures",
      "Infrastructure as Code (Terraform, CloudFormation) patterns",
      "Auto-scaling, load balancing, multi-region and disaster recovery",
      "Cost optimization, resource tagging and capacity planning"
    ]
  },
  {
    role: "DevOps Engineer",
    skillArea: "Security & Reliability",
    relativePath: "technology/devops-engineer/security-reliability.json",
    focus: [
      "Infrastructure hardening, network security and access control",
      "Secrets management, encryption at rest/transit and compliance",
      "Observability stack: metrics, logs, traces and alerting rules",
      "Incident response, SLAs, chaos engineering and reliability practices"
    ]
  },
  {
    role: "DevOps Engineer",
    skillArea: "Scripting & Automation",
    relativePath: "technology/devops-engineer/scripting-automation.json",
    focus: [
      "Shell scripting (bash, zsh) and Python for infrastructure automation",
      "Configuration management (Ansible, Puppet, Chef) and provisioning",
      "Infrastructure templating, policy as code and deployment automation",
      "Troubleshooting, debugging scripts and performance optimization"
    ]
  },
  {
    role: "B2B Sales",
    skillArea: "Lead Generation",
    relativePath: "business/b2b-sales/lead-generation.json",
    focus: [
      "ICP definition, segmentation and account prioritization",
      "Outbound/inbound workflows and multichannel prospecting",
      "Qualification signals, messaging experiments and metrics",
      "Pipeline quality management and handoff criteria"
    ]
  },
  {
    role: "B2B Sales",
    skillArea: "Consultative Selling",
    relativePath: "business/b2b-sales/consultative-selling.json",
    focus: [
      "Discovery questioning, pain mapping and value hypothesis",
      "Stakeholder analysis and consensus building",
      "Objection handling based on business impact",
      "Solution framing and measurable outcomes"
    ]
  },
  {
    role: "B2B Sales",
    skillArea: "B2B Relationship Building",
    relativePath: "business/b2b-sales/b2b-relationship-building.json",
    focus: [
      "Trust development across long sales cycles",
      "Executive communication and account governance",
      "Conflict handling, expectation setting, renewal planning",
      "Partnership growth and long-term value realization"
    ]
  },
  {
    role: "B2B Sales",
    skillArea: "Sales Cycle Management",
    relativePath: "business/b2b-sales/sales-cycle-management.json",
    focus: [
      "Stage definitions, exit criteria and forecast hygiene",
      "Deal qualification frameworks and risk control",
      "Negotiation timing, procurement/legal coordination",
      "Post-close transition and expansion strategy"
    ]
  },
  {
    role: "Brand Designer",
    skillArea: "Logo Design",
    relativePath: "design/brand-designer/logo-design.json",
    focus: [
      "Concept development, symbolic meaning and originality",
      "Scalability, legibility and reduction testing",
      "Grid, proportion and geometric consistency",
      "Client brief translation and rationale presentation"
    ]
  },
  {
    role: "Brand Designer",
    skillArea: "Brand Guidelines",
    relativePath: "design/brand-designer/brand-guidelines.json",
    focus: [
      "Rule systems for logo, color, typography, imagery",
      "Tone, voice and usage standards across channels",
      "Governance, adoption and documentation clarity",
      "Balancing consistency with practical flexibility"
    ]
  },
  {
    role: "Brand Designer",
    skillArea: "Visual Identity Systems",
    relativePath: "design/brand-designer/visual-identity-systems.json",
    focus: [
      "System thinking for components and brand expression",
      "Modularity across print, digital and environmental touchpoints",
      "Motion/interaction considerations in identity",
      "Design operations and cross-functional implementation"
    ]
  },
  {
    role: "Brand Designer",
    skillArea: "Typography",
    relativePath: "design/brand-designer/typography.json",
    focus: [
      "Typeface pairing, hierarchy and readability",
      "Kerning, tracking, leading and optical correction",
      "Multilingual support, accessibility and responsive typography",
      "Typographic systems aligned with brand personality"
    ]
  }
  ,
  {
    role: "Backend Developer",
    skillArea: "Java",
    relativePath: "technology/backend-developer/java.json",
    focus: [
      "Core Java fundamentals: OOP, JVM internals, memory model and garbage collection",
      "Concurrency and multithreading: executors, CompletableFuture, synchronization",
      "Spring ecosystem: Spring Boot, dependency injection, Data, Security and REST",
      "Performance tuning, profiling, classloading, packaging and deployment best practices"
    ]
  },
  {
    role: "Backend Developer",
    skillArea: "Node.js",
    relativePath: "technology/backend-developer/nodejs.json",
    focus: [
      "Event loop, async patterns and lifecycle of requests in Node.js",
      "Streams, buffers, backpressure, file and network I/O",
      "Module system, package management, native addons and ecosystem trade-offs",
      "Performance, clustering, monitoring and production debugging practices"
    ]
  },
  {
    role: "Backend Developer",
    skillArea: "MongoDB",
    relativePath: "technology/backend-developer/mongodb.json",
    focus: [
      "Document modelling and schema design patterns for MongoDB",
      "Indexing strategies, explain plans and aggregation pipeline optimizations",
      "Replication, sharding, transactions and consistency trade-offs",
      "Operational concerns: backup/restore, monitoring, scaling and deployments"
    ]
  },
  {
    role: "Backend Developer",
    skillArea: "Git",
    relativePath: "technology/backend-developer/git.json",
    focus: [
      "Branching strategies (GitFlow, trunk-based), merges vs rebase",
      "Conflict resolution, cherry-pick, revert and git bisect troubleshooting",
      "Large-repo patterns: submodules, LFS and monorepo considerations",
      "Hooks, CI integration, secure workflows and PR hygiene"
    ]
  },
  {
    role: "Frontend Developer",
    skillArea: "React",
    relativePath: "technology/frontend-developer/react.json",
    focus: [
      "Component architecture, hooks, and render lifecycle patterns",
      "State management: context, Redux, recoil, Zustand and their trade-offs",
      "Performance: memoization, virtualization, code splitting, SSR/CSR nuances",
      "Testing, accessibility, hydration issues and deployment patterns"
    ]
  }
];

function argValue(flagName) {
  const idx = process.argv.indexOf(flagName);
  if (idx === -1 || idx + 1 >= process.argv.length) {
    return undefined;
  }
  return process.argv[idx + 1];
}

function hasFlag(flagName) {
  return process.argv.includes(flagName);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeOptionText(option) {
  const plain = toText(option)
    .replace(/^[A-Da-d][\.|\)]\s*/, "")
    .trim();
  return plain;
}

function normalizeCategory(value, fallbackIndex) {
  const raw = toText(value).toUpperCase();
  const direct = CATEGORIES.find((item) => item === raw);
  if (direct) {
    return direct;
  }

  const aliases = {
    KNOWLEDGE: ["THEORY", "CONCEPT", "HIEU_BIET"],
    SKILL: ["PRACTICE", "EXECUTION", "THUC_HANH"],
    SITUATION: ["SCENARIO", "CASE", "TINH_HUONG"],
    ANALYSIS: ["ANALYTICAL", "EVALUATION", "PHAN_TICH"]
  };

  for (const [category, names] of Object.entries(aliases)) {
    if (names.some((name) => raw.includes(name))) {
      return category;
    }
  }

  return CATEGORIES[fallbackIndex % CATEGORIES.length];
}

function inferCorrectAnswer(raw, normalizedOptions) {
  const byLetter = toText(raw?.correctAnswer || raw?.answer || raw?.correct || raw?.correct_option)
    .toUpperCase()
    .match(/[A-D]/);
  if (byLetter) {
    return byLetter[0];
  }

  if (Number.isInteger(raw?.correctOptionIndex) && raw.correctOptionIndex >= 0 && raw.correctOptionIndex <= 3) {
    return OPTION_LETTERS[raw.correctOptionIndex];
  }

  const textAnswer = normalizeOptionText(raw?.correctOptionText || raw?.correctText || "").toLowerCase();
  if (textAnswer) {
    for (let i = 0; i < normalizedOptions.length; i += 1) {
      const candidate = normalizeOptionText(normalizedOptions[i]).toLowerCase();
      if (candidate === textAnswer) {
        return OPTION_LETTERS[i];
      }
    }
  }

  return "";
}

function normalizeQuestion(raw, skill, difficulty, index) {
  const questionText = toText(raw?.questionText || raw?.question || raw?.prompt || raw?.content);
  if (questionText.length < 20) {
    return null;
  }

  const optionsRaw = Array.isArray(raw?.options)
    ? raw.options
    : Array.isArray(raw?.choices)
      ? raw.choices
      : Array.isArray(raw?.answers)
        ? raw.answers
        : [];

  if (optionsRaw.length < 4) {
    return null;
  }

  const normalizedOptions = optionsRaw.slice(0, 4).map((option, optionIndex) => {
    const normalized = normalizeOptionText(option);
    if (!normalized) {
      return "";
    }
    return `${OPTION_LETTERS[optionIndex]}. ${normalized}`;
  });

  if (normalizedOptions.some((option) => !option)) {
    return null;
  }

  const optionCoreSet = new Set(
    normalizedOptions.map((option) => normalizeOptionText(option).toLowerCase())
  );
  if (optionCoreSet.size !== 4) {
    return null;
  }

  const correctAnswer = inferCorrectAnswer(raw, normalizedOptions);
  if (!OPTION_LETTERS.includes(correctAnswer)) {
    return null;
  }

  const explanation = toText(raw?.explanation || raw?.rationale || raw?.reasoning || raw?.why);
  if (explanation.length < 20) {
    return null;
  }

  return {
    questionText,
    options: normalizedOptions,
    correctAnswer,
    explanation,
    difficulty,
    skillArea: skill.skillArea,
    category: normalizeCategory(raw?.category, index)
  };
}

function questionKey(question) {
  return question.questionText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseJsonPayload(text) {
  const trimmed = toText(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!trimmed) {
    throw new Error("Gemini returned empty text.");
  }

  const tryParse = (candidate) => {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed?.questions)) {
      return parsed.questions;
    }
    if (Array.isArray(parsed?.items)) {
      return parsed.items;
    }
    throw new Error("JSON parsed but does not contain an array payload.");
  };

  try {
    return tryParse(trimmed);
  } catch {
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const sliced = trimmed.slice(firstBracket, lastBracket + 1);
      return tryParse(sliced);
    }
    throw new Error("Cannot parse Gemini JSON payload.");
  }
}

function normalizeModelName(model) {
  return toText(model).replace(/^models\//i, "");
}

function buildModelCandidates(primaryModel, fallbackCsv) {
  const defaultFallback = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];
  const csvModels = toText(fallbackCsv)
    .split(",")
    .map((item) => normalizeModelName(item))
    .filter(Boolean);

  const ordered = [normalizeModelName(primaryModel), ...csvModels, ...defaultFallback]
    .map((item) => normalizeModelName(item))
    .filter(Boolean);

  return Array.from(new Set(ordered));
}

function buildApiKeyCandidates(primaryKey, fallbackCsv) {
  const csvKeys = toText(fallbackCsv)
    .split(/[\n,;]/)
    .map((item) => toText(item))
    .filter(Boolean);

  return Array.from(new Set([toText(primaryKey), ...csvKeys].filter(Boolean)));
}

function normalizeFilterValue(value) {
  return toText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function callGemini({ apiKeyCandidates, modelCandidates, prompt, timeoutMs, maxRetries }) {
  const errors = [];

  for (let round = 1; round <= maxRetries; round += 1) {
    for (let keyIndex = 0; keyIndex < apiKeyCandidates.length; keyIndex += 1) {
      const apiKey = apiKeyCandidates[keyIndex];
      for (const model of modelCandidates) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: {
                temperature: 0.6,
                topP: 0.95,
                responseMimeType: "application/json"
              }
            })
          });

          clearTimeout(timer);

          if (!response.ok) {
            const errorText = await response.text();
            const retryable = response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500;
            const errorMsg = `key=${keyIndex + 1}/${apiKeyCandidates.length} model=${model} HTTP ${response.status}: ${errorText}`;
            if (!retryable) {
              throw new Error(errorMsg);
            }

            errors.push(errorMsg);
            console.warn(`  Retry Gemini (round ${round}/${maxRetries}) - ${errorMsg}`);
            await sleep(Math.min(10000, 600 + round * 450));
            continue;
          }

          const data = await response.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const text = parts.map((part) => part?.text || "").join("\n").trim();

          if (!text) {
            const finishReason = data?.candidates?.[0]?.finishReason || "UNKNOWN";
            throw new Error(`key=${keyIndex + 1}/${apiKeyCandidates.length} model=${model} empty text. finishReason=${finishReason}`);
          }

          return parseJsonPayload(text);
        } catch (error) {
          clearTimeout(timer);
          const msg = `key=${keyIndex + 1}/${apiKeyCandidates.length} model=${model}: ${error.message}`;
          errors.push(msg);
          console.warn(`  Retry Gemini (round ${round}/${maxRetries}) - ${msg}`);
          await sleep(Math.min(10000, 700 + round * 500));
        }
      }
    }
  }

  const preview = errors.slice(-5).join(" | ");
  throw new Error(`Gemini call failed after failover retries. Last errors: ${preview}`);
}

function difficultyGuidance(difficulty) {
  switch (difficulty) {
    case "BEGINNER":
      return "Tập trung kiến thức nền tảng, thuật ngữ cơ bản, thao tác phổ biến trong công việc hằng ngày.";
    case "INTERMEDIATE":
      return "Tập trung triển khai thực tế, xử lý lỗi thông dụng, lựa chọn giải pháp hợp lý theo bối cảnh.";
    case "ADVANCED":
      return "Tập trung trade-off kỹ thuật, tối ưu hiệu năng/chất lượng, quyết định kiến trúc ở mức đội nhóm.";
    case "EXPERT":
      return "Tập trung bài toán phức tạp cấp hệ thống/doanh nghiệp, phân tích rủi ro và ra quyết định chiến lược.";
    default:
      return "";
  }
}

function buildPrompt({ skill, difficulty, count, forbiddenQuestions }) {
  const banned = forbiddenQuestions.length
    ? `\nKhong duoc trung hoac dien dat qua giong cac cau sau:\n${forbiddenQuestions
        .map((question, index) => `${index + 1}. ${question}`)
        .join("\n")}`
    : "";

  return [
    "Ban la chuyen gia xay dung ngan hang cau hoi danh gia nang luc nghe nghiep.",
    `Hay tao CHINH XAC ${count} cau hoi trac nghiem cho vai tro \"${skill.role}\", skill \"${skill.skillArea}\" va muc do \"${difficulty}\".`,
    "Yeu cau chat luong:",
    `- ${difficultyGuidance(difficulty)}`,
    "- Noi dung co y nghia thuc tien, khong lap lai, khong hoi meo vo nghia.",
    "- Moi cau co 4 lua chon ro rang, chi 1 dap an dung.",
    "- Explanation ngan gon, dung ban chat, giup hoc vien hieu ly do dap an.",
    "- Dung tieng Viet tu nhien (co the giu nguyen thuat ngu ky thuat tieng Anh khi can).",
    "Chu de can bao phu:",
    ...skill.focus.map((item) => `- ${item}`),
    "Rang buoc schema (bat buoc dung tuyet doi):",
    "- Tra ve DUY NHAT mot JSON array, khong markdown, khong van ban ngoai array.",
    "- Moi phan tu la object co day du key: questionText, options, correctAnswer, explanation, difficulty, skillArea, category.",
    "- options la array dung 4 string va phai bat dau lan luot bang: 'A. ', 'B. ', 'C. ', 'D. '.",
    "- correctAnswer chi duoc la 'A' hoac 'B' hoac 'C' hoac 'D'.",
    `- difficulty bat buoc = '${difficulty}' cho tat ca phan tu.`,
    `- skillArea bat buoc = '${skill.skillArea}' cho tat ca phan tu.`,
    "- category chi duoc la 1 trong 4 gia tri: KNOWLEDGE, SKILL, SITUATION, ANALYSIS.",
    "- Khong dung lua chon kieu 'Tat ca dap an deu dung' hoac 'Ca A va B'.",
    banned
  ].join("\n");
}

async function generateDifficultyQuestions({ apiKeyCandidates, modelCandidates, skill, difficulty, usedKeys, timeoutMs, maxRetries }) {
  const target = 25;
  const results = [];
  const localKeys = new Set();
  let attempt = 0;
  const maxBatchAttempts = 12;

  while (results.length < target && attempt < maxBatchAttempts) {
    attempt += 1;
    const remaining = target - results.length;
    const prompt = buildPrompt({
      skill,
      difficulty,
      count: remaining,
      forbiddenQuestions: results.map((item) => item.questionText).slice(-15)
    });

    const generated = await callGemini({
      apiKeyCandidates,
      modelCandidates,
      prompt,
      timeoutMs,
      maxRetries
    });

    if (!Array.isArray(generated)) {
      console.warn(`  ${difficulty}: invalid payload type, retrying...`);
      await sleep(1200);
      continue;
    }

    const normalized = generated
      .map((item, idx) => normalizeQuestion(item, skill, difficulty, results.length + idx))
      .filter(Boolean);

    for (const question of normalized) {
      const key = questionKey(question);
      if (!key || localKeys.has(key) || usedKeys.has(key)) {
        continue;
      }
      localKeys.add(key);
      results.push(question);
      if (results.length === target) {
        break;
      }
    }

    console.log(`  ${difficulty}: ${results.length}/${target} (attempt ${attempt})`);

    if (results.length < target) {
      await sleep(Math.min(6000, 700 + attempt * 400));
    }
  }

  if (results.length < target) {
    throw new Error(
      `${skill.skillArea} - ${difficulty} only generated ${results.length}/${target} valid unique questions.`
    );
  }

  return results;
}

function validateQuestionShape(question, expectedSkillArea) {
  if (typeof question?.questionText !== "string" || !question.questionText.trim()) {
    return "questionText is missing";
  }
  if (!Array.isArray(question?.options) || question.options.length !== 4) {
    return "options must contain exactly 4 entries";
  }
  for (let idx = 0; idx < question.options.length; idx += 1) {
    const expectedPrefix = `${OPTION_LETTERS[idx]}. `;
    if (typeof question.options[idx] !== "string" || !question.options[idx].startsWith(expectedPrefix)) {
      return `option ${idx + 1} prefix is invalid`;
    }
  }
  if (!OPTION_LETTERS.includes(question?.correctAnswer)) {
    return "correctAnswer must be A/B/C/D";
  }
  if (!DIFFICULTIES.includes(question?.difficulty)) {
    return "difficulty enum invalid";
  }
  if (question?.skillArea !== expectedSkillArea) {
    return `skillArea must be exactly '${expectedSkillArea}'`;
  }
  if (!CATEGORIES.includes(question?.category)) {
    return "category enum invalid";
  }
  if (typeof question?.explanation !== "string" || question.explanation.trim().length < 20) {
    return "explanation is too short";
  }
  return "";
}

function validateSkillFile(skill, questions) {
  const errors = [];
  if (!Array.isArray(questions)) {
    return { ok: false, errors: ["root must be a JSON array"] };
  }

  if (questions.length !== 100) {
    errors.push(`expected 100 questions, got ${questions.length}`);
  }

  const byDifficulty = {
    BEGINNER: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
    EXPERT: 0
  };
  const keys = new Set();

  questions.forEach((question, index) => {
    const shapeError = validateQuestionShape(question, skill.skillArea);
    if (shapeError) {
      errors.push(`#${index + 1}: ${shapeError}`);
      return;
    }

    byDifficulty[question.difficulty] += 1;

    const key = questionKey(question);
    if (keys.has(key)) {
      errors.push(`#${index + 1}: duplicate questionText detected`);
    }
    keys.add(key);
  });

  DIFFICULTIES.forEach((difficulty) => {
    if (byDifficulty[difficulty] !== 25) {
      errors.push(`${difficulty} must have 25 questions, got ${byDifficulty[difficulty]}`);
    }
  });

  return {
    ok: errors.length === 0,
    errors
  };
}

async function fileAlreadyValid(skill) {
  const fullPath = path.join(__dirname, skill.relativePath);
  try {
    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = JSON.parse(raw);
    const validation = validateSkillFile(skill, parsed);
    return validation.ok;
  } catch {
    return false;
  }
}

async function writeSkillFile(skill, questions) {
  const fullPath = path.join(__dirname, skill.relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(questions, null, 2) + "\n", "utf8");
}

async function generateOneSkill({ apiKeyCandidates, modelCandidates, skill, timeoutMs, maxRetries }) {
  const fileAttemptLimit = 3;
  for (let fileAttempt = 1; fileAttempt <= fileAttemptLimit; fileAttempt += 1) {
    try {
      console.log(`\nGenerating ${skill.skillArea} (${skill.relativePath}) [attempt ${fileAttempt}/${fileAttemptLimit}]`);

      const output = [];
      const usedKeys = new Set();

      for (const difficulty of DIFFICULTIES) {
        const batch = await generateDifficultyQuestions({
          apiKeyCandidates,
          modelCandidates,
          skill,
          difficulty,
          usedKeys,
          timeoutMs,
          maxRetries
        });

        batch.forEach((question) => {
          usedKeys.add(questionKey(question));
          output.push(question);
        });

        await sleep(900);
      }

      const validation = validateSkillFile(skill, output);
      if (!validation.ok) {
        throw new Error(`Validation failed: ${validation.errors.slice(0, 4).join(" | ")}`);
      }

      await writeSkillFile(skill, output);
      console.log(`  Done: wrote 100 questions to ${skill.relativePath}`);
      return;
    } catch (error) {
      if (fileAttempt === fileAttemptLimit) {
        throw error;
      }
      console.warn(`  File retry scheduled due to: ${error.message}`);
      await sleep(2000 * fileAttempt);
    }
  }
}

async function validateAllSkills(selectedSkills) {
  const report = [];
  let total = 0;

  for (const skill of selectedSkills) {
    const fullPath = path.join(__dirname, skill.relativePath);
    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = JSON.parse(raw);
    const validation = validateSkillFile(skill, parsed);

    report.push({ skill, validation, count: Array.isArray(parsed) ? parsed.length : 0 });
    total += Array.isArray(parsed) ? parsed.length : 0;
  }

  return { report, total };
}

async function main() {
  const apiKey = argValue("--api-key") || process.env.GEMINI_API_KEY;
  const apiKeysCsv = argValue("--api-keys") || process.env.GEMINI_API_KEYS || "";
  const model = argValue("--model") || process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const fallbackModelsCsv = argValue("--fallback-models") || process.env.GEMINI_FALLBACK_MODELS || "";
  const modelCandidates = buildModelCandidates(model, fallbackModelsCsv);
  const apiKeyCandidates = buildApiKeyCandidates(apiKey, apiKeysCsv);
  const roleFilter = normalizeFilterValue(argValue("--role") || process.env.GEMINI_ROLE || "");
  const timeoutMs = Number(argValue("--timeout-ms") || process.env.GEMINI_TIMEOUT_MS || 90000);
  const maxRetries = Number(argValue("--max-retries") || process.env.GEMINI_MAX_RETRIES || 6);
  const force = hasFlag("--force");
  const onlyFilter = (argValue("--only") || "").trim().toLowerCase();

  if (apiKeyCandidates.length === 0) {
    console.error("No usable Gemini API keys found. Use --api-key and/or --api-keys, or set GEMINI_API_KEY/GEMINI_API_KEYS.");
    process.exit(1);
  }

  const selectedSkills = onlyFilter
    ? SKILLS.filter(
        (skill) =>
          skill.relativePath.toLowerCase().includes(onlyFilter) ||
          skill.skillArea.toLowerCase().includes(onlyFilter) ||
          skill.role.toLowerCase().includes(onlyFilter)
      )
    : SKILLS;

  const filteredSkills = roleFilter
    ? selectedSkills.filter((skill) => normalizeFilterValue(skill.role) === roleFilter)
    : selectedSkills;

  if (filteredSkills.length === 0) {
    console.error("No skill matched the active filters.");
    process.exit(1);
  }

  console.log(`Primary model: ${normalizeModelName(model)}`);
  console.log(`Failover models: ${modelCandidates.join(", ")}`);
  console.log(`API keys available: ${apiKeyCandidates.length}`);
  console.log(`Target files: ${filteredSkills.length}`);
  console.log(`Force overwrite: ${force ? "yes" : "no (skip valid files)"}`);

  for (const skill of filteredSkills) {
    if (!force && (await fileAlreadyValid(skill))) {
      console.log(`\nSkip valid file: ${skill.relativePath}`);
      continue;
    }

    await generateOneSkill({
      apiKeyCandidates,
      modelCandidates,
      skill,
      timeoutMs,
      maxRetries
    });
  }

  const { report, total } = await validateAllSkills(filteredSkills);
  const failed = report.filter((item) => !item.validation.ok);

  console.log("\nValidation summary:");
  for (const item of report) {
    if (item.validation.ok) {
      console.log(`  PASS ${item.skill.relativePath} (${item.count})`);
    } else {
      console.log(`  FAIL ${item.skill.relativePath}`);
      item.validation.errors.slice(0, 5).forEach((error) => {
        console.log(`    - ${error}`);
      });
    }
  }

  console.log(`\nTotal questions counted: ${total}`);

  if (failed.length > 0) {
    console.error(`Validation failed on ${failed.length} file(s).`);
    process.exit(1);
  }

  console.log("All selected skill files are valid.");
}

main().catch((error) => {
  console.error(`Fatal: ${error.message}`);
  process.exit(1);
});

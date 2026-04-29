Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$outputRoot = $PSScriptRoot

$difficulties = @("BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT")
$categories = @("KNOWLEDGE", "SKILL", "SITUATION", "ANALYSIS")
$letters = @("A", "B", "C", "D")

$distractorsByDifficulty = @{
    BEGINNER = @(
        "Start implementation before clarifying the requirement.",
        "Ignore team conventions and rely on personal style.",
        "Skip basic verification because the task looks simple.",
        "Assume defaults are always correct in every context.",
        "Treat edge cases as optional and never document them.",
        "Avoid asking for feedback to save short-term time."
    )
    INTERMEDIATE = @(
        "Implement everything in one pass without checkpoints.",
        "Optimize early without collecting a baseline first.",
        "Change scope frequently without updating acceptance criteria.",
        "Delay test coverage until after release pressure appears.",
        "Rely only on local success and skip environment parity checks.",
        "Prioritize speed while ignoring maintainability concerns."
    )
    ADVANCED = @(
        "Pick the most complex pattern without proving the need.",
        "Prioritize one metric while ignoring system-wide trade-offs.",
        "Copy a previous architecture without validating constraints.",
        "Assume scale behavior from small-sample observations.",
        "Accept risk informally without explicit mitigation planning.",
        "Treat operational signals as optional after launch."
    )
    EXPERT = @(
        "Depend on individual heroics instead of repeatable systems.",
        "Delegate critical decisions without ownership or audit trails.",
        "Handle incidents as isolated events without systemic fixes.",
        "Separate strategy from execution metrics and accountability.",
        "Prioritize short-term optics over long-term capability building.",
        "Apply governance inconsistently across teams and programs."
    )
}

$skillConfigs = @(
    [pscustomobject]@{
        Domain = "technology"
        Job = "backend-developer"
        Skill = "Server-side Languages"
        SkillSlug = "server-side-languages"
        FocusAreas = @("request handling", "business logic", "error handling", "module design", "code readability", "dependency management", "runtime behavior", "testability")
        Artifacts = @("service logs", "unit tests", "API responses", "code review notes", "trace data", "build output", "performance report", "incident timeline")
    }
    [pscustomobject]@{
        Domain = "technology"
        Job = "backend-developer"
        Skill = "Database Management"
        SkillSlug = "database-management"
        FocusAreas = @("schema design", "query quality", "index strategy", "transaction boundaries", "data integrity", "backup strategy", "migration safety", "access patterns")
        Artifacts = @("query plan", "slow query log", "migration script", "schema diff", "replication status", "audit record", "load-test result", "rollback plan")
    }
    [pscustomobject]@{
        Domain = "technology"
        Job = "backend-developer"
        Skill = "API Design (REST/GraphQL)"
        SkillSlug = "api-design-rest-graphql"
        FocusAreas = @("resource modeling", "contract consistency", "versioning strategy", "pagination", "error semantics", "query flexibility", "payload design", "consumer experience")
        Artifacts = @("OpenAPI spec", "schema registry", "consumer feedback", "contract test", "latency dashboard", "breaking-change report", "support ticket trend", "integration checklist")
    }
    [pscustomobject]@{
        Domain = "technology"
        Job = "backend-developer"
        Skill = "Security"
        SkillSlug = "security"
        FocusAreas = @("authentication", "authorization", "input validation", "secret handling", "auditability", "threat modeling", "dependency risk", "incident response")
        Artifacts = @("security scan", "access log", "threat model", "policy checklist", "vulnerability report", "incident postmortem", "key rotation log", "compliance evidence")
    }
    [pscustomobject]@{
        Domain = "technology"
        Job = "frontend-developer"
        Skill = "HTML/CSS Fundamentals"
        SkillSlug = "html-css-fundamentals"
        FocusAreas = @("semantic structure", "layout techniques", "responsive behavior", "selector strategy", "accessibility basics", "spacing system", "component styling", "cross-browser consistency")
        Artifacts = @("style guide", "devtools audit", "accessibility report", "visual diff", "browser matrix", "component snapshot", "design handoff", "lint output")
    }
    [pscustomobject]@{
        Domain = "technology"
        Job = "frontend-developer"
        Skill = "JavaScript/TypeScript"
        SkillSlug = "javascript-typescript"
        FocusAreas = @("type safety", "state updates", "async flow", "error boundaries", "module boundaries", "data transformation", "testing approach", "code maintainability")
        Artifacts = @("type checker output", "unit test report", "runtime trace", "bundle analysis", "review comments", "bug timeline", "profiling session", "CI logs")
    }
    [pscustomobject]@{
        Domain = "technology"
        Job = "frontend-developer"
        Skill = "UI Frameworks (React/Vue)"
        SkillSlug = "ui-frameworks-react-vue"
        FocusAreas = @("component composition", "state management", "render lifecycle", "props and contracts", "routing patterns", "form handling", "side effects", "reusability")
        Artifacts = @("component test", "render profiler", "state trace", "storybook example", "router map", "error boundary log", "interaction replay", "code review checklist")
    }
    [pscustomobject]@{
        Domain = "technology"
        Job = "frontend-developer"
        Skill = "Web Performance"
        SkillSlug = "web-performance"
        FocusAreas = @("asset loading", "render blocking", "runtime cost", "caching strategy", "bundle splitting", "image optimization", "network efficiency", "core web vitals")
        Artifacts = @("Lighthouse report", "Web Vitals dashboard", "network waterfall", "bundle size report", "RUM data", "profiling flamechart", "cache headers", "A/B comparison")
    }
    [pscustomobject]@{
        Domain = "business"
        Job = "b2b-sales"
        Skill = "Lead Generation"
        SkillSlug = "lead-generation"
        FocusAreas = @("ideal customer profile", "outbound messaging", "channel selection", "qualification criteria", "campaign cadence", "list hygiene", "pipeline velocity", "response analysis")
        Artifacts = @("CRM report", "outreach sequence", "campaign dashboard", "qualification scorecard", "funnel metrics", "meeting conversion chart", "lead source breakdown", "call notes")
    }
    [pscustomobject]@{
        Domain = "business"
        Job = "b2b-sales"
        Skill = "Consultative Selling"
        SkillSlug = "consultative-selling"
        FocusAreas = @("discovery questioning", "problem framing", "value articulation", "stakeholder mapping", "objection handling", "solution alignment", "business case", "decision criteria")
        Artifacts = @("discovery transcript", "value map", "stakeholder matrix", "proposal draft", "objection log", "ROI worksheet", "meeting recap", "deal review")
    }
    [pscustomobject]@{
        Domain = "business"
        Job = "b2b-sales"
        Skill = "B2B Relationship Building"
        SkillSlug = "b2b-relationship-building"
        FocusAreas = @("trust development", "account planning", "multi-threading", "communication rhythm", "expectation management", "executive alignment", "renewal readiness", "long-term value")
        Artifacts = @("account plan", "stakeholder map", "health score", "quarterly review", "success plan", "escalation log", "retention metrics", "reference feedback")
    }
    [pscustomobject]@{
        Domain = "business"
        Job = "b2b-sales"
        Skill = "Sales Cycle Management"
        SkillSlug = "sales-cycle-management"
        FocusAreas = @("stage definitions", "pipeline hygiene", "forecast accuracy", "deal qualification", "risk tracking", "handoff quality", "win-loss analysis", "execution discipline")
        Artifacts = @("pipeline dashboard", "forecast review", "stage exit checklist", "deal risk register", "close plan", "handoff packet", "win-loss summary", "activity timeline")
    }
    [pscustomobject]@{
        Domain = "design"
        Job = "brand-designer"
        Skill = "Logo Design"
        SkillSlug = "logo-design"
        FocusAreas = @("concept clarity", "shape language", "scalability", "memorability", "color intent", "negative space", "symbol-system fit", "usage flexibility")
        Artifacts = @("moodboard", "concept sketch", "grid study", "contrast test", "application mockup", "stakeholder feedback", "production export", "revision log")
    }
    [pscustomobject]@{
        Domain = "design"
        Job = "brand-designer"
        Skill = "Brand Guidelines"
        SkillSlug = "brand-guidelines"
        FocusAreas = @("voice and tone", "logo usage rules", "color system", "typography system", "layout principles", "imagery direction", "do-and-dont examples", "governance process")
        Artifacts = @("brand handbook", "template library", "compliance review", "design QA sheet", "approval workflow", "asset repository", "feedback round", "rollout checklist")
    }
    [pscustomobject]@{
        Domain = "design"
        Job = "brand-designer"
        Skill = "Visual Identity Systems"
        SkillSlug = "visual-identity-systems"
        FocusAreas = @("system coherence", "modular components", "cross-channel adaptability", "hierarchy rules", "iconography", "pattern language", "brand consistency", "scaling framework")
        Artifacts = @("identity toolkit", "component matrix", "channel adaptation guide", "consistency audit", "asset spec", "production checklist", "implementation examples", "governance notes")
    }
    [pscustomobject]@{
        Domain = "design"
        Job = "brand-designer"
        Skill = "Typography"
        SkillSlug = "typography"
        FocusAreas = @("type pairing", "readability", "hierarchy", "spacing rhythm", "alignment discipline", "responsive scaling", "brand personality", "accessibility contrast")
        Artifacts = @("type scale", "layout sample", "readability test", "contrast matrix", "style token sheet", "design review", "implementation snapshot", "usage audit")
    }
)

function New-CorrectOption {
    param(
        [string]$Difficulty,
        [string]$FocusA,
        [string]$FocusB,
        [string]$Artifact
    )

    switch ($Difficulty) {
        "BEGINNER" {
            return "Clarify the requirement, apply basic ${FocusA} practice, and verify with a simple check in ${Artifact}."
        }
        "INTERMEDIATE" {
            return "Define acceptance criteria for ${FocusA}, implement incrementally, and validate outcomes using ${Artifact}."
        }
        "ADVANCED" {
            return "Evaluate trade-offs between ${FocusA} and ${FocusB}, then justify the decision with reliability, cost, and maintainability data from ${Artifact}."
        }
        default {
            return "Establish organization-wide guardrails for ${FocusA}, align stakeholders, and operationalize continuous governance with metrics from ${Artifact}."
        }
    }
}

function New-QuestionText {
    param(
        [string]$Skill,
        [string]$Difficulty,
        [int]$QuestionIndex,
        [string]$FocusA,
        [string]$FocusB
    )

    switch ($Difficulty) {
        "BEGINNER" {
            return "[${Skill}][${Difficulty}][Q${QuestionIndex}] Which approach best demonstrates a strong foundation when working on ${FocusA} with attention to ${FocusB}?"
        }
        "INTERMEDIATE" {
            return "[${Skill}][${Difficulty}][Q${QuestionIndex}] A teammate is implementing ${FocusA}. Which next step most reliably improves delivery quality while keeping ${FocusB} under control?"
        }
        "ADVANCED" {
            return "[${Skill}][${Difficulty}][Q${QuestionIndex}] In a complex initiative, which decision best balances long-term scalability and risk across ${FocusA} and ${FocusB}?"
        }
        default {
            return "[${Skill}][${Difficulty}][Q${QuestionIndex}] At organization scale, which action reflects expert-level leadership for governing ${FocusA} and ${FocusB}?"
        }
    }
}

foreach ($config in $skillConfigs) {
    $targetDir = Join-Path $outputRoot (Join-Path $config.Domain $config.Job)
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

    $questions = New-Object System.Collections.Generic.List[object]

    for ($d = 0; $d -lt $difficulties.Count; $d++) {
        $difficulty = $difficulties[$d]
        $distractors = $distractorsByDifficulty[$difficulty]

        for ($i = 1; $i -le 25; $i++) {
            $overallIndex = ($d * 25) + $i
            $focusA = $config.FocusAreas[($overallIndex - 1) % $config.FocusAreas.Count]
            $focusB = $config.FocusAreas[($overallIndex + 2) % $config.FocusAreas.Count]
            $artifact = $config.Artifacts[($overallIndex + 1) % $config.Artifacts.Count]

            $correct = New-CorrectOption -Difficulty $difficulty -FocusA $focusA -FocusB $focusB -Artifact $artifact
            $d1 = $distractors[($overallIndex - 1) % $distractors.Count]
            $d2 = $distractors[($overallIndex + 1) % $distractors.Count]
            $d3 = $distractors[($overallIndex + 3) % $distractors.Count]

            $correctIndex = ($overallIndex + $d) % 4
            $rawOptions = @("", "", "", "")
            $rawOptions[$correctIndex] = $correct

            $distractorCursor = 0
            foreach ($idx in 0..3) {
                if ($idx -ne $correctIndex) {
                    switch ($distractorCursor) {
                        0 { $rawOptions[$idx] = $d1 }
                        1 { $rawOptions[$idx] = $d2 }
                        default { $rawOptions[$idx] = $d3 }
                    }
                    $distractorCursor++
                }
            }

            $options = @()
            foreach ($idx in 0..3) {
                $options += "{0}. {1}" -f $letters[$idx], $rawOptions[$idx]
            }

            $question = [ordered]@{
                questionText = New-QuestionText -Skill $config.Skill -Difficulty $difficulty -QuestionIndex $overallIndex -FocusA $focusA -FocusB $focusB
                options = $options
                correctAnswer = $letters[$correctIndex]
                explanation = "The best answer applies ${difficulty}-level judgement for $($config.Skill) by combining ${focusA}, ${focusB}, and evidence from ${artifact}."
                difficulty = $difficulty
                skillArea = $config.Skill
                category = $categories[($overallIndex + $d) % $categories.Count]
            }

            $questions.Add($question)
        }
    }

    $targetFile = Join-Path $targetDir ($config.SkillSlug + ".json")
    $questions | ConvertTo-Json -Depth 8 | Set-Content -Path $targetFile -Encoding UTF8
    Write-Host "Generated $targetFile ($($questions.Count) questions)"
}

Write-Host "Done. Quiz skill dataset generated under: $outputRoot"
#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const CATEGORIES = ["KNOWLEDGE", "SKILL", "SITUATION", "ANALYSIS"];
const OPTION_LETTERS = ["A", "B", "C", "D"];

const SKILLS = [
  { skillArea: "Server-side Languages", relativePath: "technology/backend-developer/server-side-languages.json" },
  { skillArea: "Database Management", relativePath: "technology/backend-developer/database-management.json" },
  { skillArea: "API Design (REST/GraphQL)", relativePath: "technology/backend-developer/api-design-rest-graphql.json" },
  { skillArea: "Security", relativePath: "technology/backend-developer/security.json" },
  { skillArea: "HTML/CSS Fundamentals", relativePath: "technology/frontend-developer/html-css-fundamentals.json" },
  { skillArea: "JavaScript/TypeScript", relativePath: "technology/frontend-developer/javascript-typescript.json" },
  { skillArea: "UI Frameworks (React/Vue)", relativePath: "technology/frontend-developer/ui-frameworks-react-vue.json" },
  { skillArea: "Web Performance", relativePath: "technology/frontend-developer/web-performance.json" },
  { skillArea: "Lead Generation", relativePath: "business/b2b-sales/lead-generation.json" },
  { skillArea: "Consultative Selling", relativePath: "business/b2b-sales/consultative-selling.json" },
  { skillArea: "B2B Relationship Building", relativePath: "business/b2b-sales/b2b-relationship-building.json" },
  { skillArea: "Sales Cycle Management", relativePath: "business/b2b-sales/sales-cycle-management.json" },
  { skillArea: "Logo Design", relativePath: "design/brand-designer/logo-design.json" },
  { skillArea: "Brand Guidelines", relativePath: "design/brand-designer/brand-guidelines.json" },
  { skillArea: "Visual Identity Systems", relativePath: "design/brand-designer/visual-identity-systems.json" },
  { skillArea: "Typography", relativePath: "design/brand-designer/typography.json" }
];

function questionKey(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function validateQuestion(question, expectedSkillArea, idx) {
  const errors = [];

  if (typeof question?.questionText !== "string" || !question.questionText.trim()) {
    errors.push(`#${idx}: questionText missing`);
  }

  if (!Array.isArray(question?.options) || question.options.length !== 4) {
    errors.push(`#${idx}: options must have 4 items`);
  } else {
    question.options.forEach((option, optionIndex) => {
      const expectedPrefix = `${OPTION_LETTERS[optionIndex]}. `;
      if (typeof option !== "string" || !option.startsWith(expectedPrefix)) {
        errors.push(`#${idx}: option ${optionIndex + 1} invalid prefix`);
      }
    });
  }

  if (!OPTION_LETTERS.includes(question?.correctAnswer)) {
    errors.push(`#${idx}: correctAnswer must be A-D`);
  }

  if (!DIFFICULTIES.includes(question?.difficulty)) {
    errors.push(`#${idx}: difficulty invalid`);
  }

  if (question?.skillArea !== expectedSkillArea) {
    errors.push(`#${idx}: skillArea must be '${expectedSkillArea}'`);
  }

  if (!CATEGORIES.includes(question?.category)) {
    errors.push(`#${idx}: category invalid`);
  }

  if (typeof question?.explanation !== "string" || question.explanation.trim().length < 20) {
    errors.push(`#${idx}: explanation too short`);
  }

  return errors;
}

async function validateFile(skill) {
  const fullPath = path.join(__dirname, skill.relativePath);
  const errors = [];

  let data;
  try {
    const raw = await fs.readFile(fullPath, "utf8");
    data = JSON.parse(raw);
  } catch (error) {
    return { ok: false, count: 0, errors: [`Cannot read/parse: ${error.message}`] };
  }

  if (!Array.isArray(data)) {
    return { ok: false, count: 0, errors: ["Root must be a JSON array"] };
  }

  if (data.length !== 100) {
    errors.push(`Expected 100 questions, got ${data.length}`);
  }

  const byDifficulty = {
    BEGINNER: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
    EXPERT: 0
  };

  const uniqueSet = new Set();

  data.forEach((question, idx) => {
    errors.push(...validateQuestion(question, skill.skillArea, idx + 1));
    if (DIFFICULTIES.includes(question?.difficulty)) {
      byDifficulty[question.difficulty] += 1;
    }

    const key = questionKey(question?.questionText);
    if (key) {
      if (uniqueSet.has(key)) {
        errors.push(`#${idx + 1}: duplicate questionText`);
      }
      uniqueSet.add(key);
    }
  });

  DIFFICULTIES.forEach((difficulty) => {
    if (byDifficulty[difficulty] !== 25) {
      errors.push(`${difficulty} expected 25, got ${byDifficulty[difficulty]}`);
    }
  });

  return { ok: errors.length === 0, count: data.length, errors };
}

async function main() {
  const only = (process.argv[2] || "").toLowerCase().trim();
  const selected = only
    ? SKILLS.filter(
        (item) =>
          item.relativePath.toLowerCase().includes(only) ||
          item.skillArea.toLowerCase().includes(only)
      )
    : SKILLS;

  if (!selected.length) {
    console.error("No skill file matched filter.");
    process.exit(1);
  }

  let total = 0;
  let failed = 0;

  for (const skill of selected) {
    const result = await validateFile(skill);
    total += result.count;

    if (result.ok) {
      console.log(`PASS ${skill.relativePath} (${result.count})`);
    } else {
      failed += 1;
      console.log(`FAIL ${skill.relativePath}`);
      result.errors.slice(0, 8).forEach((err) => console.log(`  - ${err}`));
    }
  }

  console.log(`\nChecked files: ${selected.length}`);
  console.log(`Total questions: ${total}`);

  if (failed > 0) {
    console.log(`Validation failed: ${failed} file(s)`);
    process.exit(1);
  }

  console.log("Validation passed.");
}

main().catch((error) => {
  console.error(`Fatal: ${error.message}`);
  process.exit(1);
});

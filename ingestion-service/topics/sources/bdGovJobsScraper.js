/**
 * Bangladesh Government Jobs Scraper — specialized for Grade 9-1 circulars.
 *
 * This scraper targets high-quality job aggregators that provide text-based
 * summaries of government circulars, enabling keyword matching for grades.
 *
 * Primary Source: bdgovtjob.net (Category: Government Jobs)
 */

import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { evaluateQuery } from "../utils/parseQuery.js";

const TARGET_URL = "https://bdgovtjob.net/category/government-jobs-circular/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Detects the job grade based on text content.
 * Looks for Bengali and English grade markers.
 */
function detectGrade(text) {
  const content = text.toLowerCase();

  // Grade 9 markers
  if (
    content.includes("৯ম গ্রেড") ||
    content.includes("9th grade") ||
    content.includes("নবম গ্রেড") ||
    content.includes("গ্রেড-৯") ||
    content.includes("grade-9") ||
    content.includes("22,000") // Basic pay for Grade 9
  ) {
    return 9;
  }

  // Grade 1-8 markers
  if (
    content.includes("১ম গ্রেড") ||
    content.includes("1st grade") ||
    content.includes("প্রথম গ্রেড")
  )
    return 1;
  if (
    content.includes("২য় গ্রেড") ||
    content.includes("2nd grade") ||
    content.includes("দ্বিতীয় গ্রেড")
  )
    return 2;
  if (
    content.includes("৩য় গ্রেড") ||
    content.includes("3rd grade") ||
    content.includes("তৃতীয় গ্রেড")
  )
    return 3;
  if (
    content.includes("৪র্থ গ্রেড") ||
    content.includes("4th grade") ||
    content.includes("চতুর্থ গ্রেড")
  )
    return 4;
  if (
    content.includes("৫ম গ্রেড") ||
    content.includes("5th grade") ||
    content.includes("পঞ্চম গ্রেড")
  )
    return 5;
  if (
    content.includes("৬ষ্ঠ গ্রেড") ||
    content.includes("6th grade") ||
    content.includes("ষষ্ঠ গ্রেড")
  )
    return 6;
  if (
    content.includes("৭ম গ্রেড") ||
    content.includes("7th grade") ||
    content.includes("সপ্তম গ্রেড")
  )
    return 7;
  if (
    content.includes("৮ম গ্রেড") ||
    content.includes("8th grade") ||
    content.includes("অষ্টম গ্রেড")
  )
    return 8;

  // Higher Grades (10-20) if needed, but we focus on 1-9
  if (content.includes("১০ম গ্রেড") || content.includes("10th grade"))
    return 10;

  return null;
}

/**
 * Extracts organization name from title if possible.
 */
function extractOrganization(title) {
  // Common patterns: "X পদে Y এ নিয়োগ", "Y নিয়োগ বিজ্ঞপ্তি"
  const orgPatterns = [
    /পদে\s+(.+?)\s+এ\s+নিয়োগ/i,
    /(.+?)\s+নিয়োগ\s+বিজ্ঞপ্তি/i,
    /(.+?)\s+Job\s+Circular/i,
  ];

  for (const pattern of orgPatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Fetches the detail page for a job to get richer information.
 */
async function fetchJobDetail(url) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract main content
    const content = $(".entry-content").text().trim();
    const cleanContent = content.replace(/\s+/g, " ");

    // Look for application links (e.g., teletalk)
    let applyUrl = null;
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        (href.includes(".teletalk.com.bd") || href.includes(".gov.bd/apply"))
      ) {
        applyUrl = href;
        return false; // break
      }
    });

    return {
      fullText: cleanContent,
      applyUrl,
      html,
    };
  } catch (err) {
    console.error(
      `   ⚠️ [bdGovJobsScraper] Failed to fetch details for ${url}:`,
      err.message,
    );
    return null;
  }
}

/**
 * Scans for government jobs and filters by topic query.
 *
 * @param {object} topic - The LockedTopic record
 * @param {object} sourceConfig - { type: 'bd_gov_jobs', url, label }
 * @param {object} options
 * @returns {Array<object>} Normalized findings
 */
export async function scanBdGovJobs(topic, sourceConfig, options = {}) {
  const sourceName = sourceConfig.label || "BD Gov Jobs";
  console.log(`🔍 [bdGovJobsScraper] Checking for new government circulars...`);

  const lastScan = topic.lastScannedAt
    ? new Date(topic.lastScannedAt)
    : new Date(0);
  const findings = [];
  const limit = pLimit(3); // Limit detail page fetches to 3 concurrent requests

  try {
    // We might want to scan multiple pages if fullScan is on
    const pagesToScan = options.fullScan ? 3 : 1;
    let stopScanning = false;

    for (let p = 1; p <= pagesToScan; p++) {
      if (stopScanning) break;

      const url = p === 1 ? TARGET_URL : `${TARGET_URL}page/${p}/`;
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        if (p === 1)
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        break; // Stop if page not found
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const pageArticles = [];
      $("article").each((i, element) => {
        const $art = $(element);
        const title = $art.find(".entry-title a").text().trim();
        const url = $art.find(".entry-title a").attr("href");
        const publishedAtStr = $art.find("time.published").attr("datetime");
        const vacancy =
          $art.find(".job-info-box.job-vacancy .job-value").text().trim() ||
          $art.find(".job-vacancy .job-value").text().trim();
        const deadline =
          $art.find(".job-info-box.job-deadline .job-value").text().trim() ||
          $art.find(".job-deadline .job-value").text().trim();

        if (!url || !title) return;

        const pubDate = publishedAtStr ? new Date(publishedAtStr) : new Date();

        // Newness Check
        if (pubDate <= lastScan && !options.fullScan) {
          stopScanning = true;
          return;
        }

        pageArticles.push({ title, url, pubDate, vacancy, deadline });
      });

      // Fetch details for candidate articles
      const detailPromises = pageArticles.map((art) =>
        limit(async () => {
          const details = await fetchJobDetail(art.url);
          if (!details) return null;

          // 1. Intelligence: Extract Grade
          // We check title and full content
          const grade = detectGrade(art.title + " " + details.fullText);

          // 2. Intelligence: Extract Organization
          const organization = extractOrganization(art.title);

          // 3. Relevance Check
          // We check title, content, and organization against topic keywords
          const contentForMatching = (
            art.title +
            " " +
            details.fullText +
            " " +
            (organization || "") +
            " " +
            (grade ? `Grade ${grade} ৯ম ১ম` : "")
          ).toLowerCase();

          const isMatch = evaluateQuery(topic, contentForMatching);

          if (isMatch) {
            const gradeMarker = grade ? `[Grade ${grade}]` : "";
            return {
              title: `[Gov Job] ${gradeMarker} ${art.title}`,
              sourceUrl: art.url,
              sourceName: sourceName,
              summary: `Organization: ${organization || "N/A"}\nVacancy: ${art.vacancy || "N/A"}\nDeadline: ${art.deadline || "N/A"}\n\n${details.fullText.slice(0, 500)}...`,
              rawArticleId: null,
              sourceType: "BD_GOV_JOBS",
              publishedAt: art.pubDate,
              metadata: {
                vacancy: art.vacancy,
                deadline: art.deadline,
                grade,
                organization,
                applyUrl: details.applyUrl,
                isGovernment: true,
              },
            };
          }
          return null;
        }),
      );

      const pageFindings = (await Promise.all(detailPromises)).filter(Boolean);
      findings.push(...pageFindings);
    }

    console.log(
      `   📊 [bdGovJobsScraper] Found ${findings.length} matching circulars.`,
    );
    return { findings, metadata: {} };
  } catch (err) {
    console.error(`❌ [bdGovJobsScraper] Failed during scan:`, err.message);
    return { findings: [], metadata: {} };
  }
}

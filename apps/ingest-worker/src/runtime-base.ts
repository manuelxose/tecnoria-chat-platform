// @ts-nocheck
import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { Pool } from "pg";
import { inferLanguage, normalizeDocumentText, splitIntoSemanticChunks } from "@tecnoria-chat/core";
import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";
import { Client as NotionClient } from "@notionhq/client";
import { PDFParse } from "pdf-parse";
const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    FETCH_TIMEOUT_MS: z.coerce.number().default(15000),
    CRAWLER_USER_AGENT: z.string().default("TalkarisIngest/0.1 (+https://talkaris.com)"),
    YOUTUBE_API_KEY: z.string().optional(),
    NOTION_TOKEN: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),
});
const env = envSchema.parse(process.env);
const pool = new Pool({ connectionString: env.DATABASE_URL });
function hashText(input) {
    return createHash("sha256").update(input).digest("hex");
}
function compilePattern(pattern) {
    try {
        return new RegExp(pattern, "i");
    }
    catch {
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(escaped, "i");
    }
}
function urlAllowed(url, allowedDomains) {
    if (!allowedDomains.length) {
        return true;
    }
    const hostname = new URL(url).hostname;
    return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}
function shouldInclude(url, includePatterns, excludePatterns) {
    const included = includePatterns.length === 0 || includePatterns.some((pattern) => compilePattern(pattern).test(url));
    if (!included) {
        return false;
    }
    return !excludePatterns.some((pattern) => compilePattern(pattern).test(url));
}
function inferCategoryFromUrl(url, fallback) {
    const pathname = new URL(url).pathname;
    if (pathname.includes("/servicios/"))
        return "servicios";
    if (pathname.includes("/faq"))
        return "faq";
    if (pathname.includes("/blog"))
        return "blog";
    if (pathname.includes("/contacto"))
        return "contacto";
    return fallback;
}
function decodeHtml(input) {
    return input
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}
function extractTagText(html, tag) {
    const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    return match ? decodeHtml(match[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() : "";
}
function extractCanonical(html, fallback) {
    const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
        ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
    return match?.[1]?.trim() || fallback;
}
function stripToMeaningfulText(html) {
    return decodeHtml(html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<(nav|footer|header|aside|noscript|form)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<!--([\s\S]*?)-->/g, " ")
        .replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim();
}
function deriveTitleFromUrl(url) {
    try {
        const pathname = new URL(url).pathname;
        const last = pathname.split("/").filter(Boolean).pop() ?? url;
        const cleaned = decodeURIComponent(last).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        return cleaned || url;
    }
    catch {
        return url;
    }
}
function extractMarkdownTitle(text, url) {
    const heading = text.match(/^\s{0,3}#\s+(.+)$/m)?.[1]?.trim();
    return heading || deriveTitleFromUrl(url);
}
function extractTextDocument(url, text, defaultCategory, headers, sourceType) {
    const normalized = normalizeDocumentText(text);
    const title = sourceType === "markdown" ? extractMarkdownTitle(normalized, url) : deriveTitleFromUrl(url);
    const category = inferCategoryFromUrl(url, defaultCategory);
    return {
        canonicalUrl: url,
        title,
        h1: title,
        language: inferLanguage(normalized, "es"),
        text: normalized,
        docType: sourceType,
        sectionPath: [title],
        category,
        metadata: {
            title,
            category: category ?? "general",
            sourceType,
        },
        rawChecksum: hashText(normalized),
        etag: headers.etag ?? null,
        lastModified: headers.lastModified ?? null,
    };
}
async function extractPdfDocument(job, url, fetched, headers) {
    const parser = new PDFParse({ data: fetched.buffer });
    try {
        const result = await parser.getText();
        const normalized = normalizeDocumentText(result.text ?? "");
        const title = result.info?.Title?.trim() || deriveTitleFromUrl(url);
        const category = inferCategoryFromUrl(url, job.default_category);
        return {
            canonicalUrl: url,
            title,
            h1: title,
            language: inferLanguage(normalized, "es"),
            text: normalized,
            docType: "pdf",
            sectionPath: [title],
            category,
            metadata: {
                title,
                category: category ?? "general",
                pages: result.total,
                sourceType: "pdf",
            },
            rawChecksum: hashText(normalized),
            etag: headers.etag ?? null,
            lastModified: headers.lastModified ?? null,
        };
    }
    finally {
        await parser.destroy();
    }
}
async function fetchText(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            headers: { "user-agent": env.CRAWLER_USER_AGENT },
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`Fetch failed for ${url}: ${response.status}`);
        }
        const clone = response.clone();
        const buffer = Buffer.from(await response.arrayBuffer());
        let body = "";
        try {
            body = await clone.text();
        }
        catch {
            body = "";
        }
        return {
            body,
            buffer,
            etag: response.headers.get("etag"),
            lastModified: response.headers.get("last-modified"),
            contentType: response.headers.get("content-type"),
        };
    }
    finally {
        clearTimeout(timeout);
    }
}
function parseSitemap(xml) {
    const matches = [...xml.matchAll(/<url>(.*?)<\/url>/gms)];
    const urls = matches.map((match) => {
        const block = match[1];
        const url = block.match(/<loc>(.*?)<\/loc>/i)?.[1]?.trim();
        const lastModified = block.match(/<lastmod>(.*?)<\/lastmod>/i)?.[1]?.trim() ?? null;
        return url ? { url, lastModified } : null;
    });
    return urls.filter((item) => Boolean(item));
}
async function discoverUrls(job) {
    if (job.kind !== "sitemap") {
        return [{ url: job.entry_url }];
    }
    const { body } = await fetchText(job.entry_url);
    const allowedDomains = [...new Set([...(job.source_domains ?? []), ...(job.project_domains ?? [])])];
    return parseSitemap(body).filter((entry) => {
        return urlAllowed(entry.url, allowedDomains) && shouldInclude(entry.url, job.include_patterns ?? [], job.exclude_patterns ?? []);
    });
}
function extractDocument(url, html, defaultCategory, headers) {
    const title = extractTagText(html, "title") || extractTagText(html, "h1") || url;
    const h1 = extractTagText(html, "h1") || title;
    const canonicalUrl = extractCanonical(html, url);
    const text = stripToMeaningfulText(html);
    const language = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] || inferLanguage(text, "es");
    const category = inferCategoryFromUrl(canonicalUrl, defaultCategory);
    const metadata = {
        title,
        h1,
        category: category ?? "general",
    };
    return {
        canonicalUrl,
        title,
        h1,
        language,
        text,
        docType: "html",
        sectionPath: [h1],
        category,
        metadata,
        rawChecksum: hashText(text),
        etag: headers.etag ?? null,
        lastModified: headers.lastModified ?? null,
    };
}
async function claimNextJob() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`
        SELECT
          j.id,
          j.project_id,
          j.source_id,
          s.source_key,
          s.kind,
          s.entry_url,
          s.include_patterns,
          s.exclude_patterns,
          s.allowed_domains AS source_domains,
          s.visibility,
          s.default_category,
          s.source_config,
          p.allowed_domains AS project_domains
        FROM ingestion_jobs j
        INNER JOIN sources s ON s.id = j.source_id
        INNER JOIN projects p ON p.id = j.project_id
        WHERE j.status = 'queued'
        ORDER BY j.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `);
        if (!result.rowCount) {
            await client.query("ROLLBACK");
            return null;
        }
        const job = result.rows[0];
        await client.query(`UPDATE ingestion_jobs
       SET status = 'running', started_at = NOW(), error_text = NULL
       WHERE id = $1`, [job.id]);
        await client.query("COMMIT");
        return job;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
async function upsertDocument(client, job, document) {
    const normalizedText = normalizeDocumentText(document.text);
    if (!normalizedText) {
        return "skipped";
    }
    const existing = await client.query(`SELECT id, current_version, latest_checksum
     FROM documents
     WHERE project_id = $1 AND canonical_url = $2
     LIMIT 1`, [job.project_id, document.canonicalUrl]);
    let documentId;
    let nextVersion;
    if (!existing.rowCount) {
        const insertDocument = await client.query(`INSERT INTO documents (project_id, source_id, canonical_url, title, doc_type, language, category, visibility, current_version, latest_checksum, metadata, last_ingested_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, NULL, $9::jsonb, NOW())
       RETURNING id`, [
            job.project_id,
            job.source_id,
            document.canonicalUrl,
            document.title,
            document.docType,
            document.language,
            document.category,
            job.visibility,
            JSON.stringify(document.metadata),
        ]);
        documentId = insertDocument.rows[0].id;
        nextVersion = 1;
    }
    else {
        documentId = existing.rows[0].id;
        if (existing.rows[0].latest_checksum === document.rawChecksum) {
            await client.query(`UPDATE documents
         SET last_ingested_at = NOW(), updated_at = NOW(), metadata = $2::jsonb
         WHERE id = $1`, [documentId, JSON.stringify(document.metadata)]);
            return "skipped";
        }
        nextVersion = Number(existing.rows[0].current_version) + 1;
    }
    const versionInsert = await client.query(`INSERT INTO document_versions (document_id, version_no, checksum, etag, last_modified, raw_text, normalized_text, section_path, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
     RETURNING id`, [
        documentId,
        nextVersion,
        document.rawChecksum,
        document.etag ?? null,
        document.lastModified ?? null,
        document.text,
        normalizedText,
        document.sectionPath,
        JSON.stringify(document.metadata),
    ]);
    const documentVersionId = versionInsert.rows[0].id;
    const chunks = splitIntoSemanticChunks(normalizedText, document.sectionPath, {
        targetSize: 900,
        overlap: 120,
    });
    for (const chunk of chunks) {
        const tokenEstimate = Math.ceil(chunk.body.length / 4);
        await client.query(`INSERT INTO chunks (project_id, document_id, document_version_id, chunk_index, heading, body, section_path, tokens_estimate, search_vector)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_tsvector('simple', $9))`, [
            job.project_id,
            documentId,
            documentVersionId,
            chunk.orderIndex,
            chunk.heading ?? null,
            chunk.body,
            chunk.sectionPath,
            tokenEstimate,
            `${chunk.heading ?? ""} ${chunk.body}`,
        ]);
    }
    await client.query(`UPDATE documents
     SET title = $2,
         doc_type = $3,
         language = $4,
         category = $5,
         visibility = $6,
         current_version = $7,
         latest_checksum = $8,
         metadata = $9::jsonb,
         last_ingested_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`, [
        documentId,
        document.title,
        document.docType,
        document.language,
        document.category,
        job.visibility,
        nextVersion,
        document.rawChecksum,
        JSON.stringify(document.metadata),
    ]);
    return "processed";
}
async function finishJob(jobId, status, summary, errorText) {
    await pool.query(`UPDATE ingestion_jobs
     SET status = $2,
         summary = $3::jsonb,
         error_text = $4,
         finished_at = NOW()
     WHERE id = $1`, [jobId, status, JSON.stringify(summary), errorText ?? null]);
}
// ── youtube handler ───────────────────────────────────────────────────────────
function extractYouTubeVideoId(url) {
    try {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be"))
            return u.pathname.slice(1).split("?")[0] || null;
        return u.searchParams.get("v");
    }
    catch {
        return null;
    }
}
function extractYouTubePlaylistId(url) {
    try {
        return new URL(url).searchParams.get("list");
    }
    catch {
        return null;
    }
}
async function listPlaylistVideoIds(playlistId) {
    const apiKey = env.YOUTUBE_API_KEY;
    if (!apiKey)
        return [];
    const ids = [];
    let pageToken;
    do {
        const params = new URLSearchParams({
            part: "snippet",
            playlistId,
            maxResults: "50",
            key: apiKey,
            ...(pageToken ? { pageToken } : {}),
        });
        const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`, {
            signal: AbortSignal.timeout(env.FETCH_TIMEOUT_MS),
        });
        if (!res.ok)
            break;
        const data = (await res.json());
        for (const item of data.items ?? []) {
            const vid = item.snippet?.resourceId?.videoId;
            if (vid)
                ids.push(vid);
        }
        pageToken = data.nextPageToken;
    } while (pageToken);
    return ids;
}
async function fetchYouTube(job) {
    const cfg = job.source_config ?? {};
    const lang = cfg["lang"] ?? "es";
    const customTitle = cfg["title"];
    // Collect video IDs
    const videoIds = [];
    const playlistId = extractYouTubePlaylistId(job.entry_url);
    const directId = extractYouTubeVideoId(job.entry_url);
    if (playlistId) {
        const fromPlaylist = await listPlaylistVideoIds(playlistId);
        videoIds.push(...fromPlaylist);
        // Also add the video in the URL if present
        if (directId && !videoIds.includes(directId))
            videoIds.push(directId);
    }
    else if (directId) {
        videoIds.push(directId);
    }
    else {
        throw new Error(`Cannot extract video or playlist ID from URL: ${job.entry_url}`);
    }
    const docs = [];
    for (const videoId of videoIds) {
        try {
            const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
            if (!segments.length)
                continue;
            const rawText = segments.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim();
            const normalized = normalizeDocumentText(rawText);
            if (!normalized.trim())
                continue;
            const title = customTitle ?? `YouTube video ${videoId}`;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            docs.push({
                canonicalUrl: videoUrl,
                title,
                h1: title,
                language: inferLanguage(normalized, lang),
                text: normalized,
                docType: "youtube",
                sectionPath: [title],
                category: job.default_category,
                metadata: { title, videoId, sourceKey: job.source_key },
                rawChecksum: hashText(normalized),
                etag: null,
                lastModified: null,
            });
        }
        catch {
            // Skip videos without transcripts (private, restricted, etc.)
        }
    }
    return docs;
}
// ── notion handler ────────────────────────────────────────────────────────────
function extractNotionId(urlOrId) {
    // Strip hyphens and extract 32-char hex ID from URL or plain ID
    const raw = urlOrId.split("?")[0].split("#")[0];
    const last = raw.split("/").pop() ?? raw;
    const cleaned = last.replace(/-/g, "").slice(-32);
    // Re-insert hyphens: 8-4-4-4-12
    if (cleaned.length === 32) {
        return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20)}`;
    }
    return urlOrId;
}
function richTextToString(richText) {
    return richText.map((rt) => rt.plain_text).join("");
}
function blocksToText(blocks) {
    const lines = [];
    for (const block of blocks) {
        const type = block.type;
        const b = block;
        const content = b[type];
        const rt = content?.["rich_text"];
        const text = rt ? richTextToString(rt) : "";
        if (text.trim())
            lines.push(text);
    }
    return lines.join("\n");
}
async function fetchNotion(job) {
    const cfg = job.source_config ?? {};
    const token = cfg["token"] ?? env.NOTION_TOKEN;
    if (!token)
        throw new Error("Notion integration token required in source_config.token");
    const notion = new NotionClient({ auth: token });
    const notionId = extractNotionId(job.entry_url);
    const docs = [];
    // Try as data source (database) first, then as page
    let pageIds = [];
    try {
        const dbResult = await notion.dataSources.query({ data_source_id: notionId, page_size: 100 });
        pageIds = dbResult.results.map((r) => r.id);
    }
    catch {
        // Not a database — treat as single page
        pageIds = [notionId];
    }
    for (const pageId of pageIds) {
        try {
            const page = await notion.pages.retrieve({ page_id: pageId });
            const blocksResult = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
            const rawText = blocksToText(blocksResult.results);
            const normalized = normalizeDocumentText(rawText);
            if (!normalized.trim())
                continue;
            // Extract page title from properties
            const props = page["properties"];
            const titleProp = props?.["Name"] ?? props?.["title"] ?? props?.["Title"];
            const titleRt = titleProp?.["title"];
            const title = titleRt ? richTextToString(titleRt) : pageId;
            const pageUrl = `https://www.notion.so/${pageId.replace(/-/g, "")}`;
            docs.push({
                canonicalUrl: pageUrl,
                title,
                h1: title,
                language: inferLanguage(normalized, "es"),
                text: normalized,
                docType: "notion",
                sectionPath: [title],
                category: job.default_category,
                metadata: { title, pageId, sourceKey: job.source_key },
                rawChecksum: hashText(normalized),
                etag: null,
                lastModified: null,
            });
        }
        catch {
            // Skip inaccessible pages
        }
    }
    return docs;
}
// ── api_endpoint handler ──────────────────────────────────────────────────────
async function fetchApiEndpoint(job) {
    const cfg = job.source_config ?? {};
    const customHeaders = cfg["headers"] ?? {};
    const method = (cfg["method"] ?? "GET").toUpperCase();
    const body = cfg["body"] ? JSON.stringify(cfg["body"]) : undefined;
    const contentPath = cfg["contentPath"]; // e.g. "data.items"
    const response = await fetch(job.entry_url, {
        method,
        headers: {
            "User-Agent": env.CRAWLER_USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            ...customHeaders,
            ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body,
        signal: AbortSignal.timeout(env.FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
        throw new Error(`API endpoint returned ${response.status}: ${job.entry_url}`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    const rawText = await response.text();
    let textContent;
    if (contentType.includes("application/json") || rawText.trimStart().startsWith("{") || rawText.trimStart().startsWith("[")) {
        try {
            let data = JSON.parse(rawText);
            // Optionally navigate a nested path like "data.items"
            if (contentPath) {
                for (const key of contentPath.split(".")) {
                    data = data?.[key];
                }
            }
            // Flatten to text: if array of objects, join their string values; else JSON.stringify
            if (Array.isArray(data)) {
                textContent = data.map((item) => typeof item === "string" ? item : Object.values(item).filter(v => typeof v === "string").join("\n")).join("\n\n");
            }
            else if (typeof data === "string") {
                textContent = data;
            }
            else {
                textContent = JSON.stringify(data, null, 2);
            }
        }
        catch {
            textContent = rawText;
        }
    }
    else {
        textContent = rawText;
    }
    const normalized = normalizeDocumentText(textContent);
    if (!normalized.trim())
        return [];
    const title = cfg["title"] ?? job.source_key;
    const checksum = hashText(normalized);
    return [{
            canonicalUrl: job.entry_url,
            title,
            h1: title,
            language: inferLanguage(normalized, "es"),
            text: normalized,
            docType: "api_endpoint",
            sectionPath: [title],
            category: job.default_category,
            metadata: { title, sourceKey: job.source_key },
            rawChecksum: checksum,
            etag: null,
            lastModified: null,
        }];
}
async function fetchGeminiFile(job) {
    if (!env.GOOGLE_AI_API_KEY)
        throw new Error("GOOGLE_AI_API_KEY not configured");
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
    const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const cfg = job.source_config;
    const extractionPrompt = cfg.prompt ??
        "Extrae todo el contenido informativo de este archivo. Devuelve texto estructurado con secciones y puntos clave en el idioma original del contenido.";
    // Fetch the raw file bytes
    const resp = await fetch(job.entry_url, { signal: AbortSignal.timeout(120_000) });
    if (!resp.ok)
        throw new Error(`HTTP ${resp.status} fetching ${job.entry_url}`);
    const buffer = await resp.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = (cfg.mediaType ?? resp.headers.get("content-type") ?? "application/octet-stream");
    const result = await gemini.generateContent([
        extractionPrompt,
        { inlineData: { data: base64, mimeType } },
    ]);
    const text = result.response.text()?.trim();
    if (!text)
        return [];
    const title = cfg.title ?? job.entry_url.split("/").pop() ?? job.source_key;
    const checksum = hashText(text);
    const docType = mimeType.split("/")[0] ?? "media";
    return [{
            canonicalUrl: job.entry_url,
            title,
            h1: title,
            language: inferLanguage(text, "es"),
            text,
            docType,
            sectionPath: [title],
            category: job.default_category,
            metadata: { mimeType, source: "gemini_file", sourceKey: job.source_key },
            rawChecksum: checksum,
            etag: null,
            lastModified: null,
        }];
}
async function processJob(job) {
    const summary = {
        discovered: 0,
        fetched: 0,
        processed: 0,
        skipped: 0,
        failedUrls: [],
    };
    try {
        // notion: fetch pages from database or single page
        if (job.kind === "notion") {
            const client = await pool.connect();
            try {
                const docs = await fetchNotion(job);
                summary.discovered = docs.length;
                summary.fetched = docs.length;
                for (const doc of docs) {
                    const result = await upsertDocument(client, job, doc);
                    summary[result] += 1;
                }
            }
            finally {
                client.release();
            }
            await finishJob(job.id, "done", summary);
            return;
        }
        // youtube: fetch transcripts and index as documents
        if (job.kind === "youtube") {
            const client = await pool.connect();
            try {
                const docs = await fetchYouTube(job);
                summary.discovered = docs.length;
                summary.fetched = docs.length;
                for (const doc of docs) {
                    const result = await upsertDocument(client, job, doc);
                    summary[result] += 1;
                }
            }
            finally {
                client.release();
            }
            await finishJob(job.id, "done", summary);
            return;
        }
        // gemini_file: send media file to Gemini for multimodal extraction
        if (job.kind === "gemini_file") {
            const client = await pool.connect();
            try {
                const docs = await fetchGeminiFile(job);
                summary.discovered = docs.length;
                summary.fetched = docs.length;
                for (const doc of docs) {
                    const result = await upsertDocument(client, job, doc);
                    summary[result] += 1;
                }
            }
            finally {
                client.release();
            }
            await finishJob(job.id, "done", summary);
            return;
        }
        // api_endpoint: fetch once and index the response as a single document
        if (job.kind === "api_endpoint") {
            const client = await pool.connect();
            try {
                const docs = await fetchApiEndpoint(job);
                summary.discovered = docs.length;
                summary.fetched = docs.length;
                for (const doc of docs) {
                    const result = await upsertDocument(client, job, doc);
                    summary[result] += 1;
                }
            }
            finally {
                client.release();
            }
            await finishJob(job.id, "done", summary);
            return;
        }
        const urls = await discoverUrls(job);
        summary.discovered = urls.length;
        const client = await pool.connect();
        try {
            for (const entry of urls) {
                try {
                    const fetched = await fetchText(entry.url);
                    summary.fetched += 1;
                    if (!fetched.contentType?.includes("text/html") && job.kind === "sitemap") {
                        summary.skipped += 1;
                        continue;
                    }
                    const headers = {
                        etag: fetched.etag,
                        lastModified: fetched.lastModified ?? entry.lastModified,
                    };
                    let document;
                    if (job.kind === "pdf") {
                        document = await extractPdfDocument(job, entry.url, fetched, headers);
                    }
                    else if (job.kind === "markdown") {
                        document = extractTextDocument(entry.url, fetched.body, job.default_category, headers, "markdown");
                    }
                    else if (job.kind === "html") {
                        document = extractTextDocument(entry.url, fetched.body, job.default_category, headers, "html");
                    }
                    else {
                        document = extractDocument(entry.url, fetched.body, job.default_category, headers);
                    }
                    const result = await upsertDocument(client, job, document);
                    summary[result] += 1;
                }
                catch {
                    summary.failedUrls.push(entry.url);
                }
            }
        }
        finally {
            client.release();
        }
        await finishJob(job.id, "done", summary);
    }
    catch (error) {
        await finishJob(job.id, "failed", summary, error instanceof Error ? error.message : "Unknown ingestion error");
    }
}
async function runOnce() {
    const job = await claimNextJob();
    if (!job) {
        console.log("No queued ingestion jobs.");
        return;
    }
    console.log(`Processing ingestion job ${job.id} for source ${job.source_key}`);
    await processJob(job);
}
async function runLoop() {
    while (true) {
        await runOnce();
        await delay(15000);
    }
}
if (process.argv.includes("--watch")) {
    runLoop().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
else {
    runOnce()
        .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
        .finally(async () => {
        await pool.end();
    });
}

const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { Certificate, srfitem, srf_list } = require("../models");
const logger = require("./logger");

const CERT_DIRS = {
  certificate: path.resolve(__dirname, "../certificates"),
  observation: path.resolve(__dirname, "../certificates/Observation"),
  draft: path.resolve(__dirname, "../certificates/Draft"),
};

const FILE_FIELD_BY_TYPE = {
  certificate: "fileName",
  observation: "observationFileName",
  draft: "draftFileName",
};

/**
 * Format byte counts into human-readable units.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + " GB";
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " B";
}

/**
 * Safely delete a file within a whitelisted directory using basename only.
 * Ignores missing files (ENOENT).
 * @param {string} dirPath
 * @param {string} fileName
 * @returns {Promise<boolean>} true if deleted, false if missing/skipped
 */
async function safeUnlink(dirPath, fileName) {
  if (!fileName || typeof fileName !== "string") return false;
  const baseName = path.basename(fileName);
  if (!baseName || baseName === "." || baseName === "..") return false;

  const targetPath = path.join(dirPath, baseName);
  if (!targetPath.startsWith(dirPath + path.sep)) return false;

  try {
    await fs.promises.unlink(targetPath);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") return false;
    logger.warn(`[CERT_CLEANUP] Failed to unlink ${targetPath}: ${err.message}`);
    return false;
  }
}

/**
 * Determine whether a Certificate row represents a newer replacement than another.
 * @param {object} candidate
 * @param {object} currentBest
 * @returns {boolean}
 */
function isNewerCert(candidate, currentBest) {
  if (!currentBest) return true;
  const cTime = new Date(candidate.createdAt || 0).getTime();
  const bTime = new Date(currentBest.createdAt || 0).getTime();
  if (cTime !== bTime) return cTime > bTime;
  return Number(candidate.id) > Number(currentBest.id);
}

/**
 * Remove superseded Certificate rows and their old files on disk when a new
 * certificate is generated/uploaded for an SRF item.
 * Never removes files still referenced by the kept record or any other active record.
 *
 * @param {number|string} srfitemId
 * @param {number|string} keepCertificateId
 * @returns {Promise<{ removedCount: number, deletedFiles: Array<{ type: string, fileName: string }> }>}
 */
async function cleanupSupersededCertificates(srfitemId, keepCertificateId) {
  if (!srfitemId || !keepCertificateId) {
    return { removedCount: 0, deletedFiles: [] };
  }

  const supersededRows = await Certificate.findAll({
    where: {
      srfitemId,
      id: { [Op.ne]: keepCertificateId },
    },
    attributes: ["id", "fileName", "observationFileName", "draftFileName"],
  });

  if (!supersededRows || supersededRows.length === 0) {
    return { removedCount: 0, deletedFiles: [] };
  }

  const keepRow = await Certificate.findByPk(keepCertificateId, {
    attributes: ["id", "fileName", "observationFileName", "draftFileName"],
  });

  // Track filenames belonging to the kept certificate so an identical filename overwrite is never unlinked
  const protectedNames = {
    certificate: new Set(keepRow?.fileName ? [path.basename(keepRow.fileName)] : []),
    observation: new Set(keepRow?.observationFileName ? [path.basename(keepRow.observationFileName)] : []),
    draft: new Set(keepRow?.draftFileName ? [path.basename(keepRow.draftFileName)] : []),
  };

  const candidates = [];
  for (const row of supersededRows) {
    for (const [type, field] of Object.entries(FILE_FIELD_BY_TYPE)) {
      const name = row[field];
      if (name && !protectedNames[type].has(path.basename(name))) {
        candidates.push({ type, fileName: path.basename(name) });
      }
    }
  }

  const supersededIds = supersededRows.map((r) => r.id);
  await Certificate.destroy({ where: { id: supersededIds } });

  // Double-check no other Certificate row in the DB references any candidate filename
  const candidateNames = [...new Set(candidates.map((c) => c.fileName))];
  const stillReferenced = new Set();

  if (candidateNames.length > 0) {
    const refs = await Certificate.findAll({
      where: {
        [Op.or]: [
          { fileName: { [Op.in]: candidateNames } },
          { observationFileName: { [Op.in]: candidateNames } },
          { draftFileName: { [Op.in]: candidateNames } },
        ],
      },
      attributes: ["fileName", "observationFileName", "draftFileName"],
    });
    for (const ref of refs) {
      if (ref.fileName) stillReferenced.add(path.basename(ref.fileName));
      if (ref.observationFileName) stillReferenced.add(path.basename(ref.observationFileName));
      if (ref.draftFileName) stillReferenced.add(path.basename(ref.draftFileName));
    }
  }

  const deletedFiles = [];
  const seen = new Set();
  for (const item of candidates) {
    const key = `${item.type}:${item.fileName}`;
    if (seen.has(key) || stillReferenced.has(item.fileName)) continue;
    seen.add(key);

    const removed = await safeUnlink(CERT_DIRS[item.type], item.fileName);
    if (removed) deletedFiles.push(item);
  }

  if (supersededIds.length > 0 || deletedFiles.length > 0) {
    logger.info(
      `[CERT_CLEANUP] Auto-cleaned ${supersededIds.length} superseded Certificate row(s) and ${deletedFiles.length} old file(s) for srfitemId=${srfitemId}`
    );
  }

  return { removedCount: supersededIds.length, deletedFiles };
}

/**
 * Scan certificates/, certificates/Observation/, and certificates/Draft/ and compare
 * against active Certificate & srfitem records to classify unwanted/orphan files.
 *
 * Categories:
 *  - UNLINKED_ORPHAN: File exists on disk with no matching Certificate record in DB
 *  - SUPERSEDED: Older Certificate regeneration where a newer Certificate exists for the same active srfitem
 *  - DELETED_ITEM: File belongs to a soft-deleted (rstatus=0) or missing srfitem
 *
 * @param {object} [options]
 * @param {number} [options.graceMinutes=60] Protect files modified within this window
 * @returns {Promise<{ summary: object, items: Array<object> }>}
 */
async function scanUnwantedCertificateFiles({ graceMinutes = 60 } = {}) {
  const certs = await Certificate.findAll({
    attributes: ["id", "fileName", "observationFileName", "draftFileName", "srfitemId", "rstatus", "createdAt"],
  });

  const itemIds = [...new Set(certs.map((c) => c.srfitemId).filter(Boolean))];
  const srfItems = itemIds.length
    ? await srfitem.findAll({
        where: { srf_item_id: itemIds },
        attributes: ["srf_item_id", "srf_id", "rstatus", "identification_details", "certificate_no"],
        include: [
          {
            model: srf_list,
            as: "srf",
            attributes: ["srf_id", "srf_number"],
            required: false,
          },
        ],
      })
    : [];

  const itemMap = new Map();
  for (const it of srfItems) {
    itemMap.set(Number(it.srf_item_id), it);
  }

  // Find newest Certificate record per srfitemId
  const latestCertByItem = new Map();
  for (const cert of certs) {
    if (!cert.srfitemId) continue;
    const key = Number(cert.srfitemId);
    if (isNewerCert(cert, latestCertByItem.get(key))) {
      latestCertByItem.set(key, cert);
    }
  }

  const keepFiles = {
    certificate: new Set(),
    observation: new Set(),
    draft: new Set(),
  };

  // Map non-active filenames to metadata so disk scan can classify them accurately
  const fileMeta = {
    certificate: new Map(),
    observation: new Map(),
    draft: new Map(),
  };

  const staleDbSupersededIds = [];

  for (const cert of certs) {
    const linkedItem = cert.srfitemId ? itemMap.get(Number(cert.srfitemId)) : null;
    const isActiveItem = Boolean(linkedItem && Number(linkedItem.rstatus) === 1);
    const latestForItem = cert.srfitemId ? latestCertByItem.get(Number(cert.srfitemId)) : null;
    const isLatestRow = Boolean(latestForItem && Number(latestForItem.id) === Number(cert.id));

    if (isActiveItem && isLatestRow) {
      for (const [type, field] of Object.entries(FILE_FIELD_BY_TYPE)) {
        if (cert[field]) {
          keepFiles[type].add(path.basename(cert[field]));
        }
      }
      continue;
    }

    const category = isActiveItem ? "SUPERSEDED" : "DELETED_ITEM";
    if (category === "SUPERSEDED") {
      staleDbSupersededIds.push(cert.id);
    }

    const meta = {
      category,
      certificateId: cert.id,
      srfitemId: cert.srfitemId || null,
      srfId: linkedItem?.srf_id || null,
      srfNumber: linkedItem?.srf?.srf_number || null,
      certificateNo: linkedItem?.certificate_no || null,
      identificationDetails: linkedItem?.identification_details || null,
    };

    for (const [type, field] of Object.entries(FILE_FIELD_BY_TYPE)) {
      if (cert[field]) {
        const base = path.basename(cert[field]);
        if (!fileMeta[type].has(base)) {
          fileMeta[type].set(base, meta);
        }
      }
    }
  }

  const graceCutoffMs = Date.now() - Math.max(0, Number(graceMinutes) || 0) * 60 * 1000;
  const items = [];
  let protectedRecentCount = 0;
  let activeFileCount = 0;

  for (const [type, dirPath] of Object.entries(CERT_DIRS)) {
    let entries = [];
    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch (err) {
      if (err.code === "ENOENT") continue;
      throw err;
    }

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (entry.name.startsWith(".")) continue;

      const fileName = entry.name;
      if (keepFiles[type].has(fileName)) {
        activeFileCount++;
        continue;
      }

      const fullPath = path.join(dirPath, fileName);
      let stat;
      try {
        stat = await fs.promises.stat(fullPath);
      } catch {
        continue;
      }

      if (stat.mtimeMs > graceCutoffMs) {
        protectedRecentCount++;
        continue;
      }

      const meta = fileMeta[type].get(fileName);
      const category = meta ? meta.category : "UNLINKED_ORPHAN";

      items.push({
        key: `${type}:${fileName}`,
        fileName,
        type,
        category,
        sizeBytes: stat.size,
        sizeFormatted: formatBytes(stat.size),
        modifiedAt: stat.mtime,
        certificateId: meta?.certificateId || null,
        srfitemId: meta?.srfitemId || null,
        srfId: meta?.srfId || null,
        srfNumber: meta?.srfNumber || null,
        certificateNo: meta?.certificateNo || null,
        identificationDetails: meta?.identificationDetails || null,
      });
    }
  }

  // Sort largest/newest first for admin visibility
  items.sort((a, b) => b.sizeBytes - a.sizeBytes || new Date(b.modifiedAt) - new Date(a.modifiedAt));

  const byCategory = {
    UNLINKED_ORPHAN: { count: 0, bytes: 0, formatted: "0 B" },
    SUPERSEDED: { count: 0, bytes: 0, formatted: "0 B" },
    DELETED_ITEM: { count: 0, bytes: 0, formatted: "0 B" },
  };
  const byType = {
    certificate: { count: 0, bytes: 0, formatted: "0 B" },
    observation: { count: 0, bytes: 0, formatted: "0 B" },
    draft: { count: 0, bytes: 0, formatted: "0 B" },
  };

  let totalBytes = 0;
  for (const it of items) {
    totalBytes += it.sizeBytes;
    byCategory[it.category].count++;
    byCategory[it.category].bytes += it.sizeBytes;
    byType[it.type].count++;
    byType[it.type].bytes += it.sizeBytes;
  }

  for (const bucket of [...Object.values(byCategory), ...Object.values(byType)]) {
    bucket.formatted = formatBytes(bucket.bytes);
  }

  return {
    summary: {
      totalCount: items.length,
      totalBytes,
      totalFormatted: formatBytes(totalBytes),
      activeFileCount,
      protectedRecentCount,
      staleDbSupersededCount: staleDbSupersededIds.length,
      graceMinutes,
      byCategory,
      byType,
    },
    items,
    staleDbSupersededIds,
  };
}

/**
 * Safely delete unwanted/orphaned certificate and observation files after re-verifying
 * against a fresh live scan so active files can never be deleted.
 *
 * @param {object} params
 * @param {"selected"|"all_safe"} params.mode
 * @param {Array<string>} [params.selectedKeys] Array of "<type>:<fileName>" keys
 * @param {boolean} [params.includeDeletedItems=false] Whether all_safe also removes DELETED_ITEM files
 * @param {number} [params.graceMinutes=60]
 * @param {number|string} [params.userId]
 */
async function deleteUnwantedCertificateFiles({
  mode = "selected",
  selectedKeys = [],
  includeDeletedItems = false,
  graceMinutes = 60,
  userId = "unknown",
} = {}) {
  const { items, staleDbSupersededIds } = await scanUnwantedCertificateFiles({ graceMinutes });

  let targets = [];
  if (mode === "all_safe") {
    targets = items.filter(
      (it) =>
        it.category === "UNLINKED_ORPHAN" ||
        it.category === "SUPERSEDED" ||
        (includeDeletedItems && it.category === "DELETED_ITEM")
    );
  } else {
    const keySet = new Set(Array.isArray(selectedKeys) ? selectedKeys : []);
    targets = items.filter((it) => keySet.has(it.key));
  }

  let deletedCount = 0;
  let failedCount = 0;
  let freedBytes = 0;
  const affectedSupersededCertIds = new Set();

  for (const item of targets) {
    const ok = await safeUnlink(CERT_DIRS[item.type], item.fileName);
    if (ok) {
      deletedCount++;
      freedBytes += item.sizeBytes;
      if (item.category === "SUPERSEDED" && item.certificateId) {
        affectedSupersededCertIds.add(item.certificateId);
      }
    } else {
      failedCount++;
    }
  }

  // Clean up superseded DB rows whose files were removed (or all stale superseded rows in all_safe mode)
  let deletedDbRowsCount = 0;
  const dbIdsToRemove =
    mode === "all_safe" ? staleDbSupersededIds : [...affectedSupersededCertIds];

  if (dbIdsToRemove.length > 0) {
    // Only destroy a superseded DB row if none of its files still exist on disk
    const candidateRows = await Certificate.findAll({
      where: { id: dbIdsToRemove },
      attributes: ["id", "fileName", "observationFileName", "draftFileName"],
    });
    const safeRowIds = [];
    for (const row of candidateRows) {
      let anyExists = false;
      for (const [type, field] of Object.entries(FILE_FIELD_BY_TYPE)) {
        if (row[field]) {
          const p = path.join(CERT_DIRS[type], path.basename(row[field]));
          if (fs.existsSync(p)) {
            anyExists = true;
            break;
          }
        }
      }
      if (!anyExists) {
        safeRowIds.push(row.id);
      }
    }
    if (safeRowIds.length > 0) {
      deletedDbRowsCount = await Certificate.destroy({ where: { id: safeRowIds } });
    }
  }

  logger.info(
    `[ADMIN_CERT_CLEANUP] userId=${userId} mode=${mode} deletedFiles=${deletedCount} freed=${formatBytes(freedBytes)} deletedDbRows=${deletedDbRowsCount} failed=${failedCount}`
  );

  return {
    deletedCount,
    failedCount,
    freedBytes,
    freedFormatted: formatBytes(freedBytes),
    deletedDbRowsCount,
  };
}

module.exports = {
  CERT_DIRS,
  formatBytes,
  cleanupSupersededCertificates,
  scanUnwantedCertificateFiles,
  deleteUnwantedCertificateFiles,
};

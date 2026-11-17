/**
 * Simple in-memory tracker for long-running background tasks.
 * Stores objects with status: 'processing', 'completed', 'error'
 * as well as completed count and total items count.
 */

const progressMap = new Map();

module.exports = progressMap;

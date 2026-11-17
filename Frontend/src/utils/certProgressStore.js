// Simple event store for tracking background certificate regeneration job progress globally

export const START_CERT_JOB_EVENT = 'START_CERT_JOB_EVENT';

export const startCertRegenerationJob = (jobId) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(START_CERT_JOB_EVENT, { detail: { jobId } }));
  }
};

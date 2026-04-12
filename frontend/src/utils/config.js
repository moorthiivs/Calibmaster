
import configData from './config.json';

/**
 * Smart Configuration Manager
 * Prioritizes environment variables (VITE_*) for production deployments
 * Falls back to config.json for local development and non-URL settings
 */
const config = {
  ...configData,
  Calibmaster: {
    ...configData.Calibmaster,
    URL: import.meta.env.VITE_CALIBMASTER_URL || configData.Calibmaster.URL
  },
  CustomerPortal: {
    ...configData.CustomerPortal,
    URL: import.meta.env.VITE_CUSTOMERPORTAL_URL || configData.CustomerPortal.URL
  }
};

export default config;

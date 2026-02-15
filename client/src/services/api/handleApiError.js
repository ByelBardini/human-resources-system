import logger from "../../utils/logger.js";

export function handleApiError(err, defaultMessage) {
  logger.error(defaultMessage, err);

  return {
    message: err?.response?.data?.error || err?.message || defaultMessage,
    status: err?.response?.status || 500,
  };
}

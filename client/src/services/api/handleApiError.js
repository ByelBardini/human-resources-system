export function handleApiError(err, defaultMessage) {
  console.error(defaultMessage, err);

  return {
    message: err?.response?.data?.error || err?.message || defaultMessage,
    status: err?.response?.status || 500,
  };
}

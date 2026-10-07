export const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('geoemploi:unauthorized', {
          detail: { url, status: 401 },
        }),
      );
    }
  }

  return response;
};

import apiRequest from "@/services/api-request";

/**
 * Downloads a file from a given URL using the apiRequest method with authentication
 * @param {string} url - The URL of the file to download
 * @param {string} responseType - The expected response type ('text' or 'json')
 * @returns {Promise} - The downloaded file content
 */
export const downloadFile = async (
  url,
  responseType = "text",
  isAuthenticated = true,
) => {
  try {
    // Create a temporary API route for downloading files
    const downloadRoute = {
      method: "get",
      url: url,
    };

    // Use apiRequest with custom authentication
    const response = await apiRequest(downloadRoute, {
      metadata: {
        isAuthenticated: isAuthenticated, // This will add the Bearer token
        isCustomAuth: false,
      },
    });

    if (responseType === "json") {
      return response;
    } else {
      return response;
    }
  } catch (error) {
    console.error("Failed to download file:", error);
    throw error;
  }
};

/**
 * Downloads a text file (like transcripts) with two-step process for S3 URLs
 * @param {string} url - The URL of the text file (S3 URL that returns {"url": "actual-file-url"})
 * @returns {Promise<string>} - The text content
 */
export const downloadTextFile = async (url) => {
  try {
    // Step 1: Fetch the S3 URL to get the actual file URL
    const s3Response = await downloadFile(url, "json");
    // Extract the actual file URL from the response
    const actualFileUrl = s3Response.url;

    if (!actualFileUrl) {
      return s3Response;
    }
    console.log("actualFileUrl", actualFileUrl);
    // Step 2: Fetch the actual file content using the extracted URL
    const fileContent = await downloadFile(actualFileUrl, "text", false);

    return fileContent;
  } catch (error) {
    console.error("Failed to download text file:", error);
    throw error;
  }
};

export const fetchAudioUrl = async (url) => {
  const normalizedUrl = url?.replace("http://", "https://");
  if (!normalizedUrl) return null;

  try {
    // Step 1: Fetch the S3 URL to get the actual file URL
    const fetchRoute = {
      method: "get",
      url: normalizedUrl,
    };
    const s3Response = await apiRequest(fetchRoute);

    // Some endpoints return {"url": "<signed-audio-url>"}, while others
    // already return a direct audio URL response. Handle both safely.
    if (typeof s3Response === "string") {
      return s3Response.replace("http://", "https://");
    }

    if (s3Response?.url) {
      return s3Response.url.replace("http://", "https://");
    }

    return normalizedUrl;
  } catch (error) {
    console.error("Failed to resolve audio URL, using original URL:", error);
    return normalizedUrl;
  }
};

/**
 * Downloads a JSON file (like call logs) with two-step process for S3 URLs
 * @param {string} url - The URL of the JSON file (S3 URL that returns {"url": "actual-file-url"})
 * @returns {Promise<object>} - The JSON content
 */
export const downloadJsonFile = async (url) => {
  try {
    // Step 1: Fetch the S3 URL to get the actual file URL
    const s3Response = await downloadFile(url, "json");

    // Extract the actual file URL from the response
    const actualFileUrl = s3Response.url;
    if (!actualFileUrl) {
      return s3Response;
    }

    // Step 2: Fetch the actual file content using the extracted URL
    const fileContent = await downloadFile(actualFileUrl, "json", false);

    return fileContent;
  } catch (error) {
    console.error("Failed to download JSON file:", error);
    throw error;
  }
};

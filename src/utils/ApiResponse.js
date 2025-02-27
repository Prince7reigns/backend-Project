// ✅ Creating a reusable class for API responses
class ApiResponse {
    /**
     * @param {number} statusCode - HTTP status code (e.g., 200, 201, 400, 500)
     * @param {any} data - Response data (can be an object, array, string, etc.)
     * @param {string} message - Response message (default: "success")
     */
    constructor(statusCode, data, message = "success") {
        this.statusCode = statusCode;  // ✅ Stores the HTTP status code (e.g., 200 for success, 400 for bad request)
        this.data = data;  // ✅ Stores the response data (actual content of the response)
        this.message = message;  // ✅ Stores the response message (default is "success")

        // ✅ Determines if the response is successful (status codes < 400 are considered successful)
        this.success = statusCode < 400;
    }
}

// ✅ Exporting the class for use in other files
export { ApiResponse };

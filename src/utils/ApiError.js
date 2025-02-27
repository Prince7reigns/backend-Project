// ✅ Creating a custom error class that extends the built-in Error class
class ApiError extends Error {
    /**
     * @param {number} statuscode - HTTP status code (e.g., 400, 404, 500)
     * @param {string} message - Error message (default: "Something went wrong")
     * @param {Array} errors - Additional error details (default: empty array)
     * @param {string} stack - Stack trace (default: empty string)
     */
    constructor(statuscode, message = "Something went wrong", errors = [], stack = "") {
        super(message);  // ✅ Calling the parent class (Error) constructor with the message

        this.statuscode = statuscode;  // ✅ Storing the HTTP status code
        this.errors = errors;  // ✅ Additional error details (useful for validation errors)
        this.data = null;  // ✅ Placeholder for additional data (optional)
        this.stack = stack;  // ✅ Setting the stack trace if provided

        // ✅ If no custom stack trace is provided, capture the current stack trace
        if (!stack) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// ✅ Exporting the class to be used in other files
export { ApiError };

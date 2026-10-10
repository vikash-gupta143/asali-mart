import { Component } from "react";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-5">
              <FiAlertTriangle className="text-4xl text-danger" />
            </div>
            <h1 className="font-heading font-bold text-2xl mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-sm text-muted mb-2">
              We're sorry for the inconvenience. Please try again.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-left max-h-40 overflow-auto">
                <b>Error:</b> {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
              >
                <FiRefreshCw /> Reload Page
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 font-semibold hover:bg-bg transition"
              >
                <FiHome /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
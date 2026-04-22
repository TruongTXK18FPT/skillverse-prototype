/**
 * [Nghiệp vụ] Error Boundary cho Node Mentoring components.
 *
 * Graceful fallback khi API lỗi hoặc component crash.
 * Mirror pattern: minimal, không over-engineer.
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import './NodeMentoringErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class NodeMentoringErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NodeMentoringErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="nmeb-fallback">
          <div className="nmeb-content">
            <AlertCircle size={48} className="nmeb-icon" />
            <h3 className="nmeb-title">Có lỗi xảy ra</h3>
            <p className="nmeb-message">
              Không thể tải dữ liệu node mentoring. Vui lòng thử lại.
            </p>
            {this.state.error && (
              <code className="nmeb-error-code">
                {this.state.error.message}
              </code>
            )}
            <button className="nmeb-retry-btn" onClick={this.handleRetry}>
              <RefreshCw size={16} /> Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NodeMentoringErrorBoundary;

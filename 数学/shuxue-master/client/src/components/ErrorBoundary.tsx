import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-lg w-full border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-xl font-semibold mb-3">页面加载失败</h1>
          <p className="text-sm text-slate-300 mb-4">
            当前页面遇到渲染错误，请刷新后重试。
          </p>
          <pre className="text-xs text-rose-200 whitespace-pre-wrap break-words bg-slate-950 p-3">
            {this.state.error.message}
          </pre>
        </div>
      </div>
    )
  }
}

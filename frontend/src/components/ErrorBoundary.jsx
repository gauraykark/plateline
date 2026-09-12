import { Component } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled React error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center p-6 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={30} />
            </div>
            
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Something went wrong</h2>
              <p className="text-xs text-slate-500 mt-1">
                The application encountered an unexpected runtime error.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-stone-50 p-3.5 rounded-xl border border-stone-200 max-h-32 overflow-y-auto">
                <p className="text-xs font-mono text-rose-700 font-medium">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-slate-700 hover:bg-stone-50 transition-all flex items-center gap-1.5"
              >
                <Home size={14} />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-[#0D3B2E] hover:bg-[#092B21] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

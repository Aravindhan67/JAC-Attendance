import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // Clear any potential session refresh lock and reload
    window.sessionStorage.removeItem('page-has-been-force-refreshed');
    window.location.reload();
  };

  handleReset = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.sessionStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F1EDE4] flex items-center justify-center p-4 selection:bg-[#C25E37] selection:text-[#FAF6EE]">
          <div className="bg-[#FAF6EE] border border-[#DCD4C4] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FBEBE8] border border-[#F2C0B7] text-[#C25E37] flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="text-xl font-black text-[#1B3B34] tracking-tight">
                Portal Display Notice
              </h2>
              <p className="text-xs text-[#5A5347] mt-1 font-medium leading-relaxed">
                A newly deployed portal update needs to sync with your browser cache. Please reload the workspace.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#EAE4D6]/70 border border-[#DCD4C4] rounded-xl text-left overflow-x-auto text-[11px] font-mono text-[#8C2C1D] max-h-32">
                {this.state.error.message || this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 bg-[#1B3B34] hover:bg-[#254F46] text-[#FAF6EE] text-xs font-bold py-2.5 px-4 rounded-xl shadow-warm-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-[#142C26]"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.2]" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = '/')}
                className="flex-1 bg-[#FAF6EE] hover:bg-[#EAE4D6] text-[#23201B] border border-[#DCD4C4] text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-warning/5 p-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h1 className="text-xl font-bold text-foreground">
              Oups ! Quelque chose s'est mal passé
            </h1>
            
            <p className="text-muted-foreground text-sm">
              Une erreur inattendue s'est produite. Veuillez réessayer ou retourner à l'accueil.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-left">
                <p className="text-xs font-mono text-destructive break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Stack trace
                    </summary>
                    <pre className="text-[10px] text-red-700 mt-1 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={this.handleReload}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
              <Button 
                variant="outline"
                onClick={this.handleGoHome}
                className="flex-1 gap-2"
              >
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


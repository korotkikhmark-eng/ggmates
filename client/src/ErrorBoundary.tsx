import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error) { console.error(err); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="glass p-8 max-w-md space-y-4">
          <h1 className="text-xl font-bold">Что-то пошло не так</h1>
          <p className="text-sm text-slate-400 break-words">{this.state.err.message}</p>
          <button className="btn" onClick={() => location.reload()}>Обновить страницу</button>
        </div>
      </div>
    );
  }
}

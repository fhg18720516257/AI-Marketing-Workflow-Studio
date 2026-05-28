import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = { hasError: boolean; error?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  override componentDidCatch(error: Error) {
    console.error('App crashed:', error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
          <div className="max-w-xl rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-6 text-center backdrop-blur-xl">
            <h1 className="text-2xl font-black">页面渲染出错</h1>
            <p className="mt-3 text-sm leading-6 text-rose-100/90">
              可能是旧缓存、损坏的本地配置，或者某个组件在运行时抛出了异常。请先清空当前站点的 localStorage 并刷新页面。
            </p>
            {this.state.error ? <p className="mt-4 rounded-2xl bg-slate-950/70 p-3 text-left text-xs text-slate-300">{this.state.error}</p> : null}
            <button
              className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('workflow-api-settings');
                  window.location.reload();
                }
              }}
            >
              清除配置并重试
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

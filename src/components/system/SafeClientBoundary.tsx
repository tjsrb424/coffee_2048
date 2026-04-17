"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; label?: string };

type State = { error: Error | null };

/**
 * 전역 BGM/토스트 등은 `app/error.tsx` 바깥(Providers)에 있어 예외가 나면 `global-error`로만 떨어진다.
 * 이 경계로 잡아 두면 앱 본문은 유지되고 해당 기능만 조용히 꺼진다.
 */
export class SafeClientBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const tag = this.props.label ? `:${this.props.label}` : "";
    console.error(`[SafeClientBoundary${tag}]`, error, errorInfo);
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

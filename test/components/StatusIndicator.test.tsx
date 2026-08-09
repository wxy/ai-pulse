import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusIndicator from '@/components/popup/StatusIndicator';

describe('StatusIndicator', () => {
  it('shows 未知 when no status data', () => {
    render(<StatusIndicator status={null} providerName="Test" />);
    expect(screen.getByText('未知')).toBeInTheDocument();
  });

  it('shows 运行中 for operational status', () => {
    render(<StatusIndicator status={{
      success: true, isAvailable: true, statusKind: 'ok', statusMessage: '运行中', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(screen.getByText('运行中')).toBeInTheDocument();
  });

  it('shows 需注意 for warning status', () => {
    render(<StatusIndicator status={{
      success: true, isAvailable: true, statusKind: 'warning', statusMessage: '可达 · 需鉴权', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(screen.getByText('需注意')).toBeInTheDocument();
  });

  it('marks the probe source on the dot and tooltip', () => {
    const { container } = render(<StatusIndicator status={{
      success: true, isAvailable: true, statusKind: 'ok', source: 'page', statusMessage: '运行中', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(container.querySelector('.status-source-page')).toBeInTheDocument();
    expect(container.querySelector('.status-indicator')?.getAttribute('title')).toContain('状态页');
  });

  it('shows 服务异常 when service has issues', () => {
    render(<StatusIndicator status={{
      success: true, isAvailable: false, statusKind: 'down', statusMessage: '服务异常', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(screen.getByText('服务异常')).toBeInTheDocument();
  });

  it('shows status dot with correct class', () => {
    const { container } = render(<StatusIndicator status={{
      success: true, isAvailable: true, statusKind: 'ok', statusMessage: 'OK', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(container.querySelector('.status-ok')).toBeInTheDocument();

    const { container: container2 } = render(<StatusIndicator status={{
      success: true, isAvailable: false, statusKind: 'down', statusMessage: 'Bad', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(container2.querySelector('.status-error')).toBeInTheDocument();

    const { container: container3 } = render(<StatusIndicator status={{
      success: true, isAvailable: true, statusKind: 'warning', statusMessage: 'Auth', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(container3.querySelector('.status-warning')).toBeInTheDocument();
  });
});

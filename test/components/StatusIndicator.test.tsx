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
      success: true, isAvailable: true, statusMessage: '运行中', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(screen.getByText('运行中')).toBeInTheDocument();
  });

  it('shows 服务异常 when service has issues', () => {
    render(<StatusIndicator status={{
      success: true, isAvailable: false, statusMessage: '服务异常', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(screen.getByText('服务异常')).toBeInTheDocument();
  });

  it('shows status dot with correct class', () => {
    const { container } = render(<StatusIndicator status={{
      success: true, isAvailable: true, statusMessage: 'OK', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(container.querySelector('.status-ok')).toBeInTheDocument();

    const { container: container2 } = render(<StatusIndicator status={{
      success: true, isAvailable: false, statusMessage: 'Bad', rawTimestamp: Date.now(),
    }} providerName="Test" />);
    expect(container2.querySelector('.status-error')).toBeInTheDocument();
  });
});

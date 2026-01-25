import { render } from '@testing-library/react';
import WebAnalytics from '../WebAnalytics';

// Mock Vercel analytics
jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

// Mock Vercel speed insights
jest.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}));

// Mock Next.js Script
jest.mock('next/script', () => {
  return function MockScript({ children, id }: { children?: React.ReactNode; id?: string }) {
    return <script data-testid={id || 'script'}>{children}</script>;
  };
});

describe('WebAnalytics', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset window object
    delete (global.window as any).__TAURI__;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('should render nothing in Tauri environment', () => {
    (global.window as any).__TAURI__ = {};

    const { container } = render(<WebAnalytics />);

    // Should render nothing initially (effect hasn't run yet in test)
    expect(container.firstChild).toBeNull();
  });

  it('should render analytics components in web environment', async () => {
    // Ensure no Tauri
    delete (global.window as any).__TAURI__;

    const { findByTestId } = render(<WebAnalytics />);

    // After effect runs, should render analytics
    const analytics = await findByTestId('vercel-analytics');
    const speedInsights = await findByTestId('speed-insights');

    expect(analytics).toBeInTheDocument();
    expect(speedInsights).toBeInTheDocument();
  });
});

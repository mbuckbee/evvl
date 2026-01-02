import { render, screen } from '@testing-library/react';
import Navigation from '../navigation';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => {
    return <a href={href} onClick={onClick}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

// Mock Next.js Image component
jest.mock('next/image', () => {
  const MockImage = (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  };
  MockImage.displayName = 'Image';
  return MockImage;
});

describe('Navigation', () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Evvl logo', () => {
    render(<Navigation />);
    const logo = screen.getByAltText('Evvl');
    expect(logo).toBeInTheDocument();
  });

  it('should render all navigation links', () => {
    render(<Navigation />);

    expect(screen.getByText('What is this?')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should have correct href attributes for links', () => {
    render(<Navigation />);

    const aboutLink = screen.getByText('What is this?').closest('a');
    const settingsLink = screen.getByText('Settings').closest('a');

    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('should render logo link to homepage', () => {
    render(<Navigation />);

    const logoLink = screen.getByAltText('Evvl').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should have proper styling classes', () => {
    render(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('border-b', 'border-gray-200', 'bg-white');
  });
});

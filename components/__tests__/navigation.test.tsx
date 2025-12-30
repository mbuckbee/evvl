import { render, screen } from '@testing-library/react';
import Navigation from '../navigation';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Navigation', () => {
  it('should render the Evvl logo', () => {
    render(<Navigation />);
    const logo = screen.getByText('Evvl');
    expect(logo).toBeInTheDocument();
  });

  it('should render all navigation links', () => {
    render(<Navigation />);

    expect(screen.getByText('Eval')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should have correct href attributes for links', () => {
    render(<Navigation />);

    const evalLink = screen.getByText('Eval').closest('a');
    const faqLink = screen.getByText('FAQ').closest('a');
    const aboutLink = screen.getByText('About').closest('a');
    const settingsLink = screen.getByText('Settings').closest('a');

    expect(evalLink).toHaveAttribute('href', '/');
    expect(faqLink).toHaveAttribute('href', '/faq');
    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('should render logo link to homepage', () => {
    render(<Navigation />);

    const logoLink = screen.getByText('Evvl').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should have proper styling classes', () => {
    render(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('border-b', 'border-gray-200', 'bg-white');
  });
});

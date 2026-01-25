import { render, screen } from '@testing-library/react';
import Footer from '../footer';

describe('Footer', () => {
  it('should render copyright text with current year', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Evvl. All rights reserved.`)).toBeInTheDocument();
  });

  it('should render Terms of Service link', () => {
    render(<Footer />);

    const termsLink = screen.getByRole('link', { name: /terms of service/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('should render Privacy Policy link', () => {
    render(<Footer />);

    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('should have proper footer element', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });
});

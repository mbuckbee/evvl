import { render, screen, fireEvent } from '@testing-library/react';
import OutputCard from '../output-card';
import { AIOutput, Rating } from '@/lib/types';

// Mock output
const mockOutput: AIOutput = {
  id: 'output-1',
  modelConfig: {
    provider: 'openai',
    model: 'gpt-4',
    label: 'GPT-4',
  },
  content: 'This is the AI response content.',
  tokens: 150,
  latency: 1234,
  isStreaming: false,
};

const mockRating: Rating = {
  outputId: 'output-1',
  score: 4,
  notes: 'Good response',
};

describe('OutputCard', () => {
  describe('Header', () => {
    it('should display model label', () => {
      render(<OutputCard output={mockOutput} onRate={jest.fn()} />);
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
    });

    it('should display token count', () => {
      render(<OutputCard output={mockOutput} onRate={jest.fn()} />);
      expect(screen.getByText('150 tokens')).toBeInTheDocument();
    });

    it('should display latency', () => {
      render(<OutputCard output={mockOutput} onRate={jest.fn()} />);
      expect(screen.getByText('1234ms')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display content when no error', () => {
      render(<OutputCard output={mockOutput} onRate={jest.fn()} />);
      expect(screen.getByText('This is the AI response content.')).toBeInTheDocument();
    });

    it('should display error message when output has error', () => {
      const errorOutput = { ...mockOutput, error: 'Rate limit exceeded' };
      render(<OutputCard output={errorOutput} onRate={jest.fn()} />);
      expect(screen.getByText('Error: Rate limit exceeded')).toBeInTheDocument();
    });

    it('should display image when type is image', () => {
      const imageOutput = {
        ...mockOutput,
        type: 'image' as const,
        imageUrl: 'https://example.com/image.png',
        content: 'Generated image',
      };
      render(<OutputCard output={imageOutput} onRate={jest.fn()} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image.png');
    });
  });

  describe('Rating', () => {
    it('should render 5 star buttons', () => {
      render(<OutputCard output={mockOutput} onRate={jest.fn()} />);

      const starButtons = screen.getAllByRole('button', { name: /rate \d stars/i });
      expect(starButtons).toHaveLength(5);
    });

    it('should call onRate when star is clicked', () => {
      const mockOnRate = jest.fn();
      render(<OutputCard output={mockOutput} onRate={mockOnRate} />);

      const threeStarButton = screen.getByRole('button', { name: 'Rate 3 stars' });
      fireEvent.click(threeStarButton);

      expect(mockOnRate).toHaveBeenCalledWith('output-1', 3, '');
    });

    it('should show filled stars based on rating', () => {
      render(<OutputCard output={mockOutput} rating={mockRating} onRate={jest.fn()} />);

      // With rating of 4, first 4 stars should be filled (★), 5th should be empty (☆)
      const starButtons = screen.getAllByRole('button', { name: /rate \d stars/i });
      expect(starButtons[0]).toHaveTextContent('★');
      expect(starButtons[3]).toHaveTextContent('★');
      expect(starButtons[4]).toHaveTextContent('☆');
    });

    it('should not show rating section when output has error', () => {
      const errorOutput = { ...mockOutput, error: 'API error' };
      render(<OutputCard output={errorOutput} onRate={jest.fn()} />);

      expect(screen.queryByRole('button', { name: /rate \d stars/i })).not.toBeInTheDocument();
    });
  });

  describe('Notes', () => {
    it('should show "Add notes" button', () => {
      render(<OutputCard output={mockOutput} onRate={jest.fn()} />);
      expect(screen.getByText('Add notes')).toBeInTheDocument();
    });

    it('should toggle notes textarea when clicked', () => {
      render(<OutputCard output={mockOutput} onRate={jest.fn()} />);

      // Initially no textarea
      expect(screen.queryByPlaceholderText(/add notes/i)).not.toBeInTheDocument();

      // Click to show
      fireEvent.click(screen.getByText('Add notes'));
      expect(screen.getByPlaceholderText(/add notes/i)).toBeInTheDocument();

      // Click to hide
      fireEvent.click(screen.getByText('Hide notes'));
      expect(screen.queryByPlaceholderText(/add notes/i)).not.toBeInTheDocument();
    });

    it('should populate notes from existing rating', () => {
      render(<OutputCard output={mockOutput} rating={mockRating} onRate={jest.fn()} />);

      fireEvent.click(screen.getByText('Add notes'));
      const textarea = screen.getByPlaceholderText(/add notes/i);
      expect(textarea).toHaveValue('Good response');
    });

    it('should call onRate when notes are changed and rating exists', () => {
      const mockOnRate = jest.fn();
      render(<OutputCard output={mockOutput} rating={mockRating} onRate={mockOnRate} />);

      fireEvent.click(screen.getByText('Add notes'));
      const textarea = screen.getByPlaceholderText(/add notes/i);
      fireEvent.change(textarea, { target: { value: 'Updated notes' } });

      expect(mockOnRate).toHaveBeenCalledWith('output-1', 4, 'Updated notes');
    });
  });
});

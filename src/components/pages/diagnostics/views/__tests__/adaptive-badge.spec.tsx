import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { AdaptiveBadge } from '../adaptive-badge';

describe('AdaptiveBadge', () => {
  it('renders "Enabled" when isSupported is true', () => {
    render(<AdaptiveBadge isSupported={true} />);
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('renders "Disabled" when isSupported is false', () => {
    render(<AdaptiveBadge isSupported={false} />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});

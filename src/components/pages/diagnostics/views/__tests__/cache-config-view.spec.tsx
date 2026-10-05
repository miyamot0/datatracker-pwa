import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { CacheConfigView } from '../cache-config-view';
import { DiagnosticsData } from '../../lib/helper';

describe('CacheConfigView', () => {
  const mockData: DiagnosticsData['cache'] = {
    mode: 'Standard',
    staleTime: '30000',
    gcTime: '600000',
  };

  it('should render cache configuration values', () => {
    render(<CacheConfigView data={mockData} />);

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('30000 ms')).toBeInTheDocument();
    expect(screen.getByText('600000 ms')).toBeInTheDocument();
  });
});

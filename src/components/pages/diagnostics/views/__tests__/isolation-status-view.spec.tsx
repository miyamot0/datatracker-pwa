import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { IsolationStatusView } from '../isolation-status-view';
import { DiagnosticsData } from '../../lib/helper';

describe('IsolationStatusView', () => {
  const mockData: DiagnosticsData['isolation'] = {
    isSharedArrayBufferSupported: true,
    isIsolated: false,
    userAgent: 'Mozilla/5.0',
  };

  it('should render correctly supported and unsupported badges', () => {
    render(<IsolationStatusView data={mockData} />);

    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('Cross-Origin Isolation:')).toBeInTheDocument();
  });
});

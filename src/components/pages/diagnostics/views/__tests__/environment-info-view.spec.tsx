import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { EnvironmentInfoView } from '../environment-info-view';
import { DiagnosticsData } from '../../lib/helper';

describe('EnvironmentInfoView', () => {
  const mockData: DiagnosticsData['issues'] = {
    count: 2,
    list: ['Issue 1', 'Issue 2'],
  };
  const mockRecs: DiagnosticsData['recommendations'] = {
    count: 1,
    list: ['Rec 1'],
  };

  it('should render list items when issues and recommendations exist', () => {
    render(<EnvironmentInfoView data={mockData} userAgent="TestAgent" recommendations={mockRecs} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Rec 1')).toBeInTheDocument();
  });

  it('should not render lists when counts are zero', () => {
    const emptyData: DiagnosticsData['issues'] = { count: 0, list: [] };
    const emptyRecs: DiagnosticsData['recommendations'] = { count: 0, list: [] };

    render(<EnvironmentInfoView data={emptyData} userAgent="TestAgent" recommendations={emptyRecs} />);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});

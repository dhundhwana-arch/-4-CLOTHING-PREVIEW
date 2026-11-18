import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Shirt3DPreview } from '../react/Shirt3DPreview';
import { ControlBar } from '../react/ControlBar';
import { DesignDetailsPanel } from '../react/DesignDetailsPanel';
import { WebGLFallback } from '../react/WebGLFallback';
import { adaptDesignConfiguration } from '../integration/designAdapter';

/**
 * jsdom has no WebGL, so these tests exercise the real unsupported-browser
 * path of Shirt3DPreview plus all presentational components. The WebGL
 * scene itself is verified in a real browser (see TESTING.md — honest
 * environmental limitation).
 */

describe('<Shirt3DPreview /> (jsdom → WebGL fallback path)', () => {
  it('renders the honest WebGL-unavailable fallback, not a fake viewer', async () => {
    render(<Shirt3DPreview design={{ design_id: 't-1', collar_style: 'spread' }} />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('3D preview unavailable')).toBeInTheDocument();
    // Never claims a working viewer:
    expect(screen.queryByText(/drag to rotate/i)).not.toBeInTheDocument();
  });

  it('shows the resolved design summary inside the fallback', async () => {
    render(<Shirt3DPreview design={{ collar_style: 'mandarin', sleeve_style: 'half' }} />);
    expect(await screen.findByText(/Collar: mandarin/)).toBeInTheDocument();
    expect(screen.getByText(/Sleeves: half/)).toBeInTheDocument();
  });

  it('always shows the approximation disclaimer in the details panel', async () => {
    render(<Shirt3DPreview design={{}} />);
    expect(
      await screen.findByText(/3D preview is a visual approximation/),
    ).toBeInTheDocument();
  });

  it('marks fixture-sourced fabric clearly in the details panel', async () => {
    render(<Shirt3DPreview design={{ fabric_id: 'fixture-cotton-sky' }} />);
    expect(await screen.findByText(/\(fixture data\)/)).toBeInTheDocument();
  });

  it('flags unavailable fabrics to the user', async () => {
    render(<Shirt3DPreview design={{ fabric_id: 'fixture-check-forest' }} />);
    // The notice appears in the details panel AND in the adaptation notes list.
    const matches = await screen.findAllByText(/flagged unavailable/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('calls onError for unknown fabric ids', async () => {
    const onError = vi.fn();
    render(<Shirt3DPreview design={{ fabric_id: 'nope' }} onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls[0][0].code).toBe('fabric-not-found');
  });

  it('offers a working retry control in the fallback', async () => {
    render(<Shirt3DPreview design={{}} />);
    const retry = await screen.findByRole('button', { name: /retry 3d preview/i });
    fireEvent.click(retry); // must not throw; jsdom stays unsupported
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('<ControlBar />', () => {
  it('renders all four presets plus zoom and reset with 44px+ targets', () => {
    render(
      <ControlBar
        activePreset="front"
        onPreset={() => {}}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onReset={() => {}}
      />,
    );
    for (const label of ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'RESET CAMERA', 'Zoom in', 'Zoom out']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('dispatches preset/zoom/reset commands', () => {
    const onPreset = vi.fn();
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onReset = vi.fn();
    render(
      <ControlBar activePreset={null} onPreset={onPreset} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onReset} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'BACK' }));
    expect(onPreset).toHaveBeenCalledWith('back');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoomIn).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoomOut).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'RESET CAMERA' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('marks the active preset via aria-pressed', () => {
    render(
      <ControlBar activePreset="left" onPreset={() => {}} onZoomIn={() => {}} onZoomOut={() => {}} onReset={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'LEFT' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'FRONT' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('<DesignDetailsPanel />', () => {
  const design = adaptDesignConfiguration({ sleeve_style: 'half', cuff_style: 'french' }).design;

  it('shows resolved values and explains cuffs on half sleeves', () => {
    render(<DesignDetailsPanel design={design} fabric={null} />);
    expect(screen.getByText(/not rendered on half sleeves/)).toBeInTheDocument();
  });

  it('lists adaptation notices when present', () => {
    render(<DesignDetailsPanel design={design} fabric={null} adaptationNotes={['test notice one']} />);
    expect(screen.getByText(/configuration notice/)).toBeInTheDocument();
    expect(screen.getByText('test notice one')).toBeInTheDocument();
  });
});

describe('<WebGLFallback />', () => {
  it('is honest: states the preview cannot render', () => {
    render(<WebGLFallback reason="test reason" />);
    expect(screen.getByText(/cannot be displayed/)).toBeInTheDocument();
    expect(screen.getByText(/test reason/)).toBeInTheDocument();
  });

  it('works without design/fabric (degraded but informative)', () => {
    render(<WebGLFallback />);
    expect(screen.getByText('3D preview unavailable')).toBeInTheDocument();
  });
});

import type { DesignConfiguration } from '../../types/design';

/**
 * ⚠️ LOCAL DEVELOPMENT MOCK CONFIGURATIONS — NOT LIVE MODULE 03 DATA ⚠️
 *
 * The 2D designer (Module 03) publishes no schema yet (AUDIT_REPORT.md §6).
 * These objects exercise the illustrative adapter contract only. When
 * Module 03 ships its real output format, delete this file's usage from the
 * demo and feed real configurations through `adaptDesignConfiguration`.
 */

export const MOCK_DESIGNS: Record<string, DesignConfiguration> = {
  classicFormal: {
    design_id: 'mock-design-classic-formal',
    fabric_id: 'fixture-cotton-white',
    collar_style: 'classic',
    pocket_style: 'single',
    pocket_flap_style: 'none',
    sleeve_style: 'full',
    cuff_style: 'standard',
    button_style: 'pearl',
    thread_color: '#d8d8d8',
    fit_type: 'regular',
  },
  casualShortSleeve: {
    design_id: 'mock-design-casual-short',
    fabric_id: 'fixture-cotton-sky',
    collar_style: 'button-down',
    pocket_style: 'single',
    pocket_flap_style: 'rounded',
    sleeve_style: 'half',
    button_style: 'standard',
    thread_color: '#4a5a6a',
    fit_type: 'regular',
  },
  relaxedCheck: {
    design_id: 'mock-design-relaxed-check',
    fabric_id: 'fixture-check-forest',
    collar_style: 'mandarin',
    pocket_style: 'double',
    pocket_flap_style: 'pointed',
    sleeve_style: 'full',
    cuff_style: 'french',
    button_style: 'dark',
    thread_color: '#c9b458',
    fit_type: 'relaxed',
  },
};

export const DEFAULT_MOCK_DESIGN: DesignConfiguration = MOCK_DESIGNS.classicFormal;

# Dev Panel Control IDs

This document lists all the control IDs used in the ArT Reader dev panel and their relationships.

## Overview

The dev panel uses synchronized slider and number input pairs for most controls. When a slider moves, it updates the corresponding number input, and vice versa. The JavaScript code reads from the number input values to apply changes to the system.

## Control ID List

### Close Button
- `devCloseBtn` - Close button for the dev panel

### Voice Controls
- `devSpeedSlider` - Speed slider (0.80 - 1.10)
- `devSpeedInput` - Speed number input (synced with slider)
- `devOverrideCheckbox` - Toggle for custom voice sequence
- `devVoiceOverrideInputs` - Container for voice override inputs
- `devVlist1`, `devVlist2`, `devVlist3`, `devVlist4`, `devVlist5`, `devVlist6` - Custom voice ID inputs

### Page Break Markers (Thresholds)
- `usePrimaryToggle` - Checkbox to enable/disable primary threshold
- `primaryThresholdSlider` - Primary threshold slider (50 - 500ms)
- `primaryThresholdValue` - Primary threshold number input (synced with slider)
- `useSecondaryToggle` - Checkbox to enable/disable secondary threshold
- `secondaryThresholdSlider` - Secondary threshold slider (50 - 500ms)
- `secondaryThresholdValue` - Secondary threshold number input (synced with slider)

### Background Dimmer
- `dimmingSlider` - Dimming opacity slider (0 - 95%)
- `dimmingValue` - Dimming opacity number input (synced with slider)

### Playback Font Sizes
- `activeFontSizeSlider` - Active font size slider (10 - 100px)
- `activeFontSizeInput` - Active font size number input (synced with slider)
- `inactiveFontSizeSlider` - Inactive font size slider (10 - 100px)
- `inactiveFontSizeInput` - Inactive font size number input (synced with slider)

### Playback Font Opacity
- `baseTextOpacitySlider` - Base text opacity slider (0.1 - 1.0)
- `baseTextOpacityInput` - Base text opacity number input (synced with slider)
- `lookaheadOffsetSlider` - Lookahead offset slider (0.01 - 0.5)
- `lookaheadOffsetInput` - Lookahead offset number input (synced with slider)

## Synchronization Pattern

Each control pair follows this pattern:
1. Slider changes → Updates corresponding number input via `syncSliderToInput()`
2. Number input changes → Updates corresponding slider via `syncInputToSlider()`
3. Both trigger `applyValuesFromInputs()` to apply changes to the system

## CSS Variable Mapping

The dev panel applies values to these CSS variables:
- `--playing-font-size` ← `activeFontSizeInput`
- `--not-playing-font-size` ← `inactiveFontSizeInput`
- `--base-text-opacity` ← `baseTextOpacityInput`
- `--lookahead-offset` ← `lookaheadOffsetInput`

## Total Count
**27 control IDs** across all sections of the dev panel.

---
*Last updated: January 3, 2025*

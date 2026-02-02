# Custom ESP32 Board Guide

This guide explains how to customize the ESP32 board design in HackCable.

## Overview

A custom ESP32 board component has been created that you can modify with your own SVG design. The custom board is fully integrated into the HackCable system and works just like the standard ESP32 board.

## Files Modified/Created

### New Files
- **src/components/custom-esp32-board.ts** - Custom ESP32 board Web Component

### Modified Files
- **src/panels/component.ts** - Added custom board to component registry (ID: 27)
- **src/editor/canvas.ts** - Added custom board detection for board type
- **src/main.ts** - Added custom board support to LED update functions (lines 99, 102, 201-202)
- **web/index.html** - Added "Custom ESP32" option to board selector dropdown
- **web/index.ts** - Added `setupCustomESP32Circuit()` function

## How to Customize the Board Design

### 1. Edit the SVG Design

Open `src/components/custom-esp32-board.ts` and locate the `svgContent()` method (around line 55). This contains the complete SVG definition for the board.

The SVG currently includes:
- Board outline
- USB connector
- ESP32 chip
- Custom text labels ("CUSTOM ESP32 Board")
- Voltage regulator
- EN and BOOT buttons
- 2 LEDs (power and status)
- Small chip component
- Antenna pattern
- Pin labels for all 30 pins
- Pin holes

**To modify:**
- Change colors, shapes, or positions of any components
- Add new visual elements
- Modify text labels
- Update the board dimensions
- Replace with your own complete SVG design

### 2. Adjust Pin Positions (if needed)

If you change the physical position of pins in your SVG design, update the pin coordinates in the `pinInfo` array (lines 18-49):

```typescript
readonly pinInfo: ElementPin[] = [
  { name: 'VIN', x: 5, y: 158.5, signals: [{ type: 'power', signal: 'VCC' }] },
  { name: 'GND.2', x: 5, y: 149, signals: [{ type: 'power', signal: 'GND' }] },
  // ... etc
];
```

The `x` and `y` coordinates should match where the pin appears in your SVG.

### 3. Update Board Dimensions

If your design has different dimensions, update the SVG `width`, `height`, and `viewBox` attributes in the `svgContent()` method:

```typescript
<svg
  width="28.2mm"      // Change this
  height="54.053mm"   // Change this
  version="1.1"
  viewBox="0 0 107 201"  // Change this
  xmlns="http://www.w3.org/2000/svg"
>
```

### 4. Rebuild the Project

After making changes, rebuild the web version:

```bash
npm run build:web
```

### 5. Test Your Custom Board

1. Open the web interface
2. Select "Custom ESP32" from the Board dropdown
3. Verify:
   - The board displays correctly
   - Pin connections work
   - The LED can be connected and controlled
   - Code compilation works for ESP32

## Using the Custom Board in Your Circuit

The custom board works exactly like the standard ESP32:

1. **Select from dropdown**: Choose "Custom ESP32" from the Board selector
2. **Auto-setup**: Automatically creates the board with an LED connected to pin D2
3. **Manual setup**: You can also add it manually from the components panel (ID: 27)
4. **Code**: Write MicroPython code just like the standard ESP32
5. **Compile & Run**: Works with the same compilation and execution flow

## Pin Configuration

The custom board has the same 30 pins as the standard ESP32 DevKit V1:

**Left side (bottom to top):**
- VIN, GND.2, D13, D12, D14, D27, D26, D25, D33, D32, D35, D34, VN, VP, EN

**Right side (bottom to top):**
- D15, D2, D4, RX2, TX2, D5, D18, D19, GND.1, D21, RX, TX, D22, D23, 3V3

## LED Control

The custom board has two LED properties:
- `led1` - First LED (currently red power LED)
- `led2` - Second LED (currently blue status LED)

You can control these LEDs' opacity in the SVG:

```svg
<ellipse cx="22" cy="140" rx="1.5" ry="2" fill="#ff0000" opacity="${this.led1 ? 1 : 0.3}" />
<ellipse cx="85" cy="140" rx="1.5" ry="2" fill="#0000ff" opacity="${this.led2 ? 1 : 0.3}" />
```

## Example: Replacing with Your Own SVG

If you have a complete custom SVG design:

1. Open your SVG file in a text editor
2. Copy the SVG content
3. Replace the content inside the `svgContent()` return statement
4. Make sure to preserve the `${this.led1}` and `${this.led2}` template variables if you want LED control
5. Update pin positions in `pinInfo` to match your design
6. Rebuild and test

## Troubleshooting

**Board doesn't appear:**
- Check that the build completed successfully
- Verify the board is registered in `src/panels/component.ts`
- Check browser console for errors

**Pins don't connect properly:**
- Verify pin coordinates in `pinInfo` match the SVG positions
- Ensure pin names match exactly (case-sensitive)

**SVG looks wrong:**
- Check SVG dimensions and viewBox
- Verify all SVG paths are valid
- Check for syntax errors in the template literals

## Advanced Customization

### Adding More Pins

To add additional pins:

1. Add visual pin holes in the SVG
2. Add pin labels
3. Add pin info to the `pinInfo` array
4. Update the total pin count

### Changing Pin Signals

Modify the `signals` array for each pin to change its capabilities:

```typescript
{ name: 'D2', x: 102, y: 149, signals: [
  { type: 'pwm' },           // PWM capable
  { type: 'i2c', signal: 'SDA' },  // I2C data
  // etc.
]}
```

### Creating Multiple Custom Boards

To create additional custom boards:

1. Copy `src/components/custom-esp32-board.ts` to a new file
2. Change the class name and custom element name
3. Register it in `src/panels/component.ts` with a new ID
4. Add to the board selector in `web/index.html`
5. Add setup function in `web/index.ts`

## Reference Files

- Original ESP32 SVG extracted: `web/assets/esp32-devkit-v1.svg`
- Standard ESP32 element: `node_modules/@wokwi/elements/dist/cjs/esp32-devkit-v1-element.js`

## Support

For issues or questions, refer to the HackCable documentation or create an issue in the repository.

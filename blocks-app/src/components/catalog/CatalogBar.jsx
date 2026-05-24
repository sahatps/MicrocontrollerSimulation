import { useState } from 'react';
import './catalog.css';

const HACKCABLE_COMPONENTS = [
  { id: 1,  name: 'LED',          type: 'LED',         icon: 'lightbulb' },
  { id: 2,  name: 'LED RGB',      type: 'LED',         icon: 'palette' },
  { id: 3,  name: 'LED Bar',      type: 'LED',         icon: 'view_column' },
  { id: 4,  name: 'Pixel',        type: 'LED',         icon: 'grain' },
  { id: 5,  name: 'Numitrons',    type: 'LED',         icon: 'dialpad' },
  { id: 6,  name: 'LED Ring',     type: 'LED',         icon: 'circle' },
  { id: 7,  name: 'LCD 2×16',     type: 'LED',         icon: 'article' },
  { id: 8,  name: 'LCD 4×20',     type: 'LED',         icon: 'article' },
  { id: 9,  name: 'Buzzer',       type: 'TRANSMITTER', icon: 'volume_up' },
  { id: 10, name: 'Button',       type: 'BUTTON',      icon: 'smart_button' },
  { id: 11, name: 'Potentiom.',   type: 'BUTTON',      icon: 'tune' },
  { id: 12, name: 'Slide Switch', type: 'BUTTON',      icon: 'toggle_on' },
  { id: 13, name: 'Joystick',     type: 'BUTTON',      icon: 'sports_esports' },
  { id: 14, name: 'Slide Pot.',   type: 'BUTTON',      icon: 'tune' },
  { id: 15, name: 'DipSwitch8',   type: 'BUTTON',      icon: 'view_week' },
  { id: 16, name: 'DHT22',        type: 'SENSOR',      icon: 'thermostat' },
  { id: 17, name: 'HCSR04',       type: 'SENSOR',      icon: 'sensors' },
  { id: 18, name: 'Temp Sensor',  type: 'SENSOR',      icon: 'thermometer' },
  { id: 19, name: 'Sound (sm)',   type: 'SENSOR',      icon: 'hearing' },
  { id: 20, name: 'Sound (lg)',   type: 'SENSOR',      icon: 'mic' },
  { id: 21, name: 'Servo',        type: 'MOTOR',       icon: 'rotate_right' },
  { id: 22, name: 'KY040',        type: 'BUTTON',      icon: 'adjust' },
  { id: 23, name: 'Photo Res.',   type: 'SENSOR',      icon: 'light_mode' },
  { id: 24, name: 'Resistor',     type: 'OTHER',       icon: 'electrical_services' },
  { id: 25, name: 'DS1307',       type: 'OTHER',       icon: 'schedule' },
  { id: 29, name: 'pH Sensor',    type: 'CUSTOM',      icon: 'science' },
  { id: 30, name: 'Air Humidity', type: 'CUSTOM',      icon: 'humidity_percentage' },
  { id: 31, name: 'Misting Pump', type: 'CUSTOM',      icon: 'shower' },
  { id: 32, name: 'Water Pump',   type: 'CUSTOM',      icon: 'water_drop' },
  { id: 33, name: 'Fan',          type: 'CUSTOM',      icon: 'air' },
  { id: 34, name: 'Relay',        type: 'CUSTOM',      icon: 'bolt' },
];

export default function CatalogBar({ visible, onComponentClick }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = HACKCABLE_COMPONENTS.filter(c => filter === 'ALL' || c.type === filter);

  const handleClick = (comp) => {
    window.parent.postMessage({ source: 'bfarm', type: 'add-component', componentId: comp.id }, '*');
    onComponentClick?.(comp);
  };

  return (
    <div className={`bfarm-catalog-bar${visible ? '' : ' hidden'}`}>
      <div className="bfarm-catalog-bar-inner">
        <div className="bfarm-catalog-actions">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="LED">LED</option>
            <option value="MOTOR">Motor</option>
            <option value="TRANSMITTER">Transmitter</option>
            <option value="BUTTON">Button</option>
            <option value="SENSOR">Sensor</option>
            <option value="OTHER">Other</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        <div className="bfarm-catalog-list">
          {filtered.map(comp => (
            <div
              key={comp.id}
              className="bfarm-catalog-element"
              title={comp.name}
              onClick={() => handleClick(comp)}
            >
              <span className="material-symbols-outlined">{comp.icon}</span>
              <h3>{comp.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

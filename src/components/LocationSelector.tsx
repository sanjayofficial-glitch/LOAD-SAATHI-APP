import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LocationSelectorProps {
  label: string;
  value?: { state: string; district: string; city: string };
  onChange: (value: { state: string; district: string; city: string }) => void;
  data: Record<string, Record<string, string[]>>;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ label, value, onChange, data }) => {
  const [selectedState, setSelectedState] = useState(value?.state || '');
  const [selectedDistrict, setSelectedDistrict] = useState(value?.district || '');
  const [selectedCity, setSelectedCity] = useState(value?.city || '');

  useEffect(() => {
    if (value) {
      setSelectedState(value.state);
      setSelectedDistrict(value.district);
      setSelectedCity(value.city);
    }
  }, [value]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('');
    setSelectedCity('');
    onChange({ state, district: '', city: '' });
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedCity('');
    onChange({ state: selectedState, district, city: '' });
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    onChange({ state: selectedState, district: selectedDistrict, city });
  };

  const states = Object.keys(data);

  const districts = selectedState ? Object.keys(data[selectedState] || {}) : [];
  const cities = selectedState && selectedDistrict ? (data[selectedState]?.[selectedDistrict] || []) : [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <Select value={selectedState} onValueChange={handleStateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedState && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
          <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedDistrict && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City/Town</label>
          <Select value={selectedCity} onValueChange={handleCityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
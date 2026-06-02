import { Select } from 'antd';
import React, { useEffect, useState } from 'react';
import fontManifest from './font-manifest.json';

type FontManifestItem = {
  file?: string;
  family?: string;
  fullName?: string;
  postscriptName?: string;
};

const DEFAULT_FONT_OPTIONS = (fontManifest as FontManifestItem[]).reduce<
  Array<{ label: string; value: string }>
>((acc, item) => {
  const value = item.postscriptName?.trim();
  if (!value || acc.some((option) => option.value === value)) {
    return acc;
  }
  acc.push({
    label: item.fullName?.trim() || item.family?.trim() || value,
    value,
  });
  return acc;
}, []);

interface FontSelectProps {
  value?: string;
  onChange?: (fontFamily: string) => void;
  options?: Array<{ label: string; value: string }>;
  disabled?: boolean;
}

const FontSelect: React.FC<FontSelectProps> = ({
  value = "ComicSansMS",
  onChange = () => {},
  options = DEFAULT_FONT_OPTIONS,
  disabled = false,
}) => {
  const items = options.map((i) => ({
    value: i.value,
    label: i.label,
  }));

  const [font, setFont] = useState(value);
  const onSelectChange = (value: string) => {
    setFont(value);
    onChange(value);
  }
  return (
    <Select
      value={font}
      onChange={onSelectChange}
      disabled={disabled}
      options={items}
      variant="filled"
      size='small'
      style={{ width: '100%' }}
      suffixIcon={null}
      optionRender={(option) => (
        <span
            style={{
                fontFamily: String(option.value),
                fontSize: 12
            }}>
            {String(option.label)}
        </span>
      )}
      labelRender={(label) => (
        <span
            style={{
                fontFamily: String(label.value),
                fontSize: 14
            }}>
                {label.value}
        </span>
      )}
    />
  );
};

export default FontSelect;

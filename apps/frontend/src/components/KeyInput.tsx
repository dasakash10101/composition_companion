import { ChangeEvent } from 'react';

interface KeyInputProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}

const QUICK_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * The single text input that drives the whole chart. Whatever tonic is
 * typed here is fed through as the "variable" substituted into every
 * roman-numeral cell of the table below.
 */
export function KeyInput({ value, onChange, error }: KeyInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="key-input">
      <label htmlFor="key-input-field">
        Key / tonic
        <input
          id="key-input-field"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="e.g. C, F#, Bb"
          maxLength={3}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
        />
      </label>
      <div className="key-input__quick">
        {QUICK_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={k === value ? 'active' : ''}
            onClick={() => onChange(k)}
          >
            {k}
          </button>
        ))}
      </div>
      {error && <p className="key-input__error">{error}</p>}
    </div>
  );
}

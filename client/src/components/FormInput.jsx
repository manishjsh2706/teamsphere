const FormInput = ({
  label,
  type,
  name,
  value,
  onChange,
  onBlur,      // ← ADD THIS
  placeholder,
  error,
  required,
  minLength,
  disabled,
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        marginBottom: '6px',
        fontWeight: '500',
        fontSize: '14px',
        color: 'var(--text-primary)',
      }}>
        {label}
        {required && (
          <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>
        )}
      </label>

      <input
        type={type || 'text'}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}      // ← ADD THIS
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: error
            ? '1.5px solid #ef4444'
            : '1px solid var(--border-color)',
          borderRadius: '8px',
          fontSize: '14px',
          boxSizing: 'border-box',
          background: disabled
            ? 'var(--bg-tertiary)'
            : error
            ? '#fef2f2'
            : 'var(--input-bg)',
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = '#3b82f6'
          }
        }}
      />

      {error && (
        <p style={{
          margin: '4px 0 0',
          fontSize: '12px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          ⚠ {error}
        </p>
      )}
    </div>
  )
}

export default FormInput
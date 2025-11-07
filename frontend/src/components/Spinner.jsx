function Spinner({ size = 28 }) {
  const s = {
    width: size,
    height: size,
    border: '3px solid var(--border)',
    borderTopColor: 'var(--ring)',
    borderRadius: '50%',
    animation: 'bp_spin 0.8s linear infinite'
  };
  return <div style={s} />
}

export default Spinner



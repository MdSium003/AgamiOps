function Card({ title, children, actions, className, style }) {
  return (
    <section className={`card ${className || ''}`} style={style}>
      {title ? <h2>{title}</h2> : null}
      {children}
      {actions ? (
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          {actions}
        </div>
      ) : null}
    </section>
  )
}

export default Card


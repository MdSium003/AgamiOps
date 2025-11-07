export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...rest }) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}



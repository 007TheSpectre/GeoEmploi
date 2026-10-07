import React from 'react';

export const NavGroup = ({ direction = 'row', children, className = '' }) => {
  const directionStyles = direction === 'col' ? 'flex-col space-y-1' : 'flex-row items-center gap-1 sm:gap-2';
  return (
    <ul className={`flex list-none m-0 p-0 ${directionStyles} ${className}`}>
      {React.Children.map(children, (child) => child ? <li className="flex items-center">{child}</li> : null)}
    </ul>
  );
};

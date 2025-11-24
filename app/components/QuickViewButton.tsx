import {useState} from 'react';
import {QuickViewPopup} from './QuickViewPopup';

interface QuickViewButtonProps {
  product: any;
  config: any;
  className?: string;
}

export function QuickViewButton({
  product,
  config,
  className = ''
}: QuickViewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const placementClasses: Record<string, string> = {
    'top-left': 'top-2 left-2', // match to actual tailwind CSS classes
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  if (!config.enabled) {
    return null;
  }

  const buttonStyle = {
    backgroundColor: config.colors?.buttonColor || '#000000',
    color: config.colors?.textColor || '#ffffff',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 [QuickViewButton] Opening popup with config:', config);
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        style={buttonStyle}
        className={`
          absolute ${placementClasses[config.buttonPlacement]} 
          px-4 py-2 rounded-md 
          opacity-100 transition-all duration-300
          hover:opacity-90 text-sm font-medium ${className}
          z-5
        `}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = config.colors?.buttonHoverColor || '#333333';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = config.colors?.buttonColor || '#000000';
        }}
      >
        {config.buttonText}
      </button>

      {isOpen && (
        <QuickViewPopup
          product={product}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          config={config}  
        />
      )}
    </>
  );
}
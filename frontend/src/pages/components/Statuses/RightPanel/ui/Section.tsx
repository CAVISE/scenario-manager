import React, { useState } from 'react';

interface SectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ label, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rp-section">
      <div 
        className="rp-section-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="rp-section-label">{label}</span>
        <span className={`rp-section-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      {isOpen && (
        <div className="rp-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default Section;